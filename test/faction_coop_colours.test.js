"use strict";

// The five shipped factions' co-op player palettes, against the Sub Commander
// palettes in gw_play/commander_colour.js. See coop.md, "Colour allocation".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const lodash = require("lodash");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { mediaDir } = require("../scripts/lib/pa-install.js");

const FACTIONS = [0, 1, 2, 3].map((index) =>
  loadCouiModule(
    "coui://ui/main/game/galactic_war/shared/js/gw_faction_" + index + ".js"
  )
);
FACTIONS.push(
  loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_faction.js"
  )
);
const SYNCHRONOUS = 2;
const MIN_DISTANCE = 30;
// The base game's lobby Indigo, the colour its picker offers that shows a
// strategic icon's black symbol worst.
const DARKEST_LOBBY_COLOUR = [75, 0, 130];

// WCAG contrast ratio against black, the colour of a strategic icon's symbol.
function contrastWithBlack(colour) {
  const linear = colour.map((channel) => {
    const value = channel / 255;
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });
  const luminance =
    0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  return (luminance + 0.05) / 0.05;
}

const commanderColour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"
);

function subCommanderPalette(faction) {
  const minion = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  const palette = [];
  for (let count = 0; count < commanderColour.paletteSize(faction); count++) {
    palette.push(commanderColour.pick(faction, minion, count)[0]);
  }
  return palette;
}

// The palette, and the colour every Sub Commander past it shares.
function withSpentColour(index, faction) {
  return subCommanderPalette(index).concat([
    commanderColour.pick(index, faction.minions[0].color, 99)[0],
  ]);
}

// The base game's brightness rule for a lobby colour, which the co-op
// resolver applies to every palette entry.
function adjusted(colour) {
  return colour.includes(255)
    ? colour.map((channel) => Math.round((channel * 14) / 16))
    : colour;
}

// Players 7 to 12 of each faction (a war seats up to 12), which take the base
// game's lobby colours nearest the host's once coopPlayerColors runs out.
const LOBBY_PLAYERS = [
  [
    [0, 223, 223],
    [0, 112, 223],
    [51, 151, 197],
    [32, 178, 170],
    [100, 149, 237],
    [0, 250, 154],
  ],
  [
    [147, 122, 219],
    [160, 32, 240],
    [218, 112, 214],
    [128, 128, 128],
    [100, 149, 237],
    [164, 164, 164],
  ],
  [
    [111, 223, 186],
    [164, 164, 164],
    [50, 184, 50],
    [128, 128, 128],
    [124, 252, 0],
    [223, 191, 162],
  ],
  [
    [223, 60, 0],
    [223, 0, 0],
    [223, 87, 62],
    [223, 105, 41],
    [161, 59, 59],
    [139, 69, 19],
  ],
  [
    [164, 164, 164],
    [142, 107, 68],
    [147, 122, 219],
    [72, 89, 61],
    [223, 140, 107],
    [70, 70, 70],
  ],
];

function stockFile(relative) {
  const file = path.join(mediaDir(), relative);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined;
}

