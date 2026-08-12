define(["shared/gw_common"], (GW) => (gameState, saveStars) => {
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
