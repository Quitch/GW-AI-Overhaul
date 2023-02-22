var gwoCheatDetectionLoaded;

if (!gwoCheatDetectionLoaded) {
  gwoCheatDetectionLoaded = true;

  function gwoCheatDetection() {
    try {
      var cheatsDetected = function () {
        requireGW(
          ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
          function (gwoSave) {
            var game = model.game();
            var galaxy = game.galaxy();
            var originSystem = galaxy.stars()[galaxy.origin()].system();
            var gwoSettings = originSystem.gwaio;
            if (gwoSettings && !gwoSettings.cheatsUsed) {
              model.gwoOptions.push(loc("!LOC:Cheats used"));
              gwoSettings.cheatsUsed = true;
              gwoSave(game, true);
            }
          }
        );
      };

      var cheatDetection = function () {
        if (model.devMode() === true) {
          cheatsDetected();
        }
      };

      ko.computed(function () {
        cheatDetection();
      });
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoCheatDetection();
}
