"use strict";

// gw_play/cards_coop_ai_pings.js: the glue that hands gw_play/coop_ai_pings.js
// the war it judges - which AIs ping, when a window is open, the stars each may
// ping, the card it would find there and its worth. coop_ai_pings.test.js pins
// the rules; this pins what they are given.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

const MOD = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const PINGS = MOD + "/gw_play/coop_ai_pings.js";
const THREAT = MOD + "/shared/star_threat.js";

// The rules module as shipped, but its factory records what it is handed, and
// valueOfCard what it judges.
const realPings = loadCouiModule(PINGS);
const handed = [];
const valued = [];
const updates = [];
registerModuleStub(
  PINGS,
  Object.assign(
    function (params) {
      handed.push(params);
      return { update: () => updates.push(true) };
    },
    realPings,
    {
      valueOfCard: (judge, holder, card, star, memo) => {
        valued.push({ judge, holder, card, star, memo });
        return Promise.resolve(10);
      },
    }
  )
);
registerModuleStub(THREAT, { measure: (ai) => ai.threat });

const makeGlue = loadCouiModule(MOD + "/gw_play/cards_coop_ai_pings.js");

function star(index, ai, explored, cards) {
  return {
    index,
    ai: () => ai,
    explored: () => explored,
    cardList: () => cards,
  };
}

// Stars 0 (the player's, explored), 1-3 AI stars, 4 explored AI star, 5 the
// treasure planet.
function makeStars() {
  return [
    star(0, undefined, true, []),
    star(1, { threat: 2 }, false, [{ id: "card_1" }]),
    star(2, { threat: 5 }, false, [{ id: "card_2" }]),
    star(3, { threat: 1 }, false, []),
    star(4, { threat: 9 }, true, [{ id: "card_4" }]),
    star(5, { threat: 3, treasurePlanet: true }, false, [{ id: "loadout" }]),
  ];
}

const AI_RECORD = {
  playerId: "gwo_ai_1",
  commander: "record_commander",
  gwaioAi: { name: "Sorian" },
  inventory: { tags: { global: { commander: "inventory_commander" } } },
  gwaioStarCards: { cards: { 1: { id: "own_1" }, 2: { id: "own_2" } } },
};

function setup(overrides = {}) {
  const options = Object.assign(
    {
      perPlayer: false,
      paths: { 1: [0, 1], 2: [0, 3, 2], 3: [0, 1, 2, 3], 5: [0, 5] },
      records: [AI_RECORD],
      pingAs: true,
    },
    overrides
  );
  handed.length = 0;
  valued.length = 0;
  updates.length = 0;
  const calls = { saves: 0, pinged: [] };
  const state = {
    hostingSession: true,
    lookup: { via: "groups" },
    starCardsBusy: false,
    aiStarDealing: 0,
    turn: "end",
    currentStar: 0,
    scanning: false,
    setupBlocked: false,
    deciding: false,
    gameOver: false,
    turns: 6,
    deals: 2,
  };
  const stars = makeStars();
  const game = {
    currentStar: () => state.currentStar,
    turnState: () => state.turn,
    stats: () => ({ turns: () => state.turns }),
    hostTechCardDealCount: () => state.deals,
  };
  const computeds = [];

  const stubs = createGlobalStubs();
  const timers = installFakeLodashTimers();
  stubs.setGlobal("ko", {
    computed: (fn) => {
      computeds.push(fn);
      fn();
    },
  });
  const model = {
    game: () => game,
    gwoCoopAi: {
      count: () => options.records.length,
      records: () => options.records,
    },
    scanning: () => state.scanning,
    gwCampaignPlayerSetupBlocked: () => state.setupBlocked,
    gwoCoopAiDeciding: () => state.deciding,
    gameOver: () => state.gameOver,
    gwCampaignPerPlayerTechCards: () => options.perPlayer,
    canSelect: (index) => options.paths[index],
    gwoPingStarAs: (star, sender) => {
      calls.pinged.push([star, sender]);
      return options.pingAs;
    },
  };
  stubs.setGlobal("model", model);

  const hostInventory = {
    save: () => {
      calls.saves += 1;
      return { saved: true, method: () => "dropped" };
    },
    getTag: (context, name) => context + ":" + name,
  };
  const judge = { name: "judge" };
  makeGlue({
    galaxy: { stars: () => stars },
    inventory: hostInventory,
    hostingSession: () => state.hostingSession,
    lookup: () => state.lookup,
    starCardsBusy: () => state.starCardsBusy,
    aiStarDealing: () => state.aiStarDealing,
    plain: (value) => JSON.parse(JSON.stringify(value)),
    judge,
  });

  return {
    calls,
    state,
    stars,
    game,
    model,
    judge,
    computeds,
    timers,
    params: handed[0],
    restore: () => {
      timers.restore();
      stubs.restoreGlobals();
    },
  };
}

const { build, release } = trackActive(setup);

