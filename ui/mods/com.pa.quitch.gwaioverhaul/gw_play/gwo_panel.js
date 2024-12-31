var gwoWarInfoPanelLoaded;

function gwoWarInfoPanel() {
  const game = model.game();

  if (gwoWarInfoPanelLoaded || game.isTutorial()) {
    return;
  }

  gwoWarInfoPanelLoaded = true;

  try {
    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"],
      function (gwoColour) {
        const url =
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html";
        $.get(url, function (html) {
          const $fi = $(html);
          $("#header").append($fi);
          locTree($("#gwo-panel"));
          ko.applyBindings(model, $fi[0]);
        });

        // War Information
        const galaxy = game.galaxy();
        const originSystem = galaxy.stars()[galaxy.origin()].system();
        model.gwoVersion = ko.observable("5.76.0");
        model.gwoSettings = originSystem.gwaio;

        if (model.gwoSettings) {
          model.gwoDifficulty = loc(model.gwoSettings.difficulty);
          model.gwoSize = loc(model.gwoSettings.galaxySize);
          model.gwoAI = model.gwoSettings.ai || "Titans";
          model.gwoDeck =
            model.gwoSettings.techCardDeck === "Expanded"
              ? loc("!LOC:Galactic War Overhaul")
              : loc("!LOC:" + model.gwoSettings.techCardDeck) ||
                loc("!LOC:Galactic War Overhaul");

          const options = function (optionsList, setting, text) {
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
            "!LOC:Easy Systems"
          );
          options(
            model.gwoOptions,
            model.gwoSettings.easierStart,
            "!LOC:Easier start"
          );
          options(
            model.gwoOptions,
            model.gwoSettings.cheatsUsed,
            "!LOC:dev mode"
          );
          options(model.gwoOptions, game.hardcore(), "!LOC:Hardcore mode");
          // deprecated - pre-v5.27.0 support only
          options(
            model.gwoOptions,
            model.gwoSettings.tougherCommanders,
            "!LOC:Tougher commanders"
          );

          const cheatsDetected = function () {
            requireGW(
              ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
              function (gwoSave) {
                const game = model.game();
                const galaxy = game.galaxy();
                const originSystem = galaxy.stars()[galaxy.origin()].system();
                const gwoSettings = originSystem.gwaio;
                if (gwoSettings && !gwoSettings.cheatsUsed) {
                  gwoSettings.cheatsUsed = true;
                  options(
                    model.gwoOptions,
                    model.gwoSettings.cheatsUsed,
                    "!LOC:dev mode"
                  );
                  gwoSave(game, true);
                }
              }
            );
          };

          model.devMode.subscribe(function () {
            if (model.devMode() === true) {
              cheatsDetected();
            }
          });
        }

        model.gwoIncompatibleMods = ko.observableArray([]);

        api.mods.getMounted("client").then(function (mods) {
          const incompatibleMods = [
            "com.heiz.aurora_arty", // Aurora-Artillery
            "com.wondible.pa.gw_challenge", // Challenge Levels for galactic war
            "com.wondible.pa.gw_ramp", // Enemy Ramp for galactic war
            "nemuneko.gw.unique.loadouts", // Galactic War Unique Loadouts
            "com.pa.domdom.laser_unit_effects", // More Pew Pew
            "com.wondible.pa.section_of_foreign_intelligence", // Section of Foreign Intelligence for galactic war
            "com.pa.lulamae.air-scout-select", // Air Scout Select
            "com.pa.grandhomie.land_scout_combat_grouping_mod", // Land scout combat grouping
            "ca.pa.metapod.colonel_combat_grouping_mod", // Combat Colonel selection mod
            "com.pa.nemogielen.client.BetterCombatSelection", // Better Combat Selection
            "com.uberent.pa.PAFX", // PA-FX Titans
            "com.uberent.pa.PAFX.classic", // PA-FX Classic
            "com.pa.client.cirolog.boom", // Bigger Explosions
          ];
          const modIdentifiers = _.map(mods, "identifier");
          const incompatibleModsInUse = _.intersection(
            incompatibleMods,
            modIdentifiers
          );
          const incompatibleModNames = _.sortBy(
            _.map(incompatibleModsInUse, function (incompatibleMod) {
              const index = _.findIndex(mods, "identifier", incompatibleMod);
              return mods[index].display_name;
            })
          );
          model.gwoIncompatibleMods(incompatibleModNames);
        });

        // Player Information
        const inventory = game.inventory();

        const factions = [
          "Legonis Machina",
          "Foundation",
          "Synchronous",
          "Revenants",
          "Cluster",
        ];
        const factionIndex = inventory.getTag("global", "playerFaction");
        model.gwoFactionName = factions[factionIndex];

        const cards = inventory.cards();

        const loadoutId = cards[0].id;
        model.gwoLoadout = ko.observable("");
        requireGW(["cards/" + loadoutId], function (card) {
          model.gwoLoadout(loc(card.summarize()));
        });

        const intelligence = function (subcommander, index) {
          var personality = subcommander.character
            ? loc(subcommander.character)
            : loc("!LOC:None");
          if (subcommander.penchant) {
            personality = personality + " " + loc(subcommander.penchant);
          }
          // avoid modifying the original name to prevent duplication of addendum
          var subcommanderName = subcommander.name;
          if (
            _.some(cards, {
              id: "gwaio_upgrade_subcommander_duplication",
            })
          ) {
            subcommanderName += " x2";
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
          const commanders = [
            {
              name: ko.observable().extend({ session: "displayName" }),
              color: gwoColour.rgb(inventory.getTag("global", "playerColor")),
              character: loc("!LOC:Human"),
            },
          ];
          const subcommanders = inventory.minions();
          _.forEach(subcommanders, function (subcommander, index) {
            commanders.push(intelligence(subcommander, index));
          });
          return commanders;
        });
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}
gwoWarInfoPanel();
