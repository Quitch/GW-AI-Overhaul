// The measured half of gw_play/gwo_panel.js: what the war information panel
// shows. The scene script keeps the model glue and the !LOC: strings, whose
// translator notes name it. Reads model at call time.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/incompatible_mods.js",
], function (
  gwoColour,
  gwoConfigSetup,
  gwoRefereeCoop,
  gwoSubcommanderTech,
  gwoRaces,
  gwoBrainTable,
  incompatibleMods
) {
  // A third-party card's summarize() is arbitrary code; an empty name beats an
  // uncaught throw in the requireGW callback.
  var cardName = function (card, cardId) {
    try {
      return card && _.isFunction(card.summarize) ? loc(card.summarize()) : "";
    } catch (e) {
      console.error(
        "GWO card summarize() threw for " +
          cardId +
          ": " +
          ((e && e.stack) || e)
      );
      return "";
    }
  };

  // The Deck row once third-party decks are registered, or undefined where
  // the scene's provisional name already covers it. A deck whose mod is gone
  // deals the Expanded deck (decks.cardsFor), so the row names that and notes
  // the missing id.
  var registeredDeckName = function (warDeck, warDeckId, labels) {
    if (warDeck) {
      return loc(warDeck.name);
    }
    if (warDeckId) {
      return labels.expanded + " (" + labels.missing + " " + warDeckId + ")";
    }
    return undefined;
  };

  // One name per side when every race the war recorded resolves to the
  // same brain - every pre-table save, and any uniform table - else the
  // per-race list. See races.md.
  var brainSummaryFor = function (gwoSettings) {
    var recordedRaces = gwoSettings.races || {};
    var warRaceIds = _(
      [gwoRaces.MLA_ID, recordedRaces.player].concat(
        _.values(recordedRaces.byFaction || {})
      )
    )
      .map(gwoRaces.normalizeId)
      .filter(function (id) {
        return id.length > 0;
      })
      .uniq()
      .value();
    var raceName = function (id) {
      var descriptor = gwoRaces.byId(id);
      return descriptor ? loc(descriptor.name) : id;
    };

    return function (side, raceIds) {
      var entries = _.map(raceIds || warRaceIds, function (id) {
        return {
          id: id,
          brain: gwoBrainTable.resolve(
            gwoSettings.aiByRace,
            gwoSettings.ai,
            gwoSettings.aiAlly,
            side,
            id,
            gwoSettings.aiCoop
          ),
        };
      });
      var brains = _.uniq(_.pluck(entries, "brain"));

      if (brains.length === 1) {
        return brains[0];
      }
      return _.map(entries, function (entry) {
        return raceName(entry.id) + ": " + entry.brain;
      }).join(", ");
    };
  };

  var incompatibleModNames = function (mods) {
    var modIdentifiers = _.map(mods, "identifier");
    var incompatibleModsInUse = _.intersection(
      incompatibleMods,
      modIdentifiers
    );
    return _.sortBy(
      _.map(incompatibleModsInUse, function (incompatibleMod) {
        var index = _.findIndex(mods, { identifier: incompatibleMod });
        return mods[index].display_name;
      })
    );
  };

  // params: game, inventory (the host's), factionIndex and playerRace. The
  // function returned builds the commander list; its human is the placeholder
  // a co-op player shows until their loadout is known.
  var commanderList = function (params) {
    var game = params.game;
    var inventory = params.inventory;
    var factionIndex = params.factionIndex;
    var playerRace = params.playerRace;

    // Every commander's icon is its race's, which is how a race shows on
    // the panel; the name stays the faction's. See races.md.
    var raceIcon = function (race) {
      var descriptor = gwoRaces.byId(race) || gwoRaces.byId(playerRace);
      return (descriptor && descriptor.playerIcon) || {};
    };
    // The host's colour, written once at war creation and never changed.
    var playerColourPair = inventory.getTag("global", "playerColor");
    var playerColour = gwoColour.rgb(playerColourPair);

    // The colour this client gets in the next battle, as the base game
    // resolves it. See coop.md.
    var coopColour = function (client) {
      var resolved = model.gwCoopPlayerColors();
      var record = _.find(resolved, {
        id: client.id,
        name: client.name,
      });

      // No record means the base game could not resolve one; fall back
      // rather than blank the swatch.
      return record && record.color
        ? gwoColour.rgb(record.color)
        : playerColour;
    };

    // A co-op AI player's own loadout name under per-player tech, one
    // lookup per loadout.
    var aiLoadouts = {};
    var aiLoadout = function (aiLoadoutId) {
      if (!aiLoadoutId) {
        return model.gwoLoadout;
      }
      if (!aiLoadouts[aiLoadoutId]) {
        aiLoadouts[aiLoadoutId] = ko.observable("");
        requireGW(["cards/" + aiLoadoutId], function (card) {
          aiLoadouts[aiLoadoutId](cardName(card, aiLoadoutId));
        });
      }
      return aiLoadouts[aiLoadoutId];
    };

    var intelligence = function (subcommanderData, index) {
      var subcommander = subcommanderData.subcommander;
      // avoid modifying the original name to prevent duplication of addendum
      var subcommanderName = subcommander.name;
      if (
        gwoSubcommanderTech.hasDuplicatedSubcommanders(subcommanderData.cards)
      ) {
        subcommanderName += " x2";
      }
      var icon = raceIcon(
        _.isUndefined(subcommander.race) ? playerRace : subcommander.race
      );
      return {
        name: subcommanderName,
        color: gwoColour.rgb(
          gwoColour.pick(
            factionIndex,
            subcommander.color,
            gwoRefereeCoop.alliedColourIndex(index)
          )
        ),
        character: gwoConfigSetup.getAIPersonalityName(subcommander),
        iconFill: icon.fill,
        iconOutline: icon.outline,
      };
    };

    // Stable view models, so async loadout text does not flicker when the
    // panel's computed re-evaluates.
    var coopCommanderCache = {};

    var updateCoopCommander = function (client, human) {
      var cacheKey = gwoRefereeCoop.clientKey(client.id, client.name);
      var commander = coopCommanderCache[cacheKey];
      var record;
      var loadoutCardId;
      var icon;
      var isHost = client.role === "host";
      var usesHostLoadout =
        isHost ||
        (client.role === "viewer" && !model.gwCampaignPerPlayerTechCards());

      if (!commander) {
        commander = {
          name: client.name,
          // Observable, not fixed: under Separate races a viewer's own race
          // is only known once their record has synced. See coop.md.
          iconFill: ko.observable(raceIcon(playerRace).fill),
          iconOutline: ko.observable(raceIcon(playerRace).outline),
          // Not fixed: it moves with army control, and with joins and leaves.
          color: ko.observable(),
          // findCoopPlayerInventoryData only tracks synced remote clients, so
          // the host would otherwise stay stuck on "human" forever.
          character: usesHostLoadout ? model.gwoLoadout : ko.observable(human),
          loadoutResolved: usesHostLoadout,
          raceResolved: isHost,
        };
        coopCommanderCache[cacheKey] = commander;
      }

      commander.color(coopColour(client));

      if (!commander.loadoutResolved || !commander.raceResolved) {
        record = gwoRefereeCoop.recordForClient(game, client);
        loadoutCardId = record && record.loadoutCardId;

        if (loadoutCardId && !commander.loadoutResolved) {
          commander.loadoutResolved = true;
          requireGW(["cards/" + loadoutCardId], function (card) {
            commander.character(cardName(card, loadoutCardId));
          });
        }

        if (record && record.inventory) {
          commander.raceResolved = true;
          icon = raceIcon(gwoRaces.raceOf(record.inventory));
          commander.iconFill(icon.fill);
          commander.iconOutline(icon.outline);
        }
      }

      return commander;
    };

    return function (human) {
      var commanders = [
        {
          name: model.displayName,
          color: playerColour,
          character: model.gwoLoadout,
          iconFill: raceIcon(playerRace).fill,
          iconOutline: raceIcon(playerRace).outline,
        },
      ];
      var connectedClients = model.gwCampaignConnectedClients();
      var activeCommanderKeys = {};

      if (model.gwCampaignActive()) {
        commanders = _.map(connectedClients, function (client) {
          var cacheKey = gwoRefereeCoop.clientKey(client.id, client.name);
          activeCommanderKeys[cacheKey] = true;
          return updateCoopCommander(client, human);
        });

        // Co-op AI players, after the humans. Under shared tech they
        // field the host's loadout, under per-player tech their own.
        _.forEach(
          model.gwoCoopAi ? model.gwoCoopAi.panel() : [],
          function (entry) {
            var icon = raceIcon(entry.race);
            commanders.push({
              name: entry.name,
              color: entry.colour ? gwoColour.rgb(entry.colour) : playerColour,
              character: aiLoadout(entry.loadoutCardId),
              iconFill: icon.fill,
              iconOutline: icon.outline,
            });
          }
        );

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
    };
  };

  return {
    cardName: cardName,
    registeredDeckName: registeredDeckName,
    brainSummaryFor: brainSummaryFor,
    incompatibleModNames: incompatibleModNames,
    commanderList: commanderList,
  };
});
