"use strict";

// gw_play/conquest_turn.js: the Conquest turn driver. The engine is stubbed,
// so these tests pin the driving contract - one phase per turn, input blocked
// while it runs, the save landing once at phase end, and the changed loss and
// elimination rules.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_turn.js"
);

function observable(initial) {
  const accessor = function () {
    if (arguments.length) {
      accessor.value = arguments[0];
      return undefined;
    }
    return accessor.value;
  };
  accessor.value = initial;
  return accessor;
}

function makeStar(ai, opts) {
  const options = opts || {};
  const star = {
    ai: observable(ai || undefined),
    cardList: observable(options.cards || []),
    explored: observable(!!options.explored),
    history: () => options.history || [],
  };
  return star;
}

let stubs;
afterEach(() => stubs && stubs.restoreGlobals());

function setup(overrides) {
  const options = Object.assign(
    {
      turns: 2,
      lastAiPhaseTurn: 1,
      gameState: "active",
      currentStar: 0,
      // The current star is resolved by default: the phase only runs then.
      stars: [makeStar(undefined, { explored: true }), makeStar()],
      engineResult: { steps: [], events: [] },
      canMovePath: [0, 1],
      moveResult: "moved",
    },
    overrides
  );

  const calls = {
    saves: [],
    announced: [],
    animated: [],
    stats: [],
    engineBoards: [],
    gateWrites: [],
    sent: [],
    paths: [],
    baseMoves: 0,
    baseLoses: 0,
    baseFights: 0,
    baseWins: 0,
    baseApplies: 0,
  };

  const turns = observable(options.turns);
  // Stable, as in the scene: the driver swaps pathBetween on the instance.
  const galaxy = {
    stars: () => options.stars,
    neighborsMap: () => options.neighbors || { 0: [1], 1: [0] },
    pathBetween: (from, to, noFog, traversable) => {
      calls.paths.push([from, to, noFog, traversable]);
      return options.conquestPath !== undefined
        ? options.conquestPath
        : options.canMovePath;
    },
  };
  const game = {
    stats: () => ({ turns }),
    gameState: observable(options.gameState),
    turnState: observable(options.turnState || "end"),
    saved: observable(true),
    currentStar: observable(options.currentStar),
    galaxy: () => galaxy,
    // The stock move: one hop, one clock tick.
    move: (destination) => {
      turns(turns() + 1);
      game.currentStar(destination);
    },
    fight: () => {
      calls.baseFights += 1;
      return options.fightResult !== false;
    },
    winTurn: () => {
      calls.baseWins += 1;
      if (options.winTurnEffect) {
        options.winTurnEffect(game);
      }
      return Promise.resolve(
        options.winResult !== undefined ? options.winResult : true
      );
    },
    loseTurn: () => {
      calls.baseLoses += 1;
      if (options.loseTurnEffect) {
        options.loseTurnEffect(game);
      }
      return true;
    },
    defeatTeam: () => {},
  };

  // Mirrors the scene: the gate starts resolved, which is what makes the
  // ungated lost write navigate early. Records what gameState read at each
  // replacement, so a test can pin gate-before-flip ordering.
  const exitGate = observable(makeDeferred().resolve());
  const trackedExitGate = function () {
    if (arguments.length) {
      calls.gateWrites.push({ stateAtWrite: game.gameState() });
      return exitGate(arguments[0]);
    }
    return exitGate();
  };

  stubs = createGlobalStubs();
  stubs.setGlobal("model", {
    move: () => {
      calls.baseMoves += 1;
      if (options.moveEffect) {
        return options.moveEffect(game);
      }
      return options.moveResult;
    },
    canMove: () => options.canMovePath,
    canFight: () => true,
    canExplore: () => true,
    exitGate: trackedExitGate,
    player: { moving: observable(!!options.playerMoving) },
    selection: {
      star: observable(
        options.selectionStar !== undefined ? options.selectionStar : 1
      ),
    },
    cheats: { noFog: () => false },
    sendCampaignAction: (type, payload) => calls.sent.push([type, payload]),
    applyCampaignAction: () => {
      calls.baseApplies += 1;
      return "base-applied";
    },
  });
  stubs.setGlobal("ko", {
    computed: (fn) => fn,
  });
  const when = (value) => {
    const promise = Promise.resolve(value);
    promise.always = (fn) => {
      promise.then(fn, fn);
      return promise;
    };
    return promise;
  };
  stubs.setGlobal("$", { Deferred: makeDeferred, when: when });
  stubs.setGlobal("api", {
    tally: { incStatInt: (stat) => calls.stats.push(stat) },
  });

  const cfg = {
    maxDist: 5,
    lastAiPhaseTurn: options.lastAiPhaseTurn,
    factions: [0, 1],
    difficulty: {},
  };
  if (options.pendingFight) {
    cfg.pendingFight = options.pendingFight;
  }

  const engine = {
    planPhase: (board) => {
      calls.engineBoards.push(board);
      if (options.engineThrows) {
        throw new Error("planner exploded");
      }
      return options.engineResult;
    },
  };

  const aiPhase = observable(false);
  const aiPhaseWrites = [];
  const trackedAiPhase = function () {
    if (arguments.length) {
      aiPhaseWrites.push(arguments[0]);
      return aiPhase(arguments[0]);
    }
    return aiPhase();
  };

  const driver = makeFactory({
    game: game,
    gwoSettings: { treasureStar: 7 },
    cfg: cfg,
    engine: engine,
    builder: {},
    streams: {},
    warRng: {},
    alliesSuppressed: false,
    aiPhase: trackedAiPhase,
    save: (savedGame, saveStars) => {
      calls.saves.push([savedGame, saveStars]);
      if (options.onSave) {
        options.onSave(savedGame);
      }
      return options.saveResult !== undefined
        ? options.saveResult
        : Promise.resolve();
    },
    announce: (eliminations) => calls.announced.push(eliminations),
    animate: options.animate,
  });

  return {
    options,
    calls,
    game,
    cfg,
    driver,
    aiPhase: trackedAiPhase,
    aiPhaseWrites,
  };
}

