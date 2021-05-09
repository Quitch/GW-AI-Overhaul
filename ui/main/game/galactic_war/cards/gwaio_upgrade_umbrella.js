define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Umbrella Upgrade Tech enables the targeting of land and surface naval units by anti-orbital defenses."
    ),
    summarize: _.constant("!LOC:Umbrella Upgrade Tech"),
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
    deal: function () {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit("/pa/units/orbital/ion_defense/ion_defense.json")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/ion_defense/ion_defense_tool_weapon.json",
          path: "target_layers",
          op: "push",
          value: ["WL_LandHorizontal", "WL_WaterSurface"],
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
