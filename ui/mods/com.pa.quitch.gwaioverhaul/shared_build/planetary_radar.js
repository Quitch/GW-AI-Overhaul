var gwoPlanetaryRadarLoaded;

function gwoPlanetaryRadar() {
  if (gwoPlanetaryRadarLoaded) {
    return;
  }

  gwoPlanetaryRadarLoaded = true;

  try {
    _.assign(Build.HotkeyModel.SpecIdToGridMap, {
      "/pa/units/orbital/deep_space_radar/deep_space_radar.json": [
        "utility",
        6,
        { row: 1, column: 0 },
      ],
    });
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoPlanetaryRadar();
