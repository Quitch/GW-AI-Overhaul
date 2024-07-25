define(["shared/gw_common"], function (GW) {
  return function (gameState, saveStars) {
    const starsSaved = !saveStars;

    model.game().saved(starsSaved);
    model.driveAccessInProgress(true);

    return GW.manifest.saveGame(gameState).then(function () {
      model.driveAccessInProgress(false);
    });
  };
});
