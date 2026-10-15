// The host's deal of a card to every selectable AI star, one star per task.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_publish.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save_debt.js",
], function (starPaths, coopPublish, saveDebt) {
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
    // Deals whose stars are not all dealt yet. systems.js's canMove reads it:
    // a host who moved mid-deal would reach a star before its new card.
    var starsDealing = params.starsDealing;

    // Deals of the selectable AI stars' cards in flight, from their start to
    // the star-card refresh they end with, so the AI players' pings judge
    // the cards the stars will offer.
    var aiStarDealing = ko.observable(0);

    // Returns the release, which only its first call honours.
    var count = function (counter) {
      counter(counter() + 1);
      return _.once(function () {
        counter(counter() - 1);
      });
    };

    // The deal holds the viewers' snapshot and the war save too, so a win
    // sends one and writes once. See coop.md, "Publishing to viewers" and
    // "One save per win".
    var holdDealing = function () {
      var releaseSave = saveDebt.hold();
      var releasePublish = coopPublish.hold();
      var releaseDealing = count(aiStarDealing);
      return function () {
        releaseDealing();
        releasePublish();
        releaseSave();
      };
    };

    // A win holds both counts from before the deal, which starts only once
    // winTurn settles.
    var hold = function () {
      var releaseDealing = holdDealing();
      var releaseStars = count(starsDealing);
      return function () {
        releaseDealing();
        releaseStars();
      };
    };

    var dealCardToSelectableAI = function (win, turnState) {
      if (model.isCampaignViewer()) {
        return $.when().promise();
      }

      var deferred = $.Deferred();

      // Avoid running twice after winning a fight
      if (!win || turnState === "end") {
        var targets = [];
        var dealt = holdDealing();

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

        // Read once, so every star is dealt for the turn the deal began.
        var turn = game.stats().turns();
        var naming = [];

        var starsDealt = count(starsDealing);

        // Each star's deal runs every card's deal() in one go, so each star
        // has a task of its own. Native .then, so a throw stops the series.
        // A name waits on a module load, so the next star does not wait on it.
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
            naming.push(cardNameSync.setCardName(system, card, starIndex));
          });
        };

        // Settled either way, as model.win saves and opens the exit gate
        // only after it.
        gwoPromise
          .settled(
            gwoPromise
              .inSeries(targets, dealStar)
              .then(starsDealt, function (reason) {
                starsDealt();
                throw reason;
              })
              .then(function () {
                return Promise.all(naming);
              })
              .then(function () {
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
