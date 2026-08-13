"use strict";

// Unit tests for gw_play/conquest_ai_builder.js. The garrison/foe/ally shapes
// are pinned against what gw_start/setup.js's onPopulated leaves on a star, so
// the referee consumes a play-time AI exactly like a war-generation one.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const builderModule = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_ai_builder.js"
);

// Deterministic rng: sample from the front, pick the first, fixed float/int.
function stubRng(overrides) {
  const rng = Object.assign(
    {
      float: () => 1,
      int: () => 100,
      pick: (list) => list[0],
      sample: (list, n) => (n > 0 ? list.slice(0, n) : []),
      shuffle: (list) => list,
    },
    overrides
  );
  rng.stream = () => rng;
  return rng;
}

const CLUSTER_MODS = [{ file: "cluster.json" }];

function minion(name, extra) {
  return Object.assign(
    {
      name: name,
      character: "!LOC:" + name,
      econ_rate: 1,
      personality: { personality_tags: [], works_with_queller: true },
      commander: "/pa/units/commanders/" + name + ".json",
    },
    extra
  );
}

function makeDeps(overrides) {
  return Object.assign(
    {
      cfg: {
        maxDist: 8,
        playerCount: 1,
        lastAiPhaseTurn: 1,
        factions: [0, 4],
        difficulty: {
          econBase: 1,
          econRatePerDist: 0.2,
          mandatoryMinions: 1,
          minionMod: 0.5,
          factionTechHandicap: 0,
          ffaChance: 10,
          alliedCommanderChance: 15,
          bossCommanders: 2,
        },
        personality: {
          microType: 2,
          goForKill: true,
          priorityScoutMetalSpots: false,
          factoryBuildDelayMin: 0,
          factoryBuildDelayMax: 0,
          unableToExpandDelay: 0,
          enableCommanderDangerResponses: true,
          perExpansionDelay: 0,
          maxBasicFabbers: 6,
          maxAdvancedFabbers: 4,
          startingLocationEvaluationRadius: 0,
          personalityTags: [],
        },
        gameModes: {
          landAnywhereChance: 100,
          suddenDeathChance: 0,
          bountyModeChance: 100,
          bountyModeValue: 0.5,
          eradicationModeChance: 0,
        },
      },
      factions: {
        0: { minions: [minion("Able"), minion("Mjon")] },
        1: { minions: [minion("Arch"), minion("Slayn")] },
        4: {
          minions: [
            minion("Worker", { isCluster: true }),
            minion("Security", { isCluster: true }),
          ],
        },
      },
      factionTechs: {
        0: { 0: ["f0-cost"], 1: ["f0-dmg"], 2: [], 3: [], 4: [], 6: [], 7: [] },
        1: { 0: ["f1-cost"], 1: ["f1-dmg"], 2: [], 3: [], 4: [], 6: [], 7: [] },
        4: { 0: ["f4-cost"], 1: ["f4-dmg"], 2: [], 3: [], 4: [], 6: [], 7: [] },
      },
      clusterCommanderMods: CLUSTER_MODS,
      penchants: () => ({ penchants: ["Raider"], penchantName: "!LOC:Raider" }),
      quellerCompatibleMinions: (minions) =>
        minions.filter((m) => m.personality.works_with_queller),
      aiType: "Titans",
      aiAllyType: "Titans",
      playerFaction: 1,
    },
    overrides
  );
}

