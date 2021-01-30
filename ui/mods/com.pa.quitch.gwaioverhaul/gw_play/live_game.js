var gwaioLiveGameLoaded;

if (!gwaioLiveGameLoaded) {
  gwaioLiveGameLoaded = true;

  function gwaioLiveGame() {
    try {
      var patch = function (model) {
        var activeGameId = ko.observable().extend({ local: "gw_active_game" });
        var hardcore = ko.observable();
        var tutorial = ko.observable(false);

        requireGW(["require", "shared/gw_common"], function (require, GW) {
          var gameLoader = GW.manifest.loadGame(activeGameId());
          gameLoader.then(function (game) {
            hardcore(game.hardcore());
            tutorial(game.isTutorial());
          });
        });

        // patch Surrender and Continue War buttons for multi-faction battles
        model.menuConfigGenerator = ko.observable(function () {
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
                model.gameOver() || model.defeated()
                  ? over_string
                  : exit_string,
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
      };

      var oldRegister = app.registerWithCoherent;
      app.registerWithCoherent = function (model) {
        patch(model);
        oldRegister.apply(this, arguments);
      };
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioLiveGame();
}
