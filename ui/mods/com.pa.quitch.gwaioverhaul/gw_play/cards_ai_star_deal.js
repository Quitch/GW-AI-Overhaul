// The host's deal of a card to every selectable AI star.
define(function () {
  return function (params) {
    var game = params.game;
    var chooseCards = params.chooseCards;
    var gwoTreasure = params.gwoTreasure;
    var gwoSettings = params.gwoSettings;
    var gwoStreams = params.gwoStreams;
    var warRng = params.warRng;
    var cardNameSync = params.cardNameSync;
    var coopStarCards = params.coopStarCards;
    var gwoPromise = params.gwoPromise;

    // Deals of the selectable AI stars' cards in flight, from their start to
    // the star-card refresh they end with, so the AI players' pings judge
    // the cards the stars will offer.
    var aiStarDealing = ko.observable(0);

    var dealCardToSelectableAI = function (win, turnState) {
      if (model.isCampaignViewer()) {
        return $.when().promise();
      }

      var deferred = $.Deferred();

      // Avoid running twice after winning a fight
      if (!win || turnState === "end") {
        var deferredQueue = [];
        aiStarDealing(aiStarDealing() + 1);
        var dealt = function () {
          aiStarDealing(Math.max(0, aiStarDealing() - 1));
        };

        _.forEach(model.galaxy.systems(), function (system, starIndex) {
          var ai = system.star.ai();
          // A treasure planet offers a loadout derived at exploration, so it
          // never carries a pre-dealt card.
          var treasurePlanet = gwoTreasure.isTreasureStar(
            gwoSettings,
            starIndex
          );
          var validForDeal =
            gwoSettings && gwoSettings.staticTech
              ? _.isEmpty(system.star.cardList())
              : true;
          if (
            model.canSelect(starIndex) &&
            ai &&
            !treasurePlanet &&
            validForDeal
          ) {
            deferredQueue.push(
              chooseCards({
                count: 1,
                star: system.star,
                addSlot: false,
                systemCards: system.star.cardList(),
                // Every selectable AI star is re-dealt each turn, so the
                // turn count is what stops a star repeating its own card.
                rng: gwoStreams.aiStarDealRng(
                  warRng,
                  starIndex,
                  game.stats().turns()
                ),
              }).then(function (card) {
                system.star.cardList(card);
                model.sendCampaignAction("sync_star_cards", {
                  star: starIndex,
                  cards: system.star.cardList(),
                });
                return cardNameSync.setCardName(system, card, starIndex);
              })
            );
          }
        });

        // Not $.when(deferredQueue): it takes an array as one value and
        // resolves at once. It would need $.when.apply. Settled either
        // way, as model.win saves and opens the exit gate only after it.
        gwoPromise
          .settled(
            Promise.all(deferredQueue).then(function () {
              // The one caller that replaces cards viewers already hold,
              // so their offers move exactly when the host's do.
              return coopStarCards.refresh({ redeal: true });
            }),
            function (reason) {
              console.error(
                "GWO failed to deal the AI stars' cards: " +
                  ((reason && reason.stack) || reason)
              );
            }
          )
          .always(function () {
            dealt();
            deferred.resolve();
          });
      } else {
        deferred.resolve();
      }

      return deferred.promise();
    };

    return {
      dealCardToSelectableAI: dealCardToSelectableAI,
      dealing: aiStarDealing,
    };
  };
});
