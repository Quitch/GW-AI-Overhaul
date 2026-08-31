var gwoLoadoutsLoaded;

function gwoLoadouts() {
  if (gwoLoadoutsLoaded) {
    return;
  }

  gwoLoadoutsLoaded = true;

  try {
    var validateStartingInventory = function (savedInventory, loadoutCardId) {
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
    };

    var buildGlobalTags = function (commander, playerFaction) {
      var globalTags = {
        commander: commander,
      };

      if (_.isNumber(playerFaction)) {
        globalTags.playerFaction = playerFaction;
      }

      return globalTags;
    };

    var dealStartingCard = function (
      gwoDeal,
      loaded,
      loadedCards,
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
        loaded,
        loadedCards
      );
    };

    var applyStartingInventory = function (
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
    };

    requireGW(
      [
        "shared/gw_common",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "shared/gw_inventory",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
      ],
      function (GW, loadouts, GWInventory, gwoDeal, gwoLoadoutBanks) {
        // A viewer picking their own loadout must see the mod ones they have
        // unlocked, so the banks are resolved before the list is built.
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
          model.startCards(loadouts.startCards());
        });

        // Dealt from the list the picker offers, or a loadout another card mod
        // added is selectable and then cannot be dealt, and Join does nothing.
        // The tech deck would not serve: this scene deals one card, the loadout.
        // gw_start/setup.js loads the host's start cards from allCards for the
        // same reason.
        var loadoutIds = _.uniq(
          _.map(loadouts.allCards, function (cardData) {
            return cardData.id;
          })
        );

        var cards = [];
        var deck = [];
        var loaded = $.Deferred();

        gwoDeal.setupGwoDeck(
          cards,
          deck,
          loadoutIds.length,
          loaded,
          loadoutIds
        );

        // This scene's view model has no player faction, but Cluster start cards
        // read global.playerFaction, so resolve it from the campaign game.
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

            _.forEach(globalTags, function (value, name) {
              dealInventory.setTag("global", name, value);
            });

            dealStartingCard(
              gwoDeal,
              loaded,
              cards,
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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}
gwoLoadouts();
