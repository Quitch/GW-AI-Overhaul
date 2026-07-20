"use strict";

// Shared fixtures for testing GWO's ai_path resolution (shared/ai.js,
// referee_config.js, referee_game_files.js, gw_per_player_tech_referee.js,
// referee_ai.js). Builds the minimal model.game()-shaped surface those files
// actually read at call time - not a full GW.Game/inventory implementation.
//
// buildGame()/installModel() return the *same* object references on every call,
// matching production code, which calls model.game()/game.galaxy() etc. repeatedly
// rather than caching a single snapshot.

// Canonical scenario-axis values so every test file iterates the same matrix instead
// of each re-inventing its own list of brains/enemy-types/etc.
var SCENARIO_AXES = {
  AI_BRAINS: ["Titans", "Queller", "Penchant"],
  ENEMY_TYPES: ["guardians", "cluster", "neither"],
  SUBCOMMANDER_TYPES: ["cluster", "notCluster"],
  SUBCOMMANDER_TECH_STATES: ["none", "active"],
  COOP_MODES: ["solo", "sharedTech", "perPlayerTech"],
};

// makeInventory(overrides) -> a plain inventory-shaped fixture exposing exactly the
// methods production code calls: aiMods(), cards(), minions(), units(), mods(),
// getTag(namespace, key).
function makeInventory(overrides) {
  var data = Object.assign(
    {
      aiModsList: [],
      cardsList: [],
      minionsList: [],
      unitsList: [],
      modsList: [],
      tags: {},
    },
    overrides || {}
  );

  return {
    aiMods: function () {
      return data.aiModsList;
    },
    cards: function () {
      return data.cardsList;
    },
    minions: function () {
      return data.minionsList;
    },
    units: function () {
      return data.unitsList;
    },
    mods: function () {
      return data.modsList;
    },
    getTag: function (namespace, key) {
      return data.tags[namespace + ":" + key];
    },
  };
}

// buildGame(options) -> { game, star, ai, inventory }
//
// options:
//   aiInUse: "Titans" | "Queller" | "Penchant"          (default "Titans")
//   aiAllyInUse: same enum, optional override for gwaio.aiAlly (mixed-brain fights)
//   difficultyName: optional, sets system.gwaio.difficulty
//   enemyType: "guardians" | "cluster" | "neither"       (default "neither")
//   subcommanderType: "cluster" | "notCluster" | "none"  (default "notCluster")
//     drives inventory's global:playerFaction tag (4 for cluster, 1 otherwise)
//   aiMods: array (default [])                           -> inventory.aiMods()
//   smartSubcommanders: boolean (default false)          -> adds the subcommander
//     tactics tech card to inventory.cards()
//   foes: array of ai-shaped foe descriptors (default []) -> ai.foes
//   perPlayerTech: boolean (default false)                -> game.perPlayerTechCards()
//   viewerInventoryData: map of client id -> inventory data record, consumed by a
//     fake game.findCoopPlayerInventoryData(client)
//
// Connected clients (for model.gwCampaignConnectedClients()) are passed separately
// to installModel(game, connectedClients), not through buildGame's options.
function buildGame(options) {
  var opts = options || {};
  var aiInUse = Object.prototype.hasOwnProperty.call(opts, "aiInUse")
    ? opts.aiInUse
    : "Titans";
  var aiAllyInUse = opts.aiAllyInUse;
  var enemyType = opts.enemyType || "neither";
  var subcommanderType = opts.subcommanderType || "notCluster";
  var aiMods = opts.aiMods || [];
  var smartSubcommanders = !!opts.smartSubcommanders;
  var foes = opts.foes || [];
  var perPlayerTech = !!opts.perPlayerTech;
  var viewerInventoryData = opts.viewerInventoryData || {};

  var mirrorMode = enemyType === "guardians";
  var enemyFaction = enemyType === "cluster" ? 4 : 1;
  var playerFaction = subcommanderType === "cluster" ? 4 : 1;

  var inventory = makeInventory({
    aiModsList: aiMods,
    cardsList: smartSubcommanders
      ? [{ id: "gwaio_upgrade_subcommander_tactics" }]
      : [],
    tags: { "global:playerFaction": playerFaction },
  });

  var ai = {
    mirrorMode: mirrorMode,
    faction: enemyFaction,
    econ_rate: 1,
    personality: {},
    foes: foes,
  };

  var system = {};
  if (aiInUse || aiAllyInUse) {
    system.gwaio = {};
    if (aiInUse) {
      system.gwaio.ai = aiInUse;
    }
    if (aiAllyInUse) {
      system.gwaio.aiAlly = aiAllyInUse;
    }
    if (opts.difficultyName) {
      system.gwaio.difficulty = opts.difficultyName;
    }
  }

  var star = {
    system: function () {
      return system;
    },
    ai: function () {
      return ai;
    },
  };

  var game = {
    galaxy: function () {
      return {
        origin: function () {
          return 0;
        },
        stars: function () {
          return [star];
        },
      };
    },
    currentStar: function () {
      return 0;
    },
    inventory: function () {
      return inventory;
    },
    perPlayerTechCards: function () {
      return perPlayerTech;
    },
    findCoopPlayerInventoryData: function (client) {
      return viewerInventoryData[client && client.id];
    },
  };

  return { game: game, star: star, ai: ai, inventory: inventory };
}

// installModel(game) -> restore()
// Sets global.model to a minimal model.game()/model.gwCampaignConnectedClients()
// stand-in. Call restore() (e.g. in afterEach) to avoid leaking state across tests.
function installModel(game, connectedClients) {
  var previousModel = global.model;
  global.model = {
    game: function () {
      return game;
    },
    gwCampaignConnectedClients: function () {
      return connectedClients || [];
    },
  };
  return function restore() {
    global.model = previousModel;
  };
}

module.exports = {
  SCENARIO_AXES: SCENARIO_AXES,
  makeInventory: makeInventory,
  buildGame: buildGame,
  installModel: installModel,
};
