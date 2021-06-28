define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (module, GWCStart, gwaioBank, gwaioTech, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Space Excavation Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Modifies Jigs to allow building them anywhere, at the expense of not being able to build other resource structures. They are 75% cheaper but produce 30% less metal and energy and do 90% less damage on death. Orbital fabricators can build all basic structures. Contains all basic and advanced orbital units but can never build Omegas, any resource generating unit or structure, or Sub Commanders."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Space Excavation Commander",
      };
    },
    deal: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          if (inventory.getTag("global", "playerFaction") === 4)
            inventory.addMods(gwaioTech.clusterCommanders);
          inventory.addUnits([
            "/pa/units/orbital/mining_platform/mining_platform.json",
            "/pa/units/orbital/orbital_factory/orbital_factory.json",
            "/pa/units/orbital/radar_satellite/radar_satellite.json",
          ]);
          inventory.addMods([
            {
              file: "/pa/units/orbital/mining_platform/mining_platform.json",
              path: "build_metal_cost",
              op: "multiply",
              value: 0.25,
            },
            {
              file: "/pa/units/orbital/mining_platform/mining_platform.json",
              path: "area_build_separation",
              op: "replace",
              value: 12,
            },
            {
              file: "/pa/units/orbital/mining_platform/mining_platform.json",
              path: "production.energy",
              op: "multiply",
              value: 0.7,
            },
            {
              file: "/pa/units/orbital/mining_platform/mining_platform.json",
              path: "production.metal",
              op: "multiply",
              value: 0.7,
            },
            {
              file: "/pa/units/orbital/mining_platform/mining_platform.json",
              path: "build_restrictions",
              op: "replace",
              value: "none",
            },
            {
              file: "/pa/units/orbital/mining_platform/mining_platform.json",
              path: "description",
              op: "replace",
              value:
                "!LOC:Orbital Mining Platform - This modified platform can extract metal from solid-state crust, but at a decreased rate.",
            },
            {
              file: "/pa/units/orbital/mining_platform/mining_platform_nuke.json",
              path: "damage",
              op: "multiply",
              value: 0.1,
            },
            {
              file: "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
              path: "buildable_types",
              op: "replace",
              value: "FabBuild | FabOrbBuild",
            },
          ]);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicAirFactory",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicAirDefense",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicLandDefenseSingle",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicLandDefense",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicArtillery",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "Wall",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "Umbrella",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicEnergyGenerator",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "EnergyStorage",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "MetalStorage",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicRadar",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicBotFactory",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicVehicleFactory",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "OrbitalLauncher",
              idToMod: "builders",
              value: "OrbitalFabber",
            },
          ]);
        } else {
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.removeUnits([
            "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
            "/pa/units/land/energy_plant/energy_plant.json",
            "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
            "/pa/units/land/metal_extractor/metal_extractor.json",
            "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
            "/pa/units/orbital/solar_array/solar_array.json",
          ]);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
