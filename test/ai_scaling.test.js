"use strict";

// Parity pins for shared/ai_scaling.js, extracted from gw_start/setup.js.
// The fixed-rng cases pin the exact arithmetic the extraction moved, so a
// behaviour change against the pre-extraction setup.js fails here.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const scaling = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_scaling.js"
);

// Deterministic stand-in for gwo_rng: sample takes from the front, pick takes
// the first, and float/int return fixed values a test can override.
function stubRng(overrides) {
  return Object.assign(
    {
      float: () => 1,
      int: () => 1,
      pick: (list) => list[0],
      sample: (list, n) => (n > 0 ? list.slice(0, n) : []),
      shuffle: (list) => list,
    },
    overrides
  );
}

describe("buffTypes", () => {
  it("keeps the ai_tech indices, with 5 absent", () => {
    assert.deepEqual(scaling.buffTypes, {
      cost: 0,
      damage: 1,
      health: 2,
      speed: 3,
      build: 4,
      combat: 6,
      cooldown: 7,
    });
    assert.ok(!_valuesInclude(scaling.buffTypes, 5));
  });
});

function _valuesInclude(object, value) {
  return Object.keys(object).some((key) => object[key] === value);
}

describe("buffs", () => {
  it("grants floor(distance / 2 - handicap) buffs", () => {
    assert.equal(scaling.buffs(stubRng(), 6, 1).length, 2);
  });

  it("clamps a negative count to no buffs", () => {
    assert.deepEqual(scaling.buffs(stubRng(), 1, 2), []);
  });
});

describe("applyTech", () => {
  it("concatenates each buff's descriptors in buff order", () => {
    const tech = { 0: { 1: ["dmg"], 2: ["hp"] } };
    assert.deepEqual(scaling.applyTech([2, 1], ["base"], 0, tech), [
      "base",
      "hp",
      "dmg",
    ]);
  });

  it("returns the inventory unchanged for no buffs", () => {
    assert.deepEqual(scaling.applyTech([], ["base"], 0, {}), ["base"]);
  });
});

describe("countMinions", () => {
  it("floors base + distance * step", () => {
    assert.equal(scaling.countMinions(1, 0.5, 3), 2);
  });
});

describe("conquestBossTier", () => {
  it("reaches the rim scale exactly at the faction's fair share", () => {
    // 36 stars split among 3 bosses + player: fair share 9, maxDist 8.
    assert.equal(scaling.conquestBossTier(9, 3, 8, 36), 8);
  });

  it("keeps a one-system boss at tier 1 on a large galaxy", () => {
    assert.equal(scaling.conquestBossTier(1, 4, 18, 234), 1);
  });

  it("scales past maxDist beyond the fair share", () => {
    assert.equal(scaling.conquestBossTier(18, 3, 8, 36), 16);
  });
});

describe("clusterCommanderCount", () => {
  it("adds half the boss commanders, floored", () => {
    assert.equal(scaling.clusterCommanderCount(3, 5), 5);
  });
});

describe("econRate", () => {
  const cfg = {
    econBase: 1,
    econRatePerDist: 0.2,
    mandatoryMinions: 1,
    minionMod: 0.5,
  };

  it("scales with distance under a neutral jitter", () => {
    assert.equal(scaling.econRate(stubRng(), 5, cfg), 2);
  });

  it("applies the rng jitter multiplicatively", () => {
    const rng = stubRng({ float: () => 1.1 });
    assert.ok(Math.abs(scaling.econRate(rng, 5, cfg) - 2.2) < 1e-9);
  });

  it("never returns below the econ base", () => {
    const rng = stubRng({ float: () => 0.9 });
    assert.equal(scaling.econRate(rng, 0, cfg), cfg.econBase);
  });

  it("steps the rate down on a distance that adds a minion", () => {
    // playerCount 1: minions go 1 -> 2 between distance 1 and 2, so distance 2
    // pays one econRatePerDist back.
    const withPlayers = Object.assign({ playerCount: 1 }, cfg);
    const withoutPlayers = cfg;
    assert.equal(
      scaling.econRate(stubRng(), 2, withPlayers),
      scaling.econRate(stubRng(), 2, withoutPlayers) - cfg.econRatePerDist
    );
  });

  it("skips the minion reduction when playerCount is omitted", () => {
    assert.equal(scaling.econRate(stubRng(), 2, cfg), 1.4);
  });
});

