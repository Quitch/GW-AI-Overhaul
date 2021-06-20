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
            inventory.addMods(gwaioTech.clusterCommanders);

          var mods = [];

          var smallStructures = [
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/energy_plant/energy_plant.json",
            "/pa/units/land/energy_storage/energy_storage.json",
            "/pa/units/land/land_barrier/land_barrier.json",
            "/pa/units/land/land_mine/land_mine.json",
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/metal_storage/metal_storage.json",
            "/pa/units/land/radar/radar.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
          ];
          var mediumStructures = [
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/land/energy_plant_adv/energy_plant_adv.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/laser_defense/laser_defense.json",
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
                path: "base_spec",
                op: "replace",
                value: "/pa/units/land/base_vehicle/base_vehicle.json",
              },
              {
                file: unit,
                path: "navigation.type",
                op: "replace",
                value: "Hover",
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "replace",
                value: 100,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "replace",
                value: 100,
              },
              {
                file: unit,
                path: "navigation.move_speed",
                op: "replace",
                value: 10,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "replace",
                value: 60,
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
                path: "base_spec",
                op: "replace",
                value: "/pa/units/orbital/base_orbital/base_orbital.json",
              },
              {
                file: unit,
                path: "armor_type",
                op: "replace",
                value: "AT_Structure",
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "replace",
                value: 25,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "replace",
                value: 25,
              },
              {
                file: unit,
                path: "navigation.move_speed",
                op: "replace",
                value: 25,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "replace",
                value: 90,
              }
            );
          });

          allStructures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "physics.type",
                op: "replace",
                value: "Mobile",
              },
              {
                file: unit,
                path: "command_caps",
                op: "replace",
                value: ["ORDER_Move", "ORDER_Patrol", "ORDER_Assist"],
              },
              {
                file: unit,
                path: "unit_types",
                op: "pull",
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

          smallStructures.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "transportable",
                op: "replace",
                value: { size: 1 },
              },
              {
                file: unit,
                path: "attachable",
                op: "replace",
                value: { offsets: { root: [0, 0, 0], head: [0, 0, 13] } },
              }
            );
          });
          mods.push({
            file: "/pa/units/air/transport/transport.json",
            path: "transporter.transportable_unit_types",
            op: "replace",
            value: "Mobile & ((Land - Commander) | CmdBuild | FabBuild)",
          });

          var teleportableStructures = smallStructures.concat(mediumStructures);
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

          var offensiveStructures = [
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/artillery_short/artillery_short.json",
            "/pa/units/land/land_mine/land_mine.json",
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/orbital/ion_defense/ion_defense.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/land/artillery_long/artillery_long.json",
            "/pa/units/land/nuke_launcher/nuke_launcher.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
          ];
          offensiveStructures.forEach(function (unit) {
            mods.push({
              file: unit,
              path: "command_caps",
              op: "push",
              value: "ORDER_Attack",
            });
          });

          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "platoon",
              op: "load",
              value: "gwaio_start_nomad.json",
            },
            {
              type: "template",
              op: "load",
              value: "gwaio_start_nomad.json",
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
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
