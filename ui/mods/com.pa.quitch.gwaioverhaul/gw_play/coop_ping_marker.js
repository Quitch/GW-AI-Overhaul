// The marker a co-op ping raises on the galaxy map. See coop.md.
define(function () {
  var PULSE_MS = 900;
  var PULSES = 3;
  var LIFETIME_MS = PULSE_MS * PULSES;
  var BACKSTOP_GRACE_MS = 2000;
  var RING_RADIUS = 100;
  var RING_WIDTH = 6;
  var RING_COLOUR = "rgba(255,214,64,1)";
  var RING_MIN_SCALE = 0.35;
  var RING_GROWTH = 0.9;
  var ICON_URL =
    "coui://ui/main/atlas/icon_atlas/img/strategic_icons/icon_si_ping.png";
  var ICON_SIZE = 52;
  var ICON_SCALE = 1.6;
  var ICON_FADE_SHARPNESS = 4;

  var pulseFrame = function (elapsedMs) {
    var elapsed = _.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;

    if (elapsed >= LIFETIME_MS) {
      return { ringScale: 0, ringAlpha: 0, iconAlpha: 0, done: true };
    }

    var phase = (elapsed % PULSE_MS) / PULSE_MS;
    return {
      ringScale: RING_MIN_SCALE + phase * RING_GROWTH,
      ringAlpha: 1 - phase,
      iconAlpha: Math.min(1, (1 - elapsed / LIFETIME_MS) * ICON_FADE_SHARPNESS),
      done: false,
    };
  };

  var createLayer = function (params) {
    var systemFor = params.systemFor;
    var live = {};

    var buildMarker = function () {
      var container = new createjs.Container();
      // systems.js sorts an undefined z ahead of every number, which would sink
      // the marker under the star icon.
      container.z = 2;
      container.mouseEnabled = false;
      container.mouseChildren = false;

      var ring = new createjs.Shape();
      // ignoreScale, so the stroke keeps one width as the ring expands.
      ring.graphics
        .setStrokeStyle(RING_WIDTH, null, null, null, true)
        .beginStroke(RING_COLOUR)
        .drawCircle(0, 0, RING_RADIUS);
      container.addChild(ring);

      var icon = new createjs.Bitmap(ICON_URL);
      icon.regX = ICON_SIZE / 2;
      icon.regY = ICON_SIZE / 2;
      icon.scaleX = ICON_SCALE;
      icon.scaleY = ICON_SCALE;
      icon.y = -RING_RADIUS;
      container.addChild(icon);

      return { container: container, ring: ring, icon: icon };
    };

    var remove = function (star) {
      var state = live[star];
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
    var armBackstop = function (star, state) {
      clearTimeout(state.backstop);
      state.backstop = _.delay(function () {
        remove(star);
      }, LIFETIME_MS + BACKSTOP_GRACE_MS);
    };

    var raise = function (star) {
      var system = systemFor(star);
      if (!system || !system.systemDisplay) {
        return;
      }

      if (model.gwoRequestInteractiveFrames) {
        model.gwoRequestInteractiveFrames(LIFETIME_MS);
      }

      var state = live[star];
      if (state) {
        state.start = _.now();
        armBackstop(star, state);
        return;
      }

      var marker = buildMarker();
      state = {
        container: marker.container,
        start: _.now(),
        onTick: function () {
          var frame = pulseFrame(_.now() - state.start);
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

    return { raise: raise, remove: remove };
  };

  return {
    createLayer: createLayer,
    pulseFrame: pulseFrame,
  };
});
