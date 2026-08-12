// The measured half of gw_play/gw_per_player_tech_referee.js. Keep it loadable
// under the Node AMD harness - see testing.md, "Coverage".
define(() => {
  const armyHasAI = (army) =>
    !!(
      army &&
      _.isArray(army.slots) &&
      army.slots.some((slot) => slot && slot.ai)
    );

  const getConnectedPlayerCount = (options) => {
    const connectedClients = options && options.connectedClients;
    if (_.isArray(connectedClients) && connectedClients.length) {
      return connectedClients.length;
    }

    console.error(
      "[GW COOP] Per-player tech referee has no connected players."
    );
    return 0;
  };

  const collectHumanArmies = (config) => {
    const humanArmies = [];

    _.forEach(config.armies, (army) => {
      if (!armyHasAI(army)) {
        humanArmies.push(army);
      }
    });

    return humanArmies;
  };

  const getPlayerTagGivenIndex = (index) => {
    // Host is still .player, and then subsequent players are .player0, .player1, etc.
    if (index === 0) {
      return ".player";
    } else {
      return `.player${index - 1}`;
    }
  };

  const stringEndsWith = (value, suffix) =>
    _.isString(value) && value.slice(-suffix.length) === suffix;

  const stripKnownSpecTag = (value) => {
    if (!_.isString(value)) {
      return value;
    }

    if (stringEndsWith(value, ".player")) {
      return value.slice(0, -".player".length);
    }

    const match = value.match(/\.player\d+$/);
    if (match) {
      return value.slice(0, -match[0].length);
    }

    return value;
  };

  // The hardcoded guardians:false, and the absence of any Cluster routing, are
  // both deliberate - see ai-paths.md.
  const getViewerSubcommanderAiPath = (
    refereeAIPaths,
    subcommanderTech,
    aiInUse,
    playerInventory,
    playerTag
  ) =>
    refereeAIPaths.getAIPathDestination("subcommander", aiInUse, {
      guardians: false,
      aiMods: playerInventory.aiMods(),
      smartSubcommanders:
        subcommanderTech.hasSmartSubcommanders(playerInventory),
      scopeToken: playerTag === ".player" ? undefined : playerTag,
    });

  // A viewer's subcommander armies, and the colour position the next viewer
  // starts from. subcommanderTech, gwoColour and refereeCoop are injected - see
  // testing.md, "Coverage".
  const buildViewerSubcommanderArmies = (params) => {
    const subcommanderTech = params.subcommanderTech;
    const playerInventory = params.playerInventory;
    const playerTag = params.playerTag;
    let colourPosition = params.colourPosition;
    const armies = [];

    // The host is always .player, and the main referee already added their
    // minions - including their share of the colour sequence.
    if (playerTag === ".player") {
      return { armies, colourPosition };
    }

    const cards = playerInventory.cards();
    const minionCount =
      subcommanderTech.applySubcommanderDuplicationTech(cards);

    _.forEach(playerInventory.minions(), (minion) => {
      // Cloned because the tech mutators write in place, and the minion here is
      // the saved inventory one. Editing it would bake the bonus in past a
      // discard of the card that granted it. See tech-cards.md.
      const minionPersonality = _.cloneDeep(minion.personality);
      subcommanderTech.applySubcommanderTacticsTech(minionPersonality, cards);
      subcommanderTech.applySubcommanderFabberTech(minionPersonality, cards);
      minionPersonality.ai_path = params.viewerAiPath;

      // Duplicated subcommanders share one colour, the same way the host's
      // duplication tech produces a single army with several commander slots.
      const minionColour = params.gwoColour.pick(
        params.playerFaction,
        // pick() falls back to this and reads it to spot The Guardians, so
        // even a colourless minion needs a pair.
        minion.color || params.playerColor,
        params.refereeCoop.alliedColourIndex(colourPosition)
      );
      colourPosition++;

      for (
        let duplicateIndex = 0;
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

    return { armies, colourPosition };
  };

  // The guards that must not stamp per_player_tech_ready onto config: either
  // there is no valid config to stamp it on, or per-player tech is not in play
  // at all. On success it hands the config to validateRefereeState.
  const validateTechOptions = (referee, options) => {
    const config = referee && _.isFunction(referee.config) && referee.config();

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

    return { ok: true, config };
  };

  // Reached only once there is a config to stamp, so every failure here is a
  // writeFailure.
  const validateRefereeState = (referee, options, config) => {
    const failAfterConfig = (message) => ({
      ok: false,
      resolveValue: false,
      writeFailure: true,
      message,
      config,
    });

    const playerCount = getConnectedPlayerCount(options);
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

    const humanArmies = collectHumanArmies(config);
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

    const files = _.isFunction(referee.files) && referee.files();
    if (!files || !_.isPlainObject(files)) {
      return failAfterConfig("[GW COOP] Per-player tech referee has no files.");
    }

    const game = _.isFunction(referee.game) && referee.game();
    if (!game) {
      return failAfterConfig("[GW COOP] Per-player tech referee has no game.");
    }

    const inventory = _.isFunction(game.inventory) && game.inventory();
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
        `[GW COOP] Per-player tech referee has invalid inventory units, mods, or minions. Per-player tech game inventory is: ${JSON.stringify(inventory)}`
      );
    }

    const player = config.player;
    if (!player || !_.isPlainObject(player)) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no player."
      );
    }

    const playerCommander = player.commander;
    if (!playerCommander || !_.isString(playerCommander)) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no player commander."
      );
    }

    const playerColor = inventory.getTag("global", "playerColor");
    if (!_.isArray(playerColor) || playerColor.length < 2) {
      return failAfterConfig(
        "[GW COOP] Per-player tech referee has no player color."
      );
    }

    return {
      ok: true,
      context: {
        config,
        playerCount,
        connectedClients: options.connectedClients,
        humanArmies,
        files,
        game,
        inventory,
        player,
        playerColor,
        baseCommander: stripKnownSpecTag(playerCommander),
      },
    };
  };

  // Every precondition the referee's apply() needs. A writeFailure result means
  // apply() must stamp per_player_tech_ready = false onto config before resolving.
  const validatePerPlayerTechInputs = (referee, options) => {
    const optionsResult = validateTechOptions(referee, options);
    if (!optionsResult.ok) {
      return optionsResult;
    }

    return validateRefereeState(referee, options, optionsResult.config);
  };

  return {
    getPlayerTagGivenIndex,
    stripKnownSpecTag,
    getViewerSubcommanderAiPath,
    buildViewerSubcommanderArmies,
    validatePerPlayerTechInputs,
  };
});
