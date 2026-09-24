"use strict";

// Tsunami Tech's weight grows with the naval cards held. The card names them,
// so an unrelated id that happens to contain "_sea" does not count.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");

const card = loadCouiModule(path.join(CARDS_DIR, "gwaio_enable_tsunami.js"));

function chanceWith(cardIds) {
  const inventory = {
    cards: () => cardIds.map((id) => ({ id })),
    hasCard: (id) => cardIds.includes(id),
  };
  return card.deal({}, {}, inventory).chance;
}

describe("gwaio_enable_tsunami deal", () => {
  it("adds 15 per naval card held, capped at 90", () => {
    assert.equal(chanceWith([]), 30);
    assert.equal(chanceWith(["gwc_damage_sea"]), 45);
    assert.equal(chanceWith(["gwaio_anti_sea", "gwaio_cooldown_sea"]), 60);
    assert.equal(
      chanceWith([
        "gwc_combat_sea",
        "gwc_cost_sea",
        "gwc_enable_sea_all",
        "gwc_health_sea",
        "gwc_speed_sea",
      ]),
      90
    );
  });

  it("ignores an id that only contains _sea", () => {
    assert.equal(chanceWith(["mym_seaside_tech", "gwc_damage_seal"]), 30);
  });

  it("is withheld by a naval start or Orbital Bombardment", () => {
    assert.equal(chanceWith(["gwaio_start_naval", "gwc_damage_sea"]), 0);
    assert.equal(chanceWith(["gwaio_enable_orbitalbombardment"]), 0);
  });
});
