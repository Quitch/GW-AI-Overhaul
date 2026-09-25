// Co-op AI players: the host drops one into an open slot and it fights beside
// the humans as an allied AI army. Glue - the logic is gw_play/coop_ai_roster.js
// and gw_play/coop_ai_lobby.js. See coop.md, "AI players".
(function () {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    var game = model.game();

    // coop_ai_roster.js's rule, needed before any module can load.
    var isAiRecord = function (record) {
      return !!record && _.isPlainObject(record.gwaioAi);
    };
    var savedAiCount = function () {
      return _.filter(game.coopPlayerInventoryData(), isAiRecord).length;
    };

    var mods = ko.observable();

    // Every session open seeds max_clients from this, and a locked war's slot
    // limit, so an AI's slot never reopens to a human. Wrapped here rather than
    // in a module callback, which can land after the saved settings apply;
    // until the roster loads, every AI counts as holding one of the war's
    // seats, as roster.humanSeats counts one the host did not open for it.
    var savedCoopPlayers = model.savedCoopPlayers;
    var warSeats = function () {
      return savedCoopPlayers.apply(model, arguments);
    };
    model.savedCoopPlayers = function () {
      var all = game.coopPlayerInventoryData();
      return mods()
        ? mods().roster.humanSeats(warSeats(), all)
        : Math.max(1, warSeats() - savedAiCount());
    };

    // A session that came back from a battle waits for the humans who fought
    // it: until they have rejoined, or a minute has passed, their empty slots
    // stay theirs. Stock re-applies this restart context once, on connecting.
    var RETURN_WINDOW_MS = 60000;
    var expectedBack = ko.observable(0);
    var restart = model.gwCampaignRestartContext();
    if (restart && restart.pending_reapply && restart.settings) {
      expectedBack(parseInt(restart.settings.battle_launch_clients, 10) || 0);
      setTimeout(function () {
        expectedBack(0);
      }, RETURN_WINDOW_MS);
    }

    var lobby = ko.observable();
    // The modules are in: an AI can fight.
    var ready = ko.observable(false);
    // The names and the host's commanders are in too: an AI can be added.
    var namesReady = ko.observable(false);
    var commandersReady = ko.observable(false);
    var busy = ko.observable(false);
    var armed = ko.observable();
    var settingsInFlight = ko.observable(0);
    var lobbyChanging = function () {
      return busy() || settingsInFlight() > 0;
    };
    var names = [];
    var ownedCommanders = [];

    // An AI sits out a war played without a session.
    var records = ko.computed(function () {
      var all = game.coopPlayerInventoryData();
      if (!model.gwCampaignActive()) {
        return [];
      }
      return mods() ? mods().roster.aiRecords(all) : _.filter(all, isAiRecord);
    });

    records.subscribe(function () {
      armed(undefined);
    });

    // The colour pairs the battle gives the AIs: the players' sequence
    // continued, as stock's gwCoopPlayerColors counts the human armies.
    var aiColours = function (aiCount) {
      var loaded = mods();
      var inventory = game.inventory();
      return loaded.roster.colourPairs({
        resolve: loaded.colours.resolvePlayerColorPairs,
        humanArmies: loaded.roster.humanArmies(
          model.gwCampaignSharedControl() &&
            !model.gwCampaignPerPlayerTechCards(),
          model.gwCampaignConnectedClients().length
        ),
        aiCount: aiCount,
        faction: loaded.factions[inventory.getTag("global", "playerFaction")],
        factionColour: inventory.getTag("global", "playerColor"),
      });
    };

    var launchRoster = function () {
      var loaded = mods();
      if (!loaded) {
        if (model.gwCampaignActive() && savedAiCount()) {
          throw new Error("co-op AI players are not loaded");
        }
        return [];
      }

      var inventory = game.inventory();
      return loaded.roster.launchAis({
        records: game.coopPlayerInventoryData(),
        active: model.gwCampaignActive(),
        perPlayerTech: model.gwCampaignPerPlayerTechCards(),
        humanCount: model.gwCampaignConnectedClients().length,
        hostRace: loaded.races.raceOf(inventory),
        hostInventory: inventory,
        colours: aiColours,
      });
    };

    model.gwoCoopAi = {
      ready: ready,
      busy: busy,
      records: records,
      count: ko.computed(function () {
        return records().length;
      }),
      canAdd: ko.computed(function () {
        return (
          namesReady() && commandersReady() && !!lobby() && lobby().canAddAi()
        );
      }),
      add: function () {
        if (lobby()) {
          lobby().addAi();
        }
      },
      canKick: function (row) {
        return !!lobby() && lobby().canKickAi(row);
      },
      kick: function (row) {
        if (lobby()) {
          lobby().kickAi(row);
        }
      },
      kickArmed: function (row) {
        return !!row && armed() === row.id;
      },
      launchRoster: launchRoster,
      // The war panel's line per AI: its name, battle colour and race.
      panel: ko.computed(function () {
        var list = records();
        if (!mods() || !list.length) {
          return [];
        }
        return mods().roster.panelEntries(
          list,
          aiColours(list.length),
          mods().races.raceOf(game.inventory())
        );
      }),
    };

    // Injected before gw_play.js's ko.applyBindings, so the slot list's
    // foreach captures the controls with the rest of its row template.
    var $slot = $(
      loadHtml(
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_slot.html"
      )
    );
    var $row = $("#gw-campaign-settings .gw-campaign-slot-row");
    $row.find(".gw-slot-name").append($slot.filter(".gwo-slot-ai-marker"));
    $row.find(".gw-slot-remove").before($slot.filter(".gwo-slot-button"));
    locTree($slot);

    model.gwoWhenBound(function () {
      var stockSlots = model.gwCampaignSlots;
      model.gwCampaignSlots = ko.computed(function () {
        var rows = stockSlots();
        var loaded = mods();
        if (!loaded) {
          return rows;
        }
        return rows.concat(
          loaded.roster.slotRows(
            records(),
            rows.length + 1,
            model.getGwCampaignLoadingTooltip()
          )
        );
      });

      // Stock's "+" and "-" send an absolute count read from
      // gwCampaignMaxClients, which is stale while an add, a kick, or another
      // count is in flight: one sent then would undo it.
      var stockCanAdd = model.canAddGwCampaignSlot;
      model.canAddGwCampaignSlot = ko.computed(function () {
        var loaded = mods();
        return (
          stockCanAdd() &&
          !lobbyChanging() &&
          (!loaded ||
            loaded.roster.roomForSlot(
              parseInt(model.gwCampaignMaxClients(), 10),
              parseInt(model.gwCampaignMaxClientsLimit(), 10),
              model.gwCampaignMaxClientsLocked(),
              records().length
            ))
        );
      });

      var holdWhileChanging = function (name) {
        var stock = model[name];
        model[name] = function () {
          if (lobbyChanging()) {
            console.log(
              "[GW COOP AI] " + name + " held: the slot count is changing"
            );
            return;
          }
          return stock.apply(this, arguments);
        };
      };
      holdWhileChanging("addGwCampaignSlot");
      holdWhileChanging("removeGwCampaignSlot");

      // Stock's lobby push (Share Army, public or private, the title and
      // password) sends the count too. One asked for while the count is
      // changing goes out once it settles, with the settings as they are then.
      var stockPush = model.pushCampaignLobbySettings;
      var pushOwed = false;
      model.pushCampaignLobbySettings = function () {
        if (lobbyChanging()) {
          pushOwed = true;
          return;
        }
        return stockPush.apply(this, arguments);
      };
      ko.computed(function () {
        if (!lobbyChanging() && pushOwed) {
          pushOwed = false;
          _.defer(function () {
            model.pushCampaignLobbySettings();
          });
        }
      });

      // Stock's own Kick only disconnects a client; an AI row has none.
      var stockKick = model.kickGwCampaignClient;
      model.kickGwCampaignClient = function (slot) {
        if (slot && slot.gwoAi) {
          return;
        }
        return stockKick.apply(this, arguments);
      };

      // A battle launched mid-add or without the AI modules would be fought
      // without its AI players, so it waits.
      var gate = function (name) {
        var stock = model[name];
        model[name] = function () {
          if (model.gwCampaignActive()) {
            if (busy()) {
              console.log(
                "[GW COOP AI] " + name + " refused: an AI is joining or leaving"
              );
              return;
            }
            if (savedAiCount() && !ready()) {
              console.error(
                "[GW COOP AI] " +
                  name +
                  " refused: co-op AI players are not loaded"
              );
              return;
            }
          }
          return stock.apply(this, arguments);
        };
      };
      gate("fight");
      gate("restartFight");

      // Every modify_settings in flight, whoever sent it, so the lobby knows
      // when gwCampaignMaxClients can be trusted. send_message exists by now:
      // gw_play.js registers it before binding.
      var sendMessage = model.send_message;
      model.send_message = function (message, payload, respond) {
        if (message !== "modify_settings") {
          return sendMessage.apply(this, arguments);
        }

        settingsInFlight(settingsInFlight() + 1);
        return sendMessage.call(this, message, payload, function () {
          settingsInFlight(Math.max(0, settingsInFlight() - 1));
          if (_.isFunction(respond)) {
            return respond.apply(this, arguments);
          }
        });
      };
    });

    CommanderUtility.afterCommandersLoaded(function () {
      ownedCommanders = _.filter(
        CommanderUtility.getKnownCommanders(),
        function (commander) {
          return PlayFab.isCommanderOwned(
            CommanderUtility.bySpec.getObjectName(commander)
          );
        }
      );
      commandersReady(true);
    });

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_lobby.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "shared/gw_coop_player_colors",
        "shared/gw_factions",
      ],
      function (
        roster,
        coopAiLobby,
        gwoStreams,
        gwoAI,
        gwoRaces,
        gwoSave,
        colours,
        factions
      ) {
        var createRecord = function (identity) {
          var inventory = game.inventory();
          var all = game.coopPlayerInventoryData();
          var hostCommander = inventory.getTag("global", "commander");

          return roster.buildAiRecord({
            identity: identity,
            rng: gwoStreams.coopAiPlayerRng(
              gwoStreams.warRng(gwoAI.originSettings(game)),
              identity.serial
            ),
            race: gwoRaces.raceOf(inventory),
            names: names,
            taken: roster.takenNames(
              model.gwCampaignConnectedClients(),
              all,
              model.displayName()
            ),
            owned: ownedCommanders,
            fielded: roster.fieldedCommanders(
              hostCommander,
              all,
              inventory.minions()
            ),
            hostCommander: hostCommander,
            now: _.now(),
          });
        };

        mods({
          roster: roster,
          races: gwoRaces,
          colours: colours,
          factions: factions,
        });
        lobby(
          coopAiLobby({
            game: game,
            gwaio: function () {
              return gwoAI.originSettings(game);
            },
            createRecord: createRecord,
            save: function (withStars) {
              return gwoSave(game, withStars);
            },
            warSeats: warSeats,
            expectedBack: expectedBack,
            ready: ready,
            busy: busy,
            armed: armed,
            inFlight: settingsInFlight,
          })
        );
        ready(true);

        // The skirmish lobby's own AI name list, read as text: jQuery would
        // otherwise run it as a script. A war never depends on it: an AI whose
        // name could not be drawn is named by its serial.
        $.ajax({
          url: "coui://server-script/ai_names_table.js",
          dataType: "text",
        }).then(
          function (text) {
            names = roster.parseAiNames(text);
            namesReady(true);
          },
          function (error) {
            console.error(
              "[GW COOP AI] AI names not read: " +
                JSON.stringify(error && error.status)
            );
            namesReady(true);
          }
        );
      },
      // Fight stays refused in a session while the war has AI players.
      function (err) {
        console.error(
          "Galactic War Overhaul (GWO): co-op AI modules not loaded: " +
            err.requireModules +
            ": " +
            (err.stack || err.message || err)
        );
      }
    );
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
