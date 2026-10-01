"use strict";

// gw_play/commander_colour.js pick: a commander's colour from its faction's
// palette, sorted by contrast once at load.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const colour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"
);

const minion = [
  [10, 20, 30],
  [1, 2, 3],
];

describe("pick", () => {
  // Every faction, every count up to the fallback that ends its palette.
  it("gives each count its own palette colour, with the grey secondary", () => {
    for (const faction of [0, 1, 2, 3, 4]) {
      const primaries = [];
      for (let count = 0; ; count++) {
        const picked = colour.pick(faction, minion, count);
        if (picked === minion) {
          break;
        }
        assert.deepEqual(picked[1], [192, 192, 192]);
        primaries.push(JSON.stringify(picked[0]));
      }
      assert.ok(primaries.length > 1, "faction " + faction + " palette");
      assert.equal(
        new Set(primaries).size,
        primaries.length,
        "faction " + faction + " repeats a colour"
      );
    }
  });

  it("falls back to the minion's colour once the palette is spent", () => {
    // Cluster's palette has five colours.
    assert.equal(colour.pick(4, minion, 5), minion);
  });

  it("falls back to the minion's colour for a faction with no palette", () => {
    assert.equal(colour.pick(7, minion, 0), minion);
  });

  it("keeps the Guardians white", () => {
    assert.deepEqual(
      colour.pick(
        0,
        [
          [255, 255, 255],
          [0, 0, 0],
        ],
        0
      ),
      [
        [255, 255, 255],
        [192, 192, 192],
      ]
    );
  });
});
