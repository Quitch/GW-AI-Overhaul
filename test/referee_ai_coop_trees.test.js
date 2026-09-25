"use strict";

// gw_play/referee_ai.js's co-op AI trees: each AI player's build orders copied
// to its own scoped path with its AI mods, and nothing else the battle reads
// changed by it. See ai-paths.md and coop.md, "AI players".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeInventory,
  SCENARIO_AXES,
} = require("../scripts/lib/ai-path-fixtures.js");
const { installRefereeFakes } = require("../scripts/lib/referee-fakes.js");
const { coopAiEntry } = require("../scripts/lib/coop-ai-fixtures.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);
const { raceTreeJobs, coopAiTreeRequests } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const races = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"
);

const installModel = useModel();
let restoreFakes;

afterEach(() => {
  if (restoreFakes) {
    restoreFakes();
    restoreFakes = undefined;
  }
  races.reset();
});

const HOST_MOD = {
  op: "append",
  type: "fabber",
  toBuild: "Bot",
  idToMod: "builders",
  value: "hostMarker",
};

// Every tree lists the same files under its own root.
function installTrees() {
  restoreFakes = installRefereeFakes({
    listFiles: (root) => [
      root + "ai_config.json",
      root + "fabber_builds/fabber_land_builds.json",
      root + "unit_maps/ai_unit_map.json",
      root + "neural_networks/land_attack.json",
    ],
    getJSON: () => ({ build_list: [{ to_build: "Bot", builders: [] }] }),
  }).restore;
}

// The war's co-op AI roster as coop_ai_roster.launchAis builds it under
// shared tech.
function sharedRoster(inventory, count) {
  return Array.from({ length: count || 1 }, (unused, index) =>
    coopAiEntry({
      id: "gwo_ai_" + (index + 1),
      slot: index,
      brain: gwoAI.aiInUse("coop"),
      source: gwoAI.getAIPathSource("coop", undefined, inventory),
      path: gwoAI.getCoopAiPath(undefined, "coopai"),
      inventory: inventory,
    })
  );
}

function generate(coopAis) {
  const filesObj = {};
  return refereeAi
    .call({ files: () => filesObj, coopAis: coopAis })
    .then(() => filesObj);
}

describe("co-op AI trees", () => {
  it("copies the co-op brain's tree to the AI's own path, with its AI mods", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      aiCoopInUse: "Queller",
      aiMods: [HOST_MOD],
    });
    installModel(fixture.game, []);
    installTrees();

    const files = await generate(sharedRoster(fixture.inventory));
    const root = "/pa/ai_queller/q_uber/player_coopai/";

    assert.deepEqual(
      Object.keys(files)
        .filter((key) => key.startsWith(root))
        .sort(),
      [
        root + "ai_config.json",
        root + "fabber_builds/fabber_land_builds.json",
        root + "unit_maps/ai_unit_map.json",
      ]
    );
    assert.deepEqual(
      files[root + "fabber_builds/fabber_land_builds.json"].build_list[0]
        .builders,
      ["hostMarker"]
    );
  });

  it("brings the AI's own `load` files into its tree", async () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      aiMods: [{ op: "load", type: "fabber", value: "tech_builds.json" }],
    });
    installModel(fixture.game, []);
    installTrees();

    const files = await generate(sharedRoster(fixture.inventory));

    assert.ok(files["/pa/ai/player_coopai/fabber_builds/tech_builds.json"]);
  });

  it("walks a tree the AIs share once", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game, []);
    const requests = coopAiTreeRequests(sharedRoster(fixture.inventory, 3), {
      aiPaths: { enemySource: "/pa/ai/" },
    });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].source, "/pa/ai/");
    assert.equal(
      requests[0].request.aiPaths.subCommanderDestination,
      "/pa/ai/player_coopai/"
    );
    assert.equal(requests[0].request.aiPaths.enemySource, "/pa/ai/");
    assert.equal(requests[0].request.forceSubCommanderScope, true);
    assert.equal(requests[0].request.clusterPresence, "None");
    assert.equal(requests[0].request.scopeToken, "coopai");
  });

  it("walks nothing without AI players", () => {
    assert.deepEqual(coopAiTreeRequests([], { aiPaths: {} }), []);
  });

  it("leaves a race AI to its race tree", () => {
    races.register(FIXTURE_RACE);
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game, []);
    const entry = coopAiEntry({
      race: "fixture",
      path: gwoAI.getCoopAiPath("fixture", "coopai"),
      inventory: fixture.inventory,
    });

    assert.deepEqual(coopAiTreeRequests([entry], { aiPaths: {} }), []);

    const jobs = raceTreeJobs(fixture.game, [], [entry]);
    const job = jobs.find(
      (candidate) =>
        candidate.destination === "/pa/ai_race_fixture/player_coopai/"
    );
    assert.ok(job, JSON.stringify(jobs));
    assert.equal(job.source, "/pa/ai/");
  });

  // Every brain on both sides: the co-op pass writes only under its own path
  // and changes no key the rest of the battle reads, and running the hire
  // again writes the same files.
  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const aiCoopInUse of SCENARIO_AXES.AI_BRAINS) {
      it(`enemy=${aiInUse}, coop=${aiCoopInUse}: writes only its own tree`, async () => {
        const fixture = buildGame({
          aiInUse: aiInUse,
          aiCoopInUse: aiCoopInUse,
          aiMods: [HOST_MOD],
        });
        installModel(fixture.game, []);
        installTrees();

        const roster = sharedRoster(fixture.inventory);
        const root = roster[0].path;
        const without = await generate([]);
        const withAi = await generate(roster);
        const again = await generate(roster);

        for (const key of Object.keys(without)) {
          assert.deepEqual(withAi[key], without[key], key);
        }
        const added = Object.keys(withAi).filter((key) => !(key in without));
        assert.ok(added.length > 0);
        for (const key of added) {
          assert.ok(key.startsWith(root), `${key} is outside ${root}`);
        }
        assert.deepEqual(again, withAi);
      });
    }
  }

  it("gives the AI the host's AI mods under shared tech, not the viewers'", async () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [HOST_MOD] });
    const viewerInventory = makeInventory({
      aiModsList: [Object.assign({}, HOST_MOD, { value: "viewerMarker" })],
    });
    fixture.game.findCoopPlayerInventoryData = (client) =>
      client.id === "v1" ? { inventory: viewerInventory } : undefined;
    installModel(fixture.game, [
      { id: "host", name: "Host", role: "host" },
      { id: "v1", name: "Viewer1", role: "viewer" },
    ]);
    installTrees();

    const files = await generate(sharedRoster(fixture.inventory));

    assert.deepEqual(
      files["/pa/ai/player_coopai/fabber_builds/fabber_land_builds.json"]
        .build_list[0].builders,
      ["hostMarker"]
    );
  });
});
