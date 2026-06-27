var gwoCoopLoaded;

function gwoCoop() {
  const game = model.game();

  if (gwoCoopLoaded || game.isTutorial()) {
    return;
  }

  gwoCoopLoaded = true;

  try {
    model.gwCampaignPerPlayerTechCards(false);
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoCoop();
