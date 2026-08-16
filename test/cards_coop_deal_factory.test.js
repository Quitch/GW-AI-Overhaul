"use strict";

// The host-side pending-tech deal installed by gw_play/cards_coop_deal.js:
// model.dealCoopPlayerPendingTechCards. Stock gw_play.js always deals a viewer
// exactly 3 cards; this is what honours bonus-card rules, per-player loadouts and
// the treasure planet instead.
//
// The factory reaches `model` and `$` as scene globals, so both are stubbed here.
// collectPendingTechTargets and dealCountForHand are pinned on their own in
// cards_coop_deal.test.js; what this file covers is the deal they drive.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const _ = require("lodash");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_deal.js"
);

// Injected in place of the cardsOfferedCount stub where the subject is the hand
// size itself rather than the deal it feeds.
const realHelpers = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js"
);

const viewer = (id) => ({ id, name: id, role: "viewer" });

const record = (id, extra) =>
  Object.assign({ id, inventory: { cards: [] } }, extra);

// Hung off the game stub as a trap. model.game().inventory() is always the
// host's, so a per-player deal that reached for it would weight every viewer's
// hand on the host's tech - see CLAUDE.md, "the inventory passed to it". It
// holds Lucky and reports a full hand, the two things that grow an offer.
const HOST_CARDS = [{ id: "gwaio_host_only" }, { id: "gwaio_start_lucky" }];

const hostInventory = () => ({
  cards: () => HOST_CARDS,
  handIsFull: () => true,
  hasCard: (id) => HOST_CARDS.some((card) => card.id === id),
});

// jQuery 2's $.when: waits on anything thenable and passes everything else
// through. The factory only ever hands it its own deferreds.
function fakeWhen() {
  const args = Array.prototype.slice.call(arguments);
  return Promise.all(
    args.map((arg) =>
      arg && typeof arg.then === "function" ? arg : Promise.resolve(arg)
    )
  );
}

function inventoryClass() {
  return function GWInventory() {
    let loaded = [];
    let limit = 0;
    this.load = (data) => {
      loaded = (data && data.cards) || [];
      limit = (data && data.maxCards) || 0;
    };
    this.cards = () => loaded;
    this.handIsFull = () => loaded.length >= limit;
    this.hasCard = (id) => loaded.some((card) => card.id === id);
    this.applyCards = (done) => done();
  };
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      records: { alice: record("alice") },
      viewers: [viewer("alice")],
      campaignActive: true,
      isHost: true,
      perPlayerTech: true,
      dealCount: () => 0,
      treasureStar: undefined,
      cardsOffered: 3,
      realHelpers: false,
      sendMessage: undefined,
      loadoutPool: [{ id: "gwc_start_orbital" }],
    },
    overrides
  );

  const calls = { deals: [], sent: [], actions: [], bank: [], offerCounts: [] };

  const stubs = createGlobalStubs();
  const $ = function () {};
  $.Deferred = makeDeferred;
  $.when = fakeWhen;
  stubs.setGlobal("$", $);
  stubs.setGlobal("model", {
    gwCampaignActive: () => options.campaignActive,
    isCampaignHost: () => options.isHost,
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    gwCampaignConnectedClients: () => options.viewers,
    getCoopPlayerTechCardDealCount: (rec) => options.dealCount(rec),
    send_message: options.sendMessage,
    sendCampaignAction: (name, payload) => calls.actions.push([name, payload]),
  });

  makeFactory({
    game: {
      findCoopPlayerInventoryData: (query) => options.records[query.id],
      hostTechCardDealCount: () => 4,
      hostTechCardDealHistory: () => ["star-1"],
      inventory: hostInventory,
    },
    chooseCards: (request) => {
      calls.deals.push(request);
      return Promise.resolve(
        _.times(request.count, (n) => ({ id: "dealt_" + n }))
      );
    },
    helpers: {
      cardsOfferedCount: (offer, inventory) => {
        calls.offerCounts.push(inventory);
        return options.realHelpers
          ? realHelpers.cardsOfferedCount(offer, inventory)
          : options.cardsOffered;
      },
      buildPendingStartLoadoutCard: (card) => ({
        id: card.id,
        startLoadout: true,
      }),
    },
    GWInventory: inventoryClass(),
    numCardsToOffer: 3,
    gwoStreams: {
      coopDealRng: (warRng, playerKey, dealIndex) => ({ playerKey, dealIndex }),
      coopPlayerKey: (rec, client) => client.id,
      treasureLoadoutRng: (warRng, playerKey, starIndex) => ({
        pick: (pool) => pool[0],
        playerKey,
        starIndex,
      }),
    },
    warRng: { seed: "war" },
    gwoBank: {
      suspendUnlocks: () => calls.bank.push("suspend"),
      resumeUnlocks: () => calls.bank.push("resume"),
    },
    stockBank: {},
    gwoTreasure: {
      isTreasureStar: (settings, starIndex) =>
        settings.treasureStar === starIndex,
      recordHasUnlockedLoadout: () => false,
      pickTreasureLoadout: (params) => ({
        id: params.rng.pick(options.loadoutPool).id,
        startLoadout: true,
      }),
    },
    coopStarCards: {
      starCardForClient: (rec, starIndex) =>
        rec.gwaioStarCards && rec.gwaioStarCards.cards[String(starIndex)],
    },
    gwoSettings: { treasureStar: options.treasureStar },
  });

  return { calls, options, restore: () => stubs.restoreGlobals() };
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

