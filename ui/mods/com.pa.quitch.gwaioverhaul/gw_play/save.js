define(["shared/gw_common"], function (GW) {
  return function (gameState, saveStars) {
    if (model.isCampaignViewer()) {
      model.driveAccessInProgress(false);
      return;
    }

    var starsSaved = !saveStars;

    model.game().saved(starsSaved);
    model.driveAccessInProgress(true);

    return GW.manifest.saveGame(gameState).then(function () {
      model.driveAccessInProgress(false);
    });
  };
});
