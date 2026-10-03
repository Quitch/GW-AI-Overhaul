(function () {
  var gwoWarInfoPanelLoaded;

  function gwoWarInfoPanel(gwoSettings) {
    try {
      var deckName = function (deckName) {
        if (!deckName || deckName === "Expanded") {
          return loc("!LOC:Galactic War Overhaul");
        }

        return loc(deckName);
      };

      var game = model.game();
      model.gwoSettings = gwoSettings;
      model.gwoDifficulty = loc(model.gwoSettings.difficulty);
      model.gwoSize = loc(model.gwoSettings.galaxySize);
      // Refined per race in the requireGW callback below, before the panel's
      // markup is fetched and bound.
      model.gwoAI = model.gwoSettings.ai || "Titans";
      model.gwoAIAlly =
        model.gwoSettings.aiAlly || model.gwoSettings.ai || "Titans";
      model.gwoAICoop =
        model.gwoSettings.aiCoop || model.gwoSettings.ai || "Titans";
      model.gwoDeck = deckName(model.gwoSettings.techCardDeck);
      // Wars created before seeds were recorded have none.
      model.gwoSeed = model.gwoSettings.seed || loc("!LOC:Unknown");
      var playerCount = model.gwoSettings.coopPlayerScalingCount || 1;
      // i18n lookups are case sensitive, and these two casings have the widest
      // locale coverage. gwo_panel.html cases the word back down afterwards.
      var playerOrPlayers =
        playerCount > 1 ? loc("!LOC:Players") : loc("!LOC:PLAYER");
      model.gwoCoopPlayerScalingCount = playerCount;
      model.gwoCoopPlayerScalingUnit = playerOrPlayers;
      var lobbyTitle =
        "GWO Co-op - " + loc("!LOC:Difficulty:") + " " + model.gwoDifficulty;
      model.setDefaultGwCoopLobbyTitle(lobbyTitle);

      // Co-op AI players count as players here.
      ko.computed(function () {
        var playerScaling = gwoSettings.coopPlayerScalingCount;
        var players =
          model.gwCampaignConnectedClients().length + model.gwoCoopAi.count();
        if (
          // A latch - without it the save is rewritten on every join and leave.
          !gwoSettings.tooManyPlayers &&
          playerScaling &&
          players > playerScaling
        ) {
          gwoSettings.tooManyPlayers = true;
          requireGW(
            ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
            function (gwoSave) {
              gwoSave(game, true);
            }
          );
        }
      });

      // An unauthenticated Viewer has an empty uberId/displayName. Co-op records
      // are keyed by identity, so every lookup for them silently no-ops. The base
      // game shares this, so say so rather than let it read as a GWO bug.
      var gwoViewerIdentityWarned;

      var warnIfViewerIdentityMissing = function () {
        if (gwoViewerIdentityWarned) {
          return;
        }
        if (!model.isCampaignViewer()) {
          return;
        }

        // Present but empty is the case being reported - see the comment above.
        if (model.uberId() && model.displayName()) {
          return;
        }

        gwoViewerIdentityWarned = true;
        console.error(
          "[GW COOP] Viewer identity is missing (uberId/displayName empty) - this " +
            "PA profile has not been loaded by an authenticated user. Co-op tech " +
            "inventory, card offers, and subcommander deals will not work for this " +
            "Viewer until it runs under an authenticated login."
        );
      };

      warnIfViewerIdentityMissing();
      model.gwCampaignConnected.subscribe(warnIfViewerIdentityMissing);

      var options = function (optionsList, setting, text) {
        if (setting) {
          optionsList.push(loc(text));
        }
      };

      model.gwoOptions = ko.observableArray([]);

      var cheatsDetected = function () {
        if (!model.devMode()) {
          return;
        }
        if (model.isCampaignViewer()) {
          return;
        }

        requireGW(
          ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
          function (gwoSave) {
            var gwoSettings = model.gwoSettings;
            if (!gwoSettings.cheatsUsed) {
              gwoSettings.cheatsUsed = true;
              options(
                model.gwoOptions,
                model.gwoSettings.cheatsUsed,
                "!LOC:dev mode"
              );
              gwoSave(game, true);
            }
          }
        );
      };

      cheatsDetected();
      model.devMode.subscribe(cheatsDetected);

      // The co-op settings a battle's bug report cannot read from the save.
      var bugReportWar = ko
        .observable()
        .extend({ session: "gwo_bug_report_war" });
      ko.computed(function () {
        bugReportWar({
          gameId: String(game.id),
          playersNow:
            model.gwCampaignConnectedClients().length + model.gwoCoopAi.count(),
          coopAiCount: model.gwoCoopAi.count(),
          maxClients: model.gwCampaignMaxClients(),
          slotsLocked: model.gwCampaignMaxClientsLocked(),
        });
      });

      requireGW(
        [
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel_view.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/decks.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deck_mods.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bug_report.js",
          "shared/gw_factions",
        ],
        function (
          gwoPanelView,
          gwoRaces,
          gwoVersion,
          gwoDecks,
          gwoDeckMods,
          gwoBugReport,
          GWFactions
        ) {
          model.gwoVersion = ko.observable(gwoVersion);

          // Replaced, not pushed: cheatsDetected may already have added dev
          // mode, and the table then holds it too.
          model.gwoOptions(
            _.map(
              gwoBugReport.optionKeys(model.gwoSettings, game.hardcore()),
              function (key) {
                return loc(key);
              }
            )
          );

          // A third-party deck's display name; the provisional deckName()
          // assignment above already covers the built-ins. Bindings only
          // apply later in this callback, so the refinement is seen.
          gwoDeckMods.registerAll();
          var warDeckId = model.gwoSettings.techCardDeck;
          var warDeckName = gwoPanelView.registeredDeckName(
            gwoDecks.byId(warDeckId),
            warDeckId,
            { expanded: deckName("Expanded"), missing: loc("!LOC:missing:") }
          );
          if (!_.isUndefined(warDeckName)) {
            model.gwoDeck = warDeckName;
          }

          var brainSummary = gwoPanelView.brainSummaryFor(gwoSettings);
          model.gwoAI = brainSummary("enemy");
          model.gwoAIAlly = brainSummary("ally");
          // Under shared tech every co-op AI player fields the host's race.
          model.gwoAICoop = brainSummary("coop", [
            gwoRaces.raceOf(model.game().inventory()),
          ]);

          var coopText = function (setting) {
            if (setting) {
              return loc("!LOC:Shared");
            }
            return loc("!LOC:Separate");
          };

          model.gwoCoopArmyControl = ko.computed(function () {
            return coopText(model.gwCampaignSharedControl());
          });
          // Computed, because stock writes both settings later, from server data.
          model.gwoCoopTechControl = ko.pureComputed(function () {
            return coopText(!model.gwCampaignPerPlayerTechCards());
          });
          // LOCKED, not Locked: case-sensitive i18n, and that casing reaches four
          // more locales. Unlocked has no entry under any casing.
          model.gwoCoopLockedSlots = ko.pureComputed(function () {
            return model.gwCampaignMaxClientsLocked()
              ? loc("!LOC:LOCKED")
              : loc("!LOC:Unlocked");
          });

          model.gwoIncompatibleMods = ko.observableArray([]);
          api.mods.getMounted("client").then(function (mods) {
            model.gwoIncompatibleMods(gwoPanelView.incompatibleModNames(mods));
          });

          var inventory = game.inventory();

          var factionIndex = inventory.getTag("global", "playerFaction");
          var playerRace = gwoRaces.raceOf(inventory);
          model.gwoFactionName = _.pluck(GWFactions, "name")[factionIndex];
          var commanderList = gwoPanelView.commanderList({
            game: game,
            inventory: inventory,
            factionIndex: factionIndex,
            playerRace: playerRace,
          });
          var cards = inventory.cards();
          var loadoutId = cards[0].id;
          model.gwoLoadout = ko.observable("");
          requireGW(["cards/" + loadoutId], function (card) {
            model.gwoLoadout(gwoPanelView.cardName(card, loadoutId));
          });

          model.gwoPlayer = ko.computed(function () {
            return commanderList(loc("!LOC:Human"));
          });

          var bugReportInput = function (gwoBugReportInput) {
            var warDeck = gwoDecks.byId(warDeckId);
            var playerRaceDescriptor = gwoRaces.byId(playerRace);
            return gwoBugReportInput.gather(
              {
                settings: model.gwoSettings,
                hardcore: game.hardcore(),
                warName: game.name(),
                deckName: warDeck && warDeck.name,
                factionName: _.pluck(GWFactions, "name")[factionIndex],
                raceName: playerRaceDescriptor
                  ? playerRaceDescriptor.name
                  : playerRace,
                commander: inventory.getTag("global", "commander"),
                loadout: loadoutId,
                coop: {
                  role: model.gwCampaignRole(),
                  playersNow:
                    model.gwCampaignConnectedClients().length +
                    model.gwoCoopAi.count(),
                  coopAiCount: model.gwoCoopAi.count(),
                  createdFor: model.gwoSettings.coopPlayerScalingCount,
                  sharedArmies: model.gwCampaignSharedControl(),
                  perPlayerTech: model.gwCampaignPerPlayerTechCards(),
                  maxClients: model.gwCampaignMaxClients(),
                  slotsLocked: model.gwCampaignMaxClientsLocked(),
                },
              },
              model.isCampaignViewer()
            );
          };

          model.gwoBugReportInput = function () {
            var done = $.Deferred();
            requireGW(
              [
                "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bug_report_input.js",
              ],
              function (gwoBugReportInput) {
                bugReportInput(gwoBugReportInput).then(done.resolve);
              }
            );
            return done.promise();
          };
          var logLoaded = function () {
            if (_.isFunction(model.gwoLogBugReport)) {
              model.gwoLogBugReport("galaxy map loaded");
            }
          };
          // Players, slots and co-op settings arrive with the first server
          // state, which stock applies in the same call that connects. A
          // connection that never comes still gets its entry.
          var role = model.gwCampaignRole();
          if (
            (role === "host" || role === "viewer") &&
            !model.gwCampaignConnected()
          ) {
            var logged = false;
            var connected;
            var logOnce = function () {
              if (logged) {
                return;
              }
              logged = true;
              connected.dispose();
              _.defer(logLoaded);
            };
            connected = model.gwCampaignConnected.subscribe(logOnce);
            _.delay(logOnce, 10000);
          } else {
            logLoaded();
          }

          var url =
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html";
          $.get(url, function (html) {
            var $fi = $(html);
            $("#header").append($fi);
            locTree($("#gwo-panel"));
            ko.applyBindings(model, $fi[0]);
          });
        }
      );
    } catch (e) {
      console.error(
        "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
      );
    }
  }

  try {
    var gwoPanelLoaderInitialized = false;
    var gwoPanelLoaderNeedsDispose = false;
    var gwoPanelLoadWarned = false;

    // The computed below can dispose itself on its first evaluation, which runs
    // before gwoPanelLoader is assigned. Defer to the flag in that case.
    var disposeGwoPanelLoader = function () {
      if (gwoPanelLoaderInitialized) {
        gwoPanelLoader.dispose();
      } else {
        gwoPanelLoaderNeedsDispose = true;
      }
    };

    var gwoPanelLoader = ko.computed(function () {
      var game = model.game();
      var galaxy = game.galaxy();

      if (gwoWarInfoPanelLoaded || game.isTutorial()) {
        disposeGwoPanelLoader();
        return;
      }

      var originSystem = galaxy.stars()[galaxy.origin()].system();
      if (_.isPlainObject(originSystem.gwaio)) {
        console.log("GWO settings found and panel loading");
        gwoWarInfoPanel(originSystem.gwaio);
        gwoWarInfoPanelLoaded = true;
        disposeGwoPanelLoader();
        return;
      }

      // The galaxy may still be loading, so stay subscribed - but a non-GWO war
      // never resolves, so warn once rather than on every galaxy change.
      if (!gwoPanelLoadWarned) {
        gwoPanelLoadWarned = true;
        console.warn(
          "No GWO settings on the origin system yet; the war information panel will load if they appear."
        );
      }
    });

    gwoPanelLoaderInitialized = true;
    if (gwoPanelLoaderNeedsDispose) {
      gwoPanelLoader.dispose();
    }
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
