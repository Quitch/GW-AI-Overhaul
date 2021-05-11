define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Ares Upgrade Tech increases the range of the rolling fortress by 25%."
    ),
    summarize: _.constant("!LOC:Ares Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png"
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
          "/pa/units/land/titan_vehicle/titan_vehicle.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/titan_vehicle/titan_vehicle_tool_weapon_main.json",
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: "/pa/units/land/titan_vehicle/titan_vehicle_tool_weapon_side.json",
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: "/pa/units/land/titan_vehicle/titan_vehicle_tool_weapon_stomp.json",
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
