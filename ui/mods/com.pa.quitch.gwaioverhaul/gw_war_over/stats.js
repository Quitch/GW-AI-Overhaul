var gwaioWarOverLoadoutStatsLoaded;

if (!gwaioWarOverLoadoutStatsLoaded) {
  gwaioWarOverLoadoutStatsLoaded = true;

  // Track the highest difficulty defeated for loadout icons
  function gwaioWarOverLoadoutStats() {
    try {
      var game = model.game();

      if (game.gameState() === "won") {
        var difficultyLevelAsInt = _.findIndex(
          [
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
            var warDifficulty = game
              .galaxy()
              .stars()
              [game.galaxy().origin()].system().gwaio.difficulty;
            return difficulty === warDifficulty;
          }
        );

        var loadout = game.inventory().cards()[0].id;
        var highestDifficultyDefeatedWithLoadout = ko
          .observable()
          .extend({ local: "gwaio_victory_" + loadout });
        if (
          difficultyLevelAsInt > highestDifficultyDefeatedWithLoadout() ||
          !highestDifficultyDefeatedWithLoadout()
        ) {
          highestDifficultyDefeatedWithLoadout(difficultyLevelAsInt);
        }
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioWarOverLoadoutStats();
}
