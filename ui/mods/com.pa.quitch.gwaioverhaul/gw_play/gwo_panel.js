var gwaioWarInfoPanelLoaded;

if (!gwaioWarInfoPanelLoaded) {
  gwaioWarInfoPanelLoaded = true;

  function gwaioWarInfoPanel() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
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
          console.debug(subcommander);
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
            { name: playerName, color: playerColor, character: loc("Human") },
          ];

          var minions = inventory.minions();
          console.debug(minions);
          if (minions.length > 0) {
            // eslint-disable-next-line lodash/prefer-map
            _.forEach(minions, function (subcommander) {
              commanders.push(intelligence(subcommander));
            });
          }
          return commanders;
        });

        var originSystem = game
          .galaxy()
          .stars()
          [game.galaxy().origin()].system();

        if (originSystem.gwaio) {
          model.gwaioVersion = originSystem.gwaio.version;
          model.gwaioDifficulty = loc(originSystem.gwaio.difficulty);
          model.gwaioSize = loc(originSystem.gwaio.galaxySize);

          if (originSystem.gwaio.factionScaling === true)
            model.gwaioFactionScaling = loc("!LOC:Enabled");
          else model.gwaioFactionScaling = loc("!LOC:Disabled");

          if (originSystem.gwaio.systemScaling === false) {
            model.gwaioSystemScaling = loc("!LOC:Disabled");
          } else {
            model.gwaioSystemScaling = loc("!LOC:Enabled");
          }

          if (originSystem.gwaio.easierStart === true)
            model.gwaioEasierStart = loc("!LOC:Enabled");
          else model.gwaioEasierStart = loc("!LOC:Disabled");

          if (originSystem.gwaio.tougherCommanders === true) {
            model.gwaioTougherCommanders = loc("!LOC:Enabled");
          } else {
            model.gwaioTougherCommanders = loc("!LOC:Disabled");
          }
        } else {
          model.gwaioVersion = loc("!LOC:Unknown");
          model.gwaioDifficulty = loc("!LOC:Unknown");
          model.gwaioSize = game.galaxy().stars().length;
          model.gwaioFactionScaling = loc("!LOC:Unknown");
          model.gwaioSystemScaling = loc("!LOC:Enabled");
          model.gwaioEasierStart = loc("!LOC:Unknown");
          model.gwaioTougherCommanders = loc("!LOC:Unknown");
        }

        if (originSystem.gwaio && originSystem.gwaio.ai) {
          model.gwaioAI = originSystem.gwaio.ai;
        } else model.gwaioAI = "Titans";

        if (game.hardcore() === true) model.gwaioHardcore = loc("!LOC:Enabled");
        else model.gwaioHardcore = loc("!LOC:Disabled");

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
