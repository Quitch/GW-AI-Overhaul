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
      for (let count = 0; count < colour.paletteSize(faction); count++) {
        const picked = colour.pick(faction, minion, count);
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

  it("gives each faction its own colour once the palette is spent", () => {
    for (const faction of [0, 1, 2, 3, 4]) {
      const spent = colour.pick(faction, minion, colour.paletteSize(faction));
      assert.deepEqual(spent[1], [192, 192, 192]);
      assert.notDeepEqual(spent[0], minion[0]);
      assert.deepEqual(colour.pick(faction, minion, 99), spent);
      assert.deepEqual(colour.pick([faction], minion, 99), spent);
      assert.deepEqual(colour.pick(faction, undefined, 99), spent);
      for (let count = 0; count < colour.paletteSize(faction); count++) {
        assert.notDeepEqual(colour.pick(faction, minion, count)[0], spent[0]);
      }
    }
  });

  it("gives every faction a different spent-palette colour", () => {
    const spent = [0, 1, 2, 3, 4].map((faction) =>
      JSON.stringify(colour.pick(faction, minion, 99)[0])
    );
    assert.equal(new Set(spent).size, spent.length);
  });

  it("falls back to the minion's colour for a faction with no palette", () => {
    assert.equal(colour.pick(7, minion, 0), minion);
  });

  it("keeps a spent palette's Guardians in their own pair", () => {
    const guardians = [
      [255, 255, 255],
      [255, 192, 203],
    ];
    for (const faction of [0, 1, 2, 3, 4]) {
      assert.equal(
        colour.pick(faction, guardians, colour.paletteSize(faction)),
        guardians
      );
    }
  });

  it("colours a minion with no colour of its own from the palette", () => {
    for (const faction of [0, 1, 2, 3, 4]) {
      assert.deepEqual(
        colour.pick(faction, undefined, 1),
        colour.pick(faction, minion, 1)
      );
    }
  });

  it("has no palette for an unknown faction", () => {
    assert.equal(colour.paletteSize(7), 0);
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
