// The pulsing ring marking a player-held, still-unexplored Conquest system.
// Modelled on coop_ping_marker.js, but the pulse loops for as long as the
// star stays unexplored, so it rides the 10 FPS idle heartbeat and must
// never request interactive frames. See conquest.md.
define(function () {
  var PULSE_MS = 1800;
  var RING_RADIUS = 100;
  var RING_WIDTH = 6;
  var RING_MIN_SCALE = 0.35;
  var RING_GROWTH = 0.55;

  var pulseFrame = function (elapsedMs) {
    var elapsed = _.isFinite(elapsedMs) && elapsedMs > 0 ? elapsedMs : 0;
    var phase = (elapsed % PULSE_MS) / PULSE_MS;
    return {
      ringScale: RING_MIN_SCALE + phase * RING_GROWTH,
      ringAlpha: 1 - phase,
    };
  };

  var createLayer = function (params) {
    var systemFor = params.systemFor;
    var colour = params.colour;
    var live = {};

    var buildMarker = function () {
      var container = new createjs.Container();
      // systems.js sorts an undefined z ahead of every number, which would
      // sink the marker under the star icon.
      container.z = 2;
      container.mouseEnabled = false;
      container.mouseChildren = false;

      var ring = new createjs.Shape();
      // ignoreScale, so the stroke keeps one width as the ring expands.
      ring.graphics
        .setStrokeStyle(RING_WIDTH, null, null, null, true)
        .beginStroke(colour)
        .drawCircle(0, 0, RING_RADIUS);
      container.addChild(ring);

      return { container: container, ring: ring };
    };

    var remove = function (star) {
      var state = live[star];
      if (!state) {
        return;
      }

      delete live[star];
      state.container.removeEventListener("tick", state.onTick);
      if (state.container.parent) {
        state.container.parent.removeChild(state.container);
      }
    };

    var raise = function (star) {
      if (live[star]) {
        return;
      }

      var system = systemFor(star);
      if (!system || !system.systemDisplay) {
        return;
      }

      var marker = buildMarker();
      var state = {
        container: marker.container,
        start: _.now(),
        onTick: function () {
          var frame = pulseFrame(_.now() - state.start);
          marker.ring.scaleX = frame.ringScale;
          marker.ring.scaleY = frame.ringScale;
          marker.ring.alpha = frame.ringAlpha;
        },
      };

      live[star] = state;
      marker.container.addEventListener("tick", state.onTick);
      system.systemDisplay.addChild(marker.container);
    };

    // Raises a marker per key of heldStars and removes every other live one.
    var sync = function (heldStars) {
      _.forEach(_.keys(live), function (key) {
        if (!heldStars[key]) {
          remove(key);
        }
      });
      _.forEach(_.keys(heldStars), function (key) {
        raise(key);
      });
    };

    return { raise: raise, remove: remove, sync: sync };
  };

  return {
    createLayer: createLayer,
    pulseFrame: pulseFrame,
  };
});