describe("gameModeEnabled", () => {
  it("fires when the roll is within the chance", () => {
    assert.equal(scaling.gameModeEnabled(stubRng({ int: () => 10 }), 10), true);
  });

  it("misses when the roll exceeds the chance", () => {
    assert.equal(
      scaling.gameModeEnabled(stubRng({ int: () => 11 }), 10),
      false
    );
  });
});

describe("enableEradicationModeTypes", () => {
  it("flags the sampled eradication modes on the ai", () => {
    const ai = {};
    scaling.enableEradicationModeTypes(stubRng({ int: () => 2 }), ai);
    assert.equal(ai.eradicationModeSubCommanders, true);
    assert.equal(ai.eradicationModeFactories, true);
    assert.equal(ai.eradicationModeFabbers, undefined);
  });
});

describe("selectMinion", () => {
  const minions = [
    { name: "Alpha", personality: {} },
    { name: "Worker", personality: {} },
  ];

  it("deep-clones a pick from the full pool", () => {
    const minion = scaling.selectMinion(stubRng(), minions, 0);
    assert.deepEqual(minion, minions[0]);
    assert.notEqual(minion, minions[0]);
    assert.notEqual(minion.personality, minions[0].personality);
  });

  it("filters to the named Cluster minion", () => {
    const minion = scaling.selectMinion(stubRng(), minions, 4, "Worker");
    assert.equal(minion.name, "Worker");
  });

  it("returns undefined when the pool yields nothing", () => {
    const silenced = silenceConsoleError();
    try {
      assert.equal(scaling.selectMinion(stubRng(), [], 0), undefined);
    } finally {
      silenced.restore();
    }
  });
});

function silenceConsoleError() {
  const original = console.error;
  console.error = () => {};
  return {
    restore: () => {
      console.error = original;
    },
  };
}

describe("quellerTags", () => {
  it("maps each faction to its tags", () => {
    assert.deepEqual(scaling.quellerTags(0), ["tank", "queller"]);
    assert.deepEqual(scaling.quellerTags(1), ["air", "queller"]);
    assert.deepEqual(scaling.quellerTags(2), ["bot", "queller"]);
    assert.deepEqual(scaling.quellerTags(3), ["orbital", "queller"]);
    assert.deepEqual(scaling.quellerTags(4), ["land", "queller"]);
  });

  it("returns undefined for an unknown faction", () => {
    assert.equal(scaling.quellerTags(5), undefined);
  });
});

describe("applyPenchant", () => {
  const penchantsFn = () => ({
    penchants: ["Raider"],
    penchantName: "!LOC:Raider",
  });

  it("concats penchant and titans tags and records the name", () => {
    const ai = { personality: { personality_tags: ["base"] } };
    scaling.applyPenchant(stubRng(), ai, ["Default"], penchantsFn);
    assert.deepEqual(ai.personality.personality_tags, [
      "base",
      "Raider",
      "Default",
    ]);
    assert.equal(ai.penchantName, "!LOC:Raider");
  });

  it("appends nothing extra when titans tags are omitted", () => {
    const ai = { personality: { personality_tags: [] } };
    scaling.applyPenchant(stubRng(), ai, undefined, penchantsFn);
    assert.deepEqual(ai.personality.personality_tags, ["Raider"]);
  });
});

