var gwoGalaxyMapPerfLoaded;

// The base game's galaxy-map canvas (model.galaxy.stage, an EaselJS
// createjs.Stage) is fully cleared and redrawn on every single
// requestAnimationFrame tick forever, uncapped - see updateStage() in
// gw_play.js. Its backing pixel buffer is sized to the actual viewport
// resolution, so the cost of that redraw scales directly with display
// resolution and refresh rate. We can't edit gw_play.js (base game file,
// and updateStage() is a private closure not exposed on the view model
// anyway), but model.galaxy.stage is a shared instance we can reach from a
// mod script, so we wrap its update() with a dirty check instead: only the
// stage's own transform (pan/zoom), the canvas's backing size, and
// model.galaxy.parallax (a mouse-tracking offset applied to the nebula
// layer on every body mousemove - see gw_play.js's self.setup) can change
// what's drawn without going through update() itself (there's no
// createjs.Tween/ticker-driven animation on this layer), so diffing those
// values against the last real draw tells us whether a redraw is actually
// needed. While the camera is moving (drag/zoom/resize) or the mouse is
// moving (parallax), this draws every tick, same as unpatched, so panning
// and the parallax effect stay smooth. Only once everything is provably
// static does it fall back to a slow heartbeat, which still picks up
// hover-highlight changes (driven by EaselJS's own mouseover hit testing
// inside update()) within one heartbeat interval.
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
    var idleFrameIntervalMs = 1000 / 10;
    var lastDraw = 0;
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
      if (!moved && now - lastDraw < idleFrameIntervalMs) {
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
    console.error(JSON.stringify(e));
  }
}
gwoGalaxyMapPerf();
