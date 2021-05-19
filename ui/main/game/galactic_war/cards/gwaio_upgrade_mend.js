define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Mend Upgrade Tech allows the assisting of all builds by the advanced combat fabricator."
    ),
    summarize: _.constant("!LOC:Mend Upgrade Tech"),
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
    deal: function (system, context, inventory) {
      var hasUnit = gwaioFunctions.hasUnit();
      var chance = 0;
      if (
        (hasUnit("/pa/units/land/bot_factory_adv/bot_factory_adv.json") ||
          inventory.hasCard("gwaio_upgrade_botfactory")) &&
        hasUnit(
          "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv_build_arm.json",
          path: "can_only_assist_with_buildable_items",
          op: "replace",
          value: false,
        },
      ]);
    },
    dull: function () {},
  };
});
