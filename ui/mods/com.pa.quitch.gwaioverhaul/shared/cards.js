define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js"], function (
  gwaioTech
) {
  return {
    hasUnit: function (inventoryUnits, units) {
      if (_.isArray(units)) {
        return _.some(_.intersection(inventoryUnits, units));
      } else {
        return _.some(inventoryUnits, function (path) {
          return units === path;
        });
      }
    },
    missingUnit: function (inventoryUnits, units) {
      if (_.isArray(units)) {
        for (var unit of units) {
          if (!_.includes(inventoryUnits, unit)) {
            return true;
          }
        }
      } else {
        return _.includes(inventoryUnits, units);
      }
      return false;
    },
    loadoutIcon: function (loadoutId) {
      var highestDifficultyDefeated = ko
        .observable()
        .extend({ local: "gwaio_victory_" + loadoutId });
      if (highestDifficultyDefeated() === 0) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/0_casual.png";
      }
      if (highestDifficultyDefeated() === 1) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/1_iron.png";
      }
      if (highestDifficultyDefeated() === 2) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/2_bronze.png";
      }
      if (highestDifficultyDefeated() === 3) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/3_silver.png";
      }
      if (highestDifficultyDefeated() === 4) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/4_gold.png";
      }
      if (highestDifficultyDefeated() === 5) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/5_platinum.png";
      }
      if (highestDifficultyDefeated() === 6) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/6_diamond.png";
      }
      if (highestDifficultyDefeated() === 7) {
        return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/7_uber.png";
      }
      return "coui://ui/main/game/galactic_war/shared/img/red-commander.png";
    },
    setupCluster: function (inventory) {
      if (inventory.getTag("global", "playerFaction") === 4) {
        inventory.addMods(gwaioTech.clusterCommanders);
      }
    },
    applyDulls: function (card, inventory, units) {
      if (inventory.lookupCard(card) === 0) {
        var buffCount = inventory.getTag("", "buffCount", 0);
        if (buffCount) {
          inventory.removeUnits(units);
          inventory.setTag("", "buffCount", undefined);
        }
      }
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    startCard: function () {
      return {
        params: {
          allowOverflow: true,
        },
        chance: 0,
      };
    },
  };
});
