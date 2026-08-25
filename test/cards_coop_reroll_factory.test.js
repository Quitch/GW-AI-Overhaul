"use strict";

// The two operator handlers gw_play/cards_coop_reroll.js registers: the host's
// side, which deals the smaller hand and stores it, and the viewer's, which
// applies the result that comes back. Neither is returned by the factory - they
// exist only as registered handlers, so they are captured off the model stub.
//
// computeRerollDeal and pendingTechRerollValidationError are pinned as pure
// functions in cards_coop_reroll.test.js; this covers the handlers around them.

const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_reroll.js"
);

const REQUEST = "gwo_reroll_pending_tech";
const RESULT = "gwo_reroll_pending_tech_result";

function inventoryClass() {
  return function GWInventory() {
    let loaded = [];
    this.load = (data) => {
      loaded = (data && data.cards) || [];
    };
    this.cards = () => loaded;
    this.applyCards = (done) => done();
  };
}

// Hung off the game stub as a trap. model.game().inventory() is always the
// host's, so a reroll that reached for it would deal the viewer a replacement
// hand weighted on the host's tech - see CLAUDE.md, "the inventory passed to it".
const HOST_CARDS = [{ id: "gwaio_host_only" }];

// A viewer part-way through an offer: three cards on offer, three still in hand,
// so two rerolls remain.
const pendingTechCards = (extra) =>
  Object.assign(
    {
      star: 2,
      cards: [{ id: "a" }, { id: "b" }, { id: "c" }],
      dealIndex: 4,
    },
    extra
  );

const record = (extra) =>
  Object.assign(
    {
      id: "alice",
      inventory: { cards: [] },
      pendingTechCards: pendingTechCards(),
    },
    extra
  );

function setup(overrides = {}) {
  const options = Object.assign(
    {
      records: { alice: record() },
      isHost: true,
      perPlayerTech: true,
      stars: [{ id: 0 }, { id: 1 }, { id: 2 }],
      cardsOffered: 3,
      containsLoadout: false,
      upsertOk: true,
      saveFails: false,
      manifestFails: false,
      hasHostOperator: true,
    },
    overrides
  );

  const calls = {
    deals: [],
    upserts: [],
    hostOperators: [],
    snapshots: [],
    saves: [],
    scanning: [],
    rerollPending: [],
    rerollsUsed: [],
    offerRerolls: [],
    bank: [],
    offerCounts: [],
    prepared: 0,
  };
  const handlers = {};

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  stubs.setGlobal("model", {
    isCampaignHost: () => options.isHost,
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    registerCampaignViewerOperatorHandler: (name, fn) => {
      handlers[name] = fn;
    },
    registerCampaignHostOperatorHandler: (name, fn) => {
      handlers[name] = fn;
    },
    sendCampaignHostOperator: options.hasHostOperator
      ? (name, payload, meta) => calls.hostOperators.push([name, payload, meta])
      : undefined,
    sendCampaignSnapshot: (name, flag) => calls.snapshots.push([name, flag]),
    gwoRerollPending: (value) => calls.rerollPending.push(value),
    scanning: (value) => calls.scanning.push(value),
    gwoRerollsUsed: (value) => calls.rerollsUsed.push(value),
    gwoOfferRerolls: (value) => calls.offerRerolls.push(value),
    prepareCoopPlayerInventories: () => {
      calls.prepared += 1;
      return Promise.resolve();
    },
  });

  const game = {
    findCoopPlayerInventoryData: (query) => options.records[query.id],
    upsertCoopPlayerInventoryData: (rec) => {
      if (!options.upsertOk) {
        return false;
      }
      calls.upserts.push(rec);
      options.records[rec.id] = rec;
      return true;
    },
    inventory: () => ({ cards: () => HOST_CARDS }),
  };

  makeFactory({
    game,
    galaxy: { stars: () => options.stars },
    chooseCards: (request) => {
      calls.deals.push(request);
      return Promise.resolve(
        Array.from({ length: request.count }, (unused, n) => ({
          id: "reroll_" + n,
        }))
      );
    },
    helpers: {
      cardsOfferedCount: (offer, inventory) => {
        calls.offerCounts.push(inventory);
        return options.cardsOffered;
      },
      pendingCardsContainLoadout: () => options.containsLoadout,
    },
    GWInventory: inventoryClass(),
    numCardsToOffer: 3,
    gwoSave: () => {
      calls.saves.push(true);
      return options.saveFails
        ? Promise.reject("save failed")
        : Promise.resolve();
    },
    GW: {
      manifest: {
        saveGame: () =>
          options.manifestFails
            ? Promise.reject(new Error("manifest failed"))
            : Promise.resolve(),
      },
    },
    gwoStreams: {
      coopRerollRng: (warRng, playerKey, dealIndex, rerollsUsed) => ({
        playerKey,
        dealIndex,
        rerollsUsed,
      }),
      coopPlayerKey: (rec, client) => client.id,
    },
    warRng: { seed: "war" },
    gwoBank: {
      suspendUnlocks: () => calls.bank.push("suspend"),
      resumeUnlocks: () => calls.bank.push("resume"),
    },
    stockBank: {},
  });

  return {
    handlers,
    calls,
    options,
    game,
    restore: () => stubs.restoreGlobals(),
  };
}