const deal = (starIndex, star, options) =>
  global.model.dealCoopPlayerPendingTechCards(
    starIndex,
    star || { id: "star" },
    options
  );

// The deferred rejects with a plain string, which `assert.rejects` will not take
// as an error, so the reason is captured instead.
async function rejection(promise) {
  try {
    await promise;
  } catch (reason) {
    return reason;
  }
  return undefined;
}

describe("dealCoopPlayerPendingTechCards - when it deals", () => {
  it("resolves empty outside an active co-op campaign", async () => {
    for (const off of [
      { campaignActive: false },
      { isHost: false },
      { perPlayerTech: false },
    ]) {
      const { calls } = build(off);
      assert.deepEqual(await deal(1), [], JSON.stringify(off));
      assert.deepEqual(calls.deals, []);
      active.restore();
      active = undefined;
    }
  });

  it("resolves empty when no viewer is connected", async () => {
    const { calls } = build({ viewers: [] });
    assert.deepEqual(await deal(1), []);
    assert.deepEqual(calls.deals, []);
  });

  // A campaign that has not synced its clients yet answers with nothing at all.
  // Defended twice - the _.isArray guard and lodash's own tolerance of a
  // non-array - so this only goes red if both go, which is the point of having
  // it: neither defence is individually load-bearing, and the behaviour is.
  it("survives a campaign that has no client list yet", async () => {
    const { calls } = build({ viewers: undefined });
    assert.deepEqual(await deal(1), []);
    assert.deepEqual(calls.deals, []);
  });

  it("deals to an explicit client list rather than everyone connected", async () => {
    const { calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: { alice: record("alice"), bob: record("bob") },
    });

    await deal(1, undefined, { clients: [viewer("bob")] });

    assert.deepEqual(
      calls.deals.map((request) => request.rng.playerKey),
      ["bob"]
    );
  });

  // The catch-up path: the server replays each outstanding deal in turn, and a
  // viewer already level with that index must not be dealt a second hand.
  it("skips a viewer already level with the deal index", async () => {
    const { calls } = build({ dealCount: () => 2 });
    assert.deepEqual(await deal(1, undefined, { dealIndex: 2 }), []);
    assert.deepEqual(calls.deals, []);
  });
});

describe("dealCoopPlayerPendingTechCards - validation", () => {
  it("rejects when a viewer has no inventory record at all", async () => {
    build({ records: {} });
    assert.match(await rejection(deal(1)), /Missing inventory data/);
  });

  it("rejects when a viewer's record has no saved inventory", async () => {
    build({ records: { alice: { id: "alice" } } });
    assert.match(await rejection(deal(1)), /Missing saved inventory/);
  });

  // Dealing over an unanswered offer loses whatever the viewer was mid-way
  // through choosing.
  it("rejects when a viewer already holds an offer", async () => {
    build({
      records: { alice: record("alice", { pendingTechCards: { star: 3 } }) },
    });
    assert.match(await rejection(deal(1)), /already has pending tech cards/);
  });

  // Both orderings, because they fail differently: a viewer already collected
  // has to be discarded, and a viewer after the failure has to be skipped
  // rather than validated a second time against a half-built target list.
  it("deals to nobody when one viewer fails validation", async () => {
    const { calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: { alice: record("alice") },
    });

    await rejection(deal(1));

    assert.deepEqual(calls.deals, []);
  });

  it("stops at the first failure rather than going on to later viewers", async () => {
    const { calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: { bob: record("bob") },
    });

    assert.match(await rejection(deal(1)), /Missing inventory data/);
    assert.deepEqual(calls.deals, []);
  });
});

