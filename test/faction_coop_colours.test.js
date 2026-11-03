"use strict";

// The five shipped factions' army colours: co-op players, and the player-side,
// enemy, and spent-list colours in gw_play/army_colours.js. See coop.md,
// "Colour allocation".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lodash = require("lodash");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { mediaDir } = require("../scripts/lib/pa-install.js");
const colours = require("../scripts/lib/army-colours.js");

const FACTIONS = colours.loadFactions();
const SYNCHRONOUS = 2;
// The base game's lobby Indigo, the colour its picker offers that shows a
// strategic icon's black symbol worst.
const DARKEST_LOBBY_COLOUR = [75, 0, 130];

const LISTS = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/army_colours.js"
).factions;

// A faction's player-side colours, the one past them included.
function allyColours(index) {
  return LISTS[index].allies.concat([LISTS[index].spent]);
}

// The player colours an enemy of this faction takes on top of its allies.
function enemyPlayerColours(index) {
  const allies = new Set(LISTS[index].allies.map(String));
  return LISTS[index].enemies.filter((entry) => !allies.has(String(entry)));
}

// Every army colour a battle against this faction's armies can show.
function armyColours(index) {
  return colours
    .playerColours(FACTIONS[index], index)
    .concat(allyColours(index), enemyPlayerColours(index));
}

function nearestTo(colour, list) {
  return lodash.min(list.map((entry) => colours.difference(colour, entry)));
}

