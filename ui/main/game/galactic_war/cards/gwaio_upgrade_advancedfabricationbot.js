define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Fabrication Bot Upgrade Tech increases the build range of the advanced bot fabricator by 150%."
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Bot Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_bot",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(
          "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
        ) ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/fabrication_bot_adv/fabrication_bot_adv_build_arm.json",
          path: "max_range",
          op: "multiply",
          value: 2.5,
        },
      ]);
    },
    dull: function () {},
  };
});
