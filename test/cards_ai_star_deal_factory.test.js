"use strict";

// gw_play/cards_ai_star_deal.js: the host deals every selectable AI star a card
// of its own, from the star's stream for the turn, then re-deals the viewers'
// star cards. The deal settles whatever happens, since model.win waits on it to
// save and open the exit gate.

const { describe, it, before, after } = require("node:test");
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
  installFakeJQuery,
  makeDeferred,
  rejected,
  resolved,
} = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

// The sweep's lookup, answered by the stub model's canSelect.
registerModuleStub(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_paths.js",
  { selectable: (model) => (index) => model.canSelect(index) }
);

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_ai_star_deal.js"
);
const gwoPromise = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js"
);

// Star 0 is the player's; 1 and 4 are selectable AI stars; 2 is an AI star out
// of reach; 3 is the treasure planet.
function makeSystems(cardLists) {
  return [0, 1, 2, 3, 4].map((index) => ({
    star: {
      index,
      ai: () => (index === 0 ? undefined : { name: "ai" + index }),
      cardList: makeObservable((cardLists && cardLists[index]) || []),
    },
  }));
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      viewer: false,
      selectable: [1, 3, 4],
      cardLists: {},
      gwoSettings: { treasureStar: 3 },
      failDeal: false,
      failRefresh: false,
      holdRefresh: undefined,
      turn: 7,
      // The host moving on while the deal runs.
      advanceTurnPerDeal: false,
      // Card names whose module load has not finished.
      holdNames: false,
    },
    overrides
  );
  const calls = {
    deals: [],
    actions: [],
    names: [],
    refreshes: [],
    errors: [],
  };
  const systems = makeSystems(options.cardLists);
  const starsDealing = makeObservable(0);
  const heldNames = [];

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  stubs.setGlobal("ko", { observable: makeObservable });
  stubs.setGlobal("console", { error: (text) => calls.errors.push(text) });
  stubs.setGlobal("model", {
    isCampaignViewer: () => options.viewer,
    galaxy: { systems: () => systems },
    canSelect: (index) => options.selectable.includes(index),
    sendCampaignAction: (name, payload) => calls.actions.push([name, payload]),
  });

  const handle = makeFactory({
    game: { stats: () => ({ turns: () => options.turn }) },
    chooseCards: (request) => {
      calls.deals.push(request);
      if (options.advanceTurnPerDeal) {
        options.turn += 1;
      }
      return options.failDeal
        ? rejected(new Error("deck gone"))
        : resolved([{ id: "dealt_" + request.star.index }]);
    },
    gwoTreasure: {
      isTreasureStar: (settings, index) =>
        !!settings && settings.treasureStar === index,
    },
    gwoSettings: options.gwoSettings,
    gwoStreams: {
      aiStarDealRng: (warRng, index, turns) => ({ warRng, index, turns }),
    },
    warRng: "war",
    cardNameSync: {
      setCardName: (system, card, index) => {
        calls.names.push([system.star.index, card, index]);
        if (options.holdNames) {
          const name = makeDeferred();
          heldNames.push(name);
          return name.promise();
        }
        return resolved();
      },
    },
    coopStarCards: {
      refresh: (refreshOptions) => {
        calls.refreshes.push(refreshOptions);
        if (options.holdRefresh) {
          return options.holdRefresh.promise();
        }
        return options.failRefresh ? rejected("no viewers") : resolved();
      },
    },
    gwoPromise,
    starsDealing,
  });

  return {
    calls,
    systems,
    handle,
    starsDealing,
    heldNames,
    restore: () => stubs.restoreGlobals(),
  };
}

const { build } = trackActive(setup);

const settle = () => new Promise(setImmediate);

