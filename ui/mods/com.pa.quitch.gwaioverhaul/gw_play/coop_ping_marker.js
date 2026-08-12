// The marker a co-op ping raises on the galaxy map. See coop.md.
define(() => {
  const PULSE_MS = 900;
  const PULSES = 3;
  const LIFETIME_MS = PULSE_MS * PULSES;
  const BACKSTOP_GRACE_MS = 2000;
  const RING_RADIUS = 100;
  const RING_WIDTH = 6;
  const RING_COLOUR = "rgba(255,214,64,1)";
  const RING_MIN_SCALE = 0.35;
  const RING_GROWTH = 0.9;
  const ICON_URL =
    "coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_ping.png";
  const ICON_SIZE = 52;
  const ICON_SCALE = 1.6;
  const ICON_FADE_SHARPNESS = 4;

  const pulseFrame = (elapsedMs) => {
    const elapsed = _.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;

    if (elapsed >= LIFETIME_MS) {
      return { ringScale: 0, ringAlpha: 0, iconAlpha: 0, done: true };
    }

    const phase = (elapsed % PULSE_MS) / PULSE_MS;
    return {
      ringScale: RING_MIN_SCALE + phase * RING_GROWTH,
      ringAlpha: 1 - phase,
      iconAlpha: Math.min(1, (1 - elapsed / LIFETIME_MS) * ICON_FADE_SHARPNESS),
      done: false,
    };
  };

  const createLayer = (params) => {
    const systemFor = params.systemFor;
    const live = {};

    const buildMarker = () => {
      const container = new createjs.Container();
      // systems.js sorts an undefined z ahead of every number, which would sink
      // the marker under the star icon.
      container.z = 2;
      container.mouseEnabled = false;
      container.mouseChildren = false;

      const ring = new createjs.Shape();
      // ignoreScale, so the stroke keeps one width as the ring expands.
      ring.graphics
        .setStrokeStyle(RING_WIDTH, null, null, null, true)
        .beginStroke(RING_COLOUR)
        .drawCircle(0, 0, RING_RADIUS);
      container.addChild(ring);

      const icon = new createjs.Bitmap(ICON_URL);
      icon.regX = ICON_SIZE / 2;
      icon.regY = ICON_SIZE / 2;
      icon.scaleX = ICON_SCALE;
      icon.scaleY = ICON_SCALE;
      icon.y = -RING_RADIUS;
      container.addChild(icon);

      return { container, ring, icon };
    };

    const remove = (star) => {
      const state = live[star];
      if (!state) {
        return;
      }

      delete live[star];
      clearTimeout(state.backstop);
      state.container.removeEventListener("tick", state.onTick);
      if (state.container.parent) {
        state.container.parent.removeChild(state.container);
      }
    };

    // Ticks stop entirely while hidingUI() is true, so a marker raised just
    // before a battle launch would still be sitting there on return.
    const armBackstop = (star, state) => {
      clearTimeout(state.backstop);
      state.backstop = _.delay(() => {
        remove(star);
      }, LIFETIME_MS + BACKSTOP_GRACE_MS);
    };

    const raise = (star) => {
      const system = systemFor(star);
      if (!system || !system.systemDisplay) {
        return;
      }

      if (model.gwoRequestInteractiveFrames) {
        model.gwoRequestInteractiveFrames(LIFETIME_MS);
      }

      let state = live[star];
      if (state) {
        state.start = _.now();
        armBackstop(star, state);
        return;
      }

      const marker = buildMarker();
      state = {
        container: marker.container,
        start: _.now(),
        onTick: function () {
          const frame = pulseFrame(_.now() - state.start);
          if (frame.done) {
            remove(star);
            return;
          }

          marker.ring.scaleX = frame.ringScale;
          marker.ring.scaleY = frame.ringScale;
          marker.ring.alpha = frame.ringAlpha;
          marker.icon.alpha = frame.iconAlpha;
        },
      };

      live[star] = state;
      marker.container.addEventListener("tick", state.onTick);
      system.systemDisplay.addChild(marker.container);
      armBackstop(star, state);
    };

    return { raise, remove };
  };

  return {
    createLayer,
    pulseFrame,
  };
});