describe("applyPersonality", () => {
  const penchantsFn = () => ({ penchants: [], penchantName: "" });

  function settings(overrides) {
    return Object.assign(
      {
        microType: 2,
        goForKill: true,
        priorityScoutMetalSpots: false,
        factoryBuildDelayMin: 1,
        factoryBuildDelayMax: 5,
        unableToExpandDelay: 30,
        enableCommanderDangerResponses: true,
        perExpansionDelay: 10,
        maxBasicFabbers: 6,
        maxAdvancedFabbers: 4,
        startingLocationEvaluationRadius: 0,
        personalityTags: ["Picked"],
        aiType: "Titans",
        faction: 0,
      },
      overrides
    );
  }

  it("writes every difficulty field onto the personality", () => {
    const ai = { personality: {} };
    assert.equal(
      scaling.applyPersonality(stubRng(), ai, settings(), penchantsFn),
      true
    );
    const p = ai.personality;
    assert.equal(p.micro_type, 2);
    assert.equal(p.go_for_the_kill, true);
    assert.equal(p.priority_scout_metal_spots, false);
    assert.equal(p.factory_build_delay_min, 1);
    assert.equal(p.factory_build_delay_max, 5);
    assert.equal(p.unable_to_expand_delay, 30);
    assert.equal(p.enable_commander_danger_responses, true);
    assert.equal(p.per_expansion_delay, 10);
    assert.equal(p.max_basic_fabbers, 6);
    assert.equal(p.max_advanced_fabbers, 4);
    assert.deepEqual(p.personality_tags, ["Picked", "Default"]);
  });

  it("omits the evaluation radius at 0 so the AI examines the spawn zone", () => {
    const ai = { personality: {} };
    scaling.applyPersonality(stubRng(), ai, settings(), penchantsFn);
    assert.ok(!("starting_location_evaluation_radius" in ai.personality));
  });

  it("writes a positive evaluation radius", () => {
    const ai = { personality: {} };
    scaling.applyPersonality(
      stubRng(),
      ai,
      settings({ startingLocationEvaluationRadius: 120 }),
      penchantsFn
    );
    assert.equal(ai.personality.starting_location_evaluation_radius, 120);
  });

  it("copies the picked tags rather than sharing the array", () => {
    const picked = ["Picked"];
    const first = { personality: {} };
    scaling.applyPersonality(
      stubRng(),
      first,
      settings({ personalityTags: picked, aiType: "Bogus" }),
      penchantsFn
    );
    first.personality.personality_tags.push("mutated");
    assert.deepEqual(picked, ["Picked"]);
  });

  it("routes Penchant through the injected penchants function", () => {
    const ai = { personality: {} };
    scaling.applyPersonality(
      stubRng(),
      ai,
      settings({ aiType: "Penchant" }),
      () => ({ penchants: ["Nuker"], penchantName: "!LOC:Nuker" })
    );
    assert.deepEqual(ai.personality.personality_tags, [
      "Picked",
      "Nuker",
      "Default",
    ]);
    assert.equal(ai.penchantName, "!LOC:Nuker");
  });

  it("concats the faction's Queller tags", () => {
    const ai = { personality: {} };
    assert.equal(
      scaling.applyPersonality(
        stubRng(),
        ai,
        settings({ aiType: "Queller", faction: 2 }),
        penchantsFn
      ),
      true
    );
    assert.deepEqual(ai.personality.personality_tags, [
      "Picked",
      "bot",
      "queller",
    ]);
  });

  it("fails on a Queller AI with an unknown faction, without an undefined tag", () => {
    const ai = { personality: {} };
    const silenced = silenceConsoleError();
    try {
      assert.equal(
        scaling.applyPersonality(
          stubRng(),
          ai,
          settings({ aiType: "Queller", faction: 9 }),
          penchantsFn
        ),
        false
      );
    } finally {
      silenced.restore();
    }
    assert.deepEqual(ai.personality.personality_tags, ["Picked"]);
  });

  it("fails on an unknown AI type", () => {
    const silenced = silenceConsoleError();
    try {
      assert.equal(
        scaling.applyPersonality(
          stubRng(),
          { personality: {} },
          settings({ aiType: "Bogus" }),
          penchantsFn
        ),
        false
      );
    } finally {
      silenced.restore();
    }
  });
});

describe("applyQuellerFFATags", () => {
  it("tags a single ai", () => {
    const ai = { personality: { personality_tags: [] } };
    scaling.applyQuellerFFATags(ai);
    assert.deepEqual(ai.personality.personality_tags, ["ffa", "platoon"]);
  });

  it("tags every ai in an array", () => {
    const ais = [
      { personality: { personality_tags: ["a"] } },
      { personality: { personality_tags: [] } },
    ];
    scaling.applyQuellerFFATags(ais);
    assert.deepEqual(ais[0].personality.personality_tags, [
      "a",
      "ffa",
      "platoon",
    ]);
    assert.deepEqual(ais[1].personality.personality_tags, ["ffa", "platoon"]);
  });

  it("ignores a missing ai", () => {
    scaling.applyQuellerFFATags(undefined);
  });
});

describe("startCardBreaksAllies", () => {
  it("flags the built-in ally-breaking loadouts", () => {
    assert.equal(scaling.startCardBreaksAllies("nem_start_deepspace"), true);
    assert.equal(scaling.startCardBreaksAllies("gwaio_start_tourist"), true);
  });

  it("flags a modder-registered loadout", () => {
    assert.equal(scaling.startCardBreaksAllies("mod_card", ["mod_card"]), true);
  });

  it("passes any other loadout", () => {
    assert.equal(scaling.startCardBreaksAllies("gwc_start_air"), false);
    assert.equal(scaling.startCardBreaksAllies("gwc_start_air", []), false);
  });
});
