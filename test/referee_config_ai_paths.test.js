"use strict";

// The battle-config referee's ai_path assignment, which lives in the measured
// gw_play/referee_config_setup.js.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeAiDescriptor,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
);

const installModel = useModel();

// Fields setupAIArmy needs to avoid crashing. None are asserted on.
describe("setAIPath", () => {
  it("cluster path is the same regardless of isPlayer - only one side can be Cluster", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game);
    assert.equal(
      refereeConfig.setAIPath(true, true),
      refereeConfig.setAIPath(true, false)
    );
    assert.equal(refereeConfig.setAIPath(true, true), "/pa/ai_cluster/");
  });

  it("routes isPlayer through to the subcommander destination", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);
    assert.equal(refereeConfig.setAIPath(false, true), "/pa/ai_subcommander/");
  });

  it("routes non-player, non-cluster through to the enemy destination", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);
    assert.equal(refereeConfig.setAIPath(false, false), "/pa/ai/");
  });
});

describe("setupAlliedCommanders", () => {
  it("assigns the same ai_path to every allied subcommander", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);

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

    const paths = armies.map((army) => army.personality.ai_path);
    assert.equal(paths[0], "/pa/ai_subcommander/");
    assert.equal(paths[1], paths[0]);
    assert.equal(paths[2], paths[0]);
  });

  it("routes a Cluster player's allies to the cluster path", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "cluster",
    });
    installModel(fixture.game);

    const allies = [makeAiDescriptor()];
    const armies = [];
    refereeConfig.setupAlliedCommanders(
      allies,
      [],
      armies,
      fixture.inventory,
      ".player"
    );
    assert.equal(armies[0].personality.ai_path, "/pa/ai_cluster/");
  });

  // Compared against a second call rather than literal RGB, so this does not pin
  // commander_colour.js's palettes.
  it("startPosition shifts the palette entry an ally is given", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game);

    const setUp = (startPosition) => {
      const armies = [];
      refereeConfig.setupAlliedCommanders(
        [makeAiDescriptor()],
        [],
        armies,
        fixture.inventory,
        ".player",
        startPosition
      );
      return armies[0].color;
    };

    assert.deepEqual(setUp(0), setUp(undefined)); // omitted == first position
    assert.notDeepEqual(setUp(2), setUp(0));
  });

  it("numbers consecutive allies consecutively from startPosition", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game);

    const fromZero = [];
    refereeConfig.setupAlliedCommanders(
      [makeAiDescriptor(), makeAiDescriptor(), makeAiDescriptor()],
      [],
      fromZero,
      fixture.inventory,
      ".player"
    );

    const fromTwo = [];
    refereeConfig.setupAlliedCommanders(
      [makeAiDescriptor()],
      [],
      fromTwo,
      fixture.inventory,
      ".player",
      2
    );

    assert.deepEqual(fromTwo[0].color, fromZero[2].color);
  });
});

describe("setupPrimaryAiAndMinions", () => {
  it("assigns the same ai_path to the primary AI and every one of its minions", () => {
    const fixture = buildGame({ aiInUse: "Titans", enemyType: "neither" });
    installModel(fixture.game);

    const ai = makeAiDescriptor({
      minions: [makeAiDescriptor(), makeAiDescriptor()],
    });
    const armies = [];
    refereeConfig.setupPrimaryAiAndMinions(ai, [], [".ai0"], "Titans", armies);

    // armies[0] is the primary AI, its minions follow in order.
    const primaryPath = armies[0].personality.ai_path;
    assert.equal(primaryPath, "/pa/ai/");
    assert.equal(armies[1].personality.ai_path, primaryPath);
    assert.equal(armies[2].personality.ai_path, primaryPath);
  });

  it("routes a Cluster primary AI to the cluster path", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game);

    const ai = makeAiDescriptor({ faction: 4, minions: [] });
    const armies = [];
    refereeConfig.setupPrimaryAiAndMinions(ai, [], [".ai0"], "Titans", armies);
    assert.equal(armies[0].personality.ai_path, "/pa/ai_cluster/");
  });

  // A mirror-mode AI derives its personality from the player's card composition:
  // each unit-type share becomes a percent_*, and under Queller also a tag.
  it("derives a Queller guardian's personality percentages and tag from the player's cards", () => {
    const fixture = buildGame({ aiInUse: "Queller" });
    installModel(fixture.game);

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

    const guardianPersonality = armies[0].personality;
    assert.ok(Math.abs(guardianPersonality.percent_air - 2 / 3) < 1e-9);
    assert.ok(Math.abs(guardianPersonality.percent_bot - 1 / 3) < 1e-9);
    assert.equal(guardianPersonality.percent_orbital, 0);
    assert.deepEqual(guardianPersonality.personality_tags, ["queller", "air"]);
    // penchantName is appended to the display_name via getAIPersonalityName.
    assert.ok(armies[0].personality.display_name.includes("!LOC:Heavy"));
  });
});

