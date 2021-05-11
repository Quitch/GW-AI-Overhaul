define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "cards/gwaio_faction_cluster",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (module, GWCStart, gwaioBank, gwaioFactionCluster, gwaioFunctions) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Nomad Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Non-factory and non-Titan structures are mobile. Small structures can be transported and use teleporters, medium size structures can use teleporters."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Nomad Commander",
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
            gwaioFactionCluster.buff(inventory);
          var mods = [];
          var smallStructures = [
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/energy_plant/energy_plant.json",
            "/pa/units/land/energy_storage/energy_storage.json",
            "/pa/units/land/land_barrier/land_barrier.json",
            "/pa/units/land/land_mine/land_mine.json",
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/metal_storage/metal_storage.json",
            "/pa/units/land/radar/radar.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
          ];
          var mediumStructures = [
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/orbital/ion_defense/ion_defense.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
          ];
          var largeStructures = [
            "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher.json",
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/nuke_launcher/nuke_launcher.json",
            "/pa/units/land/radar_adv/radar_adv.json",
            "/pa/units/orbital/deep_space_radar/deep_space_radar.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
          ];
          var allStructures = smallStructures.concat(
            mediumStructures,
            largeStructures
          );
          var teleportableStructures = smallStructures.concat(mediumStructures);
          allStructures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 1,
              },
              {
                file: unit,
                path: "command_caps",
                op: "push",
                value: ["ORDER_Move", "ORDER_Patrol", "ORDER_Assist"],
              }
            );
          });
          smallStructures.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "transportable",
              op: "replace",
              value: { size: 1 },
            });
          });
          teleportableStructures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "teleportable",
                op: "replace",
                value: {},
              },
              {
                file: unit,
                path: "command_caps",
                op: "push",
                value: "ORDER_Use",
              }
            );
          });
          var groundStructures = _.filter(allStructures, function (structure) {
            return (
              !_.includes(structure, "defense_satellite") &&
              !_.includes(structure, "mining_platform")
            );
          });
          groundStructures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.type",
                op: "replace",
                value: "hover",
              },
              {
                file: unit,
                path: "unit_types",
                op: "remove",
                value: "UNITTYPE_Structure",
              },
              {
                file: unit,
                path: "physics",
                op: "remove",
                value: { radius: 10, air_friction: 1.0 },
              }
            );
          });
          var orbitalStructures = [
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/orbital/mining_platform/mining_platform.json",
          ];
          orbitalStructures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.type",
                op: "replace",
                value: "orbital",
              },
              {
                file: unit,
                path: "unit_types",
                op: "remove",
                value: "UNITTYPE_Structure",
              },
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_Mobile",
              }
            );
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
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
