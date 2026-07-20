"use strict";

// Cross-cutting ai_path invariants that span multiple modules:
//   1. Enemies and subcommanders never share an ai_path (shared-tech / setAIPath).
//   2. Subcommanders never share an ai_path with each other under per-player tech.
// Both have one documented, intentional exception each, pinned here as named
// regression tests rather than silently excluded, so a future reader who "fixes"
// either one discovers it's guarded rather than being surprised in production.
//
// Note: the game guarantees the player and the enemy can never simultaneously be
// Cluster (confirmed with the mod author) - that combination is an external
// invariant this suite has no way to independently verify, and is not exercised
// here for that reason (see referee_config.js's setAIPath comment).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  makeInventory,
  SCENARIO_AXES,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  createFakeJQuery,
  createFakeApi,
} = require("../scripts/lib/fake-jquery.js");

const refereeConfig = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);
const subcommanderTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js"
);
const perPlayerTechHook = requireShippedModule(
  "coui://ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js"
);
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
  if (previousDollar !== undefined) {
    global.$ = previousDollar;
    previousDollar = undefined;
  }
  if (previousApi !== undefined) {
    global.api = previousApi;
    previousApi = undefined;
  }
});

// Same fake-$/api wiring as test/referee_ai_file_processing.test.js, duplicated
// locally rather than shared so this file's afterEach can restore all three
// (model/$/api) through one mechanism.
function installAiProcessingFakes({ fileListByPath, getJSON }) {
  previousDollar = global.$;
  previousApi = global.api;

  global.api = createFakeApi({
    file: {
      list: (path) =>
        Promise.resolve((fileListByPath && fileListByPath[path]) || []),
    },
  });

  global.$ = createFakeJQuery({
    getJSON: (url) => (getJSON ? getJSON(url) : { build_list: [] }),
  });
}

function runRefereeAi(filesObj) {
  return refereeAi.call({ files: () => filesObj || {} });
}

function isKnownOverlapCase(aiInUse, enemyType, techState) {
  // Same brain + no guardians/cluster + no active subcommander tech: confirmed
  // safe-by-design (both sides fall back to the same vanilla brain path). Reachable
  // for Titans and Penchant; Queller is structurally exempt (enemy always resolves
  // to q_uber, subcommander always to q_silver/q_bronze, regardless of tech state).
  return (
    (aiInUse === "Titans" || aiInUse === "Penchant") &&
    enemyType === "neither" &&
    techState === "none"
  );
}

describe("invariant: enemies and subcommanders never share an ai_path", () => {
  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const enemyType of SCENARIO_AXES.ENEMY_TYPES) {
      for (const techState of SCENARIO_AXES.SUBCOMMANDER_TECH_STATES) {
        if (isKnownOverlapCase(aiInUse, enemyType, techState)) {
          continue;
        }

        it(`${aiInUse} / enemy=${enemyType} / subcommander tech=${techState}: paths differ`, () => {
          const fixture = buildGame({
            aiInUse: aiInUse,
            enemyType: enemyType,
            aiMods: techState === "active" ? [{ op: "load" }] : [],
          });
          restoreModel = installModel(fixture.game);

          const enemyIsCluster = gwoAI.isCluster(fixture.ai);
          const enemyPath = refereeConfig.setAIPath(enemyIsCluster, false);
          // Subcommander side is never Cluster in this sweep - enemy-cluster and
          // subcommander-cluster can't coexist (see file header), so crossing them
          // here would test a combination the game itself never produces.
          const subcommanderPath = refereeConfig.setAIPath(false, true);

          assert.notEqual(enemyPath, subcommanderPath);
        });
      }
    }
  }

  it("KNOWN: Titans, no guardians/cluster, no subcommander tech intentionally share a path - confirmed safe by design", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "neither",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game);
    assert.equal(
      refereeConfig.setAIPath(false, false),
      refereeConfig.setAIPath(false, true)
    );
    assert.equal(refereeConfig.setAIPath(false, false), "/pa/ai/");
  });

  it("KNOWN: Penchant, no guardians/cluster, no subcommander tech intentionally share a path - confirmed safe by design", () => {
    const fixture = buildGame({
      aiInUse: "Penchant",
      enemyType: "neither",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game);
    assert.equal(
      refereeConfig.setAIPath(false, false),
      refereeConfig.setAIPath(false, true)
    );
    assert.equal(refereeConfig.setAIPath(false, false), "/pa/ai_penchant/");
  });

  it("Queller never shares a path, even with no guardians/cluster/tech (structurally exempt)", () => {
    const fixture = buildGame({
      aiInUse: "Queller",
      enemyType: "neither",
      aiMods: [],
    });
    restoreModel = installModel(fixture.game);
    assert.notEqual(
      refereeConfig.setAIPath(false, false),
      refereeConfig.setAIPath(false, true)
    );
  });
});

