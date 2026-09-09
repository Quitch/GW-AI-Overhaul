define(["shared/gw_common"], function (GW) {
  // A viewer has no war file, so it saves nothing. The direct
  // GW.manifest.saveGame calls in cards_coop_reroll.js and gw_start/setup.js
  // are host-only paths.
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