let active;

afterEach(() => {
  if (active) {
    active.restore();
    active = undefined;
  }
});

function build(overrides) {
  active = setup(overrides);
  return active;
}

const operator = (extra) =>
  Object.assign(
    {
      client_id: "alice",
      client_name: "alice",
      request_id: "req-1",
      payload: { star: 2, deal_index: 4 },
    },
    extra
  );

// The host handler rejects with a plain string, not an Error.
async function rejection(promise) {
  try {
    await promise;
  } catch (reason) {
    return reason;
  }
  return undefined;
}

async function captureErrors(run) {
  const errors = [];
  const priorError = console.error;
  console.error = (message) => errors.push(message);
  try {
    await run();
  } finally {
    console.error = priorError;
  }
  return errors;
}

const errorsSentBack = (calls) =>
  calls.hostOperators
    .filter((sent) => sent[1].error)
    .map((sent) => sent[1].error);

describe("host reroll handler - refusals", () => {
  it("registers itself against the reroll request operator", () => {
    const { handlers } = build();
    assert.equal(typeof handlers[REQUEST], "function");
    assert.equal(typeof handlers[RESULT], "function");
  });

  // No result is sent back here: a client that is not talking to a host with
  // per-player tech on has nothing to apply.
  it("rejects when this client is not a host running per-player tech", async () => {
    for (const off of [{ isHost: false }, { perPlayerTech: false }]) {
      const { handlers, calls } = build(off);
      assert.match(
        await rejection(handlers[REQUEST](operator())),
        /not campaign host or per-player tech disabled/
      );
      assert.deepEqual(calls.hostOperators, []);
      active.restore();
      active = undefined;
    }
  });

  it("tells the viewer when it has no offer to reroll", async () => {
    const { handlers, calls } = build({ records: {} });

    const errors = await captureErrors(async () => {
      assert.match(
        await rejection(handlers[REQUEST](operator())),
        /missing pending tech cards/
      );
    });

    assert.deepEqual(errorsSentBack(calls), ["missing pending tech cards"]);
    assert.equal(errors.length, 1);
  });

  it("refuses a request aimed at a different star or deal", async () => {
    const { handlers, calls } = build();

    const errors = await captureErrors(async () => {
      assert.match(
        await rejection(handlers[REQUEST](operator({ payload: { star: 9 } }))),
        /stale pending tech star/
      );
    });

    assert.deepEqual(errorsSentBack(calls), ["stale pending tech star"]);
    assert.deepEqual(calls.deals, []);
    assert.equal(errors.length, 1);
  });

  // A treasure planet's loadout is the whole offer, so there is nothing to
  // reroll it against.
  it("refuses to reroll a loadout offer", async () => {
    const { handlers, calls } = build({ containsLoadout: true });

    await captureErrors(() => rejection(handlers[REQUEST](operator())));

    assert.deepEqual(errorsSentBack(calls), [
      "loadout cards cannot be rerolled",
    ]);
  });

  it("refuses when the offer's star is no longer in the galaxy", async () => {
    const { handlers, calls } = build({ stars: [{ id: 0 }] });

    await captureErrors(() => rejection(handlers[REQUEST](operator())));

    assert.deepEqual(errorsSentBack(calls), ["missing pending tech star"]);
  });

  // One card left means every reroll has been spent: rerolling again would
  // leave the viewer with nothing to choose from.
  it("refuses once the rerolls are exhausted", async () => {
    const { handlers, calls } = build({
      records: {
        alice: record({
          pendingTechCards: pendingTechCards({ cards: [{ id: "a" }] }),
        }),
      },
    });

    await captureErrors(() => rejection(handlers[REQUEST](operator())));

    assert.deepEqual(errorsSentBack(calls), ["no pending tech rerolls remain"]);
    assert.deepEqual(calls.deals, []);
  });

  it("says nothing back to an operator carrying no client id", async () => {
    const { handlers, calls } = build({ records: {} });

    const errors = await captureErrors(() =>
      rejection(handlers[REQUEST](operator({ client_id: undefined })))
    );

    assert.deepEqual(calls.hostOperators, []);
    assert.equal(errors.length, 1);
  });

  it("does not try to answer a host with no operator channel", async () => {
    const { handlers, calls } = build({ records: {}, hasHostOperator: false });

    await captureErrors(() => rejection(handlers[REQUEST](operator())));

    assert.deepEqual(calls.hostOperators, []);
  });

  // A refusal names one player, so it has to be addressed to that player. The
  // server routes on target_client_id and strips it before the viewer sees it,
  // which means an unaddressed reply is a broadcast: one viewer's "no rerolls
  // left" landing on everybody's screen. See coop.md, "Addressing a host's reply".
  it("addresses every refusal to the viewer that asked", async () => {
    const refusals = {
      "no offer to reroll": { records: {} },
      "a loadout offer": { containsLoadout: true },
      "a star that has gone": { stars: [{ id: 0 }] },
      "the rerolls spent": {
        records: {
          alice: record({
            pendingTechCards: pendingTechCards({ cards: [{ id: "a" }] }),
          }),
        },
      },
    };

    for (const [name, overrides] of Object.entries(refusals)) {
      const { handlers, calls } = build(overrides);

      await captureErrors(() => rejection(handlers[REQUEST](operator())));

      assert.deepEqual(
        calls.hostOperators.map((sent) => sent[2]),
        [{ target_client_id: "alice", request_id: "req-1" }],
        name
      );
      active.restore();
      active = undefined;
    }
  });
});

