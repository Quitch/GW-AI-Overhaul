define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Catalyst Upgrade Tech increases the health of the Catalyst by 75%."
    ),
    summarize: _.constant("!LOC:Catalyst Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_super_weapons.png"
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
          "/pa/units/land/control_module/control_module.json"
        )
      )
        if (
          gwaioFunctions.hasUnit(
            "/pa/units/air/air_factory_adv/air_factory_adv.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/bot_factory_adv/bot_factory_adv.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/sea/naval_factory_adv/naval_factory_adv.json"
          ) ||
          gwaioFunctions.hasUnit(
            "/pa/units/land/vehicle_factory_adv/vehicle_factory_adv.json"
          )
        )
          chance = 70;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/control_module/control_module.json",
          path: "max_health",
          op: "multiply",
          value: 1.75,
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
