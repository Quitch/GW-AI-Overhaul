"use strict";

// Cross-cutting ai_path invariants that span multiple modules:
//   1. Enemies and subcommanders never share an ai_path (shared-tech / setAIPath).
//   2. Subcommanders never share an ai_path with each other under per-player tech.
//   3. No ai_path root sits inside another ai_path's engine-scanned directories.
// The first two have one documented, intentional exception each, pinned here as named
// regression tests rather than silently excluded, so a future reader who "fixes"
// either one discovers it's guarded rather than being surprised in production.
//
// Note: the game guarantees the player and the enemy can never simultaneously be
// Cluster (confirmed with the mod author) - that combination is an external
// invariant this suite has no way to independently verify, and is not exercised
// here for that reason (see referee_config.js's setAIPath comment).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  makeInventory,
  SCENARIO_AXES,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  installRefereeFakes,
  runRefereeAi,
} = require("../scripts/lib/referee-fakes.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
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
const perPlayerTechHook = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js"
);
const refereeAi = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
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

function installAiProcessingFakes(options) {
  restoreFakes = installRefereeFakes(options).restore;
}

function runRefereeAiHere(filesObj) {
  return runRefereeAi(refereeAi, filesObj);
}

// The five directories the engine loads from each ai_path (Queller-AI's
// docs/ai-engine.md section 3, "The load pipeline"). Each is scanned RECURSIVELY from
// <ai_path>/<dir> and every .json below it is merged into one flat namespace, which is
// why content meant to merge is nested INSIDE one of these and gated by a personality
// tag - the base game's platoon_builds/tutorial/, GWO's factory_builds/penchants/.
// A whole ai_path root nested there instead would be silently absorbed by its parent.
const ENGINE_SCANNED_DIRECTORIES = [
  "unit_maps",
  "platoon_templates",
  "fabber_builds",
  "factory_builds",
  "platoon_builds",
];

// Every ai_path shared/referee_ai_paths.js can hand out, across its whole option
// matrix. Sources belong here as well as destinations: when the enemy and the
// subcommander resolve to the same source, the subcommander reads that source path
// directly as its ai_path (see referee_ai.js's "A shared source doubles as the
// subcommander's destination").
function everyResolvableAiPath() {
  const paths = new Set();
  // "all" is unreachable from live code today - only getQuellerPath names it - but it
  // is part of the module's surface, so the sweep covers it too.
  const types = ["enemy", "subcommander", "cluster", "all"];
  const scopeTokens = [undefined, "guardians", ".player0", "player0"];

  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const type of types) {
      paths.add(refereeAIPaths.getAIPathSource(type, aiInUse));

      for (const guardians of [false, true]) {
        for (const smartSubcommanders of [false, true]) {
          for (const aiMods of [[], [{ op: "load" }]]) {
            for (const scopeToken of scopeTokens) {
              paths.add(
                refereeAIPaths.getAIPathDestination(type, aiInUse, {
                  guardians: guardians,
                  smartSubcommanders: smartSubcommanders,
                  aiMods: aiMods,
                  scopeToken: scopeToken,
                })
              );
            }
          }
        }
      }
    }
  }

  return [...paths];
}

// The ai_path a written file belongs to: everything up to its scanned-directory
// segment. Deliberately the LAST such segment - a tree wrongly rooted inside a data
// directory (/pa/ai/fabber_builds/player_x/fabber_builds/y.json) has to resolve to the
// inner root for the containment check to see it, not be flattened back to /pa/ai/.
// Returns undefined for a root-level file such as ai_config.json.
function aiPathRootOf(filePath) {
  let root;
  let bestIndex = -1;

  for (const directory of ENGINE_SCANNED_DIRECTORIES) {
    const index = filePath.lastIndexOf(`/${directory}/`);
    if (index > bestIndex) {
      bestIndex = index;
      root = filePath.slice(0, index + 1);
    }
  }

  return root;
}

