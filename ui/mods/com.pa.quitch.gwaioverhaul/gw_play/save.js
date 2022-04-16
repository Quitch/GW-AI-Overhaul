define(["shared/gw_common"], function (GW) {
  return function (gameState, saveStars) {
    var starsSaved = saveStars ? false : true;

    model.game().saved(starsSaved);
    model.driveAccessInProgress(true);

    return GW.manifest.saveGame(gameState).then(function () {
      model.driveAccessInProgress(false);
    });
  };
});