describe("dealCoopPlayerPendingTechCards - the hand", () => {
  it("deals a full hand to a viewer with no pre-dealt card", async () => {
    const { calls } = build();

    const updates = await deal(1);

    assert.equal(calls.deals[0].count, 3);
    assert.deepEqual(updates[0].pendingTechCards.cards, [
      { id: "dealt_0" },
      { id: "dealt_1" },
      { id: "dealt_2" },
    ]);
    assert.equal(updates[0].pendingTechCards.star, 1);
    assert.equal(updates[0].pendingTechCards.cardsOffered, 3);
    assert.equal(updates[0].client_id, "alice");
  });

  // The stored hand stays cardsOffered long either way, which is what
  // cards_coop_reroll.js infers the spent rerolls from.
  it("deals one fewer card when the viewer holds a pre-dealt one, and appends it last", async () => {
    const { calls } = build({
      records: {
        alice: record("alice", {
          gwaioStarCards: { cards: { 1: { id: "pre_dealt" } } },
        }),
      },
    });

    const updates = await deal(1);

    assert.equal(calls.deals[0].count, 2);
    assert.deepEqual(calls.deals[0].systemCards, [{ id: "pre_dealt" }]);
    assert.deepEqual(updates[0].pendingTechCards.cards, [
      { id: "dealt_0" },
      { id: "dealt_1" },
      { id: "pre_dealt" },
    ]);
  });

  it("still deals one card when the offer is entirely pre-dealt", async () => {
    const { calls } = build({
      cardsOffered: 1,
      records: {
        alice: record("alice", {
          gwaioStarCards: { cards: { 1: { id: "pre_dealt" } } },
        }),
      },
    });

    await deal(1);

    assert.equal(calls.deals[0].count, 1);
  });

  it("keys each viewer's hand to their own stream and the host's deal index", async () => {
    const { calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: { alice: record("alice"), bob: record("bob") },
    });

    await deal(1, undefined, { dealIndex: 5 });

    assert.deepEqual(
      calls.deals.map((request) => request.rng),
      [
        { playerKey: "alice", dealIndex: 5 },
        { playerKey: "bob", dealIndex: 5 },
      ]
    );
  });

  // Applying a viewer's cards runs their loadout card's buff(), which would
  // otherwise unlock that loadout into the host's own banks.
  it("suspends unlock banking around applying a viewer's saved cards", async () => {
    const { calls } = build({
      records: {
        alice: record("alice", { inventory: { cards: [{ id: "gwc_start" }] } }),
      },
    });

    await deal(1);

    assert.deepEqual(calls.bank, ["suspend", "resume"]);
  });

  it("does not touch banking for a viewer with an empty inventory", async () => {
    const { calls } = build();
    await deal(1);
    assert.deepEqual(calls.bank, []);
  });
});

describe("dealCoopPlayerPendingTechCards - whose inventory", () => {
  // Dropping `inventory: inventory` from the chooseCards request leaves the
  // deal falling back to the host's, silently and with every other assertion
  // in this file still green.
  it("deals each viewer against their own saved cards, not the host's", async () => {
    const { calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: record("alice", {
          inventory: { cards: [{ id: "gwaio_alice_tech" }] },
        }),
        bob: record("bob", {
          inventory: { cards: [{ id: "gwaio_bob_tech" }] },
        }),
      },
    });

    await deal(1);

    assert.deepEqual(
      calls.deals.map((request) => request.inventory.cards()),
      [[{ id: "gwaio_alice_tech" }], [{ id: "gwaio_bob_tech" }]]
    );
  });

  // The hand size is a function of what the player already holds, so reading it
  // off a different inventory than the one dealt against would size a viewer's
  // offer on somebody else's Lucky Commander or full hand.
  it("sizes the hand from the inventory it deals against", async () => {
    const { calls } = build({
      records: {
        alice: record("alice", {
          inventory: { cards: [{ id: "gwaio_alice_tech" }] },
        }),
      },
    });

    await deal(1);

    assert.equal(calls.offerCounts.length, 1);
    assert.equal(calls.offerCounts[0], calls.deals[0].inventory);
  });
});

