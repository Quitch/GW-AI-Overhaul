define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Drifter Upgrade Tech increases the range of hover tank attacks by 25%."
    ),
    summarize: _.constant("!LOC:Drifter Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
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
      if (gwaioFunctions.hasUnit("/pa/units/land/tank_hover/tank_hover.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/tank_hover/tank_hover_tool_weapon.json",
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
