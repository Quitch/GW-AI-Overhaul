"use strict";

// Shared fixtures for testing ai_path resolution: the minimal model.game()-shaped
// surface those files read, not a full GW.Game.
//
// buildGame()/installModel() return the same object references on every call,
// matching production code, which re-reads rather than snapshotting.

var afterEach = require("node:test").afterEach;

var CLUSTER_FACTION = 4;
var DEFAULT_FACTION = 1;

// The canonical scenario matrix, so no test file invents its own.
var SCENARIO_AXES = {
  AI_BRAINS: ["Titans", "Queller", "Penchant"],
  ENEMY_TYPES: ["guardians", "cluster", "neither"],
  SUBCOMMANDER_TYPES: ["cluster", "notCluster"],
  SUBCOMMANDER_TECH_STATES: ["none", "active"],
  COOP_MODES: ["solo", "sharedTech", "perPlayerTech"],
  // "fixture" is scripts/lib/race-fixture.js, registered by the test that
  // sweeps it; an unregistered id reads as MLA.
  RACES: ["mla", "fixture"],
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

// One AI descriptor as gw_start's generator writes it, with the fields the
// referee reads when it builds a battle config.
function makeAiDescriptor(overrides) {
  return Object.assign(
    {
      name: "Test AI",
      commander: "test_commander",
      econ_rate: 1,
      color: [[10, 10, 10]],
      faction: 1,
      personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 },
    },
    overrides || {}
  );
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
  // Race ids from SCENARIO_AXES.RACES; absent means MLA, as in a war saved
  // before races existed.
  var playerRace = opts.playerRace;
  var enemyRace = opts.enemyRace;

  var mirrorMode = enemyType === "guardians";
  var enemyFaction =
    enemyType === "cluster" ? CLUSTER_FACTION : DEFAULT_FACTION;
  var playerFaction =
    subcommanderType === "cluster" ? CLUSTER_FACTION : DEFAULT_FACTION;

  var tags = { "global:playerFaction": playerFaction };
  if (playerRace) {
    tags["global:playerRace"] = playerRace;
  }

  var inventory = makeInventory({
    aiModsList: aiMods,
    cardsList: smartSubcommanders
      ? [{ id: "gwaio_upgrade_subcommander_tactics" }]
      : [],
    tags: tags,
  });

  var ai = {
    mirrorMode: mirrorMode,
    faction: enemyFaction,
    econ_rate: 1,
    personality: {},
    foes: foes,
  };
  if (enemyRace) {
    ai.race = enemyRace;
  }

  var system = {};
  if (aiInUse || aiAllyInUse || opts.aiByRace) {
    system.gwaio = {};
    if (aiInUse) {
      system.gwaio.ai = aiInUse;
    }
    if (aiAllyInUse) {
      system.gwaio.aiAlly = aiAllyInUse;
    }
    // The per-race brain table as gw_start records it:
    // { raceId: { enemy, ally } }. Absent means a war saved before it existed.
    if (opts.aiByRace) {
      system.gwaio.aiByRace = opts.aiByRace;
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

// installModel with the afterEach restore built in: call once per suite, then
// install a game per test through the returned function. Its restore() hands
// the global back early, for a test that installs more than one.
function useModel() {
  var restore;
  var release = function () {
    if (restore) {
      restore();
      restore = undefined;
    }
  };
  afterEach(release);

  var use = function (game, connectedClients) {
    release();
    restore = installModel(game, connectedClients);
  };
  use.restore = release;
  return use;
}

module.exports = {
  SCENARIO_AXES: SCENARIO_AXES,
  CLUSTER_FACTION: CLUSTER_FACTION,
  DEFAULT_FACTION: DEFAULT_FACTION,
  makeInventory: makeInventory,
  makeAiDescriptor: makeAiDescriptor,
  buildGame: buildGame,
  installModel: installModel,
  useModel: useModel,
};