describe("the AI stars' deal", () => {
  it("deals nothing on a viewer, and settles at once", async () => {
    const run = build({ viewer: true });

    await run.handle.dealCardToSelectableAI(false);

    assert.deepEqual(run.calls.deals, []);
    assert.deepEqual(run.calls.refreshes, []);
    assert.equal(run.handle.dealing(), 0);
  });

  it("deals nothing after a fight is won, since the explore that follows does", async () => {
    const run = build();

    await run.handle.dealCardToSelectableAI(true, "begin");

    assert.deepEqual(run.calls.deals, []);
    assert.deepEqual(run.calls.refreshes, []);
  });

  it("deals each selectable AI star a card from the star's stream for the turn", async () => {
    const run = build({ cardLists: { 4: [{ id: "last_turn" }] } });

    await run.handle.dealCardToSelectableAI(true, "end");

    assert.deepEqual(
      run.calls.deals.map((request) => [
        request.star.index,
        request.count,
        request.addSlot,
        request.systemCards,
        request.rng,
      ]),
      [
        [1, 1, false, [], { warRng: "war", index: 1, turns: 7 }],
        [
          4,
          1,
          false,
          [{ id: "last_turn" }],
          { warRng: "war", index: 4, turns: 7 },
        ],
      ]
    );
    assert.deepEqual(run.systems[1].star.cardList(), [{ id: "dealt_1" }]);
    assert.deepEqual(run.systems[4].star.cardList(), [{ id: "dealt_4" }]);
    assert.deepEqual(run.calls.actions, [
      ["sync_star_cards", { star: 1, cards: [{ id: "dealt_1" }] }],
      ["sync_star_cards", { star: 4, cards: [{ id: "dealt_4" }] }],
    ]);
    assert.deepEqual(run.calls.names, [
      [1, [{ id: "dealt_1" }], 1],
      [4, [{ id: "dealt_4" }], 4],
    ]);
    // The one re-deal of cards the viewers already hold.
    assert.deepEqual(run.calls.refreshes, [{ redeal: true }]);
  });

  it("leaves a star its card under static tech, and deals one that has none", async () => {
    const run = build({
      gwoSettings: { treasureStar: 3, staticTech: true },
      cardLists: { 1: [{ id: "kept" }] },
    });

    await run.handle.dealCardToSelectableAI(false);

    assert.deepEqual(
      run.calls.deals.map((request) => request.star.index),
      [4]
    );
    assert.deepEqual(run.systems[1].star.cardList(), [{ id: "kept" }]);
  });

  it("deals with no war settings", async () => {
    const run = build({ gwoSettings: undefined, selectable: [1] });

    await run.handle.dealCardToSelectableAI(false);

    assert.deepEqual(
      run.calls.deals.map((request) => request.star.index),
      [1]
    );
  });

  it("counts itself in flight until the viewers' re-deal settles", async () => {
    const hold = makeDeferred();
    const run = build({ holdRefresh: hold });
    let settled = false;

    const dealing = run.handle.dealCardToSelectableAI(false).then(() => {
      settled = true;
    });
    await settle();
    assert.equal(run.handle.dealing(), 1);
    assert.equal(settled, false);

    hold.resolve();
    await dealing;
    assert.equal(run.handle.dealing(), 0);
    assert.equal(settled, true);
  });

  // A win's hold also stops the host moving before its deal starts.
  it("counts a hold in flight, and as stars dealing, until its release, which counts once", () => {
    const run = build();

    const release = run.handle.hold();
    assert.equal(run.handle.dealing(), 1);
    assert.equal(run.starsDealing(), 1);

    const second = run.handle.hold();
    release();
    release();
    assert.equal(run.handle.dealing(), 1);
    assert.equal(run.starsDealing(), 1);

    second();
    assert.equal(run.handle.dealing(), 0);
    assert.equal(run.starsDealing(), 0);
  });

  it("logs a failed deal and still settles", async () => {
    const run = build({ failDeal: true });

    await run.handle.dealCardToSelectableAI(false);

    // The first star's failure stops the deal: it would fail for every star.
    assert.deepEqual(
      run.calls.deals.map((request) => request.star.index),
      [1]
    );
    assert.deepEqual(run.calls.actions, []);
    assert.deepEqual(run.calls.refreshes, []);
    assert.equal(run.handle.dealing(), 0);
    assert.equal(run.calls.errors.length, 1);
    assert.match(
      run.calls.errors[0],
      /^GWO failed to deal the AI stars' cards: Error: deck gone/
    );
  });

  it("logs a failed re-deal of the viewers' cards and still settles", async () => {
    const run = build({ failRefresh: true });

    await run.handle.dealCardToSelectableAI(false);

    assert.equal(run.handle.dealing(), 0);
    assert.deepEqual(run.calls.errors, [
      "GWO failed to deal the AI stars' cards: no viewers",
    ]);
  });
});

