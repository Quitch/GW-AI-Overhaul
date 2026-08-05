var gwoGalaxyMapPerfLoaded;

// Dirty-checks the base game's uncapped galaxy-map redraw. The idle heartbeat
// is load-bearing: systems.js animates off it. See architecture.md.
function gwoGalaxyMapPerf() {
  var game = model.game();

  if (gwoGalaxyMapPerfLoaded || game.isTutorial()) {
    return;
  }

  gwoGalaxyMapPerfLoaded = true;

  try {
    var stage = model.galaxy.stage;
    var parallax = model.galaxy.parallax;
    var originalUpdate = stage.update;
    var interactiveFrameIntervalMs = 1000 / 60;
    var idleFrameIntervalMs = 1000 / 10;
    var lastDraw = 0;

    // Halved; the base game takes the 20/sec default.
    stage.enableMouseOver(10);

    var lastX, lastY, lastScaleX, lastScaleY, lastWidth, lastHeight;
    var lastParallaxX, lastParallaxY;

    stage.update = function () {
      var canvas = stage.canvas;
      var currentParallax = parallax();
      var moved =
        stage.x !== lastX ||
        stage.y !== lastY ||
        stage.scaleX !== lastScaleX ||
        stage.scaleY !== lastScaleY ||
        canvas.width !== lastWidth ||
        canvas.height !== lastHeight ||
        currentParallax[0] !== lastParallaxX ||
        currentParallax[1] !== lastParallaxY;

      var now = window.performance.now();
      var interval =
        moved || model.player.moving()
          ? interactiveFrameIntervalMs
          : idleFrameIntervalMs;
      if (now - lastDraw < interval) {
        return;
      }

      lastDraw = now;
      lastX = stage.x;
      lastY = stage.y;
      lastScaleX = stage.scaleX;
      lastScaleY = stage.scaleY;
      lastWidth = canvas.width;
      lastHeight = canvas.height;
      lastParallaxX = currentParallax[0];
      lastParallaxY = currentParallax[1];

      originalUpdate.apply(stage, arguments);
    };
  } catch (e) {
    console.error(e);
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoGalaxyMapPerf();
