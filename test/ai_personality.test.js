"use strict";

// shared/ai_personality.js: the personality an AI fights with, built from
// what the war records rather than edited onto the faction templates.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const gwoPersonality = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js"
);
const personalities = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js"
);

const TIER = {
  microType: 2,
  goForKill: "true",
  priority_scout_metal_spots: "false",
  factory_build_delay_min: 5,
  factory_build_delay_max: 10,
  unable_to_expand_delay: 60,
  enable_commander_danger_responses: "true",
  per_expansion_delay: 120,
  max_basic_fabbers: 8,
  max_advanced_fabbers: 4,
  starting_location_evaluation_radius: 100,
  personality_tags: ["SlowerExpansion"],
};

const snapshot = () => JSON.stringify(personalities);

describe("applyTier", () => {
  it("writes the tier's settings, coercing the string booleans", () => {
    const personality = gwoPersonality.applyTier({}, TIER);
    assert.deepEqual(personality, {
      micro_type: 2,
      go_for_the_kill: true,
      priority_scout_metal_spots: false,
      factory_build_delay_min: 5,
      factory_build_delay_max: 10,
      unable_to_expand_delay: 60,
      enable_commander_danger_responses: true,
      per_expansion_delay: 120,
      max_basic_fabbers: 8,
      max_advanced_fabbers: 4,
      starting_location_evaluation_radius: 100,
    });
  });

  it("accepts real booleans too", () => {
    const personality = gwoPersonality.applyTier({}, { goForKill: true });
    assert.equal(personality.go_for_the_kill, true);
  });

  it("leaves the radius unset at 0, and untouched for a tier without one", () => {
    assert.ok(
      !(
        "starting_location_evaluation_radius" in
        gwoPersonality.applyTier(
          {},
          Object.assign({}, TIER, { starting_location_evaluation_radius: 0 })
        )
      )
    );
    const kept = gwoPersonality.applyTier(
      { starting_location_evaluation_radius: 50 },
      { microType: 1 }
    );
    assert.equal(kept.starting_location_evaluation_radius, 50);
  });

  it("is a no-op without a tier", () => {
    assert.deepEqual(gwoPersonality.applyTier({ a: 1 }, undefined), { a: 1 });
  });
});

describe("brainTags", () => {
  it("gives Titans its defaults and Queller its faction orders", () => {
    assert.deepEqual(gwoPersonality.brainTags("Titans", 0), ["Default"]);
    assert.deepEqual(gwoPersonality.brainTags("Queller", 0), [
      "tank",
      "queller",
    ]);
    assert.deepEqual(gwoPersonality.brainTags("Queller", 1), [
      "air",
      "queller",
    ]);
    assert.deepEqual(gwoPersonality.brainTags("Queller", 2), [
      "bot",
      "queller",
    ]);
    assert.deepEqual(gwoPersonality.brainTags("Queller", 3), [
      "orbital",
      "queller",
    ]);
    assert.deepEqual(gwoPersonality.brainTags("Queller", 4), [
      "land",
      "queller",
    ]);
  });

  it("gives Penchant its drawn tags plus the defaults", () => {
    assert.deepEqual(gwoPersonality.brainTags("Penchant", 0, ["Rush"]), [
      "Rush",
      "Default",
    ]);
    assert.deepEqual(gwoPersonality.brainTags("Penchant", 0), ["Default"]);
  });

  it("gives nothing for an unknown brain or a faction Queller does not know", () => {
    assert.deepEqual(gwoPersonality.brainTags("Nobody", 0), []);
    assert.deepEqual(gwoPersonality.quellerTags(9), []);
  });
});