describe("the co-op AI pings' window", () => {
  it("is open while the host's session is quiet after a turn", () => {
    const run = build();

    assert.equal(run.params.windowOpen(), true);
  });

  it("closes for anything that makes the war busy", () => {
    const closers = [
      ["no session", (state) => (state.hostingSession = false)],
      ["no lookup", (state) => (state.lookup = undefined)],
      ["exploring", (state) => (state.turn = "explore")],
      ["fighting", (state) => (state.turn = "fight")],
      ["no star", (state) => (state.currentStar = 99)],
      ["unexplored star", (state) => (state.currentStar = 1)],
      ["scanning", (state) => (state.scanning = true)],
      ["player setting up", (state) => (state.setupBlocked = true)],
      ["AI deciding", (state) => (state.deciding = true)],
      ["star cards dealing", (state) => (state.starCardsBusy = true)],
      ["AI stars dealing", (state) => (state.aiStarDealing = 1)],
      ["war over", (state) => (state.gameOver = true)],
    ];
    for (const [name, close] of closers) {
      release();
      const run = build();
      close(run.state);
      assert.equal(run.params.windowOpen(), false, name);
    }
  });

  it("stays shut with no AI in the session", () => {
    const run = build({ records: [] });

    assert.equal(run.params.windowOpen(), false);
  });

  it("reads the game the scene held when the pings were set up", () => {
    const run = build();
    run.model.game = () => ({ turnState: () => "fight" });

    assert.equal(run.params.windowOpen(), true);
  });

  it("keys a window by the turn, the star, the host's deals and the cards the AIs would find", () => {
    const run = build();

    const key = run.params.windowKey();

    assert.equal(
      key,
      realPings.windowKey(
        6,
        0,
        2,
        realPings.cardsDigest(["1=card_1", "2=card_2", "3=", "5=loadout"])
      )
    );
  });

  it("keys a window by each AI's own cards under per-player tech", () => {
    const run = build({ perPlayer: true });

    assert.equal(
      run.params.windowKey(),
      realPings.windowKey(
        6,
        0,
        2,
        realPings.cardsDigest([
          "gwo_ai_1@1=own_1",
          "gwo_ai_1@2=own_2",
          "gwo_ai_1@3=",
          "gwo_ai_1@5=",
        ])
      )
    );
  });

  it("schedules an update when anything a window depends on changes", () => {
    const run = build();
    assert.equal(run.computeds.length, 1);
    assert.deepEqual(
      run.timers.delayed.map((timer) => timer.wait),
      [1]
    );

    run.computeds[0]();
    run.timers.delayed.forEach((timer) => timer.fn());

    assert.equal(updates.length, 2);
  });
});

describe("what the co-op AI pings judge", () => {
  it("lists each AI player by id and name", () => {
    const run = build();

    assert.deepEqual(run.params.ais(), [
      { id: "gwo_ai_1", name: "Sorian", record: AI_RECORD },
    ]);
  });

  it("offers the reachable unexplored AI stars, the treasure planet only when alone", () => {
    const run = build();

    assert.deepEqual(run.params.candidates(), [
      { star: 1, hops: 1, threat: 2, treasure: false },
      { star: 2, hops: 2, threat: 5, treasure: false },
      { star: 3, hops: 3, threat: 1, treasure: false },
    ]);

    release();
    const alone = build({ paths: { 5: [0, 5] } });
    assert.deepEqual(alone.params.candidates(), [
      { star: 5, hops: 1, threat: 3, treasure: true },
    ]);
  });

  it("skips the current star and a star with no path", () => {
    const run = build({ paths: { 1: [0, 1], 2: [] } });
    run.state.currentStar = 1;

    assert.deepEqual(run.params.candidates(), []);
  });

  it("measures the threat of every unexplored AI star", () => {
    const run = build();

    assert.deepEqual(run.params.allThreats(), [2, 5, 1, 3]);
  });

  it("finds the star's card under shared tech, the AI's own under per-player tech", () => {
    const shared = build();
    const ai = shared.params.ais()[0];
    assert.deepEqual(shared.params.cardFor(ai, 1), { id: "card_1" });
    assert.equal(shared.params.cardFor(ai, 3), undefined);

    release();
    const perPlayer = build({ perPlayer: true });
    assert.deepEqual(perPlayer.params.cardFor(ai, 2), { id: "own_2" });
    assert.equal(perPlayer.params.cardFor(ai, 3), undefined);
  });

  it("judges an AI's cards against its own inventory under per-player tech", async () => {
    const run = build({ perPlayer: true });
    const ai = run.params.ais()[0];
    const memo = {};

    assert.equal(await run.params.valueOf(ai, { id: "own_1" }, 1, memo), 10);

    assert.deepEqual(memo.holder, {
      playerId: "gwo_ai_1",
      inventory: AI_RECORD.inventory,
      commander: "inventory_commander",
    });
    assert.equal(valued[0].judge, run.judge);
    assert.equal(valued[0].star, run.stars[1]);
    assert.equal(valued[0].memo, memo);
  });

  it("falls back to the record's commander where the inventory names none", async () => {
    const record = Object.assign({}, AI_RECORD, { inventory: {} });
    const run = build({ perPlayer: true, records: [record] });
    const memo = {};

    await run.params.valueOf(run.params.ais()[0], { id: "x" }, 1, memo);

    assert.equal(memo.holder.commander, "record_commander");
  });

  it("judges against one plain save of the host's inventory a window under shared tech", async () => {
    const run = build();
    const ai = run.params.ais()[0];
    const memo = {};

    await run.params.valueOf(ai, { id: "card_1" }, 1, memo);
    await run.params.valueOf(ai, { id: "card_2" }, 2, memo);

    assert.equal(run.calls.saves, 1);
    assert.deepEqual(memo.holder, {
      playerId: "gwo_ai_1",
      inventory: { saved: true },
      commander: "global:commander",
    });
    assert.equal(valued[1].holder, valued[0].holder);
  });

  it("pings as the AI through the host", () => {
    const run = build();

    assert.equal(run.params.ping(2, { id: "gwo_ai_1" }), true);
    assert.deepEqual(run.calls.pinged, [[2, { id: "gwo_ai_1" }]]);

    release();
    const refused = build({ pingAs: false });
    assert.equal(refused.params.ping(2, {}), false);
  });
});
