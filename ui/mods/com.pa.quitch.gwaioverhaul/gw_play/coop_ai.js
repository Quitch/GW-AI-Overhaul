// Co-op AI players: the host drops one into an open slot and it fights beside
// the humans as an allied AI army. Glue - the logic is gw_play/coop_ai_roster.js
// and gw_play/coop_ai_lobby.js. See coop.md, "AI players".
(function () {
  if (model.game().isTutorial()) {
    return;
  }

  try {
    var game = model.game();

    // coop_ai_roster.js's rules, needed before any module can load.
    var isAiRecord = function (record) {
      return !!record && _.isPlainObject(record.gwaioAi);
    };
    var savedAiCount = function () {
      return _.filter(game.coopPlayerInventoryData(), isAiRecord).length;
    };
    // roster.humanSeats' count: the AIs in the war's own seats.
    var seatedAiCount = function () {
      return _.filter(game.coopPlayerInventoryData(), function (record) {
        return isAiRecord(record) && !record.gwaioAi.extraSeat;
      }).length;
    };

    var mods = ko.observable();

    // Every session open seeds max_clients from this, and a locked war's slot
    // limit, so an AI's slot never reopens to a human. Wrapped here rather than
    // in a module callback, which lands after a new session's saved settings
    // apply, so until the roster loads the count is made here.
    var savedCoopPlayers = model.savedCoopPlayers;
    var warSeats = function () {
      return savedCoopPlayers.apply(model, arguments);
    };
    model.savedCoopPlayers = function () {
      var all = game.coopPlayerInventoryData();
      return mods()
        ? mods().roster.humanSeats(warSeats(), all)
        : Math.max(1, warSeats() - seatedAiCount());
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
    // Under per-player tech: cards.js's AI tech, once its modules are in, and
    // whether its driver is settling deals.
    var tech = ko.observable();
    var driving = ko.observable(false);
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

    var perPlayer = function () {
      return model.gwCampaignPerPlayerTechCards();
    };

    // Fight, explore and the star-card refresh wait while an AI is settling
    // its deals, or owes one it has yet to start. See coop.md, "AI players'
    // tech".
    model.gwoCoopAiDeciding = ko.computed(function () {
      if (driving()) {
        return true;
      }
      if (!perPlayer() || !model.isCampaignHost()) {
        return false;
      }
      var hostCount = game.hostTechCardDealCount();
      return _.some(records(), function (record) {
        return (
          !!record.inventory &&
          model.getCoopPlayerTechCardDealCount(record) < hostCount
        );
      });
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
      tech: tech,
      driving: driving,
      records: records,
      // The AIs as the star-card refresh walks clients.
      clients: function () {
        return _.map(records(), function (record) {
          return { id: record.playerId, name: record.gwaioAi.name, role: "ai" };
        });
      },
      publish: function (reason) {
        if (lobby()) {
          lobby().publish(reason);
        }
      },
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
      // The war panel's line per AI: its name, battle colour and race, and
      // under per-player tech its own loadout.
      panel: ko.computed(function () {
        var list = records();
        if (!mods() || !list.length) {
          return [];
        }
        return mods().roster.panelEntries(
          list,
          aiColours(list.length),
          mods().races.raceOf(game.inventory()),
          perPlayer()
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
            model.getGwCampaignLoadingTooltip(),
            perPlayer()
          )
        );
      });

      // Explore is held too (cards.js's model.explore), so it greys as it does
      // while a player sets up. gw_play.html binds that look to
      // gwCampaignPlayerSetupBlocked, and this runs before the binding.
      model.gwoExploreBlocked = ko.computed(function () {
        return (
          model.gwCampaignPlayerSetupBlocked() || model.gwoCoopAiDeciding()
        );
      });
      $(".btn_hero.explore").attr("data-bind", function (index, bind) {
        return bind.replace(
          "btn_hero_disabled: gwCampaignPlayerSetupBlocked",
          "btn_hero_disabled: gwoExploreBlocked"
        );
      });

      // An AI settling its deals holds the Fight button as a viewer choosing
      // tech does.
      var stockBlocked = model.gwCampaignFightBlocked;
      var stockTooltip = model.gwCampaignFightTooltip;
      model.gwCampaignFightBlocked = ko.computed(function () {
        return stockBlocked() || model.gwoCoopAiDeciding();
      });
      model.gwCampaignFightTooltip = ko.computed(function () {
        var reason = stockTooltip();
        return !reason && model.gwoCoopAiDeciding()
          ? "!LOC:Waiting for players"
          : reason;
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
            if (model.gwoCoopAiDeciding()) {
              console.log(
                "[GW COOP AI] " + name + " refused: an AI is choosing its tech"
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

    var ownedLoad = new Promise(function (resolve) {
      CommanderUtility.afterCommandersLoaded(function () {
        resolve(
          _.filter(CommanderUtility.getKnownCommanders(), function (commander) {
            return PlayFab.isCommanderOwned(
              CommanderUtility.bySpec.getObjectName(commander)
            );
          })
        );
      });
    });

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_roster.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_lobby.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/spec_cache.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
        "shared/gw_coop_player_colors",
        "shared/gw_factions",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_mods.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_check.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
      ],
      function (
        roster,
        coopAiLobby,
        gwoStreams,
        gwoAI,
        gwoRaces,
        gwoSave,
        specCache,
        gameFilePaths,
        colours,
        factions,
        raceMods,
        raceCheck,
        coopStarCards,
        refereeCoop
      ) {
        var warRng = function () {
          return gwoStreams.warRng(gwoAI.originSettings(game));
        };

        // Under Separate races the AI picks from the races the war offers,
        // preferring one no player fields; otherwise it fields the host's.
        var raceFor = function (rng) {
          var hostRace = gwoRaces.raceOf(game.inventory());
          var recorded = gwoAI.originSettings(game).races;
          if (!(recorded && recorded.perPlayerRace)) {
            return Promise.resolve(hostRace);
          }
          var fielded = [hostRace].concat(
            _.map(game.coopPlayerInventoryData(), function (record) {
              return gwoRaces.raceOf(record && record.inventory);
            })
          );
          return Promise.resolve(raceMods.installedRaces()).then(
            function (info) {
              var offer = _.pluck(
                raceCheck.activeRaces(
                  gwoRaces.detect(_.pluck(recorded.mods, "identifier")),
                  info
                ),
                "id"
              );
              return roster.pickAiRace(offer, fielded, rng, hostRace);
            }
          );
        };

        var buildRecord = function (identity, rng, race) {
          var inventory = game.inventory();
          var all = game.coopPlayerInventoryData();
          var hostCommander = inventory.getTag("global", "commander");

          return roster.buildAiRecord({
            identity: identity,
            rng: rng,
            race: race,
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

        var createRecord = function (identity) {
          var rng = gwoStreams.coopAiPlayerRng(warRng(), identity.serial);
          if (!perPlayer()) {
            return buildRecord(
              identity,
              rng,
              gwoRaces.raceOf(game.inventory())
            );
          }

          return raceFor(rng && rng.stream("race")).then(function (race) {
            var record = buildRecord(identity, rng, race);
            return tech()
              .startingTech({ record: record, race: race })
              .then(function (start) {
                return roster.withStartingTech(record, start, race);
              });
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
            perPlayerReady: function () {
              return !!tech() && tech().ready();
            },
            // The star-card refresh's own test, over the connected viewers.
            publishReady: function () {
              return coopStarCards.viewersReadyForStarRefresh({
                viewers: refereeCoop.viewersOf(
                  model.gwCampaignConnectedClients()
                ),
                findRecord: function (client) {
                  return refereeCoop.recordForClient(game, client);
                },
                getDealCount: model.getCoopPlayerTechCardDealCount,
                hostDealCount: game.hostTechCardDealCount(),
                setupBlocked: model.gwCampaignPlayerSetupBlocked(),
                turnState: game.turnState(),
                aiDeciding: model.gwoCoopAiDeciding(),
              });
            },
          })
        );
        ready(true);

        // A roster change held for the viewers goes out once they are level.
        ko.computed(function () {
          model.gwCampaignConnectedClients();
          game.coopPlayerInventoryData();
          game.hostTechCardDealCount();
          game.turnState();
          model.gwCampaignPlayerSetupBlocked();
          model.gwoCoopAiDeciding();
          _.defer(function () {
            lobby().settleDebt();
          });
        });

        // An AI falls back to the host's commander if none could be checked.
        var specDeps = { fetch: gameFilePaths.specFetch };
        ownedLoad
          .then(function (owned) {
            return roster
              .mlaCommanders(owned, function (path) {
                return specCache.fetchRaw(path, specDeps);
              })
              .then(function (commanders) {
                console.log(
                  "[GW COOP AI] MLA commanders: " +
                    commanders.length +
                    " of " +
                    owned.length +
                    " owned"
                );
                ownedCommanders = commanders;
              });
          })
          .then(null, function (error) {
            console.error(
              "[GW COOP AI] commanders not checked: " +
                (error && (error.message || error))
            );
          })
          .then(function () {
            commandersReady(true);
          });

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
