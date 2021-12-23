define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (module, GWCStart, gwaioBank, gwaioFunctions, gwaioUnits) {
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
    deal: gwaioFunctions.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
          gwaioFunctions.setupCluster(inventory);

          var mods = [];

          var smallStructures = [
            gwaioUnits.galata,
            gwaioUnits.pelter,
            gwaioUnits.energyPlant,
            gwaioUnits.energyStorage,
            gwaioUnits.wall,
            gwaioUnits.landMine,
            gwaioUnits.singleLaserDefenseTower,
            gwaioUnits.metalStorage,
            gwaioUnits.radar,
            gwaioUnits.torpedoLauncher,
          ];
          var mediumStructures = [
            gwaioUnits.flak,
            gwaioUnits.energyPlantAdvanced,
            gwaioUnits.laserDefenseTowerAdvanced,
            gwaioUnits.laserDefenseTower,
            gwaioUnits.catapult,
            gwaioUnits.umbrella,
            gwaioUnits.torpedoLauncherAdvanced,
          ];
          var largeStructures = [
            gwaioUnits.holkins,
            gwaioUnits.radarAdvanced,
            gwaioUnits.deepSpaceOrbitalRadar,
            gwaioUnits.anchor,
            gwaioUnits.jig,
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

          var orbitalStructures = [gwaioUnits.anchor, gwaioUnits.jig];
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
            file: gwaioUnits.pelican,
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
            gwaioUnits.galata,
            gwaioUnits.pelter,
            gwaioUnits.landMine,
            gwaioUnits.singleLaserDefenseTower,
            gwaioUnits.torpedoLauncher,
            gwaioUnits.flak,
            gwaioUnits.laserDefenseTowerAdvanced,
            gwaioUnits.laserDefenseTower,
            gwaioUnits.catapult,
            gwaioUnits.umbrella,
            gwaioUnits.torpedoLauncherAdvanced,
            gwaioUnits.holkins,
            gwaioUnits.anchor,
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
      gwaioFunctions.applyDulls(CARD, inventory);
    },
  };
});
