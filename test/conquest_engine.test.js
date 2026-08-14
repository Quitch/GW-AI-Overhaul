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
    alliesSuppressed: !!options.alliesSuppressed,
    cfg: {
      factions: options.factions || [0],
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
      appliedTier: 1,
    },
    extra
  );
}

function garrison(team, extra) {
  return Object.assign(
    { team: team, faction: team, capturedTurn: 1, appliedTier: 1 },
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
    const theBoss = boss(0, { capturedTurn: 1 });
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
    // tierFor(captured 1, turns 5) = 2, stamped and used for the build.
    assert.equal(left.builtAtTier, 2);
    assert.equal(left.capturedTurn, 1);
    assert.equal(left.appliedTier, 2);
    assert.equal(left.modifiersCopied, true);
    assert.equal(board.stars[2].ai, theBoss);
    assert.equal(theBoss.capturedTurn, 5);
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

  it("marches one hop through friendly territory toward the frontier", () => {
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
    assert.equal(stepsOf(result, "move")[0].to, 2);
    assert.equal(board.stars[2].ai, theBoss);
    // The displaced garrison rides along until the boss moves on.
    assert.equal(theBoss.conquestDisplaced, midGarrison);
    assert.equal(board.stars[1].ai.garrison, true);
  });

  it("restores the displaced garrison when the boss moves on", () => {
    const midGarrison = garrison(0);
    const theBoss = boss(0, { conquestDisplaced: midGarrison });
    const board = makeBoard({
      playerStar: 4,
      edges: [
        [1, 2],
        [2, 3],
      ],
      stars: [star(), star(garrison(0)), star(theBoss), star(), star()],
    });
    engine.planPhase(board, makeCtx());
    assert.equal(board.stars[2].ai, midGarrison);
    assert.equal(board.stars[3].ai, theBoss);
    assert.equal(theBoss.conquestDisplaced, undefined);
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

  it("lets the attacker win a tie", () => {
    const board = collisionBoard(1, 1);
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.deepEqual(result.events, [
      { type: "eliminated", team: 1, byTeam: 0 },
    ]);
    assert.equal(board.stars[3].ai.team, 0);
  });

  it("eliminates the attacker when the defender owns more systems", () => {
    const board = collisionBoard(1, 2);
    const result = engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.equal(result.events[0].team, 0);
    assert.equal(result.events[0].byTeam, 1);
    // The attacker's holdings are gone; the defender survives (and is free to
    // expand later in the same phase).
    const owners = board.stars
      .map((s) => s.ai && s.ai.team)
      .filter((team) => team !== null && team !== undefined);
    assert.ok(!owners.includes(0), "the attacker still owns a star");
    assert.ok(owners.includes(1), "the defender was wrongly eliminated");
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
  it("re-scales a garrison every second held turn, capped at maxDist", () => {
    const held = garrison(0, { capturedTurn: 1, appliedTier: 1 });
    const board = makeBoard({
      turns: 9,
      playerStar: 1,
      maxDist: 3,
      edges: [[0, 1]],
      stars: [star(held), star(null, { visited: true })],
    });
    const result = engine.planPhase(board, makeCtx());
    // tierFor(1, 9) is 4, capped to maxDist 3.
    assert.equal(held.refreshedAt, 3);
    assert.equal(held.appliedTier, 3);
    assert.equal(stepsOf(result, "refresh").length, 1);

    const again = engine.planPhase(board, makeCtx());
    assert.equal(stepsOf(again, "refresh").length, 0);
  });

  it("re-scales a foe from its own creation turn", () => {
    const foe = { name: "Foe", faction: 1, createdTurn: 5, appliedTier: 0 };
    const held = garrison(0, { capturedTurn: 1, appliedTier: 4, foes: [foe] });
    const board = makeBoard({
      turns: 9,
      playerStar: 1,
      edges: [[0, 1]],
      stars: [star(held), star(null, { visited: true })],
    });
    engine.planPhase(board, makeCtx({ factions: [0, 1] }));
    assert.equal(foe.refreshedAt, 2);
    assert.equal(foe.appliedTier, 2);
  });

  it("does not count the jump toward the boss's tier", () => {
    const theBoss = boss(0, { appliedTier: 1 });
    const board = makeBoard({
      playerStar: 0,
      edges: [[0, 1]],
      stars: [star(null, { visited: true }), star(theBoss)],
    });
    const result = engine.planPhase(board, makeCtx());
    // The boss owns only the garrison it left behind, matching appliedTier.
    assert.equal(board.stars[0].ai, theBoss);
    assert.equal(theBoss.refreshedAt, undefined);
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
    // The boss holds and its faction owns three systems.
    assert.equal(theBoss.refreshedAt, 3);
    assert.equal(theBoss.appliedTier, 3);
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

describe("tierFor", () => {
  it("halves held turns, floored and capped", () => {
    assert.equal(engine.tierFor(1, 1, 8), 0);
    assert.equal(engine.tierFor(1, 4, 8), 1);
    assert.equal(engine.tierFor(1, 9, 8), 4);
    assert.equal(engine.tierFor(1, 30, 8), 8);
  });
});
