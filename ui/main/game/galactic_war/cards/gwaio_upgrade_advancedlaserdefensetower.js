define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Laser Defense Tower Upgrade Tech increases the rate of fire of the advanced turret by 300%, but it fires in bursts and requires energy to recharge."
    ),
    summarize: _.constant("!LOC:Advanced Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_defense.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_ammunition",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (_, __, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/laser_defense_adv/laser_defense_adv.json"
        ) &&
        (gwaioFunctions.hasUnit(
          "/pa/units/air/air_factory_adv/air_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_airfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_botfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_navalfactory") ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
          ) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory") ||
          inventory.hasCard("nem_start_tower_rush"))
      )
        chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "rate_of_fire",
          op: "multiply",
          value: 4,
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "ammo_source",
          op: "replace",
          value: "energy",
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "ammo_capacity",
          op: "replace",
          value: 1200,
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "ammo_demand",
          op: "replace",
          value: 300,
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "ammo_per_shot",
          op: "replace",
          value: 100,
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "spread_fire",
          op: "replace",
          value: true,
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "carpet_fire",
          op: "replace",
          value: true,
        },
        {
          file:
            "/pa/units/land/laser_defense_adv/laser_defense_adv_tool_weapon.json",
          path: "carpet_wait_for_full_ammo",
          op: "replace",
          value: true,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
