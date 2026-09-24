// Host-side per-viewer pre-dealt star cards. Each viewer gets their own card on
// every selectable AI star, stored on their co-op inventory record so it rides
// the campaign snapshot. See coop.md, "Per-player pre-dealt cards".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
], function (coopHost, refereeCoop) {
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

  // Leaves redealOwed off, so the write that stores a viewer's new cards is
  // also the one that settles their debt.
  var buildStarCardsField = function (existing, updates, turn) {
    return {
      turn: turn,
      cards: _.assign({}, existing, updates),
    };
  };

  var redealOwed = function (record) {
    return !!_.get(record, "gwaioStarCards.redealOwed");
  };

  var starNeedsViewerCard = function (params) {
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
  // per outstanding deal. See coop.md.
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
    var gwoTreasure = params.gwoTreasure;

    var isTreasureStar = function (starIndex) {
      return gwoTreasure.isTreasureStar(gwoSettings, starIndex);
    };

    var refreshInFlight;
    var refreshPending;

    var connectedViewers = function () {
      return refereeCoop.viewersOf(model.gwCampaignConnectedClients());
    };

    var findRecord = function (client) {
      return refereeCoop.recordForClient(game, client);
    };

    var starsNeedingCards = function (record, redeal) {
      var wanted = [];

      _.forEach(model.galaxy.systems(), function (system, starIndex) {
        var ai = system.star.ai();
        if (
          starNeedsViewerCard({
            canSelect: model.canSelect(starIndex),
            ai: ai,
            treasurePlanet: isTreasureStar(starIndex),
            staticTech: gwoSettings && gwoSettings.staticTech,
            existingCard: starCardForRecord(record, starIndex),
            redeal: redeal,
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

      // Decided before the inventory is built, so a refresh with nothing to do
      // costs a walk of the galaxy rather than an applyCards per viewer.
      var targets = starsNeedingCards(record, redealOwed(record));
      if (!targets.length) {
        // A debt with nothing to re-deal is settled, or it would re-deal this
        // viewer on the first refresh of the next turn.
        return Promise.resolve(
          redealOwed(record) &&
            !!coopHost.upsertRecord(game, record, {
              gwaioStarCards: _.omit(record.gwaioStarCards, "redealOwed"),
            })
        );
      }

      var playerKey = gwoStreams.coopPlayerKey(record, client);
      var inventory;
      var applied = new Promise(function (resolve) {
        inventory = gwoBank.applyRecordInventory(
          GWInventory,
          record,
          stockBank,
          resolve
        );
      });

      return applied
        .then(function () {
          return Promise.all(
            _.map(targets, function (target) {
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
            !redealOwed(fresh) &&
            _.isEqual(
              next.cards,
              fresh.gwaioStarCards && fresh.gwaioStarCards.cards
            )
          ) {
            return false;
          }

          return !!coopHost.upsertRecord(game, fresh, { gwaioStarCards: next });
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

    // Every viewer record, connected or not, so a viewer away when the host
    // re-deals is re-dealt on their return. See coop.md.
    var oweRedealToEveryViewer = function () {
      _.forEach(game.coopPlayerInventoryData(), function (record) {
        if (record && !redealOwed(record)) {
          coopHost.upsertRecord(game, record, {
            gwaioStarCards: _.assign({}, record.gwaioStarCards, {
              redealOwed: true,
            }),
          });
        }
      });
    };

    var runRefresh = function (redeal) {
      if (redeal && !(gwoSettings && gwoSettings.staticTech)) {
        oweRedealToEveryViewer();
      }

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

      return refreshEachViewer(viewers).then(function (changed) {
        if (!changed) {
          return undefined;
        }

        console.log("[GW COOP] refreshed co-op player star cards");
        return Promise.resolve(gwoSave(game, false)).then(function () {
          model.sendCampaignSnapshot("gwo_star_cards", true);
        });
      });
    };

    // redeal replaces every viewer's card, and belongs only to the host's own
    // per-turn deal. Every other caller fills gaps.
    var refresh = function (options) {
      var redeal = !!(options && options.redeal);

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

      // runRefresh starts on a later tick: owing a re-deal writes records, and
      // cards.js refreshes on every record write. Run synchronously, that
      // refresh would start before refreshInFlight is set and run alongside
      // this one.
      refreshInFlight = Promise.resolve()
        .then(function () {
          return runRefresh(redeal);
        })
        .then(null, function (reason) {
          console.error(
            "[GW COOP] failed to refresh co-op player star cards: " + reason
          );
        })
        .then(function () {
          refreshInFlight = undefined;
          var queued = refreshPending;
          refreshPending = undefined;
          return queued ? refresh(queued) : undefined;
        });

      return refreshInFlight;
    };

    return {
      refresh: refresh,
      starCardForRecord: starCardForRecord,
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
    };
  }

  return factory;
});
