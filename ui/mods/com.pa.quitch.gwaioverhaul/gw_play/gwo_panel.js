var gwoWarInfoPanelLoaded;

function gwoWarInfoPanel(gwoSettings) {
  try {
    var deckName = function (deckName) {
      if (!deckName || deckName === "Expanded") {
        return loc("!LOC:Galactic War Overhaul");
      }

      return loc(deckName);
    };

    var game = model.game();
    model.gwoSettings = gwoSettings;
    model.gwoDifficulty = loc(model.gwoSettings.difficulty);
    model.gwoSize = loc(model.gwoSettings.galaxySize);
    model.gwoAI = model.gwoSettings.ai || "Titans";
    model.gwoAIAlly =
      model.gwoSettings.aiAlly || model.gwoSettings.ai || "Titans";
    model.gwoDeck = deckName(model.gwoSettings.techCardDeck);
    var coopPlayerScalingCount =
      model.gwoSettings && model.gwoSettings.coopPlayerScalingCount;
    var playerCount = coopPlayerScalingCount || 1;
    var playerOrPlayers =
      playerCount > 1 ? loc("!LOC:Players") : loc("!LOC:Player");
    model.gwoCoopPlayerScaling = playerCount
      ? playerCount + " " + playerOrPlayers
      : loc("!LOC:Unknown");
    var lobbyTitle =
      "GWO Co-op - " + loc("!LOC:Difficulty:") + " " + model.gwoDifficulty;
    model.setDefaultGwCoopLobbyTitle(lobbyTitle);

    model.gwCampaignConnectedClients.subscribe(function () {
      var playerScaling = gwoSettings.coopPlayerScalingCount;
      if (
        model.gwCampaignConnectedClients &&
        _.isFunction(model.gwCampaignConnectedClients) &&
        playerScaling &&
        model.gwCampaignConnectedClients().length > playerScaling
      ) {
        gwoSettings.tooManyPlayers = true;
        requireGW(
          ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
          function (gwoSave) {
            gwoSave(game, true);
          }
        );
      }
    });

    var options = function (optionsList, setting, text) {
      if (setting) {
        optionsList.push(loc(text));
      }
    };

    model.gwoOptions = ko.observableArray([]);
    var optionDefs = [
      [model.gwoSettings.factionScaling, "!LOC:Faction scaling"],
      [model.gwoSettings.systemScaling, "!LOC:System scaling"],
      [model.gwoSettings.simpleSystems, "!LOC:Easy Systems"],
      [model.gwoSettings.largePlanets, "!LOC:Large Planets"],
      [model.gwoSettings.easierStart, "!LOC:Easier start"],
      [model.gwoSettings.staticTech, "!LOC:Static tech"],
      [model.gwoSettings.cheatsUsed, "!LOC:dev mode"],
      [game.hardcore(), "!LOC:Hardcore mode"],
      [model.gwoSettings.tougherCommanders, "!LOC:Tougher commanders"], // deprecated - pre-v5.27.0 support only
    ];
    for (var element of optionDefs) {
      options(model.gwoOptions, element[0], element[1]);
    }

    var cheatsDetected = function () {
      requireGW(
        ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
        function (gwoSave) {
          var gwoSettings = model.gwoSettings;
          if (gwoSettings && !gwoSettings.cheatsUsed) {
            gwoSettings.cheatsUsed = true;
            gwoSettings.noBadge = true;
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
      if (model.devMode()) {
        cheatsDetected();
      }
    });

    function gwoHasDuplicatedSubcommanders(playerCards) {
      return _.some(playerCards, {
        id: "gwaio_upgrade_subcommander_duplication",
      });
    }

    requireGW(
      ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js"],
      function (gwoColour) {
        /* War Information */
        model.gwoVersion = ko.observable("6.1.0");

        /* Co-op Information */
        var coopText = function (setting) {
          if (setting) {
            return loc("!LOC:Shared");
          }
          return loc("!LOC:Separate");
        };

        model.gwoCoopArmyControl = ko.computed(function () {
          return coopText(model.gwCampaignSharedControl());
        });
        model.gwoCoopTechControl = coopText(
          !model.gwCampaignPerPlayerTechCards() //despite being an observable, this is a static value
        );
        model.gwoCoopLockedSlots = model.gwCampaignMaxClientsLocked() //despite being an observable, this is a static value
          ? loc("!LOC:Locked")
          : loc("!LOC:Unlocked");

        /* Incompatible Mods */
        model.gwoIncompatibleMods = ko.observableArray([]);
        api.mods.getMounted("client").then(function (mods) {
          var incompatibleMods = [
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
          var modIdentifiers = _.map(mods, "identifier");
          var incompatibleModsInUse = _.intersection(
            incompatibleMods,
            modIdentifiers
          );
          var incompatibleModNames = _.sortBy(
            _.map(incompatibleModsInUse, function (incompatibleMod) {
              var index = _.findIndex(mods, { identifier: incompatibleMod });
              return mods[index].display_name;
            })
          );
          model.gwoIncompatibleMods(incompatibleModNames);
        });

        /* Player Information */
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

        var intelligence = function (subcommanderData, index) {
          var subcommander = subcommanderData.subcommander;
          var personality = subcommander.character
            ? loc(subcommander.character)
            : loc("!LOC:None");
          if (subcommander.penchant) {
            personality = personality + " " + loc(subcommander.penchant);
          }
          // avoid modifying the original name to prevent duplication of addendum
          var subcommanderName = subcommander.name;
          if (gwoHasDuplicatedSubcommanders(subcommanderData.cards)) {
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

        // Keep commander view models stable so async loadout text does not reset during computed reevaluations - prevents flickering.
        var coopCommanderCache = {};

        var updateCoopCommander = function (client, playerColour, human) {
          var cacheKey =
            String(client.id || "") + "::" + String(client.name || "");
          var commander = coopCommanderCache[cacheKey];
          var record;
          var loadoutCardId;

          if (!commander) {
            commander = {
              name: client.name,
              color: playerColour,
              character: ko.observable(human),
              loadoutResolved: false,
            };
            coopCommanderCache[cacheKey] = commander;
          }

          commander.name = client.name;
          commander.color = playerColour;

          if (!commander.loadoutResolved) {
            record =
              game.findCoopPlayerInventoryData &&
              game.findCoopPlayerInventoryData({
                id: client.id,
                name: client.name,
              });
            loadoutCardId = record && record.loadoutCardId;

            if (loadoutCardId) {
              commander.loadoutResolved = true;
              requireGW(["cards/" + loadoutCardId], function (card) {
                commander.character(loc(card.summarize()));
              });
            }
          }

          return commander;
        };

        model.gwoPlayer = ko.computed(function () {
          var playerColour = gwoColour.rgb(
            inventory.getTag("global", "playerColor")
          );
          var human = loc("!LOC:Human");
          var commanders = [
            {
              name: ko.observable().extend({ session: "displayName" }),
              color: gwoColour.rgb(inventory.getTag("global", "playerColor")),
              character: model.gwoLoadout,
            },
          ];
          var connectedClients = _.isFunction(model.gwCampaignConnectedClients)
            ? model.gwCampaignConnectedClients()
            : [];
          var activeCommanderKeys = {};

          if (coopCampaign) {
            commanders = _.map(connectedClients, function (client) {
              var cacheKey =
                String(client.id || "") + "::" + String(client.name || "");
              activeCommanderKeys[cacheKey] = true;
              return updateCoopCommander(client, playerColour, human);
            });

            _.forEach(_.keys(coopCommanderCache), function (cacheKey) {
              if (!activeCommanderKeys[cacheKey]) {
                delete coopCommanderCache[cacheKey];
              }
            });
          }

          var mergedSubcommanders = [];

          _.forEach(connectedClients, function (client) {
            var inventoryData =
              game.findCoopPlayerInventoryData &&
              game.findCoopPlayerInventoryData({
                id: client.id,
                name: client.name,
              });
            var inventoryEntry = inventoryData && inventoryData.inventory;
            var inventoryCards =
              inventoryEntry && _.isArray(inventoryEntry.cards)
                ? inventoryEntry.cards
                : [];
            if (inventoryEntry && _.isArray(inventoryEntry.minions)) {
              mergedSubcommanders = mergedSubcommanders.concat(
                _.map(inventoryEntry.minions, function (minion) {
                  return {
                    subcommander: minion,
                    cards: inventoryCards,
                  };
                })
              );
            }
          });

          var subcommanders = mergedSubcommanders.length
            ? mergedSubcommanders
            : _.map(inventory.minions(), function (minion) {
                return {
                  subcommander: minion,
                  cards: cards,
                };
              });

          _.forEach(subcommanders, function (subcommanderData, index) {
            commanders.push(intelligence(subcommanderData, index));
          });
          return commanders;
        });

        var url =
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel.html";
        $.get(url, function (html) {
          var $fi = $(html);
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

var gwoPanelLoader = ko.computed(function () {
  var game = model.game();
  var galaxy = game.galaxy();
  var originSystem = galaxy.stars()[galaxy.origin()].system();
  if (
    _.isObject(originSystem.gwaio) &&
    !game.isTutorial() &&
    !gwoWarInfoPanelLoaded
  ) {
    console.log("GWO settings found and panel loading");
    gwoWarInfoPanel(originSystem.gwaio);
    gwoWarInfoPanelLoaded = true;
    gwoPanelLoader.dispose();
  } else {
    console.warn(
      "Tried to load GWO panel and failed. GWO settings found:",
      _.isObject(originSystem.gwaio),
      "This is a Galactic War:",
      !game.isTutorial(),
      "GWO panel already loaded:",
      gwoWarInfoPanelLoaded
    );
  }
});
