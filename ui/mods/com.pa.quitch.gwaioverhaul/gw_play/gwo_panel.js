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
    // i18n lookups are case sensitive, and the two forms are covered under different
    // casings: PLAYER has entries in 20 locales where Player has 14, while the plural
    // is only ever Players. gwo_panel.html cases the word back down after translation.
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
        // tooManyPlayers is a latch: once set, the war is flagged for good. Without
        // this the save is rewritten on every join and leave for the rest of the war.
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

    // A Viewer whose PA profile has never been loaded by an authenticated user
    // has an empty uberId/displayName (the base game falls back to "Player").
    // Co-op records are keyed by identity, so findCoopPlayerInventoryData can
    // never match this Viewer's own record - its tech inventory, card offers, and
    // subcommander deals all silently no-op. Surface it once so the state is
    // diagnosable instead of looking like a GWO bug (the base game shares this).
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
    // Several war settings below are read once rather than subscribed to. They are
    // observables, but each is fixed for the lifetime of a war - it is decided at
    // creation and never changes - so unwrapping them here is deliberate, not a
    // missed subscription.
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
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_colour.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
        "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
      ],
      function (gwoColour, gwoCoopColour, gwoRefereeCoop, gwoVersion) {
        /* War Information */
        model.gwoVersion = ko.observable(gwoVersion);

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
          !model.gwCampaignPerPlayerTechCards()
        );
        // LOCKED is asked for rather than Locked because i18n lookups are case
        // sensitive and that casing has entries in four more locales; gwo_panel.html
        // cases it back down. Unlocked has no entry under any casing, so locales that
        // gain a translated "Locked" will still show it in English beside it.
        model.gwoCoopLockedSlots = model.gwCampaignMaxClientsLocked()
          ? loc("!LOC:LOCKED")
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
        // Written once at war creation (gw_start/setup.js); no gw_play path changes
        // it. It is the host's colour, and with shared armies every co-op commander
        // fights under it - see coopColour below for the unshared case.
        var playerColourPair = inventory.getTag("global", "playerColor");
        var playerColour = gwoColour.rgb(playerColourPair);

        // The colour this client will be given in the next battle. Shared armies are
        // a single army, so everyone flies the host's colour; unshared armies are
        // split one per client by gw_coop_referee.js, which colours army 0 with the
        // host's faction colour and the rest from the custom-game lobby palette.
        var coopColour = function (client, connectedClients) {
          if (model.gwCampaignSharedControl()) {
            return playerColour;
          }

          var ordered = gwoCoopColour.clientsInPlayerOrder(connectedClients);
          var index = _.findIndex(ordered, function (candidate) {
            return candidate.id === client.id && candidate.name === client.name;
          });
          var pair =
            index < 0
              ? undefined
              : gwoCoopColour.pairsForPlayers(ordered.length, playerColourPair)[
                  index
                ];

          // No pair means the palette ran out, which the referee treats as a reason
          // to refuse the battle. Fall back to the host's colour rather than leaving
          // the swatch blank.
          return pair ? gwoColour.rgb(pair) : playerColour;
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

        // Keep commander view models stable so async loadout text does not reset during computed reevaluations - prevents flickering.
        var coopCommanderCache = {};

        var updateCoopCommander = function (client, human, connectedClients) {
          // The name is part of the cache key, so a rename is a cache miss and the
          // new name arrives on a freshly built object - nothing to update here.
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
              // Observable because a client's colour is not fixed: it moves when
              // army control is toggled, and when another client joins or leaves
              // and shifts the army order.
              color: ko.observable(),
              // The host's own loadout is already resolved locally via model.gwoLoadout.
              // game.findCoopPlayerInventoryData never returns a record for the host
              // (it only tracks synced remote clients), so without this the host's
              // character observable would stay stuck on "human" forever.
              character: usesHostLoadout
                ? model.gwoLoadout
                : ko.observable(human),
              loadoutResolved: usesHostLoadout,
            };
            coopCommanderCache[cacheKey] = commander;
          }

          commander.color(coopColour(client, connectedClients));

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
              return updateCoopCommander(client, human, connectedClients);
            });

            // Leaving the co-op campaign causes a page refresh and a cache reinitialisation,
            // so we don't need to worry about cleaning up the cache in that case.
            _.forEach(_.keys(coopCommanderCache), function (cacheKey) {
              if (!activeCommanderKeys[cacheKey]) {
                delete coopCommanderCache[cacheKey];
              }
            });
          }

          // Host-first, because that is the order the battle config numbers the
          // subcommander colours in - the same order the human armies are handed out.
          var subcommanders = gwoRefereeCoop.getOrderedSubcommanders(
            inventory,
            game,
            gwoCoopColour.clientsInPlayerOrder(connectedClients)
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
    console.error(JSON.stringify(e));
  }
}

var gwoPanelLoaderInitialized = false;
var gwoPanelLoaderNeedsDispose = false;
var gwoPanelLoadWarned = false;

// The computed can dispose itself on its very first evaluation, which happens inside
// the ko.computed() call below - before gwoPanelLoader has been assigned. Defer to
// the flag in that case.
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

  // Nothing left to wait for: the panel is already up, or this war will never
  // have one.
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

  // The galaxy may still be loading, so stay subscribed and re-check - but report
  // the miss once rather than on every galaxy observable change for the rest of
  // the scene, which is what a war created without GWO used to produce.
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
