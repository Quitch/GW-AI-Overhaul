var gwoGalaxyMapPerfLoaded;

// Dirty-checks the base game's uncapped galaxy-map redraw. The idle heartbeat
// is load-bearing: systems.js animates off it. See architecture.md.
function gwoGalaxyMapPerf() {
  const game = model.game();

  if (gwoGalaxyMapPerfLoaded || game.isTutorial()) {
    return;
  }

  gwoGalaxyMapPerfLoaded = true;

  try {
    const stage = model.galaxy.stage;
    const parallax = model.galaxy.parallax;
    const originalUpdate = stage.update;
    const interactiveFrameIntervalMs = 1000 / 60;
    const idleFrameIntervalMs = 1000 / 10;
    let lastDraw = 0;
    let interactiveUntil = 0;

    // Halved; the base game takes the 20/sec default.
    stage.enableMouseOver(10);

    // For animated overlays, which the idle rate renders in too few frames.
    model.gwoRequestInteractiveFrames = (durationMs) => {
      interactiveUntil = Math.max(
        interactiveUntil,
        window.performance.now() + durationMs,
      );
    };

    let lastX, lastY, lastScaleX, lastScaleY, lastWidth, lastHeight;
    let lastParallaxX, lastParallaxY;

    stage.update = function () {
      const canvas = stage.canvas;
      const currentParallax = parallax();
      const moved =
        stage.x !== lastX ||
        stage.y !== lastY ||
        stage.scaleX !== lastScaleX ||
        stage.scaleY !== lastScaleY ||
        canvas.width !== lastWidth ||
        canvas.height !== lastHeight ||
        currentParallax[0] !== lastParallaxX ||
        currentParallax[1] !== lastParallaxY;

      const now = window.performance.now();
      const interval =
        moved || model.player.moving() || now < interactiveUntil
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
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoGalaxyMapPerf();