describe("the AI stars' deal - one star per task", () => {
  let timers;

  before(() => {
    timers = installFakeLodashTimers();
  });

  after(() => timers.restore());

  // Runs the deal's deferred tasks one at a time until none is left, noting
  // how many deals each task made, and the in-flight and stars-dealing counts
  // after it.
  async function stepThrough(run) {
    const steps = [];
    for (let guard = 0; guard < 100; guard += 1) {
      for (let tick = 0; tick < 50 && !timers.delayed.length; tick += 1) {
        await Promise.resolve();
      }
      if (!timers.delayed.length) {
        break;
      }
      const before = run.calls.deals.length;
      timers.delayed.shift().fn();
      for (let tick = 0; tick < 50; tick += 1) {
        await Promise.resolve();
      }
      steps.push([
        run.calls.deals.length - before,
        run.handle.dealing(),
        run.starsDealing(),
      ]);
    }
    return steps;
  }

  it("deals each star in a task of its own, in star order, counted in flight throughout", async () => {
    const hold = makeDeferred();
    const run = build({ holdRefresh: hold });

    const dealing = run.handle.dealCardToSelectableAI(false);
    // Counted before the first task, so a gap-fill cannot start meanwhile,
    // nor can the host move.
    assert.equal(run.handle.dealing(), 1);
    assert.equal(run.starsDealing(), 1);
    assert.deepEqual(run.calls.deals, []);

    const steps = await stepThrough(run);
    assert.deepEqual(run.calls.refreshes, [{ redeal: true }]);
    // The viewers' re-deal still counts as dealing, but the host may move.
    assert.equal(run.handle.dealing(), 1);
    assert.equal(run.starsDealing(), 0);

    hold.resolve();
    await dealing;

    assert.deepEqual(steps, [
      [1, 1, 1],
      [1, 1, 0],
    ]);
    assert.deepEqual(
      run.calls.actions.map(([name, payload]) => [name, payload.star]),
      [
        ["sync_star_cards", 1],
        ["sync_star_cards", 4],
      ]
    );
    assert.equal(run.handle.dealing(), 0);
  });

  it("deals every star at the turn the deal began", async () => {
    const run = build({ advanceTurnPerDeal: true });

    const dealing = run.handle.dealCardToSelectableAI(false);
    await stepThrough(run);
    await dealing;

    assert.deepEqual(
      run.calls.deals.map((request) => [request.star.index, request.rng.turns]),
      [
        [1, 7],
        [4, 7],
      ]
    );
  });

  it("stops at a star whose card handling throws, and still settles", async () => {
    const run = build();
    const cardList = run.systems[1].star.cardList;
    run.systems[1].star.cardList = (...args) => {
      if (args.length) {
        throw new Error("card list threw");
      }
      return cardList();
    };

    const dealing = run.handle.dealCardToSelectableAI(false);
    await stepThrough(run);
    await dealing;

    assert.deepEqual(
      run.calls.deals.map((request) => request.star.index),
      [1]
    );
    assert.deepEqual(run.calls.refreshes, []);
    assert.equal(run.handle.dealing(), 0);
    assert.equal(run.starsDealing(), 0);
    assert.match(
      run.calls.errors[0],
      /^GWO failed to deal the AI stars' cards: Error: card list threw/
    );
  });

  it("deals the next star without waiting for a star's name, and re-deals the viewers once every name is set", async () => {
    const run = build({ holdNames: true });

    const dealing = run.handle.dealCardToSelectableAI(false);
    const steps = await stepThrough(run);

    assert.deepEqual(
      steps.map((step) => step[0]),
      [1, 1]
    );
    assert.equal(run.starsDealing(), 0);
    assert.deepEqual(run.calls.refreshes, []);

    run.heldNames[0].resolve();
    await settle();
    assert.deepEqual(run.calls.refreshes, []);

    run.heldNames[1].resolve();
    await dealing;
    assert.deepEqual(run.calls.refreshes, [{ redeal: true }]);
  });
});
