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

  it("paints the emblem in a darker shade of the colour", () => {
    assert.deepEqual(paintOne([255, 255, 0, 255]), [118, 17, 18, 255]);
  });

  it("keeps the outline black and the alpha as it was", () => {
    assert.deepEqual(paintOne([0, 0, 0, 255]), [0, 0, 0, 255]);
    assert.deepEqual(paintOne([255, 0, 0, 0]), [236, 34, 35, 0]);
  });

  it("blends an antialiased edge in proportion", () => {
    assert.deepEqual(paintOne([128, 0, 0, 200]), [118, 17, 18, 200]);
  });

  it("never paints below black for an emblem pixel with no body", () => {
    assert.deepEqual(paintOne([0, 255, 0, 255]), [0, 0, 0, 255]);
  });

  it("repaints every pixel in place", () => {
    const pixels = [255, 0, 0, 255, 0, 0, 0, 255];
    assert.equal(strategicIcon.paint(pixels, LEGION), pixels);
    assert.deepEqual(pixels, [236, 34, 35, 255, 0, 0, 0, 255]);
  });
});
