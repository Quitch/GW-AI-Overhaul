"use strict";

// addon/second_wave.js: the Second Wave descriptor, its unit table, and what
// the capability cells make of its units for an MLA, Legion and Bugs player.
// The cells come from the harvested fixture (test/fixtures/unit_types.json),
// which carries the mod's units when its zip was on disk at harvest.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  zipsFor,
  fixtureIndex,
  inFixture,
} = require("../scripts/lib/addon-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const secondWave = loadCouiModule(MOD_ROOT + "/addon/second_wave.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const fixture = require("./fixtures/unit_types.json").units;

const ZIPS = ["pa.mla.unit.addon", "pa.mla.unit.addon.companion"];
const AUX = "/pa/ai/unit_maps/second_wave_aux.json";

const harvested = inFixture(secondWave);

describe("the Second Wave descriptor", () => {
  it("is registered as shipped, with an MLA, a Legion and a Bugs layer, the aux map MLA's alone", () => {
    const addon = races.addonById("second_wave");

    assert.equal(addon.id, "second_wave");
    assert.equal(addon.name, "!LOC:Second Wave");
    assert.deepEqual(addon.serverMods, ["pa.mla.unit.addon"]);
    assert.deepEqual(Object.keys(addon.layers), ["mla", "legion", "bugs"]);
    assert.ok(addon.layers.mla.titans.unitMaps.includes(AUX));
    assert.ok(!addon.layers.legion.titans.unitMaps.includes(AUX));
    assert.ok(!addon.layers.bugs.titans.unitMaps.includes(AUX));
    assert.equal(addon.layers.mla.titans.sources.length, 2);
    assert.equal(addon.layers.legion.titans.sources.length, 2);
    assert.deepEqual(addon.layers.bugs.titans.unitMaps, [
      "/pa/ai/unit_maps/second_wave_bugs.json",
    ]);
    assert.deepEqual(addon.layers.bugs.titans.sources, [
      { dir: "/pa/ai/fabber_builds/", match: "bugs/" },
    ]);
    assert.equal(addon.unitTypeBit, undefined);
    assert.equal(addon.commanders, undefined);
  });

  it("keys every Second Wave spec by a name of its own, and names each unit", () => {
    for (const [key, value] of Object.entries(secondWave.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    for (const [key, name] of Object.entries(secondWave.unitNames)) {
      assert.ok(key in secondWave.units, key + " is named but not in units");
      assert.match(name, /^!LOC:/, key);
    }
    assert.equal(Object.keys(secondWave.unitNames).length, 44);
    assert.equal(races.unitName("mla", secondWave.units.rex), "!LOC:Rex");
    assert.equal(
      races.unitName("legion", secondWave.units.beowulf),
      "!LOC:Beowulf"
    );
  });

  it("lists every unit the fixture harvested from the mod (skipped without it)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Second Wave");
      return;
    }
    const listed = new Set(Object.values(secondWave.units));
    // Exiles ships five units under /pa/units/addon/ too, by its own bit.
    const harvestedUnits = Object.keys(fixture).filter(
      (unit) =>
        /^\/pa\/units\/(addon|l_addon|b_addon)\//.test(unit) &&
        !fixture[unit].includes("UNITTYPE_Custom6")
    );
    assert.equal(harvestedUnits.length, 44);
    for (const unit of harvestedUnits) {
      assert.ok(listed.has(unit), unit + " is harvested but not in units");
    }
  });

  it("maps to files and AI data the installed zips ship (skipped without them)", (t) => {
    const zips = zipsFor(ZIPS);
    if (!zips) {
      t.skip("no Second Wave zip installed");
      return;
    }
    for (const [key, value] of Object.entries(secondWave.units)) {
      if (!/\/(addon|l_addon|b_addon)\//.test(value)) {
        continue;
      }
      assert.ok(zips.has(value.slice(1)), key + " -> " + value);
    }
    const names = zips.names();
    for (const layer of Object.values(secondWave.layers)) {
      for (const map of layer.titans.unitMaps) {
        assert.ok(zips.has(map.slice(1)), map);
      }
      for (const source of layer.titans.sources) {
        const prefix = (source.dir + source.match).slice(1);
        assert.ok(
          names.some((name) => name.startsWith(prefix)),
          "nothing under " + prefix
        );
      }
    }
    // The aux map holds MLA's builder aliases and nothing of Legion's: since
    // 0.16.1 no Legion build file reads it.
    const aux = zips.readJson(AUX.slice(1)).unit_map;
    assert.deepEqual(Object.keys(aux).sort(), [
      "AnyMLAAdvancedFabber",
      "AnyMLABasicFabber",
      "MLACommander",
      "MLASupportCommander",
    ]);
    assert.ok(!("LegionCommander" in aux));
  });

  it("names Bugs builders the Bugs mod's own map supplies (skipped without both zips)", (t) => {
    const zips = zipsFor(ZIPS);
    const bugs = zipsFor(["com.pa.ferretmaster.bugs"]);
    if (!zips || !bugs) {
      t.skip("no Second Wave or Bugs zip installed");
      return;
    }
    const map = bugs.readJson("pa/ai/unit_maps/bugs.json").unit_map;
    const referenced = new Set();
    for (const name of zips.names()) {
      if (!/^pa\/ai\/fabber_builds\/bugs\//.test(name)) {
        continue;
      }
      for (const build of zips.readJson(name).build_list || []) {
        for (const builder of build.builders || []) {
          referenced.add(builder);
        }
      }
    }
    assert.deepEqual([...referenced].sort(), [
      "AnyBugFabberAdvanced",
      "AnyBugFabberBasic",
      "BugCommander",
    ]);
    for (const builder of referenced) {
      assert.ok(builder in map, builder + " not in the Bugs map");
    }
  });
});

