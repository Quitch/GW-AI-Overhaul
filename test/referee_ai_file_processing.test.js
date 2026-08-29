"use strict";

// referee_ai.js's file-discovery engine: source directory in, configFiles out.
// The mod-application engine is covered by test/applyAiMods.test.js instead.
// The module loads for real; only model/$/api are mocked.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeInventory,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  installRefereeFakes,
  runRefereeAi,
} = require("../scripts/lib/referee-fakes.js");

const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);

const installModel = useModel();
let restoreFakes;

afterEach(() => {
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
    installModel(fixture.game, []);
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
    installModel(fixture.game, []);
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
    installModel(fixture.game, []);
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
    installModel(fixture.game, []);
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
    installModel(fixture.game, []);
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
    installModel(fixture.game, connectedClients);
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
    installModel(fixture.game, connectedClients);
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
    installModel(fixture.game, [
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
      42
    );
    assert.equal(
      filesObj["/pa/ai/fabber_builds/x.json"].build_list[0].priority,
      1
    );
  });
});

describe("race trees", () => {
  const races = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"
  );
  const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");
  const { beforeEach } = require("node:test");
  const TITANS_FILES = [
    "/pa/ai/ai_config.json",
    "/pa/ai/fabber_builds/fabber_land.json",
    "/pa/ai/fabber_builds/fixture/fabber_land.json",
    "/pa/ai/factory_builds/fixture_air.json",
    "/pa/ai/unit_maps/fixture.json",
    "/pa/ai/unit_maps/ai_unit_map.json",
  ];

  beforeEach(() => races.register(FIXTURE_RACE));
  afterEach(() => races.reset());

  it("writes a race enemy's files, and only those, to the race root, with the brain's ai_config.json", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyRace: "fixture",
      aiMods: [],
    });
    installModel(fixture.game, []);
    installFakes({
      fileListByPath: { "/pa/ai/": TITANS_FILES },
      getJSON: (url) => ({ from: url }),
    });

    const filesObj = {};
    await run(filesObj);

    const raceKeys = Object.keys(filesObj).filter((key) =>
      key.startsWith("/pa/ai_race_fixture/")
    );
    assert.deepEqual(raceKeys.sort(), [
      "/pa/ai_race_fixture/ai_config.json",
      "/pa/ai_race_fixture/fabber_builds/fixture/fabber_land.json",
      "/pa/ai_race_fixture/factory_builds/fixture_air.json",
      "/pa/ai_race_fixture/unit_maps/ai_unit_map.json",
    ]);
    assert.deepEqual(filesObj["/pa/ai_race_fixture/ai_config.json"], {
      from: "coui://pa/ai/ai_config.json",
    });
    // The MLA pipeline still writes the plain tree for the player's side.
    assert.ok(filesObj["/pa/ai/fabber_builds/fabber_land.json"]);
  });

  it("writes one tree per distinct destination: guardians, a race player, its viewers", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      playerRace: "fixture",
      aiMods: [{ op: "load" }],
      perPlayerTech: true,
      viewerInventoryData: {
        v1: { inventory: makeInventory({ aiModsList: [{ op: "load" }] }) },
      },
    });
    installModel(fixture.game, [
      { id: "host", name: "Host", role: "host" },
      { id: "v1", name: "Viewer1", role: "viewer" },
    ]);
    const { listCalls } = installFakes({
      fileListByPath: { "/pa/ai/": TITANS_FILES },
      getJSON: (url) => ({ from: url }),
    });

    const filesObj = {};
    await run(filesObj);

    assert.ok(filesObj["/pa/ai_race_fixture/player_guardians/ai_config.json"]);
    // Under Guardians the host subcommander shares the brain root, as for MLA.
    assert.ok(filesObj["/pa/ai_race_fixture/ai_config.json"]);
    assert.ok(
      filesObj[
        "/pa/ai_subcommander_race_fixture/player_.player0/ai_config.json"
      ]
    );
    assert.deepEqual(listCalls, ["/pa/ai/"]);
  });

  it("warns when a race has no build orders under the source", async () => {
    const fixture = buildGame({ aiInUse: "Titans", enemyRace: "fixture" });
    installModel(fixture.game, []);
    installFakes({ fileListByPath: { "/pa/ai/": ["/pa/ai/x.json"] } });
    const warnings = [];
    const previous = console.warn;
    console.warn = (message) => warnings.push(message);

    try {
      await run({});
    } finally {
      console.warn = previous;
    }

    assert.deepEqual(warnings, [
      "gwoRefereeAi: no race build orders under /pa/ai/",
    ]);
  });

  it("does nothing extra for an MLA battle", async () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game, []);
    installFakes({ fileListByPath: { "/pa/ai/": TITANS_FILES } });

    const filesObj = {};
    await run(filesObj);

    assert.equal(
      Object.keys(filesObj).some((key) => key.includes("_race_")),
      false
    );
  });
});
