"use strict";

// The battle-config referee builds every army's personality from what the war
// recorded - its personalityId, the tier and the brain - in the measured
// gw_play/referee_config_setup.js, so a balance change reaches a war in progress.

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
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const gwoPersonality = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js"
);
const personalities = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js"
);

const installModel = useModel();
const GOLD = gwoAI.warTier({ difficulty: "!LOC:Gold" });

// A boss the base game's ramp wrote over before the war was saved.
function dirtyBoss(overrides) {
  return makeAiDescriptor(
    Object.assign(
      {
        boss: true,
        faction: 0,
        personalityId: "legonisMachinaBoss",
        personality: {
          energy_demand_check: 0.48,
          adv_eco_mod: 1,
          adv_eco_mod_alone: 1,
          personality_tags: ["stale"],
        },
      },
      overrides || {}
    )
  );
}

function primary(ai, options) {
  const opts = options || {};
  const fixture = buildGame(
    Object.assign({ aiInUse: "Titans", difficultyName: "!LOC:Gold" }, opts)
  );
  installModel(fixture.game);
  const armies = [];
  refereeConfig.setupPrimaryAiAndMinions(
    ai,
    opts.cards || [],
    [".ai0", ".ai1"],
    armies
  );
  return armies;
}

describe("enemy personalities at launch", () => {
  it("rebuilds a boss from its id, the tier and its brain, not the stored object", () => {
    const boss = dirtyBoss();
    const armies = primary(boss);
    const personality = armies[0].personality;

    assert.equal(personality.energy_demand_check, 0.8);
    assert.equal(personality.fabber_to_factory_ratio_basic, 2);
    assert.equal(personality.micro_type, GOLD.microType);
    assert.equal(personality.go_for_the_kill, GOLD.goForKill === "true");
    assert.deepEqual(
      personality.personality_tags,
      GOLD.personality_tags.concat(["Default"])
    );
    // The war's own record is untouched.
    assert.equal(boss.personality.energy_demand_check, 0.48);
  });

  it("writes ai_path and the eco scaling onto the object the army holds", () => {
    const boss = dirtyBoss({ econ_rate: 5 });
    const armies = primary(boss);
    const personality = armies[0].personality;
    const base = gwoPersonality.base("legonisMachinaBoss", 0);

    assert.equal(personality.ai_path, "/pa/ai/");
    assert.equal(personality.adv_eco_mod, base.adv_eco_mod * 5);
    assert.equal(personality.display_name, "!LOC:None");
  });

  it("gives Queller armies their faction tags, and the FFA tags when the star has foes", () => {
    const boss = dirtyBoss({
      minions: [makeAiDescriptor({ personalityId: "armour", personality: {} })],
      foes: [makeAiDescriptor({ faction: 2, personalityId: "grunt" })],
    });
    const armies = primary(boss, { aiInUse: "Queller" });

    assert.deepEqual(
      armies[0].personality.personality_tags,
      GOLD.personality_tags.concat(["tank", "queller", "ffa", "platoon"])
    );
    assert.deepEqual(
      armies[1].personality.personality_tags,
      GOLD.personality_tags.concat(["tank", "queller", "ffa", "platoon"])
    );
    assert.equal(armies[1].personality.percent_vehicle, 1);
  });

  it("keeps a Titans star's tags free of FFA tags even with foes", () => {
    const boss = dirtyBoss({
      foes: [makeAiDescriptor({ faction: 2, personalityId: "grunt" })],
    });
    const armies = primary(boss);
    assert.ok(!armies[0].personality.personality_tags.includes("ffa"));
  });

  it("builds a foe from its own faction and brain, always in an FFA", () => {
    const fixture = buildGame({
      aiInUse: "Queller",
      difficultyName: "!LOC:Gold",
    });
    installModel(fixture.game);
    const armies = [];
    refereeConfig.setupFfaAis(
      [makeAiDescriptor({ faction: 2, personalityId: "grunt" })],
      [".ai0", ".ai1"],
      armies
    );
    const personality = armies[0].personality;
    assert.equal(personality.percent_bot, personalities.grunt.percent_bot);
    assert.deepEqual(
      personality.personality_tags,
      GOLD.personality_tags.concat(["bot", "queller", "ffa", "platoon"])
    );
  });

  it("keeps a war's stored personality for an AI saved without an id, tier overlaid", () => {
    const legacy = makeAiDescriptor({
      faction: 0,
      personality: {
        energy_demand_check: 0.48,
        micro_type: 0,
        adv_eco_mod: 1,
        adv_eco_mod_alone: 1,
        personality_tags: ["kept", "ffa", "platoon"],
      },
      foes: [makeAiDescriptor({ faction: 2 })],
    });
    const armies = primary(legacy, { aiInUse: "Queller" });
    const personality = armies[0].personality;

    assert.equal(personality.energy_demand_check, 0.48);
    assert.equal(personality.micro_type, GOLD.microType);
    assert.deepEqual(personality.personality_tags, ["kept", "ffa", "platoon"]);
  });

  it("still recomputes the Guardians' unit mix from the players' cards", () => {
    const guardians = dirtyBoss({ mirrorMode: true });
    const armies = primary(guardians, {
      aiInUse: "Queller",
      cards: [{ id: "gwc_combat_air" }],
    });
    const personality = armies[0].personality;
    assert.equal(personality.percent_air, 1);
    assert.deepEqual(personality.personality_tags, ["queller", "air"]);
  });
});

