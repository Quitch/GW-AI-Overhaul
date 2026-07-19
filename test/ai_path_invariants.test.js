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
  SCENARIO_AXES,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);
const perPlayerTechHook = requireShippedModule(
  "coui://ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js"
);

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

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
      "Titans",
      inventory,
      ".player0"
    );
    const pathWithoutGuardians = perPlayerTechHook.getViewerSubcommanderAiPath(
      refereeAIPaths,
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
