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

const commanderColour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"
);

// pick() hands back the minion's own colour once the palette runs out.
function subCommanderPalette(faction) {
  const fallback = [
    [1, 2, 3],
    [4, 5, 6],
  ];
  const palette = [];
  for (let count = 0; ; count++) {
    const picked = commanderColour.pick(faction, fallback, count);
    if (picked === fallback) {
      return palette;
    }
    palette.push(picked[0]);
  }
}

// The base game's brightness rule for a lobby colour, which the co-op
// resolver applies to every palette entry.
function adjusted(colour) {
  return colour.includes(255)
    ? colour.map((channel) => Math.round((channel * 14) / 16))
    : colour;
}

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
        faction.coopPlayerColors.slice(1).forEach((colour) => {
          [colour, adjusted(colour)].forEach((shown) => {
            assert.ok(
              !subCommanders.some((entry) => lodash.isEqual(entry, shown)),
              JSON.stringify(shown)
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

  // As the base game resolves them: every player after the host takes the next
  // palette entry, none skipped as a repeat and none from the lobby fallback.
  it("colours six players from the palette alone, each differently", (t) => {
    const source = stockFile(
      "ui/main/game/galactic_war/shared/js/gw_coop_player_colors.js"
    );
    if (!source) {
      t.skip("no PA install");
      return;
    }

    let colours;
    new Function("define", "_", source)((factory) => {
      colours = factory();
    }, lodash);

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
});
