define(["shared/gw_common"], function (GW) {
  // Does nothing on a viewer. Stock keeps a viewer's local copy of the war, and
  // cards_coop_reroll.js's result handler saves it with GW.manifest.saveGame.
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
