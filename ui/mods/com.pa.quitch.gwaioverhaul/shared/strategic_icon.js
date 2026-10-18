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

  // The box around the visible pixels, so the badge can fill its slot rather
  // than keep the file's transparent margin. The whole image when none are.
  var bounds = function (pixels, width, height) {
    var box = { left: width, top: height, right: -1, bottom: -1 };

    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        if (pixels[(y * width + x) * 4 + 3] > 0) {
          box.left = Math.min(box.left, x);
          box.top = Math.min(box.top, y);
          box.right = Math.max(box.right, x);
          box.bottom = Math.max(box.bottom, y);
        }
      }
    }

    if (box.right < 0) {
      return { x: 0, y: 0, width: width, height: height };
    }

    return {
      x: box.left,
      y: box.top,
      width: box.right - box.left + 1,
      height: box.bottom - box.top + 1,
    };
  };

  return {
    paint: paint,
    bounds: bounds,
  };
});
