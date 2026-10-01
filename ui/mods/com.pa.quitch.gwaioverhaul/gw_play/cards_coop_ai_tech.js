// Co-op AI players' tech: the unit lookup they judge cards by and their pings,
// in either tech mode, and under per-player tech the driver that settles
// their deals, and a new one's starting loadout. Glue - the logic is
// gw_play/coop_ai_driver.js. See coop.md, "AI players' tech".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_driver.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/race_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/starting_inventory.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_fielded.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_ai_pings.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_ai_mods.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_publish.js",
], function (
  coopAiDriver,
  coopAiEffects,
  coopAiCards,
  coopAiUnits,
  unitGroups,
  raceCells,
  raceMods,
  roster,
  coopHost,
  refereeCoop,
  startingInventory,
  gwoLoadoutIds,
  gwoSpecs,
  coopAiFielded,
  cardsCoopAiPings,
  gameFilePaths,
  raceAiMods,
  unitCells,
  coopPublish
) {
  return function (params) {
    var game = params.game;
    var perPlayer = params.perPlayer;
    var galaxy = params.galaxy;
    var inventory = params.inventory;
    var helpers = params.helpers;
    var gwoStreams = params.gwoStreams;
    var warRng = params.warRng;
    var LOOKUP_WAIT_MS = 8000;

    var hostingSession = function () {
      return model.isCampaignHost() && model.gwCampaignActive();
    };
    var hosting = refereeCoop.hostingPerPlayerSession;

    // The unit specs, read once the host opens a session; unit-group
    // membership stands in if they are not in within 8 s, and is
    // replaced when they land.
    var lookup = ko.observable();
    // The unit list the specs lookup was read from.
    var specsUnits;
    var groupsLookup = coopAiUnits.fromGroups(unitGroups);
    var prefetching = false;
    var prefetch = function () {
      prefetching = true;
      var fallback = setTimeout(function () {
        if (!lookup()) {
          console.log(
            "[GW COOP AI] unit specs not in after " +
              LOOKUP_WAIT_MS / 1000 +
              " s: judging by unit groups until they are"
          );
          lookup(groupsLookup);
        }
      }, LOOKUP_WAIT_MS);
      var specsRead = function (loaded) {
        clearTimeout(fallback);
        specsUnits = loaded.units;
        lookup(coopAiUnits.fromSpecs(loaded, unitGroups.units, gwoSpecs.mod));
      };
      var specsNotRead = function (error) {
        clearTimeout(fallback);
        console.error(
          "[GW COOP AI] unit specs not read: " +
            ((error && error.stack) || error)
        );
        if (!lookup()) {
          lookup(groupsLookup);
        }
      };
      raceMods.mountRoot().always(function () {
        raceCells.load().then(specsRead, specsNotRead);
      });
    };
    // Under shared tech the lookup serves the pings alone, so it waits
    // for an AI.
    ko.computed(function () {
      if (
        !prefetching &&
        (hosting() || (hostingSession() && model.gwoCoopAi.count() > 0))
      ) {
        prefetch();
      }
    });

    // What a race's co-op tree makes of AI mods, on the cells its view is
    // built on. Undefined, logged, where the maps or the /pa/ai_tech/ files
    // are not read: the view then counts the AI mods as saved.
    var aimFor = function (race, cells) {
      if (params.races.isMla(race)) {
        return Promise.resolve();
      }
      return Promise.all([
        gameFilePaths.raceKeysFor({
          race: race,
          brain: params.gwoAI.aiInUse("coop", race),
          source: params.gwoAI.getAIPathSource("coop", race),
          cells: cells,
          unitCells: unitCells,
          gwoRaces: params.races,
        }),
        gameFilePaths.loadAiTechFiles(),
      ]).then(
        function (loaded) {
          return { table: raceAiMods.table(loaded[0]), loads: loaded[1] };
        },
        function (error) {
          console.error(
            "[GW COOP AI] " +
              race +
              " AI mods counted as saved: " +
              gameFilePaths.describeError(error)
          );
        }
      );
    };

    // What an AI of the saved inventory's race fields, one view per
    // race for each specs lookup, its cells built from the same unit
    // list as the referee's. Resolves undefined where the AI fields
    // what it holds. See tech-cards.md, "A race's units".
    var views = {};
    var fielded = function (saved, current) {
      if (!current || current.via !== "specs") {
        return Promise.resolve();
      }
      var race = params.races.raceOf(saved);
      if (!views[race] || views[race].lookup !== current) {
        views[race] = {
          lookup: current,
          view: raceCells.prime(race, specsUnits).then(function (cells) {
            if (!cells || !cells.race.units.length) {
              return undefined;
            }
            return aimFor(race, cells).then(function (aim) {
              return coopAiFielded.view({
                race: race,
                cells: cells,
                races: params.races,
                lookup: current,
                aim: aim,
              });
            });
          }),
        };
      }
      return views[race].view;
    };

    var effects = coopAiEffects({
      GWInventory: params.GWInventory,
      stockBank: params.GW.bank,
      timeoutMs: 10000,
    });

    var find = function (playerId) {
      return _.find(game.coopPlayerInventoryData(), function (record) {
        return roster.isAiRecord(record) && record.playerId === playerId;
      });
    };

    var hostSaved = function () {
      return {
        cards: inventory.cards(),
        units: inventory.units(),
        mods: inventory.mods(),
        tags: {
          global: { commander: inventory.getTag("global", "commander") },
        },
      };
    };

    // Everyone fighting beside the AI: the host, the connected
    // viewers, and the other AIs.
    var teamDomains = function (playerId, current) {
      var others = [hostSaved()].concat(
        _.pluck(refereeCoop.getConnectedViewerInventories(game), "inventory"),
        _.pluck(
          _.reject(model.gwoCoopAi.records(), { playerId: playerId }),
          "inventory"
        )
      );
      return coopAiCards.teamDomains(roster.teammates(others), current);
    };

    var namesUnits = function (cardId) {
      var entry = _.find(model.gwoCardsToUnits || [], { id: cardId });
      return !!(entry && !_.isEmpty(entry.units));
    };

    // A card's own deal weight for this inventory, for a card whose
    // effect shows only in battle. Third-party code, so guarded.
    var chanceOf = function (card, applied, star) {
      var module = _.find(params.cards, function (candidate) {
        return !!candidate && candidate.id === card.id;
      });
      if (!module || !_.isFunction(module.deal)) {
        return 0;
      }
      try {
        var dealInventory = new params.GWInventory();
        dealInventory.load(coopAiEffects.plain(applied));
        var context =
          module.getContext && module.getContext(galaxy, dealInventory);
        var dealt = module.deal(star, context, dealInventory);
        return dealt && _.isNumber(dealt.chance) ? dealt.chance : 0;
      } catch (e) {
        // A deal() that throws could never offer its card, so the card
        // has no chance to score.
        console.error(
          "[GW COOP AI] " +
            card.id +
            " deal() threw: " +
            ((e && e.message) || e)
        );
        return 0;
      }
    };

    // The T1 factory cards an AI with no basic land factory may be
    // assigned: those in the war's deck that its race can use, less
    // any whose factory its cards strip.
    var FACTORY_CARDS = [
      "gwc_enable_air_t1",
      "gwc_enable_bots_t1",
      "gwc_enable_vehicles_t1",
    ];
    var factoryCards = function (record, applied) {
      return _.filter(FACTORY_CARDS, function (id) {
        var entry = _.find(model.gwoCardsToUnits || [], { id: id });
        return (
          _.includes(model.gwoCards, id) &&
          helpers.raceCanDeal(
            params.races,
            record.inventory,
            id,
            model.gwoCardsToUnits
          ) &&
          (!entry ||
            params.gwoAI.armyGapClosable(
              "landFactory",
              applied.strippedUnits,
              entry.units
            ))
        );
      });
    };

    // A card as the dealer deals it to the AI, its params included.
    var dealCard = function (cardId, applied, star) {
      var dealInventory = new params.GWInventory();
      dealInventory.load(coopAiEffects.plain(applied));
      return params.gwoDeal.dealCard(
        {
          id: cardId,
          galaxy: galaxy,
          inventory: dealInventory,
          star: star,
        },
        params.loaded,
        params.cards
      );
    };

    cardsCoopAiPings({
      galaxy: galaxy,
      inventory: inventory,
      lookup: lookup,
      starCardsBusy: params.starCardsBusy,
      aiStarDealing: params.aiStarDealing,
      plainSave: coopAiEffects.plainSave,
      judge: {
        effects: effects,
        lookup: lookup,
        fielded: fielded,
        teamDomains: teamDomains,
        namesUnits: namesUnits,
        chanceOf: chanceOf,
        isLoadout: helpers.isStartLoadoutCardId,
      },
    });

    if (!perPlayer) {
      return;
    }

    // The deck and card_units.js are in: factoryCards reads model.gwoCardsToUnits.
    var cardsLoaded = ko.observable(false);
    params.loaded.then(function () {
      cardsLoaded(true);
    });

    var driver = coopAiDriver({
      records: function () {
        return hosting() ? model.gwoCoopAi.records() : [];
      },
      find: find,
      dealCount: model.getCoopPlayerTechCardDealCount,
      hostDealCount: function () {
        return game.hostTechCardDealCount();
      },
      entryFor: model.getHostTechCardDealEntry,
      starAt: function (starIndex) {
        return galaxy.stars()[starIndex];
      },
      dealHand: params.coopDeal.pendingHandForRecord,
      rerollHand: params.coopReroll.rerollHandForRecord,
      computeRerollDeal: params.coopReroll.computeRerollDeal,
      effects: effects,
      lookup: lookup,
      fielded: fielded,
      teamDomains: teamDomains,
      namesUnits: namesUnits,
      chanceOf: chanceOf,
      isLoadout: helpers.isStartLoadoutCardId,
      rerollsRemain: helpers.rerollsRemain,
      armyGap: params.gwoAI.armyGap,
      armyGapClosable: params.gwoAI.armyGapClosable,
      factoryCards: factoryCards,
      dealCard: dealCard,
      decisionRng: function (record, dealIndex, rerollsUsed) {
        return gwoStreams.coopAiDecisionRng(
          warRng,
          record.gwaioAi.serial,
          dealIndex,
          rerollsUsed
        );
      },
      factoryRng: function (record, dealIndex) {
        return gwoStreams.coopAiFactoryRng(
          warRng,
          record.gwaioAi.serial,
          dealIndex
        );
      },
      enqueue: model.enqueueGwCampaignStateApply,
      write: function (record, patch) {
        return coopHost.upsertRecord(game, record, patch);
      },
      canRun: function () {
        return (
          hosting() &&
          cardsLoaded() &&
          !!lookup() &&
          !params.starCardsBusy() &&
          !model.gameOver()
        );
      },
      running: model.gwoCoopAi.driving,
      afterPass: function () {
        model.refreshGwCampaignInventoryModal();
        return Promise.resolve(params.gwoSave(game, false)).then(function () {
          coopPublish.publish("gwo_coop_ai_deal");
        });
      },
    });

    // Every deal the host records, and every AI added or returning,
    // starts a pass; one with nothing owed does nothing.
    ko.computed(function () {
      hosting();
      game.hostTechCardDealCount();
      game.coopPlayerInventoryData();
      model.gwoCoopAi.records();
      lookup();
      cardsLoaded();
      params.starCardsBusy();
      _.defer(driver.run);
    });

    // The loadouts a new AI may start with, dealt as the per-player
    // loadout scene deals a viewer's.
    var cardIds = function (list) {
      return _.compact(_.pluck(_.isArray(list) ? list : [], "id"));
    };
    var startingIds = _.uniq(
      gwoLoadoutIds.starting.concat(cardIds(model.gwoStartingCards))
    );
    var lockedIds = _.uniq(
      gwoLoadoutIds.lockedBase.concat(
        gwoLoadoutIds.unlockable,
        cardIds(model.gwoNewStartCards)
      )
    );
    var loadoutIds = _.uniq(startingIds.concat(lockedIds));
    var loadoutCards = [];
    var loadoutDeck = [];
    var loadoutsLoaded = $.Deferred();
    params.gwoDeal.setupGwoDeck(
      loadoutCards,
      loadoutDeck,
      loadoutIds.length,
      loadoutsLoaded,
      loadoutIds
    );

    // The loadouts no AI is given: GWO's, and any a mod adds to
    // model.gwoLoadoutsAiCannotUse, which GWO reads and never creates.
    var loadoutsAiCannotUse = function () {
      return _.isArray(model.gwoLoadoutsAiCannotUse)
        ? roster.LOADOUTS_AI_CANNOT_USE.concat(model.gwoLoadoutsAiCannotUse)
        : roster.LOADOUTS_AI_CANNOT_USE;
    };

    // One candidate loadout's starting inventory, with the Sub
    // Commanders a General Commander loadout brings. ai: record,
    // playerFaction, race, star, and handle, the General Commander's.
    var buildLoadout = function (ai, loadoutCardId) {
      return Promise.resolve(
        startingInventory.build({
          GWInventory: params.GWInventory,
          gwoDeal: params.gwoDeal,
          loaded: loadoutsLoaded,
          loadedCards: loadoutCards,
          loadoutCardId: loadoutCardId,
          commander: ai.record.commander,
          playerFaction: ai.playerFaction,
          playerRace: ai.race,
          galaxy: galaxy,
          star: ai.star,
        })
      ).then(function (saved) {
        // Plain data: a save carries the GWInventory methods.
        return ai.handle.appendRecordMinions(
          coopAiEffects.plain(saved),
          gwoStreams.coopPlayerKey(ai.record)
        );
      });
    };

    var unlocked = function (id) {
      return params.startCardUnlocked({ id: id });
    };

    // A new AI's loadout and starting inventory: every loadout the host
    // has unlocked that its race may field and an AI can use, scored.
    // options: record (commander and serial set), race.
    var startingTech = function (options) {
      var record = options.record;
      var race = options.race;
      var playerFaction = inventory.getTag("global", "playerFaction");
      var tags = startingInventory.buildGlobalTags(
        record.commander,
        playerFaction,
        race
      );
      var star = galaxy.stars()[game.currentStar()];
      var used = params.gwoAI.originSettings(game).uniqueAiLoadouts
        ? roster.loadoutsInUse(
            [hostSaved()].concat(
              _.pluck(game.coopPlayerInventoryData(), "inventory")
            ),
            helpers.isStartLoadoutCardId
          )
        : undefined;

      return Promise.resolve().then(function () {
        return driver.chooseStartingLoadout({
          name: record.gwaioAi.name,
          candidates: roster.loadoutCandidates({
            starting: startingIds,
            locked: lockedIds,
            unlocked: unlocked,
            raceLocks: _.partial(helpers.raceLocksLoadout, race),
            aiCannotUse: loadoutsAiCannotUse(),
          }),
          baseline: {
            cards: [{ id: "gwc_start" }],
            tags: { global: tags },
          },
          commander: record.commander,
          teamDomains: teamDomains(record.playerId, lookup()),
          rng: gwoStreams.coopAiLoadoutRng(warRng, record.gwaioAi.serial),
          used: used,
          build: _.partial(buildLoadout, {
            record: record,
            playerFaction: playerFaction,
            race: race,
            star: star,
            handle: params.generalCommander,
          }),
        });
      });
    };

    model.gwoCoopAi.tech({
      ready: function () {
        return !!lookup();
      },
      startingTech: startingTech,
    });
  };
});