describe("shipped faction co-op palettes", () => {
  FACTIONS.forEach((faction, index) => {
    describe(faction.name, () => {
      it("holds the faction colour and five more", () => {
        assert.equal(faction.coopPlayerColors.length, 6);
        assert.deepEqual(faction.coopPlayerColors[0], faction.color[0]);
      });

      // Neither the entry nor the colour the resolver makes of it.
      it("gives no player a Sub Commander's colour", () => {
        const subCommanders = subCommanderPalette(index);
        assert.ok(subCommanders.length > 1);
        faction.coopPlayerColors.forEach((colour) => {
          [colour, adjusted(colour)].forEach((shown) => {
            assert.ok(
              !subCommanders.some((entry) => lodash.isEqual(entry, shown)),
              JSON.stringify(shown)
            );
          });
        });
      });

      it("gives no player the colour of a Sub Commander past the palette", () => {
        const subCommanders = subCommanderPalette(index);
        [commanderColour.paletteSize(index), 99].forEach((count) => {
          const spent = commanderColour.pick(
            index,
            faction.minions[0].color,
            count
          )[0];
          assert.ok(
            !subCommanders.some((entry) => lodash.isEqual(entry, spent)),
            JSON.stringify(spent)
          );
          faction.coopPlayerColors.forEach((colour) => {
            [colour, adjusted(colour)].forEach((shown) => {
              assert.notDeepEqual(spent, shown);
            });
          });
        });
      });

      // Euclidean RGB distance: a near-match looks the same in battle.
      it("keeps every Sub Commander colour well away from every player's", () => {
        const subCommanders = withSpentColour(index, faction);
        const players = faction.coopPlayerColors
          .concat(faction.coopPlayerColors.map(adjusted))
          .concat(LOBBY_PLAYERS[index]);
        subCommanders.forEach((entry) => {
          players.forEach((player) => {
            const [red, green, blue] = entry.map(
              (channel, i) => channel - player[i]
            );
            assert.ok(
              Math.hypot(red, green, blue) >= MIN_DISTANCE,
              JSON.stringify(entry) + " near " + JSON.stringify(player)
            );
          });
        });
      });

      it("shows black icon symbols on every army at least as well as the lobby does", () => {
        const floor = contrastWithBlack(DARKEST_LOBBY_COLOUR);
        withSpentColour(index, faction)
          .concat(faction.coopPlayerColors.map(adjusted))
          .forEach((colour) => {
            assert.ok(
              contrastWithBlack(colour) >= floor,
              JSON.stringify(colour)
            );
          });
      });

      it("gives no Sub Commander the colour of players 7 to 12", () => {
        const subCommanders = withSpentColour(index, faction);
        LOBBY_PLAYERS[index].forEach((player) => {
          assert.ok(
            !subCommanders.some((entry) => lodash.isEqual(entry, player)),
            JSON.stringify(player)
          );
        });
      });
    });
  });

  // An enemy AI of one faction fights the players and Sub Commanders of another.
  it("keeps every AI colour well away from every other faction's armies", () => {
    FACTIONS.forEach((faction, index) => {
      FACTIONS.forEach((other, otherIndex) => {
        if (otherIndex === index) {
          return;
        }
        const armies = other.coopPlayerColors
          .concat(other.coopPlayerColors.map(adjusted))
          .concat(LOBBY_PLAYERS[otherIndex])
          .concat(withSpentColour(otherIndex, other));
        withSpentColour(index, faction).forEach((entry) => {
          armies.forEach((army) => {
            const [red, green, blue] = entry.map(
              (channel, i) => channel - army[i]
            );
            assert.ok(
              Math.hypot(red, green, blue) >= MIN_DISTANCE,
              faction.name +
                " " +
                JSON.stringify(entry) +
                " near " +
                other.name +
                " " +
                JSON.stringify(army)
            );
          });
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

    let colours;
    new Function("define", "_", source)((factory) => {
      colours = factory();
    }, lodash);
    return colours;
  }

  // As the base game resolves them: every player after the host takes the next
  // palette entry, none skipped as a repeat and none from the lobby fallback.
  it("colours six players from the palette alone, each differently", (t) => {
    const colours = stockColours(t);
    if (!colours) {
      return;
    }

    FACTIONS.forEach((faction) => {
      const pairs = colours.resolvePlayerColorPairs(6, faction, faction.color);
      const primaries = pairs.map((pair) => pair[0]);
      assert.deepEqual(primaries[0], faction.color[0], faction.name);
      assert.deepEqual(
        primaries.slice(1),
        faction.coopPlayerColors.slice(1).map(adjusted),
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
    const colours = stockColours(t);
    if (!colours) {
      return;
    }

    FACTIONS.forEach((faction, index) => {
      const pairs = colours.resolvePlayerColorPairs(12, faction, faction.color);
      assert.deepEqual(
        pairs.slice(6).map((pair) => pair[0]),
        LOBBY_PLAYERS[index],
        faction.name
      );
    });
  });

  it("measures icon contrast against the lobby's darkest colour", (t) => {
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
      .sort((a, b) => contrastWithBlack(a) - contrastWithBlack(b));
    assert.deepEqual(darkest, DARKEST_LOBBY_COLOUR);
  });
});
