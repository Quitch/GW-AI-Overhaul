define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/decks.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deck_mods.js",
], function (gwoLoadoutIds, decks, deckMods) {
  return {
    setupGwoCards: function (gwoSettings) {
      var loadouts = gwoLoadoutIds.all;
      // Decks a mod registered in this scene; before cardsFor, so the war's
      // techCardDeck can name one of them.
      deckMods.registerAll();
      // global for modder compatibility - New-GW-Cards pushes here
      model.gwoCards = _.isArray(model.gwoCards) ? model.gwoCards : [];

      // Deduplicated because setupGwoDeck indexes by position: a modder id that
      // collides with a shipped one would otherwise leave a hole in the deck.
      return _.uniq(
        model.gwoCards.concat(
          loadouts,
          decks.cardsFor(gwoSettings && gwoSettings.techCardDeck)
        )
      );
    },

    // By index, not push: requireGW resolves in load order, and the deal walks the
    // deck in array order, so load order would remap every roll. See galaxy.md.
    setupGwoDeck: function (cards, deck, cardsRemaining, promise) {
      _.forEach(model.gwoCards, function (cardId, index) {
        requireGW(["cards/" + cardId], function (card) {
          // A third-party id whose module is missing or returns nothing must
          // still count towards the tally: leaving it outstanding would hang
          // every deal in the war rather than costing one card.
          if (card) {
            card.id = cardId;
            cards[index] = card;
            deck[index] = cardId;
          } else {
            console.error("GWO card loaded but returned nothing:", cardId);
          }
          --cardsRemaining;
          if (cardsRemaining === 0) {
            promise.resolve();
          }
        });
      });
    },

    dealCard: function (params, loaded, loadedCards) {
      var result = $.Deferred();
      loaded.then(function () {
        var card = _.find(loadedCards, { id: params.id });

        if (!card) {
          result.reject(new Error("GWO card not found: " + params.id));
          return result;
        }

        var product = { id: params.id };

        // The card is arbitrary third-party code and this is a jQuery deferred
        // callback, where a throw neither rejects nor surfaces - it would leave
        // the caller waiting forever. Reject instead, and let it be handled.
        try {
          var context =
            card.getContext && card.getContext(params.galaxy, params.inventory);

          var deal =
            card.deal &&
            card.deal(params.star, context, params.inventory, params.rng);
          var cardParams = deal && deal.params;
          if (cardParams && _.isPlainObject(cardParams)) {
            _.assign(product, cardParams);
          }
          card.keep && card.keep(deal, context);
          card.releaseContext && card.releaseContext(context);
        } catch (e) {
          console.error("GWO card threw while being dealt:", params.id, e);
          result.reject(e);
          return;
        }

        result.resolve(product);
      });
      return result;
    },
  };
});
