"use strict";

// A made-up race for the plumbing tests, so none of them depends on a real
// faction mod's data. Two vanilla units map, the rest deliberately do not.

var FIXTURE_RACE = {
  id: "Fixture",
  name: "!LOC:Fixture",
  serverMods: ["com.example.fixture-server", "com.example.fixture-server-dev"],
  unitTypeBit: "Custom7",
  commanderTypes: {
    unitType: "UNITTYPE_Custom7",
    buildable: "CmdBuild & Custom7",
  },
  commanders: [
    { spec: "/pa/units/commanders/fx_alpha/fx_alpha.json", name: "Alpha" },
    { spec: "/pa/units/commanders/fx_beta/fx_beta.json", name: "Beta" },
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
    fxTank: "/pa/units/land/fx_tank/fx_tank.json",
    fxTankAmmo: "/pa/units/land/fx_tank/fx_tank_ammo.json",
    fxVehicleFactory:
      "/pa/units/land/fx_vehicle_factory/fx_vehicle_factory.json",
  },
  mla: {
    fxTank: "ant",
    fxTankAmmo: "antAmmo",
    fxVehicleFactory: "vehicleFactory",
  },
  unitNames: {
    fxTank: "Fixture Tank",
  },
};

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

module.exports = { FIXTURE_RACE: FIXTURE_RACE, predictableRng: predictableRng };
