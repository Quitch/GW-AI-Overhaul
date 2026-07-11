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

    var difficultyLevels = [
      "!LOC:Beginner",
      "!LOC:Casual",
      "!LOC:Iron",
      "!LOC:Bronze",
      "!LOC:Silver",
      "!LOC:Gold",
      "!LOC:Platinum",
      "!LOC:Diamond",
      "!LOC:Uber",
    ];
    var currentDifficultyIndex =
      _.findIndex(difficultyLevels, function (difficulty) {
        return difficulty === gwoSettings.difficulty;
      }) - 1; // Adjust for added "Beginner" level

    defeatedDifficulties(
      isNewHighScore(currentDifficultyIndex, previousBest)
        ? [currentDifficultyIndex, game.hardcore()]
        : defeatedDifficulties()
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoWarOverLoadoutStats();
