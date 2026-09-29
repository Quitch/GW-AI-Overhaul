"use strict";

// addon/osmech.js: the Osmech descriptor, its unit table, and what the
// capability cells make of its units for an MLA player. Osmech ships no AI
// data, so it has no layers. The cells come from the harvested fixture
// (test/fixtures/unit_types.json), which carries the mod's units when the
// mod was on disk at harvest.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  modFiles,
  fixtureIndex,
  inFixture,
} = require("../scripts/lib/addon-fixture.js");

const osmech = loadCouiModule(MOD_ROOT + "/addon/osmech.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const fixture = require("./fixtures/unit_types.json").units;

const MODS = ["com.pa.loloares.thorosmen", "com.pa.loloares.thorosmen-client"];

const harvested = inFixture(osmech);

describe("the Osmech descriptor", () => {
  it("is registered as shipped, with no AI layer at all", () => {
    const addon = races.addonById("osmech");

    assert.equal(addon.id, "osmech");
    assert.equal(addon.name, "!LOC:Osmech");
    assert.deepEqual(addon.serverMods, ["com.pa.loloares.thorosmen"]);
    assert.deepEqual(addon.layers, {});
    races.activateAddons(["second_wave", "section17", "osmech"]);
    try {
      assert.deepEqual(races.layersFor("titans").mla.sources, [
        ...races.addonById("second_wave").layers.mla.titans.sources,
        ...races.addonById("section17").layers.mla.titans.sources,
      ]);
    } finally {
      races.activateAddons([]);
    }
  });

  it("keys every Osmech spec by a name of its own, and names each unit", () => {
    for (const [key, value] of Object.entries(osmech.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    for (const [key, name] of Object.entries(osmech.unitNames)) {
      assert.ok(key in osmech.units, key + " is named but not in units");
      assert.match(name, /^!LOC:/, key);
    }
    assert.equal(Object.keys(osmech.unitNames).length, 45);
    assert.equal(races.unitName("mla", osmech.units.tripod), "!LOC:Tripod");
  });

  it("lists every unit the fixture harvested from the mod (skipped without it)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Osmech");
      return;
    }
    const listed = new Set(Object.values(osmech.units));
    const harvestedUnits = Object.keys(fixture).filter((unit) =>
      unit.startsWith("/pa/units/thorosmen/")
    );
    assert.equal(harvestedUnits.length, 45);
    for (const unit of harvestedUnits) {
      assert.ok(listed.has(unit), unit + " is harvested but not in units");
    }
  });

  it("maps to files the installed mods ship (skipped without them)", (t) => {
    const files = modFiles(MODS);
    if (!files) {
      t.skip("no Osmech mod on disk");
      return;
    }
    for (const [key, value] of Object.entries(osmech.units)) {
      if (!value.includes("/thorosmen/") && !value.includes("/st_")) {
        continue;
      }
      assert.ok(files.has(value.slice(1)), key + " -> " + value);
    }
  });
});

describe("Osmech under capability cells", () => {
  it("brings its titans with the vanilla titans and its bots by job (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Osmech");
      return;
    }
    const index = fixtureIndex("mla");
    const fielded = (held) =>
      cells.addonUnitsFor(held, index.vanilla, index.race);

    const titans = fielded([gwoUnit.atlas]);
    for (const key of ["atAt", "tripod", "toblerone", "theEgg"]) {
      assert.ok(titans.includes(osmech.units[key]), key);
    }
    // The Spartak is Heavy, the Spark's job. The Dagua's Hover is no basic
    // vanilla bot's, so the bots whose jobs no add-on unit shares bring it.
    const bots = fielded([gwoUnit.spark, gwoUnit.grenadier]);
    for (const key of ["dagua", "spartak"]) {
      assert.ok(bots.includes(osmech.units[key]), key);
    }
    assert.ok(!fielded([gwoUnit.dox]).includes(osmech.units.dagua));
    assert.ok(!fielded([gwoUnit.grenadier]).includes(osmech.units.spartak));
    assert.ok(!bots.includes(osmech.units.tripod));
    assert.equal(index.race.exclusive[osmech.units.tripod], undefined);
  });

  it("reaches every Osmech unit from the full vanilla list (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Osmech");
      return;
    }
    const index = fixtureIndex("mla");
    const everything = cells.addonUnitsFor(
      index.vanilla.units,
      index.vanilla,
      index.race
    );
    const missing = Object.values(osmech.units).filter(
      (unit) =>
        Object.prototype.hasOwnProperty.call(fixture, unit) &&
        !everything.includes(unit)
    );

    assert.deepEqual(missing, []);
  });
});
