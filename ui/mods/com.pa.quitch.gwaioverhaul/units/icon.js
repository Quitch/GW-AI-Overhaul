var gwaioStrategicIconsLoaded;

if (!gwaioStrategicIconsLoaded) {
  gwaioStrategicIconsLoaded = true;

  function gwaioStrategicIcons() {
    try {
      model.strategicIcons.push("bot_aa");
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioStrategicIcons();
}
