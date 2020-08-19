define(["shared/gw_common"], function (GW) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Improved Fabricator Build Arms increase the build speed of all fabricator and factory build arms by 50% and reduces energy usage by 50%."
    ),
    summarize: _.constant("!LOC:Improved Fabricator Build Arms"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context) {
      var chance = 0;
      var dist = system.distance();
      if (dist > 0) {
        if (context.totalSize <= GW.balance.numberOfSystems[0]) {
          chance = 50;
          if (dist > 2) chance = 250;
          else if (dist > 4) chance = 125;
        } else if (context.totalSize <= GW.balance.numberOfSystems[1]) {
          chance = 50;
          if (dist > 3) chance = 250;
          else if (dist > 6) chance = 125;
        } else if (context.totalSize <= GW.balance.numberOfSystems[2]) {
          chance = 50;
          if (dist > 5) chance = 250;
          else if (dist > 9) chance = 125;
        } else if (context.totalSize <= GW.balance.numberOfSystems[3]) {
          chance = 50;
          if (dist > 6) chance = 250;
          else if (dist > 10) chance = 125;
        } else {
          chance = 50;
          if (dist > 7) chance = 250;
          else if (dist > 12) chance = 125;
        }
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var arms = [
        "/pa/units/air/air_factory_adv/air_factory_adv_build_arm.json",
        "/pa/units/air/air_factory/air_factory_build_arm.json",
        "/pa/units/air/fabrication_aircraft_adv/fabrication_aircraft_adv_build_arm.json",
        "/pa/units/air/fabrication_aircraft/fabrication_aircraft_build_arm.json",
        "/pa/units/air/support_platform/support_platform_build_arm.json",
        "/pa/units/land/anti_nuke_launcher/anti_nuke_launcher_build_arm.json",
        "/pa/units/land/bot_factory_adv/bot_factory_adv_build_arm.json",
        "/pa/units/land/bot_factory/bot_factory_build_arm.json",
        "/pa/units/land/bot_support_commander/bot_support_commander_tool_build_arm.json",
        "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv_build_arm.json",
        "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv_build_arm.json",
        "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat_build_arm.json",
        "/pa/units/land/fabrication_bot/fabrication_bot_build_arm.json",
        "/pa/units/land/fabrication_vehicle_adv/fabrication_vehicle_adv_build_arm.json",
        "/pa/units/land/fabrication_vehicle/fabrication_vehicle_build_arm.json",
        "/pa/units/land/unit_cannon/unit_cannon_build_arm.json",
        "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv_build_arm.json",
        "/pa/units/land/vehicle_factory/vehicle_factory_build_arm.json",
        "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot_build_arm.json",
        "/pa/units/orbital/orbital_factory/orbital_factory_build_arm.json",
        "/pa/units/orbital/orbital_launcher/orbital_launcher_build_arm.json",
        "/pa/units/sea/fabrication_barge/fabrication_barge_build_arm.json",
        "/pa/units/sea/fabrication_ship_adv/fabrication_ship_adv_build_arm.json",
        "/pa/units/sea/fabrication_ship/fabrication_ship_build_arm.json",
        "/pa/units/sea/naval_factory_adv/naval_factory_adv_build_arm.json",
        "/pa/units/sea/naval_factory/naval_factory_build_arm.json",
      ];
      var mods = [];
      var modUnit = function (arm) {
        mods.push({
          file: arm,
          path: "construction_demand.energy",
          op: "multiply",
          value: 0.5,
        });
        mods.push({
          file: arm,
          path: "construction_demand.metal",
          op: "multiply",
          value: 1.5,
        });
      };
      _.forEach(arms, modUnit);
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
