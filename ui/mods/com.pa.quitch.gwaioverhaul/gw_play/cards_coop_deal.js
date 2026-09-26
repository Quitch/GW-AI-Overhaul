// Host-side co-op pending-tech deal. Stock gw_play.js always deals each viewer
// exactly 3 cards; this honours the bonus-card rules and per-player loadouts.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
], function (refereeCoop) {
  // What one player is dealt at a star: the treasure planet's loadout alone,
  // else their own hand with their pre-dealt card.
  var targetFor = function (params) {
    var startLoadoutCard = params.treasurePlanet
      ? params.pickStartLoadoutCard(params.record, params.client)
      : undefined;

    return {
      client: params.client,
      record: params.record,
      dealIndex: params.dealIndex,
      startLoadoutCard: startLoadoutCard,
      // A loadout is offered alone, and a viewer dealt before their first
      // refresh simply has no card of their own on this star yet.
      preDealtCard: startLoadoutCard
        ? undefined
        : params.starCardForRecord(params.record, params.starIndex),
    };
  };

  // Short-circuits on the first validation problem.
  var collectPendingTechTargets = function (params) {
    var viewers = params.viewers;
    var dealOptions = params.dealOptions;
    var findRecord = params.findRecord;
    var getDealCount = params.getDealCount;

    var targets = [];
    var validationError;

    _.forEach(viewers, function (client) {
      if (validationError) {
        return;
      }

      var record = findRecord({ id: client.id, name: client.name });
      if (!record) {
        validationError =
          "Missing inventory data for pending tech cards client=" +
          client.id +
          " name=" +
          client.name;
        return;
      }

      if (!record.inventory) {
        validationError =
          "Missing saved inventory for pending tech cards client=" +
          client.id +
          " name=" +
          client.name;
        return;
      }

      if (record.pendingTechCards) {
        validationError =
          "Client already has pending tech cards client=" +
          client.id +
          " name=" +
          client.name;
        return;
      }

      var dealIndex = dealOptions.dealIndex;
      if (_.isNumber(dealIndex) && getDealCount(record) >= dealIndex) {
        return;
      }

      targets.push(
        targetFor({
          client: client,
          record: record,
          dealIndex: dealIndex,
          starIndex: params.starIndex,
          treasurePlanet: params.treasurePlanet,
          pickStartLoadoutCard: params.pickStartLoadoutCard,
          starCardForRecord: params.starCardForRecord,
        })
      );
    });

    return { targets: targets, validationError: validationError };
  };

  // How many cards to draw alongside the pre-dealt one. The stored hand stays
  // cardsOffered long either way, which is what cards_coop_reroll.js's
  // computeRerollDeal infers the spent rerolls from.
  var dealCountForHand = function (cardsOffered, preDealtLength) {
    return Math.max(cardsOffered - preDealtLength, 1);
  };

  // The stream a viewer's hand is dealt from: their own, keyed by the host's
  // deal counter so a catch-up deal at the same star is a different hand.
  var pendingTechDealRng = function (gwoStreams, warRng, target) {
    return gwoStreams.coopDealRng(
      warRng,
      gwoStreams.coopPlayerKey(
        target && target.record,
        target && target.client
      ),
      target && target.dealIndex
    );
  };

  var factory = function (params) {
    var game = params.game;
    var chooseCards = params.chooseCards;
    var helpers = params.helpers;
    var GWInventory = params.GWInventory;
    var numCardsToOffer = params.numCardsToOffer;
    var gwoStreams = params.gwoStreams;
    var warRng = params.warRng;
    var gwoBank = params.gwoBank;
    var stockBank = params.stockBank;
    var gwoTreasure = params.gwoTreasure;
    // Read per target, not once: under Separate races each viewer has its own,
    // and it rides their record's inventory. See races.md.
    var gwoRaces = params.gwoRaces;
    var coopStarCards = params.coopStarCards;
    var gwoSettings = params.gwoSettings;

    var pickStartLoadoutCard = function (record, client, starIndex) {
      return gwoTreasure.pickTreasureLoadout({
        race: gwoRaces.raceOf(record.inventory),
        isUnlocked: function (card) {
          return gwoTreasure.recordHasUnlockedLoadout(record, card);
        },
        rng: gwoStreams.treasureLoadoutRng(
          warRng,
          gwoStreams.coopPlayerKey(record, client),
          starIndex
        ),
      });
    };

    // A target's pending hand, as it would be stored: the loadout alone, or a
    // deal weighed on the player's own inventory with their pre-dealt card
    // last.
    var pendingHandFor = function (target, starIndex, star) {
      var result = $.Deferred();

      if (target.startLoadoutCard) {
        result.resolve({
          star: starIndex,
          cards: [
            helpers.buildPendingStartLoadoutCard(target.startLoadoutCard),
          ],
          dealIndex: target.dealIndex,
          updatedAt: _.now(),
        });
        return result.promise();
      }

      gwoBank.applyRecordInventory(
        GWInventory,
        target.record,
        stockBank,
        function (inventory) {
          var cardsOffered = helpers.cardsOfferedCount(
            numCardsToOffer,
            inventory
          );
          var preDealt = target.preDealtCard ? [target.preDealtCard] : [];
          chooseCards({
            inventory: inventory,
            count: dealCountForHand(cardsOffered, preDealt.length),
            star: star,
            systemCards: preDealt,
            rng: pendingTechDealRng(gwoStreams, warRng, target),
          }).then(function (cards) {
            result.resolve({
              star: starIndex,
              // Appended last, as model.explore does with the host's own.
              cards: (cards || []).concat(preDealt),
              dealIndex: target.dealIndex,
              cardsOffered: cardsOffered,
              updatedAt: _.now(),
            });
          });
        }
      );

      return result.promise();
    };

    model.dealCoopPlayerPendingTechCards = function (starIndex, star, options) {
      var result = $.Deferred();
      var dealOptions = options || {};

      if (
        !model.gwCampaignActive() ||
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards()
      ) {
        result.resolve([]);
        return result.promise();
      }

      var viewers = refereeCoop.viewersOf(
        _.isArray(dealOptions.clients)
          ? dealOptions.clients
          : model.gwCampaignConnectedClients()
      );

      if (!viewers.length) {
        result.resolve([]);
        return result.promise();
      }

      var updates = [];
      var jobs = [];

      var collected = collectPendingTechTargets({
        viewers: viewers,
        dealOptions: dealOptions,
        starIndex: starIndex,
        treasurePlanet: gwoTreasure.isTreasureStar(gwoSettings, starIndex),
        findRecord: function (query) {
          return game.findCoopPlayerInventoryData(query);
        },
        getDealCount: function (record) {
          return model.getCoopPlayerTechCardDealCount(record);
        },
        pickStartLoadoutCard: function (record, client) {
          return pickStartLoadoutCard(record, client, starIndex);
        },
        starCardForRecord: coopStarCards.starCardForRecord,
      });
      var targets = collected.targets;

      if (collected.validationError) {
        result.reject(collected.validationError);
        return result.promise();
      }

      if (!targets.length) {
        result.resolve([]);
        return result.promise();
      }

      _.forEach(targets, function (target) {
        var client = target.client;
        jobs.push(
          pendingHandFor(target, starIndex, star).then(
            function (pendingTechCards) {
              updates.push({
                client_id: client.id,
                client_name: client.name,
                pendingTechCards: pendingTechCards,
              });
            }
          )
        );
      });

      $.when.apply($, jobs).then(function () {
        if (!updates.length) {
          result.resolve([]);
          return;
        }

        var payload = {
          players: updates,
          host_tech_card_deal_count: game.hostTechCardDealCount(),
          host_tech_card_deal_history: game.hostTechCardDealHistory(),
        };

        if (_.isFunction(model.send_message)) {
          model.send_message(
            "set_player_pending_tech_cards",
            payload,
            function (success, response) {
              if (!success) {
                result.reject(
                  "set_player_pending_tech_cards failed response=" +
                    JSON.stringify(response || {})
                );
                return;
              }

              result.resolve(updates);
            }
          );
        } else {
          model.sendCampaignAction("set_player_pending_tech_cards", payload);
          result.resolve(updates);
        }
      });

      return result.promise();
    };

    // The same hand for a player the host deals itself - a co-op AI player -
    // with no message sent. See coop.md, "AI players' tech".
    return {
      pendingHandForRecord: function (params) {
        return pendingHandFor(
          targetFor({
            client: params.client,
            record: params.record,
            dealIndex: params.dealIndex,
            starIndex: params.starIndex,
            treasurePlanet: gwoTreasure.isTreasureStar(
              gwoSettings,
              params.starIndex
            ),
            pickStartLoadoutCard: function (record, client) {
              return pickStartLoadoutCard(record, client, params.starIndex);
            },
            starCardForRecord: coopStarCards.starCardForRecord,
          }),
          params.starIndex,
          params.star
        );
      },
    };
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      targetFor: targetFor,
      collectPendingTechTargets: collectPendingTechTargets,
      dealCountForHand: dealCountForHand,
      pendingTechDealRng: pendingTechDealRng,
    };
  }

  return factory;
});
