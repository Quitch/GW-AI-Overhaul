"use strict";

// race/bugs.js: the Bug Faction descriptor, its unit table, and what the
// capability cells make of Bugs' units - research included - against GWO's
// cards. Bugs' units come from the harvested fixture
// (test/fixtures/unit_types.json) when the mod's zip was on disk at harvest.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const bugs = loadCouiModule(MOD_ROOT + "/race/bugs.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const cardUnits = loadCouiModule(MOD_ROOT + "/gw_play/card_units.js");
const helpers = loadCouiModule(MOD_ROOT + "/gw_play/cards_deal_helpers.js");
const fixture = require("./fixtures/unit_types.json");

const bugsUnits = Object.keys(fixture.units).filter((unit) =>
  fixture.units[unit].includes("UNITTYPE_Custom2")
);

function bugsIndex() {
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
    race: cells.buildIndex(units, specs, cells.raceMember("Custom2")),
  };
}

describe("the Bugs descriptor", () => {
  it("is registered as shipped, with one commander and the Titans layout only", () => {
    const race = races.byId("bugs");

    assert.equal(race.id, "bugs");
    assert.deepEqual(race.serverMods, ["com.pa.ferretmaster.bugs"]);
    assert.equal(race.commanders.length, 1);
    assert.equal(race.unitTypeBit, "Custom2");
    assert.equal(race.commanderTypes.buildable, "CmdBuild & Custom2");
    assert.equal(race.ai.titans.sources.length, 4);
    assert.equal(race.ai.queller, undefined);
    assert.equal(races.supportedBy("Queller", "bugs"), false);
    assert.equal(races.brainFor("Queller", "bugs"), "Titans");
    assert.ok(race.playerIcon.fill && race.playerIcon.outline);
  });

  it("keys every Bugs spec by a Bugs name and names the units", () => {
    for (const [key, value] of Object.entries(bugs.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    for (const key of Object.keys(bugs.unitNames)) {
      assert.ok(key in bugs.units, key + " is named but not in units");
    }
    assert.ok(Object.keys(bugs.units).length >= 240);
    assert.equal(bugs.unitNames.crusher, "!LOC:Crusher");
  });
});

describe("Bugs under capability cells", () => {
  before(() => {
    if (bugsUnits.length) {
      races.setCells("bugs", bugsIndex());
    }
  });
  after(() => {
    races.reset();
    races.registerShipped();
  });

  it("fills the cells the starter set and the gwc_ cards open (skipped without Bugs in the fixture)", (t) => {
    if (!bugsUnits.length) {
      t.skip("fixture harvested without Bugs");
      return;
    }
    const index = races.cellsOf("bugs");
    for (const cell of [
      "Bot/Basic/Combat",
      "Vehicle/Basic/Combat",
      "Vehicle/Advanced/Combat",
      "Air/Basic/Combat",
      "Air/Advanced/Combat",
      "Orbital/Basic/Combat",
      "Bot/Basic/Fabber",
      "Bot/Basic/Factory",
      "Vehicle/Basic/Factory",
      "Land/Basic/Metal",
      "Land/Basic/Energy",
      "Land/Basic/Storage",
      "Land/Basic/Defense",
      "Land/Advanced/Superweapon",
      "Land/Basic/Intel",
      "Land/Basic/Teleporter",
      "Land/Basic/Commander",
    ]) {
      assert.ok(index.race.unitsByCell[cell], cell + " has no Bugs unit");
    }
    // The commander and the base spec commander-merge gives it.
    assert.ok(
      index.race.unitsByCell["Land/Basic/Commander"].includes(
        bugs.commanders[0].spec
      )
    );
  });

  it("grants the research factories with the factories and their unlock tokens with them", (t) => {
    if (!bugsUnits.length) {
      t.skip("fixture harvested without Bugs");
      return;
    }
    const index = races.cellsOf("bugs");
    const granted = cells.raceUnitsFor(
      [gwoUnit.botFactoryAdvanced],
      index.vanilla,
      index.race
    );

    assert.ok(granted.includes(bugs.units.crusherResearch), "research factory");
    assert.ok(granted.includes(bugs.units.crusherUnlock), "unlock token");
    assert.ok(
      !granted.includes(bugs.units.crusher),
      "the Crusher itself waits for its cell"
    );
  });

  it("withholds only the MLA-only cards", (t) => {
    if (!bugsUnits.length) {
      t.skip("fixture harvested without Bugs");
      return;
    }
    const inventory = { getTag: () => "bugs" };
    const withheld = cardUnits.cards
      .filter(
        (card) =>
          !helpers.raceCanDeal(races, inventory, card.id, cardUnits.cards)
      )
      .map((card) => card.id)
      .sort();
    const expected = cardUnits.cards
      .map((card) => card.id)
      .filter((id) => helpers.mlaOnlyCard(id))
      .sort();

    assert.deepEqual(withheld, expected);
  });
});
