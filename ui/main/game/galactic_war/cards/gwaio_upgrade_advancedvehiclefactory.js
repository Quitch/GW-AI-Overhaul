define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Advanced Vehicle Factory Upgrade Tech decreases advanced vehicle unit costs by 25% but also decreases the factory's health by 50%."
    ),
    summarize: _.constant("!LOC:Advanced Vehicle Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_upgrade.png"
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
      if (gwaioFunctions.hasUnit(gwaioUnits.vehicleFactoryAdvanced)) {
        chance = 60;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.vehicleFabberAdvanced,
        gwaioUnits.leveler,
        gwaioUnits.vanguard,
        gwaioUnits.sheller,
        gwaioUnits.storm,
        gwaioUnits.manhattan,
      ];
      var mods = units.map(function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.75,
        };
      });
      mods.push({
        file: gwaioUnits.vehicleFactoryAdvanced,
        path: "max_health",
        op: "multiply",
        value: 0.5,
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
