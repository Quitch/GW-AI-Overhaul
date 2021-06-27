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
    summarize: _.constant("!LOC:Tactical Nuke Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Replaces conventional nukes with a new low-cost/low-yield variant and relies heavily on it for both offense and defence."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Tactical Nuke Commander",
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
            "/pa/units/land/nuke_launcher/nuke_launcher.json",
            "/pa/units/land/tank_light_laser/tank_light_laser.json",
            "/pa/units/land/vehicle_factory/vehicle_factory.json",
          ]);
          var nukes = [
            "/pa/units/land/nuke_launcher/nuke_launcher_ammo.json",
            "/pa/units/land/nuke_launcher/nuke_launcher_inter_ammo.json",
          ];
          var mods = [];
          nukes.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "replace",
                value: 300,
              },
              {
                file: unit,
                path: "damage",
                op: "replace",
                value: 750,
              },
              {
                file: unit,
                path: "splash_damage",
                op: "replace",
                value: 750,
              },
              {
                file: unit,
                path: "full_damage_splash_radius",
                op: "replace",
                value: 50,
              },
              {
                file: unit,
                path: "splash_radius",
                op: "replace",
                value: 45,
              },
              {
                file: unit,
                path: "description",
                op: "replace",
                value:
                  "!LOC:Tactical Nuke - Small nuke with low damage and small blast radius.",
              }
            );
          });
          mods.push(
            {
              file: "/pa/units/land/nuke_launcher/nuke_launcher.json",
              path: "build_metal_cost",
              op: "replace",
              value: 2500,
            },
            {
              file: "/pa/units/land/nuke_launcher/nuke_launcher.json",
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_FabBuild",
            },
            {
              file: "/pa/units/land/nuke_launcher/nuke_launcher.json",
              path: "description",
              op: "replace",
              value:
                "!LOC:Tactical Nuke Launcher - Constructs low-cost/low-yield interplanetary tactical nukes.",
            },
            {
              file: "/pa/units/land/nuke_launcher/nuke_launcher_build_arm.json",
              path: "construction_demand.metal",
              op: "replace",
              value: 15,
            },
            {
              file: "/pa/units/land/nuke_launcher/nuke_launcher_build_arm.json",
              path: "construction_demand.energy",
              op: "replace",
              value: 2250,
            }
          );
          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "NukeSilo",
              idToMod: "builders",
              value: "AnyBasicFabber",
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
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
          ]);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
