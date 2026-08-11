// The helper names this returns are a published API: third-party cards call
// them directly, and the New-GW-Cards template documents every one. Renaming
// or dropping one breaks those cards silently. See docs/tech-cards.md.
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

      // Falls through to the name on an id mismatch rather than returning. Ids and
      // names drift apart in co-op, and short-circuiting drops a viewer's cards.
      var clientId = client.id;
      var dataId = _.isUndefined(data.id) ? data.playerId : data.id;
      if (
        !_.isUndefined(clientId) &&
        !_.isUndefined(dataId) &&
        clientId === dataId
      ) {
        return true;
      }

      var clientName = client.name;
      var dataName = data.name || data.playerName;
      return !!clientName && !!dataName && clientName === dataName;
    });
  };

  // Indexed by GW.balance.numberOfSystems tier - see tech-cards.md. Small shares a
  // short/moderate threshold because star distance is integer and it spans ~8 values.
  var distances = {
    short: [3, 3, 4, 5, 6, 7, 8, 9, 10],
    moderate: [3, 4, 5, 6, 7, 8, 10, 11, 12],
    far: [4, 5, 6, 7, 8, 10, 11, 12, 13],
  };

  // Clamped against thresholds, not numberOfSystems: a longer third-party size
  // table would index past the end, and `distance > undefined` is silently false.
  var farForSize = function (system, context, numberOfSystems, thresholds) {
    var lastTier = Math.min(numberOfSystems.length, thresholds.length) - 1;
    var tier = 0;
    while (tier < lastTier && context.totalSize > numberOfSystems[tier]) {
      tier++;
    }
    return system.distance() > thresholds[tier];
  };

  return {
    getConnectedClients: getConnectedClients,

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

    // Substring rather than a prefix test because the shipped English locales are "en"
    // and "en-US", and Chrome 40's startsWith ignores its second argument. detectLanguage
    // returns nothing when the engine has no locale to report, and the source strings are
    // English, so that case is English too.
    isEnglish: function () {
      var language = i18n.detectLanguage();
      return !language || _.includes(language, "en");
    },

    // Every card that grants a slot says so as its own paragraph. Kept here so the
    // wording stays one translatable string rather than 114 copies of it.
    withSlot: function (description) {
      return (
        description +
        "<br> <br>" +
        loc("!LOC:Adds a new slot for another technology.")
      );
    },

    loadoutIcon: function (loadoutId) {
      var raw = window.localStorage["gwaio_victory_" + loadoutId];
      var decoded;

      // localStorage is user-writable, and this runs while building the loadout
      // list, so one corrupt badge record must not take the whole list down.
      try {
        decoded = raw ? JSON.parse(raw) : undefined;
      } catch (e) {
        console.warn(
          "Ignoring unreadable victory record for loadout " + loadoutId,
          e
        );
      }

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

    // gw_inventory.hasCard tests !card.unique, so only truthiness matters. Offset
    // into [1, 2) because a seeded zero would be permanent for that seed.
    uniqueValue: function (rng) {
      return rng ? 1 + rng() : Math.random();
    },

    // Tested for undefined, not falsiness: a computed weight of 0 is legitimate.
    upgradeDeal: function (available, chance) {
      var weight = _.isUndefined(chance) ? 60 : chance;
      return {
        params: {
          allowOverflow: true,
        },
        chance: available ? weight : 0,
      };
    },

    conditionalDeal: function (available, chance) {
      return { chance: available ? chance : 0 };
    },

    // Scales with retinue size, capped at double base. Cluster is exempt - its
    // subcommanders are not commanders. See tech-cards.md.
    commanderWeight: function (inventory, chance) {
      var commanders = inventory.minions().length;
      var playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
      var finalChance = playerIsCluster
        ? chance
        : Math.min(chance + Math.round(chance / 3) * commanders, chance * 2);
      return finalChance;
    },

    // Worth nothing until you field one, then opens at full base weight rather
    // than creeping up. See tech-cards.md.
    subcommanderWeight: function (inventory, chance) {
      var subcommanders = inventory.minions().length;
      if (subcommanders === 0) {
        return 0;
      }
      return Math.min(
        chance + Math.round(chance / 3) * (subcommanders - 1),
        90
      );
    },

    // Full weight only for the two states that flood every planet fought on.
    // dryChance is for a card whose value collapses without water, not merely
    // dips (see gwaio_anti_sea). See tech-cards.md.
    navalWeight: function (inventory, chance, dryChance) {
      var floodsPlanets =
        inventory.hasCard("gwaio_start_naval") ||
        inventory.hasCard("gwaio_enable_tsunami");
      if (floodsPlanets) {
        return chance;
      }
      return _.isUndefined(dryChance) ? Math.round(chance * 0.4) : dryChance;
    },

    // Prefer the wrappers below, which keep the tables private. numberOfSystems
    // is a parameter, not an import: this module must stay dependency-free, as
    // every card transitively depends on it. See tech-cards.md.
    farForSize: farForSize,

    travelledShort: function (system, context, numberOfSystems) {
      return farForSize(system, context, numberOfSystems, distances.short);
    },

    travelledModerate: function (system, context, numberOfSystems) {
      return farForSize(system, context, numberOfSystems, distances.moderate);
    },

    travelledFar: function (system, context, numberOfSystems) {
      return farForSize(system, context, numberOfSystems, distances.far);
    },

    // e.g. mods(gwoUnit.x, "replace", { max_health: 100 })
    mods: function (file, op, props) {
      return _.map(_.keys(props), function (path) {
        return { file: file, path: path, op: op, value: props[path] };
      });
    },

    // The gwaio_anti_* shape: zero against its counter card, half once any other
    // anti_ tech is held. Must read the passed inventory, never the host's.
    antiTechDeal: function (inventory, baseChance, excludedCardId) {
      if (inventory.hasCard(excludedCardId)) {
        return { chance: 0 };
      }
      var hasAntiTech = _.some(inventory.cards(), function (card) {
        return _.startsWith(card.id, "gwaio_anti_");
      });
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
