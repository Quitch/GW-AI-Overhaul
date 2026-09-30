(function () {
  try {
    // Stock gives the Deep Space Radar the radar jammer's slot, row 0 column 2.
    _.assign(Build.HotkeyModel.SpecIdToGridMap, {
      "/pa/units/orbital/deep_space_radar/deep_space_radar.json": [
        "utility",
        6,
        { row: 1, column: 0 },
      ],
    });
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
