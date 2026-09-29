// The dealer every hand and star card is drawn from, in place of stock's
// gw_dealer. See shadowing.md, "Function hijacking".
define(function () {
  return function (setup) {
    var cards = setup.cards;
    var deck = setup.deck;
    var loaded = setup.loaded;
    var galaxy = setup.galaxy;
    var inventory = setup.inventory;
    var helpers = setup.helpers;
    var gwoStreams = setup.gwoStreams;
    var gwoRaces = setup.gwoRaces;

    // dealer.chooseCards() replacement - use our deck
    var chooseCards = function (params) {
      // params.rng is the deal's stream, one sub-stream per card of the hand.
      // A caller with no stream keeps the unseeded draw it always had.
      var dealStream = params.rng;
      var unseeded = dealStream ? undefined : new Math.seedrandom();
      var count = params.count;
      var star = params.star;
      var dealAddSlot = params.addSlot;
      var systemCards = params.systemCards;
      var dealInventory = params.inventory || inventory;
      var cardContexts = {};

      // One iteration of the deal loop below. `list` accumulates in the
      // loaded.then closure; `iteration` keys this card's stream.
      var dealOneCard = function (list, iteration) {
        var iterationRng = gwoStreams.iterationRng(dealStream, iteration);
        var fullHand = _.map(cards, function (card) {
          // setupGwoDeck leaves a hole where a card failed to load.
          if (!card) {
            return undefined;
          }

          var context = cardContexts[card.id];
          var cardChance;
          // A third-party card's deal() is arbitrary code, and this runs
          // inside a deferred callback where a throw is swallowed rather
          // than rejected - the hand would simply never arrive.
          try {
            cardChance =
              card.deal &&
              card.deal(
                star,
                context,
                dealInventory,
                gwoStreams.cardRng(iterationRng, card.id)
              );
          } catch (e) {
            console.error(
              "Tech card deal() threw, skipping " +
                card.id +
                ": " +
                ((e && e.stack) || e)
            );
            return undefined;
          }

          var match =
            helpers.doNotDealCard(
              dealInventory,
              card,
              list,
              dealAddSlot,
              systemCards
            ) ||
            !helpers.raceCanDeal(
              gwoRaces,
              dealInventory,
              card.id,
              model.gwoCardsToUnits
            );

          if (match && cardChance) {
            cardChance.chance = 0;
          }

          return cardChance;
        });

        var resultIndex = helpers.chooseDealIndex(
          fullHand,
          iterationRng ? iterationRng() : unseeded()
        );
        if (_.isUndefined(resultIndex)) {
          return;
        }

        var resultDeal = fullHand[resultIndex];
        var cardParams = resultDeal && resultDeal.params;
        var systemCard = {
          id: deck[resultIndex],
        };

        if (cardParams && _.isPlainObject(cardParams)) {
          _.assign(systemCard, cardParams);
        }

        list.push(systemCard);
      };

      var result = $.Deferred();
      loaded.then(function () {
        _.forEach(cards, function (card) {
          if (card && card.getContext && !cardContexts[card.id]) {
            try {
              cardContexts[card.id] = card.getContext(galaxy, dealInventory);
            } catch (e) {
              console.error(
                "Tech card getContext() threw, skipping " +
                  card.id +
                  ": " +
                  ((e && e.stack) || e)
              );
            }
          }
        });

        var list = [];

        _.times(count, dealOneCard.bind(null, list));

        result.resolve(list);
      });
      return result;
    };

    return chooseCards;
  };
});