// Everywhere else cardsOfferedCount is a constant, so the bonus rules are only
// pinned against a bare inventory shape in cards_deal_helpers.test.js. Here the
// real helper runs, against a viewer's inventory and a host holding both bonuses.
describe("dealCoopPlayerPendingTechCards - the bonus rules", () => {
  const viewerHolding = (cards, maxCards) => ({
    realHelpers: true,
    records: {
      alice: record("alice", { inventory: { cards, maxCards } }),
    },
  });

  const LUCKY = { id: "gwaio_start_lucky" };

  it("offers the base hand to a viewer with room and no Lucky Commander", async () => {
    const { calls } = build(viewerHolding([{ id: "gwaio_tech" }], 5));
    await deal(1);
    assert.equal(calls.deals[0].count, 3);
  });

  it("offers one more to a viewer whose hand is full", async () => {
    const { calls } = build(viewerHolding([{ id: "gwaio_tech" }], 1));
    await deal(1);
    assert.equal(calls.deals[0].count, 4);
  });

  it("offers one more to a viewer holding the Lucky Commander", async () => {
    const { calls } = build(viewerHolding([LUCKY], 5));
    await deal(1);
    assert.equal(calls.deals[0].count, 4);
  });

  it("offers two more to a viewer with both", async () => {
    const { calls } = build(viewerHolding([LUCKY], 1));
    await deal(1);
    assert.equal(calls.deals[0].count, 5);
  });

  // The host's own bonuses are not the viewer's to spend.
  it("ignores a host holding both while the viewer holds neither", async () => {
    const { calls } = build(viewerHolding([{ id: "gwaio_tech" }], 5));

    await deal(1);

    // What the trap inventory would have produced, had it been consulted.
    assert.equal(realHelpers.cardsOfferedCount(3, hostInventory()), 5);
    assert.equal(calls.deals[0].count, 3);
  });
});

describe("dealCoopPlayerPendingTechCards - the treasure planet", () => {
  // A loadout is offered alone: no tech cards are dealt alongside it.
  it("offers a locked loadout instead of a hand", async () => {
    const { calls } = build({ treasureStar: 1 });

    const updates = await deal(1);

    assert.deepEqual(calls.deals, []);
    assert.deepEqual(updates[0].pendingTechCards.cards, [
      { id: "gwc_start_orbital", startLoadout: true },
    ]);
  });

  it("deals a normal hand on every other star", async () => {
    const { calls } = build({ treasureStar: 2 });

    await deal(1);

    assert.equal(calls.deals.length, 1);
  });
});

describe("dealCoopPlayerPendingTechCards - delivery", () => {
  it("sends the offers to the server with the host's deal bookkeeping", async () => {
    let sent;
    const { calls } = build({
      sendMessage: (name, payload, done) => {
        sent = [name, payload];
        done(true, {});
      },
    });

    const updates = await deal(1);

    assert.equal(sent[0], "set_player_pending_tech_cards");
    assert.equal(sent[1].host_tech_card_deal_count, 4);
    assert.deepEqual(sent[1].host_tech_card_deal_history, ["star-1"]);
    assert.equal(sent[1].players.length, 1);
    assert.equal(updates.length, 1);
    assert.deepEqual(calls.actions, []);
  });

  it("rejects when the server refuses the offers", async () => {
    build({
      sendMessage: (name, payload, done) => done(false, { error: "nope" }),
    });

    assert.match(
      await rejection(deal(1)),
      /set_player_pending_tech_cards failed/
    );
  });

  // A viewer has no send_message, so the same handler has to reach the host
  // through the campaign action channel instead.
  it("falls back to the campaign action channel", async () => {
    const { calls } = build();

    const updates = await deal(1);

    assert.equal(calls.actions.length, 1);
    assert.equal(calls.actions[0][0], "set_player_pending_tech_cards");
    assert.equal(updates.length, 1);
  });

  it("sends nothing when every viewer was skipped", async () => {
    const { calls } = build({ dealCount: () => 9 });

    assert.deepEqual(await deal(1, undefined, { dealIndex: 2 }), []);

    assert.deepEqual(calls.actions, []);
  });
});
