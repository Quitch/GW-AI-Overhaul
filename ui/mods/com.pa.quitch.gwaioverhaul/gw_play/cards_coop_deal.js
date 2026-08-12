// Host-side co-op pending-tech deal. Stock gw_play.js always deals each viewer
// exactly 3 cards; this honours the bonus-card rules and per-player loadouts.
define(() => {
  // Short-circuits on the first validation problem.
  const collectPendingTechTargets = (params) => {
    const viewers = params.viewers;
    const dealOptions = params.dealOptions;
    const starIndex = params.starIndex;
    const treasurePlanet = params.treasurePlanet;
    const findRecord = params.findRecord;
    const getDealCount = params.getDealCount;
    const pickStartLoadoutCard = params.pickStartLoadoutCard;
    const starCardForRecord = params.starCardForRecord;

    const targets = [];
    let validationError;

    _.forEach(viewers, (client) => {
      if (validationError) {
        return;
      }

      const record = findRecord({ id: client.id, name: client.name });
      if (!record) {
        validationError = `Missing inventory data for pending tech cards client=${client.id} name=${client.name}`;
        return;
      }

      if (!record.inventory) {
        validationError = `Missing saved inventory for pending tech cards client=${client.id} name=${client.name}`;
        return;
      }

      if (record.pendingTechCards) {
        validationError = `Client already has pending tech cards client=${client.id} name=${client.name}`;
        return;
      }

      const dealIndex = dealOptions.dealIndex;
      if (_.isNumber(dealIndex) && getDealCount(record) >= dealIndex) {
        return;
      }

      const startLoadoutCard = treasurePlanet
        ? pickStartLoadoutCard(record, client)
        : undefined;

      targets.push({
        client,
        record,
        dealIndex,
        startLoadoutCard,
        // A loadout is offered alone, and a viewer dealt before their first
        // refresh simply has no card of their own on this star yet.
        preDealtCard: startLoadoutCard
          ? undefined
          : starCardForRecord(record, starIndex),
      });
    });

    return { targets, validationError };
  };

  // How many cards to draw alongside the pre-dealt one. The stored hand stays
  // cardsOffered long either way, which is what cards_coop_reroll.js's
  // computeRerollDeal infers the spent rerolls from.
  const dealCountForHand = (cardsOffered, preDealtLength) =>
    Math.max(cardsOffered - preDealtLength, 1);

  // The stream a viewer's hand is dealt from: their own, keyed by the host's
  // deal counter so a catch-up deal at the same star is a different hand.
  const pendingTechDealRng = (gwoStreams, warRng, target) =>
    gwoStreams.coopDealRng(
      warRng,
      gwoStreams.coopPlayerKey(
        target && target.record,
        target && target.client
      ),
      target && target.dealIndex
    );

  const factory = (params) => {
    const game = params.game;
    const chooseCards = params.chooseCards;
    const helpers = params.helpers;
    const GWInventory = params.GWInventory;
    const numCardsToOffer = params.numCardsToOffer;
    const gwoStreams = params.gwoStreams;
    const warRng = params.warRng;
    const gwoBank = params.gwoBank;
    const stockBank = params.stockBank;
    const gwoTreasure = params.gwoTreasure;
    const coopStarCards = params.coopStarCards;
    const gwoSettings = params.gwoSettings;

    model.dealCoopPlayerPendingTechCards = (starIndex, star, options) => {
      const result = $.Deferred();
      const dealOptions = options || {};

      if (
        !model.gwCampaignActive() ||
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards()
      ) {
        result.resolve([]);
        return result.promise();
      }

      const connectedClients = Array.isArray(model.gwCampaignConnectedClients())
        ? model.gwCampaignConnectedClients()
        : [];
      const sourceClients = Array.isArray(dealOptions.clients)
        ? dealOptions.clients
        : connectedClients;
      const viewers = _.filter(
        sourceClients,
        (client) => client && client.role === "viewer"
      );

      if (!viewers.length) {
        result.resolve([]);
        return result.promise();
      }

      const updates = [];
      const jobs = [];

      const collected = collectPendingTechTargets({
        viewers,
        dealOptions,
        starIndex,
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
      const targets = collected.targets;

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
      const dealCardsForTarget = (target, job, inventory) => {
        const client = target.client;
        const cardsOffered = helpers.cardsOfferedCount(
          numCardsToOffer,
          inventory
        );
        const preDealt = target.preDealtCard ? [target.preDealtCard] : [];
        chooseCards({
          inventory,
          count: dealCountForHand(cardsOffered, preDealt.length),
          star,
          systemCards: preDealt,
          rng: pendingTechDealRng(gwoStreams, warRng, target),
        }).then((cards) => {
          const pendingTechCards = {
            star: starIndex,
            // Appended last, as model.explore does with the host's own.
            cards: (cards || []).concat(preDealt),
            dealIndex: target.dealIndex,
            cardsOffered,
            updatedAt: _.now(),
          };
          updates.push({
            client_id: client.id,
            client_name: client.name,
            pendingTechCards,
          });
          job.resolve();
        });
      };

      _.forEach(targets, (target) => {
        const client = target.client;
        const record = target.record;
        const job = $.Deferred();
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

        const inventory = new GWInventory();
        inventory.load(_.cloneDeep(record.inventory));

        if (inventory.cards().length) {
          // Applying a viewer's cards runs their loadout card's buff(), which
          // would otherwise unlock that loadout into the host's own banks.
          gwoBank.suspendUnlocks(stockBank);
          inventory.applyCards(() => {
            gwoBank.resumeUnlocks();
            dealCardsForTarget(target, job, inventory);
          });
        } else {
          dealCardsForTarget(target, job, inventory);
        }
      });

      $.when.apply($, jobs).then(() => {
        if (!updates.length) {
          result.resolve([]);
          return;
        }

        const payload = {
          players: updates,
          host_tech_card_deal_count: game.hostTechCardDealCount(),
          host_tech_card_deal_history: game.hostTechCardDealHistory(),
        };

        if (_.isFunction(model.send_message)) {
          model.send_message(
            "set_player_pending_tech_cards",
            payload,
            (success, response) => {
              if (!success) {
                result.reject(
                  `set_player_pending_tech_cards failed response=${JSON.stringify(response || {})}`
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
      collectPendingTechTargets,
      dealCountForHand,
      pendingTechDealRng,
    };
  }

  return factory;
});
