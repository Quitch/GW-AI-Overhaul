"use strict";

// Unit tests for gw_play/conquest_engine.js, the Galactic Conquest phase
// planner. The builder and streams are stubbed so every assertion is about the
// rules: target priorities, boss movement, collisions, stacking, foe/ally
// rolls and tier refresh.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const engine = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_engine.js"
);

function makeStreams(rolls) {
  const draws = rolls || {};
  const rngFor = (name) => ({
    int: (low) => (draws[name] !== undefined ? draws[name] : low),
    pick: (list) => {
      draws.picked = (draws.picked || []).concat([name]);
      return list[0];
    },
    stream: () => rngFor(name),
  });
  return {
    conquestMoveRng: () => rngFor("move"),
    conquestModesRng: () => rngFor("modes"),
    conquestGarrisonRng: () => rngFor("garrison"),
    conquestFoeRng: () => rngFor("foe"),
    conquestAllyRng: () => rngFor("ally"),
    conquestScaleRng: () => rngFor("scale"),
    conquestBossScaleRng: () => rngFor("bossScale"),
    conquestArmyRng: () => rngFor("army"),
    conquestArmyMoveRng: () => rngFor("armyMove"),
  };
}

function makeBuilder() {
  return {
    rollGameModifiers: (rng, ai) => {
      ai.modifiersRolled = (ai.modifiersRolled || 0) + 1;
    },
    copyGameModifiers: (from, to) => {
      to.modifiersCopied = true;
    },
    buildGarrison: (params) => ({
      garrison: true,
      team: params.team,
      faction: params.faction,
      color: params.color,
      builtAtTier: params.tier,
    }),
    buildFoe: (params) => ({ name: "Foe", faction: params.foeFaction }),
    buildAlly: () => ({ name: "Ally" }),
    refreshGarrison: (rng, ai, tier) => {
      ai.refreshedAt = tier;
    },
    refreshBoss: (rng, boss, tier) => {
      boss.refreshedAt = tier;
    },
    refreshFoe: (rng, foe, tier) => {
      foe.refreshedAt = tier;
    },
    ensureQuellerFFATags: () => {},
  };
}

function makeCtx(opts) {
  const options = opts || {};
  return {
    warRng: {},
    streams: makeStreams(options.rolls),
    builder: makeBuilder(),
    paletteSizes: options.paletteSizes || [4, 4, 4, 4, 4],
    alliesSuppressed: !!options.alliesSuppressed,
    cfg: {
      factions: options.factions || [0],
      maxConnections: 4,
      difficulty: {
        ffaChance: 10,
        alliedCommanderChance: 10,
      },
    },
  };
}

function makeBoard(opts) {
  const neighbors = {};
  (opts.edges || []).forEach(([a, b]) => {
    (neighbors[a] = neighbors[a] || []).push(b);
    (neighbors[b] = neighbors[b] || []).push(a);
  });
  return {
    turns: opts.turns !== undefined ? opts.turns : 3,
    playerStar: opts.playerStar !== undefined ? opts.playerStar : 0,
    treasureStar: opts.treasureStar,
    maxDist: opts.maxDist !== undefined ? opts.maxDist : 8,
    neighbors: neighbors,
    stars: opts.stars,
    armySeq: opts.armySeq,
  };
}

function boss(team, extra) {
  return Object.assign(
    {
      boss: true,
      team: team,
      faction: team,
      color: [[team, team, team]],
      capturedTurn: 1,
      growth: 0,
      appliedTier: 1,
    },
    extra
  );
}

// growth 4 is appliedTier 1 at the ctx default of four connections.
function garrison(team, extra) {
  return Object.assign(
    { team: team, faction: team, capturedTurn: 1, growth: 4, appliedTier: 1 },
    extra
  );
}

function star(ai, extra) {
  return Object.assign(
    { ai: ai || null, explored: false, visited: false },
    extra
  );
}

function stepsOf(result, kind) {
  return result.steps.filter((step) => step.kind === kind);
}

