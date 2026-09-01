"use strict";

// race/exiles.js: the Exiles descriptor, its unit table, and what the
// capability cells make of Exiles' units against GWO's cards. Exiles' units
// come from the harvested fixture (test/fixtures/unit_types.json) when the
// mod's zip was on disk at harvest.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const exiles = loadCouiModule(MOD_ROOT + "/race/exiles.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const cardUnits = loadCouiModule(MOD_ROOT + "/gw_play/card_units.js");
const helpers = loadCouiModule(MOD_ROOT + "/gw_play/cards_deal_helpers.js");
const fixture = require("./fixtures/unit_types.json");

// Exiles fields no orbital unit beyond its launcher, so every card naming
// only orbital units is withheld. A change here is a balance decision.
const WITHHELD_BY_CELLS = [
  "gwaio_cooldown_orbital",
  "gwc_combat_orbital",
  "gwc_cost_orbital",
  "gwc_damage_orbital",
  "gwc_enable_orbital_all",
  "gwc_enable_orbital_t2",
  "gwc_health_orbital",
  "gwc_speed_orbital",
];

const exilesUnits = Object.keys(fixture.units).filter((unit) =>
  fixture.units[unit].includes("UNITTYPE_Custom6")
);

function exilesIndex() {
  const specs = {};
  for (const [unit, types] of Object.entries(fixture.units)) {
    specs[unit] = { unit_types: types };
    if (fixture.buildable && fixture.buildable[unit]) {
      specs[unit].buildable_types = fixture.buildable[unit];
    }
  }
  const units = Object.keys(specs);
  return {
    vanilla: cells.buildIndex(units, specs, cells.vanillaMember),
    race: cells.buildIndex(units, specs, cells.raceMember("Custom6")),
  };
}

describe("the Exiles descriptor", () => {
  it("is registered as shipped, with four commanders and the Titans layout only", () => {
    const race = races.byId("exiles");

    assert.equal(race.id, "exiles");
    assert.deepEqual(race.serverMods, ["com.pa.nik.exiles"]);
    assert.equal(race.commanders.length, 4);
    assert.equal(race.unitTypeBit, "Custom6");
    assert.equal(race.commanderArtHue, 200);
    assert.equal(race.commanderTypes.buildable, "CmdBuild & Custom6");
    assert.equal(race.ai.titans.sources.length, 4);
    assert.equal(race.ai.queller, undefined);
    assert.equal(races.brainFor("Queller", "exiles"), "Titans");
    assert.ok(race.playerIcon.fill && race.playerIcon.outline);
  });

  it("keys every Exiles spec by an Exiles name and names the units", () => {
    for (const [key, value] of Object.entries(exiles.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    for (const key of Object.keys(exiles.unitNames)) {
      assert.ok(key in exiles.units, key + " is named but not in units");
    }
    assert.ok(Object.keys(exiles.units).length >= 280);
    assert.equal(exiles.unitNames.maximCommander, "Maxim Commander");
  });
});

describe("Exiles under capability cells", () => {
  before(() => {
    if (exilesUnits.length) {
      races.setCells("exiles", exilesIndex());
    }
  });
  after(() => {
    races.reset();
    races.registerShipped();
  });

  it("fills the land, air and naval cells the starter set and the gwc_ cards open (skipped without Exiles in the fixture)", (t) => {
    if (!exilesUnits.length) {
      t.skip("fixture harvested without Exiles");
      return;
    }
    const index = races.cellsOf("exiles");
    for (const cell of [
      "Bot/Basic/Combat",
      "Bot/Advanced/Combat",
      "Vehicle/Basic/Combat",
      "Vehicle/Advanced/Combat",
      "Air/Basic/Combat",
      "Air/Advanced/Combat",
      "Naval/Basic/Combat",
      "Bot/Basic/Fabber",
      "Vehicle/Basic/Factory",
      "Orbital/Basic/Factory",
      "Land/Basic/Metal",
      "Land/Basic/Energy",
      "Land/Basic/Storage",
      "Land/Basic/Defense",
      "Land/Advanced/Superweapon",
      "Land/Basic/Intel",
      "Land/Basic/Teleporter",
      "Land/Basic/Commander",
    ]) {
      assert.ok(index.race.unitsByCell[cell], cell + " has no Exiles unit");
    }
    assert.equal(index.race.unitsByCell["Orbital/Basic/Combat"], undefined);
    assert.equal(index.race.unitsByCell["Land/Basic/Commander"].length, 4);
  });

  it("withholds the MLA-only cards and the orbital cards", (t) => {
    if (!exilesUnits.length) {
      t.skip("fixture harvested without Exiles");
      return;
    }
    const inventory = { getTag: () => "exiles" };
    const withheld = cardUnits.cards
      .filter(
        (card) =>
          !helpers.raceCanDeal(races, inventory, card.id, cardUnits.cards)
      )
      .map((card) => card.id)
      .sort();
    const expected = cardUnits.cards
      .map((card) => card.id)
      .filter((id) => helpers.mlaOnlyCard(id) || WITHHELD_BY_CELLS.includes(id))
      .sort();

    assert.deepEqual(withheld, expected);
    assert.ok(!withheld.includes("gwc_combat_bots"));
  });
});
