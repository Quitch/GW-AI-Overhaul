define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
  "shared/gw_inventory",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
], function (GWFactions, gwoAI, gwoSave, GWInventory, helpers) {
  return function (params) {
    var game = params.game;
    var gwoSettings = params.gwoSettings;
    var playerFaction = params.playerFaction;
    var inventory =
      params.inventory ||
      (game && _.isFunction(game.inventory) ? game.inventory() : undefined);

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

    var buildGeneralCommanderMinions = function (factionIndex) {
      var minionPool = resolveFactionMinions(factionIndex);
      if (gwoSettings && gwoSettings.aiAlly === "Queller") {
        minionPool = gwoAI.quellerCompatibleMinions(minionPool);
      }
      var minions = [];
      if (!minionPool.length) {
        return minions;
      }

      _.times(2, function () {
        var baseSubcommander = _.sample(minionPool);
        if (!baseSubcommander) {
          return;
        }

        var subcommander = _.cloneDeep(baseSubcommander);
        helpers.applyPenchantToSubcommander(subcommander, gwoSettings, gwoAI);
        minions.push({
          id: "gwc_minion",
          minion: subcommander,
          unique: Math.random(),
        });
      });

      return minions;
    };

    var appendGeneralCommanderMinions = function (cards, factionIndex) {
      var minions;
      if (!inventoryNeedsGeneralCommanderSetup(cards)) {
        return false;
      }

      minions = buildGeneralCommanderMinions(factionIndex);
      if (!minions.length) {
        return false;
      }

      _.forEach(minions, function (minionCard) {
        cards.push(minionCard);
      });

      return true;
    };

    var sendGeneralCommanderSetupResult = function (
      clientId,
      requestId,
      payload
    ) {
      if (!model.sendCampaignHostOperator) {
        return;
      }

      model.sendCampaignHostOperator(setupGeneralCommanderResult, payload, {
        target_client_id: clientId,
        request_id: requestId,
      });
    };

    var failGeneralCommanderSetup = function (operator, reason) {
      console.error("[GW COOP] failed to setup general commander: " + reason);
      if (_.isUndefined(operator.client_id)) {
        return;
      }

      sendGeneralCommanderSetupResult(operator.client_id, operator.request_id, {
        client_id: operator.client_id,
        client_name: operator.client_name,
        error: reason,
      });
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

      if (
        payload.changed &&
        model.prepareCoopPlayerInventories &&
        _.isFunction(model.prepareCoopPlayerInventories)
      ) {
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

      // failGeneralCommanderSetup still sends the error operator back to the
      // requesting viewer; also reject so the base campaign queue can order this
      // handler's async work.
      var failSetup = function (reason) {
        failGeneralCommanderSetup(operator, reason);
        result.reject(reason);
      };

      if (
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards() ||
        !operator
      ) {
        result.reject("not campaign host or per-player tech disabled");
        return result.promise();
      }

      record = game.findCoopPlayerInventoryData({
        id: operator.client_id,
        name: operator.client_name,
      });

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
        sendGeneralCommanderSetupResult(
          operator.client_id,
          operator.request_id,
          {
            client_id: operator.client_id,
            client_name: operator.client_name,
            changed: false,
          }
        );
        result.resolve();
        return result.promise();
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
        var nextRecord = _.assign({}, _.cloneDeep(record), {
          inventory: playerInventory.save(),
          updatedAt: _.now(),
        });

        if (!game.upsertCoopPlayerInventoryData(nextRecord)) {
          failSetup("failed to store co-op player inventory");
          return;
        }

        model.sendCampaignSnapshot("gwo_setup_general_commander", true);
        sendGeneralCommanderSetupResult(
          operator.client_id,
          operator.request_id,
          {
            client_id: operator.client_id,
            client_name: operator.client_name,
            changed: true,
            updated_at: nextRecord.updatedAt,
          }
        );
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
      if (!appendGeneralCommanderMinions(inventoryCards, factionIndex)) {
        sendGeneralCommanderSetupResult(
          operator.client_id,
          operator.request_id,
          {
            client_id: operator.client_id,
            client_name: operator.client_name,
            changed: false,
          }
        );
        result.resolve();
        return result.promise();
      }

      playerInventory.applyCards(finish);

      return result.promise();
    };

    if (model.registerCampaignViewerOperatorHandler) {
      model.registerCampaignViewerOperatorHandler(
        setupGeneralCommanderRequest,
        setupGeneralCommanderForCoopPlayer
      );
    }

    if (model.registerCampaignHostOperatorHandler) {
      model.registerCampaignHostOperatorHandler(
        setupGeneralCommanderResult,
        applyGeneralCommanderSetupResult
      );
    }

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
