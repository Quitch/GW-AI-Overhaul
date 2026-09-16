// Co-op pending-tech reroll. A viewer asks the host (gwo_reroll_pending_tech) to
// reroll its pending offer; the host deals a smaller hand, stores it, and returns
// it (gwo_reroll_pending_tech_result) for the viewer to apply. See coop.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js",
], (dealHelpers, coopHost) => {
  // A reroll spends one more of the viewer's offered cards.
  const computeRerollDeal = (cardsOffered, currentCardCount) => {
    const rerollsUsed = Math.max(0, cardsOffered - currentCardCount);
    const nextRerollsUsed = rerollsUsed + 1;
    return {
      rerollsUsed,
      nextRerollsUsed,
      cardCount: cardsOffered - nextRerollsUsed,
      // Not rerollsRemain: the last reroll still deals one card, and only
      // the offer after it is withheld.
      exhausted: nextRerollsUsed > cardsOffered - 1,
    };
  };

  // The reject reason, or undefined when the request is valid.
  const pendingTechRerollValidationError = (
    payload,
    pendingTechCards,
    containsLoadout,
  ) => {
    if (
      !_.isNumber(pendingTechCards.star) ||
      !Array.isArray(pendingTechCards.cards)
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
  const pendingTechRerollRng = (params) => {
    const gwoStreams = params.gwoStreams;
    const pendingTechCards = params.pendingTechCards || {};
    return gwoStreams.coopRerollRng(
      params.warRng,
      gwoStreams.coopPlayerKey(params.record, params.client),
      pendingTechCards.dealIndex,
      params.rerollsUsed,
    );
  };

  const factory = (params) => {
    const game = params.game;
    const galaxy = params.galaxy;
    const chooseCards = params.chooseCards;
    const helpers = params.helpers;
    const GWInventory = params.GWInventory;
    const numCardsToOffer = params.numCardsToOffer;
    const gwoSave = params.gwoSave;
    const GW = params.GW;
    const gwoStreams = params.gwoStreams;
    const warRng = params.warRng;
    const gwoBank = params.gwoBank;
    const stockBank = params.stockBank;

    const rerollPendingTechRequest = "gwo_reroll_pending_tech";
    const rerollPendingTechResult = "gwo_reroll_pending_tech_result";

    const applyPendingTechRerollResult = (operator) => {
      const payload = (operator && operator.payload) || {};
      model.gwoRerollPending(false);

      if (payload.error) {
        console.error(`[GW COOP] pending tech reroll failed: ${payload.error}`);
        model.scanning(false);
        return;
      }

      const pendingTechCards = payload.pendingTechCards;
      if (
        !pendingTechCards ||
        !_.isNumber(pendingTechCards.star) ||
        !Array.isArray(pendingTechCards.cards)
      ) {
        console.error("[GW COOP] invalid pending tech reroll result");
        model.scanning(false);
        return;
      }

      const record = game.findCoopPlayerInventoryData({
        id: payload.client_id,
        name: payload.client_name,
      });
      if (!record || !record.inventory) {
        console.error(
          "[GW COOP] missing inventory for pending tech reroll result",
        );
        model.scanning(false);
        return;
      }

      const stored = coopHost.upsertRecord(game, record, {
        pendingTechCards,
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
      _.delay(() => {
        model.scanning(false);
      }, 2000);

      // Returned so the base campaign queue can order it. The record upsert
      // above is the canonical mutation, so early exits may stay undefined.
      return $.when(
        model.prepareCoopPlayerInventories(),
        GW.manifest.saveGame(game).then(null, (err) => {
          console.error("[GW COOP] failed to save rerolled tech", err);
          return $.Deferred().reject(err).promise();
        }),
      );
    };

    const rerollPendingTechForCoopPlayer = (operator) => {
      const result = $.Deferred();

      // Rejects as well as notifying the viewer, so the campaign queue can
      // order this handler's async work.
      const failReroll = (reason) => {
        coopHost.fail(
          rerollPendingTechResult,
          operator,
          "reroll pending tech",
          reason,
        );
        result.reject(reason);
      };

      const resolveResult = () => {
        result.resolve();
      };

      const rejectResult = (error) => {
        result.reject(error);
      };

      if (!model.isCampaignHost() || !model.gwCampaignPerPlayerTechCards()) {
        result.reject("not campaign host or per-player tech disabled");
        return result.promise();
      }

      const payload = (operator && operator.payload) || {};
      const record = coopHost.recordFor(game, operator);

      if (!record || !record.inventory || !record.pendingTechCards) {
        failReroll("missing pending tech cards");
        return result.promise();
      }

      const pendingTechCards = record.pendingTechCards;
      const validationError = pendingTechRerollValidationError(
        payload,
        pendingTechCards,
        helpers.pendingCardsContainLoadout(pendingTechCards),
      );
      if (validationError) {
        failReroll(validationError);
        return result.promise();
      }

      const star = galaxy.stars()[pendingTechCards.star];
      if (!star) {
        failReroll("missing pending tech star");
        return result.promise();
      }

      const dealCards = (playerInventory) => {
        const cardsOffered = helpers.cardsOfferedCount(
          numCardsToOffer,
          playerInventory,
        );
        const rerollState = computeRerollDeal(
          cardsOffered,
          pendingTechCards.cards.length,
        );

        if (rerollState.exhausted) {
          failReroll("no pending tech rerolls remain");
          return;
        }

        const nextRerollsUsed = rerollState.nextRerollsUsed;
        chooseCards({
          inventory: playerInventory,
          count: rerollState.cardCount,
          star,
          systemCards: [],
          rng: pendingTechRerollRng({
            gwoStreams,
            warRng,
            record,
            client: { id: operator.client_id, name: operator.client_name },
            pendingTechCards,
            rerollsUsed: nextRerollsUsed,
          }),
        }).then((cards) => {
          const updatedAt = _.now();
          const nextPendingTechCards = {
            star: pendingTechCards.star,
            cards: cards || [],
            dealIndex: pendingTechCards.dealIndex,
            cardsOffered,
            rerollsUsed: nextRerollsUsed,
            updatedAt,
          };
          const stored = coopHost.upsertRecord(game, record, {
            pendingTechCards: nextPendingTechCards,
            updatedAt,
          });
          if (!stored) {
            failReroll("failed to store rerolled pending tech");
            return;
          }

          model.sendCampaignSnapshot("gwo_reroll_pending_tech", true);
          coopHost.reply(rerollPendingTechResult, operator, {
            pendingTechCards: nextPendingTechCards,
            rerolls_used: nextRerollsUsed,
            offer_rerolls: dealHelpers.rerollsRemain(
              nextRerollsUsed,
              cardsOffered,
            ),
            updated_at: updatedAt,
          });
          gwoSave(game, false).then(resolveResult, rejectResult);
        });
      };

      gwoBank.applyRecordInventory(GWInventory, record, stockBank, dealCards);

      return result.promise();
    };

    model.registerCampaignViewerOperatorHandler(
      rerollPendingTechRequest,
      rerollPendingTechForCoopPlayer,
    );

    model.registerCampaignHostOperatorHandler(
      rerollPendingTechResult,
      applyPendingTechRerollResult,
    );
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      computeRerollDeal,
      pendingTechRerollValidationError,
      pendingTechRerollRng,
    };
  }

  return factory;
});
