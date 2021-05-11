define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Helios Upgrade Tech removes the delay between the invasion titan arriving at a planet and responding to orders."
    ),
    summarize: _.constant("!LOC:Helios Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_enable_titans.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_armor",
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
          "/pa/units/orbital/titan_orbital/titan_orbital.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/orbital/titan_orbital/titan_orbital.json",
          path: "planetary_arrival_cooldown_time",
          op: "replace",
          value: 0,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