describe("moving", () => {
  // Pins the removed auto-phase: a landing on a resolved star waits for the
  // player's Pass rather than answering at once.
  it("runs no phase on landing", async () => {
    const t = setup({ turnState: "begin" });
    const result = await model.move();
    assert.equal(result, "moved");
    assert.equal(t.calls.baseMoves, 1);
    assert.equal(t.calls.engineBoards.length, 0);
    assert.equal(t.cfg.lastAiPhaseTurn, 1);
  });

  it("advances the clock once for a multi-hop jump, hop saves included", async () => {
    const seenPerHop = [];
    const t = setup({
      lastAiPhaseTurn: 2,
      turnState: "begin",
      selectionStar: 3,
      stars: [
        makeStar(undefined, { explored: true }),
        makeStar(undefined, { explored: true }),
        makeStar(undefined, { explored: true }),
        makeStar(undefined, { explored: true }),
      ],
      moveEffect: (game) => {
        [1, 2, 3].forEach((hop) => {
          game.move(hop);
          // What a per-hop save would persist.
          seenPerHop.push(game.stats().turns());
        });
        return Promise.resolve("moved");
      },
    });
    await model.move();
    // Intermediate hops net nothing; only the landing keeps its tick.
    assert.deepEqual(seenPerHop, [2, 2, 3]);
    assert.equal(t.game.stats().turns(), 3);
    assert.equal(t.game.currentStar(), 3);
  });

  it("stops unwinding once the transit settles", async () => {
    const t = setup({
      lastAiPhaseTurn: 2,
      turnState: "begin",
      selectionStar: 1,
      moveEffect: (game) => {
        game.move(1);
        return Promise.resolve("moved");
      },
    });
    await model.move();
    assert.equal(t.game.stats().turns(), 3);
    t.game.move(0);
    assert.equal(t.game.stats().turns(), 4);
  });

  it("plans the route under the friendly-traversal rule and restores it", async () => {
    const t = setup({
      lastAiPhaseTurn: 2,
      turnState: "begin",
      selectionStar: 1,
      moveEffect: (game) => {
        game.galaxy().pathBetween(0, 1, false);
        return Promise.resolve("moved");
      },
    });
    await model.move();
    assert.equal(typeof t.calls.paths[0][3], "function");
    t.game.galaxy().pathBetween(0, 1, false);
    assert.equal(t.calls.paths[1][3], undefined);
  });
});

