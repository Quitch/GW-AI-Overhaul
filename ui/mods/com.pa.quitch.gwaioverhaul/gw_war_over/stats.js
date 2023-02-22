var gwoWarOverLoadoutStatsLoaded;

if (!gwoWarOverLoadoutStatsLoaded) {
  gwoWarOverLoadoutStatsLoaded = true;

  // Track the highest difficulty defeated for loadout icons
  function gwoWarOverLoadoutStats() {
    try {
      var game = model.game();
      var galaxy = game.galaxy();
      var gwoSettings = galaxy.stars()[galaxy.origin()].system().gwaio;

      if (
        gwoSettings &&
        gwoSettings.cheatsUsed !== true &&
        game.gameState() === "won"
      ) {
        var difficultyLevelAsInt =
          _.findIndex(
            [
              "!LOC:Beginner",
              "!LOC:Casual",
              "!LOC:Iron",
              "!LOC:Bronze",
              "!LOC:Silver",
              "!LOC:Gold",
              "!LOC:Platinum",
              "!LOC:Diamond",
              "!LOC:Uber",
            ],
            function (difficulty) {
              var warDifficulty = gwoSettings.difficulty;
              return difficulty === warDifficulty;
            }
          ) - 1; // -1 because we added Beginner later
        var loadout = game.inventory().cards()[0].id;
        var highestDifficultyDefeatedWithLoadout = ko
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
}
