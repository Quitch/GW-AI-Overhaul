"use strict";

// gwc_cost_artillery (Artillery Fabrication Tech) discounts the artillery
// structures and the mobile artillery, so a player holding any one of them is
// offered it. See tech-cards.md, "A card must be worth something to whoever is
// offered it".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");
const {
  GW_COMMON_STUB,
  makeInventory,
  maxChance,
} = require("../scripts/lib/card-probe.js");
const {
  createCapturingInventory,
  recordInto,
} = require("../scripts/lib/capturing-inventory.js");

registerModuleStub("shared/gw_common", GW_COMMON_STUB);
const card = loadCouiModule(path.join(CARDS_DIR, "gwc_cost_artillery.js"));
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);

function discountedUnits() {
  const mods = [];
  card.buff(
    createCapturingInventory({ capture: { addMods: recordInto(mods) } })
  );
  return [...new Set(mods.map((mod) => mod.file))];
}

describe("Artillery Fabrication Tech", () => {
  it("is offered for each unit it discounts, held alone", () => {
    const units = discountedUnits();
    assert.ok(units.includes(gwoUnit.grenadier), "the buff reaches mobiles");

    const unoffered = units.filter(
      (unit) => maxChance(card, makeInventory([unit])) === 0
    );
    assert.deepEqual(unoffered, []);
  });

  it("is not offered without artillery", () => {
    assert.equal(maxChance(card, makeInventory([gwoUnit.dox])), 0);
  });
});