describe("Second Wave under capability cells", () => {
  it("brings its MLA units to an MLA player by cell, and its orphans by build reach (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Second Wave");
      return;
    }
    const index = fixtureIndex("mla");
    const fielded = (held) =>
      cells.addonUnitsFor(held, index.vanilla, index.race);

    assert.ok(
      fielded([gwoUnit.metalExtractor]).includes(
        secondWave.units.metalGenerator
      )
    );
    assert.ok(fielded([gwoUnit.dox]).includes(secondWave.units.rex));
    assert.ok(fielded([gwoUnit.atlas]).includes(secondWave.units.juno));
    // The advanced towers and storages sit in cells no vanilla unit fills:
    // an advanced fabber builds them.
    const advanced = fielded([gwoUnit.botFabberAdvanced]);
    for (const key of [
      "advancedFabricationTower",
      "advancedEnergyStorage",
      "advancedMetalStorage",
    ]) {
      assert.ok(advanced.includes(secondWave.units[key]), key);
    }
    assert.ok(
      !fielded([gwoUnit.dox]).includes(
        secondWave.units.advancedFabricationTower
      )
    );
  });

  it("brings its Legion and Bugs units to those races by the bit rule (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Second Wave");
      return;
    }
    const legion = fixtureIndex("legion");
    const legionFielded = cells.raceUnitsFor(
      [gwoUnit.atlas, gwoUnit.botFabberAdvanced, gwoUnit.metalExtractor],
      legion.vanilla,
      legion.race
    );
    for (const key of [
      "beowulf",
      "advancedFabricationTurret",
      "gigasiloStorageDevice",
      "massGenerator",
    ]) {
      assert.ok(legionFielded.includes(secondWave.units[key]), key);
    }
    assert.ok(!legionFielded.includes(secondWave.units.juno));

    const bugs = fixtureIndex("bugs");
    const bugsFielded = cells.raceUnitsFor(
      [gwoUnit.metalExtractor, gwoUnit.botFabberAdvanced],
      bugs.vanilla,
      bugs.race
    );
    assert.ok(bugsFielded.includes(secondWave.units.metalGeneratorBugs));
    assert.ok(
      bugsFielded.includes(secondWave.units.advancedFabricationTowerBugs)
    );
    assert.ok(!bugsFielded.includes(secondWave.units.metalGenerator));
  });

  it("keeps its units out of the vanilla side of every index (skipped without it in the fixture)", (t) => {
    if (!harvested) {
      t.skip("fixture harvested without Second Wave");
      return;
    }
    const index = fixtureIndex("mla");
    for (const unit of Object.values(secondWave.units)) {
      assert.equal(index.vanilla.cellOf[unit], undefined, unit);
    }
    assert.equal(
      index.race.cellOf[secondWave.units.metalGenerator],
      "Land/Basic/Metal"
    );
  });
});
