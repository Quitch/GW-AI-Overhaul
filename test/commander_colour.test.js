"use strict";

// gw_play/commander_colour.js pickAlly and pickEnemy: a commander's colour
// from its faction's player-side or enemy list, each sorted by contrast once
// at load from the colour nearest the faction colour.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const colour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"
);
const armyColours = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/army_colours.js"
);

const minion = [
  [10, 20, 30],
  [1, 2, 3],
];
const guardians = [
  [255, 255, 255],
  [255, 192, 203],
];

const SIDES = [
  { name: "ally", pick: colour.pickAlly, size: colour.allySize, key: "allies" },
  {
    name: "enemy",
    pick: colour.pickEnemy,
    size: colour.enemySize,
    key: "enemies",
  },
];
const FACTIONS = [0, 1, 2, 3, 4];

SIDES.forEach((side) => {
  describe(side.name + " pick", () => {
    // Every faction, every count up to the fallback that ends its list.
    it("gives each count its own colour, with the grey secondary", () => {
      for (const faction of FACTIONS) {
        const primaries = [];
        for (let count = 0; count < side.size(faction); count++) {
          const picked = side.pick(faction, minion, count);
          assert.deepEqual(picked[1], [192, 192, 192]);
          primaries.push(JSON.stringify(picked[0]));
        }
        assert.ok(primaries.length > 1, "faction " + faction + " list");
        assert.equal(
          new Set(primaries).size,
          primaries.length,
          "faction " + faction + " repeats a colour"
        );
      }
    });

    it("hands out exactly the colours of its list", () => {
      for (const faction of FACTIONS) {
        const listed = armyColours.factions[faction][side.key];
        const picked = [];
        for (let count = 0; count < side.size(faction); count++) {
          picked.push(side.pick(faction, minion, count)[0]);
        }
        assert.equal(picked.length, listed.length);
        assert.deepEqual(
          picked.map(String).sort(),
          listed.map(String).sort(),
          "faction " + faction
        );
      }
    });

    it("starts from the list's first colour, the one nearest the faction colour", () => {
      for (const faction of FACTIONS) {
        assert.deepEqual(
          side.pick(faction, minion, 0)[0],
          armyColours.factions[faction][side.key][0]
        );
      }
    });

    // Each next colour is the one that contrasts most with the last.
    it("follows each colour with the most contrasting one left", () => {
      const luminance = (c) => c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
      const score = (a, b) =>
        (a[0] - b[0]) ** 2 +
        (a[1] - b[1]) ** 2 +
        (a[2] - b[2]) ** 2 +
        Math.abs(luminance(a) - luminance(b)) * 16;
      for (const faction of FACTIONS) {
        const order = [];
        for (let count = 0; count < side.size(faction); count++) {
          order.push(side.pick(faction, minion, count)[0]);
        }
        for (let i = 1; i < order.length; i++) {
          const best = score(order[i - 1], order[i]);
          order.slice(i + 1).forEach((later) => {
            assert.ok(score(order[i - 1], later) <= best);
          });
        }
      }
    });

    it("gives the faction's own colour once the list is spent", () => {
      for (const faction of FACTIONS) {
        const spent = side.pick(faction, minion, side.size(faction));
        assert.deepEqual(spent[0], armyColours.factions[faction].spent);
        assert.deepEqual(spent[1], [192, 192, 192]);
        assert.deepEqual(side.pick(faction, minion, 99), spent);
        assert.deepEqual(side.pick([faction], minion, 99), spent);
        assert.deepEqual(side.pick(faction, undefined, 99), spent);
        for (let count = 0; count < side.size(faction); count++) {
          assert.notDeepEqual(side.pick(faction, minion, count)[0], spent[0]);
        }
      }
    });

    it("falls back to the minion's colour for a faction with no palette", () => {
      assert.equal(side.pick(7, minion, 0), minion);
      assert.equal(side.size(7), 0);
    });

    it("keeps a spent list's Guardians in their own pair", () => {
      for (const faction of FACTIONS) {
        assert.equal(
          side.pick(faction, guardians, side.size(faction)),
          guardians
        );
      }
    });

    it("colours a minion with no colour of its own from the list", () => {
      for (const faction of FACTIONS) {
        assert.deepEqual(
          side.pick(faction, undefined, 1),
          side.pick(faction, minion, 1)
        );
      }
    });

    it("keeps the Guardians white", () => {
      assert.deepEqual(
        side.pick(
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
});

describe("faction lists", () => {
  it("gives every faction a different spent-list colour", () => {
    const spent = FACTIONS.map((faction) =>
      JSON.stringify(colour.pickAlly(faction, minion, 99)[0])
    );
    assert.equal(new Set(spent).size, spent.length);
  });

  it("gives an enemy every player-side colour and more", () => {
    for (const faction of FACTIONS) {
      const enemies = new Set(
        armyColours.factions[faction].enemies.map(String)
      );
      armyColours.factions[faction].allies.forEach((entry) => {
        assert.ok(enemies.has(String(entry)), String(entry));
      });
      assert.ok(colour.enemySize(faction) >= colour.allySize(faction));
    }
  });
});
