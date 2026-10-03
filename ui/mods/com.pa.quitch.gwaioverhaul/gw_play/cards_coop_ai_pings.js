// The co-op AI players' pings, in either tech mode. Glue - the rules are
// gw_play/coop_ai_pings.js. See coop.md, "AI pings".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_pings.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_threat.js",
], function (coopAiPings, starThreat) {
  var commanderOf = function (record) {
    return (
      _.get(record, "inventory.tags.global.commander") ||
      (record && record.commander)
    );
  };

  return function (params) {
    var game = model.game();
    var galaxy = params.galaxy;

    var windowOpen = function () {
      var star = galaxy.stars()[game.currentStar()];
      return (
        model.gwoCanPingAsNow() &&
        model.gwoCoopAi.count() > 0 &&
        !!params.lookup() &&
        !!star &&
        star.explored() &&
        !model.gwCampaignPlayerSetupBlocked() &&
        !model.gwoCoopAiDeciding() &&
        !params.starCardsBusy() &&
        !params.aiStarDealing() &&
        !model.gameOver()
      );
    };

    var pings = coopAiPings({
      ais: function () {
        return _.map(model.gwoCoopAi.records(), function (record) {
          return {
            id: record.playerId,
            name: record.gwaioAi.name,
            record: record,
          };
        });
      },
      // The cards every AI would find at every AI star are part of the key,
      // so a re-deal outside a turn - a cheat's, say - opens a new window.
      windowKey: function () {
        var perPlayerNow = model.gwCampaignPerPlayerTechCards();
        var records = model.gwoCoopAi.records();
        var entries = [];
        _.forEach(galaxy.stars(), function (star, index) {
          if (!star.ai() || star.explored()) {
            return;
          }
          if (!perPlayerNow) {
            var cards = star.cardList();
            entries.push(index + "=" + _.get(cards, "0.id", ""));
            return;
          }
          _.forEach(records, function (record) {
            entries.push(
              record.playerId +
                "@" +
                index +
                "=" +
                _.get(record, "gwaioStarCards.cards." + index + ".id", "")
            );
          });
        });
        return coopAiPings.windowKey(
          game.stats().turns(),
          game.currentStar(),
          game.hostTechCardDealCount(),
          coopAiPings.cardsDigest(entries)
        );
      },
      windowOpen: windowOpen,
      candidates: function () {
        var current = game.currentStar();
        var candidates = [];
        _.forEach(galaxy.stars(), function (star, index) {
          var ai = star.ai();
          if (index === current || !ai || star.explored()) {
            return;
          }
          var path = model.canSelect(index);
          if (path && path.length) {
            candidates.push({
              star: index,
              hops: path.length - 1,
              threat: starThreat.measure(ai),
              treasure: !!ai.treasurePlanet,
            });
          }
        });
        return coopAiPings.pickCandidates(candidates);
      },
      neutral: function () {
        var current = game.currentStar();
        var nearest;
        _.forEach(galaxy.stars(), function (star, index) {
          if (index === current || star.ai() || star.explored()) {
            return;
          }
          var path = model.canSelect(index);
          if (
            path &&
            path.length &&
            (!nearest || path.length - 1 < nearest.hops)
          ) {
            nearest = { star: index, hops: path.length - 1 };
          }
        });
        return nearest;
      },
      allThreats: function () {
        var threats = [];
        _.forEach(galaxy.stars(), function (star) {
          var ai = star.ai();
          if (ai && !star.explored()) {
            threats.push(starThreat.measure(ai));
          }
        });
        return threats;
      },
      // Under per-player tech an AI's own card for the star; under shared
      // tech the star's, which every player shares.
      cardFor: function (ai, star) {
        if (model.gwCampaignPerPlayerTechCards()) {
          return _.get(ai.record, "gwaioStarCards.cards." + star);
        }
        var cards = galaxy.stars()[star].cardList();
        return cards && cards[0];
      },
      valueOf: function (ai, card, star, memo) {
        // Once a judge: saving the host's inventory walks every mod it holds.
        if (!memo.holder) {
          memo.holder = model.gwCampaignPerPlayerTechCards()
            ? {
                playerId: ai.id,
                inventory: ai.record.inventory,
                commander: commanderOf(ai.record),
              }
            : {
                playerId: ai.id,
                inventory: params.plainSave(params.inventory),
                commander: params.inventory.getTag("global", "commander"),
              };
        }
        // deal() takes the star itself, as in a hand.
        return coopAiPings.valueOfCard(
          params.judge,
          memo.holder,
          card,
          galaxy.stars()[star],
          memo
        );
      },
      ping: function (star, sender) {
        return model.gwoPingStarAs(star, sender);
      },
    });

    // Anything a window depends on opens or closes one.
    ko.computed(function () {
      windowOpen();
      game.stats().turns();
      game.currentStar();
      game.hostTechCardDealCount();
      model.gwoCoopAi.records();
      _.defer(pings.update);
    });
  };
});
