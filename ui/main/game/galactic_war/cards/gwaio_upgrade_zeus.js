define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Zeus Upgrade Tech adds the ability for the lightning titan to move between planets."
    ),
    summarize: _.constant("!LOC:Zeus Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_enable_titans_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_speed",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit("/pa/units/air/titan_air/titan_air.json")) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/air/titan_air/titan_air.json",
          path: "system_velocity_multiplier",
          op: "replace",
          value: 15,
        },
        {
          file: "/pa/units/air/titan_air/titan_air.json",
          path: "gravwell_velocity_multiplier",
          op: "replace",
          value: 6,
        },
        {
          file: "/pa/units/air/titan_air/titan_air.json",
          path: "navigation.inter_planetary_type",
          op: "replace",
          value: "system",
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
