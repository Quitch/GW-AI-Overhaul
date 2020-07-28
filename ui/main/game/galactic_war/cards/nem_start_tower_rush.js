// !LOCNS:galactic_war
define([
  "module",
  "cards/gwc_start",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/js/bank.js",
], function (module, GWCStart, gwaioBank) {
  var CARD = { id: /[^/]+$/.exec(module.id).pop() };

  return {
    visible: _.constant(false),
    summarize: _.constant("!LOC:Defense Tech Commander"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/shared/img/red-commander.png"
    ),
    describe: _.constant(
      "!LOC:Improved defensive structures built by both the commander and basic fabricators."
    ),
    hint: function () {
      return {
        icon:
          "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
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
        // Make sure we only do the start buff/dull once
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (!buffCount) {
          GWCStart.buff(inventory);
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
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/tactical_missile_launcher/tactical_missile_launcher.json",
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
            "/pa/units/land/radar/radar.json",
          ];
          var mods = [];
          var modUnit = function (unit) {
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_CmdBuild",
            });
            mods.push({
              file: unit,
              path: "unit_types",
              op: "push",
              value: "UNITTYPE_FabBuild",
            });
          };
          _.forEach(units, modUnit);
          var costUnits = [
            "/pa/units/land/laser_defense_single/laser_defense_single.json",
            "/pa/units/land/laser_defense/laser_defense.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv.json",
            "/pa/units/land/air_defense/air_defense.json",
            "/pa/units/land/air_defense_adv/air_defense_adv.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv.json",
          ];
          var modCostUnit = function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.5,
            });
            mods.push({
              file: unit,
              path: "area_build_separation",
              op: "multiply",
              value: 0.2,
            });
          };
          _.forEach(costUnits, modCostUnit);
          var buildUnits = ["/pa/units/land/land_barrier/land_barrier.json"];
          var modBuildUnits = function (unit) {
            mods.push({
              file: unit,
              path: "build_metal_cost",
              op: "multiply",
              value: 0.1,
            });
            mods.push({
              file: unit,
              path: "max_health",
              op: "multiply",
              value: 2,
            });
          };
          _.forEach(buildUnits, modBuildUnits);
          var units_with_splash = [
            "/pa/units/land/air_defense/air_defense_tool_weapon.json",
            "/pa/units/land/air_defense_adv/air_defense_adv_tool_weapon.json",
            "/pa/units/land/laser_defense_single/laser_defense_single_tool_weapon.json",
            "/pa/units/land/laser_defense/laser_defense_tool_weapon.json",
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
            "/pa/units/sea/torpedo_launcher/torpedo_launcher_tool_weapon.json",
            "/pa/units/sea/torpedo_launcher_adv/torpedo_launcher_adv_tool_weapon.json",
          ];
          var modUnitSplash = function (unit) {
            mods.push({
              file: unit,
              path: "rate_of_fire",
              op: "multiply",
              value: 1.25,
            });
            mods.push({
              file: unit,
              path: "max_range",
              op: "multiply",
              value: 1.5,
            });
            mods.push({
              file: unit,
              path: "yaw_rate",
              op: "multiply",
              value: 4,
            });
            mods.push({
              file: unit,
              path: "pitch_rate",
              op: "multiply",
              value: 4,
            });
          };
          _.forEach(units_with_splash, modUnitSplash);
          inventory.addMods(mods);
        } else {
          // Don't clog up a slot.
          inventory.maxCards(inventory.maxCards() + 1);
        }
        ++buffCount;
        inventory.setTag("", "buffCount", buffCount);
      } else {
        // Don't clog up a slot.
        inventory.maxCards(inventory.maxCards() + 1);
        gwaioBank.addStartCard(CARD);
      }
    },
    dull: function (inventory) {
      if (inventory.lookupCard(CARD) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          // Perform dulls here
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
  };
});