describe("boss movement", () => {
  it("captures an adjacent star and leaves a scaled garrison behind", () => {
    const theBoss = boss(0, { capturedTurn: 1, growth: 8 });
    const board = makeBoard({
      turns: 5,
      playerStar: 3,
      edges: [
        [1, 2],
        [2, 3],
      ],
      stars: [star(), star(theBoss), star(), star(null, { visited: true })],
    });
    const result = engine.planPhase(board, makeCtx());

    const moves = stepsOf(result, "move");
    assert.equal(moves.length, 1);
    assert.deepEqual(
      { team: moves[0].team, from: moves[0].from, to: moves[0].to },
      { team: 0, from: 1, to: 2 }
    );
    const left = board.stars[1].ai;
    assert.equal(left.garrison, true);
    // The boss's growth of 8 over four connections builds the garrison at
    // tier 2; the garrison inherits the counter, then accrues its new boss
    // neighbour in the same phase.
    assert.equal(left.builtAtTier, 2);
    assert.equal(left.capturedTurn, 1);
    assert.equal(left.growth, 9);
    assert.equal(left.appliedTier, 2);
    assert.equal(left.modifiersCopied, true);
    assert.equal(board.stars[2].ai, theBoss);
    assert.equal(theBoss.capturedTurn, 5);
    // Capture resets the counter; the garrison left behind then feeds it.
    assert.equal(theBoss.growth, 1);
    assert.equal(theBoss.modifiersRolled, 1);
  });

  it("moves onto the player's star when adjacent, ignoring other targets", () => {
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [0, 1],
        [1, 2],
      ],
      stars: [star(null, { visited: true }), star(boss(0)), star()],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "move")[0].to, 0);
    const jumped = board.stars[0].ai;
    assert.equal(jumped.boss, true);
    // An attack, not a capture: the battle rolls stay, ownership does not.
    assert.equal(jumped.conquestJumped, true);
    assert.equal(jumped.capturedTurn, 3);
    assert.equal(jumped.modifiersRolled, 1);
  });

  it("holds while it occupies the player's star", () => {
    const board = makeBoard({
      playerStar: 0,
      edges: [[0, 1]],
      stars: [star(boss(0)), star()],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "hold").length, 1);
    assert.equal(stepsOf(result, "move").length, 0);
  });

  it("does not attack a player standing on the treasure star", () => {
    const guardians = { boss: true, mirrorMode: true, treasurePlanet: true };
    const board = makeBoard({
      playerStar: 0,
      treasureStar: 0,
      edges: [
        [0, 1],
        [1, 2],
      ],
      stars: [star(guardians, { visited: true }), star(boss(0)), star()],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "move")[0].to, 2);
    assert.equal(board.stars[0].ai, guardians);
  });

  it("captures across its friendly territory in one move", () => {
    const theBoss = boss(0);
    const midGarrison = garrison(0);
    const board = makeBoard({
      playerStar: 4,
      edges: [
        [1, 2],
        [2, 3],
      ],
      stars: [star(), star(theBoss), star(midGarrison), star(), star()],
    });
    const result = engine.planPhase(board, makeCtx());
    const move = stepsOf(result, "move")[0];
    assert.deepEqual({ from: move.from, to: move.to }, { from: 1, to: 3 });
    assert.equal(board.stars[3].ai, theBoss);
    // The garrison it crossed stays put; a fresh one covers the origin.
    assert.equal(board.stars[2].ai, midGarrison);
    assert.equal(board.stars[1].ai.garrison, true);
  });

  it("jumps the player from anywhere in its territory when strong enough", () => {
    const theBoss = boss(0);
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [0, 1],
        [1, 2],
        [2, 3],
      ],
      stars: [
        star(null, { visited: true }),
        star(garrison(0)),
        star(garrison(0)),
        star(theBoss),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    const move = stepsOf(result, "move")[0];
    assert.deepEqual({ from: move.from, to: move.to }, { from: 3, to: 0 });
    assert.equal(board.stars[0].ai, theBoss);
    assert.equal(theBoss.conquestJumped, true);
  });

  it("expands instead of engaging a player too strong to beat", () => {
    // The player holds three explored systems to the boss's one, so the
    // 50%-more gate withholds the jump and the boss captures instead.
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [0, 1],
        [1, 2],
      ],
      stars: [
        star(null, { visited: true, explored: true }),
        star(boss(0)),
        star(),
        star(null, { explored: true }),
        star(null, { explored: true }),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    const moves = stepsOf(result, "move");
    assert.equal(moves.length, 1);
    assert.equal(moves[0].to, 2);
    assert.equal(board.stars[0].ai, null);
  });

  it("holds when boxed in with no frontier", () => {
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(), star(boss(0)), star(garrison(0))],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "hold").length, 1);
  });
});

describe("target priorities", () => {
  it("prefers a star the player has not explored", () => {
    const board = makeBoard({
      playerStar: 4,
      edges: [
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
      ],
      stars: [
        star(),
        star(boss(0)),
        star(null, { explored: true }),
        star(),
        star(null, { visited: true }),
      ],
    });
    assert.equal(stepsOf(engine.planPhase(board, makeCtx()), "move")[0].to, 3);
  });

  it("falls back to the star closest to the player when no candidate borders an enemy", () => {
    // Candidates 2 and 3 border only friendly stars; 2 is nearer the player.
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [0, 5],
        [5, 2],
        [1, 2],
        [1, 3],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(),
        star(),
        star(),
        star(garrison(0)),
      ],
    });
    assert.equal(stepsOf(engine.planPhase(board, makeCtx()), "move")[0].to, 2);
  });

  it("prefers the candidate with the most friendly neighbours", () => {
    const board = makeBoard({
      playerStar: 6,
      edges: [
        [1, 2],
        [1, 3],
        [2, 5],
        [2, 6],
        [3, 6],
      ],
      stars: [
        star(),
        star(boss(0)),
        star(),
        star(),
        star(),
        star(garrison(0)),
        star(null, { visited: true }),
      ],
    });
    // Both 2 and 3 border the non-friendly player star; 2 also borders the
    // friendly garrison at 5.
    assert.equal(stepsOf(engine.planPhase(board, makeCtx()), "move")[0].to, 2);
  });

  it("tie-breaks on the most non-friendly neighbours", () => {
    const board = makeBoard({
      playerStar: 7,
      edges: [
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 5],
        [3, 6],
        [4, 7],
        [5, 7],
      ],
      stars: [
        star(),
        star(boss(0)),
        star(),
        star(),
        star(),
        star(),
        star(),
        star(null, { visited: true }),
      ],
    });
    // 2 provides one non-friendly neighbour (4); 3 provides two (5 and 6).
    assert.equal(stepsOf(engine.planPhase(board, makeCtx()), "move")[0].to, 3);
  });

  it("breaks surviving ties with the seeded stream", () => {
    const rolls = {};
    const board = makeBoard({
      playerStar: 4,
      edges: [
        [1, 2],
        [1, 3],
        [2, 4],
        [3, 4],
      ],
      stars: [
        star(),
        star(boss(0)),
        star(),
        star(),
        star(null, { visited: true }),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ rolls }));
    assert.equal(stepsOf(result, "move")[0].to, 2);
    assert.ok(rolls.picked.includes("move"), "the move stream broke the tie");
  });

  it("never targets the Guardians star", () => {
    const guardians = { boss: true, mirrorMode: true };
    const board = makeBoard({
      playerStar: 4,
      treasureStar: 2,
      edges: [
        [1, 2],
        [1, 3],
      ],
      stars: [
        star(),
        star(boss(0)),
        star(guardians),
        star(null, { explored: true }),
        star(),
      ],
    });
    assert.equal(stepsOf(engine.planPhase(board, makeCtx()), "move")[0].to, 3);
    assert.equal(board.stars[2].ai, guardians);
  });
});

