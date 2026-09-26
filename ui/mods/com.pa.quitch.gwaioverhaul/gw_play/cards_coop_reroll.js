// Co-op pending-tech reroll. A viewer asks the host (gwo_reroll_pending_tech) to
// reroll its pending offer; the host deals a smaller hand, stores it, and returns
// it (gwo_reroll_pending_tech_result) for the viewer to apply. See coop.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js",
], function (dealHelpers, coopHost) {
  // A reroll spends one more of the viewer's offered cards.
  var computeRerollDeal = function (cardsOffered, currentCardCount) {
    var rerollsUsed = Math.max(0, cardsOffered - currentCardCount);
    var nextRerollsUsed = rerollsUsed + 1;
    return {
      rerollsUsed: rerollsUsed,
      nextRerollsUsed: nextRerollsUsed,
      cardCount: cardsOffered - nextRerollsUsed,
      // Not rerollsRemain: the last reroll still deals one card, and only
      // the offer after it is withheld.
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

  // A reroll is a child of the deal it replaces, so the viewer can reroll the
  // same offer repeatedly and get a different hand each time.
  var pendingTechRerollRng = function (params) {
    var gwoStreams = params.gwoStreams;
    var pendingTechCards = params.pendingTechCards || {};
    return gwoStreams.coopRerollRng(
      params.warRng,
      gwoStreams.coopPlayerKey(params.record, params.client),
      pendingTechCards.dealIndex,
      params.rerollsUsed
    );
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
    var gwoStreams = params.gwoStreams;
    var warRng = params.warRng;
    var gwoBank = params.gwoBank;
    var stockBank = params.stockBank;

    var rerollPendingTechRequest = "gwo_reroll_pending_tech";
    var rerollPendingTechResult = "gwo_reroll_pending_tech_result";

    // A player's rerolled hand, weighed on their own applied inventory: one card
    // fewer, from the stream of the deal it replaces. Resolves { pendingTechCards,
    // rerollsUsed, cardsOffered }, or rejects when no reroll remains.
    var rerolledHandFor = function (params) {
      var result = $.Deferred();
      var pendingTechCards = params.pendingTechCards;
      var cardsOffered = helpers.cardsOfferedCount(
        numCardsToOffer,
        params.inventory
      );
      var rerollState = computeRerollDeal(
        cardsOffered,
        pendingTechCards.cards.length
      );

      if (rerollState.exhausted) {
        result.reject("no pending tech rerolls remain");
        return result.promise();
      }

      var nextRerollsUsed = rerollState.nextRerollsUsed;
      chooseCards({
        inventory: params.inventory,
        count: rerollState.cardCount,
        star: params.star,
        systemCards: [],
        rng: pendingTechRerollRng({
          gwoStreams: gwoStreams,
          warRng: warRng,
          record: params.record,
          client: params.client,
          pendingTechCards: pendingTechCards,
          rerollsUsed: nextRerollsUsed,
        }),
      }).then(function (cards) {
        result.resolve({
          pendingTechCards: {
            star: pendingTechCards.star,
            cards: cards || [],
            dealIndex: pendingTechCards.dealIndex,
            cardsOffered: cardsOffered,
            rerollsUsed: nextRerollsUsed,
            updatedAt: _.now(),
          },
          rerollsUsed: nextRerollsUsed,
          cardsOffered: cardsOffered,
        });
      });

      return result.promise();
    };

    var applyPendingTechRerollResult = function (operator) {
      var payload = (operator && operator.payload) || {};
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

      var record = coopHost.recordFor(game, payload);
      if (!record || !record.inventory) {
        console.error(
          "[GW COOP] missing inventory for pending tech reroll result"
        );
        model.scanning(false);
        return;
      }

      var stored = coopHost.upsertRecord(game, record, {
        pendingTechCards: pendingTechCards,
        updatedAt: payload.updated_at || _.now(),
      });
      if (!stored) {
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
          console.error(
            "[GW COOP] failed to save rerolled tech: " +
              ((err && err.stack) || err)
          );
          return $.Deferred().reject(err).promise();
        })
      );
    };

    var rerollPendingTechForCoopPlayer = function (operator) {
      var result = $.Deferred();

      // Rejects as well as notifying the viewer, so the campaign queue can
      // order this handler's async work.
      var failReroll = function (reason) {
        coopHost.fail(
          rerollPendingTechResult,
          operator,
          "reroll pending tech",
          reason
        );
        result.reject(reason);
      };

      var resolveResult = function () {
        result.resolve();
      };

      var rejectResult = function (error) {
        result.reject(error);
      };

      if (!model.isCampaignHost() || !model.gwCampaignPerPlayerTechCards()) {
        result.reject("not campaign host or per-player tech disabled");
        return result.promise();
      }

      var payload = (operator && operator.payload) || {};
      var record = coopHost.recordFor(game, operator);

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

      var dealCards = function (playerInventory) {
        rerolledHandFor({
          record: record,
          client: { id: operator.client_id, name: operator.client_name },
          pendingTechCards: pendingTechCards,
          inventory: playerInventory,
          star: star,
        }).then(function (rerolled) {
          var nextPendingTechCards = rerolled.pendingTechCards;
          var updatedAt = nextPendingTechCards.updatedAt;
          var stored = coopHost.upsertRecord(game, record, {
            pendingTechCards: nextPendingTechCards,
            updatedAt: updatedAt,
          });
          if (!stored) {
            failReroll("failed to store rerolled pending tech");
            return;
          }

          model.sendCampaignSnapshot("gwo_reroll_pending_tech", true);
          coopHost.reply(rerollPendingTechResult, operator, {
            pendingTechCards: nextPendingTechCards,
            rerolls_used: rerolled.rerollsUsed,
            offer_rerolls: dealHelpers.rerollsRemain(
              rerolled.rerollsUsed,
              rerolled.cardsOffered
            ),
            updated_at: updatedAt,
          });
          gwoSave(game, false).then(resolveResult, rejectResult);
        }, failReroll);
      };

      gwoBank.applyRecordInventory(GWInventory, record, stockBank, dealCards);

      return result.promise();
    };

    model.registerCampaignViewerOperatorHandler(
      rerollPendingTechRequest,
      rerollPendingTechForCoopPlayer
    );

    model.registerCampaignHostOperatorHandler(
      rerollPendingTechResult,
      applyPendingTechRerollResult
    );

    // The same reroll for a player the host deals itself - a co-op AI player -
    // storing, sending and saving nothing. params: record, client,
    // pendingTechCards (the hand held in memory), star.
    return {
      rerollHandForRecord: function (params) {
        var result = $.Deferred();
        gwoBank.applyRecordInventory(
          GWInventory,
          params.record,
          stockBank,
          function (inventory) {
            rerolledHandFor(
              _.assign({}, params, { inventory: inventory })
            ).then(result.resolve, result.reject);
          }
        );
        return result.promise();
      },
    };
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      computeRerollDeal: computeRerollDeal,
      pendingTechRerollValidationError: pendingTechRerollValidationError,
      pendingTechRerollRng: pendingTechRerollRng,
    };
  }

  return factory;
});
