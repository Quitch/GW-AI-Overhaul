define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Air Factory Upgrade Tech enables the building of advanced units by basic air manufacturing."
    ),
    summarize: _.constant("!LOC:Air Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_combat_air.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_air",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function () {
      var chance = 0;
      if (gwaioFunctions.hasUnit("/pa/units/air/air_factory/air_factory.json"))
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/air/air_factory/air_factory.json",
          path: "buildable_types",
          op: "replace",
          value: "Air & Mobile & FactoryBuild",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
