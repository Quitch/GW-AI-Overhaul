define(["shared/gw_common"], function (GW) {
  // A viewer writes no save: stock keeps its local copy of the war, and
  // cards_coop_reroll.js's result handler saves that with
  // GW.manifest.saveGame. It still clears the Saving indicator, and resolves
  // as a host's save does.
  return function (gameState, saveStars) {
    if (model.isCampaignViewer()) {
      model.driveAccessInProgress(false);
      return $.Deferred().resolve().promise();
    }

    var starsSaved = !saveStars;

    model.game().saved(starsSaved);
    model.driveAccessInProgress(true);

    return GW.manifest.saveGame(gameState).then(function () {
      model.driveAccessInProgress(false);
    });
  };
});
