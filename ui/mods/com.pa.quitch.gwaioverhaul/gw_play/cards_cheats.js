// GWO dev cheats. testCards deals one of every card in the deck, validating
// minions and duplicate handling on the way; giveCard deals the one named in
// model.cheats.giveCardId(). Both use GWO's deck, not the base game's.
define(() => (params) => {
  const game = params.game;
  const galaxy = params.galaxy;
  const inventory = params.inventory;
  const gwoSettings = params.gwoSettings;
  const playerFaction = params.playerFaction;
  const gwoDeal = params.gwoDeal;
  const gwoAI = params.gwoAI;
  const GWFactions = params.GWFactions;
  const gwoSave = params.gwoSave;
  const cards = params.cards;
  const loaded = params.loaded;
  const dealCardToSelectableAI = params.dealCardToSelectableAI;
  const helpers = params.helpers;

  const testCardForMatches = (inventory, card) => {
    const cardsDealt = [card];
    const duplicate = helpers.doNotDealCard(
      inventory,
      card,
      cardsDealt,
      false,
      true,
      [card],
    );

    if (!duplicate) {
      console.error(card.id, "failed duplication test");
    }
  };

  const applyCheatCards = (product, inventory) => {
    inventory.cards.push(product);
    inventory.applyCards();
  };

  const setupNewCardSlot = (product) => {
    product.allowOverflow = true;
    product.unique = Math.random();

    return product;
  };

  const testMinions = (product, inventory) => {
    // Flattened up front, so units.js is required once rather than per minion.
    require(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"], (
      gwoUnit,
    ) => {
      const clusterSecurity = gwoUnit.colonel;
      const clusterWorker = gwoUnit.angel;

      const allMinions = _.reduce(
        GWFactions,
        (collected, faction) => collected.concat(faction.minions || []),
        [],
      );

      _.forEach(allMinions, (minion) => {
        const minionStock = _.cloneDeep(product);
        minionStock.minion = minion;
        inventory.cards.push(minionStock);
        inventory.cards.pop();

        if (!minionStock.minion.commander) {
          // This will use the player's commander
          return;
        }

        if (
          !CommanderUtility.bySpec.getObjectName(
            minionStock.minion.commander,
          ) &&
          minionStock.minion.commander !== clusterSecurity &&
          minionStock.minion.commander !== clusterWorker
        ) {
          console.error(
            `Minion commander unit spec ${minionStock.minion.commander} invalid`,
          );
        }
      });
    });
  };

  const dealSubCommander = (product) => {
    const subcommander = _.cloneDeep(
      _.sample(GWFactions[playerFaction].minions),
    );
    helpers.applyPenchantToSubcommander(subcommander, gwoSettings, gwoAI);
    product.minion = subcommander;
    product.unique = Math.random();

    return product;
  };

  const expandInventorySize = (galaxy, inventory, star, maxCards) => {
    const sizeDifference = inventory.cards().length - maxCards;
    const deferredQueue = [];
    _.times(sizeDifference, () => {
      deferredQueue.push(
        gwoDeal
          .dealCard(
            {
              id: "gwc_add_card_slot",
              galaxy,
              inventory,
              star,
            },
            loaded,
            cards,
          )
          .then((product) => {
            product = setupNewCardSlot(product);
            applyCheatCards(product, inventory);
          }),
      );
    });
    return $.when.apply($, deferredQueue);
  };

  // We need cheats to deal from our deck
  model.cheats.testCards = () => {
    if (model.isCampaignViewer()) {
      console.error(
        "[GW COOP] cheats.testCards is unavailable for co-op viewers",
      );
      return;
    }

    const star = galaxy.stars()[game.currentStar()];
    const maxCards = inventory.maxCards() + 1; // start card doesn't use a slot
    const deferredQueue = [];

    _.forEach(model.gwoCards, (cardId) => {
      deferredQueue.push(
        gwoDeal
          .dealCard(
            {
              id: cardId,
              galaxy,
              inventory,
              star,
            },
            loaded,
            cards,
          )
          .then((product) => {
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
          }),
      );
    });
    deferredQueue.push(expandInventorySize(galaxy, inventory, star, maxCards));

    $.when.apply($, deferredQueue).then(() => {
      dealCardToSelectableAI(false).then(() => {
        model.sendCampaignSnapshot("gwo_cheat_test_cards", true);
        gwoSave(game, true);
      });
    });
  };

  model.cheats.giveCard = () => {
    if (model.isCampaignViewer()) {
      console.error(
        "[GW COOP] cheats.giveCard is unavailable for co-op viewers",
      );
      return;
    }

    const id = model.cheats.giveCardId();
    const cardId = _.find(model.gwoCards, (card) => card === id);

    if (cardId) {
      gwoDeal
        .dealCard(
          {
            id: cardId,
            galaxy,
            inventory,
            star: galaxy.stars()[game.currentStar()],
          },
          loaded,
          cards,
        )
        .then((product) => {
          if (product.id === "gwc_minion") {
            product = dealSubCommander(product);
          } else if (product.id === "gwc_add_card_slot") {
            product = setupNewCardSlot(product);
          }
          inventory.cards.push(product);
          inventory.applyCards();
          dealCardToSelectableAI(false).then(() => {
            model.sendCampaignSnapshot("gwo_cheat_give_card", true);
            gwoSave(game, true);
          });
        });
    } else {
      console.error(
        `Unable to find a card called ${model.cheats.giveCardId()}`,
      );
    }
  };
});
