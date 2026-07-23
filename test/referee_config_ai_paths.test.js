"use strict";

// Unit tests for the battle-config referee's ai_path assignment logic (setAIPath and
// the army-setup functions that call it). These live in the extracted, measured
// gw_play/referee_config_setup.js; referee_config.js itself keeps only the model/ko/api
// glue and is coverage-excluded, so this loads the setup module directly.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
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
    assert.equal(refereeConfig.setAIPath(false, true), "/pa/ai_subcommander/");
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
      makeAiDescriptor({
        personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 },
      }),
      makeAiDescriptor({
        personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 },
      }),
      makeAiDescriptor({
        personality: { adv_eco_mod: 1, adv_eco_mod_alone: 1 },
      }),
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

  // A guardian (mirror-mode) primary AI derives its personality from the player's card
  // composition: each unit-type card share becomes that type's percent_*, and under
  // Queller the dominant share also picks a personality tag. penchantName additionally
  // feeds the display_name (Show AI Personality Names support).
  it("derives a Queller guardian's personality percentages and tag from the player's cards", () => {
    const fixture = buildGame({ aiInUse: "Queller" });
    restoreModel = installModel(fixture.game);

    const ai = makeAiDescriptor({
      mirrorMode: true,
      minions: [],
      character: "!LOC:Aggressor",
      penchantName: "!LOC:Heavy",
      personality: {
        adv_eco_mod: 1,
        adv_eco_mod_alone: 1,
        percent_vehicle: 0,
        percent_bot: 0,
        percent_orbital: 0,
        percent_air: 0,
        percent_naval: 0,
      },
    });
    // 2 air cards + 1 bot card => air is the dominant share (2/3), bot 1/3.
    const cards = [
      { id: "gwaio_upgrade_fighter_air" },
      { id: "gwaio_upgrade_bomber_air" },
      { id: "gwaio_upgrade_dox_bot" },
    ];
    const armies = [];

    refereeConfig.setupPrimaryAiAndMinions(
      ai,
      cards,
      [".ai0"],
      "Queller",
      armies
    );

    assert.ok(Math.abs(ai.personality.percent_air - 2 / 3) < 1e-9);
    assert.ok(Math.abs(ai.personality.percent_bot - 1 / 3) < 1e-9);
    assert.equal(ai.personality.percent_orbital, 0);
    // Queller: dominant air share tags the personality "queller" + "air".
    assert.deepEqual(ai.personality.personality_tags, ["queller", "air"]);
    // penchantName is appended to the display_name via getAIPersonalityName.
    assert.ok(armies[0].personality.display_name.includes("!LOC:Heavy"));
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

    refereeConfig.setupFfaAis(
      foes,
      [".ai0", ".ai1", ".ai2", ".ai3"],
      "Titans",
      []
    );

    assert.equal(clusterFoe.personality.ai_path, "/pa/ai_cluster/");
    assert.equal(normalFoeA.personality.ai_path, "/pa/ai/");
    // Non-cluster foes share the enemy path with each other by design - they're
    // differentiated by spec_tag, not ai_path.
    assert.equal(
      normalFoeB.personality.ai_path,
      normalFoeA.personality.ai_path
    );
    assert.notEqual(
      clusterFoe.personality.ai_path,
      normalFoeA.personality.ai_path
    );
  });
});
