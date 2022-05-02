define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/tech.js"], function (
  gwoTech
) {
  return {
    hasUnit: function (inventoryUnits, units) {
      if (_.isArray(units)) {
        for (var unit of units) {
          if (_.includes(inventoryUnits, unit)) {
            return true;
          }
        }
      } else {
        return _.includes(inventoryUnits, units);
      }
      return false;
    },
    // cannot use !hasUnit() as it matches any unit
    // missingUnit() matches any missing unit
    missingUnit: function (inventoryUnits, units) {
      if (_.isArray(units)) {
        for (var unit of units) {
          if (!_.includes(inventoryUnits, unit)) {
            return true;
          }
        }
      } else {
        return !_.includes(inventoryUnits, units);
      }
      return false;
    },
    loadoutIcon: function (loadoutId) {
      var highestDifficultyDefeated = ko
        .observable()
        .extend({ local: "gwaio_victory_" + loadoutId });
      switch (highestDifficultyDefeated()) {
        case -1: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/8_custom.png";
        }
        case 0: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/0_casual.png";
        }
        case 1: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/1_iron.png";
        }
        case 2: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/2_bronze.png";
        }
        case 3: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/3_silver.png";
        }
        case 4: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/4_gold.png";
        }
        case 5: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/5_platinum.png";
        }
        case 6: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/6_diamond.png";
        }
        case 7: {
          return "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/7_uber.png";
        }
        default: {
          return "coui://ui/main/game/galactic_war/shared/img/red-commander.png";
        }
      }
    },
    setupCluster: function (inventory) {
      if (inventory.getTag("global", "playerFaction") === 4) {
        inventory.addMods(gwoTech.clusterCommanders);
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
