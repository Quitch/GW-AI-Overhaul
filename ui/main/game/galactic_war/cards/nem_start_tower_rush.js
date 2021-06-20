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
    summarize: _.constant("!LOC:Defense Tech Commander"),
    icon: function () {
      return gwaioFunctions.loadoutIcon(CARD.id);
    },
    describe: _.constant(
      "!LOC:Defenses are 50% cheaper, fire 25% faster, have 50% more range, and turn 300% quicker. Barriers are 90% cheaper and have their health doubled. All defenses can be built by both the commander and basic fabricators."
    ),
    hint: function () {
      return {
        icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
        description: "!LOC:Defense Tech Commander",
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
            "/pa/units/land/bot_factory/bot_factory.json",
            "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/orbital/defense_satellite/defense_satellite.json",
          ]);
          var units = [
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
          ];
          var mods = [];
          units.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_CmdBuild",
              },
              {
                file: unit,
                path: "unit_types",
                op: "push",
                value: "UNITTYPE_FabBuild",
              }
            );
          });
          var costUnits = [
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
          ];
          costUnits.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.5,
              },
              {
                file: unit,
                path: "area_build_separation",
                op: "multiply",
                value: 0.2,
              }
            );
          });
          var buildUnits = ["/pa/units/land/land_barrier/land_barrier.json"];
          buildUnits.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "build_metal_cost",
                op: "multiply",
                value: 0.1,
              },
              {
                file: unit,
                path: "max_health",
                op: "multiply",
                value: 2,
              }
            );
          });
          var units_with_splash = [
            "/pa/units/land/air_defense/air_defense_tool_weapon.json",
            "/pa/units/land/air_defense_adv/air_defense_adv_tool_weapon.json",
            "/pa/units/land/laser_defense_single/laser_defense_single_tool_weapon.json",
            "/pa/units/land/laser_defense/laser_defense_tool_weapon.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher_tool_weapon.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_tool_weapon.json",
          ];
          units_with_splash.forEach(function (unit) {
            mods.push(
              {
                file: unit,
                path: "rate_of_fire",
                op: "multiply",
                value: 1.25,
              },
              {
                file: unit,
                path: "max_range",
                op: "multiply",
                value: 1.5,
              },
              {
                file: unit,
                path: "yaw_rate",
                op: "multiply",
                value: 4,
              },
              {
                file: unit,
                path: "pitch_rate",
                op: "multiply",
                value: 4,
              }
            );
          });
          inventory.addMods(mods);

          inventory.addAIMods([
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicLandDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "BasicLandDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedAirDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedAirDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedAirDefense",
              idToMod: "builders",
              value: "AnyBasicFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedLandDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedLandDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedLandDefense",
              idToMod: "builders",
              value: "AnyBasicFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "TML",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "TML",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "TML",
              idToMod: "builders",
              value: "AnyBasicFabber",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedNavalDefense",
              idToMod: "builders",
              value: "Commander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedNavalDefense",
              idToMod: "builders",
              value: "UberCommander",
            },
            {
              type: "fabber",
              op: "append",
              toBuild: "AdvancedNavalDefense",
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
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
