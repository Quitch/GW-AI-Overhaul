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
  it("gives each count its own palette colour, with the grey secondary", () => {
    const first = colour.pick(0, minion, 0);
    const second = colour.pick(0, minion, 1);

    assert.deepEqual(first[1], [192, 192, 192]);
    assert.notDeepEqual(first[0], second[0]);
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

  // The palettes are built once, so a caller that edits a colour it was given
  // must not change the next commander's.
  it("hands out a copy of the palette colour", () => {
    const expected = colour.pick(1, minion, 2)[0].slice();

    colour.pick(1, minion, 2)[0][0] = -1;

    assert.deepEqual(colour.pick(1, minion, 2)[0], expected);
  });
});
