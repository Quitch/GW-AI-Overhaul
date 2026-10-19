(function () {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    // Stock reads saveGame off GW.manifest at every call, so replacing the
    // property reaches all of stock's saves. See architecture.md, "Saving the
    // war".
    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save_limit.js"],
      function (saveLimit) {
        saveLimit.install();
      },
      function (err) {
        console.error(
          "Galactic War Overhaul (GWO): save time limit not loaded: " +
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
