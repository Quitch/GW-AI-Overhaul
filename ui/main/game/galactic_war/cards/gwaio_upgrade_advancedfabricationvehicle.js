define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Fabrication Vehicle Upgrade Tech increases the build range of the advanced vehicle fabricator by 150%."
    ),
    summarize: _.constant("!LOC:Advanced Fabrication Vehicle Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_metal_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        (gwaioFunctions.hasUnit(gwaioUnits.vehicleFactoryAdvanced) ||
          inventory.hasCard("gwaio_upgrade_vehiclefactory")) &&
        gwaioFunctions.hasUnit(gwaioUnits.vehicleFabberAdvanced)
      ) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: gwaioUnits.vehicleFabberAdvancedBuildArm,
          path: "max_range",
          op: "multiply",
          value: 2.5,
        },
      ]);
    },
    dull: function () {
      //empty
    },
  };
});
