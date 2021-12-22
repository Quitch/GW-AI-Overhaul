define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (gwaioFunctions, gwaioUnits) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Defense Fabrication Tech reduces metal build costs of all defensive structures by 50%"
    ),
    summarize: _.constant("!LOC:Defense Fabrication Tech"),
    icon: _.constant(
      "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_turret.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_cost_reduction",
      };
    },
    getContext: gwaioFunctions.getContext,
    deal: function () {
      var chance = 50;

      return { chance: chance };
    },
    buff: function (inventory) {
      var units = [
        gwaioUnits.flak,
        gwaioUnits.galata,
        gwaioUnits.antiNukeLauncherAmmo,
        gwaioUnits.antiNukeLauncher,
        gwaioUnits.wall,
        gwaioUnits.landMine,
        gwaioUnits.laserDefenseTowerAdvanced,
        gwaioUnits.singleLaserDefenseTower,
        gwaioUnits.laserDefenseTower,
        gwaioUnits.catapult,
        gwaioUnits.anchor,
        gwaioUnits.umbrella,
        gwaioUnits.torpedoLauncherAdvanced,
        gwaioUnits.torpedoLauncher,
      ];
      var mods = [];
      units.forEach(function (unit) {
        mods.push({
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: 0.5,
        });
      });
      inventory.addMods(mods);
    },
    dull: function () {
      //empty
    },
  };
});
