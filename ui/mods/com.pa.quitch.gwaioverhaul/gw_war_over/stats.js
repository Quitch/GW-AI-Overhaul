var gwoWarOverLoadoutStatsLoaded;

// Track the highest difficulty defeated for loadout icons
function gwoWarOverLoadoutStats() {
  if (gwoWarOverLoadoutStatsLoaded) {
    return;
  }

  gwoWarOverLoadoutStatsLoaded = true;

  try {
    const game = model.game();
    const galaxy = game.galaxy();
    const gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

    if (!gwoSettings || gwoSettings.cheatsUsed || game.gameState() !== "won") {
      return;
    }

    const getPreviousBest = function (defeatedDifficulties) {
      return _.isArray(defeatedDifficulties)
        ? defeatedDifficulties[0]
        : defeatedDifficulties;
    };

    const loadoutId = game.inventory().cards()[0].id;
    const defeatedDifficulties = ko
      .observable()
      .extend({ local: "gwaio_victory_" + loadoutId });
    const previousBest = getPreviousBest(defeatedDifficulties());

    const isNewHighScore = function (currentDifficulty, previousBest) {
      return (
        currentDifficulty > previousBest ||
        (currentDifficulty === previousBest && game.hardcore()) ||
        _.isUndefined(previousBest)
      );
    };

    const difficultyLevels = [
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
    const currentDifficultyIndex =
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
