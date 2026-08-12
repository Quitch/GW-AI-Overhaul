// Co-op star card-name synchronisation. The host names each AI star after the
// tech card it holds (star.ai().cardName) and mirrors that to viewers over the
// gwo_sync_star_card_name operator.
define(() => {
  const setAiCardName = (star, cardName) => {
    if (!star || !_.isFunction(star.ai)) {
      return false;
    }

    const ai = star.ai();
    if (!ai) {
      return false;
    }

    ai.cardName = cardName;
    return true;
  };

  // model.galaxy (the live board) and game's own galaxy are separate object
  // graphs, so both need writing.
  const applyCardNameToStarIndex = (game, starIndex, cardName) => {
    let applied = false;

    const systems =
      model.galaxy && _.isFunction(model.galaxy.systems)
        ? model.galaxy.systems()
        : undefined;
    const system = Array.isArray(systems) ? systems[starIndex] : undefined;
    if (system && system.star) {
      applied = setAiCardName(system.star, cardName) || applied;
    }

    const gameGalaxy =
      game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
    const stars =
      gameGalaxy && _.isFunction(gameGalaxy.stars)
        ? gameGalaxy.stars()
        : undefined;
    const gameStar = Array.isArray(stars) ? stars[starIndex] : undefined;
    applied = setAiCardName(gameStar, cardName) || applied;

    return applied;
  };

  const isValidSyncedStarCardNamePayload = (payload) =>
    _.isNumber(payload.star) &&
    !_.isNaN(payload.star) &&
    _.isString(payload.card_id) &&
    !!payload.card_id.length;

  const factory = (params) => {
    const game = params.game;
    const setCardNameSyncOperator = "gwo_sync_star_card_name";

    const sendSyncedStarCardName = (starIndex, cardId) => {
      if (
        !_.isNumber(starIndex) ||
        _.isNaN(starIndex) ||
        !_.isString(cardId) ||
        !cardId.length ||
        !model.sendCampaignHostOperator ||
        !_.isFunction(model.isCampaignHost) ||
        !_.isFunction(model.gwCampaignConnected)
      ) {
        return;
      }

      model.sendCampaignHostOperator(setCardNameSyncOperator, {
        star: starIndex,
        card_id: cardId,
      });
    };

    const applySyncedStarCardName = (operator) => {
      const result = $.Deferred();
      const payload = operator && operator.payload ? operator.payload : {};
      if (!isValidSyncedStarCardNamePayload(payload)) {
        console.error("[GW COOP] invalid synced star card name payload");
        result.reject("Invalid synced star card name payload");
        return result.promise();
      }

      requireGW([`cards/${payload.card_id}`], (data) => {
        if (!data || !_.isFunction(data.summarize)) {
          console.error(
            `[GW COOP] card summarize unavailable for synced card name id=${payload.card_id}`,
          );
          result.reject(`Card summarize unavailable for ${payload.card_id}`);
          return;
        }

        const cardName = loc(data.summarize());
        if (!applyCardNameToStarIndex(game, payload.star, cardName)) {
          console.warn(
            `[GW COOP] unable to apply synced star card name for star=${payload.star}`,
          );
          result.reject(`Unable to apply card name to star ${payload.star}`);
          return;
        }

        result.resolve();
      });

      return result.promise();
    };

    const setCardName = (system, card, starIndex) => {
      const deferred = $.Deferred();
      const firstCard = card && card[0];
      if (!firstCard || !firstCard.id) {
        deferred.resolve();
        return deferred.promise();
      }

      requireGW([`cards/${firstCard.id}`], (data) => {
        if (data && _.isFunction(data.summarize)) {
          system.star.ai().cardName = loc(data.summarize());
          sendSyncedStarCardName(starIndex, firstCard.id);
        }
        deferred.resolve();
      });

      return deferred.promise();
    };

    if (model.registerCampaignHostOperatorHandler) {
      model.registerCampaignHostOperatorHandler(
        setCardNameSyncOperator,
        applySyncedStarCardName,
      );
    }

    return {
      setCardName,
    };
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      setAiCardName,
      applyCardNameToStarIndex,
      isValidSyncedStarCardNamePayload,
    };
  }

  return factory;
});
