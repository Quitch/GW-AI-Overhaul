"use strict";

// shared/ai.js, which derives the ai_path settings from model.game() and hands them
// to referee_ai_paths.js. That layer is covered on its own.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeInventory,
} = require("../scripts/lib/ai-path-fixtures.js");

const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

const installModel = useModel();

describe("aiInUse", () => {
  it("defaults to Titans when the star has no gwaio system data", () => {
    const fixture = buildGame({ aiInUse: undefined });
    installModel(fixture.game);
    assert.equal(gwoAI.aiInUse("enemy"), "Titans");
    assert.equal(gwoAI.aiInUse("subcommander"), "Titans");
  });

  it("uses gwaio.ai for both enemy and subcommander when no aiAlly override is set", () => {
    const fixture = buildGame({ aiInUse: "Queller" });
    installModel(fixture.game);
    assert.equal(gwoAI.aiInUse("enemy"), "Queller");
    assert.equal(gwoAI.aiInUse("subcommander"), "Queller");
  });

  it("uses gwaio.aiAlly for subcommander independent of the enemy's brain", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiAllyInUse: "Queller" });
    installModel(fixture.game);
    assert.equal(gwoAI.aiInUse("enemy"), "Titans");
    assert.equal(gwoAI.aiInUse("subcommander"), "Queller");
  });
});

describe("getAIPathSource / getAIPathDestination", () => {
  it("getAIPathSource routes through aiInUse for the given type", () => {
    const fixture = buildGame({ aiInUse: "Penchant" });
    installModel(fixture.game);
    assert.equal(gwoAI.getAIPathSource("enemy"), "/pa/ai_penchant/");
  });

  it("auto-scopes enemy destination to 'guardians' only for enemy+mirrorMode", () => {
    const fixture = buildGame({ aiInUse: "Titans", enemyType: "guardians" });
    installModel(fixture.game);
    assert.equal(
      gwoAI.getAIPathDestination("enemy"),
      "/pa/ai/player_guardians/"
    );
  });

  it("never auto-scopes subcommander destination to 'guardians', even under guardians", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [{ op: "load" }],
    });
    installModel(fixture.game);
    // guardians:true is derived and passed through to referee_ai_paths, which blocks
    // the dedicated subcommander branch regardless of aiMods - see
    // referee_ai_paths.test.js's "guardians blocks..." case.
    assert.equal(gwoAI.getAIPathDestination("subcommander"), "/pa/ai/");
  });

  it("passes an explicit scopeToken option through untouched", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);
    assert.equal(
      gwoAI.getAIPathDestination("subcommander", { scopeToken: ".player0" }),
      "/pa/ai_subcommander/player_.player0/"
    );
  });

  it("derives aiMods/smartSubcommanders from the current inventory when not overridden", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      aiMods: [{ op: "load" }],
    });
    installModel(fixture.game);
    assert.equal(
      gwoAI.getAIPathDestination("subcommander"),
      "/pa/ai_subcommander/"
    );
  });
});

describe("getSubcommanderPathForViewer", () => {
  it("the host tag (.player) never gets a scoped path", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);
    const inventory = makeInventory({ aiModsList: [{ op: "load" }] });
    assert.equal(
      gwoAI.getSubcommanderPathForViewer(inventory, ".player"),
      "/pa/ai_subcommander/"
    );
  });

  it("a non-host tag gets scoped by that raw tag", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);
    const inventory = makeInventory({ aiModsList: [{ op: "load" }] });
    assert.equal(
      gwoAI.getSubcommanderPathForViewer(inventory, ".player0"),
      "/pa/ai_subcommander/player_.player0/"
    );
  });

  it("is guardians-unaware by construction, unlike getAIPathDestination('subcommander')", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      enemyType: "guardians",
      aiMods: [{ op: "load" }],
    });
    installModel(fixture.game);
    const inventory = makeInventory({ aiModsList: [{ op: "load" }] });
    assert.equal(
      gwoAI.getSubcommanderPathForViewer(inventory, ".player0"),
      "/pa/ai_subcommander/player_.player0/"
    );
  });

  it("derives smartSubcommanders from the given viewer's own inventory, not the current player's", () => {
    const fixture = buildGame({ aiInUse: "Queller" });
    installModel(fixture.game);
    const smartInventory = makeInventory({
      cardsList: [{ id: "gwaio_upgrade_subcommander_tactics" }],
    });
    const plainInventory = makeInventory({});

    assert.equal(
      gwoAI.getSubcommanderPathForViewer(smartInventory, ".player0"),
      "/pa/ai_queller/q_silver/player_.player0/"
    );
    assert.equal(
      gwoAI.getSubcommanderPathForViewer(plainInventory, ".player0"),
      "/pa/ai_queller/q_bronze/player_.player0/"
    );
  });
});