describe("host reroll handler - the reroll", () => {
  it("deals one card fewer, stores it, and hands it back to the viewer", async () => {
    const { handlers, calls } = build();

    await handlers[REQUEST](operator());

    assert.equal(calls.deals[0].count, 2);
    assert.deepEqual(calls.deals[0].systemCards, []);

    const stored = calls.upserts[0].pendingTechCards;
    assert.deepEqual(stored.cards, [{ id: "reroll_0" }, { id: "reroll_1" }]);
    assert.equal(stored.star, 2);
    assert.equal(stored.dealIndex, 4);
    assert.equal(stored.cardsOffered, 3);
    assert.equal(stored.rerollsUsed, 1);

    const sent = calls.hostOperators[0];
    assert.equal(sent[0], RESULT);
    assert.deepEqual(sent[1].pendingTechCards, stored);
    assert.equal(sent[1].rerolls_used, 1);
    assert.equal(sent[1].offer_rerolls, true);
    assert.deepEqual(sent[2], {
      target_client_id: "alice",
      request_id: "req-1",
    });
  });

  // Dropping `inventory: playerInventory` from the chooseCards request leaves
  // the reroll falling back to the host's inventory, silently and with every
  // other assertion in this file still green.
  it("deals against the viewer's own saved cards, not the host's", async () => {
    const { handlers, calls } = build({
      records: {
        alice: record({ inventory: { cards: [{ id: "gwaio_alice_tech" }] } }),
      },
    });

    await handlers[REQUEST](operator());

    assert.deepEqual(calls.deals[0].inventory.cards(), [
      { id: "gwaio_alice_tech" },
    ]);
  });

  // The hand size is a function of what the player already holds, so reading it
  // off a different inventory than the one dealt against would size the
  // replacement offer on somebody else's full hand.
  it("sizes the replacement hand from the inventory it deals against", async () => {
    const { handlers, calls } = build();

    await handlers[REQUEST](operator());

    assert.equal(calls.offerCounts.length, 1);
    assert.equal(calls.offerCounts[0], calls.deals[0].inventory);
  });

  // A reroll is a child of the deal it replaces, so rerolling the same offer
  // twice gives a different hand each time.
  it("keys the deal to the viewer, the deal index and the reroll count", async () => {
    const { handlers, calls } = build();

    await handlers[REQUEST](operator());

    assert.deepEqual(calls.deals[0].rng, {
      playerKey: "alice",
      dealIndex: 4,
      rerollsUsed: 1,
    });
  });

  it("tells the viewer when the last reroll has been spent", async () => {
    const { handlers, calls } = build({
      records: {
        alice: record({
          pendingTechCards: pendingTechCards({
            cards: [{ id: "a" }, { id: "b" }],
          }),
        }),
      },
    });

    await handlers[REQUEST](operator());

    assert.equal(calls.hostOperators[0][1].offer_rerolls, false);
    assert.equal(calls.deals[0].count, 1);
  });

  it("broadcasts and saves the new offer", async () => {
    const { handlers, calls } = build();

    await handlers[REQUEST](operator());

    assert.deepEqual(calls.snapshots, [[REQUEST, true]]);
    assert.deepEqual(calls.saves, [true]);
  });

  it("rejects when the save fails, so the campaign queue can order it", async () => {
    const { handlers } = build({ saveFails: true });

    assert.equal(await rejection(handlers[REQUEST](operator())), "save failed");
  });

  it("tells the viewer when the new offer cannot be stored", async () => {
    const { handlers, calls } = build({ upsertOk: false });

    await captureErrors(() => rejection(handlers[REQUEST](operator())));

    assert.deepEqual(errorsSentBack(calls), [
      "failed to store rerolled pending tech",
    ]);
    assert.deepEqual(calls.saves, []);
  });

  // Their loadout card's buff() would otherwise bank into the host's own unlocks.
  it("suspends unlock banking around applying the viewer's cards", async () => {
    const { handlers, calls } = build({
      records: {
        alice: record({ inventory: { cards: [{ id: "gwc_start" }] } }),
      },
    });

    await handlers[REQUEST](operator());

    assert.deepEqual(calls.bank, ["suspend", "resume"]);
  });

  it("accepts a request that names neither star nor deal index", async () => {
    const { handlers, calls } = build();

    await handlers[REQUEST](operator({ payload: {} }));

    assert.equal(calls.upserts.length, 1);
  });
});