describe("the pass", () => {
  it("advances the clock and runs the phase at rest", async () => {
    const t = setup({ lastAiPhaseTurn: 2 });
    await t.driver.pass();
    assert.equal(t.game.stats().turns(), 3);
    assert.equal(t.calls.engineBoards.length, 1);
    assert.equal(t.cfg.lastAiPhaseTurn, 3);
  });

  it("does not advance the clock again after a move", async () => {
    // turns 2, lastAiPhaseTurn 1: the move already advanced the clock.
    const t = setup({ turnState: "begin" });
    await t.driver.pass();
    assert.equal(t.game.stats().turns(), 2);
    assert.equal(t.calls.engineBoards.length, 1);
    assert.equal(t.cfg.lastAiPhaseTurn, 2);
  });

  it("sends the campaign action when it acts, and only then", async () => {
    const t = setup({ lastAiPhaseTurn: 2 });
    await t.driver.pass();
    assert.deepEqual(t.calls.sent, [["gwo_conquest_pass", {}]]);

    const refused = setup({ gameState: "won" });
    refused.driver.pass();
    assert.deepEqual(refused.calls.sent, []);
  });

  it("stamps the turn ended before the phase saves", async () => {
    const savedTurnStates = [];
    const t = setup({
      turnState: "begin",
      onSave: (savedGame) => savedTurnStates.push(savedGame.turnState()),
    });
    await t.driver.pass();
    assert.deepEqual(savedTurnStates, ["end"]);
  });

  it("refuses while the star demands a fight or an explore", () => {
    const fight = setup({ stars: [makeStar({ team: 0 }), makeStar()] });
    assert.equal(fight.driver.canPass(), false);
    assert.equal(fight.driver.pass(), undefined);
    assert.equal(fight.calls.engineBoards.length, 0);

    const unexplored = setup({ stars: [makeStar(), makeStar()] });
    assert.equal(unexplored.driver.canPass(), false);
  });

  it("allows a pass beside the Guardians", () => {
    const t = setup({
      stars: [makeStar({ boss: true, mirrorMode: true }), makeStar()],
    });
    assert.equal(t.driver.canPass(), true);
  });

  it("refuses mid-battle and mid-explore states", () => {
    assert.equal(setup({ turnState: "fight" }).driver.canPass(), false);
    assert.equal(setup({ turnState: "explore" }).driver.canPass(), false);
  });

  it("refuses during the AI phase and in transit", () => {
    const t = setup();
    t.aiPhase(true);
    assert.equal(t.driver.canPass(), false);
    t.aiPhase(false);

    assert.equal(setup({ playerMoving: true }).driver.canPass(), false);
  });

  it("refuses once the war has ended", () => {
    assert.equal(setup({ gameState: "lost" }).driver.canPass(), false);
  });
});

describe("the campaign action hijack", () => {
  it("replays a pass without touching the base handler", async () => {
    const t = setup({ lastAiPhaseTurn: 2 });
    await model.applyCampaignAction({ type: "gwo_conquest_pass" });
    assert.equal(t.calls.engineBoards.length, 1);
    assert.equal(t.calls.baseApplies, 0);
  });

  it("delegates every other action to the base", () => {
    const t = setup();
    const result = model.applyCampaignAction({ type: "move_to_star" });
    assert.equal(result, "base-applied");
    assert.equal(t.calls.baseApplies, 1);
    assert.equal(t.calls.engineBoards.length, 0);
  });
});

describe("the install-time phase recovery", () => {
  const flushDefer = () => new Promise((resolve) => setTimeout(resolve, 5));

  it("waits for the Pass when a move is still unanswered", async () => {
    const t = setup({ turnState: "begin" });
    await flushDefer();
    assert.equal(t.calls.engineBoards.length, 0);
  });

  it("recovers a crash after the turn ended", async () => {
    const t = setup({ turnState: "end" });
    await flushDefer();
    assert.equal(t.calls.engineBoards.length, 1);
  });

  it("runs the owed phase after a reconciled battle", async () => {
    const t = setup({
      turnState: "begin",
      currentStar: 0,
      pendingFight: { star: 0, turn: 2, ai: { team: 0 }, owners: [0, null] },
      stars: [
        makeStar(undefined, { explored: true, cards: ["gwc_a"] }),
        makeStar(),
      ],
    });
    await flushDefer();
    assert.equal(t.calls.engineBoards.length, 1);
  });
});

describe("the winTurn wrap", () => {
  it("runs the phase once the explore resolves the turn and hands the result back", async () => {
    const stars = [makeStar(), makeStar()];
    const t = setup({
      stars,
      winTurnEffect: () => stars[0].explored(true),
    });
    const result = await t.game.winTurn(-1);
    assert.equal(result, true);
    assert.equal(t.calls.baseWins, 1);
    assert.equal(t.calls.engineBoards.length, 1);
    assert.equal(t.cfg.lastAiPhaseTurn, 2);
  });

  it("runs the phase after a fight win with nothing left to explore", async () => {
    const stars = [makeStar({ team: 0 }, { explored: true }), makeStar()];
    const t = setup({
      stars,
      winTurnEffect: () => stars[0].ai(undefined),
    });
    await t.game.winTurn();
    assert.equal(t.calls.engineBoards.length, 1);
  });

  it("still waits when the fight win leaves the star unexplored", async () => {
    const stars = [makeStar({ team: 0 }), makeStar()];
    const t = setup({
      stars,
      winTurnEffect: () => stars[0].ai(undefined),
    });
    await t.game.winTurn();
    assert.equal(t.calls.engineBoards.length, 0);
  });
});

