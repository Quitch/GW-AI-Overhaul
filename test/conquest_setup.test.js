"use strict";

// Unit tests for gw_start/conquest_setup.js, the measured half of Galactic
// Conquest war generation.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const conquestSetup = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/conquest_setup.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

function star(ai) {
  return { ai: () => ai };
}

// A line of `count` stars, 0 - 1 - 2 - ... so distances are unambiguous.
function chainGates(count) {
  const gates = [];
  for (let i = 0; i + 1 < count; i++) {
    gates.push([i, i + 1]);
  }
  return gates;
}

function cycleGates(count) {
  const gates = chainGates(count);
  gates.push([count - 1, 0]);
  return gates;
}

function spawnStars(gates, starCount, aiCount, seed) {
  return conquestSetup.spawnStars({
    gates: gates,
    starCount: starCount,
    originIndex: 0,
    aiCount: aiCount,
    rng: gwoRng.create(seed),
  });
}

describe("guardiansCandidates", () => {
  it("offers only unowned stars that are not the origin", () => {
    const stars = [star(null), star({ team: 0 }), star(null), star(null)];
    assert.deepEqual(conquestSetup.guardiansCandidates(stars, 0), [2, 3]);
  });

  it("returns nothing when every star is owned or the origin", () => {
    const stars = [star(null), star({ team: 0 })];
    assert.deepEqual(conquestSetup.guardiansCandidates(stars, 0), []);
  });
});

describe("spawnStars", () => {
  it("returns the same placement for one seed", () => {
    const a = spawnStars(cycleGates(12), 12, 3, "spawn-1");
    const b = spawnStars(cycleGates(12), 12, 3, "spawn-1");
    assert.deepEqual(a, b);
  });

  it("never spawns two bosses on one star, nor on the origin", () => {
    for (let i = 0; i < 12; i++) {
      const spawns = spawnStars(cycleGates(12), 12, 3, "distinct-" + i);
      assert.equal(spawns.length, 3);
      assert.equal(new Set(spawns).size, 3, "duplicate spawn star");
      assert.ok(!spawns.includes(0), "spawned on the origin");
    }
  });

  // The case the breeder's greedy pick gets wrong: on a 12-star ring it
  // spawns at {6, 3-or-9}, spacing [3,3,6]; the even split {4,8} gives
  // [4,4,4] and is the unique lexicographic-maximin optimum.
  it("finds the even split greedy misses", () => {
    for (let i = 0; i < 12; i++) {
      const spawns = spawnStars(cycleGates(12), 12, 2, "ring-" + i);
      assert.deepEqual(spawns.slice().sort(), [4, 8]);
    }
  });

  it("keeps the far end while widening the gaps on a chain", () => {
    for (let i = 0; i < 12; i++) {
      const spawns = spawnStars(chainGates(12), 12, 2, "chain-" + i);
      assert.ok(spawns.includes(11), "farthest star unused");
      const other = spawns.find((star) => star !== 11);
      assert.ok(other >= 5, "spacing below 5: " + spawns);
      assert.ok(11 - other >= 5, "spacing below 5: " + spawns);
    }
  });

  it("sends a lone boss to the farthest star", () => {
    assert.deepEqual(spawnStars(chainGates(12), 12, 1, "lone"), [11]);
  });

  it("clamps to the available stars when outnumbered", () => {
    const spawns = spawnStars(chainGates(3), 3, 5, "clamp");
    assert.deepEqual(spawns.slice().sort(), [1, 2]);
  });

  it("never places a boss on a star unreachable from the origin", () => {
    for (let i = 0; i < 12; i++) {
      const spawns = spawnStars(
        [
          [0, 1],
          [1, 2],
        ],
        4,
        3,
        "island-" + i
      );
      assert.deepEqual(spawns.slice().sort(), [1, 2]);
    }
  });
});

describe("buildGuardiansAi", () => {
  it("carries the field set the War sweep assigns", () => {
    const ai = conquestSetup.buildGuardiansAi(2.5, 3);
    assert.deepEqual(ai, {
      icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png",
      boss: true,
      mirrorMode: true,
      treasurePlanet: true,
      econ_rate: 2.5,
      bossCommanders: 3,
      name: "The Guardians",
      character: "!LOC:Unknown",
      color: [
        [255, 255, 255],
        [255, 192, 203],
      ],
      commander: "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json",
    });
  });

  it("builds a fresh object per call", () => {
    assert.notEqual(
      conquestSetup.buildGuardiansAi(1, 1),
      conquestSetup.buildGuardiansAi(1, 1)
    );
  });
});

describe("settings", () => {
  const params = {
    maxDist: 7,
    playerCount: 2,
    factions: [3, 0, 4],
    difficulty: {
      econBase: 1,
      econRatePerDist: 0.2,
      mandatoryMinions: 1,
      minionMod: 0.5,
      factionTechHandicap: 0.5,
      ffaChance: 10,
      alliedCommanderChance: 15,
      bossCommanders: 2,
    },
    personality: { microType: 2, personalityTags: ["Picked"] },
    gameModes: {
      landAnywhereChance: 5,
      suddenDeathChance: 6,
      bountyModeChance: 7,
      bountyModeValue: 0.5,
      eradicationModeChance: 8,
    },
  };

  it("snapshots every field the play scene needs", () => {
    const settings = conquestSetup.settings(params);
    assert.equal(settings.maxDist, 7);
    assert.equal(settings.playerCount, 2);
    assert.deepEqual(settings.factions, [3, 0, 4]);
    assert.deepEqual(settings.difficulty, params.difficulty);
    assert.deepEqual(settings.personality, params.personality);
    assert.deepEqual(settings.gameModes, params.gameModes);
  });

  it("starts the phase marker on the war-creation turn", () => {
    assert.equal(conquestSetup.settings(params).lastAiPhaseTurn, 1);
  });

  it("copies the inputs rather than sharing them", () => {
    const settings = conquestSetup.settings(params);
    settings.factions.push(99);
    settings.personality.microType = 0;
    assert.deepEqual(params.factions, [3, 0, 4]);
    assert.equal(params.personality.microType, 2);
  });

  it("is JSON-safe, so it survives the save round-trip", () => {
    const settings = conquestSetup.settings(params);
    assert.deepEqual(JSON.parse(JSON.stringify(settings)), settings);
  });
});
