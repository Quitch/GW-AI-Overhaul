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
// moving (parallax), this still draws, but capped to an interactive frame
// rate rather than the uncapped monitor refresh - at 4K a full redraw is
// expensive, and 60 FPS keeps panning/parallax smooth while still cutting
// redraw cost on higher-refresh displays. Only once everything is provably
// static does it fall back to a slower heartbeat, which still picks up
// hover-highlight changes (driven by EaselJS's own mouseover hit testing
// inside update()) within one heartbeat interval.
//
// Separately, we lower EaselJS's mouseover hit-test rate: the base game
// enables it with no argument (defaults to 20/sec), and every check runs a
// hit test across the whole interactive display list (up to 234 systems).
// Halving that to 10/sec cuts a recurring CPU cost that's independent of the
// redraw loop, and hover highlighting stays responsive.
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

    // Halve the mouseover hit-test rate (base game leaves it at the 20/sec default)
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
    console.error(JSON.stringify(e));
  }
}
gwoGalaxyMapPerf();