describe("setupFfaAis", () => {
  it("gives a Cluster foe a different path than its non-Cluster siblings, who share one", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game);

    // Placed mid-list to catch an off-by-one in downstream index logic.
    const normalFoeA = makeAiDescriptor();
    const clusterFoe = makeAiDescriptor({ faction: 4 });
    const normalFoeB = makeAiDescriptor();
    const foes = [normalFoeA, clusterFoe, normalFoeB];
    const armies = [];

    refereeConfig.setupFfaAis(
      foes,
      [".ai0", ".ai1", ".ai2", ".ai3"],
      "Titans",
      armies
    );

    // The armies are pushed in foe order.
    assert.equal(armies[1].personality.ai_path, "/pa/ai_cluster/");
    assert.equal(armies[0].personality.ai_path, "/pa/ai/");
    // Non-cluster foes share the enemy path with each other by design - they're
    // differentiated by spec_tag, not ai_path.
    assert.equal(armies[2].personality.ai_path, armies[0].personality.ai_path);
    assert.notEqual(
      armies[1].personality.ai_path,
      armies[0].personality.ai_path
    );
  });
});

// A co-op host hires the referee twice per battle, and none of the setup is
// idempotent, so it must work on copies of the live war objects. See architecture.md.
describe("the setup functions never mutate the war objects they are given", () => {
  const subcommanderTechCards = [
    { id: "gwaio_upgrade_subcommander_tactics" },
    { id: "gwaio_upgrade_subcommander_fabber" },
  ];

  // econ_rate above the Beginner floor, so setAdvEcoMod's multiply is visible.
  function makeMutationBait(overrides) {
    return makeAiDescriptor(
      Object.assign(
        {
          econ_rate: 2,
          personality: {
            adv_eco_mod: 1,
            adv_eco_mod_alone: 1,
            max_basic_fabbers: 4,
            max_advanced_fabbers: 6,
            personality_tags: ["SlowerExpansion"],
          },
        },
        overrides || {}
      )
    );
  }

  function snapshot(value) {
    return JSON.parse(JSON.stringify(value));
  }

  it("applies subcommander tech to the army, not to the inventory's minion", () => {
    const fixture = buildGame({ aiInUse: "Titans", aiMods: [{ op: "load" }] });
    installModel(fixture.game);

    const minions = [makeMutationBait()];
    const untouched = snapshot(minions);
    const firstHire = [];
    const secondHire = [];

    refereeConfig.setupAlliedCommanders(
      minions,
      subcommanderTechCards,
      firstHire,
      fixture.inventory,
      ".player"
    );
    refereeConfig.setupAlliedCommanders(
      minions,
      subcommanderTechCards,
      secondHire,
      fixture.inventory,
      ".player"
    );

    assert.deepEqual(
      snapshot(minions),
      untouched,
      "inventory.minions() must survive a referee hire unchanged"
    );
    // x1.5 fabber caps once (not x2.25), PreventsWaste once (not twice).
    assert.equal(firstHire[0].personality.max_basic_fabbers, 6);
    assert.equal(firstHire[0].personality.max_advanced_fabbers, 9);
    assert.deepEqual(firstHire[0].personality.personality_tags, [
      "PreventsWaste",
    ]);
    assert.deepEqual(
      secondHire[0].personality,
      firstHire[0].personality,
      "the second hire of a co-op host must produce the same subcommander"
    );
  });

  it("does not compound the primary AI's or its minions' eco mods across hires", () => {
    const fixture = buildGame({ aiInUse: "Titans", enemyType: "neither" });
    installModel(fixture.game);

    const ai = makeMutationBait({ minions: [makeMutationBait()] });
    const untouched = snapshot(ai);
    const firstHire = [];
    const secondHire = [];

    refereeConfig.setupPrimaryAiAndMinions(
      ai,
      [],
      [".ai0"],
      "Titans",
      firstHire
    );
    refereeConfig.setupPrimaryAiAndMinions(
      ai,
      [],
      [".ai0"],
      "Titans",
      secondHire
    );

    assert.deepEqual(
      snapshot(ai),
      untouched,
      "star.ai() must survive a referee hire unchanged"
    );
    assert.equal(firstHire[0].personality.adv_eco_mod, 2);
    assert.equal(firstHire[1].personality.adv_eco_mod, 2);
    assert.equal(secondHire[0].personality.adv_eco_mod, 2);
    assert.equal(secondHire[1].personality.adv_eco_mod, 2);
  });

  it("does not compound an FFA foe's eco mod across hires", () => {
    const fixture = buildGame({ aiInUse: "Titans" });
    installModel(fixture.game);

    const foes = [makeMutationBait()];
    const untouched = snapshot(foes);
    const firstHire = [];
    const secondHire = [];

    refereeConfig.setupFfaAis(foes, [".ai0", ".ai1"], "Titans", firstHire);
    refereeConfig.setupFfaAis(foes, [".ai0", ".ai1"], "Titans", secondHire);

    assert.deepEqual(
      snapshot(foes),
      untouched,
      "the star's foes must survive a referee hire unchanged"
    );
    assert.equal(firstHire[0].personality.adv_eco_mod, 2);
    assert.equal(secondHire[0].personality.adv_eco_mod, 2);
  });
});
