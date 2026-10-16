(function () {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    // Stock fight reads apply off the module object when it runs, so replacing
    // the property is enough. See shadowing.md.
    requireGW(
      [
        "pages/gw_play/gw_per_player_tech_referee",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech_referee.js",
      ],
      function (stockReferee, gwoReferee) {
        stockReferee.apply = gwoReferee.apply;
      },
      // Stock's apply stays in place, so viewers' armies are built without
      // GWO's specs, Sub Commanders, or launch checks.
      function (err) {
        console.error(
          "Galactic War Overhaul (GWO): per-player tech referee not loaded: " +
            err.requireModules +
            ": " +
            (err.stack || err.message || err)
        );
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
