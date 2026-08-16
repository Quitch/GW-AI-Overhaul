"use strict";

// Tests for faction/faction_seed.js. Its real data lives in coverage-excluded
// files, so these use hand-built factions of the same shape.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
);
const factionSeed = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_seed.js",
);

const BASELINE = {
  name: "Baseline",
  character: "!LOC:Baseline",
  econ_rate: 1,
  factionWide: "kept",
  personality: { baseline: true },
};

const POOL = [
  { name: "Able", personality: { id: "armour" } },
  { name: "AceAI", personality: { id: "roboticist" } },
  { name: "Alpha", personality: { id: "uber" } },
  { name: "Chronoblip", personality: { id: "fabber" } },
];

const DESCRIPTIONS = ["one", "two", "three", "four", "five"];

// Mirrors a gw_faction_*.js export: minions are baseline-merged, and the last slot is the
// Random commander that faction_seed reseeds.
function faction(options) {
  const opts = options || {};
  const randomAI = { name: "Aryst0krat", character: "!LOC:Random" };
  const modifiers = POOL.concat([randomAI]);

  const built = {
    name: "Test Faction",
    teams: [{ name: "Test Faction", systemDescription: DESCRIPTIONS[0] }],
    minions: modifiers.map((m) => Object.assign({}, BASELINE, m)),
  };

  if (!opts.withoutSpec) {
    built.gwaioRandomSpec = {
      baseline: BASELINE,
      descriptions: DESCRIPTIONS,
      randoms: [
        { index: modifiers.length - 1, template: randomAI, from: POOL },
      ],
    };
  }
  if (opts.withoutTeams) {
    delete built.teams;
  }
  return built;
}

function randomMinion(built) {
  return built.minions[built.minions.length - 1];
}

describe("faction_seed reseedFaction", () => {
  it("is reproducible for one seed and differs across seeds", () => {
    const a = faction();
    const b = faction();
    factionSeed.reseedFaction(a, gwoRng.create("seed-a"));
    factionSeed.reseedFaction(b, gwoRng.create("seed-a"));
    assert.deepEqual(randomMinion(a), randomMinion(b));
    assert.equal(a.teams[0].systemDescription, b.teams[0].systemDescription);

    const c = faction();
    factionSeed.reseedFaction(c, gwoRng.create("seed-b"));
    // Small pools make a single-field collision plausible, so assert on the pair.
    assert.notDeepEqual(
      [randomMinion(c).personality, c.teams[0].systemDescription],
      [randomMinion(a).personality, a.teams[0].systemDescription],
    );
  });

  // Writing .personality onto the existing minion would skip the baseline's
  // faction-wide fields.
  it("rebuilds the Random minion through the baseline merge", () => {
    const built = faction();
    factionSeed.reseedFaction(built, gwoRng.create("baseline"));
    const minion = randomMinion(built);
    assert.equal(minion.factionWide, "kept");
    assert.equal(minion.econ_rate, 1);
    assert.equal(minion.name, "Aryst0krat");
    assert.equal(minion.character, "!LOC:Random");
  });

  it("never gives the Random minion its own personality", () => {
    const identities = POOL.map((m) => m.personality.id);
    for (let i = 0; i < 50; i++) {
      const built = faction();
      factionSeed.reseedFaction(built, gwoRng.create("pool-" + i));
      assert.ok(identities.includes(randomMinion(built).personality.id));
    }
  });

  it("reseeds each random slot independently", () => {
    // Cluster's shape: one Random commander per role, in the last two slots.
    const built = faction();
    const second = { name: "Security", character: "!LOC:Random" };
    built.minions.push(Object.assign({}, BASELINE, second));
    built.gwaioRandomSpec.randoms.push({
      index: built.minions.length - 1,
      template: second,
      from: POOL,
    });

    factionSeed.reseedFaction(built, gwoRng.create("two-slots"));
    const slots = built.minions.slice(-2);
    assert.equal(slots[0].name, "Aryst0krat");
    assert.equal(slots[1].name, "Security");
    assert.ok(
      slots.every((s) =>
        POOL.some((p) => p.personality.id === s.personality.id),
      ),
    );
  });

  it("writes biome picks onto the referenced generators", () => {
    const built = faction();
    const generator = { biome: "asteroid", radius: 650 };
    built.gwaioRandomSpec.biomes = [
      { generator: generator, from: ["earth", "moon", "lava"] },
    ];
    factionSeed.reseedFaction(built, gwoRng.create("biomes"));
    assert.ok(["earth", "moon", "lava"].includes(generator.biome));
    assert.equal(generator.radius, 650);
  });

  it("is a no-op without a spec, without teams, or without an rng", () => {
    const noSpec = faction({ withoutSpec: true });
    factionSeed.reseedFaction(noSpec, gwoRng.create("x"));
    assert.deepEqual(noSpec, faction({ withoutSpec: true }));

    const noTeams = faction({ withoutTeams: true });
    factionSeed.reseedFaction(noTeams, gwoRng.create("x"));
    assert.equal(noTeams.teams, undefined);
    assert.equal(randomMinion(noTeams).factionWide, "kept");

    const noRng = faction();
    factionSeed.reseedFaction(noRng, undefined);
    assert.deepEqual(noRng, faction());
  });

  it("keeps the shipped default when the pool is empty", () => {
    const built = faction();
    built.gwaioRandomSpec.randoms[0].from = [];
    const before = randomMinion(built);
    factionSeed.reseedFaction(built, gwoRng.create("empty"));
    // Identity, not deep equality: reseeding rebuilds the slot through
    // _.merge, and with no source personality to merge the rebuilt object is
    // deep-equal to the one it replaced. Only the reference tells them apart,
    // so deepEqual here would pass with the empty-pool guard deleted.
    assert.equal(randomMinion(built), before);
  });
});

describe("faction_seed reseed", () => {
  it("keys by position, so reordering changes each faction's picks", () => {
    const inOrder = [faction(), faction()];
    factionSeed.reseed(inOrder, gwoRng.create("war").stream("factions"));

    const swapped = [faction(), faction()];
    factionSeed.reseed(swapped, gwoRng.create("war").stream("factions"));

    // Same position, same result.
    assert.deepEqual(randomMinion(inOrder[0]), randomMinion(swapped[0]));
    // Different position, different stream.
    assert.notDeepEqual(
      [
        randomMinion(inOrder[0]).personality,
        inOrder[0].teams[0].systemDescription,
      ],
      [
        randomMinion(inOrder[1]).personality,
        inOrder[1].teams[0].systemDescription,
      ],
    );
  });

  it("does nothing without an rng", () => {
    const factions = [faction()];
    factionSeed.reseed(factions, undefined);
    assert.deepEqual(factions[0], faction());
  });
});
