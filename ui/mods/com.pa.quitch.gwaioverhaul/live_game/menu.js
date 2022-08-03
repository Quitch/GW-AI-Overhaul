var gwoMenuLoaded;

if (!gwoMenuLoaded) {
  gwoMenuLoaded = true;

  function gwoMenu() {
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

          var getMenuString = function (boolean, stringIfTrue, stringIfFalse) {
            return boolean ? stringIfTrue : stringIfFalse;
          };

          model.menuConfigGenerator = ko.observable(function () {
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

            var getMenuAction = function (boolean) {
              if (boolean) {
                return "menuReturnToWar";
              }
              return getMenuString(
                hardcore(),
                "menuAbandonWar",
                "menuSurrender"
              );
            };

            var playerLost = false;
            if (model.gameOver() || model.defeated()) {
              playerLost = true;
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
                label: getMenuString(playerLost, overString, exitString),
                action: getMenuAction(playerLost),
                game_over: overString,
              },
              {
                label: "!LOC:Quit",
                action: "menuExit",
              },
            ];

            if (model.canSave()) {
              list.splice(6, 0, {
                label: "Save Game ",
                action: "menuSaveWar",
              });
            }

            list = _.map(list, function (entry) {
              return {
                label: loc(entry.label),
                action: entry.action,
                game_over: loc(entry.game_over),
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
  gwoMenu();
}