describe("resolve", () => {
  const enemy = (overrides) =>
    Object.assign({ personalityId: "armour", faction: 0 }, overrides);

  it("builds an enemy from its id, the tier and its brain, as a new object", () => {
    const before = snapshot();
    const stored = { energy_demand_check: 0.48, personality_tags: ["stale"] };
    const ai = enemy({ personality: stored });
    const personality = gwoPersonality.resolve(ai, {
      side: "enemy",
      faction: 0,
      tier: TIER,
      brain: "Titans",
    });

    assert.equal(personality.energy_demand_check, 0.8);
    assert.equal(personality.percent_vehicle, 1);
    assert.equal(personality.micro_type, 2);
    assert.equal(personality.go_for_the_kill, true);
    assert.deepEqual(personality.personality_tags, [
      "SlowerExpansion",
      "Default",
    ]);
    assert.notEqual(personality, stored);
    assert.deepEqual(stored, {
      energy_demand_check: 0.48,
      personality_tags: ["stale"],
    });
    assert.equal(snapshot(), before);
  });

  it("restores a boss the base game's ramp had written over", () => {
    const personality = gwoPersonality.resolve(
      {
        personalityId: "legonisMachinaBoss",
        personality: { energy_demand_check: 0.48 },
      },
      { side: "enemy", faction: 0, tier: TIER, brain: "Titans" }
    );
    assert.equal(personality.energy_demand_check, 0.8);
    assert.equal(personality.fabber_to_factory_ratio_basic, 2);
  });

  it("adds a Penchant enemy's drawn tags and a Queller enemy's faction tags", () => {
    const penchant = gwoPersonality.resolve(enemy(), {
      side: "enemy",
      faction: 0,
      tier: TIER,
      brain: "Penchant",
      penchantTags: ["Rush"],
    });
    assert.deepEqual(penchant.personality_tags, [
      "SlowerExpansion",
      "Rush",
      "Default",
    ]);
    const queller = gwoPersonality.resolve(enemy(), {
      side: "enemy",
      faction: 0,
      tier: TIER,
      brain: "Queller",
    });
    assert.deepEqual(queller.personality_tags, [
      "SlowerExpansion",
      "tank",
      "queller",
    ]);
  });

  it("appends the FFA tags only to a Queller army asked for them", () => {
    const queller = gwoPersonality.resolve(enemy(), {
      side: "enemy",
      faction: 0,
      tier: TIER,
      brain: "Queller",
      ffa: true,
    });
    assert.deepEqual(queller.personality_tags.slice(-2), ["ffa", "platoon"]);
    const titans = gwoPersonality.resolve(enemy(), {
      side: "enemy",
      faction: 0,
      tier: TIER,
      brain: "Titans",
      ffa: true,
    });
    assert.ok(!titans.personality_tags.includes("ffa"));
  });

  it("builds an ally from its id with its template tags plus its penchant, no tier", () => {
    const personality = gwoPersonality.resolve(enemy(), {
      side: "ally",
      faction: 0,
      tier: TIER,
      brain: "Penchant",
      penchantTags: ["Rush"],
    });
    assert.deepEqual(
      personality.personality_tags,
      personalities.legonisMachina.personality_tags.concat(["Rush"])
    );
    // No tier applied: the template's own micro_type, not TIER's.
    assert.equal(
      personality.micro_type,
      personalities.legonisMachina.micro_type
    );
    assert.notEqual(personality.micro_type, TIER.microType);
    assert.equal(personality.percent_vehicle, 1);
  });

  it("keeps a stored personality without an id, overlaying the tier only", () => {
    const stored = {
      energy_demand_check: 0.48,
      micro_type: 0,
      personality_tags: ["kept", "ffa", "platoon"],
    };
    const personality = gwoPersonality.resolve(
      { personality: stored, faction: 0 },
      { side: "enemy", faction: 0, tier: TIER, brain: "Queller", ffa: true }
    );
    assert.equal(personality.energy_demand_check, 0.48);
    assert.equal(personality.micro_type, 2);
    assert.deepEqual(personality.personality_tags, ["kept", "ffa", "platoon"]);
    assert.notEqual(personality, stored);
    assert.equal(stored.micro_type, 0);
  });

  it("treats an id no longer shipped like no id, and copes with no personality at all", () => {
    const stored = { energy_demand_check: 0.5 };
    assert.equal(
      gwoPersonality.resolve(
        { personalityId: "retired", personality: stored },
        { side: "enemy", faction: 0, tier: TIER, brain: "Titans" }
      ).energy_demand_check,
      0.5
    );
    assert.deepEqual(gwoPersonality.resolve({}, { side: "ally" }), {});
  });
});
