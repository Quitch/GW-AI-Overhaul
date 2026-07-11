var gwoLoadoutsLoaded;

function validateStartingInventory(savedInventory, loadoutCardId) {
  var cards = savedInventory.cards || [];
  if (
    !cards.length ||
    cards[0].id !== loadoutCardId ||
    !_.isNumber(savedInventory.maxCards) ||
    savedInventory.maxCards <= cards.length
  ) {
    console.error(
      "[GW COOP] Co-op loadout inventory did not produce empty tech banks loadout=" +
        loadoutCardId +
        " maxCards=" +
        savedInventory.maxCards +
        " cards=" +
        JSON.stringify(cards)
    );
    return false;
  }

  return true;
}

function buildGlobalTags(commander, playerFaction) {
  var globalTags = {
    commander: commander,
  };

  if (_.isNumber(playerFaction)) {
    globalTags.playerFaction = playerFaction;
  }

  return globalTags;
}

function dealStartingCard(
  gwoDeal,
  loaded,
  loadoutCardId,
  dealInventory,
  galaxy,
  star
) {
  return gwoDeal.dealCard(
    {
      id: loadoutCardId,
      inventory: dealInventory,
      galaxy: galaxy,
      star: star,
    },
    loaded
  );
}

function applyStartingInventory(
  GWInventory,
  loadoutCardId,
  globalTags,
  startCardProduct,
  result
) {
  var inventory = new GWInventory();

  inventory.load({
    cards: [startCardProduct || { id: loadoutCardId }],
    tags: {
      global: globalTags,
    },
  });

  inventory.applyCards(function () {
    var savedInventory = inventory.save();
    if (!validateStartingInventory(savedInventory, loadoutCardId)) {
      result.reject(
        "Co-op loadout inventory did not produce empty tech banks."
      );
      return;
    }

    result.resolve(savedInventory);
  });
}

function gwoLoadouts() {
  if (gwoLoadoutsLoaded) {
    return;
  }

  gwoLoadoutsLoaded = true;

  try {
    requireGW(
      [
        "shared/gw_common",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "shared/gw_inventory",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
      ],
      function (GW, loadouts, GWInventory, gwoDeal) {
        model.startCards(loadouts.startCards);
        model.gwoCards = gwoDeal.setupGwoCards();

        const cards = [];
        const deck = [];
        const numberOfCards = model.gwoCards.length;
        var loaded = $.Deferred();

        gwoDeal.setupGwoDeck(cards, deck, numberOfCards, loaded);

        // In this scene, the view model does not expose player faction, so we
        // resolve it from the active campaign game and carry it into the
        // temporary/saved loadout inventories. Cluster start cards rely on
        // global.playerFaction to inject required commander modifiers.
        var resolvePlayerFaction = function () {
          var deferred = $.Deferred();
          var activeGameId = _.isFunction(model.activeGameId)
            ? model.activeGameId()
            : undefined;

          if (!activeGameId) {
            deferred.resolve(undefined);
            return deferred.promise();
          }

          GW.manifest.loadGame(activeGameId).then(
            function (game) {
              var gameInventory =
                game && _.isFunction(game.inventory)
                  ? game.inventory()
                  : undefined;
              var playerFaction =
                gameInventory && _.isFunction(gameInventory.getTag)
                  ? gameInventory.getTag("global", "playerFaction")
                  : undefined;

              deferred.resolve(playerFaction);
            },
            function () {
              deferred.resolve(undefined);
            }
          );

          return deferred.promise();
        };

        model.buildStartingInventory = function (
          loadoutCardId,
          commander,
          galaxy,
          star
        ) {
          var result = $.Deferred();
          resolvePlayerFaction().then(function (playerFaction) {
            var dealInventory = new GWInventory();
            var globalTags = buildGlobalTags(commander, playerFaction);

            dealInventory.setTag("global", "commander", commander);
            if (_.isNumber(playerFaction)) {
              dealInventory.setTag("global", "playerFaction", playerFaction);
            }

            dealStartingCard(
              gwoDeal,
              loaded,
              loadoutCardId,
              dealInventory,
              galaxy,
              star
            ).then(
              function (startCardProduct) {
                applyStartingInventory(
                  GWInventory,
                  loadoutCardId,
                  globalTags,
                  startCardProduct,
                  result
                );
              },
              function (err) {
                result.reject(err);
              }
            );
          });

          return result.promise();
        };
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoLoadouts();