describe("viewer reroll result handler", () => {
  // The success path drops the scanning overlay on a 2s cosmetic beat via
  // _.delay. node:test's timer mocks cannot reach it - lodash 3 binds
  // context.setTimeout once, at load - so the beat is captured by swapping the
  // global lodash for one bound to a recording setTimeout. Left real, every
  // success test would leave a live timer firing into a torn-down model stub.
  const delayed = [];
  let realLodash;

  before(() => {
    realLodash = global._;
    global._ = realLodash.runInContext({
      setTimeout: (fn, wait) => delayed.push({ fn, wait }),
    });
  });

  after(() => {
    global._ = realLodash;
  });

  afterEach(() => {
    delayed.length = 0;
  });

  const result = (payload) => ({
    payload: Object.assign(
      {
        client_id: "alice",
        client_name: "alice",
        pendingTechCards: pendingTechCards({ cards: [{ id: "x" }] }),
        rerolls_used: 2,
        offer_rerolls: false,
        updated_at: 1234,
      },
      payload
    ),
  });

  it("clears the pending flag whatever the result says", async () => {
    const { handlers, calls } = build();
    await handlers[RESULT](result());
    assert.deepEqual(calls.rerollPending, [false]);
  });

  it("drops the scanning overlay a beat after a successful reroll", async () => {
    const { handlers, calls } = build();

    await handlers[RESULT](result());
    assert.deepEqual(calls.scanning, [], "the overlay must outlast the deal");

    assert.equal(delayed.length, 1);
    assert.equal(delayed[0].wait, 2000);
    delayed[0].fn();
    assert.deepEqual(calls.scanning, [false]);
  });

  it("stores the new offer and updates the reroll counters", async () => {
    const { handlers, calls } = build();

    await handlers[RESULT](result());

    assert.deepEqual(calls.upserts[0].pendingTechCards.cards, [{ id: "x" }]);
    assert.equal(calls.upserts[0].updatedAt, 1234);
    assert.deepEqual(calls.rerollsUsed, [2]);
    assert.deepEqual(calls.offerRerolls, [false]);
    assert.equal(calls.prepared, 1);
  });

  it("offers another reroll when the host says one remains", async () => {
    const { handlers, calls } = build();
    await handlers[RESULT](result({ offer_rerolls: true }));
    assert.deepEqual(calls.offerRerolls, [true]);
  });

  // A host that could not count the rerolls leaves the viewer's counter where
  // it was rather than resetting it.
  it("leaves the reroll counter alone when the host sent no count", async () => {
    const { handlers, calls } = build();
    await handlers[RESULT](result({ rerolls_used: undefined }));
    assert.deepEqual(calls.rerollsUsed, []);
    assert.equal(calls.upserts.length, 1);
  });

  // Every failure has to drop the scanning overlay, or the viewer is left
  // staring at it with no way forward.
  it("stops scanning and stores nothing when the host reports an error", async () => {
    const { handlers, calls } = build();

    const errors = await captureErrors(() =>
      handlers[RESULT](result({ error: "nope" }))
    );

    assert.deepEqual(calls.scanning, [false]);
    assert.deepEqual(calls.upserts, []);
    assert.match(errors[0], /pending tech reroll failed/);
  });

  it("stops scanning on a malformed result", async () => {
    for (const payload of [
      { pendingTechCards: undefined },
      { pendingTechCards: { star: "two", cards: [] } },
      { pendingTechCards: { star: 2, cards: "junk" } },
    ]) {
      const { handlers, calls } = build();
      const errors = await captureErrors(() =>
        handlers[RESULT](result(payload))
      );
      assert.deepEqual(calls.scanning, [false], JSON.stringify(payload));
      assert.deepEqual(calls.upserts, []);
      assert.match(errors[0], /invalid pending tech reroll result/);
      active.restore();
      active = undefined;
    }
  });

  // An operator with no payload at all reaches the handler through the campaign
  // dispatcher, which only checks the type. Its siblings in cards_start_subcdr.js
  // and coop_ping_operators.js guard the operator itself; this one has to as
  // well, or the viewer is left with the overlay up and a TypeError in the log.
  it("stops scanning on an operator with nothing in it", async () => {
    const { handlers, calls } = build();

    const errors = await captureErrors(() => handlers[RESULT](undefined));

    assert.deepEqual(calls.rerollPending, [false]);
    assert.deepEqual(calls.scanning, [false]);
    assert.deepEqual(calls.upserts, []);
    assert.match(errors[0], /invalid pending tech reroll result/);
  });

  it("stops scanning when the record it names is gone", async () => {
    const { handlers, calls } = build({ records: {} });

    const errors = await captureErrors(() => handlers[RESULT](result()));

    assert.deepEqual(calls.scanning, [false]);
    assert.match(errors[0], /missing inventory for pending tech reroll result/);
  });

  it("stops scanning when the result cannot be stored", async () => {
    const { handlers, calls } = build({ upsertOk: false });

    const errors = await captureErrors(() => handlers[RESULT](result()));

    assert.deepEqual(calls.scanning, [false]);
    assert.match(errors[0], /failed to apply pending tech reroll result/);
  });

  // Returned rather than fired and forgotten, so the base campaign queue can
  // order the save against the next operator.
  it("returns work the campaign queue can wait on", async () => {
    const { handlers } = build();
    const returned = handlers[RESULT](result());
    assert.equal(typeof returned.then, "function");
    await returned;
  });

  it("reports a failed manifest save without rejecting the handler", async () => {
    const { handlers } = build({ manifestFails: true });

    const errors = await captureErrors(() =>
      rejection(handlers[RESULT](result()))
    );

    assert.ok(
      errors.some((message) => /failed to save rerolled tech/.test(message))
    );
  });
});
