// The measured half of gw_play/cards.js. Nothing here may touch model/$/ko/game
// at define time - see testing.md, "Coverage".
define(function () {
  var isStartLoadoutCardId = function (cardId) {
    return _.isString(cardId) && _.includes(cardId, "_start_");
  };

  return {
    // The base count, plus one for a full hand and one for the Lucky start card.
    // A falsy inventory yields the base count.
    cardsOfferedCount: function (offer, inventory) {
      var cardsToOffer = offer;

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
      var cardsInSystem = _.isArray(systemCards) ? systemCards : [];
      var systemHasCard = _.some(cardsInSystem, function (systemCard) {
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
      var hand = [];
      var probability = 0;

      _.forEach(fullHand, function (deal, index) {
        if (deal && deal.chance) {
          hand.push({ index: index, chance: deal.chance });
          probability += deal.chance;
        }
      });

      if (!hand.length) {
        return undefined;
      }

      var remaining = roll * probability;
      for (var entry of hand) {
        if (remaining < entry.chance) {
          return entry.index;
        }
        remaining -= entry.chance;
      }

      return undefined;
    },

    // A reroll spends one offered card, and the last card is never rerolled.
    rerollsRemain: function (rerollsUsed, cardsOffered) {
      return rerollsUsed < cardsOffered - 1;
    },

    isStartLoadoutCardId: isStartLoadoutCardId,

    filterStartLoadoutCards: function (cards) {
      return _.filter(cards || [], function (card) {
        return isStartLoadoutCardId(card.id);
      });
    },

    buildPendingStartLoadoutCard: function (card) {
      var result = _.isString(card) ? { id: card } : _.cloneDeep(card);
      if (
        result &&
        isStartLoadoutCardId(result.id) &&
        _.isUndefined(result.allowOverflow)
      ) {
        result.allowOverflow = true;
      }

      return result;
    },

    pendingCardsContainLoadout: function (pendingTechCards) {
      return !!(
        pendingTechCards &&
        _.isArray(pendingTechCards.cards) &&
        pendingTechCards.cards.length &&
        isStartLoadoutCardId(pendingTechCards.cards[0].id)
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

      var penchantValues = gwoAI.penchants(rng);
      subcommander.character =
        subcommander.character + (" " + loc(penchantValues.penchantName));
      subcommander.personality.personality_tags =
        subcommander.personality.personality_tags.concat(
          penchantValues.penchants
        );
    },

    // A card the player's race can own nothing of is not worth a hand slot.
    // cardsToUnits is model.gwoCardsToUnits; a card with no entry passes.
    raceCanDeal: function (races, inventory, cardId, cardsToUnits) {
      if (!races) {
        return true;
      }
      var race = races.raceOf(inventory);
      if (races.isMla(race)) {
        return true;
      }
      var entry = _.find(cardsToUnits || [], { id: cardId });
      return !entry || races.cardUsable(race, entry.units);
    },

    // A Sub Commander fights as the player's race, with one of its commanders.
    // Mutates the subcommander; a no-op for MLA.
    applyRaceToSubcommander: function (subcommander, races, race, rng) {
      if (!races || races.isMla(race)) {
        return subcommander;
      }
      subcommander.race = race;
      var commander = races.commanderFor(rng, race);
      if (commander) {
        subcommander.commander = commander;
      }
      return subcommander;
    },

    // The two Sub Commanders the General Commander loadout grants. Each draws
    // from its own stream, so adding a draw to one cannot move the other.
    buildGeneralCommanderMinions: function (params) {
      var minionPool = params.minionPool || [];
      var gwoSettings = params.gwoSettings;
      var gwoAI = params.gwoAI;
      var gwoCard = params.gwoCard;
      var rng = params.rng;
      var self = this;
      var minions = [];

      if (!minionPool.length) {
        return minions;
      }

      _.times(2, function (index) {
        var minionRng = rng ? rng.stream("minion", index) : undefined;
        var baseSubcommander = minionRng
          ? minionRng.pick(minionPool)
          : _.sample(minionPool);
        if (!baseSubcommander) {
          return;
        }

        var subcommander = _.cloneDeep(baseSubcommander);
        self.applyPenchantToSubcommander(
          subcommander,
          gwoSettings,
          gwoAI,
          minionRng
        );
        self.applyRaceToSubcommander(
          subcommander,
          params.races,
          params.race,
          minionRng ? minionRng.stream("commander") : undefined
        );
        minions.push({
          id: "gwc_minion",
          minion: subcommander,
          unique: gwoCard.uniqueValue(minionRng),
        });
      });

      return minions;
    },
  };
});
