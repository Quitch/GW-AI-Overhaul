define(function () {
  var getConnectedClients = function () {
    return _.isFunction(model.gwCampaignConnectedClients) &&
      _.isArray(model.gwCampaignConnectedClients())
      ? model.gwCampaignConnectedClients()
      : [];
  };

  var isConnectedPlayerInventory = function (data, connectedClients) {
    return _.some(connectedClients, function (client) {
      if (!client || !data) {
        return false;
      }

      var clientId = client.id;
      var dataId = _.isUndefined(data.id) ? data.playerId : data.id;
      if (!_.isUndefined(clientId) && !_.isUndefined(dataId)) {
        return clientId === dataId;
      }

      var clientName = client.name;
      var dataName = data.name || data.playerName;
      return !!clientName && !!dataName && clientName === dataName;
    });
  };

  return {
    hasUnit: function (inventoryUnits, units) {
      if (_.isString(units)) {
        return _.includes(inventoryUnits, units);
      }

      for (var unit of units) {
        if (_.includes(inventoryUnits, unit)) {
          return true;
        }
      }
      return false;
    },

    hasAllUnits: function (inventoryUnits, units) {
      if (_.isString(units)) {
        return _.includes(inventoryUnits, units);
      }

      return _.every(units, function (unit) {
        return _.includes(inventoryUnits, unit);
      });
    },

    missingUnit: function (inventoryUnits, units) {
      if (_.isString(units)) {
        return !_.includes(inventoryUnits, units);
      }

      for (var unit of units) {
        if (!_.includes(inventoryUnits, unit)) {
          return true;
        }
      }
      return false;
    },

    missingAllUnits: function (inventoryUnits, units) {
      if (_.isString(units)) {
        return !_.includes(inventoryUnits, units);
      }

      return _.every(units, function (unit) {
        return !_.includes(inventoryUnits, unit);
      });
    },

    loadoutIcon: function (loadoutId) {
      var highestDifficultyDefeated = ko
        .observableArray()
        .extend({ local: "gwaio_victory_" + loadoutId });
      var icon;
      var hardcore = false;

      if (_.isArray(highestDifficultyDefeated())) {
        icon = highestDifficultyDefeated()[0];
        hardcore = highestDifficultyDefeated()[1];
      } else {
        icon = highestDifficultyDefeated();
      }

      var iconPath = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/";
      var append = hardcore ? "_hardcore.png" : ".png";

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
          return "coui://ui/main/game/galactic_war/shared/img/red-commander.png";
        }
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

    hasT2Access: function (inventory) {
      return _.some(inventory.cards(), function (card) {
        return _.some(model.gwoCardsGrantingAdvancedTech, function (t2Card) {
          return card.id === t2Card;
        });
      });
    },

    getAllConnectedPlayerCards: function (hostInventory, game) {
      var activeGame = game || model.game();
      var connectedClients = getConnectedClients();
      var coopPlayerInventoryData =
        activeGame && _.isFunction(activeGame.coopPlayerInventoryData)
          ? activeGame.coopPlayerInventoryData()
          : [];
      var allCards =
        hostInventory && _.isFunction(hostInventory.cards)
          ? hostInventory.cards().slice(0)
          : [];

      _.forEach(coopPlayerInventoryData, function (data) {
        if (!isConnectedPlayerInventory(data, connectedClients)) {
          return;
        }

        if (data.inventory && _.isArray(data.inventory.cards)) {
          allCards = allCards.concat(data.inventory.cards);
        }
      });

      return allCards;
    },

    anyPlayerHasCard: function (hostInventory, cardId, game) {
      var activeGame = game || model.game();
      var coopPlayerInventoryData =
        activeGame && _.isFunction(activeGame.coopPlayerInventoryData)
          ? activeGame.coopPlayerInventoryData()
          : [];
      var connectedClients = getConnectedClients();

      return (
        (hostInventory &&
          _.isFunction(hostInventory.hasCard) &&
          hostInventory.hasCard(cardId)) ||
        _.some(coopPlayerInventoryData, function (data) {
          if (!isConnectedPlayerInventory(data, connectedClients)) {
            return false;
          }

          return (
            data.inventory &&
            _.isArray(data.inventory.cards) &&
            _.some(data.inventory.cards, { id: cardId })
          );
        })
      );
    },
  };
});