describe("buildGarrison", () => {
  it("carries the referee-consumed field set of a war-generation worker", () => {
    const builder = builderModule.create(makeDeps());
    const ai = builder.buildGarrison({
      rng: stubRng(),
      team: 2,
      faction: 0,
      color: [[10, 20, 30]],
      tier: 4,
    });
    assert.equal(ai.team, 2);
    assert.equal(ai.faction, 0);
    assert.deepEqual(ai.color, [[10, 20, 30]]);
    assert.equal(ai.name, "Able");
    assert.equal(ai.commander, "/pa/units/commanders/Able.json");
    assert.equal(typeof ai.econ_rate, "number");
    assert.ok(Array.isArray(ai.typeOfBuffs));
    assert.ok(Array.isArray(ai.inventory));
    assert.ok(Array.isArray(ai.minions));
    assert.equal(ai.personality.micro_type, 2);
    assert.equal(ai.personality.go_for_the_kill, true);
    assert.deepEqual(ai.personality.personality_tags, ["Default"]);
  });

  it("scales econ, buffs and minions with the tier", () => {
    const builder = builderModule.create(makeDeps());
    const atTier4 = builder.buildGarrison({
      rng: stubRng(),
      team: 0,
      faction: 0,
      color: [],
      tier: 4,
    });
    // econ (1 + 4*0.2) minus one minion-step reduction at tier 4; buffs
    // floor(4/2); minions floor(1 + 4*0.5).
    assert.ok(Math.abs(atTier4.econ_rate - 1.6) < 1e-9);
    assert.equal(atTier4.typeOfBuffs.length, 2);
    assert.equal(atTier4.minions.length, 3);

    const atTier0 = builder.buildGarrison({
      rng: stubRng(),
      team: 0,
      faction: 0,
      color: [],
      tier: 0,
    });
    assert.equal(atTier0.econ_rate, 1);
    assert.deepEqual(atTier0.typeOfBuffs, []);
    assert.equal(atTier0.minions.length, 1);
  });

  it("gives a Cluster Worker commanders instead of minions", () => {
    const builder = builderModule.create(makeDeps());
    const ai = builder.buildGarrison({
      rng: stubRng(),
      team: 1,
      faction: 4,
      color: [],
      tier: 4,
    });
    assert.equal(ai.name, "Worker");
    // clusterCommanderCount(3 minions, 2 boss commanders) = 4.
    assert.equal(ai.commanderCount, 4);
    assert.equal(ai.minions, undefined);
    assert.equal(ai.inventory[0], CLUSTER_MODS[0]);
  });

  it("returns undefined when the pool yields nothing", () => {
    const deps = makeDeps();
    deps.factions[0].minions = [];
    const builder = builderModule.create(deps);
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.equal(
        builder.buildGarrison({
          rng: stubRng(),
          team: 0,
          faction: 0,
          color: [],
          tier: 1,
        }),
        undefined
      );
    } finally {
      console.error = originalError;
    }
  });
});

describe("buildFoe", () => {
  it("builds the other faction's commander at its own tier", () => {
    const builder = builderModule.create(makeDeps());
    const foe = builder.buildFoe({ rng: stubRng(), foeFaction: 1, tier: 4 });
    assert.equal(foe.faction, 1);
    assert.equal(foe.name, "Arch");
    // round((3 + 1) / 2) commanders from tier 4's 3 minions.
    assert.equal(foe.commanderCount, 2);
    assert.ok(Array.isArray(foe.inventory));
    assert.equal(foe.typeOfBuffs, undefined);
  });

  it("applies the Cluster Worker commander rule", () => {
    const builder = builderModule.create(makeDeps());
    const foe = builder.buildFoe({ rng: stubRng(), foeFaction: 4, tier: 4 });
    assert.equal(foe.name, "Worker");
    assert.equal(foe.commanderCount, 4);
  });
});

describe("buildAlly", () => {
  it("draws from the player's faction without scaling", () => {
    const builder = builderModule.create(makeDeps());
    const ally = builder.buildAlly({ rng: stubRng() });
    assert.equal(ally.faction, 1);
    assert.equal(ally.name, "Arch");
    assert.equal(ally.econ_rate, 1);
    assert.equal(ally.penchantName, undefined);
  });

  it("applies a penchant when the ally AI is Penchant", () => {
    const builder = builderModule.create(makeDeps({ aiAllyType: "Penchant" }));
    const ally = builder.buildAlly({ rng: stubRng() });
    assert.equal(ally.penchantName, "!LOC:Raider");
    assert.deepEqual(ally.personality.personality_tags, ["Raider"]);
  });

  it("honours the Queller filter on the ally pool", () => {
    const deps = makeDeps({ aiAllyType: "Queller" });
    deps.factions[1].minions = [
      minion("NoQueller", {
        personality: { personality_tags: [], works_with_queller: false },
      }),
      minion("Slayn"),
    ];
    const builder = builderModule.create(deps);
    assert.equal(builder.buildAlly({ rng: stubRng() }).name, "Slayn");
  });
});

