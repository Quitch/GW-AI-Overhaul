// !LOCNS:live_game
(function () {
  var patch = function (model, handlers) {
    var activeGameId = ko.observable().extend({ local: "gw_active_game" });
    var hardcore = ko.observable();
    var tutorial = ko.observable(false);
    var abandonGame = function () {}; /* replaced after gw game has been loaded. */
    var saveGame = function () {}; /* replaced after gw game has been loaded. */
    var exitToPlay = "coui://ui/main/game/galactic_war/gw_play/gw_play.html";
    var exitDestination = ko.observable(exitToPlay);

    var deleteSavedGame = function () {};
    var winGame = function () {};
    var loseGame = function () {};

    var hasSavedGame = ko.observable(false);

    requireGW(["require", "shared/gw_common"], function (require, GW) {
      var gameLoader = GW.manifest.loadGame(activeGameId());
      gameLoader.then(function (game) {
        hardcore(game.hardcore());
        tutorial(game.isTutorial());
        hasSavedGame(!!game.replayName());
        abandonGame = function (doExit) {
          GW.manifest.removeGame(game).then(doExit);
        };

        saveGame = function (name, lobby_id) {
          game.replayName(lobby_id ? null : name);
          game.replayLobbyId(lobby_id);
          game.replayStar(game.currentStar());
          GW.manifest.saveGame(game);
          hasSavedGame(true);
        };

        deleteSavedGame = function () {
          /* the game is over, so clear out the replay */
          game.replayName(null);
          game.replayLobbyId(null);
          game.replayStar(null);
          hasSavedGame(false);
        };

        winGame = function () {
          // winner so delete saved game

          deleteSavedGame();
          game.lastBattleResult("win");
          return GW.manifest.saveGame(game);
        };

        loseGame = function () {
          // hardcore loser cannot resume saved games

          if (hardcore()) deleteSavedGame();

          game.lastBattleResult("loss");
          return GW.manifest.saveGame(game);
        };
      });
    });

    model.timedOut.subscribe(function () {
      if (model.timedOut()) exitDestination(exitToPlay);
    });

    var oldNavToMainMenu = model.navToMainMenu;
    model.navToMainMenu = function () {
      if (model.gameOver() || model.timedOut() || !hardcore())
        oldNavToMainMenu();
      else abandonGame(oldNavToMainMenu);
    };

    var menuExitToWar = function (settings) {
      var popup = model.gameOver() ? $.when(0) : model.popUp(settings);
      popup.then(function (result) {
        if (result === 0) model.navToMainMenu();
      });
    };
    model.menuAbandonWar = function () {
      menuExitToWar({
        message:
          "!LOC:Are you sure you want to abandon this Galactic War?[br](All progress and Tech will be lost.)",
      });
    };

    model.navToGalacticWar = function () {
      engine.call("pop_mouse_constraint_flag");
      engine.call("game.allowKeyboard", true);

      model.abandon().always(function () {
        model.userTriggeredDisconnect(true);
        model.disconnect();
        window.location.href = exitToPlay;
      });
    };

    model.menuReturnToWar = function () {
      model.navToGalacticWar();
    };

    var send_message = function (message, payload) {
      var m = {};
      if (!_.isUndefined(payload)) m.payload = payload;
      m.message_type = message;
      engine.call("conn_send_message", JSON.stringify(m));
    };

    model.menuSaveWar = function () {
      if (model.closeMenu) model.closeMenu();

      var popup = model.gameOver()
        ? $.when(0)
        : model.popUp({ message: "!LOC:Save game?" });
      popup.then(function (result) {
        if (result === 0) {
          var name = "GWSave" + activeGameId();
          var payload = { name: String(name), type: String("gw") };
          send_message("write_replay", payload);
          saveGame(name, model.lobbyId());
        }
      });
    };

    /* override default menuExit */
    model.menuExit = function () {
      if (model.closeMenu) model.closeMenu();

      var buttons = [
        hardcore() ? "!LOC:Abandon War" : "!LOC:Quit to Main Menu",
        "!LOC:Cancel",
      ];

      if (!hardcore()) buttons.splice(1, 0, "!LOC:Return to Galactic War");
      model
        .popUp({
          buttons: buttons,
          message: "!LOC:Quit Game",
        })
        .then(function (result) {
          if (hardcore()) result++;

          switch (result) {
            case 0:
              model.navToMainMenu();
              break;
            case 1:
              model.navToGalacticWar();
              break;
            case 2:
              /* do nothing */ break;
          }
        });
    };

    /* replacing observable from live_game.js */
    model.menuConfigGenerator(function () {
      var over_string = tutorial()
        ? "!LOC:Continue Tutorial"
        : "!LOC:Continue War";
      var exit_string = hardcore() ? "!LOC:Abandon War" : "!LOC:Surrender";

      var list = [
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
          label:
            model.gameOver() || model.defeated() ? over_string : exit_string,
          action:
            model.gameOver() || model.defeated()
              ? "menuReturnToWar"
              : hardcore()
              ? "menuAbandonWar"
              : "menuSurrender",
          game_over: over_string,
        },
        {
          label: "!LOC:Quit",
          action: "menuExit",
        },
      ];

      if (model.canSave())
        list.splice(6, 0, {
          label: "Save Game ",
          action: "menuSaveWar",
        });

      list = _.map(list, function (entry) {
        return {
          label: loc(entry.label),
          action: entry.action,
          game_over: entry.game_over && loc(entry.game_over),
        };
      });
      api.Panel.message("", "menu_config", list);

      return list;
    });

    // by design, don't show handicaps in GW
    handlers.economy_handicaps = function () {};

    var hookTransit = function () {
      model.transitSecondaryMessage("Returning to Galactic War");
      model.transitDestination(exitDestination());
    };
    handlers.sim_terminated = _.compose(hookTransit, handlers.sim_terminated);
    handlers.connection_disconnected = _.compose(
      hookTransit,
      handlers.connection_disconnected
    );

    var oldServerState = handlers.server_state;
    handlers.server_state = function (msg) {
      if (msg.data && msg.state && msg.state === "game_over") {
        var complete;
        if (msg.data.client) {
          if (msg.data.client.winner) complete = winGame();
          else if (msg.data.client.loser) complete = loseGame();
        }
        $.when(complete).then(function () {
          oldServerState(msg);
        });
      } else oldServerState(msg);
    };
  };

  var oldRegister = app.registerWithCoherent;
  app.registerWithCoherent = function (model, handlers) {
    patch(model, handlers);
    oldRegister.apply(this, arguments);
  };
})();
