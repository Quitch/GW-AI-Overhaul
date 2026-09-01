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

    // The deal gate reads the race off each inventory, so the tag travels with
    // the viewer's: their own pick under Separate races, the host's otherwise.
    // See races.md.
    var buildGlobalTags = function (commander, playerFaction, playerRace) {
      var globalTags = {
        commander: commander,
      };

      if (_.isNumber(playerFaction)) {
        globalTags.playerFaction = playerFaction;
      }
      if (_.isString(playerRace) && playerRace.length) {
        globalTags.playerRace = playerRace;
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "shared/gw_inventory",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_coop_per_player_loadout/host_war.js",
      ],
      function (loadouts, GWInventory, gwoDeal, gwoLoadoutBanks, hostWar) {
        var banksResolved = false;

        // Called again whenever the race changes: an MLA-only loadout is not
        // offered to a race player. See races.md.
        model.gwoRebuildStartCards = function () {
          if (banksResolved) {
            model.startCards(loadouts.startCards());
          }
        };

        // A viewer picking their own loadout must see the mod ones they have
        // unlocked, so the banks are resolved before the list is built.
        requireGW(gwoLoadoutBanks.paths(), function () {
          gwoLoadoutBanks.resolve(_.toArray(arguments));
          banksResolved = true;
          model.gwoRebuildStartCards();
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

        model.buildStartingInventory = function (
          loadoutCardId,
          commander,
          galaxy,
          star
        ) {
          var result = $.Deferred();
          // This scene's view model has no player faction, but Cluster start
          // cards read global.playerFaction, so it comes from the campaign
          // game - and the race with it.
          hostWar.load().then(function (host) {
            var dealInventory = new GWInventory();
            var viewerRace = _.isFunction(model.gwoViewerRace)
              ? model.gwoViewerRace()
              : undefined;
            var globalTags = buildGlobalTags(
              commander,
              host && host.faction,
              (host && host.perPlayerRace && viewerRace) || (host && host.race)
            );

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
