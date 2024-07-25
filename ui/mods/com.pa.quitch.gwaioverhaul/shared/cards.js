define({
  hasUnit: function (inventoryUnits, units) {
    if (_.isString(units)) {
      return _.includes(inventoryUnits, units);
    }

    for (const unit of units) {
      if (_.includes(inventoryUnits, unit)) {
        return true;
      }
    }
    return false;
  },

  // !hasUnit() matches on AND; missingUnit() matches on OR
  missingUnit: function (inventoryUnits, units) {
    if (_.isString(units)) {
      return !_.includes(inventoryUnits, units);
    }

    for (const unit of units) {
      if (!_.includes(inventoryUnits, unit)) {
        return true;
      }
    }
    return false;
  },

  loadoutIcon: function (loadoutId) {
    const highestDifficultyDefeated = ko
      .observableArray()
      .extend({ local: "gwaio_victory_" + loadoutId });
    var icon = -1;
    var hardcore = false;

    if (_.isArray(highestDifficultyDefeated())) {
      icon = highestDifficultyDefeated()[0];
      hardcore = highestDifficultyDefeated()[1];
    } else {
      icon = highestDifficultyDefeated();
    }

    const iconPath = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/";
    const append = hardcore ? "_hardcore.png" : ".png";

    switch (icon) {
      case -1: {
        return iconPath + "-1_beginner" + append;
      }
      case 0: {
        return iconPath + "0_casual" + append;
      }
      case 1: {
        return iconPath + "1_iron" + append;
      }
      case 2: {
        return iconPath + "2_bronze" + append;
      }
      case 3: {
        return iconPath + "3_silver" + append;
      }
      case 4: {
        return iconPath + "4_gold" + append;
      }
      case 5: {
        return iconPath + "5_platinum" + append;
      }
      case 6: {
        return iconPath + "6_diamond" + append;
      }
      case 7: {
        return iconPath + "7_uber" + append;
      }
      default: {
        return (
          "coui://ui/main/game/galactic_war/shared/img/red-commander" + append
        );
      }
    }
  },

  applyDulls: function (card, inventory, units) {
    if (inventory.lookupCard(card) === 0) {
      const buffCount = inventory.getTag("", "buffCount", 0);
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

  hasT2Access: function (inventory) {
    return _.some(inventory.cards(), function (card) {
      return _.some(model.gwoCardsGrantingAdvancedTech, function (t2Card) {
        return card.id === t2Card;
      });
    });
  },
});
