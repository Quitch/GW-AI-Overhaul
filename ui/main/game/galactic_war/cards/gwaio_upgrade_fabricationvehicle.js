define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Fabrication Vehicle Upgrade Tech enables the building of advanced structures by the basic vehicle fabricator."
    ),
    summarize: _.constant("!LOC:Fabrication Vehicle Upgrade Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
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
          "/pa/units/land/vehicle_factory/vehicle_factory.json"
        ) &&
        gwaioFunctions.hasUnit(
          "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json"
        )
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      var mods = [
        {
          file: "/pa/units/land/fabrication_vehicle/fabrication_vehicle.json",
          path: "buildable_types",
          op: "replace",
          value:
            "Structure & Land & Advanced - Factory | Factory & Land & Tank & Advanced | FabAdvBuild | FabBuild",
        },
      ];
      inventory.addMods(mods);
    },
    dull: function () {},
  };
});
