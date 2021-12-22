define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Fabrication Tech reduces metal build costs of all vehicles by 25%"
    ),
    summarize: _.constant("!LOC:Vehicle Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_vehicle.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
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
        inventory.hasCard("gwc_enable_vehicles_t1") ||
        inventory.hasCard("gwc_enable_vehicles_all") ||
        inventory.hasCard("gwc_start_vehicle") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 80;
      }

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.spinner,
        gwaioUnits.stryker,
        gwaioUnits.vehicleFabberAdvanced,
        gwaioUnits.vehicleFabber,
        gwaioUnits.skitter,
        gwaioUnits.inferno,
        gwaioUnits.storm,
        gwaioUnits.vanguard,
        gwaioUnits.sheller,
        gwaioUnits.drifter,
        gwaioUnits.leveler,
        gwaioUnits.ant,
        gwaioUnits.manhattan,
      ];
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.75,
        });
      };
      _.forEach(units, modUnit);
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