describe("builderAppendMods", () => {
  it("appends the builder to every named build, matching all lists", () => {
    assert.deepEqual(
      gwoAI.builderAppendMods("fabber", ["TML", "Wall"], "Commander"),
      [
        {
          type: "fabber",
          op: "append",
          toBuild: "TML",
          idToMod: "builders",
          value: "Commander",
          matchAll: true,
        },
        {
          type: "fabber",
          op: "append",
          toBuild: "Wall",
          idToMod: "builders",
          value: "Commander",
          matchAll: true,
        },
      ]
    );
  });

  it("returns nothing for no builds", () => {
    assert.deepEqual(gwoAI.builderAppendMods("factory", [], "UnitCannon"), []);
  });

  it("publishes the advanced structure list the fabber upgrades share", () => {
    assert.ok(gwoAI.advancedStructureBuilds.includes("NukeSilo"));
    assert.ok(gwoAI.advancedStructureBuilds.includes("UnitCannon"));
    assert.equal(
      new Set(gwoAI.advancedStructureBuilds).size,
      gwoAI.advancedStructureBuilds.length
    );
  });
});

describe("isCluster", () => {
  it("returns false for guardians even when faction is 4", () => {
    assert.equal(gwoAI.isCluster({ mirrorMode: true, faction: 4 }), false);
  });

  it("returns true for a scalar faction of 4", () => {
    assert.equal(gwoAI.isCluster({ faction: 4 }), true);
  });

  it("returns false for a scalar faction other than 4", () => {
    assert.equal(gwoAI.isCluster({ faction: 1 }), false);
  });

  it("supports the legacy array-shaped faction (pre-v5.44.0)", () => {
    assert.equal(gwoAI.isCluster({ faction: ["4"] }), true);
    assert.equal(gwoAI.isCluster({ faction: ["1"] }), false);
  });
});

describe("aiEconRateWithFloor", () => {
  it("floors below the difficulty's econ base + econRatePerDist", () => {
    const fixture = buildGame({ difficultyName: "!LOC:Beginner" });
    installModel(fixture.game);
    // Beginner: econBase 0.35 + econRatePerDist 0.05 = 0.4 floor (floating-point
    // addition, so compare with a tolerance rather than strict equality).
    assert.ok(Math.abs(gwoAI.aiEconRateWithFloor(0.1) - 0.4) < 1e-9);
  });

  it("leaves a rate above the floor untouched", () => {
    const fixture = buildGame({ difficultyName: "!LOC:Beginner" });
    installModel(fixture.game);
    assert.equal(gwoAI.aiEconRateWithFloor(5), 5);
  });

  it("falls back to a floor of 1 for an unrecognized difficulty name", () => {
    const fixture = buildGame({ difficultyName: "!LOC:NotARealDifficulty" });
    installModel(fixture.game);
    assert.equal(gwoAI.aiEconRateWithFloor(0.1), 1);
  });

  // Custom is a real entry carrying no econ fields, so the lookup succeeds where
  // the case above fails. Without a field check that yields NaN, not a floor.
  it("falls back to a floor of 1 for the Custom tier, which has no econ fields", () => {
    const fixture = buildGame({ difficultyName: "!LOC:Custom" });
    installModel(fixture.game);
    assert.equal(gwoAI.aiEconRateWithFloor(0.1), 1);
  });

  it("leaves a rate above the Custom floor untouched rather than returning NaN", () => {
    const fixture = buildGame({ difficultyName: "!LOC:Custom" });
    installModel(fixture.game);
    assert.equal(gwoAI.aiEconRateWithFloor(5), 5);
  });
});

describe("quellerCompatibleMinions", () => {
  it("filters minions with a top-level personality.works_with_queller flag", () => {
    const minions = [
      { personality: { works_with_queller: true } },
      { personality: { works_with_queller: false } },
    ];
    assert.deepEqual(gwoAI.quellerCompatibleMinions(minions), [minions[0]]);
  });

  it("filters minions with an ai.personality.works_with_queller flag", () => {
    const minions = [
      { ai: { personality: { works_with_queller: true } } },
      { ai: { personality: { works_with_queller: false } } },
    ];
    assert.deepEqual(gwoAI.quellerCompatibleMinions(minions), [minions[0]]);
  });
});

describe("penchants", () => {
  it("returns the same penchant for the same seed", () => {
    assert.deepEqual(
      gwoAI.penchants(gwoRng.create("penchant-seed")),
      gwoAI.penchants(gwoRng.create("penchant-seed"))
    );
  });

  it("varies across seeds", () => {
    const names = new Set();
    for (let i = 0; i < 40; i++) {
      names.add(gwoAI.penchants(gwoRng.create("penchant-" + i)).penchantName);
    }
    assert.ok(names.size > 1);
  });

  // gwc_minion.js and gw_play/cards_deal_helpers.js deal during play, outside the
  // seeded war-creation path, and pass no rng.
  it("still works with no rng", () => {
    const result = gwoAI.penchants();
    assert.ok(Array.isArray(result.penchants));
    assert.equal(typeof result.penchantName, "string");
  });
});
