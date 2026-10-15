"use strict";

// gw_play/galaxy_map_filter_cache.js: a bitmap whose cache would come out the
// same as one already filtered gets a copy of that result, not a filter pass.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { requireShippedModule } = require("../scripts/lib/amd-loader.js");
const { cacheColourFilters } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/galaxy_map_filter_cache.js"
);

// A canvas whose "pixels" are one string, so a copy can be checked.
function fakeCanvas(width, height) {
  const canvas = { width: width || 0, height: height || 0, pixels: "" };
  canvas.getContext = () => ({
    clearRect: () => {
      canvas.pixels = "";
    },
    drawImage: (source) => {
      canvas.pixels = source.pixels;
    },
  });
  return canvas;
}

function fakeCreatejs() {
  const passes = [];
  function ColorFilter(red, green, blue, alpha) {
    this.redMultiplier = red;
    this.greenMultiplier = green;
    this.blueMultiplier = blue;
    this.alphaMultiplier = alpha;
    this.redOffset = 0;
    this.greenOffset = 0;
    this.blueOffset = 0;
    this.alphaOffset = 0;
  }
  function Bitmap() {}
  const createjs = {
    ColorFilter,
    Bitmap,
    DisplayObject: { _nextCacheID: 1 },
    createCanvas: () => fakeCanvas(),
  };
  // Stock's updateCache: sizes the canvas, draws, filters, takes a new id.
  Bitmap.prototype.updateCache = function (compositeOperation) {
    passes.push(compositeOperation);
    this.cacheCanvas.width = this._cacheWidth;
    this.cacheCanvas.height = this._cacheHeight;
    const filter = this.filters && this.filters[0];
    this.cacheCanvas.pixels =
      this.image.src +
      (this.image.complete ? "" : " (not loaded)") +
      (filter ? " x " + filter.redMultiplier : "");
    this.cacheID = createjs.DisplayObject._nextCacheID++;
  };
  return { createjs, passes };
}

function bitmap(createjs, options) {
  const settings = Object.assign(
    { src: "coui://owner.png", loaded: true, colour: [1, 0.5, 0.25, 3] },
    options
  );
  const result = new createjs.Bitmap();
  result.image = {
    src: settings.src,
    complete: settings.loaded,
    naturalWidth: settings.loaded ? 240 : 0,
  };
  result.filters = settings.colour
    ? [new createjs.ColorFilter(...settings.colour)]
    : [];
  result.cacheCanvas = fakeCanvas();
  result._cacheOffsetX = -1;
  result._cacheOffsetY = -1;
  result._cacheWidth = 242;
  result._cacheHeight = 242;
  result._cacheScale = 1;
  return result;
}

function setup() {
  const fake = fakeCreatejs();
  cacheColourFilters(fake.createjs);
  return fake;
}

describe("galaxy_map_filter_cache", () => {
  it("filters the first bitmap, and copies its result into the next one like it", () => {
    const { createjs, passes } = setup();
    const first = bitmap(createjs);
    const second = bitmap(createjs);

    first.updateCache();
    second.updateCache();

    assert.equal(passes.length, 1);
    assert.equal(second.cacheCanvas.pixels, first.cacheCanvas.pixels);
    assert.equal(second.cacheCanvas.width, 242);
    assert.equal(second.cacheCanvas.height, 242);
    assert.ok(second.cacheID > first.cacheID);
  });

  it("keeps its copy when a later pass changes the bitmap it came from", () => {
    const { createjs } = setup();
    const first = bitmap(createjs);
    first.updateCache();
    first.cacheCanvas.pixels = "changed";

    const second = bitmap(createjs);
    second.updateCache();

    assert.equal(second.cacheCanvas.pixels, "coui://owner.png x 1");
  });

  it("copies into a canvas that is already the right size", () => {
    const { createjs } = setup();
    bitmap(createjs).updateCache();
    const second = bitmap(createjs);
    second.cacheCanvas = fakeCanvas(242, 242);
    second.cacheCanvas.pixels = "stale";

    second.updateCache();

    assert.equal(second.cacheCanvas.pixels, "coui://owner.png x 1");
  });

  it("filters again for another colour, image, or size", () => {
    const { createjs, passes } = setup();
    bitmap(createjs).updateCache();

    bitmap(createjs, { colour: [0.5, 0.5, 0.25, 3] }).updateCache();
    bitmap(createjs, { src: "coui://ring.png" }).updateCache();
    const larger = bitmap(createjs);
    larger._cacheWidth = 300;
    larger.updateCache();

    assert.equal(passes.length, 4);
  });

  it("keeps an image that has not loaded apart from the same image loaded", () => {
    const { createjs, passes } = setup();
    const early = bitmap(createjs, { loaded: false });
    early.updateCache();

    const late = bitmap(createjs);
    late.updateCache();

    assert.equal(passes.length, 2);
    assert.equal(late.cacheCanvas.pixels, "coui://owner.png x 1");
  });

  it("leaves to stock every bitmap whose result it cannot reuse", () => {
    const { createjs, passes } = setup();
    const cases = {
      "a composite operation": (b) => {
        b.updateCache("source-over");
      },
      "no filter": (b) => {
        b.filters = [];
        b.updateCache();
      },
      "two filters": (b) => {
        b.filters.push(new createjs.ColorFilter(1, 1, 1, 1));
        b.updateCache();
      },
      "a filter of another kind": (b) => {
        b.filters = [{ redMultiplier: 1 }];
        b.updateCache();
      },
      "a colour offset": (b) => {
        b.filters[0].alphaOffset = 10;
        b.updateCache();
      },
      "a source rectangle": (b) => {
        b.sourceRect = { x: 0, y: 0, width: 10, height: 10 };
        b.updateCache();
      },
      "a cache scale": (b) => {
        b._cacheScale = 2;
        b.updateCache();
      },
      "an image with no source": (b) => {
        b.image.src = "";
        b.updateCache();
      },
    };

    Object.keys(cases).forEach((name) => {
      cases[name](bitmap(createjs));
      cases[name](bitmap(createjs));
    });

    assert.equal(passes.length, Object.keys(cases).length * 2);
    assert.equal(passes[0], "source-over");
  });
});
