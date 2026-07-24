// Co-op star card-name synchronisation, extracted out of gw_play/cards.js. The host
// names each AI star after the tech card it holds (star.ai().cardName) and mirrors that
// name to connected viewers via the gwo_sync_star_card_name operator, so a viewer's
// board shows the same star names as the host's.
//
// Shaped like cards_start_subcdr.js: define() returns a factory that takes { game },
// registers its host operator handler as a side effect, and returns the { setCardName }
// the caller wires into its AI-dealing path. The three dependency-free helpers are
// lifted to module scope and re-exported through the dead-in-production `typeof module`
// hook (see referee_ai.js) so they can be unit tested under the Node harness.
define(function () {
  var setAiCardName = function (star, cardName) {
    if (!star || !_.isFunction(star.ai)) {
      return false;
    }

    var ai = star.ai();
    if (!ai) {
      return false;
    }

    ai.cardName = cardName;
    return true;
  };

  // Applies cardName to a star both in model.galaxy (the live board) and in the game's
  // own galaxy, since the two are separate object graphs. game is passed in rather than
  // closed over so this stays testable at module scope.
  var applyCardNameToStarIndex = function (game, starIndex, cardName) {
    var applied = false;

    var systems =
      model.galaxy && _.isFunction(model.galaxy.systems)
        ? model.galaxy.systems()
        : undefined;
    var system = _.isArray(systems) ? systems[starIndex] : undefined;
    if (system && system.star) {
      applied = setAiCardName(system.star, cardName) || applied;
    }

    var gameGalaxy =
      game && _.isFunction(game.galaxy) ? game.galaxy() : undefined;
    var stars =
      gameGalaxy && _.isFunction(gameGalaxy.stars)
        ? gameGalaxy.stars()
        : undefined;
    var gameStar = _.isArray(stars) ? stars[starIndex] : undefined;
    applied = setAiCardName(gameStar, cardName) || applied;

    return applied;
  };

  var isValidSyncedStarCardNamePayload = function (payload) {
    return (
      _.isNumber(payload.star) &&
      !_.isNaN(payload.star) &&
      _.isString(payload.card_id) &&
      !!payload.card_id.length
    );
  };

  var factory = function (params) {
    var game = params.game;
    var setCardNameSyncOperator = "gwo_sync_star_card_name";

    var sendSyncedStarCardName = function (starIndex, cardId) {
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

    var applySyncedStarCardName = function (operator) {
      var result = $.Deferred();
      var payload = operator && operator.payload ? operator.payload : {};
      if (!isValidSyncedStarCardNamePayload(payload)) {
        console.error("[GW COOP] invalid synced star card name payload");
        result.reject("Invalid synced star card name payload");
        return result.promise();
      }

      requireGW(["cards/" + payload.card_id], function (data) {
        if (!data || !_.isFunction(data.summarize)) {
          console.error(
            "[GW COOP] card summarize unavailable for synced card name id=" +
              payload.card_id
          );
          result.reject("Card summarize unavailable for " + payload.card_id);
          return;
        }

        var cardName = loc(data.summarize());
        if (!applyCardNameToStarIndex(game, payload.star, cardName)) {
          console.warn(
            "[GW COOP] unable to apply synced star card name for star=" +
              payload.star
          );
          result.reject("Unable to apply card name to star " + payload.star);
          return;
        }

        result.resolve();
      });

      return result.promise();
    };

    var setCardName = function (system, card, starIndex) {
      var deferred = $.Deferred();
      var firstCard = card && card[0];
      if (!firstCard || !firstCard.id) {
        deferred.resolve();
        return deferred.promise();
      }

      requireGW(["cards/" + firstCard.id], function (data) {
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
        applySyncedStarCardName
      );
    }

    return {
      setCardName: setCardName,
    };
  };

  // Test-only hook: `module` does not exist in the game's Chromium UI runtime, so this
  // never runs in production; under Node it exposes the pure helpers to the test suite
  // (see test/cards_card_name_sync.test.js). `module` is a Node/CommonJS test-only
  // global, deliberately absent from this file's game-runtime globals, hence the
  // disables below.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      setAiCardName: setAiCardName,
      applyCardNameToStarIndex: applyCardNameToStarIndex,
      isValidSyncedStarCardNamePayload: isValidSyncedStarCardNamePayload,
    };
  }

  return factory;
});
