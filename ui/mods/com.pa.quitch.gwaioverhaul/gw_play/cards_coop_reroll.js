// Co-op pending-tech reroll. A viewer asks the host (gwo_reroll_pending_tech) to
// reroll its pending offer; the host deals a smaller hand, stores it, and returns
// it (gwo_reroll_pending_tech_result) for the viewer to apply. See coop.md.
define(function () {
  // A reroll spends one more of the viewer's offered cards.
  var computeRerollDeal = function (cardsOffered, currentCardCount) {
    var rerollsUsed = Math.max(0, cardsOffered - currentCardCount);
    var nextRerollsUsed = rerollsUsed + 1;
    return {
      rerollsUsed: rerollsUsed,
      nextRerollsUsed: nextRerollsUsed,
      cardCount: cardsOffered - nextRerollsUsed,
      exhausted: nextRerollsUsed > cardsOffered - 1,
    };
  };

  // The reject reason, or undefined when the request is valid.
  var pendingTechRerollValidationError = function (
    payload,
    pendingTechCards,
    containsLoadout
  ) {
    if (
      !_.isNumber(pendingTechCards.star) ||
      !_.isArray(pendingTechCards.cards)
    ) {
      return "invalid pending tech cards";
    }

    if (_.isNumber(payload.star) && payload.star !== pendingTechCards.star) {
      return "stale pending tech star";
    }

    if (
      _.isNumber(payload.deal_index) &&
      _.isNumber(pendingTechCards.dealIndex) &&
      payload.deal_index !== pendingTechCards.dealIndex
    ) {
      return "stale pending tech deal index";
    }

    if (containsLoadout) {
      return "loadout cards cannot be rerolled";
    }

    return undefined;
  };

  var factory = function (params) {
    var game = params.game;
    var galaxy = params.galaxy;
    var chooseCards = params.chooseCards;
    var helpers = params.helpers;
    var GWInventory = params.GWInventory;
    var numCardsToOffer = params.numCardsToOffer;
    var gwoSave = params.gwoSave;
    var GW = params.GW;

    var rerollPendingTechRequest = "gwo_reroll_pending_tech";
    var rerollPendingTechResult = "gwo_reroll_pending_tech_result";

    var sendPendingTechRerollResult = function (clientId, requestId, payload) {
      if (!model.sendCampaignHostOperator) {
        return;
      }

      model.sendCampaignHostOperator(rerollPendingTechResult, payload, {
        target_client_id: clientId,
        request_id: requestId,
      });
    };

    var failPendingTechReroll = function (operator, reason) {
      console.error("[GW COOP] failed to reroll pending tech: " + reason);
      if (_.isUndefined(operator.client_id)) {
        return;
      }

      sendPendingTechRerollResult(operator.client_id, operator.request_id, {
        client_id: operator.client_id,
        client_name: operator.client_name,
        error: reason,
      });
    };

    var applyPendingTechRerollResult = function (operator) {
      var payload = operator.payload || {};
      model.gwoRerollPending(false);

      if (payload.error) {
        console.error("[GW COOP] pending tech reroll failed: " + payload.error);
        model.scanning(false);
        return;
      }

      var pendingTechCards = payload.pendingTechCards;
      if (
        !pendingTechCards ||
        !_.isNumber(pendingTechCards.star) ||
        !_.isArray(pendingTechCards.cards)
      ) {
        console.error("[GW COOP] invalid pending tech reroll result");
        model.scanning(false);
        return;
      }

      var record = game.findCoopPlayerInventoryData({
        id: payload.client_id,
        name: payload.client_name,
      });
      if (!record || !record.inventory) {
        console.error(
          "[GW COOP] missing inventory for pending tech reroll result"
        );
        model.scanning(false);
        return;
      }

      var nextRecord = _.assign({}, _.cloneDeep(record), {
        pendingTechCards: pendingTechCards,
        updatedAt: payload.updated_at || _.now(),
      });

      if (!game.upsertCoopPlayerInventoryData(nextRecord)) {
        console.error("[GW COOP] failed to apply pending tech reroll result");
        model.scanning(false);
        return;
      }

      if (_.isNumber(payload.rerolls_used)) {
        model.gwoRerollsUsed(payload.rerolls_used);
      }
      model.gwoOfferRerolls(payload.offer_rerolls === true);

      // Cosmetic beat, matching model.explore. Deliberately not awaited.
      _.delay(function () {
        model.scanning(false);
      }, 2000);

      // Returned so the base campaign queue can order it. The record upsert
      // above is the canonical mutation, so early exits may stay undefined.
      return $.when(
        model.prepareCoopPlayerInventories(),
        GW.manifest.saveGame(game).then(null, function (err) {
          console.error("[GW COOP] failed to save rerolled tech", err);
          return $.Deferred().reject(err).promise();
        })
      );
    };

    var rerollPendingTechForCoopPlayer = function (operator) {
      var result = $.Deferred();

      // Rejects as well as notifying the viewer, so the campaign queue can
      // order this handler's async work.
      var failReroll = function (reason) {
        failPendingTechReroll(operator, reason);
        result.reject(reason);
      };

      if (!model.isCampaignHost() || !model.gwCampaignPerPlayerTechCards()) {
        result.reject("not campaign host or per-player tech disabled");
        return result.promise();
      }

      var payload = operator.payload || {};
      var record = game.findCoopPlayerInventoryData({
        id: operator.client_id,
        name: operator.client_name,
      });

      if (!record || !record.inventory || !record.pendingTechCards) {
        failReroll("missing pending tech cards");
        return result.promise();
      }

      var pendingTechCards = record.pendingTechCards;
      var validationError = pendingTechRerollValidationError(
        payload,
        pendingTechCards,
        helpers.pendingCardsContainLoadout(pendingTechCards)
      );
      if (validationError) {
        failReroll(validationError);
        return result.promise();
      }

      var star = galaxy.stars()[pendingTechCards.star];
      if (!star) {
        failReroll("missing pending tech star");
        return result.promise();
      }

      var playerInventory = new GWInventory();
      playerInventory.load(_.cloneDeep(record.inventory));

      var dealCards = function () {
        var cardsOffered = helpers.cardsOfferedCount(
          numCardsToOffer,
          playerInventory
        );
        var rerollState = computeRerollDeal(
          cardsOffered,
          pendingTechCards.cards.length
        );

        if (rerollState.exhausted) {
          failReroll("no pending tech rerolls remain");
          return;
        }

        var nextRerollsUsed = rerollState.nextRerollsUsed;
        chooseCards({
          inventory: playerInventory,
          count: rerollState.cardCount,
          star: star,
          systemCards: [],
        }).then(function (cards) {
          var updatedAt = _.now();
          var nextPendingTechCards = {
            star: pendingTechCards.star,
            cards: cards || [],
            dealIndex: pendingTechCards.dealIndex,
            cardsOffered: cardsOffered,
            rerollsUsed: nextRerollsUsed,
            updatedAt: updatedAt,
          };
          var nextRecord = _.assign({}, _.cloneDeep(record), {
            pendingTechCards: nextPendingTechCards,
            updatedAt: updatedAt,
          });

          if (!game.upsertCoopPlayerInventoryData(nextRecord)) {
            failReroll("failed to store rerolled pending tech");
            return;
          }

          model.sendCampaignSnapshot("gwo_reroll_pending_tech", true);
          sendPendingTechRerollResult(operator.client_id, operator.request_id, {
            client_id: operator.client_id,
            client_name: operator.client_name,
            pendingTechCards: nextPendingTechCards,
            rerolls_used: nextRerollsUsed,
            offer_rerolls: nextRerollsUsed < cardsOffered - 1,
            updated_at: updatedAt,
          });
          gwoSave(game, false).then(
            function () {
              result.resolve();
            },
            function (error) {
              result.reject(error);
            }
          );
        });
      };

      if (playerInventory.cards().length) {
        playerInventory.applyCards(dealCards);
      } else {
        dealCards();
      }

      return result.promise();
    };

    if (model.registerCampaignViewerOperatorHandler) {
      model.registerCampaignViewerOperatorHandler(
        rerollPendingTechRequest,
        rerollPendingTechForCoopPlayer
      );
    }

    if (model.registerCampaignHostOperatorHandler) {
      model.registerCampaignHostOperatorHandler(
        rerollPendingTechResult,
        applyPendingTechRerollResult
      );
    }
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      computeRerollDeal: computeRerollDeal,
      pendingTechRerollValidationError: pendingTechRerollValidationError,
    };
  }

  return factory;
});
