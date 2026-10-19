(function () {
  try {
    // Before ko.applyBindings, as race_picker.js is: Join is bound to this
    // and submitLoadout reads self.ready() on the same object, so the swap
    // gates both. A race-locked loadout can never be joined with.
    var stockReady = model.ready;
    // The requireGW below has resolved and the war has been read. Before the
    // read the loadouts lock for no race, so Join waits for it.
    var modulesReady = ko.observable(false);
    model.ready = ko.computed(function () {
      var activeCard = model.activeStartCard();
      return (
        modulesReady() &&
        stockReady() &&
        !!activeCard &&
        !activeCard.gwoRaceLocked
      );
    });

    var cardId = function (card) {
      return card && card.id ? card.id() : undefined;
    };

    var isRaceLocked = function (card) {
      return !!card.gwoRaceLocked;
    };

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "shared/gw_inventory",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_coop_per_player_loadout/host_war.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_selection.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/starting_inventory.js",
      ],
      function (
        loadouts,
        GWInventory,
        gwoDeal,
        gwoLoadoutBanks,
        hostWar,
        loadoutSelection,
        startingInventory
      ) {
        var banksResolved = false;
        var host = ko.observable();

        // Read by shared/loadouts.js for the lock. A war that records no race
        // is an MLA one, as gw_start's default is, so a loadout whose `races`
        // leave MLA out still locks.
        model.gwoViewerPlayerRace = ko.computed(function () {
          var war = host();
          return war
            ? hostWar.playerRace(war, model.gwoViewerRace()) || "mla"
            : undefined;
        });

        // Called again whenever the race changes, so a selection resting on
        // a newly locked loadout moves. See races.md. Peeked, not read:
        // race_picker.js calls this from inside a ko.computed, and a read
        // would make it rebuild the list on every selection change.
        model.gwoRebuildStartCards = function () {
          if (!banksResolved) {
            return;
          }
          var activeCard = model.activeStartCard.peek();
          var activeId = activeCard && cardId(activeCard);
          model.startCards(loadouts.startCards());
          var index = loadoutSelection.selectableIndex(
            model.startCards.peek(),
            activeId,
            cardId,
            isRaceLocked
          );
          if (index !== -1) {
            model.activeStartCardIndex(index);
          }
        };

        // A viewer picking their own loadout must see the mod ones they have
        // unlocked, so the banks are resolved before the list is built.
        gwoLoadoutBanks.load().then(function () {
          banksResolved = true;
          model.gwoRebuildStartCards();
        });
        model.gwoViewerPlayerRace.subscribe(model.gwoRebuildStartCards);

        // Dealt from the list the picker offers, or a loadout another card mod
        // added is selectable and then cannot be dealt, and Join does nothing.
        // The tech deck would not serve: this scene deals one card, the loadout.
        // gw_start/setup.js loads the host's start cards from allCards for the
        // same reason.
        var loadoutIds = _.uniq(_.map(loadouts.allCards, "id"));

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
          // game - and the race with it: the viewer's own pick under
          // Separate races, the host's otherwise.
          hostWar
            .load()
            .then(function (host) {
              return startingInventory.build({
                GWInventory: GWInventory,
                gwoDeal: gwoDeal,
                loaded: loaded,
                loadedCards: cards,
                loadoutCardId: loadoutCardId,
                commander: commander,
                playerFaction: host && host.faction,
                playerRace: hostWar.playerRace(host, model.gwoViewerRace()),
                galaxy: galaxy,
                star: star,
              });
            })
            .then(result.resolve, result.reject);

          return result.promise();
        };
        // The race picker and Join wait on the same promise, and jQuery runs
        // no later callback on it once one throws.
        hostWar.load().then(function (war) {
          try {
            host(war);
            modulesReady(true);
          } catch (e) {
            console.error(
              "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
            );
          }
        });
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
