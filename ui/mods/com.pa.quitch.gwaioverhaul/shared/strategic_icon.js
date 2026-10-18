// A strategic icon is channel-coded for the engine to paint. This is
// media/shaders/particle_icon.fs for an unselected unit: red masks the badge,
// green picks the team colour over the badge's black, and every channel is
// first remapped by (v - 0.27) / 0.7.
define(function () {
  var channel = function (value) {
    return Math.min(1, Math.max(0, (value / 255 - 0.27) / 0.7));
  };

  // `pixels` is canvas RGBA data, repainted in place for `rgb`.
  var paint = function (pixels, rgb) {
    for (var i = 0; i < pixels.length; i += 4) {
      var weight =
        channel(pixels[i]) * Math.pow(channel(pixels[i + 1]), 1 / 2.2);

      for (var c = 0; c < 3; c += 1) {
        pixels[i + c] = Math.min(255, Math.round(weight * rgb[c]));
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
