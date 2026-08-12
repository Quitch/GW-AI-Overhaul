var gwoLoadoutsLoaded;

function gwoLoadouts() {
  if (gwoLoadoutsLoaded) {
    return;
  }

  gwoLoadoutsLoaded = true;

  try {
    const validateStartingInventory = (savedInventory, loadoutCardId) => {
      const cards = savedInventory.cards || [];
      if (
        !cards.length ||
        cards[0].id !== loadoutCardId ||
        !_.isNumber(savedInventory.maxCards) ||
        savedInventory.maxCards <= cards.length
      ) {
        console.error(
          `[GW COOP] Co-op loadout inventory did not produce empty tech banks loadout=${loadoutCardId} maxCards=${savedInventory.maxCards} cards=${JSON.stringify(cards)}`
        );
        return false;
      }

      return true;
    };

    const buildGlobalTags = (commander, playerFaction) => {
      const globalTags = {
        commander,
      };

      if (_.isNumber(playerFaction)) {
        globalTags.playerFaction = playerFaction;
      }

      return globalTags;
    };

    const dealStartingCard = (
      gwoDeal,
      loaded,
      loadedCards,
      loadoutCardId,
      dealInventory,
      galaxy,
      star
    ) =>
      gwoDeal.dealCard(
        {
          id: loadoutCardId,
          inventory: dealInventory,
          galaxy,
          star,
        },
        loaded,
        loadedCards
      );

    const applyStartingInventory = (
      GWInventory,
      loadoutCardId,
      globalTags,
      startCardProduct,
      result
    ) => {
      const inventory = new GWInventory();

      inventory.load({
        cards: [startCardProduct || { id: loadoutCardId }],
        tags: {
          global: globalTags,
        },
      });

      inventory.applyCards(() => {
        const savedInventory = inventory.save();
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
      (GW, loadouts, GWInventory, gwoDeal, gwoLoadoutBanks) => {
        // A viewer picking their own loadout must see the mod ones they have
        // unlocked, so the banks are resolved before the list is built.
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
          model.startCards(loadouts.startCards());
        });

        model.gwoCards = gwoDeal.setupGwoCards();

        const cards = [];
        const deck = [];
        const numberOfCards = model.gwoCards.length;
        const loaded = $.Deferred();

        gwoDeal.setupGwoDeck(cards, deck, numberOfCards, loaded);

        // This scene's view model has no player faction, but Cluster start cards
        // read global.playerFaction, so resolve it from the campaign game.
        const resolvePlayerFaction = () => {
          const deferred = $.Deferred();
          const activeGameId = _.isFunction(model.activeGameId)
            ? model.activeGameId()
            : undefined;

          if (!activeGameId) {
            deferred.resolve(undefined);
            return deferred.promise();
          }

          GW.manifest.loadGame(activeGameId).then(
            (game) => {
              const gameInventory =
                game && _.isFunction(game.inventory)
                  ? game.inventory()
                  : undefined;
              const playerFaction =
                gameInventory && _.isFunction(gameInventory.getTag)
                  ? gameInventory.getTag("global", "playerFaction")
                  : undefined;

              deferred.resolve(playerFaction);
            },
            () => {
              deferred.resolve(undefined);
            }
          );

          return deferred.promise();
        };

        model.buildStartingInventory = (
          loadoutCardId,
          commander,
          galaxy,
          star
        ) => {
          const result = $.Deferred();
          resolvePlayerFaction().then((playerFaction) => {
            const dealInventory = new GWInventory();
            const globalTags = buildGlobalTags(commander, playerFaction);

            dealInventory.setTag("global", "commander", commander);
            if (_.isNumber(playerFaction)) {
              dealInventory.setTag("global", "playerFaction", playerFaction);
            }

            dealStartingCard(
              gwoDeal,
              loaded,
              cards,
              loadoutCardId,
              dealInventory,
              galaxy,
              star
            ).then(
              (startCardProduct) => {
                applyStartingInventory(
                  GWInventory,
                  loadoutCardId,
                  globalTags,
                  startCardProduct,
                  result
                );
              },
              (err) => {
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
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoLoadouts();