describe("invariant: per-player-tech viewer paths are pairwise distinct", () => {
  it("4 viewers with varying tech/brain never collide, even when base paths would", () => {
    const players = [
      { tag: ".player0", aiInUse: "Titans", aiMods: [] }, // base path /pa/ai/
      { tag: ".player1", aiInUse: "Titans", aiMods: [] }, // same base path as above absent scoping
      { tag: ".player2", aiInUse: "Titans", aiMods: [{ op: "load" }] },
      { tag: ".player3", aiInUse: "Queller", aiMods: [] },
    ];

    const paths = players.map((player) =>
      perPlayerTechHook.getViewerSubcommanderAiPath(
        refereeAIPaths,
        subcommanderTech,
        player.aiInUse,
        { aiMods: () => player.aiMods, cards: () => [] },
        player.tag
      )
    );

    assert.equal(
      new Set(paths).size,
      paths.length,
      `expected all distinct, got: ${paths}`
    );
  });

  it("a large player count (8) does not wrap around or collide", () => {
    const paths = [];
    for (let i = 0; i < 8; i++) {
      paths.push(
        perPlayerTechHook.getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          "Titans",
          { aiMods: () => [], cards: () => [] },
          perPlayerTechHook.getPlayerTagGivenIndex(i + 1)
        )
      );
    }
    assert.equal(new Set(paths).size, paths.length);
  });
});

describe("documented behavior: guardians is ignored by per-player-tech viewer scoping", () => {
  it("a per-player-tech viewer's path is identical whether or not the fight is Guardians", () => {
    const inventory = { aiMods: () => [{ op: "load" }], cards: () => [] };

    const pathUnderGuardians = perPlayerTechHook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      inventory,
      ".player0"
    );
    const pathWithoutGuardians = perPlayerTechHook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      inventory,
      ".player0"
    );

    // Not a meaningful engine-state comparison (the function has no guardians
    // parameter to vary) - this documents that the per-player-tech viewer path is
    // computed the same way regardless of the real fight's guardians state, unlike
    // the shared-tech ally path below, which does react to it.
    assert.equal(pathUnderGuardians, pathWithoutGuardians);
    assert.equal(pathUnderGuardians, "/pa/ai_subcommander/player_.player0/");
  });

  it("contrast: the shared-tech ally path DOES react to guardians (falls back to the vanilla brain path)", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [{ op: "load" }],
    });
    restoreModel = installModel(fixture.game);
    assert.equal(refereeConfig.setAIPath(false, true), "/pa/ai/");
  });
});

describe("invariant: mixed-brain fights (aiAlly differs from ai) never collide", () => {
  // The existing sweep above only ever sets aiInUse, so subcommanderPath is always
  // computed from the SAME brain as enemyPath (aiInUse("subcommander") falls back to
  // aiInUse("enemy") whenever aiAlly is unset). Mixed-brain fights (system.gwaio.aiAlly
  // set to a different brain than system.gwaio.ai) are a real, supported
  // configuration - buildGame() already exposes aiAllyInUse for this - but were never
  // swept. Differing brains resolve to structurally different base paths via
  // getAIPathSource's switch, so unlike the same-brain sweep above, no
  // isKnownOverlapCase-style exception is expected here at all.
  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const aiAllyInUse of SCENARIO_AXES.AI_BRAINS) {
      if (aiInUse === aiAllyInUse) {
        continue;
      }

      for (const enemyType of SCENARIO_AXES.ENEMY_TYPES) {
        for (const techState of SCENARIO_AXES.SUBCOMMANDER_TECH_STATES) {
          it(`enemy=${aiInUse}/ally=${aiAllyInUse}, enemyType=${enemyType}, subcommander tech=${techState}: paths differ`, () => {
            const fixture = buildGame({
              aiInUse: aiInUse,
              aiAllyInUse: aiAllyInUse,
              enemyType: enemyType,
              aiMods: techState === "active" ? [{ op: "load" }] : [],
            });
            restoreModel = installModel(fixture.game);

            const enemyIsCluster = gwoAI.isCluster(fixture.ai);
            const enemyPath = refereeConfig.setAIPath(enemyIsCluster, false);
            const subcommanderPath = refereeConfig.setAIPath(false, true);

            assert.notEqual(enemyPath, subcommanderPath);
          });
        }
      }
    }
  }
});

