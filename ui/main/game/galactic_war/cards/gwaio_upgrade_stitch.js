define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Stitch Upgrade Tech allows the assisting of all builds by the combat fabricator."
    ),
    summarize: _.constant("!LOC:Stitch Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_efficiency",
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
          "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat_build_arm.json",
          path: "can_only_assist_with_buildable_items",
          op: "replace",
          value: false,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
