"use strict";

// referee_ai.js's file-discovery engine: source directory in, configFiles out.
// The mod-application engine is covered by test/applyAiMods.test.js instead.
// The module loads for real; only model/$/api are mocked.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  makeInventory,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  installRefereeFakes,
  runRefereeAi,
} = require("../scripts/lib/referee-fakes.js");

const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js",
);

let restoreModel;
let restoreFakes;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
  if (restoreFakes) {
    restoreFakes();
    restoreFakes = undefined;
  }
});

function installFakes(options) {
  const fakes = installRefereeFakes(options);
  restoreFakes = fakes.restore;
  return fakes;
}

function run(filesObj) {
  return runRefereeAi(refereeAi, filesObj);
}

describe("aisShareAPath", () => {
  it("Titans: enemy and subcommander share one source dir - api.file.list called once", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game, []);
    const { listCalls } = installFakes({});

    const filesObj = {};
    await run(filesObj);

    assert.deepEqual(listCalls, ["/pa/ai/"]);
  });

  it("Queller: enemy (q_uber) and subcommander (q_bronze) sources differ - listed separately", async () => {
    const fixture = buildGame({
      aiInUse: "Queller",
      enemyType: "neither",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game, []);
    const { listCalls } = installFakes({});

    const filesObj = {};
    await run(filesObj);

    assert.deepEqual(listCalls, [
      "/pa/ai_queller/q_uber/",
      "/pa/ai_queller/q_bronze/",
    ]);
  });
});

describe("file filtering", () => {
  it("skips /neural_networks/ files and non-.json files, never requesting them", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game, []);
    const { getJSONCalls } = installFakes({
      fileListByPath: {
        "/pa/ai/": [
          "/pa/ai/fabber_builds/x.json",
          "/pa/ai/neural_networks/skip_me.json",
          "/pa/ai/readme.txt",
        ],
      },
    });

    const filesObj = {};
    await run(filesObj);

    assert.deepEqual(getJSONCalls, ["coui://pa/ai/fabber_builds/x.json"]);
  });
});

describe("Guardians scoped destination", () => {
  it("writes a scoped copy under the guardians-scoped enemy destination, alongside the source copy", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game, []);
    installFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
      getJSON: () => ({ build_list: [{ to_build: "Bot", priority: 1 }] }),
    });

    const filesObj = {};
    await run(filesObj);

    assert.ok("/pa/ai/fabber_builds/x.json" in filesObj);
    assert.ok("/pa/ai/player_guardians/fabber_builds/x.json" in filesObj);
    assert.deepEqual(filesObj["/pa/ai/player_guardians/fabber_builds/x.json"], {
      build_list: [{ to_build: "Bot", priority: 1 }],
    });
  });

  // unit_maps/ is deliberately in scope: referee_game_files.js only writes
  // spec-tagged copies, so this sweep is what supplies the untagged, scope-aware
  // one an ai_path lookup at a moved destination needs.
  it("also copies a unit_maps file to the guardians-scoped destination, alongside the source copy", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game, []);
    installFakes({
      fileListByPath: {
        "/pa/ai/": ["/pa/ai/unit_maps/ai_unit_map.json"],
      },
      getJSON: () => ({ unit_map: { some_unit: "/pa/units/x/x.json" } }),
    });

    const filesObj = {};
    await run(filesObj);

    assert.ok("/pa/ai/unit_maps/ai_unit_map.json" in filesObj);
    assert.ok("/pa/ai/player_guardians/unit_maps/ai_unit_map.json" in filesObj);
    assert.deepEqual(
      filesObj["/pa/ai/player_guardians/unit_maps/ai_unit_map.json"],
      { unit_map: { some_unit: "/pa/units/x/x.json" } },
    );
  });
});

describe("per-player-tech viewer processing", () => {
  it("gives each connected viewer their own distinct destination, never colliding", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    const viewer1Inventory = makeInventory({ aiModsList: [] });
    const viewer2Inventory = makeInventory({ aiModsList: [] });
    fixture.game.findCoopPlayerInventoryData = (client) => {
      if (client.id === "v1") return { inventory: viewer1Inventory };
      if (client.id === "v2") return { inventory: viewer2Inventory };
      return undefined;
    };
    const connectedClients = [
      { id: "host", name: "Host", role: "host" },
      { id: "v1", name: "Viewer1", role: "viewer" },
      { id: "v2", name: "Viewer2", role: "viewer" },
    ];
    restoreModel = installModel(fixture.game, connectedClients);
    installFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
    });

    const filesObj = {};
    await run(filesObj);

    const viewerKeys = Object.keys(filesObj).filter((key) =>
      key.includes("player_.player"),
    );
    assert.deepEqual(viewerKeys.sort(), [
      "/pa/ai/player_.player0/fabber_builds/x.json",
      "/pa/ai/player_.player1/fabber_builds/x.json",
    ]);
  });

  // The base pass plus one pass per viewer all walk the same tree. Reading it once
  // per launch keeps co-op launch cost flat instead of growing with viewer count.
  it("lists and fetches the shared tree once, not once per viewer", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    fixture.game.findCoopPlayerInventoryData = (client) =>
      client.role === "viewer"
        ? { inventory: makeInventory({ aiModsList: [] }) }
        : undefined;
    const connectedClients = [
      { id: "host", name: "Host", role: "host" },
      { id: "v1", name: "Viewer1", role: "viewer" },
      { id: "v2", name: "Viewer2", role: "viewer" },
    ];
    restoreModel = installModel(fixture.game, connectedClients);
    const { listCalls, getJSONCalls } = installFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
    });

    const filesObj = {};
    await run(filesObj);

    assert.deepEqual(listCalls, ["/pa/ai/"]);
    assert.deepEqual(getJSONCalls, ["coui://pa/ai/fabber_builds/x.json"]);
  });

  // Each pass mutates the JSON it is given, so a shared cache must hand out copies.
  it("gives each viewer's pass its own copy of a cached file", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    const viewerInventory = makeInventory({
      aiModsList: [
        {
          type: "fabber",
          op: "replace",
          toBuild: "Bot",
          idToMod: "priority",
          value: 42,
        },
      ],
    });
    fixture.game.findCoopPlayerInventoryData = (client) =>
      client.id === "v1" ? { inventory: viewerInventory } : undefined;
    restoreModel = installModel(fixture.game, [
      { id: "host", name: "Host", role: "host" },
      { id: "v1", name: "Viewer1", role: "viewer" },
    ]);
    installFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
      getJSON: () => ({
        build_list: [{ to_build: "Bot", priority: 1 }],
      }),
    });

    const filesObj = {};
    await run(filesObj);

    // The viewer's scoped copy took the mod; the base copy must be untouched. A
    // cache handing out the same object would leave both reading 42.
    assert.equal(
      filesObj["/pa/ai_subcommander/player_.player0/fabber_builds/x.json"]
        .build_list[0].priority,
      42,
    );
    assert.equal(
      filesObj["/pa/ai/fabber_builds/x.json"].build_list[0].priority,
      1,
    );
  });
});