describe("allied personalities at launch", () => {
  function allies(options) {
    const opts = options || {};
    const fixture = buildGame(
      Object.assign(
        {
          aiInUse: "Titans",
          aiAllyInUse: "Titans",
          difficultyName: "!LOC:Gold",
        },
        opts
      )
    );
    installModel(fixture.game);
    const armies = [];
    refereeConfig.setupAlliedCommanders(
      opts.allies,
      opts.cards || [],
      armies,
      fixture.inventory,
      ".player",
      0,
      undefined,
      opts.options
    );
    return armies;
  }

  it("builds a Sub Commander from its id against the player's faction, without the tier", () => {
    const armies = allies({
      allies: [
        makeAiDescriptor({
          personalityId: "armour",
          personality: { energy_demand_check: 0.48 },
        }),
      ],
    });
    const personality = armies[0].personality;
    const expected = gwoPersonality.base("armour", 1);

    assert.equal(personality.energy_demand_check, expected.energy_demand_check);
    assert.equal(personality.micro_type, expected.micro_type);
    assert.deepEqual(personality.personality_tags, expected.personality_tags);
    assert.equal(personality.ai_path, "/pa/ai/");
  });

  it("adds a recorded penchant's tags, and the FFA tags only when asked under Queller", () => {
    const withPenchant = allies({
      allies: [
        makeAiDescriptor({
          personalityId: "armour",
          penchantName: "!LOC:Platoon",
        }),
      ],
    });
    assert.deepEqual(withPenchant[0].personality.personality_tags.slice(-2), [
      "Platoon",
      "PenchantPlatoon",
    ]);

    const starAlly = allies({
      aiAllyInUse: "Queller",
      allies: [makeAiDescriptor({ personalityId: "armour" })],
      options: { ffa: true },
    });
    assert.deepEqual(starAlly[0].personality.personality_tags.slice(-2), [
      "ffa",
      "platoon",
    ]);

    const subCommander = allies({
      aiAllyInUse: "Queller",
      allies: [makeAiDescriptor({ personalityId: "armour" })],
    });
    assert.ok(!subCommander[0].personality.personality_tags.includes("ffa"));
  });

  it("keeps a Sub Commander saved without an id as it was", () => {
    const stored = {
      max_basic_fabbers: 4,
      personality_tags: ["SlowerExpansion", "Rush"],
    };
    const armies = allies({
      allies: [makeAiDescriptor({ personality: stored })],
    });
    assert.deepEqual(
      armies[0].personality.personality_tags,
      stored.personality_tags
    );
    assert.equal(armies[0].personality.max_basic_fabbers, 4);
    assert.notEqual(armies[0].personality, stored);
  });
});
