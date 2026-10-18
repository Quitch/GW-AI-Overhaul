"use strict";

// shared/strategic_icon.js: repainting a channel-coded strategic icon.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");

const strategicIcon = loadCouiModule(MOD_ROOT + "/shared/strategic_icon.js");

const LEGION = [236, 34, 35];
const paintOne = (pixel) => strategicIcon.paint(pixel.slice(), LEGION);

describe("paint", () => {
  it("paints the emblem in the colour", () => {
    assert.deepEqual(paintOne([255, 255, 0, 255]), [236, 34, 35, 255]);
  });

  it("paints the badge body and the outline black", () => {
    assert.deepEqual(paintOne([255, 0, 0, 255]), [0, 0, 0, 255]);
    assert.deepEqual(paintOne([0, 0, 0, 255]), [0, 0, 0, 255]);
  });

  it("keeps the alpha as it was", () => {
    assert.deepEqual(paintOne([255, 255, 0, 0]), [236, 34, 35, 0]);
  });

  it("remaps each channel as the engine does, with green gamma-corrected", () => {
    assert.deepEqual(paintOne([69, 255, 0, 255]), [0, 0, 0, 255]);
    assert.deepEqual(paintOne([255, 170, 0, 255]), [182, 26, 27, 255]);
  });

  it("clamps a colour component above 255", () => {
    assert.deepEqual(
      strategicIcon.paint([255, 255, 0, 255], [300, 0, 0]),
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
    const pixels = [255, 255, 0, 255, 255, 0, 0, 255];
    assert.equal(strategicIcon.paint(pixels, LEGION), pixels);
    assert.deepEqual(pixels, [236, 34, 35, 255, 0, 0, 0, 255]);
  });
});
