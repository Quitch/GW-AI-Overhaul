"use strict";

// gw_play/conquest_announce.js: the elimination popup formatter. The harness
// supplies an identity loc, so expected strings carry the literal !LOC token.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_announce.js"
);

const DEFAULT_ICON_DIR = "coui://ui/main/game/galactic_war/shared/img/";

function wrap(inner) {
  return '<div class="gwo-conquest-elim">' + inner + "</div>";
}

function iconSpan(rgb, url) {
  return (
    '<span class="gwo-conquest-elim-icon" style="background-color:rgb(' +
    rgb +
    ");-webkit-mask-image:url('" +
    url +
    "')\"></span>"
  );
}

// cfg.factions is deliberately not the identity mapping, so a test passing
// proves team indices are translated to faction indices before lookup.
function setup() {
  return makeFactory({
    factions: [
      { name: "Foundation", color: [[145, 87, 199]] },
      { name: "Legion", color: [[255, 0, 0]] },
      {
        name: "Custom",
        icon: "coui://custom/icon.png",
        color: [[1, 2, 3]],
      },
    ],
    cfg: { factions: [2, 0, 1] },
    playerFaction: 1,
  });
}

describe("conquest_announce", () => {
  it("renders winner icon and name, then the loser, from byTeam", () => {
    assert.equal(
      setup().message([{ team: 1, byTeam: 2 }]),
      wrap(
        iconSpan("255,0,0", DEFAULT_ICON_DIR + "icon_faction_1.png") +
          " Legion !LOC:defeated Foundation " +
          iconSpan("145,87,199", DEFAULT_ICON_DIR + "icon_faction_0.png")
      )
    );
  });

  it("resolves a missing byTeam to the player's faction", () => {
    const message = setup().message([{ team: 2 }]);
    assert.ok(
      message.startsWith(
        '<div class="gwo-conquest-elim">' +
          iconSpan("255,0,0", DEFAULT_ICON_DIR + "icon_faction_1.png") +
          " Legion !LOC:defeated"
      )
    );
  });

  it("prefers a faction's explicit icon over the indexed default", () => {
    assert.equal(
      setup().message([{ team: 0, byTeam: 1 }]),
      wrap(
        iconSpan("145,87,199", DEFAULT_ICON_DIR + "icon_faction_0.png") +
          " Foundation !LOC:defeated Custom " +
          iconSpan("1,2,3", "coui://custom/icon.png")
      )
    );
  });

  it("renders an unknown faction as ? with no icon", () => {
    assert.equal(
      setup().message([{ team: 5, byTeam: 1 }]),
      wrap(
        iconSpan("145,87,199", DEFAULT_ICON_DIR + "icon_faction_0.png") +
          " Foundation !LOC:defeated ?"
      )
    );
  });

  it("joins multiple eliminations with a line break", () => {
    const lines = setup().message([{ team: 1, byTeam: 2 }, { team: 0 }]);
    assert.equal(lines.split("<br>").length, 2);
  });
});
