define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
  "shared/gw_inventory",
], function (GWFactions, gwoAI, gwoSave, GWInventory) {
  return function (params) {
    const game = params.game;
    const gwoSettings = params.gwoSettings;
    const playerFaction = params.playerFaction;
    const inventory =
      params.inventory ||
      (game && _.isFunction(game.inventory) ? game.inventory() : undefined);

    const setupGeneralCommanderRequest = "gwo_setup_general_commander";
    const setupGeneralCommanderResult = "gwo_setup_general_commander_result";

    const inventoryNeedsGeneralCommanderSetup = function (cards) {
      return !!(
        _.isArray(cards) &&
        cards.length === 1 &&
        cards[0] &&
        cards[0].id === "gwc_start_subcdr" &&
        !cards[0].minions
      );
    };

    const applyPenchantToSubcommander = function (subcommander) {
      var subcommanderAI = gwoSettings && gwoSettings.aiAlly;
      if (subcommanderAI !== "Penchant") {
        return;
      }

      const penchantValues = gwoAI.penchants();
      subcommander.character =
        subcommander.character + (" " + loc(penchantValues.penchantName));
      subcommander.personality.personality_tags =
        subcommander.personality.personality_tags.concat(
          penchantValues.penchants
        );
    };

    const resolveFactionMinions = function (factionIndex) {
      const chosenFaction = GWFactions[factionIndex];
      if (chosenFaction && _.isArray(chosenFaction.minions)) {
        return chosenFaction.minions;
      }

      const fallbackFaction = GWFactions[playerFaction];
      return fallbackFaction && _.isArray(fallbackFaction.minions)
        ? fallbackFaction.minions
        : [];
    };

    const buildGeneralCommanderMinions = function (factionIndex) {
      const minionPool = resolveFactionMinions(factionIndex);
      const minions = [];
      if (!minionPool.length) {
        return minions;
      }

      _.times(2, function () {
        const baseSubcommander = _.sample(minionPool);
        if (!baseSubcommander) {
          return;
        }

        const subcommander = _.cloneDeep(baseSubcommander);
        applyPenchantToSubcommander(subcommander);
        minions.push({
          id: "gwc_minion",
          minion: subcommander,
          unique: Math.random(),
        });
      });

      return minions;
    };

    const appendGeneralCommanderMinions = function (cards, factionIndex) {
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

    const sendGeneralCommanderSetupResult = function (
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

    const failGeneralCommanderSetup = function (operator, reason) {
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

    const applyGeneralCommanderSetupResult = function (operator) {
      const payload = operator && operator.payload ? operator.payload : {};
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
        model.prepareCoopPlayerInventories();
      }
    };

    const setupGeneralCommanderForViewer = function () {
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

      if (!model.gwoGeneralCommanderSetupPending) {
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

    const setupGeneralCommanderForCoopPlayer = function (operator) {
      var record;
      var recordInventory;
      var cards;
      var recordFaction;
      var factionIndex;
      var playerInventory;
      var finish;
      var inventoryCards;

      if (
        !model.isCampaignHost() ||
        !model.gwCampaignPerPlayerTechCards() ||
        !operator
      ) {
        return;
      }

      record = game.findCoopPlayerInventoryData({
        id: operator.client_id,
        name: operator.client_name,
      });

      if (!record || !record.inventory) {
        failGeneralCommanderSetup(operator, "missing co-op player inventory");
        return;
      }

      recordInventory = _.cloneDeep(record.inventory);
      cards = recordInventory && recordInventory.cards;
      if (!_.isArray(cards)) {
        failGeneralCommanderSetup(operator, "invalid co-op player inventory");
        return;
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
        return;
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
          failGeneralCommanderSetup(
            operator,
            "failed to store co-op player inventory"
          );
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
        gwoSave(game, false);
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
        return;
      }

      playerInventory.applyCards(finish);
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