describe("invariant: Guardians + matching brains + per-player tech never leaks one player's tech onto the Guardian's shared destination", () => {
  // referee_ai.js's per-player-tech viewer loop (forceSubCommanderScope: true) exists
  // solely to populate each viewer's OWN scoped destination. When the enemy and
  // subcommander source trees are the same (brains match, fileOwner "shared") and
  // Guardians is active (the enemy gets a player_guardians-scoped destination
  // distinct from its source), the base pass over aiPathsToProcess is the ONE place
  // that combines every connected player's mods (via getInventoryWithAllPlayerAiMods)
  // and writes that combined result to both the plain shared key and the Guardian's
  // scoped destination. A per-viewer pass must never also write to either of those
  // keys - doing so would silently discard the combined write and leave the Guardian
  // (or the plain shared key any non-scoped ally also reads) reflecting only one
  // viewer's own tech instead of everyone's.
  it("per-player tech disabled: the base pass alone writes one combined result to both the plain and Guardian-scoped keys", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [
        {
          op: "append",
          type: "fabber",
          toBuild: "Bot",
          idToMod: "builders",
          value: "hostMarker",
        },
      ],
    });
    restoreModel = installModel(fixture.game, []);
    installAiProcessingFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
      getJSON: () => ({ build_list: [{ to_build: "Bot", builders: [] }] }),
    });

    const filesObj = {};
    return runRefereeAi(filesObj).then(() => {
      assert.deepEqual(
        filesObj["/pa/ai/fabber_builds/x.json"].build_list[0].builders,
        ["hostMarker"]
      );
      assert.deepEqual(
        filesObj["/pa/ai/player_guardians/fabber_builds/x.json"].build_list[0]
          .builders,
        ["hostMarker"]
      );
    });
  });

  it("per-player tech enabled with 2 viewers: the Guardian's scoped destination reflects EVERY contributor, and each viewer's own scoped destination reflects only their own mod", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [
        {
          op: "append",
          type: "fabber",
          toBuild: "Bot",
          idToMod: "builders",
          value: "hostMarker",
        },
      ],
    });
    const viewer1Inventory = makeInventory({
      aiModsList: [
        {
          op: "append",
          type: "fabber",
          toBuild: "Bot",
          idToMod: "builders",
          value: "v1Marker",
        },
      ],
    });
    const viewer2Inventory = makeInventory({
      aiModsList: [
        {
          op: "append",
          type: "fabber",
          toBuild: "Bot",
          idToMod: "builders",
          value: "v2Marker",
        },
      ],
    });
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
    installAiProcessingFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
      getJSON: () => ({ build_list: [{ to_build: "Bot", builders: [] }] }),
    });

    const filesObj = {};
    return runRefereeAi(filesObj).then(() => {
      // The Guardian must see every connected player's contribution, combined by the
      // base pass alone - never clobbered down to a single viewer's own mod.
      assert.deepEqual(
        filesObj["/pa/ai/player_guardians/fabber_builds/x.json"].build_list[0]
          .builders,
        ["hostMarker", "v1Marker", "v2Marker"]
      );
      // The plain shared key (what a non-scoped ally reads) must match - never reset
      // back to pristine by a viewer pass.
      assert.deepEqual(
        filesObj["/pa/ai/fabber_builds/x.json"].build_list[0].builders,
        ["hostMarker", "v1Marker", "v2Marker"]
      );
      // Each viewer's own scoped destination stays isolated to their own mod only.
      assert.deepEqual(
        filesObj["/pa/ai_subcommander/player_.player0/fabber_builds/x.json"]
          .build_list[0].builders,
        ["v1Marker"]
      );
      assert.deepEqual(
        filesObj["/pa/ai_subcommander/player_.player1/fabber_builds/x.json"]
          .build_list[0].builders,
        ["v2Marker"]
      );
    });
  });
});
