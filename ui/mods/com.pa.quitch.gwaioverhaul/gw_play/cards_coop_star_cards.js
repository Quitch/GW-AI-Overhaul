// Host-side per-viewer pre-dealt star cards. Each viewer gets their own card on
// every selectable AI star, stored on their co-op inventory record so it rides
// the campaign snapshot. See docs/coop.md, "Per-player pre-dealt cards".
define(function () {
  // Star indices are String()d throughout: they are object keys, and survive the
  // save's JSON round trip only as strings.
  var starCardForRecord = function (record, starIndex) {
    var field = record && record.gwaioStarCards;
    var cards = field && _.isPlainObject(field.cards) ? field.cards : undefined;
    var card = cards && cards[String(starIndex)];
    return _.isPlainObject(card) ? card : undefined;
  };

  // A star the player has taken keeps no offer. Without this the map grows for
  // the whole war rather than shrinking with the AI stars left to fight.
  var pruneStarCards = function (cards, hasAiForStar) {
    var kept = {};

    _.forEach(_.isPlainObject(cards) ? cards : {}, function (card, key) {
      if (_.isPlainObject(card) && hasAiForStar(Number(key))) {
        kept[key] = card;
      }
    });

    return kept;
  };

  var buildStarCardsField = function (existing, updates, turn) {
    return {
      turn: turn,
      cards: _.assign({}, existing, updates),
    };
  };

  var starNeedsViewerCard = function (params) {
    if (!params.canSelect || !params.ai || params.treasurePlanet) {
      return false;
    }

    return !(params.staticTech && params.existingCard);
  };

  // Whether the host may re-deal now. Every connected viewer must be level with
  // the host's deal counter, which is the server's own catch-up predicate - a
  // viewer part-way through catching up would otherwise trigger one full refresh
  // per outstanding deal. See docs/coop.md.
  var viewersReadyForStarRefresh = function (params) {
    if (params.setupBlocked || params.turnState === "explore") {
      return false;
    }

    var hostDealCount = _.isNumber(params.hostDealCount)
      ? params.hostDealCount
      : 0;

    return !_.some(params.viewers, function (client) {
      if (!client || client.requires_loadout || client.loading) {
        return true;
      }

      var loadingStatus = client.loading_status || "";
      if (
        loadingStatus === "picking_loadout" ||
        loadingStatus === "picking_tech_cards"
      ) {
        return true;
      }

      var record = params.findRecord(client);
      if (!record || record.pendingTechCards) {
        return true;
      }

      return params.getDealCount(record) < hostDealCount;
    });
  };

  // Everything a refresh would read. An unchanged key means an unchanged result,
  // so the snapshot it would publish is not worth sending.
  var starRefreshKey = function (params) {
    return [
      params.turns,
      params.hostDealCount,
      _.sortBy(
        _.map(params.players, function (player) {
          return player.key + ":" + player.dealCount;
        })
      ).join(","),
    ].join("|");
  };

  var factory = function (params) {
    var game = params.game;
    var chooseCards = params.chooseCards;
    var GWInventory = params.GWInventory;
    var gwoStreams = params.gwoStreams;
    var warRng = params.warRng;
    var gwoBank = params.gwoBank;
    var stockBank = params.stockBank;
    var gwoSettings = params.gwoSettings;
    var gwoSave = params.gwoSave;

    var refreshInFlight;
    var refreshPending = false;
    var lastAppliedKey;

    var connectedViewers = function () {
      var clients = _.isArray(model.gwCampaignConnectedClients())
        ? model.gwCampaignConnectedClients()
        : [];

      return _.filter(clients, function (client) {
        return client && client.role === "viewer";
      });
    };

    var findRecord = function (client) {
      return game.findCoopPlayerInventoryData({
        id: client.id,
        name: client.name,
      });
    };

    var currentKey = function (viewers) {
      return starRefreshKey({
        turns: game.stats().turns(),
        hostDealCount: game.hostTechCardDealCount(),
        players: _.map(viewers, function (client) {
          var record = findRecord(client);
          return {
            key: gwoStreams.coopPlayerKey(record, client),
            dealCount: model.getCoopPlayerTechCardDealCount(record),
          };
        }),
      });
    };

    var starsNeedingCards = function (record) {
      var wanted = [];

      _.forEach(model.galaxy.systems(), function (system, starIndex) {
        var ai = system.star.ai();
        if (
          starNeedsViewerCard({
            canSelect: model.canSelect(starIndex),
            ai: ai,
            treasurePlanet: ai && ai.treasurePlanet,
            staticTech: gwoSettings && gwoSettings.staticTech,
            existingCard: starCardForRecord(record, starIndex),
          })
        ) {
          wanted.push({ starIndex: starIndex, star: system.star });
        }
      });

      return wanted;
    };

    var dealStarCard = function (target, inventory, playerKey, record) {
      var existing = starCardForRecord(record, target.starIndex);

      return chooseCards({
        inventory: inventory,
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
      }).then(function (cards) {
        return { starIndex: target.starIndex, card: cards && cards[0] };
      });
    };

    // Resolves with whether the record changed. The record is re-read at write
    // time: chooseCards is async, so a catch-up deal can have landed
    // pendingTechCards on it since this viewer's work began.
    var refreshViewer = function (client) {
      var record = findRecord(client);
      if (!record || !record.inventory) {
        return Promise.resolve(false);
      }

      var playerKey = gwoStreams.coopPlayerKey(record, client);
      var inventory = new GWInventory();
      inventory.load(_.cloneDeep(record.inventory));

      var applied = new Promise(function (resolve) {
        if (!inventory.cards().length) {
          resolve();
          return;
        }

        gwoBank.suspendUnlocks(stockBank);
        try {
          inventory.applyCards(function () {
            gwoBank.resumeUnlocks();
            resolve();
          });
        } catch (e) {
          gwoBank.resumeUnlocks();
          throw e;
        }
      });

      return applied
        .then(function () {
          return Promise.all(
            _.map(starsNeedingCards(record), function (target) {
              return dealStarCard(target, inventory, playerKey, record);
            })
          );
        })
        .then(function (results) {
          var updates = {};
          _.forEach(results, function (result) {
            if (result && result.card) {
              updates[String(result.starIndex)] = result.card;
            }
          });

          var fresh = findRecord(client);
          if (!fresh) {
            return false;
          }

          var pruned = pruneStarCards(
            fresh.gwaioStarCards && fresh.gwaioStarCards.cards,
            function (starIndex) {
              var system = model.galaxy.systems()[starIndex];
              return !!(system && system.star.ai());
            }
          );
          var next = buildStarCardsField(pruned, updates, game.stats().turns());

          if (
            _.isEqual(
              next.cards,
              fresh.gwaioStarCards && fresh.gwaioStarCards.cards
            )
          ) {
            return false;
          }

          return game.upsertCoopPlayerInventoryData(
            _.assign({}, _.cloneDeep(fresh), {
              gwaioStarCards: next,
              updatedAt: _.now(),
            })
          );
        });
    };

    // A refresh calls deal() on every card of the deck once per star per viewer,
    // which is too much for one frame, so each viewer yields before starting.
    var refreshViewerLater = function (client) {
      return new Promise(function (resolve) {
        _.defer(function () {
          resolve(refreshViewer(client));
        });
      });
    };

    var refreshEachViewer = function (viewers) {
      var changedAny = false;

      return _.reduce(
        viewers,
        function (chain, client) {
          return chain
            .then(refreshViewerLater.bind(null, client))
            .then(function (changed) {
              changedAny = changedAny || changed;
            });
        },
        Promise.resolve()
      ).then(function () {
        return changedAny;
      });
    };

    var runRefresh = function () {
      var viewers = connectedViewers();
      if (!viewers.length) {
        return Promise.resolve();
      }

      if (
        !viewersReadyForStarRefresh({
          viewers: viewers,
          findRecord: findRecord,
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

      var key = currentKey(viewers);
      if (key === lastAppliedKey) {
        return Promise.resolve();
      }

      return refreshEachViewer(viewers).then(function (changed) {
        lastAppliedKey = key;
        if (!changed) {
          return undefined;
        }

        return Promise.resolve(gwoSave(game, false)).then(function () {
          model.sendCampaignSnapshot("gwo_star_cards", true);
        });
      });
    };

    var refresh = function () {
      if (
        !model.gwCampaignActive() ||
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards()
      ) {
        return Promise.resolve();
      }

      if (refreshInFlight) {
        refreshPending = true;
        return refreshInFlight;
      }

      refreshInFlight = runRefresh()
        .then(null, function (reason) {
          console.error(
            "[GW COOP] failed to refresh co-op player star cards: " + reason
          );
        })
        .then(function () {
          refreshInFlight = undefined;
          if (refreshPending) {
            refreshPending = false;
            return refresh();
          }
          return undefined;
        });

      return refreshInFlight;
    };

    return {
      refresh: refresh,
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
      starCardForRecord: starCardForRecord,
      pruneStarCards: pruneStarCards,
      buildStarCardsField: buildStarCardsField,
      starNeedsViewerCard: starNeedsViewerCard,
      viewersReadyForStarRefresh: viewersReadyForStarRefresh,
      starRefreshKey: starRefreshKey,
    };
  }

  return factory;
});