describe("the phase run", () => {
  it("hands the engine a cloned board", async () => {
    const ai = { team: 0, boss: true };
    const t = setup({
      stars: [
        makeStar(undefined, { explored: true }),
        makeStar(ai, { history: [{}] }),
      ],
    });
    await t.driver.runPhaseIfDue();
    const board = t.calls.engineBoards[0];
    assert.deepEqual(board.stars[1].ai, ai);
    assert.notEqual(board.stars[1].ai, ai);
    assert.equal(board.stars[1].visited, true);
    assert.equal(board.stars[0].ai, null);
    assert.equal(board.stars[0].explored, true);
    assert.equal(board.turns, 2);
    assert.equal(board.playerStar, 0);
    assert.equal(board.treasureStar, 7);
    assert.equal(board.maxDist, 5);
  });

  it("applies writes and card clears in step order", async () => {
    const newAi = { team: 1 };
    const t = setup({
      stars: [
        makeStar(undefined, { explored: true }),
        makeStar({ team: 0 }, { cards: ["gwc_x"] }),
      ],
      engineResult: {
        steps: [
          { kind: "move", writes: [{ star: 0, ai: newAi }] },
          {
            kind: "eliminate",
            writes: [{ star: 1, ai: null }],
            clearCards: [1],
          },
        ],
        events: [],
      },
    });
    await t.driver.runPhaseIfDue();
    assert.equal(t.options.stars[0].ai(), newAi);
    assert.equal(t.options.stars[1].ai(), undefined);
    assert.deepEqual(t.options.stars[1].cardList(), []);
  });

  it("blocks input during the phase and restores it after", async () => {
    const t = setup();
    const pending = t.driver.runPhaseIfDue();
    assert.deepEqual(t.aiPhaseWrites, [true]);
    await pending;
    assert.deepEqual(t.aiPhaseWrites, [true, false]);
  });

  it("saves once, with saveStars set, after the steps land", async () => {
    const t = setup();
    await t.driver.runPhaseIfDue();
    assert.equal(t.calls.saves.length, 1);
    assert.equal(t.calls.saves[0][0], t.game);
    assert.equal(t.calls.saves[0][1], true);
  });

  it("announces the eliminations the phase produced", async () => {
    const t = setup({
      engineResult: {
        steps: [],
        events: [{ type: "eliminated", team: 1, byTeam: 0 }],
      },
    });
    await t.driver.runPhaseIfDue();
    assert.deepEqual(t.calls.announced, [[{ team: 1, byTeam: 0 }]]);
  });

  it("waits for each move animation before applying its writes", async () => {
    const order = [];
    const t = setup({
      animate: (step, done) => {
        order.push("animate");
        done();
      },
      engineResult: {
        steps: [{ kind: "move", writes: [] }],
        events: [],
      },
    });
    await t.driver.runPhaseIfDue();
    assert.deepEqual(order, ["animate"]);
  });

  it("restores input and skips the save when the planner throws", async () => {
    const originalError = console.error;
    console.error = () => {};
    let t;
    try {
      t = setup({ engineThrows: true });
      await t.driver.runPhaseIfDue();
    } finally {
      console.error = originalError;
    }
    assert.equal(t.aiPhase(), false);
    assert.equal(t.calls.saves.length, 0);
    assert.equal(t.cfg.lastAiPhaseTurn, 1);
  });

  it("never runs twice for one turn", async () => {
    const t = setup();
    await t.driver.runPhaseIfDue();
    await t.driver.runPhaseIfDue();
    assert.equal(t.calls.engineBoards.length, 1);
  });

  it("never runs twice for one turn across triggers", async () => {
    const stars = [makeStar(), makeStar()];
    const t = setup({
      stars,
      winTurnEffect: () => stars[0].explored(true),
    });
    await t.game.winTurn(-1);
    await t.driver.runPhaseIfDue();
    assert.equal(t.calls.engineBoards.length, 1);
  });

  it("reopens the turn when a boss lands on the player's star", async () => {
    const savedTurnStates = [];
    const t = setup({
      engineResult: {
        steps: [
          { kind: "move", writes: [{ star: 0, ai: { boss: true, team: 0 } }] },
        ],
        events: [],
      },
      onSave: (savedGame) => savedTurnStates.push(savedGame.turnState()),
    });
    await t.driver.runPhaseIfDue();
    assert.equal(t.game.turnState(), "begin");
    // The reopened state must be in the save, or a reload would softlock.
    assert.deepEqual(savedTurnStates, ["begin"]);
  });
});

