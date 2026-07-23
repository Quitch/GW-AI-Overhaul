"use strict";

// Unit tests for shared/referee_subcommander_tech.js: the three tech-card mutators
// that rewrite an AI personality when the matching subcommander upgrade card is held.
// The module is a plain define(function(){...}) over lodash only (no engine globals),
// so it loads directly under the Node AMD harness. Existing suites already exercise
// hasSmartSubcommanders and the card-absent branches; these cover the card-present
// true-branches, which encode the actual AI behaviour change.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const subcommanderTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js"
);

const TACTICS_CARD = { id: "gwaio_upgrade_subcommander_tactics" };
const FABBER_CARD = { id: "gwaio_upgrade_subcommander_fabber" };
const DUPLICATION_CARD = { id: "gwaio_upgrade_subcommander_duplication" };

describe("applySubcommanderTacticsTech", () => {
  it("rewrites the personality for aggression when the tactics card is held", () => {
    const personality = {
      personality_tags: ["SlowerExpansion", "SomethingElse"],
    };

    const result = subcommanderTech.applySubcommanderTacticsTech(personality, [
      TACTICS_CARD,
    ]);

    assert.equal(result, personality); // mutates and returns the same object
    assert.equal(result.micro_type, 2);
    assert.equal(result.go_for_the_kill, true);
    assert.equal(result.priority_scout_metal_spots, true);
    assert.equal(result.enable_commander_danger_responses, true);
    assert.ok(!result.personality_tags.includes("SlowerExpansion"));
    assert.ok(result.personality_tags.includes("PreventsWaste"));
    assert.ok(result.personality_tags.includes("SomethingElse")); // untouched tags stay
  });

  it("leaves the personality unchanged when the tactics card is absent", () => {
    const personality = { personality_tags: ["SlowerExpansion"] };

    const result = subcommanderTech.applySubcommanderTacticsTech(personality, [
      FABBER_CARD,
    ]);

    assert.equal(result.micro_type, undefined);
    assert.deepEqual(result.personality_tags, ["SlowerExpansion"]);
  });
});

describe("applySubcommanderFabberTech", () => {
  it("scales the fabber caps by 1.5 (rounded) when the fabber card is held", () => {
    const personality = { max_basic_fabbers: 5, max_advanced_fabbers: 3 };

    const result = subcommanderTech.applySubcommanderFabberTech(personality, [
      FABBER_CARD,
    ]);

    assert.equal(result, personality);
    assert.equal(result.max_basic_fabbers, 8); // round(5 * 1.5 = 7.5) -> 8
    assert.equal(result.max_advanced_fabbers, 5); // round(3 * 1.5 = 4.5) -> 5
  });

  it("leaves the fabber caps unchanged when the fabber card is absent", () => {
    const personality = { max_basic_fabbers: 5, max_advanced_fabbers: 3 };

    subcommanderTech.applySubcommanderFabberTech(personality, [TACTICS_CARD]);

    assert.equal(personality.max_basic_fabbers, 5);
    assert.equal(personality.max_advanced_fabbers, 3);
  });
});

describe("applySubcommanderDuplicationTech", () => {
  it("returns 2 when the duplication card is held", () => {
    assert.equal(
      subcommanderTech.applySubcommanderDuplicationTech([DUPLICATION_CARD]),
      2
    );
  });

  it("returns 1 when the duplication card is absent", () => {
    assert.equal(
      subcommanderTech.applySubcommanderDuplicationTech([TACTICS_CARD]),
      1
    );
  });
});
