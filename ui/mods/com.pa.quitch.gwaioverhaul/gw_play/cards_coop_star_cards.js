// Host-side per-viewer pre-dealt star cards. Each viewer gets their own card on
// every selectable AI star, stored on their co-op inventory record so it rides
// the campaign snapshot. See docs/coop.md, "Per-player pre-dealt cards".
define(() => {
  // Star indices are String()d throughout: they are object keys, and survive the
  // save's JSON round trip only as strings.
  const starCardForRecord = (record, starIndex) => {
    const field = record && record.gwaioStarCards;
    const cards =
      field && _.isPlainObject(field.cards) ? field.cards : undefined;
    const card = cards && cards[String(starIndex)];
    return _.isPlainObject(card) ? card : undefined;
  };

  // A star the player has taken keeps no offer. Without this the map grows for
  // the whole war rather than shrinking with the AI stars left to fight.
  const pruneStarCards = (cards, hasAiForStar) => {
    const kept = {};

    _.forEach(_.isPlainObject(cards) ? cards : {}, (card, key) => {
      if (_.isPlainObject(card) && hasAiForStar(Number(key))) {
        kept[key] = card;
      }
    });

    return kept;
  };

  const buildStarCardsField = (existing, updates, turn) => ({
    turn,
    cards: Object.assign({}, existing, updates),
  });

  const starNeedsViewerCard = (params) => {
    if (!params.canSelect || !params.ai || params.treasurePlanet) {
      return false;
    }

    if (!params.existingCard) {
      return true;
    }

    // Only a host re-deal replaces a card already held. A refresh triggered by
    // anything else fills gaps, so a viewer's advertised card cannot change
    // under them while the host is merely moving around the galaxy.
    return !!params.redeal && !params.staticTech;
  };

  // Whether the host may re-deal now. Every connected viewer must be level with
  // the host's deal counter, which is the server's own catch-up predicate - a
  // viewer part-way through catching up would otherwise trigger one full refresh
  // per outstanding deal. See docs/coop.md.
  const viewersReadyForStarRefresh = (params) => {
    if (params.setupBlocked || params.turnState === "explore") {
      return false;
    }

    const hostDealCount = _.isNumber(params.hostDealCount)
      ? params.hostDealCount
      : 0;

    return !_.some(params.viewers, (client) => {
      if (!client || client.requires_loadout || client.loading) {
        return true;
      }

      const loadingStatus = client.loading_status || "";
      if (
        loadingStatus === "picking_loadout" ||
        loadingStatus === "picking_tech_cards"
      ) {
        return true;
      }

      const record = params.findRecord(client);
      if (!record || record.pendingTechCards) {
        return true;
      }

      return params.getDealCount(record) < hostDealCount;
    });
  };

  const factory = (params) => {
    const game = params.game;
    const chooseCards = params.chooseCards;
    const GWInventory = params.GWInventory;
    const gwoStreams = params.gwoStreams;
    const warRng = params.warRng;
    const gwoBank = params.gwoBank;
    const stockBank = params.stockBank;
    const gwoSettings = params.gwoSettings;
    const gwoSave = params.gwoSave;
    const gwoTreasure = params.gwoTreasure;

    const isTreasureStar = (starIndex) =>
      gwoTreasure.isTreasureStar(gwoSettings, starIndex);

    let refreshInFlight;
    let refreshPending;

    const connectedViewers = () => {
      const clients = Array.isArray(model.gwCampaignConnectedClients())
        ? model.gwCampaignConnectedClients()
        : [];

      return _.filter(clients, (client) => client && client.role === "viewer");
    };

    const findRecord = (client) =>
      game.findCoopPlayerInventoryData({
        id: client.id,
        name: client.name,
      });

    const starsNeedingCards = (record, redeal) => {
      const wanted = [];

      _.forEach(model.galaxy.systems(), (system, starIndex) => {
        const ai = system.star.ai();
        if (
          starNeedsViewerCard({
            canSelect: model.canSelect(starIndex),
            ai,
            treasurePlanet: isTreasureStar(starIndex),
            staticTech: gwoSettings && gwoSettings.staticTech,
            existingCard: starCardForRecord(record, starIndex),
            redeal,
          })
        ) {
          wanted.push({ starIndex, star: system.star });
        }
      });

      return wanted;
    };

    const dealStarCard = (target, inventory, playerKey, record) => {
      const existing = starCardForRecord(record, target.starIndex);

      return chooseCards({
        inventory,
        count: 1,
        star: target.star,
        addSlot: false,
        systemCards: existing ? [existing] : [],
        rng: gwoStreams.coopStarDealRng(
          warRng,
          playerKey,
          target.starIndex,
          game.stats().turns()
        ),
      }).then((cards) => ({
        starIndex: target.starIndex,
        card: cards && cards[0],
      }));
    };

    // Resolves with whether the record changed. The record is re-read at write
    // time: chooseCards is async, so a catch-up deal can have landed
    // pendingTechCards on it since this viewer's work began.
    const refreshViewer = (client, redeal) => {
      const record = findRecord(client);
      if (!record || !record.inventory) {
        return Promise.resolve(false);
      }

      // Decided before the inventory is built, so a refresh with nothing to do
      // costs a walk of the galaxy rather than an applyCards per viewer.
      const targets = starsNeedingCards(record, redeal);
      if (!targets.length) {
        return Promise.resolve(false);
      }

      const playerKey = gwoStreams.coopPlayerKey(record, client);
      const inventory = new GWInventory();
      inventory.load(_.cloneDeep(record.inventory));

      const applied = new Promise((resolve) => {
        if (!inventory.cards().length) {
          resolve();
          return;
        }

        gwoBank.suspendUnlocks(stockBank);
        try {
          inventory.applyCards(() => {
            gwoBank.resumeUnlocks();
            resolve();
          });
        } catch (e) {
          gwoBank.resumeUnlocks();
          throw e;
        }
      });

      return applied
        .then(() =>
          Promise.all(
            _.map(targets, (target) =>
              dealStarCard(target, inventory, playerKey, record)
            )
          )
        )
        .then((results) => {
          const updates = {};
          _.forEach(results, (result) => {
            if (result && result.card) {
              updates[String(result.starIndex)] = result.card;
            }
          });

          const fresh = findRecord(client);
          if (!fresh) {
            return false;
          }

          const pruned = pruneStarCards(
            fresh.gwaioStarCards && fresh.gwaioStarCards.cards,
            (starIndex) => {
              const system = model.galaxy.systems()[starIndex];
              return !!(system && system.star.ai());
            }
          );
          const next = buildStarCardsField(
            pruned,
            updates,
            game.stats().turns()
          );

          if (
            _.isEqual(
              next.cards,
              fresh.gwaioStarCards && fresh.gwaioStarCards.cards
            )
          ) {
            return false;
          }

          return game.upsertCoopPlayerInventoryData(
            Object.assign({}, _.cloneDeep(fresh), {
              gwaioStarCards: next,
              updatedAt: _.now(),
            })
          );
        });
    };

    // A refresh calls deal() on every card of the deck once per star per viewer,
    // which is too much for one frame, so each viewer yields before starting.
    const refreshViewerLater = (client, redeal) =>
      new Promise((resolve) => {
        _.defer(() => {
          resolve(refreshViewer(client, redeal));
        });
      });

    const refreshEachViewer = (viewers, redeal) => {
      let changedAny = false;

      return _.reduce(
        viewers,
        (chain, client) =>
          chain
            .then(refreshViewerLater.bind(null, client, redeal))
            .then((changed) => {
              changedAny = changedAny || changed;
            }),
        Promise.resolve()
      ).then(() => changedAny);
    };

    const runRefresh = (redeal) => {
      const viewers = connectedViewers();
      if (!viewers.length) {
        return Promise.resolve();
      }

      if (
        !viewersReadyForStarRefresh({
          viewers,
          findRecord,
          getDealCount: function (record) {
            return model.getCoopPlayerTechCardDealCount(record);
          },
          hostDealCount: game.hostTechCardDealCount(),
          setupBlocked: model.gwCampaignPlayerSetupBlocked(),
          turnState: game.turnState(),
        })
      ) {
        return Promise.resolve();
      }

      return refreshEachViewer(viewers, redeal).then((changed) => {
        if (!changed) {
          return undefined;
        }

        console.log("[GW COOP] refreshed co-op player star cards");
        return Promise.resolve(gwoSave(game, false)).then(() => {
          model.sendCampaignSnapshot("gwo_star_cards", true);
        });
      });
    };

    // redeal replaces every viewer's card, and belongs only to the host's own
    // per-turn deal. Every other caller fills gaps.
    const refresh = (options) => {
      const redeal = !!(options && options.redeal);

      if (
        !model.gwCampaignActive() ||
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards()
      ) {
        return Promise.resolve();
      }

      // A coalesced refresh re-deals if any of the calls it stands in for did.
      if (refreshInFlight) {
        refreshPending = {
          redeal: redeal || !!(refreshPending && refreshPending.redeal),
        };
        return refreshInFlight;
      }

      refreshInFlight = runRefresh(redeal)
        .then(null, (reason) => {
          console.error(
            `[GW COOP] failed to refresh co-op player star cards: ${reason}`
          );
        })
        .then(() => {
          refreshInFlight = undefined;
          const queued = refreshPending;
          refreshPending = undefined;
          return queued ? refresh(queued) : undefined;
        });

      return refreshInFlight;
    };

    return {
      refresh,
      starCardForClient: starCardForRecord,
    };
  };

  // The record shape has one reader, and coop_star_cards_view.js needs it
  // without standing up a host-side factory.
  factory.starCardForRecord = starCardForRecord;

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = {
      starCardForRecord,
      pruneStarCards,
      buildStarCardsField,
      starNeedsViewerCard,
      viewersReadyForStarRefresh,
    };
  }

  return factory;
});
