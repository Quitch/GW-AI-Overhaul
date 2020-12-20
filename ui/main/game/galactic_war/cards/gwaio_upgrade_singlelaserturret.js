define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Single Laser Turret Upgrade Tech replaces the basic turret's laser with a flamethrower."
    ),
    summarize: _.constant("!LOC:Single Laser Turret Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/laser_defense_single/laser_defense_single.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file:
            "/pa/units/land/laser_defense_single/laser_defense_single_tool_weapon.json",
          path: "ammo_id",
          op: "replace",
          value: "/pa/units/land/tank_armor/tank_armor_ammo.json",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
