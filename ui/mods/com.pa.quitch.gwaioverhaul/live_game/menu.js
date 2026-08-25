var gwoLiveGameMenuLoaded;

function gwoLiveGameMenu() {
  if (gwoLiveGameMenuLoaded || model.gameType() !== "Galactic War") {
    return;
  }

  gwoLiveGameMenuLoaded = true;

  try {
    const getMenuString = (boolean, stringIfTrue, stringIfFalse) =>
      boolean ? stringIfTrue : stringIfFalse;

    requireGW(["shared/gw_common"], (GW) => {
      const activeGameId = ko.observable().extend({ local: "gw_active_game" });
      const hardcore = ko.observable();
      const tutorial = ko.observable(false);

      const gameLoader = GW.manifest.loadGame(activeGameId());
      gameLoader.then((game) => {
        hardcore(game.hardcore());
        tutorial(game.isTutorial());
      });

      // Write into the existing observable, never replace it: live_game.js's
      // menuConfig computed subscribed to the original.
      model.menuConfigGenerator(() => {
        const overString = getMenuString(
          tutorial(),
          "!LOC:Continue Tutorial",
          "!LOC:Continue War",
        );
        const exitString = getMenuString(
          hardcore(),
          "!LOC:Abandon War",
          "!LOC:Surrender",
        );

        const getMenuAction = (boolean) => {
          if (boolean) {
            return "menuReturnToWar";
          }
          return getMenuString(hardcore(), "menuAbandonWar", "menuSurrender");
        };

        const playerLost = model.gameOver() || model.defeated();

        const menu = [
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
          menu.splice(6, 0, {
            label: "!LOC:Save Game",
            action: "menuSaveWar",
          });
        }

        const translatedMenu = _.map(menu, (entry) => ({
          label: loc(entry.label),
          action: entry.action,
          game_over: loc(entry.game_over),
        }));
        api.Panel.message("", "menu_config", translatedMenu);

        return translatedMenu;
      });
    });
  } catch (e) {
    console.error(`Galactic War Overhaul (GWO): ${e.stack || e.message || e}`);
  }
}
gwoLiveGameMenu();
