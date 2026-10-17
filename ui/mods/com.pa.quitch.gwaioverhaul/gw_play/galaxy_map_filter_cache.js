// Reuses EaselJS colour-filter results, which the galaxy map computes again for
// every star. See architecture.md, "Galaxy map filter cache".
(function () {
  var isLoaded = function (image) {
    return image.complete && image.naturalWidth > 0;
  };

  // Null when stock's own updateCache has to run.
  var cacheKey = function (bitmap, compositeOperation, createjs) {
    var filters = bitmap.filters;
    var filter = filters && filters.length === 1 ? filters[0] : null;
    var image = bitmap.image;
    if (
      compositeOperation ||
      !bitmap.cacheCanvas ||
      bitmap.draw !== createjs.Bitmap.prototype.draw ||
      !(filter instanceof createjs.ColorFilter) ||
      filter.redOffset ||
      filter.greenOffset ||
      filter.blueOffset ||
      filter.alphaOffset ||
      bitmap.sourceRect ||
      bitmap._cacheScale !== 1 ||
      !image ||
      image.tagName !== "IMG" ||
      !image.src
    ) {
      return null;
    }
    return [
      image.src,
      isLoaded(image) ? 1 : 0,
      bitmap._cacheOffsetX,
      bitmap._cacheOffsetY,
      bitmap._cacheWidth,
      bitmap._cacheHeight,
      filter.redMultiplier,
      filter.greenMultiplier,
      filter.blueMultiplier,
      filter.alphaMultiplier,
    ].join("|");
  };

  var newCanvas = function (createjs) {
    return createjs.createCanvas
      ? createjs.createCanvas()
      : document.createElement("canvas");
  };

  var copyInto = function (source, target) {
    var context = target.getContext("2d");
    if (target.width !== source.width || target.height !== source.height) {
      target.width = source.width;
      target.height = source.height;
    } else {
      context.clearRect(0, 0, target.width, target.height);
    }
    context.drawImage(source, 0, 0);
  };

  // The map uses a handful of colours; a colour that animated would add a
  // canvas per frame.
  var maxResults = 64;

  var cacheColourFilters = function (createjs) {
    var bitmap = createjs.Bitmap.prototype;
    var stockUpdateCache = bitmap.updateCache;
    var results = {};
    var resultCount = 0;

    bitmap.updateCache = function (compositeOperation) {
      var key = cacheKey(this, compositeOperation, createjs);
      if (!key) {
        return stockUpdateCache.apply(this, arguments);
      }

      var result = results[key];
      if (!result) {
        stockUpdateCache.call(this);
        if (resultCount < maxResults) {
          result = newCanvas(createjs);
          copyInto(this.cacheCanvas, result);
          results[key] = result;
          resultCount++;
        }
        return;
      }

      copyInto(result, this.cacheCanvas);
      // As stock does after every pass.
      this.cacheID = createjs.DisplayObject._nextCacheID++;
    };
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { cacheColourFilters: cacheColourFilters };
    return;
  }

  try {
    cacheColourFilters(createjs);
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