describe("input rules", () => {
  // Movement needs the turn at rest: lastAiPhaseTurn caught up to the clock.
  it("passes the friendly route however many hops it crosses", () => {
    setup({ lastAiPhaseTurn: 2, canMovePath: [0, 1] });
    assert.deepEqual(model.canMove(), [0, 1]);

    setup({ lastAiPhaseTurn: 2, canMovePath: [0, 1, 2] });
    assert.deepEqual(model.canMove(), [0, 1, 2]);

    setup({ lastAiPhaseTurn: 2, canMovePath: false });
    assert.equal(model.canMove(), false);
  });

  it("refuses a route the stock rules allow but enemy territory blocks", () => {
    const t = setup({
      lastAiPhaseTurn: 2,
      canMovePath: [0, 1, 2],
      conquestPath: null,
    });
    assert.equal(model.canMove(), false);
    assert.equal(t.calls.paths.length, 1);
  });

  it("narrows the route to systems no AI holds", () => {
    const t = setup({ lastAiPhaseTurn: 2, canMovePath: [0, 1] });
    model.canMove();
    const traversable = t.calls.paths[0][3];
    assert.equal(traversable(makeStar(undefined)), true);
    assert.equal(traversable(makeStar({ team: 0 })), false);
    assert.equal(
      traversable(makeStar({ boss: true, mirrorMode: true })),
      false
    );
    assert.equal(
      traversable(makeStar({ boss: true, team: 0, conquestJumped: true })),
      true
    );
  });

  it("withholds the jump between the move and the turn's end", () => {
    setup();
    assert.equal(model.canMove(), false);
  });

  it("refuses to jump away from a boss in the player's system", () => {
    setup({
      lastAiPhaseTurn: 2,
      stars: [makeStar({ boss: true, team: 0 }), makeStar()],
    });
    assert.equal(model.canMove(), false);
  });

  it("refuses to jump away from a boss stacked on the player's star", () => {
    setup({
      lastAiPhaseTurn: 2,
      stars: [
        makeStar({ boss: true, team: 0, foes: [{ boss: true, team: 1 }] }),
        makeStar(),
      ],
    });
    assert.equal(model.canMove(), false);
  });

  it("refuses to jump away from a garrison", () => {
    setup({
      lastAiPhaseTurn: 2,
      stars: [makeStar({ team: 0, foes: [{ faction: 2 }] }), makeStar()],
    });
    assert.equal(model.canMove(), false);
  });

  it("withholds the jump from an unexplored system", () => {
    setup({ lastAiPhaseTurn: 2, stars: [makeStar(), makeStar()] });
    assert.equal(model.canMove(), false);
  });

  it("still allows a jump away from the Guardians", () => {
    setup({
      lastAiPhaseTurn: 2,
      stars: [makeStar({ boss: true, mirrorMode: true }), makeStar()],
    });
    assert.deepEqual(model.canMove(), [0, 1]);
  });

  it("disables movement, fighting and exploring during the AI phase", () => {
    const t = setup();
    t.aiPhase(true);
    assert.equal(model.canMove(), false);
    assert.equal(model.canFight(), false);
    assert.equal(model.canExplore(), false);
    t.aiPhase(false);
    assert.equal(model.canFight(), true);
  });
});

describe("losing to a boss", () => {
  it("loses the war on a defeat against a faction boss", () => {
    const t = setup({
      stars: [makeStar({ boss: true, team: 0 }), makeStar()],
    });
    t.game.loseTurn();
    assert.equal(t.calls.baseLoses, 1);
    assert.equal(t.game.gameState(), "lost");
  });

  // The gate must be swapped while the war still reads active: gw_play.js's
  // gameOverCHeck otherwise navigates through the scene's initial resolved
  // gate before the loss is saved.
  it("holds the exit gate until the loss is saved", async () => {
    const saveGate = makeDeferred();
    const t = setup({
      stars: [makeStar({ boss: true, team: 0 }), makeStar()],
      saveResult: saveGate,
    });
    t.game.loseTurn();
    assert.deepEqual(t.calls.gateWrites, [{ stateAtWrite: "active" }]);
    assert.deepEqual(t.calls.saves, [[t.game, true]]);
    let opened = false;
    model.exitGate().then(() => {
      opened = true;
    });
    await new Promise(setImmediate);
    assert.equal(opened, false);
    saveGate.resolve();
    await model.exitGate();
  });

  it("keeps the stock retreat against the Guardians", () => {
    const t = setup({
      stars: [makeStar({ boss: true, mirrorMode: true }), makeStar()],
    });
    t.game.loseTurn();
    assert.equal(t.game.gameState(), "active");
  });

  it("keeps the stock retreat against a garrison", () => {
    const t = setup({
      stars: [makeStar({ team: 0 }), makeStar()],
    });
    t.game.loseTurn();
    assert.equal(t.game.gameState(), "active");
  });

  it("runs the consumed turn's phase after a retreat", () => {
    const t = setup({
      stars: [makeStar({ team: 0 }), makeStar(undefined, { explored: true })],
      loseTurnEffect: (game) => game.currentStar(1),
    });
    t.game.loseTurn();
    assert.equal(t.calls.engineBoards.length, 1);
    assert.equal(t.calls.engineBoards[0].playerStar, 1);
  });

  it("runs no phase after a lost war", () => {
    const t = setup({
      stars: [
        makeStar({ boss: true, team: 0 }),
        makeStar(undefined, { explored: true }),
      ],
      loseTurnEffect: (game) => game.currentStar(1),
    });
    t.game.loseTurn();
    assert.equal(t.game.gameState(), "lost");
    assert.equal(t.calls.engineBoards.length, 0);
  });
});

