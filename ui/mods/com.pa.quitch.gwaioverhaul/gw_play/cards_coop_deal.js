// Host-side co-op pending-tech deal. Stock gw_play.js always deals each viewer
// exactly 3 cards; this honours the bonus-card rules and per-player loadouts.
define(function () {
  // Short-circuits on the first validation problem.
  var collectPendingTechTargets = function (params) {
    var viewers = params.viewers;
    var dealOptions = params.dealOptions;
    var starIndex = params.starIndex;
    var treasurePlanet = params.treasurePlanet;
    var findRecord = params.findRecord;
    var getDealCount = params.getDealCount;
    var pickStartLoadoutCard = params.pickStartLoadoutCard;
    var starCardForRecord = params.starCardForRecord;

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

      var startLoadoutCard = treasurePlanet
        ? pickStartLoadoutCard(record, client)
        : undefined;

      targets.push({
        client: client,
        record: record,
        dealIndex: dealIndex,
        startLoadoutCard: startLoadoutCard,
        // A loadout is offered alone, and a viewer dealt before their first
        // refresh simply has no card of their own on this star yet.
        preDealtCard: startLoadoutCard
          ? undefined
          : starCardForRecord(record, starIndex),
      });
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
    var coopStarCards = params.coopStarCards;
    var gwoSettings = params.gwoSettings;

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

      var connectedClients = _.isArray(model.gwCampaignConnectedClients())
        ? model.gwCampaignConnectedClients()
        : [];
      var sourceClients = _.isArray(dealOptions.clients)
        ? dealOptions.clients
        : connectedClients;
      var viewers = _.filter(sourceClients, function (client) {
        return client && client.role === "viewer";
      });

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
          return gwoTreasure.pickTreasureLoadout({
            isUnlocked: function (card) {
              return gwoTreasure.recordHasUnlockedLoadout(record, card);
            },
            rng: gwoStreams.treasureLoadoutRng(
              warRng,
              gwoStreams.coopPlayerKey(record, client),
              starIndex
            ),
          });
        },
        starCardForRecord: coopStarCards.starCardForClient,
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

      // Takes the loop-local target/job/inventory explicitly, and reads
      // starIndex/star/updates from this scope.
      var dealCardsForTarget = function (target, job, inventory) {
        var client = target.client;
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
          var pendingTechCards = {
            star: starIndex,
            // Appended last, as model.explore does with the host's own.
            cards: (cards || []).concat(preDealt),
            dealIndex: target.dealIndex,
            cardsOffered: cardsOffered,
            updatedAt: _.now(),
          };
          updates.push({
            client_id: client.id,
            client_name: client.name,
            pendingTechCards: pendingTechCards,
          });
          job.resolve();
        });
      };

      _.forEach(targets, function (target) {
        var client = target.client;
        var record = target.record;
        var job = $.Deferred();
        jobs.push(job.promise());

        if (target.startLoadoutCard) {
          updates.push({
            client_id: client.id,
            client_name: client.name,
            pendingTechCards: {
              star: starIndex,
              cards: [
                helpers.buildPendingStartLoadoutCard(target.startLoadoutCard),
              ],
              dealIndex: target.dealIndex,
              updatedAt: _.now(),
            },
          });
          job.resolve();
          return;
        }

        gwoBank.applyRecordInventory(
          GWInventory,
          record,
          stockBank,
          function (inventory) {
            dealCardsForTarget(target, job, inventory);
          }
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
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      collectPendingTechTargets: collectPendingTechTargets,
      dealCountForHand: dealCountForHand,
      pendingTechDealRng: pendingTechDealRng,
    };
  }

  return factory;
});
