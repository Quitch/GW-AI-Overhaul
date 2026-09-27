"use strict";

// The job rule of shared/unit_cells.js over the harvested fixture
// (test/fixtures/unit_types.json), each index built as race_cells.js builds
// it: every shipped race's, and the add-on index. See races.md, "Jobs".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { fixtureIndex } = require("../scripts/lib/addon-fixture.js");

const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const gwoGroup = loadCouiModule(MOD_ROOT + "/shared/unit_groups.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const fixture = require("./fixtures/unit_types.json").units;

// The job of every mobile combat unit shared/units.js names, null for none.
// A change here moves race units from one card to another.
const JOBS = {
  angel: "MissileDefense",
  ant: null,
  arkyd: "Scout",
  artemis: "Fighter",
  astraeus: "Transport",
  avenger: "Fighter",
  barnacle: "Construction",
  barracuda: "Sub",
  baseOrbital: null,
  bluehawk: "Tactical",
  boom: "SelfDestruct",
  bumblebee: "Bomber",
  dox: "Amphibious",
  drifter: "Hover",
  firefly: "Scout",
  gilE: "Artillery",
  grenadier: "Artillery",
  hermes: "Scout",
  hornet: "Bomber",
  horsefly: "Heavy",
  hummingbird: "Fighter",
  icarus: "EnergyProduction",
  inferno: "Heavy",
  kaiju: "Hover",
  kestrel: "Gunship",
  kraken: "Sub",
  leveler: null,
  leviathan: "Artillery",
  locusts: "Deconstruction",
  manhattan: "Heavy",
  narwhal: "AirDefense",
  nyx: "RadarJammer",
  omega: "Heavy",
  orca: null,
  pelican: "Transport",
  phoenix: "Fighter",
  piranha: "WaterHover",
  radarSatelliteAdvanced: "Scout",
  sheller: "Artillery",
  skitter: "Scout",
  slammer: "Amphibious",
  solarArray: "EnergyProduction",
  spark: "Heavy",
  spinner: "AirDefense",
  squall: null,
  stinger: "AirDefense",
  stingray: "Tactical",
  stitch: "Construction",
  storm: "AirDefense",
  stryker: null,
  sxx: "LaserPlatform",
  typhoon: null,
  vanguard: "Heavy",
  ward: "Heavy",
  wyrm: "Heavy",
};

// Of those, the ones no commander can build: they stand for their whole cell.
const UNBUILDABLE = ["baseOrbital", "squall"];

// Every bit classify reads, beside those it strips. A bit on a mobile combat
// unit outside them is one the job table has not been decided for.
const READ_BITS = [
  // Domain and tier.
  "Air",
  "Orbital",
  "Bot",
  "Tank",
  "Vehicle",
  "Land",
  "Naval",
  "Advanced",
  "Basic",
  // Class.
  "Titan",
  "Commander",
  "SupportCommander",
  "Mobile",
  "Construction",
  "Offense",
  "Nuke",
  "ControlModule",
  "PlanetEngine",
  "Defense",
  "Wall",
  "SurfaceDefense",
  "AirDefense",
  "Factory",
  "MetalProduction",
  "EnergyProduction",
  "Economy",
  "Recon",
  "Radar",
  "RadarJammer",
  "Teleporter",
  // Job.
  "Heavy",
  "SelfDestruct",
  "Fighter",
  "Bomber",
  "Gunship",
  "LaserPlatform",
  "Tactical",
  "OrbitalDefense",
  "MissileDefense",
  "NukeDefense",
  "Shield",
  "Artillery",
  "TacticalDefense",
  "Transport",
  "Scout",
  "Deconstruction",
  "Hover",
  "WaterHover",
  "Amphibious",
  "Sub",
];
// Section 17's Sigma carries FabberBuild, a build permission.
const IGNORED_BITS = ["FabberBuild"];

// MLA's is the add-on index.
const INDEXES = races.all().map((race) => ({
  id: race.id,
  index: fixtureIndex(race.id),
}));
const VANILLA = INDEXES[0].index.vanilla;

const isCombat = (index, unit) => /\/Combat$/.test(index.cellOf[unit] || "");

describe("jobs over the harvested fixture", () => {
  it("finds units a commander can build in every index", () => {
    for (const { id, index } of INDEXES) {
      assert.ok(Object.keys(index.vanilla.fieldable).length > 0, id);
    }
  });

  it("pins the job of every mobile combat unit shared/units.js names", () => {
    const jobs = {};
    for (const [key, unit] of Object.entries(gwoUnit)) {
      if (typeof unit === "string" && isCombat(VANILLA, unit)) {
        jobs[key] = VANILLA.jobsOf[unit][0] || null;
      }
    }

    assert.deepEqual(jobs, JOBS);
    assert.deepEqual(
      Object.keys(JOBS).filter((key) => !VANILLA.fieldable[gwoUnit[key]]),
      UNBUILDABLE
    );
  });

  it("gives every race and add-on unit of a combat cell a stand-in a card can grant", (t) => {
    // orbital_carrier can be built, but no card grants it.
    const grantable = gwoGroup.units;
    for (const { id, index } of INDEXES) {
      if (!index.race.units.length) {
        t.diagnostic("fixture harvested without " + id);
        continue;
      }
      const standIns = cells.standInsFor(index.vanilla, index.race);
      const reached = new Set(grantable.flatMap((unit) => standIns(unit)));
      for (const [cell, units] of Object.entries(index.race.unitsByCell)) {
        const filled = (index.vanilla.unitsByCell[cell] || []).some(
          (unit) => !index.vanilla.tagsOf[unit].includes("NoBuild")
        );
        if (!/\/Combat$/.test(cell) || !filled) {
          continue;
        }
        for (const unit of units) {
          assert.ok(reached.has(unit), id + ": " + unit);
        }
      }
    }
  });

  it("types every mobile combat unit with bits the rule reads or strips", () => {
    const known = new Set(READ_BITS.concat(IGNORED_BITS));
    for (const { id, index } of INDEXES) {
      for (const side of [index.vanilla, index.race]) {
        for (const unit of Object.keys(side.cellOf)) {
          if (!isCombat(side, unit)) {
            continue;
          }
          for (const bit of cells.stripTypes(fixture[unit])) {
            assert.ok(known.has(bit), id + ": " + unit + " " + bit);
          }
        }
      }
    }
  });

  it("makes every mobile artillery unit an artillery unit", () => {
    for (const unit of gwoGroup.artilleryMobile) {
      assert.equal(VANILLA.jobsOf[unit][0], "Artillery", unit);
    }
  });
});
