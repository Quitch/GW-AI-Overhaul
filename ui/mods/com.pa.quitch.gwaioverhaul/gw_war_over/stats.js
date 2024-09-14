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

    if (gwoSettings && !gwoSettings.cheatsUsed && game.gameState() === "won") {
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
      const difficultyLevelAsInt =
        _.findIndex(difficultyLevels, function (difficulty) {
          const warDifficulty = gwoSettings.difficulty;
          return difficulty === warDifficulty;
        }) - 1; // -1 because we added Beginner later
      const loadout = game.inventory().cards()[0].id;
      const highestDifficultyDefeatedWithLoadout = ko
        .observable()
        .extend({ local: "gwaio_victory_" + loadout });
      var previousBest = -1;

      // Value wasn't an array in v5.34.0 and earlier
      if (_.isArray(highestDifficultyDefeatedWithLoadout())) {
        previousBest = highestDifficultyDefeatedWithLoadout()[0];
      } else {
        previousBest = highestDifficultyDefeatedWithLoadout();
      }

      if (
        difficultyLevelAsInt > previousBest ||
        (difficultyLevelAsInt === previousBest && game.hardcore()) ||
        _.isUndefined(previousBest)
      ) {
        highestDifficultyDefeatedWithLoadout([
          difficultyLevelAsInt,
          game.hardcore(),
        ]);
      }
    }
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoWarOverLoadoutStats();
