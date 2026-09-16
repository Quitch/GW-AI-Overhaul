define(["shared/gw_common"], (GW) =>
  // A viewer has no war file, so it saves nothing. The direct
  // GW.manifest.saveGame calls in cards_coop_reroll.js and gw_start/setup.js
  // are host-only paths.
  (gameState, saveStars) => {
    if (model.isCampaignViewer()) {
      model.driveAccessInProgress(false);
      return;
    }

    const starsSaved = !saveStars;

    model.game().saved(starsSaved);
    model.driveAccessInProgress(true);

    return GW.manifest.saveGame(gameState).then(() => {
      model.driveAccessInProgress(false);
    });
  });
