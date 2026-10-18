// A strategic icon is channel-coded for the engine to paint: red is the badge
// body, which takes the team colour, green the emblem, painted white over it,
// and black the outline.
define(function () {
  // `pixels` is canvas RGBA data, repainted in place for `rgb`.
  var paint = function (pixels, rgb) {
    for (var i = 0; i < pixels.length; i += 4) {
      var body = pixels[i] / 255;
      var emblem = pixels[i + 1] / 255;

      for (var channel = 0; channel < 3; channel += 1) {
        pixels[i + channel] = Math.min(
          255,
          Math.round(body * rgb[channel] + emblem * (255 - rgb[channel]))
        );
      }
    }

    return pixels;
  };

  return {
    paint: paint,
  };
});
