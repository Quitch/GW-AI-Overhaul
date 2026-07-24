// Pure card-dealing helpers extracted out of gw_play/cards.js so they can be unit
// tested under the Node AMD harness (cards.js is a self-invoking scene script that
// never calls define() and so is unloadable/untestable in place). No deps beyond the
// lodash global, and nothing here touches model/$/ko/game at define time - matching
// shared/cards.js. cards.js loads this via its main requireGW and threads the returned
// object through the extracted factories as `helpers`.
define(function () {
  return {
    // How many tech cards to offer for a deal: the base count plus one for a full hand
    // and one more when the Lucky start card is held. inventory is passed explicitly
    // (callers with no inventory in hand pass game.inventory()); a falsy inventory just
    // yields the base count.
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

    // Whether `card` should be withheld from a deal. systemCards is the list of cards
    // already present in the system (duplicates are allowed across players but not
    // within one player's deal); callers always pass an array. In testRun mode this
    // instead asserts a card that *should* be a duplicate is detected as one.
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

    isStartLoadoutCardId: function (cardId) {
      return _.isString(cardId) && _.includes(cardId, "_start_");
    },

    filterStartLoadoutCards: function (cards) {
      var self = this;
      return _.filter(cards || [], function (card) {
        return self.isStartLoadoutCardId(card.id);
      });
    },

    buildPendingStartLoadoutCard: function (card) {
      var result = _.isString(card) ? { id: card } : _.cloneDeep(card);
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
        _.isArray(pendingTechCards.cards) &&
        pendingTechCards.cards.length &&
        _.includes(pendingTechCards.cards[0].id, "_start_")
      );
    },

    // Attach the co-op ally's penchant to a subcommander in place. Reads the runtime
    // `loc` global; gwoSettings/gwoAI are injected so this stays pure and testable. A
    // no-op unless the ally is Penchant.
    applyPenchantToSubcommander: function (subcommander, gwoSettings, gwoAI) {
      if (!gwoSettings || gwoSettings.aiAlly !== "Penchant") {
        return;
      }

      var penchantValues = gwoAI.penchants();
      subcommander.character =
        subcommander.character + (" " + loc(penchantValues.penchantName));
      subcommander.personality.personality_tags =
        subcommander.personality.personality_tags.concat(
          penchantValues.penchants
        );
    },
  };
});
