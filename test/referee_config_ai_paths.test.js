"use strict";

// Unit tests for referee_config.js's ai_path assignment logic (setAIPath and the
// army-setup functions that call it), reached via its test-only module.exports hook
// (see the comment above that hook in referee_config.js, and referee_ai.js's
// applyAiMods hook for the original pattern this follows).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");
const { buildGame, installModel } = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js"
);

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

// setupAlliedCommanders/setupPrimaryAiAndMinions/setupFfaAis all pass their ai-shaped
// argument through setupAIArmy, which needs a couple of fields beyond ai_path/faction
// (personality.adv_eco_mod*, econ_rate, color, name, commander) just to avoid
// crashing - none of these are asserted on, they only need to be present.
function makeAiDescriptor(overrides) {
  return Object.assign(
    {
      name: "Test AI",
      commander: "test_commander",
      econ_rate: 1,
      color: [[10, 10, 10]],
      faction: 1,
      personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 },
    },
    overrides || {}
  );
}

describe("setAIPath", () => {
  it("cluster path is the same regardless of isPlayer - only one side can be Cluster", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    restoreModel = installModel(fixture.game);
    assert.equal(
      refereeConfig.setAIPath(true, true),
      refereeConfig.setAIPath(true, false)
    );
    assert.equal(refereeConfig.setAIPath(true, true), "/pa/ai_cluster/");
  });

  it("routes isPlayer through to the subcommander destination", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    restoreModel = installModel(fixture.game);
    assert.equal(
      refereeConfig.setAIPath(false, true),
      "/pa/ai_subcommander/"
    );
  });

  it("routes non-player, non-cluster through to the enemy destination", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    restoreModel = installModel(fixture.game);
    assert.equal(refereeConfig.setAIPath(false, false), "/pa/ai/");
  });
});

describe("setupAlliedCommanders", () => {
  it("assigns the same ai_path to every allied subcommander", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    restoreModel = installModel(fixture.game);

    const allies = [
      makeAiDescriptor({ personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 } }),
      makeAiDescriptor({ personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 } }),
      makeAiDescriptor({ personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 } }),
    ];
    const armies = [];
    refereeConfig.setupAlliedCommanders(
      allies,
      [],
      armies,
      fixture.inventory,
      ".player"
    );

    const paths = allies.map((ally) => ally.personality.ai_path);
    assert.equal(paths[0], "/pa/ai_subcommander/");
    assert.equal(paths[1], paths[0]);
    assert.equal(paths[2], paths[0]);
  });

  it("routes a Cluster player's allies to the cluster path", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "cluster",
    });
    restoreModel = installModel(fixture.game);

    const allies = [makeAiDescriptor()];
    refereeConfig.setupAlliedCommanders(
      allies,
      [],
      [],
      fixture.inventory,
      ".player"
    );
    assert.equal(allies[0].personality.ai_path, "/pa/ai_cluster/");
  });
});

describe("setupPrimaryAiAndMinions", () => {
  it("assigns the same ai_path to the primary AI and every one of its minions", () => {
    const fixture = buildGame({ aiInUse: "Titans", enemyType: "neither" });
    restoreModel = installModel(fixture.game);

    const ai = makeAiDescriptor({
      minions: [makeAiDescriptor(), makeAiDescriptor()],
    });
    const armies = [];
    refereeConfig.setupPrimaryAiAndMinions(ai, [], [".ai0"], "Titans", armies);

    const primaryPath = ai.personality.ai_path;
    assert.equal(primaryPath, "/pa/ai/");
    assert.equal(ai.minions[0].personality.ai_path, primaryPath);
    assert.equal(ai.minions[1].personality.ai_path, primaryPath);
  });

  it("routes a Cluster primary AI to the cluster path", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    restoreModel = installModel(fixture.game);

    const ai = makeAiDescriptor({ faction: 4, minions: [] });
    refereeConfig.setupPrimaryAiAndMinions(ai, [], [".ai0"], "Titans", []);
    assert.equal(ai.personality.ai_path, "/pa/ai_cluster/");
  });
});

describe("setupFfaAis", () => {
  it("gives a Cluster foe a different path than its non-Cluster siblings, who share one", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    restoreModel = installModel(fixture.game);

    // Cluster foe placed in the middle, not first/last, to rule out an off-by-one in
    // any index-based logic downstream (e.g. referee_game_files.js's clusterArmyIndex).
    const normalFoeA = makeAiDescriptor();
    const clusterFoe = makeAiDescriptor({ faction: 4 });
    const normalFoeB = makeAiDescriptor();
    const foes = [normalFoeA, clusterFoe, normalFoeB];

    refereeConfig.setupFfaAis(foes, [".ai0", ".ai1", ".ai2", ".ai3"], "Titans", []);

    assert.equal(clusterFoe.personality.ai_path, "/pa/ai_cluster/");
    assert.equal(normalFoeA.personality.ai_path, "/pa/ai/");
    // Non-cluster foes share the enemy path with each other by design - they're
    // differentiated by spec_tag, not ai_path.
    assert.equal(normalFoeB.personality.ai_path, normalFoeA.personality.ai_path);
    assert.notEqual(clusterFoe.personality.ai_path, normalFoeA.personality.ai_path);
  });
});
