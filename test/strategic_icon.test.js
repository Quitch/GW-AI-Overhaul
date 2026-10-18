"use strict";

// shared/strategic_icon.js: repainting a channel-coded strategic icon.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");

const strategicIcon = loadCouiModule(MOD_ROOT + "/shared/strategic_icon.js");

const LEGION = [236, 34, 35];
const paintOne = (pixel) => strategicIcon.paint(pixel.slice(), LEGION);

describe("paint", () => {
  it("paints the body in the colour", () => {
    assert.deepEqual(paintOne([255, 0, 0, 255]), [236, 34, 35, 255]);
  });

  it("paints the emblem white", () => {
    assert.deepEqual(paintOne([255, 255, 0, 255]), [255, 255, 255, 255]);
  });

  it("keeps the outline black and the alpha as it was", () => {
    assert.deepEqual(paintOne([0, 0, 0, 255]), [0, 0, 0, 255]);
    assert.deepEqual(paintOne([255, 0, 0, 0]), [236, 34, 35, 0]);
  });

  it("blends an antialiased edge in proportion", () => {
    assert.deepEqual(paintOne([128, 0, 0, 200]), [118, 17, 18, 200]);
  });

  it("clamps a colour component above 255", () => {
    assert.deepEqual(
      strategicIcon.paint([255, 0, 0, 255], [300, 0, 0]),
      [255, 0, 0, 255]
    );
  });

  it("bounds the visible pixels", () => {
    // 3x3, visible at (1, 0) and (2, 1).
    const pixels = new Array(36).fill(0);
    pixels[(0 * 3 + 1) * 4 + 3] = 255;
    pixels[(1 * 3 + 2) * 4 + 3] = 10;
    assert.deepEqual(strategicIcon.bounds(pixels, 3, 3), {
      x: 1,
      y: 0,
      width: 2,
      height: 2,
    });
  });

  it("bounds the whole image when nothing is visible", () => {
    assert.deepEqual(strategicIcon.bounds(new Array(16).fill(0), 2, 2), {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
    });
  });

  it("repaints every pixel in place", () => {
    const pixels = [255, 0, 0, 255, 0, 0, 0, 255];
    assert.equal(strategicIcon.paint(pixels, LEGION), pixels);
    assert.deepEqual(pixels, [236, 34, 35, 255, 0, 0, 0, 255]);
  });
});
