"use strict";

// gw_play/victory.js. The order it writes in is the whole point: gw_play.js's
// gameOverCHeck opens gw_war_over the instant gameOver() flips, so a gate left
// resolved loses the save and the victory stat.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");
const {
  makeObservable: observable,
} = require("../scripts/lib/fake-knockout.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/victory.js"
);

const WAR_END = "gwo_war_end";

let stubs;

function setup(overrides = {}) {
  const options = Object.assign(
    {
      gameState: "won",
      turnState: "begin",
      currentStar: 4,
      treasureStar: 9,
      canUnlockLoadout: false,
      perPlayerTech: false,
      isViewer: false,
      records: [{ gwaioUnlockedStartCardIds: [] }],
      stars: [],
    },
    overrides
  );

  const calls = { operators: [], handlers: {}, stats: [], unlockQueries: [] };
  const saves = [];
  const stats = [];
  const gateWrites = [];

  const gameState = observable(options.gameState);
  const turnState = observable(options.turnState);
  turnState.subscribe(() => gateWrites.push(model.exitGate()));

  const game = {
    gameState,
    turnState,
    currentStar: () => options.currentStar,
    galaxy: () => ({ stars: () => options.stars }),
    coopPlayerInventoryData: () => options.records,
  };

  stubs = createGlobalStubs();
  stubs.setGlobal("$", {
    Deferred: makeDeferred,
    when: (value) => {
      const settled = makeDeferred();
      // Braces, not a bare arrow: returning the rejected deferred would have the
      // chain adopt it, and nothing is attached to that copy.
      Promise.resolve(value).then(
        () => {
          settled.resolve();
        },
        () => {
          settled.reject();
        }
      );
      return settled;
    },
  });
  stubs.setGlobal("api", {
    tally: {
      incStatInt: (stat) => {
        calls.stats.push(stat);
        const pending = makeDeferred();
        stats.push(pending);
        return pending;
      },
    },
  });

  const exitGate = observable(makeDeferred().resolve());
  stubs.setGlobal("model", {
    exitGate,
    isCampaignViewer: () => options.isViewer,
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    sendCampaignHostOperator: (type, payload) =>
      calls.operators.push([type, payload]),
    registerCampaignHostOperatorHandler: (type, handler) => {
      calls.handlers[type] = handler;
    },
  });

  const treasure = {
    isTreasureStar: (settings, star) => settings.treasureStar === star,
    findTreasureStar: (stars) => stars.indexOf("treasure"),
    localUnlockedLoadoutIds: () => ["gwaio_start_ceo"],
    anyPlayerCanUnlockLoadout: (params) => {
      calls.unlockQueries.push(params);
      return options.canUnlockLoadout;
    },
  };

  const victory = makeFactory({
    game,
    gwoSettings: options.treasureStar === undefined ? {} : options,
    save: (...args) => {
      const pending = makeDeferred();
      saves.push({ args, pending });
      return pending;
    },
    treasure,
    stockBank: "stock-bank",
    gwoBank: "gwo-bank",
  });

  return { victory, game, calls, saves, stats, gateWrites, exitGate, options };
}

// Whether the deferred jQuery hands back has run its always() handlers yet.
function settled(deferred) {
  let done = false;
  deferred.then(
    () => (done = true),
    () => (done = true)
  );
  return Promise.resolve()
    .then(() => Promise.resolve())
    .then(() => done);
}

afterEach(() => {
  stubs.restoreGlobals();
});

