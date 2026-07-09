var gwoLoadoutsLoaded;

function gwoLoadouts() {
  if (gwoLoadoutsLoaded) {
    return;
  }

  gwoLoadoutsLoaded = true;

  try {
    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadouts.js",
        "shared/gw_inventory",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js",
      ],
      function (loadouts, GWInventory, gwoDeal) {
        model.startCards(loadouts.startCards);
        model.gwoCards = gwoDeal.setupGwoCards();

        const cards = [];
        const deck = [];
        const numberOfCards = model.gwoCards.length;
        var loaded = $.Deferred();

        gwoDeal.setupGwoDeck(cards, deck, numberOfCards, loaded);

        model.buildStartingInventory = function (
          loadoutCardId,
          commander,
          galaxy,
          star
        ) {
          var result = $.Deferred();
          var dealInventory = new GWInventory();
          dealInventory.setTag("global", "commander", commander);

          gwoDeal
            .dealCard(
              {
                id: loadoutCardId,
                inventory: dealInventory,
                galaxy: galaxy,
                star: star,
              },
              loaded
            )
            .then(
              function (startCardProduct) {
                var inventory = new GWInventory();
                inventory.load({
                  cards: [startCardProduct || { id: loadoutCardId }],
                  tags: {
                    global: {
                      commander: commander,
                    },
                  },
                });
                inventory.applyCards(function () {
                  var savedInventory = inventory.save();
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
                    result.reject(
                      "Co-op loadout inventory did not produce empty tech banks."
                    );
                    return;
                  }

                  result.resolve(savedInventory);
                });
              },
              function (err) {
                result.reject(err);
              }
            );

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
