define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
  "shared/gw_inventory",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
], function (
  GWFactions,
  gwoAI,
  gwoSave,
  GWInventory,
  helpers,
  gwoStreams,
  gwoCard,
  coopHost,
  gwoRaces
) {
  return function (params) {
    var game = params.game;
    var gwoSettings = params.gwoSettings;
    var playerFaction = params.playerFaction;
    var inventory =
      params.inventory ||
      (game && _.isFunction(game.inventory) ? game.inventory() : undefined);
    var warRng = gwoStreams.warRng(gwoSettings);

    var setupGeneralCommanderRequest = "gwo_setup_general_commander";
    var setupGeneralCommanderResult = "gwo_setup_general_commander_result";

    var inventoryNeedsGeneralCommanderSetup = function (cards) {
      return !!(
        _.isArray(cards) &&
        cards.length === 1 &&
        cards[0] &&
        cards[0].id === "gwc_start_subcdr" &&
        !cards[0].minions
      );
    };

    var resolveFactionMinions = function (factionIndex) {
      var chosenFaction = GWFactions[factionIndex];
      if (chosenFaction && _.isArray(chosenFaction.minions)) {
        return chosenFaction.minions;
      }

      var fallbackFaction = GWFactions[playerFaction];
      return fallbackFaction && _.isArray(fallbackFaction.minions)
        ? fallbackFaction.minions
        : [];
    };

    // raceInventory is whose race the minions are drawn for: the host's own
    // inventory on the host's path, and the viewer's record inventory when the
    // host is setting a viewer up under Separate races. See coop.md.
    var buildGeneralCommanderMinions = function (
      factionIndex,
      playerKey,
      raceInventory
    ) {
      var minionPool = resolveFactionMinions(factionIndex);
      // The minions fight as this player's race, so the pool follows that
      // race's ally brain. See races.md.
      var race = gwoRaces.raceOf(raceInventory || inventory);
      if (gwoAI.aiInUse("subcommander", race) === "Queller") {
        minionPool = gwoAI.quellerCompatibleMinions(minionPool);
      }

      return helpers.buildGeneralCommanderMinions({
        minionPool: minionPool,
        gwoSettings: gwoSettings,
        gwoAI: gwoAI,
        gwoCard: gwoCard,
        races: gwoRaces,
        race: race,
        rng: gwoStreams.generalCommanderRng(warRng, playerKey),
      });
    };

    var appendGeneralCommanderMinions = function (
      cards,
      factionIndex,
      playerKey,
      raceInventory
    ) {
      var minions;
      if (!inventoryNeedsGeneralCommanderSetup(cards)) {
        return false;
      }

      minions = buildGeneralCommanderMinions(
        factionIndex,
        playerKey,
        raceInventory
      );
      if (!minions.length) {
        return false;
      }

      _.forEach(minions, function (minionCard) {
        cards.push(minionCard);
      });

      return true;
    };

    var applyGeneralCommanderSetupResult = function (operator) {
      var payload = operator && operator.payload ? operator.payload : {};
      if (model.gwoGeneralCommanderSetupPending) {
        model.gwoGeneralCommanderSetupPending(false);
      }

      if (payload.error) {
        console.error(
          "[GW COOP] general commander setup failed: " + payload.error
        );
        return;
      }

      if (payload.changed && _.isFunction(model.prepareCoopPlayerInventories)) {
        return model.prepareCoopPlayerInventories();
      }
    };

    var setupGeneralCommanderForViewer = function () {
      var record;
      var recordInventory;
      var cards;

      if (
        !model.isCampaignViewer() ||
        !model.gwCampaignActive() ||
        !model.gwCampaignPerPlayerTechCards() ||
        !model.sendCampaignViewerOperator ||
        !model.gwCampaignConnected() ||
        !model.currentCoopPlayerInventoryData
      ) {
        return false;
      }

      if (!ko.isObservable(model.gwoGeneralCommanderSetupPending)) {
        model.gwoGeneralCommanderSetupPending = ko.observable(false);
      }

      if (model.gwoGeneralCommanderSetupPending()) {
        return false;
      }

      record = model.currentCoopPlayerInventoryData();
      recordInventory = record && record.inventory;
      cards = recordInventory && recordInventory.cards;
      if (!inventoryNeedsGeneralCommanderSetup(cards)) {
        return false;
      }

      model.gwoGeneralCommanderSetupPending(true);
      model.sendCampaignViewerOperator(
        setupGeneralCommanderRequest,
        {},
        {
          request_id: _.uniqueId("gwo_setup_general_commander_"),
        }
      );
      return true;
    };

    var setupGeneralCommanderForCoopPlayer = function (operator) {
      var result = $.Deferred();
      var record;
      var recordInventory;
      var cards;
      var recordFaction;
      var factionIndex;
      var playerInventory;
      var finish;
      var inventoryCards;

      // Rejects as well as notifying the viewer, so the campaign queue can
      // order this handler's async work.
      var failSetup = function (reason) {
        coopHost.fail(
          setupGeneralCommanderResult,
          operator,
          "setup general commander",
          reason
        );
        result.reject(reason);
      };

      var replyUnchanged = function () {
        coopHost.reply(setupGeneralCommanderResult, operator, {
          changed: false,
        });
        result.resolve();
        return result.promise();
      };

      if (
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards() ||
        !operator
      ) {
        result.reject("not campaign host or per-player tech disabled");
        return result.promise();
      }

      record = coopHost.recordFor(game, operator);

      if (!record || !record.inventory) {
        failSetup("missing co-op player inventory");
        return result.promise();
      }

      recordInventory = _.cloneDeep(record.inventory);
      cards = recordInventory && recordInventory.cards;
      if (!_.isArray(cards)) {
        failSetup("invalid co-op player inventory");
        return result.promise();
      }

      if (!inventoryNeedsGeneralCommanderSetup(cards)) {
        return replyUnchanged();
      }

      recordFaction =
        recordInventory &&
        recordInventory.tags &&
        recordInventory.tags.global &&
        recordInventory.tags.global.playerFaction;
      factionIndex = _.isNumber(recordFaction) ? recordFaction : playerFaction;
      playerInventory = new GWInventory();
      playerInventory.load(recordInventory);

      finish = function () {
        var nextRecord = coopHost.upsertRecord(game, record, {
          inventory: playerInventory.save(),
        });
        if (!nextRecord) {
          failSetup("failed to store co-op player inventory");
          return;
        }

        model.sendCampaignSnapshot("gwo_setup_general_commander", true);
        coopHost.reply(setupGeneralCommanderResult, operator, {
          changed: true,
          updated_at: nextRecord.updatedAt,
        });
        gwoSave(game, false).then(
          function () {
            result.resolve();
          },
          function (error) {
            result.reject(error);
          }
        );
      };

      inventoryCards = playerInventory.cards();
      if (
        !appendGeneralCommanderMinions(
          inventoryCards,
          factionIndex,
          gwoStreams.coopPlayerKey(record, {
            id: operator.client_id,
            name: operator.client_name,
          }),
          playerInventory
        )
      ) {
        return replyUnchanged();
      }

      playerInventory.applyCards(finish);

      return result.promise();
    };

    model.registerCampaignViewerOperatorHandler(
      setupGeneralCommanderRequest,
      setupGeneralCommanderForCoopPlayer
    );

    model.registerCampaignHostOperatorHandler(
      setupGeneralCommanderResult,
      applyGeneralCommanderSetupResult
    );

    return function setupGeneralCommander() {
      var cards;

      if (
        model.isCampaignViewer() &&
        model.gwCampaignPerPlayerTechCards() &&
        setupGeneralCommanderForViewer()
      ) {
        return;
      }

      if (!inventory || !_.isFunction(inventory.cards)) {
        return;
      }

      cards = inventory.cards();
      if (appendGeneralCommanderMinions(cards, playerFaction)) {
        inventory.applyCards();
        gwoSave(game, false);
      }
    };
  };
});
