define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Laser Defense Tower Upgrade Tech increases the turn speed of the turret by 200%."
    ),
    summarize: _.constant("!LOC:Laser Defense Tower Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_combat",
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
          "/pa/units/land/laser_defense/laser_defense.json"
        )
      )
        if (
          gwaioFunctions.hasUnit(
            "/pa/units/land/bot_factory/bot_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/air/air_factory/air_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory/naval_factory.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory/vehicle_factory.json"
          ) ||
          inventory.hasCard("gwc_start_artillery") ||
          inventory.hasCard("nem_start_tower_rush")
        )
          chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/laser_defense/laser_defense_tool_weapon.json",
          path: "yaw_rate",
          op: "multiply",
          value: 3,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
