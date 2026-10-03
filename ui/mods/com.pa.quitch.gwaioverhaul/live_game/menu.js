(function () {
  if (model.gameType() !== "Galactic War") {
    return;
  }

  try {
    var getMenuString = function (condition, stringIfTrue, stringIfFalse) {
      return condition ? stringIfTrue : stringIfFalse;
    };

    model.gwoMenuReportBug = function () {
      model.closeMenu();
      model.gwoReportBug();
    };
    $(".div_game_menu").addClass("gwo-game-menu");

    var session = function (name) {
      return ko.observable().extend({ session: name })();
    };

    // game.inventory() is the host's. A per-player viewer's own record is
    // found the way gw_war_over/stats.js finds it; without one, the report
    // leaves the cards out.
    var ownInventory = function (game, perPlayerTech) {
      if (model.gwCampaignRole() !== "viewer" || !perPlayerTech) {
        return game.inventory();
      }
      return _.get(
        game.findCoopPlayerInventoryData({
          id: session("uberId"),
          name: session("displayName"),
        }),
        "inventory"
      );
    };

    var bugReportInput = function (
      game,
      gwoAI,
      gwoRaces,
      GWFactions,
      gwoBugReport
    ) {
      var gwoSettings = gwoAI.originSettings(game);
      var authoritativeGameId = window.sessionStorage.getItem(
        "gw_campaign_authoritative_game_id"
      );
      var role = model.gwCampaignRole();
      var gameOptions = model.gwoGameOptions();
      // From the battle's game options, which also arrive after a reconnect,
      // when the co-op session state from gw_play is gone.
      var campaignSettings = _.get(gameOptions, "gw_campaign_settings", {});
      var war = session("gwo_bug_report_war");
      var handoff = war && war.gameId === String(game.id) ? war : {};
      var inventory = game.inventory();
      var star = game.galaxy().stars()[game.currentStar()];
      var enemy = star.ai();
      var playerRace = gwoRaces.raceOf(inventory);
      var race = gwoRaces.byId(playerRace);
      var own = gwoBugReport.inventoryInput(
        ownInventory(game, campaignSettings.per_player_tech_cards)
      );

      return {
        stale: role === "viewer" && String(game.id) !== authoritativeGameId,
        settings: gwoSettings,
        hardcore: game.hardcore(),
        warName: game.name(),
        factionName: _.pluck(GWFactions, "name")[
          inventory.getTag("global", "playerFaction")
        ],
        raceName: race ? race.name : playerRace,
        cards: own.cards,
        commander: own.commander,
        loadout: own.loadout,
        battle: {
          system: star.system().name,
          enemy: enemy && enemy.name,
          gameOptions: gameOptions,
        },
        coop: {
          role: role,
          playersNow: handoff.playersNow,
          coopAiCount: handoff.coopAiCount,
          createdFor: gwoSettings && gwoSettings.coopPlayerScalingCount,
          sharedArmies: campaignSettings.shared_control,
          perPlayerTech: campaignSettings.per_player_tech_cards,
          maxClients: handoff.maxClients,
          slotsLocked: handoff.slotsLocked,
        },
      };
    };

    requireGW(["shared/gw_common"], function (GW) {
      var activeGameId = ko.observable().extend({ local: "gw_active_game" });
      var hardcore = ko.observable();
      var tutorial = ko.observable(false);

      var gameLoader = GW.manifest.loadGame(activeGameId());
      gameLoader.then(function (game) {
        hardcore(game.hardcore());
        tutorial(game.isTutorial());

        model.gwoBugReportInput = function () {
          var done = $.Deferred();
          requireGW(
            [
              "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bug_report_input.js",
              "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
              "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
              "shared/gw_factions",
              "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bug_report.js",
            ],
            function (
              gwoBugReportInput,
              gwoAI,
              gwoRaces,
              GWFactions,
              gwoBugReport
            ) {
              gwoBugReportInput
                .gather(
                  bugReportInput(
                    game,
                    gwoAI,
                    gwoRaces,
                    GWFactions,
                    gwoBugReport
                  ),
                  model.gwCampaignRole() === "viewer"
                )
                .then(done.resolve);
            }
          );
          return done.promise();
        };
        var logLoaded = function () {
          if (_.isFunction(model.gwoLogBugReport)) {
            model.gwoLogBugReport("battle loaded");
          }
        };
        // The win conditions and co-op settings come with the server state.
        if (model.gwoGameOptions()) {
          logLoaded();
        } else {
          var arrived = model.gwoGameOptions.subscribe(function (options) {
            if (options) {
              arrived.dispose();
              logLoaded();
            }
          });
        }
      });

      // Write into the existing observable, never replace it: live_game.js's
      // menuConfig computed subscribed to the original.
      model.menuConfigGenerator(function () {
        var overString = getMenuString(
          tutorial(),
          "!LOC:Continue Tutorial",
          "!LOC:Continue War"
        );
        var exitString = getMenuString(
          hardcore(),
          "!LOC:Abandon War",
          "!LOC:Surrender"
        );

        var getMenuAction = function (lost) {
          if (lost) {
            return "menuReturnToWar";
          }
          return getMenuString(hardcore(), "menuAbandonWar", "menuSurrender");
        };

        var playerLost = model.gameOver() || model.isSpectator();

        var menu = _.compact([
          {
            label: "!LOC:Pause Game",
            action: "menuPauseGame",
          },
          {
            label: "!LOC:Game Stats",
            action: "toggleGamestatsPanel",
          },
          {
            label: "!LOC:Player Guide",
            action: "menuTogglePlayerGuide",
          },
          {
            label: "!LOC:Chrono Cam",
            action: "menuToggleChronoCam",
          },
          {
            label: "!LOC:POV Camera",
            action: "menuTogglePOV",
          },
          {
            label: "!LOC:Game Settings",
            action: "menuSettings",
          },
          {
            label: "!LOC:Report a Galactic War Bug",
            action: "gwoMenuReportBug",
          },
          model.canSave() && {
            label: "!LOC:Save Game",
            action: "menuSaveWar",
          },
          {
            // patch Surrender and Continue War buttons to handle more than two teams
            label: getMenuString(playerLost, overString, exitString),
            action: getMenuAction(playerLost),
            game_over: overString,
          },
          {
            label: "!LOC:Quit",
            action: "menuExit",
          },
        ]);

        var translatedMenu = _.map(menu, function (entry) {
          return {
            label: loc(entry.label),
            action: entry.action,
            game_over: loc(entry.game_over),
          };
        });
        api.Panel.message("", "menu_config", translatedMenu);

        return translatedMenu;
      });
    });
  } catch (e) {
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
})();
