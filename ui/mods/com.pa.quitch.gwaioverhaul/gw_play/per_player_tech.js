// Pure helpers for the per-player-tech co-op referee (gw_play/gw_per_player_tech_referee.js,
// a base-game-shadowed file whose define() factory depends on the unshipped
// shared/gw_common and so cannot load under the Node AMD harness). Split out here as a
// plain define() over lodash/console only - no engine globals, no unshipped deps - so
// the referee's testable logic stays measured and directly unit-tested
// (test/gw_per_player_tech_referee_ai_paths.test.js, ..._validate.test.js) while the
// referee file itself is coverage-excluded as untestable glue. Helpers that reach the
// ai_path layer (getViewerSubcommanderAiPath) take their collaborators as explicit
// parameters rather than closing over the referee's injected modules.
define(function () {
  var armyHasAI = function (army) {
    return !!(army && _.isArray(army.slots) && _.any(army.slots, "ai"));
  };

  var getConnectedPlayerCount = function (options) {
    var connectedClients = options && options.connectedClients;
    if (_.isArray(connectedClients) && connectedClients.length) {
      return connectedClients.length;
    }

    console.error(
      "[GW COOP] Per-player tech referee has no connected players."
    );
    return 0;
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

  var stringEndsWith = function (value, suffix) {
    return _.isString(value) && value.slice(-suffix.length) === suffix;
  };

  var stripKnownSpecTag = function (value) {
    if (!_.isString(value)) {
      return value;
    }

    if (stringEndsWith(value, ".player")) {
      return value.slice(0, -".player".length);
    }

    var match = value.match(/\.player\d+$/);
    if (match) {
      return value.slice(0, -match[0].length);
    }

    return value;
  };

  // Resolves the ai_path a per-player-tech viewer should use - both for their own
  // unit map (see generateUnitSpecsForPlayer in the referee) and for their minions
  // (see apply() in the referee) - scoped by that viewer's own player tag so co-op
  // subcommanders never collide with each other's build orders/ai_unit_map (unlike
  // shared-tech allies, who all use one unscoped path - see referee_config.js's
  // setupAlliedCommanders). Always passes guardians:false, independent of the actual
  // fight's guardians state - unlike shared/ai.js's own
  // getAIPathDestination("subcommander") wrapper (and its own viewer-scoped sibling,
  // getSubcommanderPathForViewer, used by referee_ai.js), which derive guardians from
  // the enemy AI. That asymmetry is current, intentional-for-now behavior
  // (per-player-tech co-op does not currently vary subcommander scoping by
  // guardians), not something this function should paper over. Takes refereeAIPaths
  // and subcommanderTech as explicit parameters (rather than closing over the
  // referee's injected modules).
  //
  // Deliberately never routes a Cluster-faction viewer to "cluster" type (unlike
  // referee_config.js's setupAlliedCommanders/referee_game_files.js's buildPlayerFiles,
  // which both check inventory.getTag("global", "playerFaction") for the host). That
  // Cluster-specific destination exists purely to keep a Cluster player's own AI-mod
  // writes from leaking into the shared brain-based destination tree other allies/
  // enemies also read from (see getAIPathSource, which never special-cases Cluster for
  // reads - only getAIPathDestination's write side does). Every per-player-tech viewer
  // already gets that same leak-proof isolation for free via their own player_.playerN
  // scope, regardless of faction, so a second Cluster-specific mechanism here would be
  // redundant.
  var getViewerSubcommanderAiPath = function (
    refereeAIPaths,
    subcommanderTech,
    aiInUse,
    playerInventory,
    playerTag
  ) {
    return refereeAIPaths.getAIPathDestination("subcommander", aiInUse, {
      guardians: false,
      aiMods: playerInventory.aiMods(),
      smartSubcommanders:
        subcommanderTech.hasSmartSubcommanders(playerInventory),
      scopeToken: playerTag === ".player" ? undefined : playerTag,
    });
  };

  // Validates every precondition apply() (in the referee) needs before it starts
  // generating per-player tech files, so apply() no longer carries ~14 stacked guard
  // clauses. Pure: reads only referee/options and the game/inventory objects they
  // expose - never the referee's injected modules. Returns either { ok: false,
  // resolveValue, message, writeFailure [, config] } (writeFailure means apply()
  // should stamp per_player_tech_ready = false onto config before resolving) or
  // { ok: true, context } carrying the derived values apply() goes on to use. Message
  // text and resolve values mirror the original inline guards one-for-one.
  var validatePerPlayerTechInputs = function (referee, options) {
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

    // Every failure from here on writes per_player_tech_ready = false back onto config,
    // so build those results through one helper.
    var failAfterConfig = function (message) {
      return {
        ok: false,
        resolveValue: false,
        writeFailure: true,
        message: message,
        config: config,
      };
    };

    // No options means no co-op.
    if (!options || !options.active) {
      return {
        ok: false,
        resolveValue: true,
        writeFailure: false,
        message:
          "[GW COOP] Per-player tech referee called without co-op options.",
      };
    }

    // Likewise no per-player tech means this referee is out of a job.
    if (!options.perPlayerTechCards) {
      return {
        ok: false,
        resolveValue: true,
        writeFailure: false,
        message:
          "[GW COOP] Per-player tech referee called without per-player tech enabled.",
      };
    }

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
    if (!files || !_.isObject(files)) {
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
    if (!player || !_.isObject(player)) {
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

  return {
    getPlayerTagGivenIndex: getPlayerTagGivenIndex,
    stripKnownSpecTag: stripKnownSpecTag,
    getViewerSubcommanderAiPath: getViewerSubcommanderAiPath,
    validatePerPlayerTechInputs: validatePerPlayerTechInputs,
  };
});
