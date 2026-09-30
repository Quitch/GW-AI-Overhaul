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

// The job of every defence and superweapon structure shared/units.js names,
// null for none. A change here moves race structures from one card to another.
const STRUCTURE_JOBS = {
  anchor: "OrbitalDefense",
  antiNukeLauncher: "NukeDefense",
  catalyst: "ControlModule",
  catapult: "Tactical",
  flak: "AirDefense",
  galata: "AirDefense",
  halley: "PlanetEngine",
  holkins: "Artillery",
  kessler: "OrbitalDefense",
  landMine: null,
  laserDefenseTower: "SurfaceDefense",
  laserDefenseTowerAdvanced: "SurfaceDefense",
  lob: "Artillery",
  nukeLauncher: "Nuke",
  pelter: "Artillery",
  singleLaserDefenseTower: "SurfaceDefense",
  torpedoLauncher: null,
  torpedoLauncherAdvanced: null,
  umbrella: "OrbitalDefense",
  wall: "Wall",
};

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

// Every bit a defence or superweapon structure's class and jobs read, and
// those decided to be no job of one. A bit outside them is one the structure
// table has not been decided for.
const STRUCTURE_READ_BITS = [
  // Domain and tier.
  "Air",
  "Orbital",
  "Land",
  "Naval",
  "Advanced",
  "Basic",
  // Class.
  "Defense",
  "Nuke",
  "ControlModule",
  "PlanetEngine",
  "Wall",
  "SurfaceDefense",
  "AirDefense",
  // Job.
  "Tactical",
  "OrbitalDefense",
  "NukeDefense",
  "Artillery",
];
const STRUCTURE_UNREAD_BITS = [
  "Structure",
  "Offense",
  "Factory",
  "Construction",
  "Shield",
  "TacticalDefense",
  "SelfDestruct",
  "EnergyProduction",
  "Economy",
];

// MLA's is the add-on index.
const INDEXES = races.all().map((race) => ({
  id: race.id,
  index: fixtureIndex(race.id),
}));
const VANILLA = INDEXES[0].index.vanilla;

const isCombat = (index, unit) => /\/Combat$/.test(index.cellOf[unit] || "");
const SPLIT_CELL = /\/(Combat|Defense|Superweapon)$/;
const isStructure = (index, unit) =>
  /\/(Defense|Superweapon)$/.test(index.cellOf[unit] || "");
