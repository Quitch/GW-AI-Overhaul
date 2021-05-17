define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Aircraft Upgrade Tech enables the building of advanced structures by the basic air fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Aircraft Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_metal.png"
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
      if (
        gwaioFunctions.hasUnit("/pa/units/air/air_factory/air_factory.json") &&
        gwaioFunctions.hasUnit(
          "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/air/fabrication_aircraft/fabrication_aircraft.json",
          path: "buildable_types",
          op: "replace",
          value:
            "Land & Structure & Advanced - Factory | Factory & Advanced & Air | FabAdvBuild | FabBuild",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
