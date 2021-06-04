var gwaioWarInfoPanelLoaded;

if (!gwaioWarInfoPanelLoaded) {
  gwaioWarInfoPanelLoaded = true;

  function gwaioWarInfoPanel() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
        // War Information
        var originSystem = game
          .galaxy()
          .stars()
          [game.galaxy().origin()].system();

        model.gwaioSettings = originSystem.gwaio;

        if (model.gwaioSettings) {
          model.gwaioDifficulty = loc(model.gwaioSettings.difficulty);
          model.gwaioSize = loc(model.gwaioSettings.galaxySize);

          if (model.gwaioSettings.ai) {
            model.gwaioAI = model.gwaioSettings.ai;
          } else model.gwaioAI = "Titans";

          model.gwaioOptions = ko.observableArray([]);

          if (model.gwaioSettings.factionScaling) {
            model.gwaioOptions.push(loc("!LOC:Faction scaling"));
          }
          if (model.gwaioSettings.systemScaling) {
            model.gwaioOptions.push(loc("!LOC:System scaling"));
          }
          if (model.gwaioSettings.easierStart) {
            model.gwaioOptions.push(loc("!LOC:Easier start"));
          }
          if (model.gwaioSettings.tougherCommanders) {
            model.gwaioOptions.push(loc("!LOC:Tougher commanders"));
          }
          if (game.hardcore()) {
            model.gwaioOptions.push(loc("!LOC:Hardcore mode"));
          }
        }

        // Player Information
        var factions = [
          "Legonis Machina",
          "Foundation",
          "Synchronous",
          "Revenants",
          "Cluster",
        ];
        var factionIndex = game.inventory().getTag("global", "playerFaction");
        model.gwaioFactionName = factions[factionIndex];

        var loadoutId = game.inventory().cards()[0].id;
        model.gwaioLoadout = ko.observable("");
        requireGW(["cards/" + loadoutId], function (card) {
          model.gwaioLoadout(loc(card.summarize()));
        });

        var rgb = function (color) {
          return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
        };
        var intelligence = function (subcommander) {
          return {
            name: subcommander.name,
            color: rgb(
              (subcommander.color && subcommander.color[0]) || [255, 255, 255]
            ),
            character: loc(subcommander.character),
          };
        };
        model.gwaioPlayer = ko.computed(function () {
          var inventory = game.inventory();
          var playerName = ko.observable().extend({ session: "displayName" });
          var playerColor = rgb(inventory.getTag("global", "playerColor")[0]);

          var commanders = [
            {
              name: playerName,
              color: playerColor,
              character: loc("!LOC:Human"),
            },
          ];

          var subcommanders = inventory.minions();
          if (subcommanders.length > 0) {
            // eslint-disable-next-line lodash/prefer-map
            _.forEach(subcommanders, function (subcommander) {
              commanders.push(intelligence(subcommander));
            });
          }
          return commanders;
        });

        $("#header").append(
          loadHtml(
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html"
          )
        );
        locTree($("#gwo-panel"));
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioWarInfoPanel();
}
