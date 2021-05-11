define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Hummingbird Upgrade Tech adds the ability for fighters to move between planets."
    ),
    summarize: _.constant("!LOC:Hummingbird Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_air_engine.png"
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
      if (gwaioFunctions.hasUnit("/pa/units/air/fighter/fighter.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/air/fighter/fighter.json",
          path: "system_velocity_multiplier",
          op: "replace",
          value: 15,
        },
        {
          file: "/pa/units/air/fighter/fighter.json",
          path: "gravwell_velocity_multiplier",
          op: "replace",
          value: 6,
        },
        {
          file: "/pa/units/air/fighter/fighter.json",
          path: "navigation.inter_planetary_type",
          op: "replace",
          value: "system",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
