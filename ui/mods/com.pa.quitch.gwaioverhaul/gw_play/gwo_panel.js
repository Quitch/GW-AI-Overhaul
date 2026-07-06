var gwoWarInfoPanelLoaded;

function gwoWarInfoPanel(gwoSettings) {
  try {
    const game = model.game();
    model.gwoSettings = gwoSettings;
    model.gwoDifficulty = loc(model.gwoSettings.difficulty);
    model.gwoSize = loc(model.gwoSettings.galaxySize);
    model.gwoAI = model.gwoSettings.ai || "Titans";
    model.gwoAIAlly =
      model.gwoSettings.aiAlly || model.gwoSettings.ai || "Titans";
    model.gwoDeck =
      model.gwoSettings.techCardDeck === "Expanded"
        ? loc("!LOC:Galactic War Overhaul")
        : loc("!LOC:" + model.gwoSettings.techCardDeck) ||
          loc("!LOC:Galactic War Overhaul");
    const coopPlayerScalingCount =
      model.gwoSettings && model.gwoSettings.coopPlayerScalingCount;
    const playerCount = coopPlayerScalingCount || 1;
    const playerOrPlayers =
      playerCount > 1 ? loc("!LOC:Players") : loc("!LOC:Player");
    model.gwoCoopPlayerScaling = playerCount
      ? playerCount + " " + playerOrPlayers
      : loc("!LOC:Unknown");

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
    options(model.gwoOptions, model.gwoSettings.staticTech, "!LOC:Static tech");
    options(model.gwoOptions, model.gwoSettings.cheatsUsed, "!LOC:dev mode");
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
          const gwoSettings = model.gwoSettings;
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

    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"],
      function (gwoColour) {
        /* War Information */
        model.gwoVersion = ko.observable("5.90.0");

        /* Co-op Information */
        const coopText = function (setting) {
          if (setting) {
            return loc("!LOC:Shared");
          }
          return loc("!LOC:Separate");
        };

        model.gwoCoopArmyControl = ko.computed(function () {
          return coopText(model.gwCampaignSharedControl());
        });
        model.gwoCoopTechControl = coopText(
          !model.gwCampaignPerPlayerTechCards()
        );
        model.gwoCoopLockedSlots = model.gwCampaignMaxClientsLocked()
          ? loc("!LOC:Locked")
          : loc("!LOC:Unlocked");

        /* Incompatible Mods */
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
            "ca.pa.metapod.effectsandstuffNikVersion", // Nik's 'How is this even legal?!' Mod Pack
            "com.wondible.pa.gw_classic_systems", // Classic Systems for galactic war
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

        /* Player Information */
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

        var coopCampaign = !!model.gwCampaignActive();
        model.gwCampaignActive.subscribe(function (active) {
          coopCampaign = !!active;
        });

        model.gwoPlayer = ko.computed(function () {
          const playerColour = gwoColour.rgb(
            inventory.getTag("global", "playerColor")
          );
          const character = loc("!LOC:Human");
          var commanders = [
            {
              name: ko.observable().extend({ session: "displayName" }),
              color: gwoColour.rgb(inventory.getTag("global", "playerColor")),
              character: loc("!LOC:Human"),
            },
          ];

          if (coopCampaign) {
            commanders = _.map(
              model.gwCampaignConnectedClients(),
              function (client) {
                return {
                  name: client.name,
                  color: playerColour,
                  character: character,
                };
              }
            );
          }

          const coopInventoryData =
            game.coopPlayerInventoryData &&
            _.isFunction(game.coopPlayerInventoryData)
              ? game.coopPlayerInventoryData()
              : [];
          var mergedSubcommanders = [];

          _.forEach(coopInventoryData, function (inventoryData) {
            const inventoryEntry = inventoryData && inventoryData.inventory;
            if (inventoryEntry && _.isArray(inventoryEntry.minions)) {
              mergedSubcommanders = mergedSubcommanders.concat(
                inventoryEntry.minions
              );
            }
          });

          const subcommanders = mergedSubcommanders.length
            ? mergedSubcommanders
            : inventory.minions();

          _.forEach(subcommanders, function (subcommander, index) {
            commanders.push(intelligence(subcommander, index));
          });
          return commanders;
        });

        const url =
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html";
        $.get(url, function (html) {
          const $fi = $(html);
          $("#header").append($fi);
          locTree($("#gwo-panel"));
          ko.applyBindings(model, $fi[0]);
        });
      }
    );
  } catch (e) {
    console.error(e);
    console.error(JSON.stringify(e));
  }
}

ko.computed(function () {
  const game = model.game();
  const galaxy = game.galaxy();
  const originSystem = galaxy.stars()[galaxy.origin()].system();
  if (
    _.isObject(originSystem.gwaio) &&
    !game.isTutorial() &&
    !gwoWarInfoPanelLoaded
  ) {
    console.log("GWO settings found and panel loading");
    gwoWarInfoPanelLoaded = true;
    gwoWarInfoPanel(originSystem.gwaio);
  } else {
    console.warn(
      "Tried to load GWO panel and failed. GWO settings found:",
      _.isObject(originSystem.gwaio),
      "This is a Galactic War:",
      !game.isTutorial(),
      "Panel not yet loaded:",
      !gwoWarInfoPanelLoaded
    );
  }
});
