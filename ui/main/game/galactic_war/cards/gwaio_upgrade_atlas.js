define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Atlas Upgrade Tech increases the health of the seismic titan by 50%."
    ),
    summarize: _.constant("!LOC:Atlas Upgrade Tech"),
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
      if (gwaioFunctions.hasUnit("/pa/units/land/titan_bot/titan_bot.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/titan_bot/titan_bot.json",
          path: "max_health",
          op: "multiply",
          value: 1.5,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
