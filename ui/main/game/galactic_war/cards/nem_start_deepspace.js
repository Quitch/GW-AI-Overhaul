define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_hive",
], function (module, GWCStart, gwaioBank, gwaioFactionHive) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Space Excavation Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:Modifies Jigs to allow building them anywhere, at the expense of not being able to build other resource structures. This commander starts with some orbital units."
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
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
          if (localStorage.getItem("gwaio_player_faction") === "4")
            gwaioFactionHive.buff(inventory);
          inventory.addUnits([
            "/pa/units/orbital/orbital_fighter/orbital_fighter.json",
            "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/orbital/orbital_probe/orbital_probe.json",
            "/pa/units/orbital/orbital_factory/orbital_factory.json",
            "/pa/units/orbital/radar_satellite/radar_satellite.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
            "/pa/units/orbital/orbital_laser/orbital_laser.json",
          ]);
          var costUnits = [
            "/pa/units/orbital/mining_platform/mining_platform.json",
          ];
          var mods = [];
          var modCostUnit = function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.25,
            });
            mods.push({
              file: unit,
              path: "area_build_separation",
              op: "replace",
              value: 12,
            });
            mods.push({
              file: unit,
              path: "production.energy",
              op: "replace",
              value: 6250,
            });
            mods.push({
              file: unit,
              path: "production.metal",
              op: "replace",
              value: 30,
            });
            mods.push({
              file: unit,
              path: "build_restrictions",
              op: "replace",
              value: "none",
            });
            mods.push({
              file: unit,
              path: "description",
              op: "replace",
              value:
                "!LOC:Orbital Mining Platform - This modified platform can extract metal from solid-state crust, but at a decreased rate.",
            });
          };
          _.forEach(costUnits, modCostUnit);
          var units = [
            "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
          ];
          var modUnit = function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            });
          };
          _.forEach(units, modUnit);
          var ammos = [
            "/pa/units/orbital/mining_platform/mining_platform_nuke.json",
          ];
          var modAmmo = function (ammo) {
            mods.push({
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 0.1,
            });
          };
          _.forEach(ammos, modAmmo);
          var buildUnits = [
            "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
          ];
          var modBuildUnits = function (unit) {
            mods.push({
              file: unit,
              path: "buildable_types",
              op: "replace",
              value: "FabBuild | FabOrbBuild",
            });
          };
          _.forEach(buildUnits, modBuildUnits);
          inventory.addMods(mods);
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
            "/pa/units/land/metal_extractor/metal_extractor.json",
            "/pa/units/land/metal_extractor_adv/metal_extractor_adv.json",
            "/pa/units/orbital/orbital_battleship/orbital_battleship.json",
            "/pa/units/land/energy_plant/energy_plant.json",
            "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
          ]);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
