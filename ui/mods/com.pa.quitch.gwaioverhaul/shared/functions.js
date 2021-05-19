define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/unit_names.js",
], function (gwaioUnitsToNames) {
  return {
    validatePaths: function (path) {
      var index = _.findIndex(gwaioUnitsToNames.units, { path: path });
      if (index === -1)
        console.warn(path, "is invalid or missing from GWO unit_names.js");
    },
    hasUnit: function (path) {
      this.validatePaths(path);
      return _.some(model.game().inventory().units(), function (unit) {
        return path === unit;
      });
    },
    loadoutIcon: function (loadoutId) {
      var highestDifficultyDefeated = ko
        .observable()
        .extend({ local: "gwaio_victory_" + loadoutId });
      if (highestDifficultyDefeated() === 0) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/0_casual.png";
      }
      if (highestDifficultyDefeated() === 1) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/1_iron.png";
      }
      if (highestDifficultyDefeated() === 2) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/2_bronze.png";
      }
      if (highestDifficultyDefeated() === 3) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/3_silver.png";
      }
      if (highestDifficultyDefeated() === 4) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/4_gold.png";
      }
      if (highestDifficultyDefeated() === 5) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/5_platinum.png";
      }
      if (highestDifficultyDefeated() === 6) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/6_diamond.png";
      }
      if (highestDifficultyDefeated() === 7) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/images/7_uber.png";
      } else
        return "coui://ui/main/game/galactic_war/shared/img/red-commander.png";
    },
    quellerAIEnabled: function () {
      var game = model.game();
      var originSystem = game.galaxy().stars()[game.galaxy().origin()].system();
      if (originSystem.gwaio && originSystem.gwaio.ai === "Queller") {
        return true;
      }
    },
  };
});
