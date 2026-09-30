// Exploring a star, dealt from GWO's deck. See shadowing.md, "Function
// hijacking".
define(function () {
  return function (params) {
    var game = params.game;
    var inventory = params.inventory;
    var helpers = params.helpers;
    var numCardsToOffer = params.numCardsToOffer;
    var chooseCards = params.chooseCards;
    var coopAiDeciding = params.coopAiDeciding;
    var startCardUnlocked = params.startCardUnlocked;
    var gwoTreasure = params.gwoTreasure;
    var gwoSettings = params.gwoSettings;
    var gwoRaces = params.gwoRaces;
    var gwoStreams = params.gwoStreams;
    var warRng = params.warRng;
    var gwoSave = params.gwoSave;

    // gw_play self.explore - call our chooseCards()
    model.explore = function (force) {
      // game.explore() advances turnState rather than querying it, so it must
      // stay below every guard that can refuse, or a refused call leaves the
      // star inert with no deal.
      if (model.isCampaignViewer() && !model.gwCampaignReplayingAction) {
        return;
      }

      // force is set for a host reroll, which must proceed even while co-op
      // players are still choosing. A co-op AI player settling its deals
      // holds exploration as a viewer choosing tech does.
      if (
        _.isUndefined(force) &&
        (model.gwCampaignPlayerSetupBlocked() ||
          (!model.gwCampaignReplayingAction && coopAiDeciding()))
      ) {
        return;
      }

      if (!game.explore()) {
        return;
      }

      if (!model.gwCampaignReplayingAction) {
        model.sendCampaignAction("explore", { star: game.currentStar() });
      }

      model.scanning(true);

      api.audio.playSound("/VO/Computer/gw/board_exploring");

      var cardsOffered = helpers.cardsOfferedCount(numCardsToOffer, inventory);
      var starIndex = game.currentStar();
      var star = game.galaxy().stars()[starIndex];

      // Deriving here rather than at war creation is what lets every player
      // be judged by their own unlock record. Writing the whole list also
      // clears the pre-dealt card a war generated before this carried.
      // A replaying viewer reads its own banks, so the host's card reaches
      // it through sync_star_cards instead.
      if (
        !model.gwCampaignReplayingAction &&
        gwoTreasure.isTreasureStar(gwoSettings, starIndex)
      ) {
        var treasureLoadout = gwoTreasure.pickTreasureLoadout({
          race: gwoRaces.raceOf(inventory),
          isUnlocked: startCardUnlocked,
          rng: gwoStreams.treasureLoadoutRng(warRng, undefined, starIndex),
        });
        star.cardList(treasureLoadout ? [treasureLoadout] : []);
      }

      var startLoadoutCards = helpers.filterStartLoadoutCards(star.cardList());

      var dealStarCards = chooseCards({
        count: cardsOffered - model.gwoRerollsUsed() - star.cardList().length,
        star: star,
        systemCards: star.cardList(),
        // A reroll re-enters here with the iteration index back at 0, so
        // the reroll count is what makes it deal a different hand.
        rng: gwoStreams.exploreDealRng(
          warRng,
          starIndex,
          game.stats().turns(),
          model.gwoRerollsUsed()
        ),
      }).then(function (result) {
        var ok = !_.some(star.cardList(), function (card) {
          return (
            helpers.isStartLoadoutCardId(card.id) && !startCardUnlocked(card)
          );
        });

        if (ok) {
          // Combine the deal with pre-dealt system card
          var cardList = result.concat(star.cardList());
          star.cardList(cardList);
        }

        if (!model.gwCampaignReplayingAction) {
          model.sendCampaignAction("sync_star_cards", {
            star: game.currentStar(),
            cards: star.cardList(),
          });
        }

        var dealEntry;
        // chooseCards is async, so the turn can have moved on. Recording then
        // owes every co-op viewer a catch-up hand for a deal never offered.
        var explorationLive = helpers.explorationStillLive(
          game,
          starIndex,
          star
        );

        if (!explorationLive) {
          console.log(
            "[GW COOP] discarded a stale explore deal star=" +
              starIndex +
              " turnState=" +
              game.turnState()
          );
        }

        if (
          explorationLive &&
          force !== true &&
          (ok || startLoadoutCards.length) &&
          star.cardList().length
        ) {
          dealEntry = game.recordHostTechCardDeal(starIndex, {
            startLoadoutCards: startLoadoutCards,
          });
        }

        if (!dealEntry) {
          return $.Deferred().resolve([]).promise();
        }

        return model.dealCoopPlayerPendingTechCards(starIndex, star, {
          dealIndex: dealEntry.dealIndex,
          startLoadoutCards: startLoadoutCards,
        });
      });

      // Returned so the base campaign queue can order it. The cosmetic
      // scanning delay below is deliberately not awaited.
      return $.when(dealStarCards).then(
        function () {
          if (
            model.currentSystemCardList() &&
            model.currentSystemCardList()[0] &&
            model.currentSystemCardList()[0].isLoadout()
          ) {
            model.gwoOfferRerolls(false);
          }
          _.delay(function () {
            model.scanning(false);
          }, 2000);
          if (
            helpers.explorationDealtNothing(
              game,
              starIndex,
              star,
              model.gwCampaignReplayingAction
            )
          ) {
            console.warn(
              "GWO: no tech card could be dealt at star " +
                starIndex +
                "; ending the exploration with nothing"
            );
            _.delay(function () {
              model.win(-1);
            }, 2000);
          }
          return gwoSave(game, false);
        },
        function (reason) {
          console.error(
            "[GW COOP] failed to deal co-op player pending tech cards: " +
              reason
          );
          model.scanning(false);
          return $.Deferred().reject(reason).promise();
        }
      );
    };
  };
});
