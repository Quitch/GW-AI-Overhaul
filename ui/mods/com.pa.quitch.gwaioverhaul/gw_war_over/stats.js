(function () {
  try {
    var game = model.game();
    var galaxy = game.galaxy();
    var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;
    var noBadge =
      gwoSettings && (gwoSettings.cheatsUsed || gwoSettings.tooManyPlayers);

    if (!gwoSettings || noBadge || game.gameState() !== "won") {
      return;
    }

    var getPreviousBest = function (defeatedDifficulties) {
      return _.isArray(defeatedDifficulties)
        ? defeatedDifficulties[0]
        : defeatedDifficulties;
    };

    // A co-op viewer's badge follows its own loadout: game.inventory() is the
    // host's. The record is found the way gw_play finds it, by the session's
    // identity. With shared tech there may be no record, and the loadouts match.
    var ownLoadoutId = function () {
      var session = function (name) {
        return ko.observable().extend({ session: name })();
      };
      var viewer =
        session("gw_campaign_enabled") &&
        session("gw_campaign_role") === "viewer";
      var record =
        viewer &&
        _.isFunction(game.findCoopPlayerInventoryData) &&
        game.findCoopPlayerInventoryData({
          id: session("uberId"),
          name: session("displayName"),
        });
      var cards = _.get(record, "inventory.cards");
      return cards && cards[0] ? cards[0].id : game.inventory().cards()[0].id;
    };

    var loadoutId = ownLoadoutId();
    var defeatedDifficulties = ko
      .observable()
      .extend({ local: "gwaio_victory_" + loadoutId });
    var previousBest = getPreviousBest(defeatedDifficulties());

    var isNewHighScore = function (currentDifficulty, previousBest) {
      return (
        currentDifficulty > previousBest ||
        (currentDifficulty === previousBest && game.hardcore()) ||
        _.isUndefined(previousBest)
      );
    };

    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/difficulty_levels.js"],
      function (gwoDifficulty) {
        // Read from the difficulty data, not restated: renaming or inserting a
        // tier would otherwise shift everybody's badge history.
        var tierIndex = _.findIndex(
          gwoDifficulty.difficulties,
          function (tier) {
            return (
              !tier.customDifficulty &&
              tier.difficultyName === gwoSettings.difficulty
            );
          }
        );

        // Custom carries no difficulty rating, so it ranks against nothing and
        // records no badge.
        if (tierIndex === -1) {
          return;
        }

        // Badge indices run from -1 (Beginner) so that Casual is 0 - see the
        // loadoutIcon switch in shared/cards.js.
        var currentDifficultyIndex = tierIndex - 1;

        defeatedDifficulties(
          isNewHighScore(currentDifficultyIndex, previousBest)
            ? [currentDifficultyIndex, game.hardcore()]
            : defeatedDifficulties()
        );
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
