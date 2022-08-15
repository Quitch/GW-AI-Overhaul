var gwoWarInfoPanelLoaded;

if (!gwoWarInfoPanelLoaded) {
  gwoWarInfoPanelLoaded = true;

  function gwoWarInfoPanel() {
    try {
      var game = model.game();

      if (!game.isTutorial()) {
        requireGW(
          [
            "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
          ],
          function (gwoColour) {
            var url =
              "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html";
            $.get(url, function (html) {
              var $fi = $(html);
              $("#header").append($fi);
              locTree($("#gwo-panel"));
              ko.applyBindings(model, $fi[0]);
            });

            // War Information
            var galaxy = game.galaxy();
            var originSystem = galaxy.stars()[galaxy.origin()].system();
            model.gwoSettings = originSystem.gwaio;

            if (model.gwoSettings) {
              model.gwoDifficulty = loc(model.gwoSettings.difficulty);
              model.gwoSize = loc(model.gwoSettings.galaxySize);
              model.gwoAI = model.gwoSettings.ai || "Titans";
              model.gwoDeck =
                loc("!LOC:" + model.gwoSettings.techCardDeck) ||
                "!LOC:Expanded";

              var options = function (optionsList, setting, text) {
                if (setting) {
                  optionsList.push(loc(text));
                }
              };

              model.gwoOptions = ko.observableArray([]);
              options(
                model.gwoOptions,
                model.gwoSettings.factionScaling,
                "!LOC:Faction scaling"
              );
              options(
                model.gwoOptions,
                model.gwoSettings.systemScaling,
                "!LOC:System scaling"
              );
              options(
                model.gwoOptions,
                model.gwoSettings.simpleSystems,
                "!LOC:Simple systems"
              );
              options(
                model.gwoOptions,
                model.gwoSettings.easierStart,
                "!LOC:Easier start"
              );
              options(
                model.gwoOptions,
                model.gwoSettings.tougherCommanders,
                "!LOC:Tougher commanders"
              );
              options(model.gwoOptions, game.hardcore(), "!LOC:Hardcore mode");
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

            var intelligence = function (subcommander, index) {
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
                color: gwoColour.rgb(
                  gwoColour.pick(
                    factionIndex,
                    subcommander.color,
                    index + 1 // player uses the primary faction colour
                  )
                ),
                character: personality,
              };
            };

            model.gwoPlayer = ko.computed(function () {
              var playerName = ko
                .observable()
                .extend({ session: "displayName" });
              var playerColor = gwoColour.rgb(
                inventory.getTag("global", "playerColor")
              );

              var commanders = [
                {
                  name: playerName,
                  color: playerColor,
                  character: loc("!LOC:Human"),
                },
              ];

              var subcommanders = inventory.minions();
              _.forEach(subcommanders, function (subcommander, index) {
                commanders.push(intelligence(subcommander, index));
              });
              return commanders;
            });
          }
        );
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoWarInfoPanel();
}
