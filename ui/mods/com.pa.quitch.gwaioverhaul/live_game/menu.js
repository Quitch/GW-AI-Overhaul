var gwaioMenuLoaded;

if (!gwaioMenuLoaded) {
  gwaioMenuLoaded = true;

  function gwaioMenu() {
    try {
      if (model.gameType() === "Galactic War") {
        requireGW(["shared/gw_common"], function (GW) {
          var activeGameId = ko
            .observable()
            .extend({ local: "gw_active_game" });
          var hardcore = ko.observable();
          var tutorial = ko.observable(false);

          var gameLoader = GW.manifest.loadGame(activeGameId());
          gameLoader.then(function (game) {
            hardcore(game.hardcore());
            tutorial(game.isTutorial());
          });

          model.menuConfigGenerator = ko.observable(function () {
            var over_string = tutorial()
              ? "!LOC:Continue Tutorial"
              : "!LOC:Continue War";
            var exit_string = hardcore()
              ? "!LOC:Abandon War"
              : "!LOC:Surrender";

            function getMenuAction() {
              if (model.gameOver() || model.defeated())
                return "menuReturnToWar";
              return hardcore() ? "menuAbandonWar" : "menuSurrender";
            }

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
                // patch Surrender and Continue War buttons to handle more than two teams
                label:
                  model.gameOver() || model.defeated()
                    ? over_string
                    : exit_string,
                action: getMenuAction(),
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
        });
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioMenu();
}
