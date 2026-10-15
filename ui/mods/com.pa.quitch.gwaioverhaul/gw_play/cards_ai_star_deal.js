// The host's deal of a card to every selectable AI star, one star per task.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_paths.js",
], function (starPaths) {
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
    // the cards the stars will offer. A win holds it from before the deal.
    var aiStarDealing = ko.observable(0);

    // Returns the release, which only its first call honours.
    var hold = function () {
      aiStarDealing(aiStarDealing() + 1);
      return _.once(function () {
        aiStarDealing(aiStarDealing() - 1);
      });
    };

    var dealCardToSelectableAI = function (win, turnState) {
      if (model.isCampaignViewer()) {
        return $.when().promise();
      }

      var deferred = $.Deferred();

      // Avoid running twice after winning a fight
      if (!win || turnState === "end") {
        var targets = [];
        var dealt = hold();

        var canSelect = starPaths.selectable(model);
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
          if (canSelect(starIndex) && ai && !treasurePlanet && validForDeal) {
            targets.push({ starIndex: starIndex, system: system });
          }
        });

        // Read once: the host can move between two stars' deals.
        var turn = game.stats().turns();

        // Each star's deal runs every card's deal() in one go, so each star
        // has a task of its own. Native .then, so a throw stops the series.
        var dealStar = function (target) {
          var system = target.system;
          var starIndex = target.starIndex;

          return Promise.resolve(
            chooseCards({
              count: 1,
              star: system.star,
              addSlot: false,
              systemCards: system.star.cardList(),
              // Every selectable AI star is re-dealt each turn, so the turn
              // count is what stops a star repeating its own card.
              rng: gwoStreams.aiStarDealRng(warRng, starIndex, turn),
            })
          ).then(function (card) {
            system.star.cardList(card);
            model.sendCampaignAction("sync_star_cards", {
              star: starIndex,
              cards: system.star.cardList(),
            });
            return cardNameSync.setCardName(system, card, starIndex);
          });
        };

        // Settled either way, as model.win saves and opens the exit gate
        // only after it.
        gwoPromise
          .settled(
            gwoPromise.inSeries(targets, dealStar).then(function () {
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
      hold: hold,
    };
  };
});
