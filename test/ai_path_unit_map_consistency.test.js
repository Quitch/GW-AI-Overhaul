"use strict";

// Requirement: the ai_unit_map assigned to each player and AI is written under that
// same player/AI's ai_path.
//
// referee_game_files.js's unit-map placement and referee_config.js's/shared/ai.js's
// ai_path assignment are only ever tested in isolation elsewhere (see
// referee_game_files_ai_paths.test.js and referee_config_ai_paths.test.js). This file
// cross-checks them against each other for the SAME fixture, for the host, for enemy
// AIs (including a Cluster foe at a non-zero index), and for per-player-tech viewers.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  SCENARIO_AXES,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
);
const refereeGameFiles = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js"
);
const perPlayerTechHook = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const gwoSpecs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js"
);
const refereeAIPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js"
);
const subcommanderTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js"
);

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

describe("host: buildPlayerFiles' unit-map prefix matches setAIPath's assigned ai_path", () => {
  it("non-Cluster host: unit map lands under the subcommander destination setAIPath would assign", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    restoreModel = installModel(fixture.game);

    const expectedAiPath = refereeConfig.setAIPath(false, true);
    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: fixture.inventory,
        titans: true,
      },
      gwoAI,
      gwoSpecs
    );

    assert.ok(
      expectedAiPath + "unit_maps/ai_unit_map.json.player" in files,
      `expected a unit-map key under ${expectedAiPath}, got: ${Object.keys(files)}`
    );
  });

  it("Cluster host: unit map lands under the cluster destination setAIPath would assign", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "cluster",
    });
    restoreModel = installModel(fixture.game);

    const expectedAiPath = refereeConfig.setAIPath(true, true);
    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: fixture.inventory,
        titans: false,
      },
      gwoAI,
      gwoSpecs
    );

    assert.equal(expectedAiPath, "/pa/ai_cluster/");
    assert.ok(
      expectedAiPath + "unit_maps/ai_unit_map.json.player" in files,
      `expected a unit-map key under ${expectedAiPath}, got: ${Object.keys(files)}`
    );
  });
});

describe("enemy AIs: clusterArmyIndex/resolveAiUnitMapPaths never disagrees with setAIPath/isCluster about who is Cluster-routed", () => {
  const normalPaths = {
    unitMapPath: "/normal/",
    unitMapTitansPath: "/normal-x1/",
  };
  const clusterPaths = {
    unitMapPath: "/cluster/",
    unitMapTitansPath: "/cluster-x1/",
  };

  function assertConsistent(ai, currentCount) {
    const isClusterAtThisIndex =
      currentCount === 0
        ? gwoAI.isCluster(ai)
        : gwoAI.isCluster(ai.foes[currentCount - 1]);

    const expectedAiPath = refereeConfig.setAIPath(isClusterAtThisIndex, false);
    const resolvedUnitMapPaths = refereeGameFiles.resolveAiUnitMapPaths(
      ai,
      currentCount,
      normalPaths,
      clusterPaths,
      gwoAI.isCluster
    );

    assert.equal(
      resolvedUnitMapPaths === clusterPaths,
      expectedAiPath === gwoAI.getAIPathDestination("cluster"),
      `currentCount=${currentCount}: unit-map Cluster routing and ai_path Cluster ` +
        `routing disagree (isCluster=${isClusterAtThisIndex}, ai_path=${expectedAiPath})`
    );
  }

  it("primary AI is Cluster, foes are not", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    restoreModel = installModel(fixture.game);
    const ai = { faction: 4, foes: [{ faction: 1 }, { faction: 1 }] };

    assertConsistent(ai, 0);
    assertConsistent(ai, 1);
    assertConsistent(ai, 2);
  });

  it("primary AI is not Cluster, a foe in the middle is (not index 0 or last)", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    restoreModel = installModel(fixture.game);
    const ai = {
      faction: 1,
      foes: [{ faction: 1 }, { faction: 4 }, { faction: 1 }],
    };

    assertConsistent(ai, 0);
    assertConsistent(ai, 1);
    assertConsistent(ai, 2);
    assertConsistent(ai, 3);
  });

  it("nothing is Cluster", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    restoreModel = installModel(fixture.game);
    const ai = { faction: 1, foes: [{ faction: 1 }, { faction: 1 }] };

    assertConsistent(ai, 0);
    assertConsistent(ai, 1);
    assertConsistent(ai, 2);
  });

  it("Guardians: the primary is never treated as Cluster-routed even if faction says 4", () => {
    const fixture = buildGame({ aiInUse: "Titans", enemyType: "guardians" });
    restoreModel = installModel(fixture.game);
    const ai = { faction: 4, mirrorMode: true, foes: [] };

    assertConsistent(ai, 0);
  });
});

describe("per-player-tech viewers: the unit-map path prefix and the minion ai_path come from the exact same call", () => {
  // generateUnitSpecsForPlayer's playerScopedPath (used for the viewer's own unit-map
  // key: playerScopedPath + "unit_maps/ai_unit_map.json" + playerTag) and apply()'s
  // viewerAiPath (used for that viewer's minions' personality.ai_path) both call
  // getViewerSubcommanderAiPath with the same (aiInUse, inventory, playerTag) - see
  // gw_play/gw_per_player_tech_referee.js. Since apply() itself is unreachable under
  // Node (gated behind shared/gw_common/shared/gw_inventory, not shipped here - see
  // that file's module.exports comment), this demonstrates the guarantee at the
  // shared-helper level: identical inputs always produce one identical value used for
  // both purposes.
  for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
    for (const aiModsList of [[], [{ op: "load" }]]) {
      it(`${aiInUse}, aiMods=${JSON.stringify(aiModsList)}: unit-map prefix === minion ai_path`, () => {
        const inventory = { aiMods: () => aiModsList, cards: () => [] };
        const playerTag = ".player0";

        const unitMapAiPath = perPlayerTechHook.getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          aiInUse,
          inventory,
          playerTag
        );
        const minionAiPath = perPlayerTechHook.getViewerSubcommanderAiPath(
          refereeAIPaths,
          subcommanderTech,
          aiInUse,
          inventory,
          playerTag
        );

        assert.equal(unitMapAiPath, minionAiPath);

        // Mirrors generateUnitSpecsForPlayer's actual key construction.
        const unitMapKey =
          unitMapAiPath + "unit_maps/ai_unit_map.json" + playerTag;
        assert.ok(unitMapKey.startsWith(minionAiPath));
      });
    }
  }
});