describe("the pending fight stamp", () => {
  it("stamps the fought star when a fight launches", () => {
    const ai = { boss: true, team: 0, foes: [{ boss: true, team: 1 }] };
    const t = setup({
      stars: [
        makeStar(ai),
        makeStar({ team: 1 }),
        makeStar({ boss: true, mirrorMode: true }),
      ],
    });

    assert.equal(t.game.fight(), true);

    assert.equal(t.calls.baseFights, 1);
    const pending = t.cfg.pendingFight;
    assert.equal(pending.star, 0);
    assert.equal(pending.turn, 2);
    assert.deepEqual(pending.ai, ai);
    assert.notEqual(pending.ai, ai);
    assert.deepEqual(pending.owners, [0, 1, null]);
    // gw_play.js saves immediately after game.fight(); clearing the flag is
    // what makes that save carry the star systems the stamp lives in.
    assert.equal(t.game.saved(), false);
    assert.equal(t.calls.saves.length, 0);
  });

  it("records no owner for a boss that jumped the player", () => {
    const t = setup({
      stars: [
        makeStar({ boss: true, team: 0, conquestJumped: true }),
        makeStar({ team: 1 }),
      ],
    });
    assert.equal(t.game.fight(), true);
    assert.deepEqual(t.cfg.pendingFight.owners, [null, 1]);
  });

  it("leaves no stamp when the fight was refused", () => {
    const t = setup({
      fightResult: false,
      stars: [makeStar({ team: 0 }), makeStar()],
    });
    assert.equal(t.game.fight(), false);
    assert.equal(t.cfg.pendingFight, undefined);
    assert.equal(t.game.saved(), true);
  });

  it("is cleared by an in-scene defeatTeam", () => {
    const t = setup({
      turnState: "fight",
      pendingFight: {
        star: 0,
        turn: 2,
        ai: { boss: true, team: 0 },
        owners: [0, null],
      },
      stars: [makeStar({ boss: true, team: 0 }), makeStar()],
    });
    assert.ok(t.cfg.pendingFight);
    t.game.defeatTeam(0);
    assert.equal(t.cfg.pendingFight, undefined);
  });
});

