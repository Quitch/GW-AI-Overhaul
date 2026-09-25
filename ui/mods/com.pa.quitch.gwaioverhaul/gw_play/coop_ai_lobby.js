// The host's half of co-op AI players in the lobby: adding one into an open
// slot, kicking one, and telling viewers. A slot is `connected < max_clients`
// on client and server alike, so an AI takes one by shrinking max_clients by
// one, and GWO keeps the AI slots itself. Reads model at call time. See
// coop.md, "AI players".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
], function (roster) {
  var LOG = "[GW COOP AI] ";

  var describe = function (error) {
    return (error && (error.stack || error.message)) || String(error);
  };

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
  // (builds the new AI's record), save(withStars) (a promise), warSeats() (the
  // seats the war was made with, stock's savedCoopPlayers), expectedBack()
  // (the humans still due back from the last battle, 0 once none are), and
  // the observables ready, busy, armed (the AI whose Kick was pressed once)
  // and inFlight (the modify_settings requests the server has not answered).
  var factory = function (params) {
    var game = params.game;
    var ready = params.ready;
    var busy = params.busy;
    var armed = params.armed;
    // While one is out, gwCampaignMaxClients may be stale: stock's own restart
    // re-apply sends one with no callback.
    var inFlight = params.inFlight;

    // initialCoopSettingsApplied is a plain field, so a computed reading this
    // does not track it. gwCampaignControl is read first, and unconditionally:
    // the server broadcasts it before answering the modify_settings that stock
    // sends beside the flag, so the computed re-evaluates after the flip.
    var lobbySettled = function () {
      var control = model.gwCampaignControl();
      return !!(
        control &&
        _.has(control, "max_clients") &&
        model.initialCoopSettingsApplied &&
        !restartPending() &&
        inFlight() === 0
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

    // A slot left by a human still on their way back from the last battle is
    // theirs: filling it would turn them away with "No room".
    var humansBack = function () {
      return connectedClients().length >= (params.expectedBack() || 0);
    };

    var canAddAi = function () {
      return (
        hostCanEdit() &&
        // A war without GWO's settings has nowhere to keep the AI's serial.
        _.isPlainObject(params.gwaio()) &&
        !model.gwCampaignPerPlayerTechCards() &&
        hasEmptySlot() &&
        humansBack() &&
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

    // Only an add changes the stars: the serial lives on the origin system.
    var saveWar = function (reason, withStars) {
      var failed = function (error) {
        console.error(
          LOG + "war not saved after " + reason + ": " + describe(error)
        );
      };
      try {
        $.when(params.save(withStars)).then(null, failed);
      } catch (error) {
        failed(error);
      }
    };

    // The server holds target once it has answered an add, whatever the
    // local count reads.
    var giveSlotBack = function (target) {
      sendSettings(target + 1, function (success, response) {
        if (!success) {
          console.error(
            LOG + "slot not restored: " + JSON.stringify(response || {})
          );
        }
      });
    };

    var failAdd = function (error, target) {
      console.error(LOG + "add failed: " + describe(error));
      giveSlotBack(target);
      busy(false);
    };

    // Runs in the campaign state queue, after the server shrank max_clients.
    // extraSeat: the AI filled a seat beyond those the war was made with.
    var writeNewAi = function (target, extraSeat) {
      try {
        var gwaio = params.gwaio();
        var identity = roster.nextAiIdentity(gwaio);
        var record = params.createRecord(identity);
        if (extraSeat) {
          record.gwaioAi.extraSeat = true;
        }
        gwaio.coopAiSerial = identity.serial;

        if (!game.upsertCoopPlayerInventoryData(record)) {
          throw new Error("record refused for " + identity.playerId);
        }

        console.log(
          LOG + "added " + record.gwaioAi.name + " as " + record.playerId
        );
      } catch (error) {
        failAdd(error, target);
        return;
      }

      saveWar("add", true);
      try {
        // The first request carried the lock limit from before this AI, so it
        // is sent again with the one that leaves it out.
        if (model.savedCoopPlayersLocked()) {
          sendSettings(target);
        }
        publish("add");
      } catch (error) {
        console.error(LOG + "add not published: " + describe(error));
      }
      busy(false);
    };

    var addAi = function () {
      if (!canAddAi()) {
        return false;
      }

      var target = maxClients() - 1;
      var extraSeat = roster.takesExtraSeat(
        target + 1,
        roster.aiRecords(game.coopPlayerInventoryData()).length,
        params.warSeats()
      );
      busy(true);
      sendSettings(target, function (success, response) {
        // A human who joined meanwhile fills the slot, and the server keeps
        // max_clients at the number connected.
        if (!success || !response || response.max_clients !== target) {
          console.error(LOG + "add refused: " + JSON.stringify(response || {}));
          busy(false);
          return;
        }

        try {
          model.applyCampaignLobbyControl(response);
        } catch (error) {
          failAdd(error, target);
          return;
        }
        model.enqueueGwCampaignStateApply("gwo_coop_ai_add", function () {
          writeNewAi(target, extraSeat);
        });
      });
      return true;
    };

    var canKickAi = function (row) {
      return !!(row && row.gwoAi && hostCanEdit());
    };

    // Runs in the campaign state queue; kickAi releases busy if it throws.
    var removeAi = function (row) {
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
      saveWar("kick", false);
      try {
        publish("kick");
      } catch (error) {
        console.error(LOG + "kick not published: " + describe(error));
      }
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
        try {
          removeAi(row);
        } catch (error) {
          console.error(LOG + "kick failed: " + describe(error));
          busy(false);
        }
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
