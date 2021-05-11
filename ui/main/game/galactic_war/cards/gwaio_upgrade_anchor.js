define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Anchor Upgrade Tech increases the range of the defense satellite's weapons by 25%."
    ),
    summarize: _.constant("!LOC:Anchor Upgrade Tech"),
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
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_launcher/orbital_launcher.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/orbital_fabrication_bot/orbital_fabrication_bot.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/orbital/defense_satellite/defense_satellite.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/defense_satellite/defense_satellite_tool_ground.json",
          path: "max_range",
          op: "multiply",
          value: 1.25,
        },
        {
          file: "/pa/units/orbital/defense_satellite/defense_satellite_tool_orbital.json",
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
