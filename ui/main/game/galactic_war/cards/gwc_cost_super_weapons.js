define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], function (
  gwaioUnits
) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Super Weapon Fabrication Tech reduces metal build costs of all nuclear missiles, Halley Rockets, and metal planet control modules by 75%. Tech to build super weapons is required."
    ),
    summarize: _.constant("!LOC:Super Weapon Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_super_weapons.png"
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
        inventory.hasCard("gwc_enable_vehicles_all") ||
        inventory.hasCard("gwc_enable_bots_all") ||
        inventory.hasCard("gwc_enable_air_all") ||
        inventory.hasCard("gwaio_start_hoarder")
      ) {
        chance = 60;
      }
      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.catalyst,
        gwaioUnits.nukeLauncherAmmo,
        gwaioUnits.nukeLauncher,
        gwaioUnits.halley,
      ];
      var mods = [];
      var modUnit = function (unit) {
        mods.push({
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.25,
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
