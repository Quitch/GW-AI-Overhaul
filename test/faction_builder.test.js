"use strict";

// faction/faction_builder.js: the assembly the four base-faction shadows share.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const builder = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_builder.js"
);

const BASELINE = {
  name: "Baseline",
  color: [[1, 2, 3]],
  econ_rate: 1,
  personality: { faction: true },
  commander: "/pa/base.json",
};

function data() {
  return {
    name: "Test Faction",
    colour: [[1, 2, 3]],
    coopPlayerColors: [
      [1, 2, 3],
      [4, 5, 6],
    ],
    baseline: BASELINE,
    boss: { name: "Boss", personality: { boss: true } },
    minions: [
      { name: "Able", personality: { id: "armour" } },
      { name: "Baker", personality: { id: "navy" } },
    ],
    randomAI: { name: "Random", personality: { id: "armour" } },
    descriptions: ["one", "two"],
    planets: [{ name: "Kohr" }],
  };
}

describe("faction_builder.build", () => {
  it("merges every minion, and the boss, over a copy of the baseline", () => {
    const faction = builder.build(data());

    assert.deepEqual(faction.minions[0], {
      name: "Able",
      color: [[1, 2, 3]],
      econ_rate: 1,
      personality: { faction: true, id: "armour" },
      commander: "/pa/base.json",
    });
    assert.equal(faction.teams[0].boss.name, "Boss");
    assert.equal(faction.teams[0].boss.personality.boss, true);
    assert.equal(BASELINE.name, "Baseline");
  });

  it("appends the Random commander last and keeps it out of its own pool", () => {
    const input = data();
    const faction = builder.build(input);
    const spec = faction.gwaioRandomSpec;

    assert.equal(faction.minions.length, 3);
    assert.equal(faction.minions[2].name, "Random");
    assert.deepEqual(spec.randoms, [
      { index: 2, template: input.randomAI, from: input.minions },
    ]);
    assert.equal(spec.baseline, BASELINE);
    assert.equal(spec.descriptions, input.descriptions);
    assert.deepEqual(
      input.minions.map((m) => m.name),
      ["Able", "Baker"]
    );
  });

  it("names the team after the faction and takes the first description", () => {
    const input = data();
    const faction = builder.build(input);

    assert.equal(faction.name, "Test Faction");
    assert.equal(faction.color, input.colour);
    assert.equal(faction.coopPlayerColors, input.coopPlayerColors);
    assert.equal(faction.teams.length, 1);
    assert.equal(faction.teams[0].name, "Test Faction");
    assert.equal(faction.teams[0].systemDescription, "one");
    assert.equal(faction.teams[0].systemTemplate.name, "Test Faction");
    assert.equal(faction.teams[0].systemTemplate.Planets, input.planets);
  });
});
