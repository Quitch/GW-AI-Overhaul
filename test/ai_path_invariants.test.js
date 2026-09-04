"use strict";

// Cross-cutting ai_path invariants - see ai-paths.md:
//   1. Enemies and subcommanders never share an ai_path.
//   2. Subcommanders never share one with each other under per-player tech.
//   3. No ai_path root sits inside another's engine-scanned directories.
//
// The first two have one intentional exception each, pinned below as named tests
// rather than silently excluded. Simultaneous player/enemy Cluster is not swept:
// the game rules it out, and this suite cannot verify that independently.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
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

const installModel = useModel();
let restoreFakes;

afterEach(() => {
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
// docs/ai-engine.md, "The load pipeline"). Each is scanned recursively and merged
// into one flat namespace, so a whole ai_path root nested inside one would be
// silently absorbed by its parent.
const ENGINE_SCANNED_DIRECTORIES = [
  "unit_maps",
  "platoon_templates",
  "fabber_builds",
  "factory_builds",
  "platoon_builds",
];

// Every ai_path referee_ai_paths.js can hand out. Sources count too: on a shared
// source the subcommander reads that path directly as its ai_path.
function everyResolvableAiPath() {
  const paths = new Set();
  // "all" is unreachable from live code, but is part of the module's surface.
  const types = ["enemy", "subcommander", "cluster", "all"];
  const scopeTokens = [undefined, "guardians", ".player0", "player0"];

  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const type of types) {
      for (const guardians of [false, true]) {
        for (const smartSubcommanders of [false, true]) {
          paths.add(
            refereeAIPaths.getAIPathSource(type, aiInUse, smartSubcommanders)
          );
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

// Everything up to the file's scanned-directory segment - the LAST such segment,
// so a tree wrongly rooted inside a data directory resolves to the inner root
// where the containment check can see it. Undefined for a root-level file.
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
  // Safe by design: with the same brain and no scoping, both sides fall back to
  // the same vanilla path. Queller is structurally exempt, its tiers never meeting.
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
          installModel(fixture.game);

          const enemyIsCluster = gwoAI.isCluster(fixture.ai);
          const enemyPath = refereeConfig.setAIPath(enemyIsCluster, false);
          // Never Cluster here; see the file header.
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
    installModel(fixture.game);
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
    installModel(fixture.game);
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
    installModel(fixture.game);
    assert.notEqual(
      refereeConfig.setAIPath(false, false),
      refereeConfig.setAIPath(false, true)
    );
  });
});

// The pairwise-distinct and guardians-unaware cases for a single viewer live in
// gw_per_player_tech_referee_ai_paths.test.js; only the wrap-around sweep is here.
describe("invariant: per-player-tech viewer paths are pairwise distinct", () => {
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
  it("contrast: the shared-tech ally path DOES react to guardians (falls back to the vanilla brain path)", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [{ op: "load" }],
    });
    installModel(fixture.game);
    assert.equal(refereeConfig.setAIPath(false, true), "/pa/ai/");
  });
});

describe("invariant: mixed-brain fights (aiAlly differs from ai) never collide", () => {
  // Different brains resolve to structurally different base paths, so unlike the
  // sweep above this expects no exception at all.
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
            installModel(fixture.game);

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

describe("invariant: a mixed aiByRace table never collides enemy and subcommander paths", () => {
  // The same non-collision as the sweep above, driven by a recorded per-race
  // row instead of the war-wide strings. Legion is the one shipped race two
  // brains support, so its row can differ per side both ways round.
  for (const [enemy, ally] of [
    ["Queller", "Titans"],
    ["Titans", "Queller"],
  ]) {
    for (const techState of SCENARIO_AXES.SUBCOMMANDER_TECH_STATES) {
      it(`legion enemy=${enemy}/ally=${ally}, subcommander tech=${techState}: paths differ`, () => {
        const fixture = buildGame({
          aiInUse: "Penchant",
          aiAllyInUse: "Penchant",
          aiByRace: { legion: { enemy: enemy, ally: ally } },
          aiMods: techState === "active" ? [{ op: "load" }] : [],
        });
        installModel(fixture.game);

        const enemyPath = refereeConfig.setAIPath(false, false, "legion");
        const subcommanderPath = refereeConfig.setAIPath(false, true, "legion");

        assert.notEqual(enemyPath, subcommanderPath);
      });
    }
  }
});

describe("invariant: Guardians + matching brains + per-player tech never leaks one player's tech onto the Guardian's shared destination", () => {
  // On a shared source tree with Guardians active, the base pass is the only place
  // that combines every connected player's mods. A per-viewer pass writing the same
  // keys would discard that, leaving the Guardian with one viewer's tech.
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
    installModel(fixture.game, []);
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
    installModel(fixture.game, connectedClients);
    installAiProcessingFakes({
      fileListByPath: { "/pa/ai/": ["/pa/ai/fabber_builds/x.json"] },
      getJSON: () => ({ build_list: [{ to_build: "Bot", builders: [] }] }),
    });

    const filesObj = {};
    return runRefereeAiHere(filesObj).then(() => {
      // Every connected player's contribution, never one viewer's alone.
      assert.deepEqual(
        filesObj["/pa/ai/player_guardians/fabber_builds/x.json"].build_list[0]
          .builders,
        ["hostMarker", "v1Marker", "v2Marker"]
      );
      // The plain shared key, which a non-scoped ally reads, must match too.
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
  // A second ai_path rooted inside a scanned directory is absorbed by the first,
  // silently handing one AI another's build orders. Scoping does nest paths, so the
  // property is "what nests, nests beside those directories, not inside them".
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
    // The other half: a scoped tree written into a data directory, with no root
    // above it changing.
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
    installModel(fixture.game, [
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

      // Nesting is only safe because a nested tree is self-contained. ai_config.json
      // has no fallback, so a tree omitting it runs with no unit cap.
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
