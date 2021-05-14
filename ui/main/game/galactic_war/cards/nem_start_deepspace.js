define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (module, GWCStart, gwaioBank, gwaioTech, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Space Excavation Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Modifies Jigs to allow building them anywhere, at the expense of not being able to build other resource structures. This commander starts with some orbital units."
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
          costUnits.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.25,
              },
              {
                file: unit,
                path: "area_build_separation",
                op: "replace",
                value: 12,
              },
              {
                file: unit,
                path: "production.energy",
                op: "replace",
                value: 6250,
              },
              {
                file: unit,
                path: "production.metal",
                op: "replace",
                value: 30,
              },
              {
                file: unit,
                path: "build_restrictions",
                op: "replace",
                value: "none",
              },
              {
                file: unit,
                path: "description",
                op: "replace",
                value:
                  "!LOC:Orbital Mining Platform - This modified platform can extract metal from solid-state crust, but at a decreased rate.",
              }
            );
          });
          var units = [
            "/pa/units/orbital/orbital_launcher/orbital_launcher.json",
          ];
          units.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            });
          });
          var ammos = [
            "/pa/units/orbital/mining_platform/mining_platform_nuke.json",
          ];
          ammos.forEach(function (ammo) {
            mods.push({
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 0.1,
            });
          });
          var buildUnits = [
            "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json",
          ];
          buildUnits.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "buildable_types",
              op: "replace",
              value: "FabBuild | FabOrbBuild",
            });
          });
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
