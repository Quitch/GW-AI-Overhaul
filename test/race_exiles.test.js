"use strict";

// race/exiles.js: the Exiles descriptor, its unit table, and what the
// capability cells make of Exiles' units against GWO's cards. Exiles' units
// come from the harvested fixture (test/fixtures/unit_types.json) when the
// mod's zip was on disk at harvest.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");

const exiles = loadCouiModule(MOD_ROOT + "/race/exiles.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const {
  withheldCards,
  expectedWithheld,
  unnamedCardUnits,
} = require("../scripts/lib/harvested-race.js");
const { fixtureIndex } = require("../scripts/lib/addon-fixture.js");
const fixture = require("./fixtures/unit_types.json");

// Exiles has no orbital unit beyond its launcher, which builds MLA's, so the
// cards naming only orbital units are dealt for those. A change here is a
// balance decision.
const ORBITAL_CARDS = [
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

describe("the Exiles descriptor", () => {
  it("is registered as shipped, with four commanders and the Titans layout only", () => {
    const race = races.byId("exiles");

    assert.equal(race.id, "exiles");
    assert.deepEqual(race.serverMods, ["com.pa.nik.exiles"]);
    assert.equal(race.commanders.length, 4);
    assert.equal(race.unitTypeBit, "Custom6");
    assert.equal(race.commanderArtHue, 200);
    assert.equal(race.commanderTypes.buildable, "CmdBuild & Custom6");
    assert.deepEqual(race.commanderTypes.metalExtractorNames, {
      basic: "ExilesBasicMetalExtractor",
      advanced: "ExilesAdvancedMetalExtractor",
    });
    assert.deepEqual(race.engineKeys, {
      BasicVehicleFactory: "/pa/units/land/t_tank_fac/t_tank_fac.json",
      BasicBotFactory: "/pa/units/land/t_bot_fac/t_bot_fac.json",
      BasicAirFactory: "/pa/units/air/t_air_fac/t_air_fac.json",
      BasicNavalFactory: "/pa/units/sea/t_naval_fac/t_naval_fac.json",
      OrbitalLauncher:
        "/pa/units/orbital/t_orbital_launcher/t_orbital_launcher.json",
      AntiNukeSilo:
        "/pa/units/land/t_anti_nuke_launcher/t_anti_nuke_launcher.json",
      ControlModule: "/pa/units/addon/t_control_module/t_control_module.json",
    });
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
    for (const [key, name] of Object.entries(exiles.unitNames)) {
      assert.ok(key in exiles.units, key + " is named but not in units");
      assert.match(name, /^!LOC:/, key);
    }
    assert.ok(Object.keys(exiles.units).length >= 280);
    assert.equal(exiles.unitNames.maximCommander, "!LOC:Maxim Commander");
  });
});

describe("Exiles under capability cells", () => {
  before(() => {
    if (exilesUnits.length) {
      races.setCells("exiles", fixtureIndex("exiles"));
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

  it("fields the fabrication complex from a basic fabber, past the Deep Space Radar stub (skipped without Exiles in the fixture)", (t) => {
    if (!exilesUnits.length) {
      t.skip("fixture harvested without Exiles");
      return;
    }
    const index = races.cellsOf("exiles");
    assert.equal(
      index.vanilla.cellOf[gwoUnit.deepSpaceOrbitalRadar],
      undefined
    );
    assert.ok(
      cells
        .raceUnitsFor([gwoUnit.botFabber], index.vanilla, index.race)
        .includes(exiles.units.fabricationComplex)
    );
  });

  it("withholds the MLA-only cards, and deals the orbital cards for the MLA units its launcher builds", (t) => {
    if (!exilesUnits.length) {
      t.skip("fixture harvested without Exiles");
      return;
    }
    const withheld = withheldCards("exiles");

    assert.deepEqual(withheld, expectedWithheld([]));
    assert.ok(!withheld.includes("gwc_combat_bots"));
    for (const card of ORBITAL_CARDS) {
      assert.ok(!withheld.includes(card), card);
    }
  });

  it("names every unit the tooltip lists for a card Exiles can be dealt (skipped without Exiles in the fixture)", (t) => {
    if (!exilesUnits.length) {
      t.skip("fixture harvested without Exiles");
      return;
    }
    assert.deepEqual(unnamedCardUnits("exiles"), []);
  });
});