function stockFile(relative) {
  const file = path.join(mediaDir(), relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}

describe("CIEDE2000", () => {
  // Sharma, Wu and Dalal's published test pairs.
  it("matches the published colour differences", () => {
    [
      [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
      [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1],
      [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
      [[50, 2.5, 0], [73, 25, -18], 27.1492],
      [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
      [[90.8027, -2.0831, 1.441], [91.1528, -1.6435, 0.0447], 1.4441],
    ].forEach(([first, second, expected]) => {
      assert.equal(
        Number(colours.deltaE00(first, second).toFixed(4)),
        expected
      );
    });
  });
});

describe("shipped faction army colours", () => {
  FACTIONS.forEach((faction, index) => {
    describe(faction.name, () => {
      it("holds the faction colour and five more", () => {
        assert.equal(faction.coopPlayerColors.length, 6);
        assert.deepEqual(faction.coopPlayerColors[0], faction.color[0]);
      });

      it("shows black icon symbols on every AI army at 3:1 or better", () => {
        LISTS[index].enemies.concat([LISTS[index].spent]).forEach((entry) => {
          assert.ok(
            colours.contrastWithBlack(entry) >= colours.MIN_CONTRAST,
            JSON.stringify(entry)
          );
        });
      });

      it("shows black icon symbols on every player army at least as well as the lobby does", () => {
        const floor = colours.contrastWithBlack(DARKEST_LOBBY_COLOUR);
        colours.playerColours(faction, index).forEach((entry) => {
          assert.ok(
            colours.contrastWithBlack(entry) >= floor,
            JSON.stringify(entry)
          );
        });
      });

      // The players, the Sub Commanders, and the other factions' armies an
      // enemy of theirs can field are all in one battle.
      it("keeps every player-side colour well away from every other army colour", () => {
        const others = FACTIONS.map((_, other) =>
          other === index
            ? colours.playerColours(faction, index)
            : armyColours(other)
        )
          .flat()
          .concat([colours.GUARDIANS]);
        const own = allyColours(index);
        own.forEach((entry) => {
          const rest = others.concat(own.filter((item) => item !== entry));
          assert.ok(
            nearestTo(entry, rest) >= colours.MIN_DELTA_E,
            JSON.stringify(entry)
          );
        });
      });

      // No player of an enemy faction is in its battles, so only the other
      // factions' armies matter.
      it("keeps every enemy colour well away from every other faction's", () => {
        const others = FACTIONS.map((_, other) =>
          other === index ? [] : armyColours(other)
        )
          .flat()
          .concat([colours.GUARDIANS]);
        LISTS[index].enemies.forEach((entry) => {
          assert.ok(
            nearestTo(entry, others) >= colours.MIN_DELTA_E,
            JSON.stringify(entry)
          );
        });
      });

      it("keeps every player-side colour in the faction's colour space", () => {
        allyColours(index).forEach((entry) => {
          assert.equal(
            colours.colourSpace(entry),
            index,
            JSON.stringify(entry)
          );
        });
      });

      it("has a colour of its own as every player-side colour's nearest", () => {
        const own = armyColours(index);
        const others = FACTIONS.map((_, other) =>
          other === index ? [] : armyColours(other)
        )
          .flat()
          .concat([colours.GUARDIANS]);
        allyColours(index).forEach((entry) => {
          assert.ok(
            nearestTo(
              entry,
              own.filter((item) => item !== entry)
            ) < nearestTo(entry, others),
            JSON.stringify(entry)
          );
        });
      });

      it("gives an enemy only its own player colours on top of its allies", () => {
        const playerColours = faction.coopPlayerColors.map(String);
        enemyPlayerColours(index).forEach((entry) => {
          assert.ok(playerColours.includes(String(entry)), String(entry));
        });
      });

      it("starts each list from the colour nearest the faction colour", () => {
        ["allies", "enemies"].forEach((key) => {
          const list = LISTS[index][key];
          const toFaction = list.map((entry) =>
            colours.difference(entry, faction.color[0])
          );
          assert.equal(toFaction.indexOf(lodash.min(toFaction)), 0, key);
        });
      });
    });
  });

  it("gives Synchronous players greens, as its faction colour is", () => {
    FACTIONS[SYNCHRONOUS].coopPlayerColors.forEach((colour) => {
      const [red, green, blue] = colour;
      assert.ok(green > red && green > blue, JSON.stringify(colour));
    });
  });

  function stockColours(t) {
    const source = stockFile(
      "ui/main/game/galactic_war/shared/js/gw_coop_player_colors.js"
    );
    if (!source) {
      t.skip("no PA install");
      return undefined;
    }

    let resolver;
    new Function("define", "_", source)((factory) => {
      resolver = factory();
    }, lodash);
    return resolver;
  }

  // As the base game resolves them: every player after the host takes the next
  // palette entry, none skipped as a repeat and none from the lobby fallback.
  it("colours six players from the palette alone, each differently", (t) => {
    const resolver = stockColours(t);
    if (!resolver) {
      return;
    }

    FACTIONS.forEach((faction, index) => {
      const pairs = resolver.resolvePlayerColorPairs(6, faction, faction.color);
      const primaries = pairs.map((pair) => pair[0]);
      assert.deepEqual(
        primaries,
        colours.playerColours(faction, index).slice(0, 6),
        faction.name
      );
      assert.equal(
        lodash.uniq(primaries.map(String)).length,
        primaries.length,
        faction.name
      );
    });
  });

  it("matches the base game's colours for players 7 to 12", (t) => {
    const resolver = stockColours(t);
    if (!resolver) {
      return;
    }

    FACTIONS.forEach((faction, index) => {
      const pairs = resolver.resolvePlayerColorPairs(
        12,
        faction,
        faction.color
      );
      assert.deepEqual(
        pairs.slice(6).map((pair) => pair[0]),
        colours.LOBBY_PLAYERS[index],
        faction.name
      );
    });
  });

  it("measures player icon contrast against the lobby's darkest colour", (t) => {
    const source = stockFile("server-script/lobby/color_table.js");
    if (!source) {
      t.skip("no PA install");
      return;
    }

    const exports = {};
    new Function("require", "exports", source)(
      (name) => (name === "thirdparty/lodash" ? lodash : console),
      exports
    );
    const [darkest] = exports.data
      .map((entry) => entry.primary)
      .sort(
        (a, b) => colours.contrastWithBlack(a) - colours.contrastWithBlack(b)
      );
    assert.deepEqual(darkest, DARKEST_LOBBY_COLOUR);
  });
});
