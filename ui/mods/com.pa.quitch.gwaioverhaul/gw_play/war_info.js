var gwaioWarInfoLoaded;

if (!gwaioWarInfoLoaded) {
  gwaioWarInfoLoaded = true;

  try {
    if (!model.game().isTutorial()) {
      $("#header").append(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/war_info.html"
        )
      );
      locUpdateDocument();
    }
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
