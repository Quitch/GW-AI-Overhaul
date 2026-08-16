"use strict";

// Unit tests for shared/referee_coop.js's allied-commander ordering - the single
// source of truth for which palette entry each player-faction ally gets. Four places
// number colours from it (referee_config.js and its setup module, the per-player-tech
// referee, gwo_panel.js and the intelligence panel), and all four are coverage-excluded
// glue, so this is where that arithmetic is actually pinned down.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  makeInventory,
  installModel,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeCoop = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
);

const HOST = { id: "host-1", name: "Grace", role: "host" };
const VIEWER_ONE = { id: "view-1", name: "Ada", role: "viewer" };
const VIEWER_TWO = { id: "view-2", name: "Alan", role: "viewer" };

// A campaign game whose co-op records are keyed by client id, as the real
// findCoopPlayerInventoryData is.
function makeGame(options) {
  const settings = options || {};
  const records = settings.records || {};

  return {
    perPlayerTechCards: () => !!settings.perPlayerTechCards,
    findCoopPlayerInventoryData: (client) =>
      client ? records[client.id] : undefined,
  };
}

function makeRecord(minionNames, cards) {
  return {
    inventory: {
      cards: cards || [],
      minions: minionNames.map((name) => ({ name })),
    },
  };
}

function names(subcommanders) {
  return subcommanders.map((entry) => entry.subcommander.name);
}

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

describe("referee_coop.alliedColourIndex", () => {
  it("reserves palette index 0 for the player", () => {
    assert.equal(refereeCoop.alliedColourIndex(0), 1);
    assert.equal(refereeCoop.alliedColourIndex(3), 4);
  });
});

describe("referee_coop.getOrderedSubcommanders", () => {
  const hostInventory = makeInventory({
    minionsList: [{ name: "Alpha" }, { name: "Beta" }],
    cardsList: [{ id: "host_card" }],
  });

  it("is the host's own subcommanders when per-player tech is off", () => {
    const game = makeGame({
      perPlayerTechCards: false,
      records: { "view-1": makeRecord(["Gamma"]) },
    });

    assert.deepEqual(
      names(
        refereeCoop.getOrderedSubcommanders(hostInventory, game, [
          HOST,
          VIEWER_ONE,
        ]),
      ),
      ["Alpha", "Beta"],
    );
  });

  it("appends each viewer's subcommanders in client order under per-player tech", () => {
    const game = makeGame({
      perPlayerTechCards: true,
      records: {
        "view-1": makeRecord(["Gamma"]),
        "view-2": makeRecord(["Delta", "Epsilon"]),
      },
    });

    assert.deepEqual(
      names(
        refereeCoop.getOrderedSubcommanders(hostInventory, game, [
          HOST,
          VIEWER_ONE,
          VIEWER_TWO,
        ]),
      ),
      ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"],
    );
  });

  it("keeps the host first however the client list is ordered", () => {
    const game = makeGame({
      perPlayerTechCards: true,
      records: { "view-1": makeRecord(["Gamma"]) },
    });

    assert.deepEqual(
      names(
        refereeCoop.getOrderedSubcommanders(hostInventory, game, [
          VIEWER_ONE,
          HOST,
        ]),
      ),
      ["Alpha", "Beta", "Gamma"],
    );
  });

  it("pairs each subcommander with its own player's cards", () => {
    const viewerCards = [{ id: "viewer_card" }];
    const game = makeGame({
      perPlayerTechCards: true,
      records: { "view-1": makeRecord(["Gamma"], viewerCards) },
    });

    const ordered = refereeCoop.getOrderedSubcommanders(hostInventory, game, [
      HOST,
      VIEWER_ONE,
    ]);

    assert.deepEqual(ordered[0].cards, [{ id: "host_card" }]);
    assert.deepEqual(ordered[2].cards, viewerCards);
  });

  it("skips viewers with no record, no inventory or no minion array", () => {
    const game = makeGame({
      perPlayerTechCards: true,
      records: {
        "view-1": { inventory: { cards: [] } }, // no minions
        "view-2": undefined, // never synced
      },
    });

    assert.deepEqual(
      names(
        refereeCoop.getOrderedSubcommanders(hostInventory, game, [
          HOST,
          VIEWER_ONE,
          VIEWER_TWO,
        ]),
      ),
      ["Alpha", "Beta"],
    );
  });

  // A viewer whose record predates its first card deal, or was written by an
  // older version. Its subcommanders still have to reach the battle, paired
  // with no tech rather than dropped.
  it("keeps a viewer whose record has minions but no card array", () => {
    const game = makeGame({
      perPlayerTechCards: true,
      records: {
        "view-1": { inventory: { minions: [{ name: "Gamma" }] } },
      },
    });

    const ordered = refereeCoop.getOrderedSubcommanders(hostInventory, game, [
      HOST,
      VIEWER_ONE,
    ]);

    assert.deepEqual(names(ordered), ["Alpha", "Beta", "Gamma"]);
    assert.deepEqual(ordered[2].cards, []);
  });

  it("finds no viewers in a game that cannot look records up", () => {
    const game = { perPlayerTechCards: () => true };

    assert.deepEqual(
      names(
        refereeCoop.getOrderedSubcommanders(hostInventory, game, [
          HOST,
          VIEWER_ONE,
        ]),
      ),
      ["Alpha", "Beta"],
    );
  });

  // referee_game_files.js and referee_config.js both call through without a
  // client list, leaving it to read model.gwCampaignConnectedClients().
  it("reads the connected clients itself when given none", () => {
    const game = makeGame({
      perPlayerTechCards: true,
      records: {
        "view-1": makeRecord(["Gamma"]),
        "view-2": makeRecord(["Delta"]),
      },
    });
    restoreModel = installModel(game, [HOST, VIEWER_ONE]);

    assert.deepEqual(
      names(refereeCoop.getOrderedSubcommanders(hostInventory, game)),
      ["Alpha", "Beta", "Gamma"],
    );
  });

  // The star ally is numbered after this list, so in a solo war it still lands on
  // the palette entry it has always had: one past the player's own subcommanders.
  it("leaves the solo ally colour index unchanged", () => {
    const game = makeGame({ perPlayerTechCards: false });
    const ordered = refereeCoop.getOrderedSubcommanders(hostInventory, game, [
      HOST,
    ]);

    assert.equal(
      refereeCoop.alliedColourIndex(ordered.length),
      hostInventory.minions().length + 1,
    );
  });
});

describe("refereeCoop.clientsInPlayerOrder", () => {
  it("puts the host first and leaves everyone else in join order", () => {
    const first = { id: "1", name: "Ada", role: "viewer" };
    const host = { id: "2", name: "Grace", role: "host" };
    const last = { id: "3", name: "Alan", role: "viewer" };

    assert.deepEqual(refereeCoop.clientsInPlayerOrder([first, host, last]), [
      host,
      first,
      last,
    ]);
  });

  it("leaves an already host first list untouched", () => {
    const clients = [
      { id: "1", role: "host" },
      { id: "2", role: "viewer" },
      { id: "3", role: "viewer" },
    ];

    assert.deepEqual(refereeCoop.clientsInPlayerOrder(clients), clients);
  });

  it("tolerates a missing, empty or ragged client list", () => {
    assert.deepEqual(refereeCoop.clientsInPlayerOrder(undefined), []);
    assert.deepEqual(refereeCoop.clientsInPlayerOrder("not a list"), []);
    assert.deepEqual(refereeCoop.clientsInPlayerOrder([]), []);
    assert.deepEqual(refereeCoop.clientsInPlayerOrder([null]), [null]);
  });
});
