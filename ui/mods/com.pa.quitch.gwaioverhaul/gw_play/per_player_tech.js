// The measured half of gw_play/gw_per_player_tech_referee.js. Keep it loadable
// under the Node AMD harness - see testing.md, "Coverage".
define(function () {
  var armyHasAI = function (army) {
    return !!(army && _.isArray(army.slots) && _.any(army.slots, "ai"));
  };

  // 0 is reported by validateRefereeState's own playerCount branch, which owns
  // the diagnostic - logging it here too would print it twice per failure.
  var getConnectedPlayerCount = function (options) {
    var connectedClients = options && options.connectedClients;
    return _.isArray(connectedClients) ? connectedClients.length : 0;
  };

  var collectHumanArmies = function (config) {
    var humanArmies = [];

    _.forEach(config.armies, function (army) {
      if (!armyHasAI(army)) {
        humanArmies.push(army);
      }
    });

    return humanArmies;
  };

  var getPlayerTagGivenIndex = function (index) {
    // Host is still .player, and then subsequent players are .player0, .player1, etc.
    if (index === 0) {
      return ".player";
    } else {
      return ".player" + (index - 1);
    }
  };

  var stripKnownSpecTag = function (value) {
    if (!_.isString(value)) {
      return value;
    }

    if (_.endsWith(value, ".player")) {
      return value.slice(0, -".player".length);
    }

    var match = value.match(/\.player\d+$/);
    if (match) {
      return value.slice(0, -match[0].length);
    }

    return value;
  };

  var getViewerSubcommanderAiPath = function (
    refereeAIPaths,
    subcommanderTech,
    aiInUse,
    playerInventory,
    playerTag,
    race
  ) {
    return refereeAIPaths.getViewerSubcommanderPath(
      aiInUse,
      playerInventory.aiMods(),
      subcommanderTech.hasSmartSubcommanders(playerInventory),
      playerTag,
      race
    );
  };

  // A viewer's subcommander armies, and the colour position the next viewer
  // starts from. subcommanderTech, gwoColour, refereeCoop and
  // resolvePersonality are injected - see testing.md, "Coverage".
  var buildViewerSubcommanderArmies = function (params) {
    var subcommanderTech = params.subcommanderTech;
    var playerInventory = params.playerInventory;
    var playerTag = params.playerTag;
    var colourPosition = params.colourPosition;
    var armies = [];

    // The host is always .player, and the main referee already added their
    // minions - including their share of the colour sequence.
    if (playerTag === ".player") {
      return { armies: armies, colourPosition: colourPosition };
    }

    var cards = playerInventory.cards();
    var minionCount = subcommanderTech.applySubcommanderDuplicationTech(cards);

    _.forEach(playerInventory.minions(), function (minion) {
      // A fresh object, as the host's referee builds one: the tech mutators
      // write in place, and the minion here is the saved inventory one.
      // Editing it would bake the bonus in past a discard of the card that
      // granted it. See tech-cards.md.
      var minionPersonality = params.resolvePersonality(minion);
      subcommanderTech.applySubcommanderTacticsTech(minionPersonality, cards);
      subcommanderTech.applySubcommanderFabberTech(minionPersonality, cards);
      minionPersonality.ai_path = params.viewerAiPath;

      // Duplicated subcommanders share one colour, the same way the host's
      // duplication tech produces a single army with several commander slots.
      var minionColour = params.gwoColour.pick(
        params.playerFaction,
        // pick() falls back to this and reads it to spot The Guardians, so
        // even a colourless minion needs a pair.
        minion.color || params.playerColor,
        params.refereeCoop.alliedColourIndex(colourPosition)
      );
      colourPosition++;

      for (
        var duplicateIndex = 0;
        duplicateIndex < minionCount;
        duplicateIndex++
      ) {
        armies.push({
          slots: [
            {
              ai: true,
              name: minion.name || "Helper",
              commander:
                stripKnownSpecTag(minion.commander || params.playerCommander) +
                playerTag,
            },
          ],
          color: minionColour,
          econ_rate: params.subcommanderEconRate,
          personality: minionPersonality,
          spec_tag: playerTag,
          alliance_group: 1,
        });
      }
    });

    return { armies: armies, colourPosition: colourPosition };
  };

  // The guards that must not stamp per_player_tech_ready onto config: either
  // there is no valid config to stamp it on, or per-player tech is not in play
  // at all. On success it hands the config to validateRefereeState.
  var validateTechOptions = function (referee, options) {
    var config = referee && _.isFunction(referee.config) && referee.config();

    if (!config || !_.isArray(config.armies)) {
      return {
        ok: false,
        resolveValue: false,
        writeFailure: false,
        message:
          "[GW COOP] Per-player tech referee received invalid battle config.",
      };
    }

    if (!options || !options.active) {
      return {
        ok: false,
        resolveValue: true,
        writeFailure: false,
        message:
          "[GW COOP] Per-player tech referee called without co-op options.",
      };
    }

    if (!options.perPlayerTechCards) {
      return {
        ok: false,
        resolveValue: true,
        writeFailure: false,
        message:
          "[GW COOP] Per-player tech referee called without per-player tech enabled.",
      };
    }

    return { ok: true, config: config };
  };

  // Reached only once there is a config to stamp, so every failure here is a
  // writeFailure.
  var validateRefereeState = function (referee, options, config) {
    var failAfterConfig = function (message) {
      return {
        ok: false,
        resolveValue: false,
        writeFailure: true,
        message: message,
        config: config,
      };
    };

    var playerCount = getConnectedPlayerCount(options);
    if (playerCount < 1) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no connected players."
      );
    }

    if (options.sharedControl) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee does not support shared control."
      );
    }

    var humanArmies = collectHumanArmies(config);
    if (humanArmies.length < 1) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no human armies."
      );
    }

    if (playerCount !== humanArmies.length) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has a mismatch between connected players and human armies."
      );
    }

    var files = _.isFunction(referee.files) && referee.files();
    if (!files || !_.isPlainObject(files)) {
      return failAfterConfig("[GW COOP] Per-player tech referee has no files.");
    }

    var game = _.isFunction(referee.game) && referee.game();
    if (!game) {
      return failAfterConfig("[GW COOP] Per-player tech referee has no game.");
    }

    var inventory = _.isFunction(game.inventory) && game.inventory();
    if (!inventory) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no inventory."
      );
    }

    if (
      !_.isFunction(inventory.units) ||
      !_.isFunction(inventory.mods) ||
      !_.isFunction(inventory.minions)
    ) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has invalid inventory units, mods, or minions. Per-player tech game inventory is: " +
          JSON.stringify(inventory)
      );
    }

    var player = config.player;
    if (!player || !_.isPlainObject(player)) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no player."
      );
    }

    var playerCommander = player.commander;
    if (!playerCommander || !_.isString(playerCommander)) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no player commander."
      );
    }

    var playerColor = inventory.getTag("global", "playerColor");
    if (!_.isArray(playerColor) || playerColor.length < 2) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no player color."
      );
    }

    return {
      ok: true,
      context: {
        config: config,
        playerCount: playerCount,
        connectedClients: options.connectedClients,
        humanArmies: humanArmies,
        files: files,
        game: game,
        inventory: inventory,
        player: player,
        playerColor: playerColor,
        baseCommander: stripKnownSpecTag(playerCommander),
      },
    };
  };

  // Every precondition the referee's apply() needs. A writeFailure result means
  // apply() must stamp per_player_tech_ready = false onto config before resolving.
  var validatePerPlayerTechInputs = function (referee, options) {
    var optionsResult = validateTechOptions(referee, options);
    if (!optionsResult.ok) {
      return optionsResult;
    }

    return validateRefereeState(referee, options, optionsResult.config);
  };

  return {
    getPlayerTagGivenIndex: getPlayerTagGivenIndex,
    stripKnownSpecTag: stripKnownSpecTag,
    getViewerSubcommanderAiPath: getViewerSubcommanderAiPath,
    buildViewerSubcommanderArmies: buildViewerSubcommanderArmies,
    validatePerPlayerTechInputs: validatePerPlayerTechInputs,
  };
});
