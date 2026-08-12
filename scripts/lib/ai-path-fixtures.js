"use strict";

// Shared fixtures for testing ai_path resolution: the minimal model.game()-shaped
// surface those files read, not a full GW.Game.
//
// buildGame()/installModel() return the same object references on every call,
// matching production code, which re-reads rather than snapshotting.

var CLUSTER_FACTION = 4;
var DEFAULT_FACTION = 1;

// The canonical scenario matrix, so no test file invents its own.
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
    overrides || {},
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

// -> { game, star, ai, inventory }. The non-obvious options:
//   subcommanderType drives inventory's global:playerFaction tag
//   smartSubcommanders adds the subcommander tactics tech card to inventory.cards()
//   viewerInventoryData feeds a fake game.findCoopPlayerInventoryData(client)
//
// Connected clients go to installModel(), not here.
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