const short = (unit) => unit.slice(unit.lastIndexOf("/") + 1, -".json".length);

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

  it("pins the job of every defence and superweapon structure shared/units.js names", () => {
    const jobs = {};
    for (const [key, unit] of Object.entries(gwoUnit)) {
      if (typeof unit === "string" && isStructure(VANILLA, unit)) {
        jobs[key] = VANILLA.jobsOf[unit][0] || null;
      }
    }

    assert.deepEqual(jobs, STRUCTURE_JOBS);
    assert.ok(
      Object.keys(jobs).every((key) => VANILLA.fieldable[gwoUnit[key]])
    );
  });

  it("gives every race and add-on unit of a split cell a stand-in a card can grant", (t) => {
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
        if (!SPLIT_CELL.test(cell) || !filled) {
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

  it("types every defence and superweapon structure with bits its rule reads or leaves", () => {
    const known = new Set(STRUCTURE_READ_BITS.concat(STRUCTURE_UNREAD_BITS));
    for (const { id, index } of INDEXES) {
      for (const side of [index.vanilla, index.race]) {
        for (const unit of Object.keys(side.cellOf)) {
          if (!isStructure(side, unit)) {
            continue;
          }
          for (const bit of cells.stripTypes(fixture[unit])) {
            assert.ok(known.has(bit), id + ": " + unit + " " + bit);
          }
        }
      }
    }
  });

  it("gives a laser tower a race's turrets, and the nuke launcher its nukes", (t) => {
    const expected = {
      legion: [
        [
          "basic_missile_defence",
          "l_swarm_hive",
          "l_t1_turret_adv",
          "l_t1_turret_basic",
        ],
        ["l_nuke_launcher"],
      ],
      bugs: [
        [
          "basic_missile_defence",
          "bug_missile_defence_basic",
          "bug_turret_acid",
          "bug_turret_needle",
          "bug_turret_small",
        ],
        ["bug_nuke", "control_node"],
      ],
      exiles: [["ambush_twr", "ambush_twr_hid"], ["missile_facility"]],
    };
    for (const { id, index } of INDEXES) {
      if (!expected[id]) {
        continue;
      }
      if (!index.race.units.length) {
        t.diagnostic("fixture harvested without " + id);
        continue;
      }
      const standIns = cells.standInsFor(index.vanilla, index.race);
      const of = (unit) => standIns(unit).map(short).sort();
      assert.deepEqual(
        [of(gwoUnit.laserDefenseTower), of(gwoUnit.nukeLauncher)],
        expected[id],
        id
      );
    }
  });

  it("makes every mobile artillery unit an artillery unit", () => {
    for (const unit of gwoGroup.artilleryMobile) {
      assert.equal(VANILLA.jobsOf[unit][0], "Artillery", unit);
    }
  });
});

// The vanilla units each index's race builds that stand for none of its own
// units, so they stand for themselves. A race mod or add-on update that adds
// a race unit to one of their cells moves it off this list. See races.md,
// "Capability cells".
const SELF_STANDING = {
  mla: [],
  legion: [],
  bugs: [
    "/pa/units/sea/attack_sub/attack_sub.json",
    "/pa/units/sea/battleship/battleship.json",
    "/pa/units/sea/destroyer/destroyer.json",
    "/pa/units/sea/drone_carrier/carrier/carrier.json",
    "/pa/units/sea/frigate/frigate.json",
    "/pa/units/sea/hover_ship/hover_ship.json",
    "/pa/units/sea/missile_ship/missile_ship.json",
    "/pa/units/sea/nuclear_sub/nuclear_sub.json",
    "/pa/units/sea/sea_scout/sea_scout.json",
  ],
  exiles: [
    "/pa/units/air/titan_air/titan_air.json",
    "/pa/units/land/titan_vehicle/titan_vehicle.json",
    "/pa/units/orbital/defense_satellite/defense_satellite.json",
    "/pa/units/orbital/mining_platform/mining_platform.json",
    "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
    "/pa/units/orbital/orbital_carrier/orbital_carrier.json",
    "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
    "/pa/units/orbital/orbital_factory/orbital_factory.json",
    "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
    "/pa/units/orbital/orbital_lander/orbital_lander.json",
    "/pa/units/orbital/orbital_laser/orbital_laser.json",
    "/pa/units/orbital/orbital_mine/orbital_mine.json",
    "/pa/units/orbital/orbital_probe/orbital_probe.json",
    "/pa/units/orbital/orbital_railgun/orbital_railgun.json",
    "/pa/units/orbital/radar_satellite/radar_satellite.json",
    "/pa/units/orbital/radar_satellite_adv/radar_satellite_adv.json",
    "/pa/units/orbital/solar_array/solar_array.json",
    "/pa/units/orbital/titan_orbital/titan_orbital.json",
  ],
};

// The stock units each race fields beside the race units they stand for,
// holding every vanilla unit: its descriptor's stockUnits.
const STOCK_BUILT = {
  mla: [],
  legion: [],
  bugs: [],
  exiles: [
    "/pa/units/land/metal_extractor/metal_extractor.json",
    "/pa/units/land/teleporter/teleporter.json",
  ],
};

describe("units a race builds itself, over the harvested fixture", () => {
  it("adds to what a race fields only the stock units its descriptor names", (t) => {
    for (const { id, index } of INDEXES) {
      if (!index.race.units.length) {
        t.diagnostic("fixture harvested without " + id);
        continue;
      }
      const held = index.vanilla.units;
      const base = (races.isMla(id) ? cells.addonUnitsFor : cells.raceUnitsFor)(
        held,
        index.vanilla,
        index.race
      );
      const added = races
        .fieldedFor(id, held, index)
        .filter((unit) => !base.includes(unit))
        .sort();
      assert.deepEqual(added, STOCK_BUILT[id], id);
    }
  });

  it("pins the vanilla units each race builds that stand for themselves", (t) => {
    for (const { id, index } of INDEXES) {
      if (!index.race.units.length) {
        t.diagnostic("fixture harvested without " + id);
        continue;
      }
      const standIns = cells.standInsFor(index.vanilla, index.race);
      const self = Object.keys(index.vanilla.cellOf)
        .filter((unit) => {
          const units = standIns(unit);
          return units.length === 1 && units[0] === unit;
        })
        .sort();
      assert.deepEqual(self, SELF_STANDING[id], id);
    }
  });
});