describe("boss versus boss", () => {
  function collisionBoard(attackerStars, defenderStars) {
    // Team 0 owns star 1 (+2 when attackerStars is 2); team 1 owns star 3
    // (+4 when defenderStars is 2). 1 and 3 are adjacent.
    const stars = [
      star(null, { visited: true }),
      star(boss(0)),
      star(attackerStars > 1 ? garrison(0) : null),
      star(boss(1)),
      star(defenderStars > 1 ? garrison(1) : null),
    ];
    return makeBoard({
      playerStar: 0,
      edges: [
        [1, 2],
        [1, 3],
        [3, 4],
      ],
      stars: stars,
    });
  }

  it("eliminates the defender when the attacker owns more systems", () => {
    const board = collisionBoard(2, 1);
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.deepEqual(result.events, [
      { type: "eliminated", team: 1, byTeam: 0 },
    ]);
    assert.equal(board.stars[3].ai.team, 0);
    assert.equal(board.stars[3].ai.boss, true);
    const cleared = stepsOf(result, "eliminate")[0];
    assert.deepEqual(cleared.clearCards, [3]);
  });

  it("lets a cornered attacker win a tie", () => {
    // The boss star is the only option and the tie is winnable - the
    // collision rule favours the attacker - so the cornered path attacks.
    const board = makeBoard({
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(boss(0)), star(boss(1))],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.deepEqual(result.events, [
      { type: "eliminated", team: 1, byTeam: 0 },
    ]);
    assert.equal(board.stars[2].ai.team, 0);
  });

  it("holds rather than die attacking, and the stronger boss finishes it", () => {
    const board = makeBoard({
      edges: [
        [1, 2],
        [2, 3],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(boss(1)),
        star(garrison(1)),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    // The weaker boss would lose the collision, so it holds its ground...
    assert.equal(stepsOf(result, "hold")[0].team, 0);
    assert.ok(stepsOf(result, "move").every((move) => move.team !== 0));
    // ...and the stronger faction, free to act next, takes the fight to it.
    assert.equal(result.events[0].team, 0);
    assert.equal(result.events[0].byTeam, 1);
    const owners = board.stars
      .map((s) => s.ai && s.ai.team)
      .filter((team) => team !== null && team !== undefined);
    assert.ok(!owners.includes(0), "the loser still owns a star");
    assert.ok(owners.includes(1), "the victor was wrongly eliminated");
  });
});

describe("boss attack gate", () => {
  // Star 0 is the player's, disconnected; the attacker's boss sits at star 1
  // heading a chain of garrisons, the defender's at star 5 heading its own.
  function gateBoard(options) {
    const stars = [
      star(null, { visited: true }),
      star(boss(0)),
      star(garrison(0)),
      star(garrison(0)),
      star(garrison(0)),
      star(boss(1)),
      star(garrison(1)),
      star(garrison(1)),
    ];
    const edges = [
      [1, 2],
      [2, 3],
      [3, 4],
      [1, 5],
      [5, 6],
      [6, 7],
    ];
    if (options && options.withEmptyNeighbour) {
      stars.push(star());
      edges.push([1, stars.length - 1]);
    }
    return makeBoard({ edges, stars });
  }

  it("attacks with strictly more systems when the boss star is the only option", () => {
    // 4-vs-3 fails the 50% gate, but the cornered would-win path attacks.
    const board = gateBoard();
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.deepEqual(result.events, [
      { type: "eliminated", team: 1, byTeam: 0 },
    ]);
    assert.equal(board.stars[5].ai.team, 0);
    assert.equal(board.stars[5].ai.boss, true);
  });

  it("prefers another capturable neighbour under 50% more systems", () => {
    // Without the gate the ladder would pick the boss star: it borders a
    // non-friendly system while the empty star borders only friendly ones.
    const board = gateBoard({ withEmptyNeighbour: true });
    const result = engine.planPhase(board, makeCtx());
    assert.deepEqual(result.events, []);
    assert.equal(stepsOf(result, "move")[0].to, 8);
    assert.equal(board.stars[8].ai.boss, true);
  });

  it("attacks past an alternative with exactly 50% more systems", () => {
    const board = makeBoard({
      edges: [
        [1, 2],
        [2, 3],
        [1, 5],
        [5, 6],
        [1, 8],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(garrison(0)),
        star(garrison(0)),
        star(),
        star(boss(1)),
        star(garrison(1)),
        star(),
        star(),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.deepEqual(result.events, [
      { type: "eliminated", team: 1, byTeam: 0 },
    ]);
    assert.equal(board.stars[5].ai.team, 0);
  });

  it("captures the far frontier instead when the boss star is gated", () => {
    const theBoss = boss(0);
    const midGarrison = garrison(0);
    const board = makeBoard({
      edges: [
        [1, 5],
        [5, 6],
        [1, 2],
        [2, 3],
      ],
      stars: [
        star(null, { visited: true }),
        star(theBoss),
        star(midGarrison),
        star(),
        star(),
        star(boss(1)),
        star(garrison(1)),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.deepEqual(result.events, []);
    assert.equal(stepsOf(result, "move")[0].to, 3);
    assert.equal(board.stars[3].ai, theBoss);
    assert.equal(board.stars[2].ai, midGarrison);
  });

  it("attacks a gated boss star it would beat when cornered", () => {
    // 2-vs-2 fails the 50% gate, but the collision favours the attacker.
    const board = makeBoard({
      edges: [
        [1, 2],
        [2, 5],
        [5, 6],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(garrison(0)),
        star(),
        star(),
        star(boss(1)),
        star(garrison(1)),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.deepEqual(result.events, [
      { type: "eliminated", team: 1, byTeam: 0 },
    ]);
    assert.equal(board.stars[5].ai.team, 0);
  });

  it("holds when the only option is a boss it would lose to", () => {
    const board = makeBoard({
      edges: [
        [1, 2],
        [2, 5],
        [5, 6],
        [6, 7],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(garrison(0)),
        star(),
        star(),
        star(boss(1)),
        star(garrison(1)),
        star(garrison(1)),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.deepEqual(result.events, []);
    assert.equal(stepsOf(result, "hold").length, 1);
    assert.equal(stepsOf(result, "move").length, 0);
  });
});

describe("stacking on the player's star", () => {
  it("joins a boss already holding the player's star instead of colliding", () => {
    const hostBoss = boss(0, { conquestJumped: true });
    const arriving = boss(1);
    const board = makeBoard({
      playerStar: 0,
      edges: [[0, 1]],
      stars: [star(hostBoss, { visited: true }), star(arriving)],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.deepEqual(result.events, []);
    assert.equal(board.stars[0].ai, hostBoss);
    assert.deepEqual(hostBoss.foes, [arriving]);
    assert.equal(hostBoss.conquestJumped, true);
    assert.equal(arriving.conquestJumped, undefined);
    assert.equal(board.stars[1].ai.garrison, true);
  });

  it("keeps a stacked star uncapturable for another boss", () => {
    const hostGarrison = garrison(0, { foes: [boss(2)] });
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [0, 4],
        [2, 3],
        [3, 4],
      ],
      stars: [
        star(null, { visited: true }),
        star(),
        star(hostGarrison),
        star(boss(1)),
        star(),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1, 2] }));
    const moves = stepsOf(result, "move");
    // Team 1 must pass over the stacked star 2 and take star 4 instead; the
    // stacked team 2 boss is then free to capture team 1's garrison.
    assert.equal(moves[0].team, 1);
    assert.equal(moves[0].to, 4);
    assert.equal(moves[1].team, 2);
    assert.equal(moves[1].to, 3);
    assert.equal(hostGarrison.foes, undefined);
  });

  it("un-stacks a waiting boss once the player has moved away", () => {
    const stacked = boss(1);
    const hostGarrison = garrison(0, { foes: [stacked] });
    const board = makeBoard({
      playerStar: 4,
      edges: [
        [1, 2],
        [1, 3],
        [3, 4],
      ],
      stars: [
        star(),
        star(hostGarrison),
        star(),
        star(),
        star(null, { visited: true }),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    const moves = stepsOf(result, "move");
    assert.equal(moves.length, 1);
    assert.equal(moves[0].team, 1);
    assert.equal(hostGarrison.foes, undefined);
    assert.equal(board.stars[moves[0].to].ai, stacked);
  });
});

describe("foe rolls", () => {
  function borderBoard(turns, rolls, factions) {
    const board = makeBoard({
      turns: turns,
      playerStar: 5,
      edges: [[0, 1]],
      stars: [
        star(garrison(0)),
        star(garrison(1)),
        star(),
        star(),
        star(),
        star(null, { visited: true }),
      ],
    });
    return {
      board: board,
      result: engine.planPhase(
        board,
        makeCtx({ factions: factions || [0, 1], rolls: rolls })
      ),
    };
  }

  it("creates a foe of the bordering faction on an even turn", () => {
    const { board, result } = borderBoard(4, { foe: 10 });
    assert.equal(stepsOf(result, "foe").length, 2);
    assert.deepEqual(
      board.stars[0].ai.foes.map((f) => f.faction),
      [1]
    );
    assert.equal(board.stars[0].ai.foes[0].createdTurn, 4);
    assert.equal(board.stars[0].ai.foes[0].appliedTier, 0);
    assert.deepEqual(
      board.stars[1].ai.foes.map((f) => f.faction),
      [0]
    );
  });

  it("multiplies the chance by the number of bordering systems", () => {
    // One bordering system: chance is 10, so a roll of 11 misses.
    assert.equal(stepsOf(borderBoard(4, { foe: 11 }).result, "foe").length, 0);
  });

  it("rolls nothing on an odd turn", () => {
    assert.equal(stepsOf(borderBoard(5, { foe: 10 }).result, "foe").length, 0);
  });

  it("rolls nothing for a boss that jumped the player", () => {
    // The jumped star has no owner to gain a foe, and its boss's team does
    // not count as bordering the garrison next door.
    const board = makeBoard({
      turns: 4,
      playerStar: 0,
      edges: [[0, 1]],
      stars: [
        star(boss(0, { conquestJumped: true }), { visited: true }),
        star(garrison(1)),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.equal(stepsOf(result, "foe").length, 0);
  });

  it("never duplicates a faction's foe on one star", () => {
    const withFoe = borderBoard(4, { foe: 10 });
    const board = withFoe.board;
    board.turns = 6;
    const again = engine.planPhase(
      board,
      makeCtx({ factions: [0, 1], rolls: { foe: 10 } })
    );
    assert.equal(stepsOf(again, "foe").length, 0);
    assert.equal(board.stars[0].ai.foes.length, 1);
  });
});

describe("ally rolls", () => {
  function allyBoard(opts) {
    const options = opts || {};
    const owner = garrison(0, options.ownerExtra);
    const board = makeBoard({
      turns: 4,
      playerStar: 3,
      edges: [
        [0, 1],
        [2, 3],
      ],
      stars: [
        star(owner),
        star(null, { visited: options.visited !== false }),
        star(),
        star(null, { visited: true }),
      ],
    });
    return {
      owner: owner,
      result: engine.planPhase(
        board,
        makeCtx({
          rolls: options.rolls || { ally: 10 },
          alliesSuppressed: options.suppressed,
        })
      ),
    };
  }

  it("creates an ally on an AI star bordering a player system", () => {
    const { owner, result } = allyBoard();
    assert.equal(stepsOf(result, "ally").length, 1);
    assert.equal(owner.ally.name, "Ally");
  });

  it("multiplies the chance by the bordering player systems", () => {
    assert.equal(
      stepsOf(allyBoard({ rolls: { ally: 11 } }).result, "ally").length,
      0
    );
  });

  it("requires the neighbour to be player-held, not merely empty", () => {
    assert.equal(
      stepsOf(allyBoard({ visited: false }).result, "ally").length,
      0
    );
  });

  it("still counts the player's star as player-held under a jumped boss", () => {
    const owner = garrison(1);
    const board = makeBoard({
      turns: 4,
      playerStar: 0,
      edges: [[0, 1]],
      stars: [
        star(boss(0, { conquestJumped: true }), { visited: true }),
        star(owner),
      ],
    });
    const result = engine.planPhase(
      board,
      makeCtx({ factions: [0, 1], rolls: { ally: 10 } })
    );
    assert.equal(stepsOf(result, "ally").length, 1);
    assert.equal(owner.ally.name, "Ally");
  });

  it("never doubles up an existing ally", () => {
    assert.equal(
      stepsOf(
        allyBoard({ ownerExtra: { ally: { name: "Old" } } }).result,
        "ally"
      ).length,
      0
    );
  });

  it("is suppressed by an ally-breaking loadout", () => {
    assert.equal(
      stepsOf(allyBoard({ suppressed: true }).result, "ally").length,
      0
    );
  });
});

describe("tier refresh", () => {
  it("never grows an isolated garrison", () => {
    const held = garrison(0, { growth: 0, appliedTier: 0 });
    const board = makeBoard({
      playerStar: 1,
      edges: [[0, 1]],
      stars: [star(held), star(null, { visited: true })],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(held.growth, 0);
    assert.equal(held.refreshedAt, undefined);
    assert.equal(stepsOf(result, "refresh").length, 0);
  });

  it("matches the old two-turn cadence with two of four friendly neighbours", () => {
    const held = garrison(0, { growth: 0, appliedTier: 0 });
    const board = makeBoard({
      playerStar: 3,
      edges: [
        [0, 1],
        [0, 2],
      ],
      stars: [
        star(held),
        star(garrison(0)),
        star(garrison(0)),
        star(null, { visited: true }),
      ],
    });
    const first = engine.planPhase(board, makeCtx());
    // The planner owns a clone, so accrual alone must still write the star
    // or the live board never sees the counter move.
    assert.equal(held.growth, 2);
    assert.equal(held.refreshedAt, undefined);
    assert.ok(
      stepsOf(first, "refresh").some((step) =>
        step.writes.some((entry) => entry.star === 0)
      )
    );

    engine.planPhase(board, makeCtx());
    assert.equal(held.growth, 4);
    assert.equal(held.refreshedAt, 1);
    assert.equal(held.appliedTier, 1);
  });

  it("gains a tier every turn when fully surrounded", () => {
    const held = garrison(0, { growth: 0, appliedTier: 0 });
    const board = makeBoard({
      playerStar: 5,
      edges: [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ],
      stars: [
        star(held),
        star(garrison(0)),
        star(garrison(0)),
        star(garrison(0)),
        star(garrison(0)),
        star(null, { visited: true }),
      ],
    });
    engine.planPhase(board, makeCtx());
    assert.equal(held.refreshedAt, 1);
    engine.planPhase(board, makeCtx());
    assert.equal(held.refreshedAt, 2);
    assert.equal(held.appliedTier, 2);
  });

  it("caps the tier at maxDist", () => {
    const held = garrison(0, { growth: 100, appliedTier: 1 });
    const board = makeBoard({
      playerStar: 1,
      maxDist: 3,
      edges: [[0, 1]],
      stars: [star(held), star(null, { visited: true })],
    });
    engine.planPhase(board, makeCtx());
    assert.equal(held.refreshedAt, 3);
    assert.equal(held.appliedTier, 3);
  });

  it("does not count a jumped boss's star as friendly territory", () => {
    // The jumped boss holds nothing, so its own team's garrison next door
    // draws no growth from the star. appliedTier 8 is the boss's fair-share
    // tier for one owned system - ceil(1 * 2 * 8 / 2) - so the boss loop
    // stays quiet too.
    const held = garrison(0, { growth: 0, appliedTier: 0 });
    const board = makeBoard({
      playerStar: 0,
      edges: [[0, 1]],
      stars: [
        star(boss(0, { conquestJumped: true, appliedTier: 8 }), {
          visited: true,
        }),
        star(held),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(held.growth, 0);
    assert.equal(stepsOf(result, "refresh").length, 0);
  });

  it("scales a foe by its own faction's neighbours, not its host's", () => {
    const foe = {
      name: "Foe",
      faction: 1,
      createdTurn: 1,
      growth: 3,
      appliedTier: 0,
    };
    const host = garrison(0, { foes: [foe] });
    const board = makeBoard({
      playerStar: 3,
      edges: [
        [0, 1],
        [0, 2],
      ],
      stars: [
        star(host),
        star(garrison(1)),
        star(garrison(0)),
        star(null, { visited: true }),
      ],
    });
    engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    // The one faction-1 neighbour tips the foe over a tier boundary; the
    // host's own single friendly neighbour leaves it short of its next.
    assert.equal(foe.growth, 4);
    assert.equal(foe.refreshedAt, 1);
    assert.equal(foe.appliedTier, 1);
    assert.equal(host.growth, 5);
    assert.equal(host.refreshedAt, undefined);
  });

  it("accrues growth on a boss-held star for its departure garrison", () => {
    const theBoss = boss(0);
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(theBoss), star(garrison(0))],
    });
    engine.planPhase(board, makeCtx());
    assert.equal(theBoss.growth, 1);
    engine.planPhase(board, makeCtx());
    assert.equal(theBoss.growth, 2);
  });

  it("refreshes a foe stacked on a boss in place", () => {
    // The old held-turns rule deferred a stacked foe's tier until the boss
    // departed; the counter cannot defer, so the foes loop runs on
    // boss-held stars too.
    const foe = {
      name: "Foe",
      faction: 1,
      createdTurn: 1,
      growth: 4,
      appliedTier: 0,
    };
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [
        star(null, { visited: true }),
        star(boss(0, { foes: [foe] })),
        star(garrison(0)),
      ],
    });
    engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.equal(foe.refreshedAt, 1);
    assert.equal(foe.appliedTier, 1);
  });

  it("seeds the counter for a save from before growth existed", () => {
    const held = garrison(0, { appliedTier: 2 });
    delete held.growth;
    const board = makeBoard({
      playerStar: 2,
      edges: [[0, 1]],
      stars: [star(held), star(garrison(0)), star(null, { visited: true })],
    });
    const result = engine.planPhase(board, makeCtx());
    // appliedTier 2 seeds growth 8, keeping the saved tier; the friendly
    // neighbour then adds one, and the seeding alone demands a write.
    assert.equal(held.growth, 9);
    assert.equal(held.appliedTier, 2);
    assert.equal(held.refreshedAt, undefined);
    assert.ok(
      stepsOf(result, "refresh").some((step) =>
        step.writes.some((entry) => entry.star === 0)
      )
    );
  });

  it("defaults maxConnections to 4 for a pre-field save", () => {
    const held = garrison(0, { growth: 3, appliedTier: 0 });
    const board = makeBoard({
      playerStar: 2,
      edges: [[0, 1]],
      stars: [star(held), star(garrison(0)), star(null, { visited: true })],
    });
    const ctx = makeCtx();
    delete ctx.cfg.maxConnections;
    engine.planPhase(board, ctx);
    assert.equal(held.refreshedAt, 1);
  });

  it("does not count the jump toward the boss's tier", () => {
    // appliedTier is seeded to the fair-share tier for one owned system:
    // ceil(1 * 2 * 8 / 2).
    const theBoss = boss(0, { appliedTier: 8 });
    const board = makeBoard({
      playerStar: 0,
      edges: [[0, 1]],
      stars: [star(null, { visited: true }), star(theBoss)],
    });
    const result = engine.planPhase(board, makeCtx());
    // The boss owns only the garrison it left behind, matching appliedTier.
    assert.equal(board.stars[0].ai, theBoss);
    assert.equal(theBoss.refreshedAt, undefined);
    // The garrison's one neighbour is the jumped star, which stays the
    // player's, so no growth accrues either.
    assert.equal(board.stars[1].ai.growth, 0);
    assert.equal(stepsOf(result, "refresh").length, 0);
  });

  it("re-scales a boss by the number of systems its faction owns", () => {
    const theBoss = boss(0, { appliedTier: 1 });
    const board = makeBoard({
      turns: 3,
      playerStar: 3,
      edges: [
        [0, 1],
        [2, 3],
      ],
      stars: [
        star(garrison(0)),
        star(theBoss),
        star(garrison(0)),
        star(null, { visited: true }),
      ],
    });
    engine.planPhase(board, makeCtx());
    // The boss holds and its faction owns three of its fair share of two
    // systems: ceil(3 * 2 * 8 / 4), past maxDist because the tier is uncapped.
    assert.equal(theBoss.refreshedAt, 12);
    assert.equal(theBoss.appliedTier, 12);
  });
});

describe("determinism", () => {
  it("plans an identical phase from an identical board", () => {
    const build = () => {
      const board = makeBoard({
        turns: 4,
        playerStar: 0,
        edges: [
          [0, 1],
          [1, 2],
          [2, 3],
          [3, 4],
        ],
        stars: [
          star(null, { visited: true }),
          star(boss(0)),
          star(garrison(1)),
          star(boss(1)),
          star(),
        ],
      });
      const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
      return JSON.parse(JSON.stringify({ result: result, board: board }));
    };
    assert.deepEqual(build(), build());
  });
});

describe("growthTier", () => {
  it("floors accumulated growth over maxConnections, capped at maxDist", () => {
    assert.equal(engine.growthTier(0, 4, 8), 0);
    assert.equal(engine.growthTier(3, 4, 8), 0);
    assert.equal(engine.growthTier(4, 4, 8), 1);
    assert.equal(engine.growthTier(100, 4, 8), 8);
    // Integer accumulation keeps a non-power-of-2 divisor exact.
    assert.equal(engine.growthTier(5, 3, 8), 1);
  });
});

describe("minion army spawning", () => {
  // maxDist 2 and four connections put the spawn threshold at growth 12.
  const cappedBoard = (opts) =>
    makeBoard(
      Object.assign(
        {
          maxDist: 2,
          playerStar: 0,
          edges: [[1, 2]],
          stars: [
            star(null, { visited: true }),
            star(garrison(0, { growth: 11, appliedTier: 2 })),
            star(garrison(0, { growth: 0, appliedTier: 0 })),
          ],
        },
        opts || {}
      )
    );

  it("spawns an army when growth crosses a full tier past the cap", () => {
    const board = cappedBoard();
    const result = engine.planPhase(board, makeCtx());

    const spawns = stepsOf(result, "spawn");
    assert.equal(spawns.length, 1);
    assert.equal(spawns[0].star, 1);
    assert.equal(spawns[0].team, 0);

    const host = board.stars[1].ai;
    assert.equal(host.minionArmies.length, 1);
    // The spawn consumed one tier of growth: 11 accrued to 12, debited to 8.
    assert.equal(host.growth, 8);
    assert.equal(host.appliedTier, 2);

    const army = host.minionArmies[0];
    assert.equal(army.garrison, true);
    assert.equal(army.team, 0);
    assert.equal(army.builtAtTier, 2);
    assert.equal(army.capturedTurn, 3);
    assert.equal(army.growth, 0);
    assert.equal(army.appliedTier, 2);
    assert.deepEqual(army.conquestArmy, { seq: 0, colour: 0, origin: 1 });
    assert.deepEqual(result.conquest.armySeq, { 0: 1 });
  });

  it("does not spawn again until a full tier re-accrues", () => {
    const board = cappedBoard();
    engine.planPhase(board, makeCtx());
    const second = engine.planPhase(board, makeCtx());

    // Growth 8 accrued to 9, short of the threshold.
    assert.equal(stepsOf(second, "spawn").length, 0);
    assert.equal(board.stars[1].ai.minionArmies.length, 1);

    board.stars[1].ai.growth = 11;
    const third = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(third, "spawn").length, 1);
    const armies = board.stars[1].ai.minionArmies;
    assert.equal(armies.length, 2);
    assert.deepEqual(armies[1].conquestArmy, { seq: 1, colour: 1, origin: 1 });
  });

  it("continues the persisted sequence rather than renumbering", () => {
    const board = cappedBoard({ armySeq: { 0: 3 } });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(board.stars[1].ai.minionArmies[0].conquestArmy.seq, 3);
    assert.deepEqual(result.conquest.armySeq, { 0: 4 });
  });

  it("gives same-phase spawns distinct colours in star order", () => {
    const board = cappedBoard({
      stars: [
        star(null, { visited: true }),
        star(garrison(0, { growth: 11, appliedTier: 2 })),
        star(garrison(0, { growth: 11, appliedTier: 2 })),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "spawn").length, 2);
    assert.deepEqual(board.stars[1].ai.minionArmies[0].conquestArmy, {
      seq: 0,
      colour: 0,
      origin: 1,
    });
    assert.deepEqual(board.stars[2].ai.minionArmies[0].conquestArmy, {
      seq: 1,
      colour: 1,
      origin: 2,
    });
  });

  it("accrues an army-held star's growth without rescaling or spawning", () => {
    const army = garrison(0, {
      growth: 11,
      appliedTier: 2,
      conquestArmy: { seq: 0, colour: 0, origin: 9 },
    });
    const board = cappedBoard({
      stars: [
        star(null, { visited: true }),
        star(army),
        star(garrison(0, { growth: 0, appliedTier: 0 })),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "spawn").length, 0);
    assert.equal(army.growth, 12);
    assert.equal(army.refreshedAt, undefined);
    assert.equal(army.minionArmies, undefined);
  });

  it("never spawns from a boss or a Guardians star", () => {
    const board = cappedBoard({
      stars: [
        star(null, { visited: true }),
        star(boss(0, { growth: 40 })),
        star({ mirrorMode: true, capturedTurn: 1, growth: 40 }),
      ],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "spawn").length, 0);
  });

  it("spawns nothing and keeps the growth when the pool is empty", () => {
    const board = cappedBoard({
      stars: [
        star(null, { visited: true }),
        star(garrison(0, { growth: 12, appliedTier: 2 })),
        star(),
      ],
      edges: [],
    });
    const ctx = makeCtx();
    ctx.builder.buildGarrison = () => null;
    const result = engine.planPhase(board, ctx);
    assert.equal(stepsOf(result, "spawn").length, 0);
    assert.equal(board.stars[1].ai.growth, 12);
    assert.equal(board.stars[1].ai.minionArmies, undefined);
  });
});

describe("pickArmyColour", () => {
  it("hands out the lowest free colour first", () => {
    assert.equal(engine.pickArmyColour([], 4), 0);
    assert.equal(engine.pickArmyColour([0], 4), 1);
    assert.equal(engine.pickArmyColour([1, 0], 4), 2);
  });

  it("falls back to the least used colour, ties to the lowest", () => {
    assert.equal(engine.pickArmyColour([0, 0, 1], 2), 1);
    assert.equal(engine.pickArmyColour([0, 1], 2), 0);
    assert.equal(engine.pickArmyColour([0, 1, 1], 2), 0);
  });

  it("tolerates a missing palette", () => {
    assert.equal(engine.pickArmyColour([], 0), 0);
    assert.equal(engine.pickArmyColour([3], undefined), 0);
  });
});

describe("minion army movement", () => {
  const armyOf = (team, seq, extra) =>
    garrison(
      team,
      Object.assign(
        {
          growth: 8,
          appliedTier: 2,
          conquestArmy: { seq: seq, colour: seq, origin: 9 },
        },
        extra
      )
    );

  it("captures an adjacent star and leaves a departure garrison", () => {
    const army = armyOf(0, 0);
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(army), star()],
    });
    const result = engine.planPhase(board, makeCtx());

    const move = stepsOf(result, "move")[0];
    assert.deepEqual(
      { team: move.team, from: move.from, to: move.to },
      { team: 0, from: 1, to: 2 }
    );
    assert.equal(move.movedAi, army);

    const left = board.stars[1].ai;
    assert.equal(left.garrison, true);
    assert.equal(left.builtAtTier, 2);
    assert.equal(left.modifiersCopied, true);

    assert.equal(board.stars[2].ai, army);
    assert.equal(army.capturedTurn, 3);
    // Capture resets the counter; the garrison left behind then feeds it.
    assert.equal(army.growth, 1);
    assert.equal(army.appliedTier, 2);
    assert.equal(army.modifiersRolled, 1);
  });

  it("leaves its host untouched when mustered", () => {
    const army = armyOf(0, 0, { growth: 0 });
    const host = garrison(0, { minionArmies: [army] });
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(host), star()],
    });
    engine.planPhase(board, makeCtx());

    assert.equal(board.stars[1].ai, host);
    assert.equal(host.garrison, undefined);
    assert.equal(host.minionArmies, undefined);
    assert.equal(board.stars[2].ai, army);
  });

  it("moves each army after its boss, in spawn order", () => {
    const first = armyOf(0, 0, { growth: 0 });
    const second = armyOf(0, 1, { growth: 0 });
    const host = garrison(0, { minionArmies: [second, first] });
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [1, 2],
        [2, 3],
        [2, 4],
        [2, 5],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(host),
        star(),
        star(),
        star(),
      ],
    });
    const result = engine.planPhase(board, makeCtx());

    const moves = stepsOf(result, "move");
    assert.equal(moves.length, 3);
    assert.equal(moves[0].movedAi, undefined);
    assert.equal(moves[1].movedAi.conquestArmy.seq, 0);
    assert.equal(moves[2].movedAi.conquestArmy.seq, 1);
  });

  it("never attacks a boss, which freely overwrites it", () => {
    const army = armyOf(0, 0);
    const enemyBoss = boss(1);
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(army), star(enemyBoss)],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));

    const holds = stepsOf(result, "hold");
    assert.equal(holds.length, 1);
    assert.deepEqual(
      { team: holds[0].team, army: holds[0].army },
      {
        team: 0,
        army: 0,
      }
    );
    // Team 1 acted after the hold: the boss captured the army star outright.
    assert.equal(board.stars[1].ai, enemyBoss);
    assert.equal(stepsOf(result, "clash").length, 0);
    assert.equal(stepsOf(result, "eliminate").length, 0);
  });

  it("never attacks the player's star", () => {
    const army = armyOf(0, 0);
    const board = makeBoard({
      playerStar: 0,
      edges: [[0, 1]],
      stars: [star(null, { visited: true }), star(army)],
    });
    const result = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(result, "hold").length, 1);
    assert.equal(board.stars[0].ai, null);
  });

  it("annihilates both armies and razes the star on a clash", () => {
    const attacker = armyOf(0, 0);
    const defender = armyOf(1, 0);
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(attacker), star(defender)],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));

    const clashes = stepsOf(result, "clash");
    assert.equal(clashes.length, 1);
    assert.equal(clashes[0].star, 2);
    assert.deepEqual(clashes[0].writes, [{ star: 2, ai: null }]);
    assert.equal(clashes[0].clearCards, undefined);

    assert.equal(board.stars[2].ai, null);
    // The attacker died at the target; its departure garrison survives.
    assert.equal(board.stars[1].ai.garrison, true);
    assert.equal(stepsOf(result, "occupy").length, 0);
  });

  it("razes a garrison hosting mustered armies in a clash", () => {
    const attacker = armyOf(0, 0);
    const mustered = armyOf(1, 0, { growth: 0 });
    const host = garrison(1, { minionArmies: [mustered] });
    const board = makeBoard({
      playerStar: 0,
      edges: [[1, 2]],
      stars: [star(null, { visited: true }), star(attacker), star(host)],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));

    assert.equal(stepsOf(result, "clash").length, 1);
    assert.equal(board.stars[2].ai, null);
    // The mustered defender died with its host and never acted.
    assert.equal(stepsOf(result, "move").length, 1);
  });

  it("strips a dead team's mustered armies from surviving hosts", () => {
    const stray = armyOf(1, 0, { growth: 0 });
    const host = garrison(0, { minionArmies: [stray] });
    const board = makeBoard({
      playerStar: 0,
      edges: [
        [1, 2],
        [1, 3],
      ],
      stars: [
        star(null, { visited: true }),
        star(boss(0)),
        star(boss(1)),
        star(host),
      ],
    });
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));

    assert.equal(stepsOf(result, "eliminate").length, 1);
    assert.equal(host.minionArmies, undefined);
  });
});
