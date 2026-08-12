// The measured half of gw_play/cards.js. Nothing here may touch model/$/ko/game
// at define time - see testing.md, "Coverage".
define(() => ({
  // The base count, plus one for a full hand and one for the Lucky start card.
  // A falsy inventory yields the base count.
  cardsOfferedCount: function (offer, inventory) {
    let cardsToOffer = offer;

    if (
      inventory &&
      _.isFunction(inventory.handIsFull) &&
      inventory.handIsFull()
    ) {
      cardsToOffer++;
    }

    if (
      inventory &&
      _.isFunction(inventory.hasCard) &&
      inventory.hasCard("gwaio_start_lucky")
    ) {
      cardsToOffer++;
    }

    return cardsToOffer;
  },

  // Whether `card` should be withheld from a deal. Duplicates are allowed
  // across players but not within one player's deal.
  doNotDealCard: function (
    inventory,
    card,
    cardsDealt,
    dealAddSlot,
    testRun,
    systemCards
  ) {
    const cardsInSystem = Array.isArray(systemCards) ? systemCards : [];
    const systemHasCard = _.some(cardsInSystem, (systemCard) => {
      if (!systemCard) {
        return false;
      }

      if (_.isFunction(systemCard.id)) {
        return systemCard.id() === card.id;
      }

      return systemCard.id === card.id;
    });

    // Never deal Additional Data Bank as a system's pre-dealt card
    if (card.id === "gwc_add_card_slot" && dealAddSlot === false) {
      return true;
    }

    if (testRun) {
      return (
        inventory.hasCard(card.id) &&
        _.some(cardsDealt, { id: card.id }) &&
        systemHasCard
      );
    }

    return (
      inventory.hasCard(card.id) ||
      _.some(cardsDealt, { id: card.id }) ||
      systemHasCard
    );
  },

  // The weighted walk over one deal iteration; `roll` is [0, 1). Undefined when
  // nothing is dealable, or the roll falls off the end through float error.
  chooseDealIndex: function (fullHand, roll) {
    const hand = [];
    let probability = 0;

    _.forEach(fullHand, (deal, index) => {
      if (deal && deal.chance) {
        hand.push({ index, chance: deal.chance });
        probability += deal.chance;
      }
    });

    if (!hand.length) {
      return undefined;
    }

    let remaining = roll * probability;
    for (const entry of hand) {
      if (remaining < entry.chance) {
        return entry.index;
      }
      remaining -= entry.chance;
    }

    return undefined;
  },

  isStartLoadoutCardId: function (cardId) {
    return _.isString(cardId) && _.includes(cardId, "_start_");
  },

  filterStartLoadoutCards: function (cards) {
    const self = this;
    return _.filter(cards || [], (card) => self.isStartLoadoutCardId(card.id));
  },

  buildPendingStartLoadoutCard: function (card) {
    const result = _.isString(card) ? { id: card } : _.cloneDeep(card);
    if (
      result &&
      this.isStartLoadoutCardId(result.id) &&
      _.isUndefined(result.allowOverflow)
    ) {
      result.allowOverflow = true;
    }

    return result;
  },

  pendingCardsContainLoadout: function (pendingTechCards) {
    return !!(
      pendingTechCards &&
      Array.isArray(pendingTechCards.cards) &&
      pendingTechCards.cards.length &&
      _.includes(pendingTechCards.cards[0].id, "_start_")
    );
  },

  // Whether the exploration that started a deal is still live once the async
  // chooser resolves. A recorded deal is a standing obligation to every viewer,
  // so a stale one must not be recorded. The three checks cover gw_game.js's
  // three ways of ending an exploration: winTurn, move, and turn state.
  explorationStillLive: function (game, starIndex, star) {
    if (
      !game ||
      !_.isFunction(game.turnState) ||
      !_.isFunction(game.currentStar) ||
      !_.isNumber(starIndex) ||
      !star ||
      !_.isFunction(star.hasCard)
    ) {
      return false;
    }

    return (
      game.turnState() === "explore" &&
      game.currentStar() === starIndex &&
      !!star.hasCard()
    );
  },

  // Mutates the subcommander. A no-op unless the ally is Penchant.
  applyPenchantToSubcommander: function (
    subcommander,
    gwoSettings,
    gwoAI,
    rng
  ) {
    if (!gwoSettings || gwoSettings.aiAlly !== "Penchant") {
      return;
    }

    const penchantValues = gwoAI.penchants(rng);
    subcommander.character = `${subcommander.character} ${loc(penchantValues.penchantName)}`;
    subcommander.personality.personality_tags =
      subcommander.personality.personality_tags.concat(
        penchantValues.penchants
      );
  },

  // The two Sub Commanders the General Commander loadout grants. Each draws
  // from its own stream, so adding a draw to one cannot move the other.
  buildGeneralCommanderMinions: function (params) {
    const minionPool = params.minionPool || [];
    const gwoSettings = params.gwoSettings;
    const gwoAI = params.gwoAI;
    const gwoCard = params.gwoCard;
    const rng = params.rng;
    const self = this;
    const minions = [];

    if (!minionPool.length) {
      return minions;
    }

    _.times(2, (index) => {
      const minionRng = rng ? rng.stream("minion", index) : undefined;
      const baseSubcommander = minionRng
        ? minionRng.pick(minionPool)
        : _.sample(minionPool);
      if (!baseSubcommander) {
        return;
      }

      const subcommander = _.cloneDeep(baseSubcommander);
      self.applyPenchantToSubcommander(
        subcommander,
        gwoSettings,
        gwoAI,
        minionRng
      );
      minions.push({
        id: "gwc_minion",
        minion: subcommander,
        unique: gwoCard.uniqueValue(minionRng),
      });
    });

    return minions;
  },
}));
