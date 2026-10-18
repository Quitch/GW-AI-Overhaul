"use strict";

// shared/strategic_icon.js: repainting a channel-coded strategic icon.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");

const strategicIcon = loadCouiModule(MOD_ROOT + "/shared/strategic_icon.js");

const LEGION = [236, 34, 35];

describe("paint", () => {
  it("paints the body in the colour, the emblem white, and keeps the outline black", () => {
    const pixels = [
      255,
      0,
      0,
      255, // body
      255,
      255,
      0,
      255, // emblem
      0,
      0,
      0,
      255, // outline
      255,
      0,
      0,
      0, // transparent
    ];
    assert.deepEqual(
      strategicIcon.paint(pixels, LEGION),
      [236, 34, 35, 255, 255, 255, 255, 255, 0, 0, 0, 255, 236, 34, 35, 0]
    );
  });

  it("blends an antialiased edge in proportion", () => {
    assert.deepEqual(
      strategicIcon.paint([128, 0, 0, 200], LEGION),
      [118, 17, 18, 200]
    );
  });
});