// The base game applies lastBattleResult before scene mods load, so the
// host's own battle outcomes reach the driver only through the stamp.
describe("battle reconciliation at install", () => {
  it("keeps the stamp while the battle stands abandoned", () => {
    const t = setup({
      turnState: "fight",
      pendingFight: { star: 0, turn: 2, ai: { team: 0 }, owners: [0, null] },
      stars: [makeStar({ team: 0 }), makeStar()],
    });
    assert.ok(t.cfg.pendingFight);
    assert.equal(t.calls.saves.length, 0);
  });

  it("loses the war when the stock path applied a boss defeat", () => {
    const t = setup({
      currentStar: 0,
      pendingFight: {
        star: 1,
        turn: 2,
        ai: { boss: true, team: 0 },
        owners: [null, 0],
      },
      stars: [makeStar(), makeStar({ boss: true, team: 0 })],
    });
    assert.equal(t.game.gameState(), "lost");
    assert.equal(t.cfg.pendingFight, undefined);
    assert.deepEqual(t.calls.saves, [[t.game, true]]);
  });

  it("holds the exit gate until the reconciled loss is saved", async () => {
    const saveGate = makeDeferred();
    const t = setup({
      currentStar: 0,
      pendingFight: {
        star: 1,
        turn: 2,
        ai: { boss: true, team: 0 },
        owners: [null, 0],
      },
      stars: [makeStar(), makeStar({ boss: true, team: 0 })],
      saveResult: saveGate,
    });
    assert.deepEqual(t.calls.gateWrites, [{ stateAtWrite: "active" }]);
    assert.deepEqual(t.calls.saves, [[t.game, true]]);
    let opened = false;
    model.exitGate().then(() => {
      opened = true;
    });
    await new Promise(setImmediate);
    assert.equal(opened, false);
    saveGate.resolve();
    await model.exitGate();
  });

  it("leaves the exit gate alone when no loss ends the war", () => {
    const garrison = setup({
      currentStar: 0,
      pendingFight: { star: 1, turn: 2, ai: { team: 0 }, owners: [null, 0] },
      stars: [makeStar(), makeStar({ team: 0 })],
    });
    assert.equal(garrison.calls.gateWrites.length, 0);

    const bossWin = setup({
      currentStar: 0,
      pendingFight: {
        star: 0,
        turn: 2,
        ai: { boss: true, team: 0 },
        owners: [0, null],
      },
      stars: [makeStar(), makeStar({ boss: true, team: 1 })],
    });
    assert.equal(bossWin.calls.gateWrites.length, 0);
  });

  it("keeps the stock retreat when the lost fight was a garrison", () => {
    const t = setup({
      currentStar: 0,
      pendingFight: { star: 1, turn: 2, ai: { team: 0 }, owners: [null, 0] },
      stars: [makeStar(), makeStar({ team: 0 })],
    });
    assert.equal(t.game.gameState(), "active");
    assert.equal(t.cfg.pendingFight, undefined);
    assert.equal(t.calls.saves.length, 1);
  });

  // A stamp shape from before ai was recorded must not kill the install.
  it("reconciles a stamp with no recorded ai as a non-boss fight", () => {
    const rewound = setup({
      currentStar: 0,
      pendingFight: { star: 1, turn: 2, owners: [null, 0] },
      stars: [makeStar(), makeStar({ team: 0 })],
    });
    assert.equal(rewound.game.gameState(), "active");
    assert.equal(rewound.cfg.pendingFight, undefined);
    assert.deepEqual(rewound.calls.saves, [[rewound.game, true]]);
    assert.equal(rewound.calls.gateWrites.length, 0);

    const inPlace = setup({
      currentStar: 0,
      pendingFight: { star: 0, turn: 2, owners: [0, null] },
      stars: [makeStar(undefined, { cards: ["gwc_a"] }), makeStar()],
    });
    assert.deepEqual(inPlace.options.stars[0].cardList(), ["gwc_a"]);
    assert.equal(inPlace.cfg.pendingFight, undefined);
    assert.equal(inPlace.calls.saves.length, 1);
  });

  it("replays the Conquest elimination for a boss win the stock path resolved", () => {
    const t = setup({
      currentStar: 0,
      pendingFight: {
        star: 0,
        turn: 2,
        ai: { boss: true, team: 0, foes: [{ boss: true, team: 1 }] },
        owners: [0, 0, 1, null],
      },
      stars: [
        makeStar(undefined, { cards: ["gwc_a"] }),
        makeStar(undefined, { cards: ["gwc_b"] }),
        makeStar({ team: 1 }, { cards: ["gwc_c"] }),
        makeStar({ boss: true, mirrorMode: true }, { cards: ["loadout"] }),
      ],
    });

    assert.deepEqual(t.options.stars[0].cardList(), []);
    assert.deepEqual(t.options.stars[1].cardList(), []);
    assert.equal(t.options.stars[2].ai(), undefined);
    assert.deepEqual(t.options.stars[2].cardList(), []);
    assert.deepEqual(t.options.stars[3].cardList(), ["loadout"]);
    assert.equal(t.game.gameState(), "active");
    assert.deepEqual(t.calls.announced, [[{ team: 0 }, { team: 1 }]]);
    assert.deepEqual(t.calls.stats, ["gw_eliminate_faction"]);
    assert.equal(t.cfg.pendingFight, undefined);
    assert.deepEqual(t.calls.saves, [[t.game, true]]);
  });

  it("wins the war when the reconciled boss was the last", () => {
    const t = setup({
      currentStar: 0,
      pendingFight: {
        star: 0,
        turn: 2,
        ai: { boss: true, team: 0 },
        owners: [0, null],
      },
      stars: [makeStar(undefined, { cards: ["gwc_a"] }), makeStar()],
    });
    assert.equal(t.game.gameState(), "won");
  });

  it("reconciles a Guardians win, keeping the loadout offer", () => {
    const t = setup({
      currentStar: 0,
      pendingFight: {
        star: 0,
        turn: 2,
        ai: { boss: true, mirrorMode: true },
        owners: [null, 0],
      },
      stars: [
        makeStar(undefined, { cards: ["loadout"] }),
        makeStar({ boss: true, team: 0 }),
      ],
    });
    assert.deepEqual(t.options.stars[0].cardList(), ["loadout"]);
    assert.equal(t.game.gameState(), "active");
    assert.deepEqual(t.calls.announced, []);
  });

  it("clears the stamp after a garrison win without replaying anything", () => {
    const t = setup({
      currentStar: 0,
      pendingFight: { star: 0, turn: 2, ai: { team: 0 }, owners: [0, null] },
      stars: [makeStar(undefined, { cards: ["gwc_a"] }), makeStar()],
    });
    assert.deepEqual(t.calls.stats, []);
    assert.deepEqual(t.calls.announced, []);
    assert.deepEqual(t.options.stars[0].cardList(), ["gwc_a"]);
    assert.equal(t.cfg.pendingFight, undefined);
    assert.equal(t.calls.saves.length, 1);
  });
});

