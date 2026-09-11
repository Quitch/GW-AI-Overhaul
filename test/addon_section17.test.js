"use strict";

// addon/section17.js: the Section 17 descriptor, its unit table, and what
// the capability cells make of its units - four of them exclusive, reached
// only through its gantries. The cells come from the harvested fixture
// (test/fixtures/unit_types.json), which carries the mod's units when its
// zip was on disk at harvest.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  zipsFor,
  fixtureIndex,
  inFixture,
} = require("../scripts/lib/addon-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const section17 = loadCouiModule(MOD_ROOT + "/addon/section17.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const fixture = require("./fixtures/unit_types.json").units;

const ZIPS = ["com.pa.daedelus.experimentals"];
const EXCLUSIVE_KEYS = ["bigBill", "floater", "horntail", "pineapple"];

const harvested = inFixture(section17);

describe("the Section 17 descriptor", () => {
  it("is registered as shipped, with an MLA layer of flat files named for their units", () => {
    const addon = races.addonById("section17");

    assert.equal(addon.id, "section17");
    assert.equal(addon.name, "!LOC:Section 17");
    assert.deepEqual(addon.serverMods, ["com.pa.daedelus.experimentals"]);
    assert.deepEqual(Object.keys(addon.layers), ["mla"]);
    assert.deepEqual(addon.layers.mla.titans.unitMaps, [
      "/pa/ai/unit_maps/s17_paeiou.json",
    ]);
    assert.equal(addon.layers.mla.titans.sources.length, 7);
    for (const source of addon.layers.mla.titans.sources) {
      assert.match(source.match, /^[a-z_]+\.json$/, source.match);
    }
  });

  it("keys every Section 17 spec by a name of its own, and names each unit", () => {
    for (const [key, value] of Object.entries(section17.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    for (const [key, name] of Object.entries(section17.unitNames)) {
      assert.ok(key in section17.units, key + " is named but not in units");
      assert.match(name, /^!LOC:/, key);
    }
    assert.equal(Object.keys(section17.unitNames).length, 23);
    // The larva ships a bare display name; the table prefixes it.
    assert.equal(
      section17.unitNames.horntailNanoswarmBomb,
      "!LOC:Horntail Nanoswarm Bomb"
    );
    for (const key of EXCLUSIVE_KEYS) {
      assert.ok(section17.units[key], key);
    }
  });

  it("lists every unit the fixture harvested from the mod (skipped without it)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Section 17");
      return;
    }
    const listed = new Set(Object.values(section17.units));
    const harvestedUnits = Object.keys(fixture).filter((unit) =>
      unit.startsWith("/pa/units/paeiou/")
    );
    assert.equal(harvestedUnits.length, 23);
    for (const unit of harvestedUnits) {
      assert.ok(listed.has(unit), unit + " is harvested but not in units");
    }
  });

  it("maps to files and AI data the installed zip ships (skipped without it)", (t) => {
    const zips = zipsFor(ZIPS);
    if (!zips) {
      t.skip("no Section 17 zip installed");
      return;
    }
    for (const [key, value] of Object.entries(section17.units)) {
      // A few parts are the vanilla ones the mod's units reuse.
      if (!value.startsWith("/pa/units/paeiou/")) {
        continue;
      }
      assert.ok(zips.has(value.slice(1)), key + " -> " + value);
    }
    const layer = section17.layers.mla.titans;
    for (const map of layer.unitMaps) {
      assert.ok(zips.has(map.slice(1)), map);
    }
    for (const source of layer.sources) {
      assert.ok(zips.has((source.dir + source.match).slice(1)), source.match);
    }
  });

  it("names builder aliases its own map lacks - Second Wave's aux map supplies them (skipped without the zip)", (t) => {
    const zips = zipsFor(ZIPS);
    if (!zips) {
      t.skip("no Section 17 zip installed");
      return;
    }
    const map = zips.readJson("pa/ai/unit_maps/s17_paeiou.json").unit_map;
    const referenced = new Set();
    for (const name of zips.names()) {
      if (!/^pa\/ai\/fabber_builds\//.test(name)) {
        continue;
      }
      for (const build of zips.readJson(name).build_list || []) {
        for (const builder of build.builders || []) {
          referenced.add(builder);
        }
      }
    }
    for (const alias of ["AnyMLABasicFabber", "MLACommander"]) {
      assert.ok(referenced.has(alias), alias + " no longer referenced");
      assert.ok(!(alias in map), alias + " now in the mod's own map");
    }
  });
});

describe("Section 17 under capability cells", () => {
  it("marks the gantry builds exclusive: no cell, reached only through a gantry (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Section 17");
      return;
    }
    const index = fixtureIndex("mla");
    const exclusives = EXCLUSIVE_KEYS.map((key) => section17.units[key]);

    assert.deepEqual(Object.keys(index.race.exclusive).sort(), exclusives);
    for (const unit of exclusives) {
      assert.ok(!index.race.units.includes(unit), unit);
    }
    assert.equal(
      index.race.cellOf[section17.units.experimentalGantry],
      "Land/Basic/Factory"
    );
    assert.equal(index.vanilla.unitsByCell["Land/Basic/Factory"], undefined);

    const fielded = cells.addonUnitsFor(
      [gwoUnit.botFabberAdvanced],
      index.vanilla,
      index.race
    );
    assert.ok(fielded.includes(section17.units.experimentalGantry));
    for (const unit of exclusives) {
      assert.ok(fielded.includes(unit), unit);
    }
    const basic = cells.addonUnitsFor(
      [gwoUnit.botFabber, gwoUnit.dox],
      index.vanilla,
      index.race
    );
    assert.ok(!basic.includes(section17.units.experimentalGantry));
    for (const unit of exclusives) {
      assert.ok(!basic.includes(unit), unit);
    }
  });

  it("gives Legion its own gantry and, through it, the same exclusives (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Section 17");
      return;
    }
    const index = fixtureIndex("legion");
    const fielded = cells.raceUnitsFor(
      [gwoUnit.botFabberAdvanced],
      index.vanilla,
      index.race
    );

    assert.ok(fielded.includes(section17.units.experimentalGantryLegion));
    assert.ok(!fielded.includes(section17.units.experimentalGantry));
    for (const key of EXCLUSIVE_KEYS) {
      assert.ok(fielded.includes(section17.units[key]), key);
    }
  });

  it("never grants the NoBuild larva, and brings the solar cell with basic energy (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Section 17");
      return;
    }
    const index = fixtureIndex("mla");
    const everything = cells.addonUnitsFor(
      index.vanilla.units,
      index.vanilla,
      index.race
    );

    assert.ok(!everything.includes(section17.units.horntailNanoswarmBomb));
    assert.ok(
      cells
        .addonUnitsFor([gwoUnit.energyPlant], index.vanilla, index.race)
        .includes(section17.units.solarCell)
    );
  });
});
