"use strict";

// Unit tests for referee_ai.js's default exported function - the file-discovery/copy
// engine that reads each AI faction's build-order JSON from its ai_path SOURCE
// directory (api.file.list + $.getJSON) and writes it into configFiles under the
// matching DESTINATION directory. Complements test/applyAiMods.test.js, which only
// covers the mod-application engine reached via the same file's other test-only
// export.
//
// referee_ai.js's own dependencies (shared/ai.js, shared/referee_ai_paths.js,
// shared/referee_coop.js) are all self-contained/coui-resolvable, so the module loads
// for real via loadCouiModule - only global.model/$/api need mocking (via
// ai-path-fixtures.js and fake-jquery.js), not the module itself.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  makeInventory,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  createFakeJQuery,
  createFakeApi,
} = require("../scripts/lib/fake-jquery.js");

const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);

let restoreModel;
let previousDollar;
let previousApi;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
  global.$ = previousDollar;
  global.api = previousApi;
});

function installFakes({ fileListByPath, getJSON }) {
  previousDollar = global.$;
  previousApi = global.api;

  const listCalls = [];
  const getJSONCalls = [];

  global.api = createFakeApi({
    file: {
      list: (path) => {
        listCalls.push(path);
        return Promise.resolve((fileListByPath && fileListByPath[path]) || []);
      },
    },
  });

  global.$ = createFakeJQuery({
    getJSON: (url) => {
      getJSONCalls.push(url);
      return getJSON ? getJSON(url) : { build_list: [] };
    },
  });

  return { listCalls, getJSONCalls };
}

function run(filesObj) {
  return refereeAi.call({ files: () => filesObj || {} });
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

  // unit_maps/ files aren't excluded from this sweep: referee_game_files.js only
  // writes spec-tagged unit-map copies (ai_unit_map.json.ai0, ...json.player, etc.)
  // for specific army instances - it never writes the untagged, scope-aware copy an
  // ai_path-driven lookup at a moved (Guardians/Cluster/subcommander-tech) or
  // mod-added (e.g. Penchant) destination needs. This sweep is what supplies that
  // copy, via the same generic changeFilePath mechanism used for build-order files.
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
      { unit_map: { some_unit: "/pa/units/x/x.json" } }
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
      key.includes("player_.player")
    );
    assert.deepEqual(viewerKeys.sort(), [
      "/pa/ai/player_.player0/fabber_builds/x.json",
      "/pa/ai/player_.player1/fabber_builds/x.json",
    ]);
  });
});
