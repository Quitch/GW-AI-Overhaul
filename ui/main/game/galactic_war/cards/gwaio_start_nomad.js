define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  const CARD = { id: /[^/]+$/.exec(module.id).pop() };
  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Nomad Commander"),
    icon: function () {
      return gwoCard.loadoutIcon(CARD.id);
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
    deal: gwoCard.startCard,
    buff: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);

          const mods = [];
          const smallStructures = [
            gwoUnit.energyPlant,
            gwoUnit.energyStorage,
            gwoUnit.galata,
            gwoUnit.landMine,
            gwoUnit.laserDefenseTower,
            gwoUnit.metalStorage,
            gwoUnit.pelter,
            gwoUnit.radar,
            gwoUnit.singleLaserDefenseTower,
            gwoUnit.torpedoLauncher,
            gwoUnit.umbrella,
            gwoUnit.wall,
          ];
          const mediumStructures = [
            gwoUnit.catapult,
            gwoUnit.energyPlantAdvanced,
            gwoUnit.flak,
            gwoUnit.laserDefenseTowerAdvanced,
            gwoUnit.torpedoLauncherAdvanced,
          ];
          const largeStructures = [
            gwoUnit.anchor,
            gwoUnit.deepSpaceOrbitalRadar,
            gwoUnit.holkins,
            gwoUnit.jig,
            gwoUnit.kessler,
            gwoUnit.radarAdvanced,
          ];
          const allStructures = smallStructures.concat(
            mediumStructures,
            largeStructures
          );
          const orbitalStructures = [
            gwoUnit.anchor,
            gwoUnit.jig,
            gwoUnit.kessler,
          ];
          const groundStructures = _.reject(
            allStructures,
            function (structure) {
              return _.includes(orbitalStructures, structure);
            }
          );
          _.forEach(groundStructures, function (unit) {
            mods.push(
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
              },
              {
                file: unit,
                path: "physics.allow_pushing",
                op: "replace",
                value: true,
              },
              {
                file: unit,
                path: "physics.push_sideways",
                op: "replace",
                value: true,
              },
              {
                file: unit,
                path: "structure",
                op: "replace",
                value: null,
              },
              {
                file: unit,
                path: "navigation.park_stamp.shape",
                op: "replace",
                value: "sphere",
              },
              {
                file: unit,
                path: "navigation.park_stamp.cost",
                op: "replace",
                value: 10,
              },
              {
                file: unit,
                path: "navigation.park_stamp.type_data",
                op: "replace",
                value: [
                  { move_type: "land-small", stamp_type: "simple" },
                  { move_type: "amphibious", stamp_type: "simple" },
                  { move_type: "hover", stamp_type: "simple" },
                  { move_type: "water-hover", stamp_type: "simple" },
                ],
              },
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_Hover",
              }
            );
          });
          _.forEach(orbitalStructures, function (unit) {
            mods.push(
              {
                file: unit,
                path: "navigation.type",
                op: "replace",
                value: "orbital",
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
              },
              {
                file: unit,
                path: "navigation.bank_factor",
                op: "replace",
                value: 5,
              },
              {
                file: unit,
                path: "navigation.hover_time",
                op: "replace",
                value: -1.0,
              }
            );
          });
          _.forEach(allStructures, function (unit) {
            mods.push(
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
              },
              {
                file: unit,
                path: "physics.radius",
                op: "replace",
                value: 5,
              },
              {
                file: unit,
                path: "physics.air_friction",
                op: "replace",
                value: 0.5,
              },
              {
                file: unit,
                path: "navigation.dodge_radius",
                op: "replace",
                value: 15,
              },
              {
                file: unit,
                path: "navigation.dodge_multiplier",
                op: "replace",
                value: 1.0,
              },
              {
                file: unit,
                path: "navigation.wobble_factor",
                op: "replace",
                value: 0.1,
              },
              {
                file: unit,
                path: "navigation.wobble_speed",
                op: "replace",
                value: 0.2,
              }
            );
          });
          _.forEach(smallStructures, function (unit) {
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
            file: gwoUnit.pelican,
            path: "transporter.transportable_unit_types",
            op: "replace",
            value: "Mobile & ((Land - Commander) | CmdBuild | FabBuild)",
          });
          const teleportableStructures =
            smallStructures.concat(mediumStructures);
          _.forEach(teleportableStructures, function (unit) {
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
          const defensiveStructures = gwoGroup.structuresArtillery.concat(
            gwoGroup.structuresDefences
          );
          const offensiveStructures = _.filter(
            defensiveStructures,
            function (structure) {
              return structure !== gwoUnit.wall;
            }
          );
          _.forEach(offensiveStructures, function (unit) {
            mods.push({
              file: unit,
              path: "command_caps",
              op: "push",
              value: "ORDER_Attack",
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
        gwoBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      gwoCard.applyDulls(CARD, inventory);
    },
  };
});