describe("Conquest defeatTeam", () => {
  it("clears the faction outright, cards included, with no foe inheritance", () => {
    const foe = { name: "Foe", faction: 2 };
    const bossStar = makeStar(
      { boss: true, team: 0, foes: [foe] },
      { cards: ["gwc_a"] }
    );
    const garrisonStar = makeStar({ team: 0 }, { cards: ["gwc_b"] });
    const survivorStar = makeStar({ boss: true, team: 1 });
    const t = setup({ stars: [bossStar, garrisonStar, survivorStar] });

    t.game.defeatTeam(0);

    assert.equal(bossStar.ai(), undefined);
    assert.deepEqual(bossStar.cardList(), []);
    assert.equal(garrisonStar.ai(), undefined);
    assert.deepEqual(garrisonStar.cardList(), []);
    assert.equal(survivorStar.ai().team, 1);
    assert.equal(t.game.gameState(), "active");
    assert.deepEqual(t.calls.announced, [[{ team: 0 }]]);
    assert.deepEqual(t.calls.stats, ["gw_eliminate_faction"]);
  });

  it("defeats every boss stacked on the fought star", () => {
    const stacked = { boss: true, team: 1 };
    const hostStar = makeStar({ boss: true, team: 0, foes: [stacked] });
    const stackedHome = makeStar({ team: 1 });
    const t = setup({
      currentStar: 0,
      stars: [hostStar, stackedHome],
    });

    t.game.defeatTeam(0);

    assert.equal(hostStar.ai(), undefined);
    assert.equal(stackedHome.ai(), undefined);
    assert.equal(t.game.gameState(), "won");
    assert.deepEqual(t.calls.announced, [[{ team: 0 }, { team: 1 }]]);
  });

  it("leaves other factions' ordinary foes in place", () => {
    const foreignFoe = { name: "Foe", faction: 0, createdTurn: 2 };
    const survivor = makeStar({ boss: true, team: 1, foes: [foreignFoe] });
    const t = setup({
      stars: [makeStar({ boss: true, team: 0 }), survivor],
    });

    t.game.defeatTeam(0);

    assert.deepEqual(survivor.ai().foes, [foreignFoe]);
  });

  it("removes a dead team's stacked boss from wherever it waits", () => {
    const stacked = { boss: true, team: 0 };
    const elsewhere = makeStar({ team: 1, foes: [stacked] });
    const t = setup({
      currentStar: 1,
      stars: [
        makeStar({ boss: true, team: 0 }),
        elsewhere,
        makeStar({ boss: true, team: 1 }),
      ],
    });

    t.game.defeatTeam(0);

    assert.equal(elsewhere.ai().foes, undefined);
    assert.equal(t.game.gameState(), "active");
  });

  it("clears a beaten Guardians star but keeps its cards", () => {
    const guardianStar = makeStar(
      { boss: true, mirrorMode: true },
      { cards: ["loadout"] }
    );
    const t = setup({
      currentStar: 0,
      stars: [guardianStar, makeStar({ boss: true, team: 0 })],
    });

    t.game.defeatTeam(undefined);

    assert.equal(guardianStar.ai(), undefined);
    assert.deepEqual(guardianStar.cardList(), ["loadout"]);
    assert.equal(t.game.gameState(), "active");
    assert.deepEqual(t.calls.announced, []);
  });

  it("wins the war when the last boss falls", () => {
    const t = setup({
      stars: [makeStar({ boss: true, team: 0 }), makeStar({ team: 0 })],
    });
    t.game.defeatTeam(0);
    assert.equal(t.game.gameState(), "won");
  });

  it("keeps the war alive while the Guardians remain", () => {
    const t = setup({
      stars: [
        makeStar({ boss: true, team: 0 }),
        makeStar({ boss: true, mirrorMode: true }),
      ],
    });
    t.game.defeatTeam(0);
    assert.equal(t.game.gameState(), "active");
  });
});
