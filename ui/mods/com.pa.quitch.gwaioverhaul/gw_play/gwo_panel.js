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
    // Wars created before seeds were recorded have none.
    model.gwoSeed = model.gwoSettings.seed || loc("!LOC:Unknown");
    var coopPlayerScalingCount =
      model.gwoSettings && model.gwoSettings.coopPlayerScalingCount;
    var playerCount = coopPlayerScalingCount || 1;
    // i18n lookups are case sensitive, and these two casings have the widest
    // locale coverage. gwo_panel.html cases the word back down afterwards.
    var playerOrPlayers =
      playerCount > 1 ? loc("!LOC:Players") : loc("!LOC:PLAYER");
    model.gwoCoopPlayerScalingCount = playerCount;
    model.gwoCoopPlayerScalingUnit = playerOrPlayers;
    var lobbyTitle =
      "GWO Co-op - " + loc("!LOC:Difficulty:") + " " + model.gwoDifficulty;
    model.setDefaultGwCoopLobbyTitle(lobbyTitle);

    model.gwCampaignConnectedClients.subscribe(function () {
      var playerScaling = gwoSettings.coopPlayerScalingCount;
      if (
        // A latch - without it the save is rewritten on every join and leave.
        !gwoSettings.tooManyPlayers &&
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

    // An unauthenticated Viewer has an empty uberId/displayName. Co-op records
    // are keyed by identity, so every lookup for them silently no-ops. The base
    // game shares this, so say so rather than let it read as a GWO bug.
    var gwoViewerIdentityWarned;

    var warnIfViewerIdentityMissing = function () {
      if (gwoViewerIdentityWarned) {
        return;
      }
      if (!_.isFunction(model.isCampaignViewer) || !model.isCampaignViewer()) {
        return;
      }

      var uberId = _.isFunction(model.uberId) ? model.uberId() : undefined;
      var displayName = _.isFunction(model.displayName)
        ? model.displayName()
        : undefined;

      if (uberId && displayName) {
        return;
      }

      gwoViewerIdentityWarned = true;
      console.error(
        "[GW COOP] Viewer identity is missing (uberId/displayName empty) - this " +
          "PA profile has not been loaded by an authenticated user. Co-op tech " +
          "inventory, card offers, and subcommander deals will not work for this " +
          "Viewer until it runs under an authenticated login."
      );
    };

    warnIfViewerIdentityMissing();
    if (_.isFunction(model.gwCampaignConnected)) {
      model.gwCampaignConnected.subscribe(warnIfViewerIdentityMissing);
    }

    var cheatsDetected = function () {
      if (!model.devMode()) {
        return;
      }
      if (_.isFunction(model.isCampaignViewer) && model.isCampaignViewer()) {
        return;
      }

      requireGW(
        ["coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save.js"],
        function (gwoSave) {
          var gwoSettings = model.gwoSettings;
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

    cheatsDetected();
    model.devMode.subscribe(cheatsDetected);

    var options = function (optionsList, setting, text) {
      if (setting) {
        optionsList.push(loc(text));
      }
    };

    model.gwoOptions = ko.observableArray([]);
    // Unwrapped, not subscribed: each is fixed for the lifetime of a war.
    var optionDefs = [
      [model.gwoSettings.factionScaling, "!LOC:Faction Scaling"],
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

    var gwoHasDuplicatedSubcommanders = function (playerCards) {
      return _.some(playerCards, {
        id: "gwaio_upgrade_subcommander_duplication",
      });
    };

    requireGW(
      [
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
      ],
      function (gwoColour, gwoRefereeCoop, gwoVersion) {
        model.gwoVersion = ko.observable(gwoVersion);

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
          !model.gwCampaignPerPlayerTechCards()
        );
        // LOCKED, not Locked: case-sensitive i18n, and that casing reaches four
        // more locales. Unlocked has no entry under any casing.
        model.gwoCoopLockedSlots = model.gwCampaignMaxClientsLocked()
          ? loc("!LOC:LOCKED")
          : loc("!LOC:Unlocked");

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
        // The host's colour, written once at war creation and never changed.
        var playerColourPair = inventory.getTag("global", "playerColor");
        var playerColour = gwoColour.rgb(playerColourPair);

        // The colour this client gets in the next battle, as the base game
        // resolves it. See coop.md.
        var coopColour = function (client) {
          var resolved = _.isFunction(model.gwCoopPlayerColors)
            ? model.gwCoopPlayerColors()
            : [];
          var record = _.find(resolved, function (candidate) {
            return candidate.id === client.id && candidate.name === client.name;
          });

          // No record means the base game could not resolve one; fall back
          // rather than blank the swatch.
          return record && record.color
            ? gwoColour.rgb(record.color)
            : playerColour;
        };
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
                gwoRefereeCoop.alliedColourIndex(index)
              )
            ),
            character: personality,
          };
        };

        var coopCampaign = !!model.gwCampaignActive();
        model.gwCampaignActive.subscribe(function (active) {
          coopCampaign = !!active;
        });

        // Stable view models, so async loadout text does not flicker when the
        // computed below re-evaluates.
        var coopCommanderCache = {};

        var updateCoopCommander = function (client, human) {
          var cacheKey =
            String(client.id || "") + "::" + String(client.name || "");
          var commander = coopCommanderCache[cacheKey];
          var record;
          var loadoutCardId;
          var isHost = client.role === "host";
          var usesHostLoadout =
            isHost ||
            (client.role === "viewer" && !model.gwCampaignPerPlayerTechCards());

          if (!commander) {
            commander = {
              name: client.name,
              // Not fixed: it moves with army control, and with joins and leaves.
              color: ko.observable(),
              // findCoopPlayerInventoryData only tracks synced remote clients, so
              // the host would otherwise stay stuck on "human" forever.
              character: usesHostLoadout
                ? model.gwoLoadout
                : ko.observable(human),
              loadoutResolved: usesHostLoadout,
            };
            coopCommanderCache[cacheKey] = commander;
          }

          commander.color(coopColour(client));

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
          var human = loc("!LOC:Human");
          var commanders = [
            {
              name: ko.observable().extend({ session: "displayName" }),
              color: playerColour,
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
              return updateCoopCommander(client, human);
            });

            // Leaving the campaign refreshes the page, so that case needs no cleanup.
            _.forEach(_.keys(coopCommanderCache), function (cacheKey) {
              if (!activeCommanderKeys[cacheKey]) {
                delete coopCommanderCache[cacheKey];
              }
            });
          }

          // Host-first: the order the battle config numbers the colours in.
          var subcommanders = gwoRefereeCoop.getOrderedSubcommanders(
            inventory,
            game,
            gwoRefereeCoop.clientsInPlayerOrder(connectedClients)
          );

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
    console.error(
      "Galactic War Overhaul (GWO): " + (e.stack || e.message || e)
    );
  }
}

var gwoPanelLoaderInitialized = false;
var gwoPanelLoaderNeedsDispose = false;
var gwoPanelLoadWarned = false;

// The computed below can dispose itself on its first evaluation, which runs
// before gwoPanelLoader is assigned. Defer to the flag in that case.
var disposeGwoPanelLoader = function () {
  if (gwoPanelLoaderInitialized) {
    gwoPanelLoader.dispose();
  } else {
    gwoPanelLoaderNeedsDispose = true;
  }
};

var gwoPanelLoader = ko.computed(function () {
  var game = model.game();
  var galaxy = game.galaxy();
  var originSystem = galaxy.stars()[galaxy.origin()].system();

  if (gwoWarInfoPanelLoaded || game.isTutorial()) {
    disposeGwoPanelLoader();
    return;
  }

  if (_.isPlainObject(originSystem.gwaio)) {
    console.log("GWO settings found and panel loading");
    gwoWarInfoPanel(originSystem.gwaio);
    gwoWarInfoPanelLoaded = true;
    disposeGwoPanelLoader();
    return;
  }

  // The galaxy may still be loading, so stay subscribed - but a non-GWO war
  // never resolves, so warn once rather than on every galaxy change.
  if (!gwoPanelLoadWarned) {
    gwoPanelLoadWarned = true;
    console.warn(
      "No GWO settings on the origin system yet; the war information panel will load if they appear."
    );
  }
});

gwoPanelLoaderInitialized = true;
if (gwoPanelLoaderNeedsDispose) {
  gwoPanelLoader.dispose();
}
