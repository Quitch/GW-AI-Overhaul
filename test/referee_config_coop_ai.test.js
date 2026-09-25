"use strict";

// The co-op AI players' armies: setupCoopAiArmies in the measured
// gw_play/referee_config_setup.js, and where gw_play/referee_config.js puts
// them. See coop.md, "AI players".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeAiDescriptor,
} = require("../scripts/lib/ai-path-fixtures.js");
const {
  COMMANDER,
  coopAiEntry,
} = require("../scripts/lib/coop-ai-fixtures.js");

const configSetup = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
);
const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const gwoPersonality = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

const installModel = useModel();
const GOLD = gwoAI.warTier({ difficulty: "!LOC:Gold" });
const LANDINGS = ["off_player_planet", "on_player_planet", "no_restriction"];

function armiesFor(entries, options) {
  const opts = Object.assign({ playerFaction: 0, ffa: false }, options);
  const fixture = buildGame({
    aiInUse: "Titans",
    difficultyName: "!LOC:Gold",
  });
  installModel(fixture.game);
  const armies = [];
  configSetup.setupCoopAiArmies(
    entries,
    armies,
    opts.rng === undefined ? gwoRng.create("battle") : opts.rng,
    { playerFaction: opts.playerFaction, ffa: opts.ffa }
  );
  return armies;
}

describe("setupCoopAiArmies", () => {
  it("builds an allied AI army per entry", () => {
    const entry = coopAiEntry();
    const armies = armiesFor([entry]);

    assert.equal(armies.length, 1);
    const army = armies[0];
    assert.equal(army.slots.length, 1);
    assert.equal(army.slots[0].ai, true);
    assert.equal(army.slots[0].name, "Sorian");
    assert.ok(LANDINGS.includes(army.slots[0].landing_policy));
    assert.deepEqual(army.color, entry.colour);
    assert.notEqual(army.color, entry.colour);
    assert.equal(army.econ_rate, gwoAI.subcommanderEconRate);
    assert.equal(army.spec_tag, ".player");
    assert.equal(army.alliance_group, 1);
    assert.equal(army.personality.ai_path, "/pa/ai/player_coopai/");
    assert.equal(army.personality.display_name, "!LOC:Absurd");
  });

  // referee_config.js tags every other army's commander in one loop; these
  // join afterwards, carrying their tag already.
  it("tags the commander with the entry's tag, once", () => {
    const armies = armiesFor([
      coopAiEntry(),
      coopAiEntry({ id: "gwo_ai_2", slot: 1, tag: ".player3" }),
    ]);
    assert.equal(armies[0].slots[0].commander, COMMANDER + ".player");
    assert.equal(armies[1].slots[0].commander, COMMANDER + ".player3");
  });

  it("fights at the war's tier on its own brain's tags", () => {
    const queller = armiesFor([
      coopAiEntry({ brain: "Queller", personalityId: "uber" }),
    ])[0].personality;
    assert.deepEqual(
      queller.personality_tags,
      GOLD.personality_tags.concat(["tank", "queller"])
    );
    assert.equal(queller.micro_type, GOLD.microType);

    const titans = armiesFor([coopAiEntry()])[0].personality;
    assert.deepEqual(
      titans.personality_tags,
      GOLD.personality_tags.concat(["Default"])
    );

    const penchant = armiesFor([
      coopAiEntry({ brain: "Penchant", penchantName: "!LOC:Artillery" }),
    ])[0].personality;
    assert.deepEqual(
      penchant.personality_tags,
      GOLD.personality_tags.concat(["Artillery", "Default"])
    );
    assert.equal(penchant.display_name, "!LOC:Absurd !LOC:Artillery");
  });

  it("takes Queller's FFA tags on a star with foes", () => {
    const personality = armiesFor(
      [coopAiEntry({ brain: "Queller", personalityId: "uber" })],
      { ffa: true, playerFaction: 1 }
    )[0].personality;
    assert.deepEqual(
      personality.personality_tags,
      GOLD.personality_tags.concat(["air", "queller", "ffa", "platoon"])
    );
  });

  // The eco floor is the enemy's cheat; an AI player fields the players'
  // economy.
  it("takes no eco scaling", () => {
    const personality = armiesFor([coopAiEntry()])[0].personality;
    const base = gwoPersonality.base("absurd", 0);
    assert.equal(personality.adv_eco_mod, base.adv_eco_mod);
    assert.equal(personality.adv_eco_mod_alone, base.adv_eco_mod_alone);
  });

  it("builds the template the player faction names", () => {
    const personality = armiesFor([coopAiEntry({ personalityId: "uber" })], {
      playerFaction: 2,
    })[0].personality;
    const base = gwoPersonality.base("uber", 2);
    assert.equal(personality.percent_bot, base.percent_bot);
    assert.equal(personality.energy_drain_check, base.energy_drain_check);
  });

  it("builds fresh armies on every run and never edits its entries", () => {
    const entry = coopAiEntry();
    const before = JSON.stringify(entry);
    const first = armiesFor([entry]);
    const second = armiesFor([entry]);

    assert.deepEqual(first, second);
    assert.notEqual(first[0].personality, second[0].personality);
    assert.equal(JSON.stringify(entry), before);
  });

  it("draws each AI's landing from the battle's stream", () => {
    const entries = [coopAiEntry(), coopAiEntry({ id: "gwo_ai_2", slot: 1 })];
    assert.deepEqual(
      armiesFor(entries).map((army) => army.slots[0].landing_policy),
      armiesFor(entries).map((army) => army.slots[0].landing_policy)
    );
    // A war saved before seeds draws unseeded.
    assert.ok(
      LANDINGS.includes(
        armiesFor(entries, { rng: null })[0].slots[0].landing_policy
      )
    );
  });

  it("adds nothing without entries", () => {
    assert.deepEqual(armiesFor([]), []);
  });
});

describe("referee_config.js with co-op AI players", () => {
  function generate(coopAis) {
    const fixture = buildGame({
      aiInUse: "Titans",
      difficultyName: "!LOC:Gold",
    });
    fixture.inventory.hasCard = () => false;
    Object.assign(fixture.ai, makeAiDescriptor({ foes: [] }));
    Object.assign(fixture.star.system(), {
      name: "Test System",
      planets: [],
    });
    fixture.game.stats = () => ({ turns: () => 1 });
    fixture.game.save = () => ({});
    installModel(fixture.game, []);
    global.model.displayName = () => "Tester";

    let config;
    refereeConfig.call({
      game: () => fixture.game,
      files: () => ({}),
      biomeServed: {},
      coopAis: coopAis,
      config: (value) => {
        config = value;
      },
    });
    return config;
  }

  it("appends the AI armies last, their commanders tagged once", () => {
    const config = generate([coopAiEntry()]);
    const last = config.armies[config.armies.length - 1];

    assert.equal(last.slots[0].name, "Sorian");
    assert.equal(last.slots[0].commander, COMMANDER + ".player");
    assert.equal(config.armies[0].slots[0].name, "Tester");
    // The enemy's own commander still takes its tag in the loop.
    assert.ok(config.armies[1].slots[0].commander.endsWith(".ai0"));
  });

  it("adds no army when the hire has no roster", () => {
    const withNone = generate(undefined);
    const withEmpty = generate([]);
    assert.equal(withNone.armies.length, withEmpty.armies.length);
    assert.ok(withNone.armies.every((army) => army.slots[0].name !== "Sorian"));
  });
});
