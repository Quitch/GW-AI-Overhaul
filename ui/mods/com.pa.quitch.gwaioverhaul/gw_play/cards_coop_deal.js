// Host-side co-op pending-tech deal. Stock gw_play.js always deals each viewer
// exactly 3 cards; this honours the bonus-card rules and per-player loadouts.
define(function () {
  // Short-circuits on the first validation problem.
  var collectPendingTechTargets = function (params) {
    var viewers = params.viewers;
    var dealOptions = params.dealOptions;
    var startLoadoutCards = params.startLoadoutCards;
    var findRecord = params.findRecord;
    var getDealCount = params.getDealCount;
    var hasUnlockedStartCard = params.hasUnlockedStartCard;

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

      var startLoadoutCard;
      if (startLoadoutCards.length) {
        if (!_.isArray(record.unlockedStartCardIds)) {
          console.warn(
            "[GW COOP] Co-op player has no unlocked loadout metadata; treating as missing loadouts client=" +
              client.id +
              " name=" +
              client.name
          );
        }

        startLoadoutCard = _.find(startLoadoutCards, function (card) {
          return !hasUnlockedStartCard(record, card);
        });
      }

      targets.push({
        client: client,
        record: record,
        dealIndex: dealIndex,
        startLoadoutCard: startLoadoutCard,
      });
    });

    return { targets: targets, validationError: validationError };
  };

  var factory = function (params) {
    var game = params.game;
    var chooseCards = params.chooseCards;
    var helpers = params.helpers;
    var GWInventory = params.GWInventory;
    var numCardsToOffer = params.numCardsToOffer;

    model.dealCoopPlayerPendingTechCards = function (starIndex, star, options) {
      var result = $.Deferred();
      var dealOptions = options || {};
      var startLoadoutCards = helpers.filterStartLoadoutCards(
        dealOptions.startLoadoutCards
      );

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
        startLoadoutCards: startLoadoutCards,
        findRecord: function (query) {
          return game.findCoopPlayerInventoryData(query);
        },
        getDealCount: function (record) {
          return model.getCoopPlayerTechCardDealCount(record);
        },
        hasUnlockedStartCard: function (record, card) {
          return model.recordHasUnlockedStartCard(record, card);
        },
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
        chooseCards({
          inventory: inventory,
          count: cardsOffered,
          star: star,
          systemCards: [],
        }).then(function (cards) {
          var pendingTechCards = {
            star: starIndex,
            cards: cards || [],
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

        var inventory = new GWInventory();
        inventory.load(_.cloneDeep(record.inventory));

        if (inventory.cards().length) {
          inventory.applyCards(
            dealCardsForTarget.bind(null, target, job, inventory)
          );
        } else {
          dealCardsForTarget(target, job, inventory);
        }
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
    module.exports = { collectPendingTechTargets: collectPendingTechTargets };
  }

  return factory;
});
