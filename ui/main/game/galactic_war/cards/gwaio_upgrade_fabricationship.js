define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Ship Upgrade Tech enables the building of advanced structures by the basic ship fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Ship Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_sea",
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
          "/pa/units/sea/fabrication_ship/fabrication_ship.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/sea/fabrication_ship/fabrication_ship.json",
          path: "buildable_types",
          op: "replace",
          value:
            "Naval & Structure & Advanced | Naval & Factory & Advanced | FabAdvBuild | FabBuild",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
