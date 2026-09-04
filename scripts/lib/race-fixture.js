"use strict";

// A made-up race for the plumbing tests, so none of them depends on a real
// faction mod's data: a tank, its weapon and ammo, a vehicle factory and two
// commanders under the Custom7 bit, beside the vanilla ant, dox, vehicle
// factory and commander they share cells with.

const { loadCouiModule } = require("./amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const unitCells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");

const FX_TANK = "/pa/units/land/fx_tank/fx_tank.json";
const FX_TANK_WEAPON = "/pa/units/land/fx_tank/fx_tank_tool_weapon.json";
const FX_TANK_AMMO = "/pa/units/land/fx_tank/fx_tank_ammo.json";
const FX_VEHICLE_FACTORY =
  "/pa/units/land/fx_vehicle_factory/fx_vehicle_factory.json";
const FX_ALPHA = "/pa/units/commanders/fx_alpha/fx_alpha.json";
const FX_BETA = "/pa/units/commanders/fx_beta/fx_beta.json";

const FIXTURE_RACE = {
  id: "Fixture",
  name: "!LOC:Fixture",
  serverMods: ["com.example.fixture-server", "com.example.fixture-server-dev"],
  unitTypeBit: "Custom7",
  commanderTypes: {
    unitType: "UNITTYPE_Custom7",
    buildable: "CmdBuild & Custom7",
  },
  commanders: [
    { spec: FX_ALPHA, name: "Alpha" },
    { spec: FX_BETA, name: "Beta" },
  ],
  ai: {
    titans: {
      unitMaps: ["/pa/ai/unit_maps/fixture.json"],
      sources: [
        { dir: "/pa/ai/fabber_builds/", match: "fixture/" },
        { dir: "/pa/ai/factory_builds/", match: "fixture_" },
      ],
    },
  },
  units: {
    fxTank: FX_TANK,
    fxTankAmmo: FX_TANK_AMMO,
    fxVehicleFactory: FX_VEHICLE_FACTORY,
  },
  unitNames: {
    fxTank: "Fixture Tank",
  },
};

const types = (list) => list.split(" ").map((tag) => "UNITTYPE_" + tag);

// The specs behind the fixture's cells. The ant and the fixture tank share
// Vehicle/Basic/Combat; the dox has no fixture counterpart.
const FIXTURE_SPECS = {
  [gwoUnit.ant]: {
    unit_types: types("Basic Land Mobile Offense Tank Custom58"),
    tools: [{ spec_id: gwoUnit.antWeapon }],
  },
  [gwoUnit.antWeapon]: { ammo_id: gwoUnit.antAmmo },
  [gwoUnit.antAmmo]: { damage: 10 },
  [gwoUnit.dox]: {
    unit_types: types("Basic Bot Land Mobile Offense Custom58"),
    tools: [{ spec_id: gwoUnit.doxWeapon }],
  },
  [gwoUnit.doxWeapon]: { ammo_id: gwoUnit.doxAmmo },
  [gwoUnit.doxAmmo]: { damage: 10 },
  [gwoUnit.vehicleFactory]: {
    unit_types: types(
      "Basic Construction Factory Land Structure Tank Custom58"
    ),
  },
  [gwoUnit.commander]: {
    unit_types: types("Commander Construction Land Mobile Custom58"),
  },
  [FX_TANK]: {
    unit_types: types("Basic Land Mobile Offense Tank Custom7"),
    tools: [{ spec_id: FX_TANK_WEAPON }],
  },
  [FX_TANK_WEAPON]: { ammo_id: FX_TANK_AMMO },
  [FX_TANK_AMMO]: { damage: 12 },
  [FX_VEHICLE_FACTORY]: {
    unit_types: types("Basic Construction Factory Land Structure Tank Custom7"),
  },
  [FX_ALPHA]: {
    unit_types: types("Commander Construction Land Mobile Custom7"),
  },
  [FX_BETA]: {
    unit_types: types("Commander Construction Land Mobile Custom7"),
  },
};
const FIXTURE_UNITS = [
  gwoUnit.ant,
  gwoUnit.dox,
  gwoUnit.vehicleFactory,
  gwoUnit.commander,
  FX_TANK,
  FX_VEHICLE_FACTORY,
  FX_ALPHA,
  FX_BETA,
];

// The { vanilla, race } cell index race_cells.js would build for the fixture.
function fixtureIndex() {
  return {
    vanilla: unitCells.buildIndex(
      FIXTURE_UNITS,
      FIXTURE_SPECS,
      unitCells.vanillaMember
    ),
    race: unitCells.buildIndex(
      FIXTURE_UNITS,
      FIXTURE_SPECS,
      unitCells.raceMember("Custom7")
    ),
  };
}

// A stand-in for gwo_rng: pick takes the first entry, shuffle reverses, so a
// test can predict every draw.
function predictableRng() {
  return {
    pick: function (list) {
      return list[0];
    },
    shuffle: function (list) {
      return list.slice().reverse();
    },
  };
}

module.exports = {
  FIXTURE_RACE,
  FIXTURE_SPECS,
  FIXTURE_UNITS,
  fixtureIndex,
  predictableRng,
};
