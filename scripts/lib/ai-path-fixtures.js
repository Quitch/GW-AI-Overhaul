"use strict";

// Shared fixtures for testing GWO's ai_path resolution (shared/ai.js,
// referee_config.js, referee_game_files.js, gw_per_player_tech_referee.js,
// referee_ai.js). Builds the minimal model.game()-shaped surface those files
// actually read at call time - not a full GW.Game/inventory implementation.
//
// buildGame()/installModel() return the *same* object references on every call,
// matching production code, which calls model.game()/game.galaxy() etc. repeatedly
// rather than caching a single snapshot.

var CLUSTER_FACTION = 4;
var DEFAULT_FACTION = 1;

// Canonical scenario-axis values so every test file iterates the same matrix instead
// of each re-inventing its own list of brains/enemy-types/etc.
var SCENARIO_AXES = {
  AI_BRAINS: ["Titans", "Queller", "Penchant"],
  ENEMY_TYPES: ["guardians", "cluster", "neither"],
  SUBCOMMANDER_TYPES: ["cluster", "notCluster"],
  SUBCOMMANDER_TECH_STATES: ["none", "active"],
  COOP_MODES: ["solo", "sharedTech", "perPlayerTech"],
};

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
// The options that aren't self-evident from the defaults below:
//   subcommanderType drives inventory's global:playerFaction tag
//   smartSubcommanders adds the subcommander tactics tech card to inventory.cards()
//   viewerInventoryData is consumed by a fake game.findCoopPlayerInventoryData(client)
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
  var enemyFaction =
    enemyType === "cluster" ? CLUSTER_FACTION : DEFAULT_FACTION;
  var playerFaction =
    subcommanderType === "cluster" ? CLUSTER_FACTION : DEFAULT_FACTION;

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

// Call restore() in afterEach or the stub leaks into the next test.
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
  CLUSTER_FACTION: CLUSTER_FACTION,
  DEFAULT_FACTION: DEFAULT_FACTION,
  makeInventory: makeInventory,
  buildGame: buildGame,
  installModel: installModel,
};
