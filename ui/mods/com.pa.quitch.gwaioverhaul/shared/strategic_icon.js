// A strategic icon is channel-coded for the engine to paint: red is the badge
// body, which takes the team colour, green the emblem over it, and black the
// outline.
define(function () {
  // The emblem's share of the body colour. The game paints it white, which
  // at loadout-card size washes the body colour out.
  var EMBLEM_SHADE = 0.5;

  // `pixels` is canvas RGBA data, repainted in place for `rgb`.
  var paint = function (pixels, rgb) {
    for (var i = 0; i < pixels.length; i += 4) {
      var body = pixels[i] / 255;
      var emblem = pixels[i + 1] / 255;
      var weight = Math.max(0, body - emblem * (1 - EMBLEM_SHADE));

      for (var channel = 0; channel < 3; channel += 1) {
        pixels[i + channel] = Math.min(255, Math.round(weight * rgb[channel]));
      }
    }

    return pixels;
  };

  return {
    paint: paint,
  };
});
