define([
  "shared/gw_factions",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
  "shared/gw_inventory",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
], (GWFactions, gwoAI, gwoSave, GWInventory, helpers, gwoStreams, gwoCard) =>
  (params) => {
    const game = params.game;
    const gwoSettings = params.gwoSettings;
    const playerFaction = params.playerFaction;
    const inventory =
      params.inventory ||
      (game && _.isFunction(game.inventory) ? game.inventory() : undefined);
    const warRng = gwoStreams.warRng(gwoSettings);

    const setupGeneralCommanderRequest = "gwo_setup_general_commander";
    const setupGeneralCommanderResult = "gwo_setup_general_commander_result";

    const inventoryNeedsGeneralCommanderSetup = (cards) =>
      !!(
        _.isArray(cards) &&
        cards.length === 1 &&
        cards[0] &&
        cards[0].id === "gwc_start_subcdr" &&
        !cards[0].minions
      );

    const resolveFactionMinions = (factionIndex) => {
      const chosenFaction = GWFactions[factionIndex];
      if (chosenFaction && _.isArray(chosenFaction.minions)) {
        return chosenFaction.minions;
      }

      const fallbackFaction = GWFactions[playerFaction];
      return fallbackFaction && _.isArray(fallbackFaction.minions)
        ? fallbackFaction.minions
        : [];
    };

    const buildGeneralCommanderMinions = (factionIndex, playerKey) => {
      let minionPool = resolveFactionMinions(factionIndex);
      if (gwoSettings && gwoSettings.aiAlly === "Queller") {
        minionPool = gwoAI.quellerCompatibleMinions(minionPool);
      }

      return helpers.buildGeneralCommanderMinions({
        minionPool,
        gwoSettings,
        gwoAI,
        gwoCard,
        rng: gwoStreams.generalCommanderRng(warRng, playerKey),
      });
    };

    const appendGeneralCommanderMinions = (cards, factionIndex, playerKey) => {
      let minions;
      if (!inventoryNeedsGeneralCommanderSetup(cards)) {
        return false;
      }

      minions = buildGeneralCommanderMinions(factionIndex, playerKey);
      if (!minions.length) {
        return false;
      }

      _.forEach(minions, (minionCard) => {
        cards.push(minionCard);
      });

      return true;
    };

    const sendGeneralCommanderSetupResult = (clientId, requestId, payload) => {
      if (!model.sendCampaignHostOperator) {
        return;
      }

      model.sendCampaignHostOperator(setupGeneralCommanderResult, payload, {
        target_client_id: clientId,
        request_id: requestId,
      });
    };

    const failGeneralCommanderSetup = (operator, reason) => {
      console.error(`[GW COOP] failed to setup general commander: ${reason}`);
      if (_.isUndefined(operator.client_id)) {
        return;
      }

      sendGeneralCommanderSetupResult(operator.client_id, operator.request_id, {
        client_id: operator.client_id,
        client_name: operator.client_name,
        error: reason,
      });
    };

    const applyGeneralCommanderSetupResult = (operator) => {
      const payload = operator && operator.payload ? operator.payload : {};
      if (model.gwoGeneralCommanderSetupPending) {
        model.gwoGeneralCommanderSetupPending(false);
      }

      if (payload.error) {
        console.error(
          `[GW COOP] general commander setup failed: ${payload.error}`
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

    const setupGeneralCommanderForViewer = () => {
      let record;
      let recordInventory;
      let cards;

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

    const setupGeneralCommanderForCoopPlayer = (operator) => {
      const result = $.Deferred();
      let record;
      let recordInventory;
      let cards;
      let recordFaction;
      let factionIndex;
      let playerInventory;
      let finish;
      let inventoryCards;

      // Rejects as well as notifying the viewer, so the campaign queue can
      // order this handler's async work.
      const failSetup = (reason) => {
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

      finish = () => {
        const nextRecord = _.assign({}, _.cloneDeep(record), {
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
          () => {
            result.resolve();
          },
          (error) => {
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
          })
        )
      ) {
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
      let cards;

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
  });
