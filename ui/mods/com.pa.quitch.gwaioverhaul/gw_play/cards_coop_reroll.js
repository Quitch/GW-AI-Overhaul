// Co-op "pending tech cards" reroll, extracted out of gw_play/cards.js. A viewer asks
// the host (gwo_reroll_pending_tech) to reroll its still-pending offer; the host deals a
// smaller hand, stores it, and sends the result back (gwo_reroll_pending_tech_result),
// which the viewer applies to its own board.
//
// Shaped like cards_start_subcdr.js: define() returns a factory taking
// { game, galaxy, chooseCards, helpers, GWInventory, numCardsToOffer, gwoSave, GW } that
// registers both operator handlers. The reroll-count arithmetic and the request
// validation chain are lifted to module-scope pure functions and re-exported through the
// dead-in-production `typeof module` hook so they can be unit tested.
define(function () {
  // A reroll spends one more of the viewer's offered cards. Given how many cards were
  // offered and how many remain in the current pending hand, work out the reroll counts
  // and the size of the next (smaller) deal, and whether no rerolls remain.
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

  // Returns the reject reason for a reroll request that is malformed, stale, or targets
  // unrerollable loadout cards - or undefined when the request is valid. containsLoadout
  // is the caller's helpers.pendingCardsContainLoadout(pendingTechCards) result.
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

      // Match the host's own reroll/deal path (model.explore): keep the
      // cards hidden behind the scanning overlay for a cosmetic 2s beat
      // rather than popping them in the instant the result arrives. Not
      // awaited - it must not hold up the campaign queue below.
      _.delay(function () {
        model.scanning(false);
      }, 2000);

      // Return the remaining display-prep + save work so the base campaign
      // queue can order it. The record upsert above is the canonical (and
      // synchronous) mutation, so early exits above may stay undefined.
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

      // failPendingTechReroll still sends the error operator back to the
      // requesting viewer; also reject so the base campaign queue can order
      // this handler's async work.
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

  // Test-only hook: `module` is absent in the game's Chromium UI runtime, so this never
  // runs in production; under Node it exposes the pure helpers to the test suite (see
  // test/cards_coop_reroll.test.js). Hence the eslint disables.
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