function assertNoRootInsideAnothersScannedDirectory(paths) {
  for (const parent of paths) {
    for (const child of paths) {
      if (child === parent) {
        continue;
      }

      for (const directory of ENGINE_SCANNED_DIRECTORIES) {
        assert.ok(
          !child.startsWith(`${parent}${directory}/`),
          `${child} sits inside ${parent}${directory}/, so the engine's recursive ` +
            `scan of ${parent}${directory} would merge that tree's build data into ` +
            `${parent}'s`
        );
      }
    }
  }
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

    // getViewerSubcommanderAiPath has no guardians parameter, so the viewer path
    // cannot vary with the real fight's guardians state - unlike the shared-tech
    // ally path below, which does react to it. Pinned as the documented asymmetry.
    const path = perPlayerTechHook.getViewerSubcommanderAiPath(
      refereeAIPaths,
      subcommanderTech,
      "Titans",
      inventory,
      ".player0"
    );

    assert.equal(path, "/pa/ai_subcommander/player_.player0/");
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
  // Mixed-brain fights (system.gwaio.aiAlly set to a different brain than
  // system.gwaio.ai) resolve to structurally different base paths via
  // getAIPathSource's switch, so unlike the same-brain sweep above no
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
    return runRefereeAiHere(filesObj).then(() => {
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
    return runRefereeAiHere(filesObj).then(() => {
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

describe("invariant: no ai_path root sits inside another ai_path's scanned directories", () => {
  // The engine merges every .json it finds under <ai_path>/<one of the five>, so a
  // second ai_path rooted inside one of those directories would have its whole tree
  // absorbed by the first - one AI silently inheriting another's build orders, with no
  // load error to show for it. Scoping nests paths (appendScope), so the property this
  // pins is not "nothing nests" but "what nests, nests beside the scanned directories
  // rather than inside them".
  it("no source or destination path is nested inside another's scanned directories", () => {
    const paths = everyResolvableAiPath();

    // Guard the guard: a sweep that collapsed to nothing would pass vacuously.
    assert.ok(paths.length > 5, `expected a full sweep, got: ${paths}`);
    assertNoRootInsideAnothersScannedDirectory(paths);
  });

  it("scoped trees really do nest - the safety comes from where, not from avoiding it", () => {
    const paths = everyResolvableAiPath();
    const nested = paths.filter((child) =>
      paths.some((parent) => parent !== child && child.startsWith(parent))
    );

    assert.ok(
      nested.includes("/pa/ai/player_guardians/"),
      `expected scoped roots nested under a plain root, got: ${nested}`
    );
  });

  it("the paths referee_ai.js actually writes hold the same property", () => {
    // Catches the other half of the failure mode: a change that writes a scoped tree
    // INTO a data directory without altering any of the roots swept above.
    const hostMod = {
      op: "append",
      type: "fabber",
      toBuild: "Bot",
      idToMod: "builders",
      value: "hostMarker",
    };
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [hostMod],
    });
    const viewerInventory = makeInventory({
      aiModsList: [Object.assign({}, hostMod, { value: "v1Marker" })],
    });
    fixture.game.findCoopPlayerInventoryData = (client) =>
      client.id === "v1" ? { inventory: viewerInventory } : undefined;
    restoreModel = installModel(fixture.game, [
      { id: "host", name: "Host", role: "host" },
      { id: "v1", name: "Viewer1", role: "viewer" },
    ]);
    installAiProcessingFakes({
      fileListByPath: {
        "/pa/ai/": [
          "/pa/ai/ai_config.json",
          "/pa/ai/unit_maps/ai_unit_map.json",
          "/pa/ai/platoon_templates/platoon_templates.json",
          "/pa/ai/fabber_builds/fabber_land_builds.json",
          "/pa/ai/factory_builds/factory_bot_builds.json",
          "/pa/ai/platoon_builds/platoon_land_builds.json",
          "/pa/ai/neural_networks/land_attack.json",
        ],
      },
      getJSON: () => ({ build_list: [{ to_build: "Bot", builders: [] }] }),
    });

    const filesObj = {};
    return runRefereeAiHere(filesObj).then(() => {
      const written = Object.keys(filesObj);
      const roots = [...new Set(written.map(aiPathRootOf).filter(Boolean))];

      assert.ok(
        roots.length > 1,
        `expected several distinct roots in the write set, got: ${roots}`
      );
      assertNoRootInsideAnothersScannedDirectory(roots);

      // "Each root stands alone" is the other half of the same rule: nesting is only
      // safe because a nested tree is self-contained. ai_config.json in particular has
      // no fallback - a tree that omits it runs with no unit cap - so the scoped copy
      // has to carry its own, alongside all five directories.
      const guardiansRoot = "/pa/ai/player_guardians/";
      assert.deepEqual(
        written
          .filter((path) => path.startsWith(guardiansRoot))
          .map((path) => path.slice(guardiansRoot.length))
          .sort(),
        [
          "ai_config.json",
          "fabber_builds/fabber_land_builds.json",
          "factory_builds/factory_bot_builds.json",
          "platoon_builds/platoon_land_builds.json",
          "platoon_templates/platoon_templates.json",
          "unit_maps/ai_unit_map.json",
        ]
      );
    });
  });
});
