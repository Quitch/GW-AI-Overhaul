// GWO dev cheats. testCards deals one of every card in the deck, validating
// minions and duplicate handling on the way; giveCard deals the one named in
// model.cheats.giveCardId(). Both use GWO's deck, not the base game's.
define(function () {
  return function (params) {
    var game = params.game;
    var galaxy = params.galaxy;
    var inventory = params.inventory;
    var gwoSettings = params.gwoSettings;
    var playerFaction = params.playerFaction;
    var gwoDeal = params.gwoDeal;
    var gwoAI = params.gwoAI;
    var GWFactions = params.GWFactions;
    var gwoSave = params.gwoSave;
    var cards = params.cards;
    var loaded = params.loaded;
    var dealCardToSelectableAI = params.dealCardToSelectableAI;
    var helpers = params.helpers;

    var testCardForMatches = function (inventory, card) {
      var cardsDealt = [card];
      var duplicate = helpers.doNotDealCard(
        inventory,
        card,
        cardsDealt,
        false,
        true,
        [card]
      );

      if (!duplicate) {
        console.error(card.id, "failed duplication test");
      }
    };

    var applyCheatCards = function (product, inventory) {
      inventory.cards.push(product);
      inventory.applyCards();
    };

    var setupNewCardSlot = function (product) {
      product.allowOverflow = true;
      product.unique = Math.random();

      return product;
    };

    var testMinions = function (product, inventory) {
      // Flattened up front, so units.js is required once rather than per minion.
      require([
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
      ], function (gwoUnit) {
        var clusterSecurity = gwoUnit.colonel;
        var clusterWorker = gwoUnit.angel;

        var allMinions = _.reduce(
          GWFactions,
          function (collected, faction) {
            return collected.concat(faction.minions || []);
          },
          []
        );

        _.forEach(allMinions, function (minion) {
          var minionStock = _.cloneDeep(product);
          minionStock.minion = minion;
          inventory.cards.push(minionStock);
          inventory.cards.pop();

          if (!minionStock.minion.commander) {
            // This will use the player's commander
            return;
          }

          if (
            !CommanderUtility.bySpec.getObjectName(
              minionStock.minion.commander
            ) &&
            minionStock.minion.commander !== clusterSecurity &&
            minionStock.minion.commander !== clusterWorker
          ) {
            console.error(
              "Minion commander unit spec " +
                minionStock.minion.commander +
                " invalid"
            );
          }
        });
      });
    };

    var dealSubCommander = function (product) {
      var subcommander = _.cloneDeep(
        _.sample(GWFactions[playerFaction].minions)
      );
      helpers.applyPenchantToSubcommander(subcommander, gwoSettings, gwoAI);
      product.minion = subcommander;
      product.unique = Math.random();

      return product;
    };

    var expandInventorySize = function (galaxy, inventory, star, maxCards) {
      var sizeDifference = inventory.cards().length - maxCards;
      var deferredQueue = [];
      _.times(sizeDifference, function () {
        deferredQueue.push(
          gwoDeal
            .dealCard(
              {
                id: "gwc_add_card_slot",
                galaxy: galaxy,
                inventory: inventory,
                star: star,
              },
              loaded,
              cards
            )
            .then(function (product) {
              product = setupNewCardSlot(product);
              applyCheatCards(product, inventory);
            })
        );
      });
      return $.when.apply($, deferredQueue);
    };

    // We need cheats to deal from our deck
    model.cheats.testCards = function () {
      if (model.isCampaignViewer()) {
        console.error(
          "[GW COOP] cheats.testCards is unavailable for co-op viewers"
        );
        return;
      }

      var star = galaxy.stars()[game.currentStar()];
      var maxCards = inventory.maxCards() + 1; // start card doesn't use a slot
      var deferredQueue = [];

      _.forEach(model.gwoCards, function (cardId) {
        deferredQueue.push(
          gwoDeal
            .dealCard(
              {
                id: cardId,
                galaxy: galaxy,
                inventory: inventory,
                star: star,
              },
              loaded,
              cards
            )
            .then(function (product) {
              if (product.id === "gwc_minion") {
                testMinions(product, inventory);
                product = dealSubCommander(product);
              } else if (product.id === "gwc_add_card_slot") {
                product = setupNewCardSlot(product);
              }
              applyCheatCards(product, inventory);
              if (!product.unique) {
                testCardForMatches(inventory, product);
              }
            })
        );
      });
      deferredQueue.push(
        expandInventorySize(galaxy, inventory, star, maxCards)
      );

      $.when.apply($, deferredQueue).then(function () {
        dealCardToSelectableAI(false).then(function () {
          model.sendCampaignSnapshot("gwo_cheat_test_cards", true);
          gwoSave(game, true);
        });
      });
    };

    model.cheats.giveCard = function () {
      if (model.isCampaignViewer()) {
        console.error(
          "[GW COOP] cheats.giveCard is unavailable for co-op viewers"
        );
        return;
      }

      var id = model.cheats.giveCardId();
      var cardId = _.find(model.gwoCards, function (card) {
        return card === id;
      });

      if (cardId) {
        gwoDeal
          .dealCard(
            {
              id: cardId,
              galaxy: galaxy,
              inventory: inventory,
              star: galaxy.stars()[game.currentStar()],
            },
            loaded,
            cards
          )
          .then(function (product) {
            if (product.id === "gwc_minion") {
              product = dealSubCommander(product);
            } else if (product.id === "gwc_add_card_slot") {
              product = setupNewCardSlot(product);
            }
            inventory.cards.push(product);
            inventory.applyCards();
            dealCardToSelectableAI(false).then(function () {
              model.sendCampaignSnapshot("gwo_cheat_give_card", true);
              gwoSave(game, true);
            });
          });
      } else {
        console.error(
          "Unable to find a card called " + model.cheats.giveCardId()
        );
      }
    };
  };
});
