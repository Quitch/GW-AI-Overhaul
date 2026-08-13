var gwoRecordHighestDifficultyDefeatedLoaded;

function gwoRecordHighestDifficultyDefeated() {
  if (gwoRecordHighestDifficultyDefeatedLoaded) {
    return;
  }

  gwoRecordHighestDifficultyDefeatedLoaded = true;

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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
      ],
      function (gwoDifficulty, gwoCard) {
        // A Conquest win records to its own key and never touches the
        // Galactic War badge - see victoryKey in shared/cards.js.
        var defeatedDifficulties = ko.observable().extend({
          local: gwoCard.victoryKey(loadoutId, !!gwoSettings.conquest),
        });
        var previousBest = getPreviousBest(defeatedDifficulties());
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

        // Custom carries no difficulty rating, so it ranks against nothing -
        // recording it yields an index of -2, which no badge matches.
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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoRecordHighestDifficultyDefeated();
