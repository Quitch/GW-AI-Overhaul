"use strict";

// Unit tests for gw_play/conquest_forecast.js, the read-only projection the
// intelligence panel renders. The last suite is the important one: it runs the
// planner the forecast claims to predict and asserts the phase it named is the
// phase the tier actually moves on.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const forecast = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_forecast.js"
);
const engine = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_engine.js"
);

// maxDist 8 over four connections puts the tier step at every 4 of growth and
// the muster threshold at 36.
function makeView(opts) {
  return Object.assign(
    {
      ai: null,
      explored: false,
      held: false,
      growth: 0,
      neighbours: [],
      maxDist: 8,
      maxConnections: 4,
    },
    opts || {}
  );
}

function garrison(team, extra) {
  return Object.assign(
    { team: team, faction: team, capturedTurn: 1, growth: 0, appliedTier: 0 },
    extra
  );
}

function owned(team) {
  return { ai: { team: team, faction: team, capturedTurn: 1 } };
}

function playerStar(extra) {
  return Object.assign({ ai: null, explored: true, held: false }, extra);
}

describe("turnsToGrowth", () => {
  it("rounds a part-filled turn up", () => {
    assert.equal(forecast.turnsToGrowth(0, 10, 4), 3);
    assert.equal(forecast.turnsToGrowth(0, 12, 4), 3);
    assert.equal(forecast.turnsToGrowth(8, 12, 4), 1);
  });

  it("returns null when nothing accrues", () => {
    assert.equal(forecast.turnsToGrowth(0, 12, 0), null);
    assert.equal(forecast.turnsToGrowth(0, 12, -1), null);
  });

  it("floors at zero for a counter already past the target", () => {
    assert.equal(forecast.turnsToGrowth(20, 12, 4), 0);
  });
});

describe("forecast", () => {
  it("projects both counters for a growing garrison", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { growth: 2, appliedTier: 0 }),
        neighbours: [owned(0), owned(0)],
      })
    );
    // Two per phase: tier 1 at growth 4 is one phase, the muster at 36 is 17.
    assert.deepEqual(result, { reinforcements: 1, army: 17 });
  });

  it("drops the tier row for a garrison already at the cap", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { growth: 33, appliedTier: 8 }),
        neighbours: [owned(0)],
      })
    );
    assert.deepEqual(result, { reinforcements: null, army: 3 });
  });

  it("drops both rows for an isolated garrison", () => {
    const result = forecast.forecast(
      makeView({ ai: garrison(0, { growth: 2 }) })
    );
    assert.deepEqual(result, { reinforcements: null, army: null });
  });

  it("drops both rows for a boss, which scales by territory", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { boss: true, growth: 2 }),
        neighbours: [owned(0), owned(0)],
      })
    );
    assert.deepEqual(result, { reinforcements: null, army: null });
  });

  it("drops both rows for a minion army, which never re-scales", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { conquestArmy: { seq: 0, colour: 0, origin: 1 } }),
        neighbours: [owned(0), owned(0)],
      })
    );
    assert.deepEqual(result, { reinforcements: null, army: null });
  });

  it("drops both rows for the Guardians, which the phase skips", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { mirrorMode: true }),
        neighbours: [owned(0), owned(0)],
      })
    );
    assert.deepEqual(result, { reinforcements: null, army: null });
  });

  it("drops both rows for a neutral star", () => {
    const result = forecast.forecast(makeView({ neighbours: [owned(0)] }));
    assert.deepEqual(result, { reinforcements: null, army: null });
  });

  it("reports the garrison's own counter, never a foe's", () => {
    const foeBearing = garrison(0, { growth: 2, appliedTier: 0 });
    foeBearing.foes = [
      { faction: 1, createdTurn: 2, growth: 3, appliedTier: 0 },
    ];
    const result = forecast.forecast(
      makeView({
        ai: foeBearing,
        neighbours: [owned(0), owned(1), owned(1)],
      })
    );
    // One same-team neighbour: the two enemy ones feed the foe, not this.
    assert.deepEqual(result, { reinforcements: 2, army: 34 });
  });

  it("still drops both rows on a boss star bearing foes", () => {
    const bossAi = garrison(0, { boss: true, growth: 2 });
    bossAi.foes = [{ faction: 1, createdTurn: 2, growth: 3, appliedTier: 0 }];
    const result = forecast.forecast(
      makeView({ ai: bossAi, neighbours: [owned(1)] })
    );
    assert.deepEqual(result, { reinforcements: null, army: null });
  });

  it("seeds a counter a pre-growth save never wrote", () => {
    const legacy = garrison(0, { appliedTier: 3 });
    delete legacy.growth;
    const result = forecast.forecast(
      makeView({ ai: legacy, neighbours: [owned(0)] })
    );
    // Seeded to 12, so tier 4 lands in 4 and the muster in 24.
    assert.deepEqual(result, { reinforcements: 4, army: 24 });
  });

  it("falls back to four connections, as the planner does", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { growth: 2, appliedTier: 0 }),
        maxConnections: undefined,
        neighbours: [owned(0), owned(0)],
      })
    );
    assert.deepEqual(result, { reinforcements: 1, army: 17 });
  });

  it("excludes Guardians and jumped bosses from the count", () => {
    const result = forecast.forecast(
      makeView({
        ai: garrison(0, { growth: 0, appliedTier: 0 }),
        neighbours: [
          owned(0),
          { ai: { team: 0, mirrorMode: true } },
          { ai: { team: 0, boss: true, conquestJumped: true } },
        ],
      })
    );
    // Only the one real neighbour accrues.
    assert.deepEqual(result, { reinforcements: 4, army: 36 });
  });

  it("musters from a player system but never re-tiers it", () => {
    const result = forecast.forecast(
      makeView({
        explored: true,
        growth: 6,
        neighbours: [playerStar(), playerStar(), owned(1)],
      })
    );
    // Two player neighbours; 30 to go at 2 a phase.
    assert.deepEqual(result, { reinforcements: null, army: 15 });
  });

  it("counts an unexplored star a player army holds", () => {
    const result = forecast.forecast(
      makeView({
        held: true,
        growth: 0,
        neighbours: [playerStar({ explored: false, held: true })],
      })
    );
    assert.deepEqual(result, { reinforcements: null, army: 36 });
  });

  it("keeps the player's star theirs under a jumped boss", () => {
    const result = forecast.forecast(
      makeView({
        ai: { team: 0, boss: true, conquestJumped: true, capturedTurn: 1 },
        explored: true,
        growth: 12,
        neighbours: [playerStar(), playerStar(), playerStar()],
      })
    );
    assert.deepEqual(result, { reinforcements: null, army: 8 });
  });
});

describe("agrees with the planner", () => {
  const streams = (() => {
    const rngFor = () => ({
      int: (low) => low,
      pick: (list) => list[0],
      stream: () => rngFor(),
    });
    return {
      conquestMoveRng: rngFor,
      conquestModesRng: rngFor,
      conquestGarrisonRng: rngFor,
      conquestFoeRng: rngFor,
      conquestAllyRng: rngFor,
      conquestScaleRng: rngFor,
      conquestBossScaleRng: rngFor,
      conquestArmyRng: rngFor,
      conquestArmyMoveRng: rngFor,
      conquestPlayerArmyMoveRng: rngFor,
    };
  })();

  const builder = {
    rollGameModifiers: () => {},
    copyGameModifiers: () => {},
    buildGarrison: (params) => ({
      team: params.team,
      faction: params.faction,
      builtAtTier: params.tier,
    }),
    buildFoe: () => null,
    buildAlly: () => null,
    refreshGarrison: (rng, ai, tier) => {
      ai.refreshedAt = tier;
    },
    refreshBoss: () => {},
    refreshFoe: () => {},
    ensureQuellerFFATags: () => {},
  };

  const ctx = {
    warRng: {},
    streams: streams,
    builder: builder,
    paletteSizes: [4, 4],
    alliesSuppressed: true,
    cfg: {
      factions: [0],
      maxConnections: 4,
      // Foes and allies would add pieces the forecast does not model; the
      // rolls are held off so the assertion is about accrual alone.
      difficulty: { ffaChance: 0, alliedCommanderChance: 0 },
    },
  };

  // Star 1 is the subject, stars 2 and 3 its same-team neighbours, star 0 the
  // player's. Nothing here is capturable, so no boss moves and the board only
  // accrues. Turns stay odd so the foe and ally rolls never come round.
  function runPhases(board, count, onEachPhase) {
    for (let phase = 0; phase < count; phase++) {
      board.turns = 3 + phase * 2;
      const result = engine.planPhase(board, ctx);
      result.steps.forEach((step) => {
        (step.writes || []).forEach((entry) => {
          board.stars[entry.star].ai = entry.ai;
        });
      });
      Object.assign(board, {
        playerHeld: result.conquest.playerHeld,
        playerGrowth: result.conquest.playerGrowth,
        playerArmies: result.conquest.playerArmies,
        armySeq: result.conquest.armySeq,
      });
      onEachPhase(phase + 1, board, result);
    }
  }

  function garrisonBoard(subject, maxDist) {
    return {
      turns: 3,
      playerStar: 0,
      treasureStar: undefined,
      maxDist: maxDist,
      neighbors: { 1: [2, 3], 2: [1], 3: [1] },
      stars: [
        { ai: null, explored: true, visited: true },
        { ai: subject, explored: true, visited: true },
        { ai: garrison(0), explored: true, visited: true },
        { ai: garrison(0), explored: true, visited: true },
      ],
      playerHeld: {},
      playerGrowth: {},
      playerArmies: [],
      armySeq: {},
    };
  }

  it("names the phase a garrison's tier actually rises on", () => {
    const subject = garrison(0, { growth: 1, appliedTier: 0 });
    const board = garrisonBoard(subject, 8);
    const view = makeView({
      ai: subject,
      explored: true,
      neighbours: [owned(0), owned(0)],
    });
    const predicted = forecast.forecast(view).reinforcements;
    assert.equal(predicted, 2);

    const tiers = [];
    runPhases(board, predicted, (phase) => {
      tiers.push({ phase: phase, tier: board.stars[1].ai.appliedTier });
    });
    assert.deepEqual(tiers, [
      { phase: 1, tier: 0 },
      { phase: 2, tier: 1 },
    ]);
  });

  it("names the phase a capped garrison actually musters on", () => {
    // maxDist 2 puts the muster threshold at 12.
    const subject = garrison(0, { growth: 6, appliedTier: 2 });
    const board = garrisonBoard(subject, 2);
    const view = makeView({
      ai: subject,
      explored: true,
      maxDist: 2,
      neighbours: [owned(0), owned(0)],
    });
    const predicted = forecast.forecast(view).army;
    assert.equal(predicted, 3);

    const spawnPhases = [];
    runPhases(board, predicted, (phase, current, result) => {
      if (result.steps.some((step) => step.kind === "spawn")) {
        spawnPhases.push(phase);
      }
    });
    assert.deepEqual(spawnPhases, [predicted]);
  });

  it("names the phase the player's own system actually musters on", () => {
    // maxDist 2 again: threshold 12, three player neighbours, 6 accrued.
    const board = {
      turns: 3,
      playerStar: 1,
      treasureStar: undefined,
      maxDist: 2,
      neighbors: { 1: [2, 3, 4], 2: [1], 3: [1], 4: [1] },
      stars: [
        { ai: null, explored: false, visited: false },
        { ai: null, explored: true, visited: true },
        { ai: null, explored: true, visited: true },
        { ai: null, explored: true, visited: true },
        { ai: null, explored: true, visited: true },
      ],
      playerHeld: {},
      playerGrowth: { 1: 6 },
      playerArmies: [],
      armySeq: {},
    };
    const view = makeView({
      explored: true,
      growth: 6,
      maxDist: 2,
      neighbours: [playerStar(), playerStar(), playerStar()],
    });
    const predicted = forecast.forecast(view).army;
    assert.equal(predicted, 2);

    const counts = [];
    runPhases(board, predicted, (phase, current) => {
      counts.push({ phase: phase, armies: current.playerArmies.length });
    });
    assert.deepEqual(counts, [
      { phase: 1, armies: 0 },
      { phase: 2, armies: 1 },
    ]);
  });
});