describe("ending a won war", () => {
  it("closes the gate before it ends the turn, and holds it open until the war is saved", async () => {
    const { victory, game, gateWrites, exitGate, saves, stats } = setup();
    const originalGate = exitGate();

    victory.endWarIfWon();

    assert.equal(game.turnState(), "end");
    assert.equal(gateWrites.length, 1);
    assert.notEqual(
      gateWrites[0],
      originalGate,
      "gw_war_over opens against whichever gate was in place when the turn ended"
    );
    assert.equal(await settled(gateWrites[0]), false);
    assert.deepEqual(saves[0].args, [game, true]);

    saves[0].pending.resolve();
    await settled(saves[0].pending);
    stats[0].resolve();

    assert.equal(await settled(exitGate()), true);
  });

  it("books the victory the base game books", async () => {
    const { victory, calls, saves, stats } = setup();

    victory.endWarIfWon();
    saves[0].pending.resolve();
    await settled(saves[0].pending);

    assert.deepEqual(calls.stats, ["gw_war_victory"]);
    stats[0].resolve();
    await settled(stats[0]);
  });

  it("opens the gate even when the save fails", async () => {
    const { victory, exitGate, saves, stats } = setup();

    victory.endWarIfWon();
    saves[0].pending.reject("disk full");
    await settled(saves[0].pending);
    stats[0].resolve();

    assert.equal(await settled(exitGate()), true);
  });

  it("opens the gate even when the stat write fails", async () => {
    const { victory, exitGate, saves, stats } = setup();

    victory.endWarIfWon();
    saves[0].pending.resolve();
    await settled(saves[0].pending);
    stats[0].reject("no connection");

    assert.equal(await settled(exitGate()), true);
  });

  it("does nothing for a war that is not won, or a turn already ended", () => {
    const active = setup({ gameState: "active" });
    active.victory.endWarIfWon();
    assert.equal(active.game.turnState(), "begin");
    assert.equal(active.saves.length, 0);
    stubs.restoreGlobals();

    const ending = setup({ turnState: "end" });
    ending.victory.endWarIfWon();
    assert.equal(ending.saves.length, 0);
  });

  it("ends the war once, however often it is asked", () => {
    const { victory, saves } = setup();

    victory.endWarIfWon();
    victory.endWarIfWon();
    victory.endWar();

    assert.equal(saves.length, 1);
  });

  it("ends a war won while the scene is open", async () => {
    const { game, saves } = setup({ gameState: "active" });

    game.gameState("won");
    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(game.turnState(), "end");
    assert.equal(saves.length, 1);
  });
});

// The Guardians carry ai.boss, so beating them can be what wins the war - and
// their star is the one place where exploring after the win still pays.
describe("the treasure star", () => {
  it("keeps the base game's explore step while a loadout is still winnable", () => {
    const { victory, game, calls, saves } = setup({
      currentStar: 9,
      canUnlockLoadout: true,
    });

    victory.endWarIfWon();

    assert.equal(game.turnState(), "begin");
    assert.equal(saves.length, 0);
    assert.deepEqual(calls.operators, []);
  });

  it("ends the war at once when every loadout is already held", () => {
    const { victory, game } = setup({ currentStar: 9 });

    victory.endWarIfWon();

    assert.equal(game.turnState(), "end");
  });

  it("asks about the local banks and every co-op record", () => {
    const { victory, calls, options } = setup({
      currentStar: 9,
      perPlayerTech: true,
    });

    victory.endWarIfWon();

    assert.deepEqual(calls.unlockQueries, [
      {
        localUnlockedIds: ["gwaio_start_ceo"],
        records: options.records,
        perPlayerTech: true,
      },
    ]);
  });

  // A war generated before gw_start recorded the index. bugfixes.js derives it,
  // but asynchronously, so this cannot wait on that having happened.
  it("finds the star itself when the war never recorded one", () => {
    const { victory, game } = setup({
      treasureStar: undefined,
      currentStar: 1,
      stars: ["ordinary", "treasure"],
      canUnlockLoadout: true,
    });

    victory.endWarIfWon();

    assert.equal(game.turnState(), "begin");
  });

  it("leaves an ordinary star alone even with loadouts unwon", () => {
    const { victory, game } = setup({ canUnlockLoadout: true });

    victory.endWarIfWon();

    assert.equal(game.turnState(), "end");
  });
});

// Bank contents are local to each client, so only the host can weigh what is
// still winnable. Viewers are told.
describe("co-op", () => {
  it("tells the viewers before it ends the war", () => {
    const { victory, calls } = setup();

    victory.endWarIfWon();

    assert.deepEqual(calls.operators, [[WAR_END, {}]]);
  });

  it("leaves a viewer waiting for that message", async () => {
    const { game, calls, saves } = setup({ isViewer: true });

    await new Promise((resolve) => setTimeout(resolve, 0));

    assert.equal(game.turnState(), "begin");
    assert.deepEqual(calls.operators, []);
    assert.equal(saves.length, 0);

    calls.handlers[WAR_END]({ payload: {} });

    assert.equal(game.turnState(), "end");
    assert.equal(saves.length, 1);
  });
});
