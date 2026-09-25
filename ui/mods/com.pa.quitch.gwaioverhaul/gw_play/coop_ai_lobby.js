// The host's half of co-op AI players in the lobby: adding one into an open
// slot, kicking one, and telling viewers. A slot is `connected < max_clients`
// on client and server alike, so an AI takes one by shrinking max_clients by
// one, and GWO keeps the AI slots itself. Reads model at call time. See
// coop.md, "AI players".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
], function (roster) {
  var LOG = "[GW COOP AI] ";

  var maxClients = function () {
    return parseInt(model.gwCampaignMaxClients(), 10);
  };

  var connectedClients = function () {
    var clients = model.gwCampaignConnectedClients();
    return _.isArray(clients) ? clients : [];
  };

  var hasViewer = function () {
    return _.some(connectedClients(), function (client) {
      return client && client.role === "viewer";
    });
  };

  var hasEmptySlot = function () {
    var max = maxClients();
    return _.isFinite(max) && connectedClients().length < max;
  };

  var restartPending = function () {
    var context = model.gwCampaignRestartContext();
    return !!(context && context.pending_reapply);
  };

  var victoryWaiting = function () {
    var wait = model.gwoVictoryWait;
    return !!(wait && _.isFunction(wait.visible) && wait.visible());
  };

  // params: game, gwaio() (the war's originSystem.gwaio), createRecord(identity)
  // (builds the new AI's record), save() (a promise), and the observables ready,
  // busy, armed (the AI whose Kick was pressed once) and inFlight (the
  // modify_settings requests the server has not answered).
  var factory = function (params) {
    var game = params.game;
    var ready = params.ready;
    var busy = params.busy;
    var armed = params.armed;
    // While one is out, gwCampaignMaxClients may be stale: stock's own restart
    // re-apply sends one with no callback.
    var inFlight = params.inFlight;

    // initialCoopSettingsApplied is a plain field, so a computed reading this
    // does not track it. Stock flips it only beside a modify_settings, which
    // moves inFlight, so the computed re-evaluates anyway.
    var lobbySettled = function () {
      var control = model.gwCampaignControl();
      return !!(
        model.initialCoopSettingsApplied &&
        !restartPending() &&
        inFlight() === 0 &&
        control &&
        _.has(control, "max_clients")
      );
    };

    var hostCanEdit = function () {
      return !!(
        model.isCampaignHost() &&
        model.gwCampaignActive() &&
        ready() &&
        !busy() &&
        !model.launchingFight() &&
        lobbySettled()
      );
    };

    var canAddAi = function () {
      return (
        hostCanEdit() &&
        !model.gwCampaignPerPlayerTechCards() &&
        hasEmptySlot() &&
        !model.gwCampaignPlayerSetupBlocked() &&
        !victoryWaiting()
      );
    };

    var sendSettings = function (max, callback) {
      model.send_message(
        "modify_settings",
        model.buildCampaignLobbySettingsPayload(max),
        callback
      );
    };

    // Viewers hold no tech state under shared tech, so a roster change goes out
    // at once. With nobody to tell, a joiner's initial sync asks for a snapshot
    // of its own.
    var publish = function (reason) {
      if (hasViewer()) {
        model.sendCampaignSnapshot("gwo_coop_ai_" + reason, true);
      }
    };

    var saveWar = function (reason) {
      $.when(params.save()).then(null, function (error) {
        console.error(LOG + "war not saved after " + reason + ": " + error);
      });
    };

    var giveSlotBack = function () {
      sendSettings(maxClients() + 1, function (success, response) {
        if (!success) {
          console.error(
            LOG + "slot not restored: " + JSON.stringify(response || {})
          );
        }
      });
    };

    // Runs in the campaign state queue, after the server shrank max_clients.
    var writeNewAi = function (target) {
      try {
        var gwaio = params.gwaio();
        var identity = roster.nextAiIdentity(gwaio);
        var record = params.createRecord(identity);
        gwaio.coopAiSerial = identity.serial;

        if (!game.upsertCoopPlayerInventoryData(record)) {
          throw new Error("record refused for " + identity.playerId);
        }

        console.log(
          LOG + "added " + record.gwaioAi.name + " as " + record.playerId
        );
      } catch (error) {
        console.error(
          LOG +
            "add failed: " +
            ((error && (error.stack || error.message)) || error)
        );
        giveSlotBack();
        busy(false);
        return;
      }

      saveWar("add");
      // The first request carried the lock limit from before this AI, so it is
      // sent again with the one that leaves it out.
      if (model.savedCoopPlayersLocked()) {
        sendSettings(target);
      }
      publish("add");
      busy(false);
    };

    var addAi = function () {
      if (!canAddAi()) {
        return false;
      }

      var target = maxClients() - 1;
      busy(true);
      sendSettings(target, function (success, response) {
        // A human who joined meanwhile fills the slot, and the server keeps
        // max_clients at the number connected.
        if (!success || !response || response.max_clients !== target) {
          console.error(LOG + "add refused: " + JSON.stringify(response || {}));
          busy(false);
          return;
        }

        model.applyCampaignLobbyControl(response);
        model.enqueueGwCampaignStateApply("gwo_coop_ai_add", function () {
          writeNewAi(target);
        });
      });
      return true;
    };

    var canKickAi = function (row) {
      return !!(row && row.gwoAi && hostCanEdit());
    };

    // Kicking deletes the AI and its record for good, so it takes two presses.
    var kickAi = function (row) {
      if (!canKickAi(row)) {
        return false;
      }
      if (armed() !== row.id) {
        armed(row.id);
        return false;
      }

      armed(undefined);
      busy(true);
      model.enqueueGwCampaignStateApply("gwo_coop_ai_kick", function () {
        var records = game.coopPlayerInventoryData();
        var kept = _.reject(records, function (record) {
          return roster.isAiRecord(record) && record.playerId === row.id;
        });

        if (kept.length === records.length) {
          busy(false);
          return;
        }

        // Before the slot comes back, so a lock's limit counts it.
        game.coopPlayerInventoryData(kept);
        console.log(LOG + "kicked " + row.name + " (" + row.id + ")");
        saveWar("kick");
        sendSettings(maxClients() + 1, function (success, response) {
          if (!success) {
            console.error(
              LOG +
                "slot not returned after kick: " +
                JSON.stringify(response || {})
            );
          }
          busy(false);
        });
        publish("kick");
      });
      return true;
    };

    return {
      canAddAi: canAddAi,
      addAi: addAi,
      canKickAi: canKickAi,
      kickAi: kickAi,
      lobbySettled: lobbySettled,
    };
  };

  return factory;
});
