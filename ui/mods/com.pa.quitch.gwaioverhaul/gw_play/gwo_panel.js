var gwoWarInfoPanelLoaded;

if (!gwoWarInfoPanelLoaded) {
  gwoWarInfoPanelLoaded = true;

  function gwoWarInfoPanel() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
        // War Information
        var galaxy = game.galaxy();
        var originSystem = galaxy.stars()[galaxy.origin()].system();
        model.gwoSettings = originSystem.gwaio;

        if (model.gwoSettings) {
          model.gwoDifficulty = loc(model.gwoSettings.difficulty);
          model.gwoSize = loc(model.gwoSettings.galaxySize);

          if (model.gwoSettings.ai) {
            model.gwoAI = model.gwoSettings.ai;
          } else {
            model.gwoAI = "Titans";
          }

          model.gwoOptions = ko.observableArray([]);

          if (model.gwoSettings.factionScaling) {
            model.gwoOptions.push(loc("!LOC:Faction scaling"));
          }
          if (model.gwoSettings.systemScaling) {
            model.gwoOptions.push(loc("!LOC:System scaling"));
          }
          if (model.gwoSettings.easierStart) {
            model.gwoOptions.push(loc("!LOC:Easier start"));
          }
          // No longer used - for v5.26.1 and earlier saves only
          if (model.gwoSettings.tougherCommanders) {
            model.gwoOptions.push(loc("!LOC:Tougher commanders"));
          }
          if (game.hardcore()) {
            model.gwoOptions.push(loc("!LOC:Hardcore mode"));
          }
        }

        // Player Information
        var inventory = game.inventory();

        var factions = [
          "Legonis Machina",
          "Foundation",
          "Synchronous",
          "Revenants",
          "Cluster",
        ];
        var factionIndex = inventory.getTag("global", "playerFaction");
        model.gwoFactionName = factions[factionIndex];

        var cards = inventory.cards();

        var loadoutId = cards[0].id;
        model.gwoLoadout = ko.observable("");
        requireGW(["cards/" + loadoutId], function (card) {
          model.gwoLoadout(loc(card.summarize()));
        });

        var rgb = function (color) {
          return "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")";
        };

        var intelligence = function (subcommander) {
          var personality = subcommander.character
            ? loc(subcommander.character)
            : loc("!LOC:None");
          if (subcommander.penchant) {
            personality = personality + " " + loc(subcommander.penchant);
          }
          var subcommanderName = subcommander.name;
          if (
            _.some(cards, {
              id: "gwaio_upgrade_subcommander_duplication",
            })
          ) {
            subcommanderName = subcommanderName.concat(" x2");
          }
          return {
            name: subcommanderName,
            color: rgb(
              (subcommander.color && subcommander.color[0]) || [255, 255, 255]
            ),
            character: personality,
          };
        };

        model.gwoPlayer = ko.computed(function () {
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
          // eslint-disable-next-line lodash/prefer-map
          _.forEach(subcommanders, function (subcommander) {
            commanders.push(intelligence(subcommander));
          });
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
  gwoWarInfoPanel();
}
