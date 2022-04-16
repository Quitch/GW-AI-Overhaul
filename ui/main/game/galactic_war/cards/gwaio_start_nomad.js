define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
], function (module, GWCStart, gwoBank, gwoCard, gwoUnit, gwoGroup) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };
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

          var mods = [];
          var smallStructures = [
            gwoUnit.energyPlant,
            gwoUnit.energyStorage,
            gwoUnit.galata,
            gwoUnit.landMine,
            gwoUnit.metalStorage,
            gwoUnit.pelter,
            gwoUnit.radar,
            gwoUnit.singleLaserDefenseTower,
            gwoUnit.torpedoLauncher,
            gwoUnit.wall,
          ];
          var mediumStructures = [
            gwoUnit.catapult,
            gwoUnit.energyPlantAdvanced,
            gwoUnit.flak,
            gwoUnit.laserDefenseTower,
            gwoUnit.laserDefenseTowerAdvanced,
            gwoUnit.torpedoLauncherAdvanced,
            gwoUnit.umbrella,
          ];
          var largeStructures = [
            gwoUnit.anchor,
            gwoUnit.deepSpaceOrbitalRadar,
            gwoUnit.holkins,
            gwoUnit.jig,
            gwoUnit.radarAdvanced,
          ];
          var allStructures = smallStructures.concat(
            mediumStructures,
            largeStructures
          );
          var groundStructures = _.filter(allStructures, function (structure) {
            return structure !== gwoUnit.anchor && structure !== gwoUnit.jig;
          });
          _.forEach(groundStructures, function (unit) {
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
              }
            );
          });
          var orbitalStructures = [gwoUnit.anchor, gwoUnit.jig];
          _.forEach(orbitalStructures, function (unit) {
            mods.push(
              {
                file: unit,
                path: "base_spec",
                op: "replace",
                value: "/pa/units/orbital/base_orbital/base_orbital.json",
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
          _.forEach(allStructures, function (unit) {
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
              },
              {
                file: unit,
                path: "physics.radius",
                op: "multiply",
                value: 5,
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
          var teleportableStructures = smallStructures.concat(mediumStructures);
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
          var defensiveStructures = gwoGroup.structuresArtillery.concat(
            gwoGroup.structuresDefences
          );
          var offensiveStructures = _.filter(
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

          var types = ["platoon", "template"];
          var aiMods = _.map(types, function (type) {
            return {
              type: type,
              op: "load",
              value: CARD.id + ".json",
            };
          });
          inventory.addAIMods(aiMods);
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
