"use strict";

// Pins paletteFor to the ordering pick() consumes: Conquest army icons
// resolve a stored palette index, so divergence would tint an army
// differently on the galaxy map and in battle.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const commanderColour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"
);

const FACTION_COUNT = 5;
const SECONDARY = [192, 192, 192];
const FACTION_COLOUR = [[0, 176, 255], SECONDARY];

describe("commander_colour.paletteFor", () => {
  it("returns a palette for every faction", () => {
    for (let faction = 0; faction < FACTION_COUNT; faction++) {
      const palette = commanderColour.paletteFor(faction);
      assert.ok(Array.isArray(palette));
      assert.ok(palette.length >= 5);
    }
  });

  it("matches the order pick() consumes", () => {
    for (let faction = 0; faction < FACTION_COUNT; faction++) {
      const palette = commanderColour.paletteFor(faction);
      palette.forEach((colour, index) => {
        const picked = commanderColour.pick(faction, FACTION_COLOUR, index);
        assert.deepEqual(picked, [colour, SECONDARY]);
      });
    }
  });
});

describe("commander_colour.pick", () => {
  it("falls back to the caller's colour when the palette is exhausted", () => {
    const palette = commanderColour.paletteFor(0);
    assert.deepEqual(
      commanderColour.pick(0, FACTION_COLOUR, palette.length),
      FACTION_COLOUR
    );
  });

  it("keeps the Guardians white", () => {
    assert.deepEqual(commanderColour.pick(0, [[255, 255, 255], SECONDARY], 0), [
      [255, 255, 255],
      SECONDARY,
    ]);
  });
});
