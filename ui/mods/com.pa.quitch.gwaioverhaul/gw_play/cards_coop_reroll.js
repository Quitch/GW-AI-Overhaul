// Co-op pending-tech reroll. A viewer asks the host (gwo_reroll_pending_tech) to
// reroll its pending offer; the host deals a smaller hand, stores it, and returns
// it (gwo_reroll_pending_tech_result) for the viewer to apply. See coop.md.
define(() => {
  // A reroll spends one more of the viewer's offered cards.
  const computeRerollDeal = (cardsOffered, currentCardCount) => {
    const rerollsUsed = Math.max(0, cardsOffered - currentCardCount);
    const nextRerollsUsed = rerollsUsed + 1;
    return {
      rerollsUsed,
      nextRerollsUsed,
      cardCount: cardsOffered - nextRerollsUsed,
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

    const sendPendingTechRerollResult = (clientId, requestId, payload) => {
      if (!model.sendCampaignHostOperator) {
        return;
      }

      model.sendCampaignHostOperator(rerollPendingTechResult, payload, {
        target_client_id: clientId,
        request_id: requestId,
      });
    };

    const failPendingTechReroll = (operator, reason) => {
      console.error(`[GW COOP] failed to reroll pending tech: ${reason}`);
      if (_.isUndefined(operator.client_id)) {
        return;
      }

      sendPendingTechRerollResult(operator.client_id, operator.request_id, {
        client_id: operator.client_id,
        client_name: operator.client_name,
        error: reason,
      });
    };

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

      const nextRecord = Object.assign({}, _.cloneDeep(record), {
        pendingTechCards,
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
        failPendingTechReroll(operator, reason);
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
      const record = game.findCoopPlayerInventoryData({
        id: operator.client_id,
        name: operator.client_name,
      });

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

      const playerInventory = new GWInventory();
      playerInventory.load(_.cloneDeep(record.inventory));

      const dealCards = () => {
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
          const nextRecord = Object.assign({}, _.cloneDeep(record), {
            pendingTechCards: nextPendingTechCards,
            updatedAt,
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
          gwoSave(game, false).then(resolveResult, rejectResult);
        });
      };

      if (playerInventory.cards().length) {
        // Their loadout card's buff() would otherwise bank into the host's own
        // unlocks, as in cards_coop_deal.js.
        gwoBank.suspendUnlocks(stockBank);
        playerInventory.applyCards(() => {
          gwoBank.resumeUnlocks();
          dealCards();
        });
      } else {
        dealCards();
      }

      return result.promise();
    };

    if (model.registerCampaignViewerOperatorHandler) {
      model.registerCampaignViewerOperatorHandler(
        rerollPendingTechRequest,
        rerollPendingTechForCoopPlayer,
      );
    }

    if (model.registerCampaignHostOperatorHandler) {
      model.registerCampaignHostOperatorHandler(
        rerollPendingTechResult,
        applyPendingTechRerollResult,
      );
    }
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
