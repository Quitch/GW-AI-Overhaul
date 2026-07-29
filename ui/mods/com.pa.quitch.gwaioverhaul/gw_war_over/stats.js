var gwoWarOverLoadoutStatsLoaded;

// Track the highest difficulty defeated for loadout icons
function gwoWarOverLoadoutStats() {
  if (gwoWarOverLoadoutStatsLoaded) {
    return;
  }

  gwoWarOverLoadoutStatsLoaded = true;

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

    var loadoutId = game.inventory().cards()[0].id;
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
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
      ],
      function (gwoDifficulty) {
        // Read the tiers from the difficulty data rather than restating them, so
        // renaming or inserting one cannot silently shift everybody's badge history.
        var tierIndex = _.findIndex(
          gwoDifficulty.difficulties,
          function (tier) {
            return (
              !tier.customDifficulty &&
              tier.difficultyName === gwoSettings.difficulty
            );
          }
        );

        // Custom carries no difficulty rating, so there is nothing to rank it
        // against - recording it produced an index of -2, which no badge matches.
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
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoWarOverLoadoutStats();
