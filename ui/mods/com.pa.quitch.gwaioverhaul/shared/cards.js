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
      return _.some(units, function (unit) {
        return _.includes(inventoryUnits, unit);
      });
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
      return _.some(units, function (unit) {
        return !_.includes(inventoryUnits, unit);
      });
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
      var raw = window.localStorage["gwaio_victory_" + loadoutId];
      var decoded = raw ? JSON.parse(raw) : undefined;

      var icon;
      var hardcore = false;

      if (_.isArray(decoded)) {
        icon = decoded[0];
        hardcore = decoded[1];
      } else {
        icon = decoded;
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

    // Must run inside inventory.applyCards()'s dull phase: relies on
    // getTag/setTag's "" context resolving to the current card, and on
    // buff() having already run for every card this cycle.
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

    upgradeDeal: function (available, chance) {
      return {
        params: {
          allowOverflow: true,
        },
        chance: available ? chance || 60 : 0,
      };
    },

    conditionalDeal: function (available, chance) {
      return { chance: available ? chance : 0 };
    },

    // Whether a system counts as "isolated" for deal chance scaling: distant
    // enough, relative to how many systems the galaxy has, that a player could
    // plausibly have skipped this tech tree so far. numberOfSystems is the
    // caller's GW.balance.numberOfSystems tier table - passed in rather than
    // imported so this module stays dependency-free (base-game "shared/gw_common"
    // isn't shippable/loadable here, and every card transitively depends on
    // this file - see amd-loader.js's NOT_SHIPPED note).
    travelledFar: function (system, context, numberOfSystems) {
      var dist = system.distance();
      return (
        (context.totalSize <= numberOfSystems[0] && dist > 2) ||
        (context.totalSize <= numberOfSystems[1] && dist > 3) ||
        (context.totalSize <= numberOfSystems[2] && dist > 4) ||
        (context.totalSize <= numberOfSystems[3] && dist > 5) ||
        dist > 6
      );
    },

    // Builds an addMods() array for the common case of one file/op applied to
    // several stat paths, e.g. mods(gwoUnit.x, "replace", { max_health: 100 }).
    mods: function (file, op, props) {
      return _.map(_.keys(props), function (path) {
        return { file: file, path: path, op: op, value: props[path] };
      });
    },

    // Shared deal() shape for the gwaio_anti_* counter-tech cards: each one is
    // countered by a specific opposing anti_ card (chance drops to 0), and
    // otherwise gets half its base chance once any anti_ tech is already held
    // (so the deck doesn't keep offering more of them once the theme is set).
    antiTechDeal: function (inventory, baseChance, excludedCardId) {
      if (inventory.hasCard(excludedCardId)) {
        return { chance: 0 };
      }
      var hasAntiTech = _.some(
        model.game().inventory().cards(),
        function (card) {
          return _.startsWith(card.id, "gwaio_anti_");
        }
      );
      return { chance: hasAntiTech ? baseChance / 2 : baseChance };
    },

    hasT2Access: function (inventory) {
      return _.some(inventory.cards(), function (card) {
        return _.includes(model.gwoCardsGrantingAdvancedTech, card.id);
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