describe("game modifiers", () => {
  it("rolls each modifier against its own chance at capture", () => {
    const builder = builderModule.create(makeDeps());
    const ai = {};
    builder.rollGameModifiers(stubRng({ int: () => 100 }), ai);
    assert.equal(ai.landAnywhere, true);
    assert.equal(ai.suddenDeath, false);
    assert.equal(ai.bountyMode, true);
    assert.equal(ai.bountyModeValue, 0.5);
    assert.equal(ai.eradicationMode, false);
  });

  it("copies exactly the capture-time fields onto the garrison", () => {
    const builder = builderModule.create(makeDeps());
    const boss = {
      landAnywhere: true,
      suddenDeath: false,
      bountyMode: true,
      bountyModeValue: 0.5,
      eradicationMode: true,
      eradicationModeFactories: true,
      name: "not-a-modifier",
    };
    const garrison = { eradicationModeFabbers: true };
    builder.copyGameModifiers(boss, garrison);
    assert.deepEqual(garrison, {
      landAnywhere: true,
      suddenDeath: false,
      bountyMode: true,
      bountyModeValue: 0.5,
      eradicationMode: true,
      eradicationModeFactories: true,
    });
  });
});

describe("re-scaling", () => {
  it("rebuilds a garrison's econ, tech and minions at the new tier", () => {
    const builder = builderModule.create(makeDeps());
    const ai = builder.buildGarrison({
      rng: stubRng(),
      team: 0,
      faction: 0,
      color: [],
      tier: 0,
    });
    builder.refreshGarrison(stubRng(), ai, 4);
    assert.ok(Math.abs(ai.econ_rate - 1.6) < 1e-9);
    assert.equal(ai.typeOfBuffs.length, 2);
    assert.equal(ai.minions.length, 3);
  });

  it("skips the minion econ reduction for a boss", () => {
    const builder = builderModule.create(makeDeps());
    const boss = { faction: 0, personality: { personality_tags: [] } };
    builder.refreshBoss(stubRng(), boss, 4);
    // No playerCount: (1 + 4*0.2) with a neutral jitter, unreduced.
    assert.ok(Math.abs(boss.econ_rate - 1.8) < 1e-9);
    assert.equal(boss.minions.length, 3);
  });

  it("gives a Cluster boss one Security carrying the minion count", () => {
    const builder = builderModule.create(makeDeps());
    const boss = {
      faction: 4,
      isCluster: true,
      personality: { personality_tags: [] },
    };
    builder.refreshBoss(
      stubRng({ pick: (list) => list[list.length - 1] }),
      boss,
      4
    );
    assert.equal(boss.minions.length, 1);
    assert.equal(boss.minions[0].name, "Security");
    assert.equal(boss.minions[0].commanderCount, 3);
    assert.equal(boss.inventory[0], CLUSTER_MODS[0]);
  });

  it("re-derives a foe's commander count from its tier", () => {
    const builder = builderModule.create(makeDeps());
    const foe = builder.buildFoe({ rng: stubRng(), foeFaction: 1, tier: 0 });
    assert.equal(foe.commanderCount, 1);
    builder.refreshFoe(stubRng(), foe, 4);
    assert.equal(foe.commanderCount, 2);
  });
});

describe("ensureQuellerFFATags", () => {
  it("tags host, minions, foes and ally once, however often it runs", () => {
    const builder = builderModule.create(makeDeps({ aiType: "Queller" }));
    const ai = {
      personality: { personality_tags: ["bot"] },
      minions: [{ personality: { personality_tags: [] } }],
      foes: [{ personality: { personality_tags: [] } }],
      ally: { personality: { personality_tags: [] } },
    };
    builder.ensureQuellerFFATags(ai);
    builder.ensureQuellerFFATags(ai);
    assert.deepEqual(ai.personality.personality_tags, [
      "bot",
      "ffa",
      "platoon",
    ]);
    assert.deepEqual(ai.foes[0].personality.personality_tags, [
      "ffa",
      "platoon",
    ]);
    assert.deepEqual(ai.ally.personality.personality_tags, ["ffa", "platoon"]);
  });

  it("does nothing without foes or off Queller", () => {
    const quellerBuilder = builderModule.create(
      makeDeps({ aiType: "Queller" })
    );
    const noFoes = { personality: { personality_tags: [] } };
    quellerBuilder.ensureQuellerFFATags(noFoes);
    assert.deepEqual(noFoes.personality.personality_tags, []);

    const titansBuilder = builderModule.create(makeDeps());
    const withFoes = {
      personality: { personality_tags: [] },
      foes: [{ personality: { personality_tags: [] } }],
    };
    titansBuilder.ensureQuellerFFATags(withFoes);
    assert.deepEqual(withFoes.personality.personality_tags, []);
  });
});
