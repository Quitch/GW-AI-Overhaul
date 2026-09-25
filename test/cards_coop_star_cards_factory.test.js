"use strict";

// The host-side half of gw_play/cards_coop_star_cards.js: the factory that walks
// the galaxy, deals a card per viewer per selectable AI star, and writes the
// result to each viewer's co-op inventory record.
//
// The factory takes every collaborator through params except `model`, which is a
// gw_play scene global read at call time - so it is stubbed here the same way
// scripts/lib/ai-path-fixtures.js does. The pure predicates the factory delegates
// to are pinned separately in cards_coop_star_cards.test.js.

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  fakeBank,
  inventoryClass,
  viewer,
} = require("../scripts/lib/coop-fixtures.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js"
);

// Hung off the game stub as a trap. model.game().inventory() is always the
// host's, so a per-player deal that reached for it would weight every viewer's
// pre-dealt card on the host's tech - see CLAUDE.md, "the inventory passed to it".
const HOST_CARDS = [{ id: "gwaio_host_only" }];

// Systems are built once per star list and handed back by reference, matching
// production: the factory calls model.galaxy.systems() repeatedly rather than
// caching a snapshot. `ai: null` is a star the player has already taken.
function galaxyFor(stars) {
  if (!stars.systems) {
    Object.defineProperty(stars, "systems", {
      value: stars.map((star) => ({
        star: { ai: () => (star.ai === undefined ? { id: "ai" } : star.ai) },
      })),
    });
  }
  return stars.systems;
}

// Everything the factory reads, defaulting to "one viewer, one selectable AI
// star, nothing dealt yet" so each test overrides only its own subject.
function setup(overrides = {}) {
  const options = Object.assign(
    {
      records: { alice: { id: "alice", inventory: { cards: [] } } },
      viewers: [viewer("alice")],
      stars: [{}],
      canSelect: () => true,
      treasureStar: undefined,
      staticTech: false,
      turn: 7,
      hostDealCount: 0,
      dealCount: () => 0,
      setupBlocked: false,
      turnState: "begin",
      campaignActive: true,
      isHost: true,
      perPlayerTech: true,
      onApply: null,
      onDeal: null,
      onUpsert: null,
      slowDeals: false,
      saveFails: false,
      aiClients: [],
      aiDeciding: false,
    },
    overrides
  );

  const calls = {
    upserts: [],
    deals: [],
    saves: [],
    snapshots: [],
    bank: [],
    busy: [],
  };

  const stubs = createGlobalStubs();
  stubs.setGlobal("model", {
    gwCampaignActive: () => options.campaignActive,
    isCampaignHost: () => options.isHost,
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    gwCampaignConnectedClients: () => options.viewers,
    gwCampaignPlayerSetupBlocked: () => options.setupBlocked,
    getCoopPlayerTechCardDealCount: (record) => options.dealCount(record),
    galaxy: { systems: () => galaxyFor(options.stars) },
    canSelect: (starIndex) => options.canSelect(starIndex),
    sendCampaignSnapshot: (name, flag) => calls.snapshots.push([name, flag]),
  });

  const game = {
    findCoopPlayerInventoryData: (client) => options.records[client.id],
    upsertCoopPlayerInventoryData: (record) => {
      calls.upserts.push(record);
      options.records[record.id] = record;
      if (options.onUpsert) {
        options.onUpsert(record);
      }
      return true;
    },
    coopPlayerInventoryData: () => Object.values(options.records),
    stats: () => ({ turns: () => options.turn }),
    hostTechCardDealCount: () => options.hostDealCount,
    turnState: () => options.turnState,
    inventory: () => ({ cards: () => HOST_CARDS }),
  };

  const coopStarCards = makeFactory({
    game,
    // The request carries no star index of its own, so the deal is identified
    // by the stream the factory asked for - which is keyed by exactly that.
    chooseCards: (request) => {
      calls.deals.push(request);
      if (options.onDeal) {
        options.onDeal(options);
      }
      const cards = [{ id: "card_for_" + request.rng.starIndex }];
      // The real deal can span ticks; a microtask-only stub finishes one
      // viewer's write before any other refresh gets to read the record.
      return options.slowDeals
        ? new Promise((resolve) => setTimeout(resolve, 5, cards))
        : Promise.resolve(cards);
    },
    GWInventory: inventoryClass({ onApply: options.onApply }),
    gwoStreams: {
      coopStarDealRng: (warRng, playerKey, starIndex, turn) => ({
        playerKey,
        starIndex,
        turn,
      }),
      coopPlayerKey: (record, client) => client.id,
    },
    warRng: { seed: "war" },
    gwoBank: fakeBank(calls),
    stockBank: {},
    gwoSettings: {
      treasureStar: options.treasureStar,
      staticTech: options.staticTech,
    },
    gwoSave: (savedGame, flag) => {
      calls.saves.push(flag);
      return options.saveFails
        ? Promise.reject(new Error("save failed"))
        : Promise.resolve();
    },
    gwoTreasure: {
      isTreasureStar: (settings, starIndex) =>
        settings.treasureStar === starIndex,
    },
    aiClients: () => options.aiClients,
    aiDeciding: () => options.aiDeciding,
    busy: (value) => calls.busy.push(value),
  });

  return {
    coopStarCards,
    calls,
    options,
    restore: () => stubs.restoreGlobals(),
  };
}

const starsDealt = (calls) =>
  calls.deals.map((request) => request.rng.starIndex);

const cardIndexes = (record) => Object.keys(record.gwaioStarCards.cards);

const { build, release } = trackActive(setup);

// Collects everything console.error emits, so the factory's swallow-and-log
// error path can be asserted rather than just not crashing.
afterEach(() => {
  mock.restoreAll();
});

async function captureErrors(run) {
  const errorMock = mock.method(console, "error", () => {});
  await run();
  return errorMock.mock.calls.map((call) => call.arguments[0]);
}

describe("coop star cards refresh - when it runs at all", () => {
  it("does nothing outside an active co-op campaign", async () => {
    for (const off of [
      { campaignActive: false },
      { isHost: false },
      { perPlayerTech: false },
    ]) {
      const { coopStarCards, calls } = build(off);
      await coopStarCards.refresh();
      assert.deepEqual(calls.deals, [], JSON.stringify(off));
      assert.deepEqual(calls.upserts, []);
      release();
    }
  });

  it("does nothing when no viewer is connected", async () => {
    const { coopStarCards, calls } = build({ viewers: [] });
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), []);
  });

  it("ignores connected clients that are not viewers", async () => {
    const { coopStarCards, calls } = build({
      viewers: [{ id: "host", name: "host", role: "host" }],
    });
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), []);
  });

  it("survives a campaign that has no client list yet", async () => {
    const { coopStarCards, calls } = build({ viewers: undefined });
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), []);
  });

  // The catch-up guard. Its predicate is unit-tested on its own; what matters
  // here is that the factory consults it before dealing anything.
  it("does not deal while a viewer is behind the host's deal count", async () => {
    const { coopStarCards, calls } = build({
      hostDealCount: 3,
      dealCount: () => 1,
    });
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), []);
    assert.deepEqual(calls.upserts, []);
  });

  it("does not deal mid-exploration", async () => {
    const { coopStarCards, calls } = build({ turnState: "explore" });
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), []);
  });
});

describe("coop star cards refresh - co-op AI players", () => {
  const AI = { id: "gwo_ai_1", name: "AI1", role: "ai" };

  it("deals an AI player its own card on each star, with no viewer connected", async () => {
    const { coopStarCards, calls, options } = build({
      viewers: [],
      aiClients: [AI],
      records: { gwo_ai_1: { id: "gwo_ai_1", inventory: { cards: [] } } },
      stars: [{}, {}],
    });

    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), [0, 1]);
    assert.deepEqual(
      calls.deals.map((request) => request.rng.playerKey),
      ["gwo_ai_1", "gwo_ai_1"]
    );
    assert.deepEqual(cardIndexes(options.records.gwo_ai_1), ["0", "1"]);
  });

  it("waits while an AI player settles its deals", async () => {
    const { coopStarCards, calls } = build({
      aiClients: [AI],
      aiDeciding: true,
      records: {
        alice: { id: "alice", inventory: { cards: [] } },
        gwo_ai_1: { id: "gwo_ai_1", inventory: { cards: [] } },
      },
    });

    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), []);
  });

  // A re-deal owes every record, the AIs' included; the refresh settles an
  // AI's debt as it does a viewer's.
  it("settles an AI player's re-deal debt", async () => {
    const { coopStarCards, options } = build({
      viewers: [],
      aiClients: [AI],
      records: {
        gwo_ai_1: {
          id: "gwo_ai_1",
          inventory: { cards: [] },
          gwaioStarCards: {
            turn: 6,
            cards: { 0: { id: "old" } },
            redealOwed: true,
          },
        },
      },
    });

    await coopStarCards.refresh();

    const field = options.records.gwo_ai_1.gwaioStarCards;
    assert.equal(field.redealOwed, undefined);
    assert.deepEqual(field.cards, { 0: { id: "card_for_0" } });
  });

  it("says it is busy while a refresh runs", async () => {
    const { coopStarCards, calls } = build();
    const running = coopStarCards.refresh();
    assert.deepEqual(calls.busy, [true]);
    await running;
    assert.deepEqual(calls.busy, [true, false]);
  });
});

describe("coop star cards refresh - which stars get a card", () => {
  it("deals one card per selectable AI star and stores them by index", async () => {
    const { coopStarCards, calls, options } = build({ stars: [{}, {}, {}] });

    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), [0, 1, 2]);
    assert.equal(calls.upserts.length, 1);
    assert.deepEqual(cardIndexes(options.records.alice), ["0", "1", "2"]);
    assert.equal(options.records.alice.gwaioStarCards.turn, 7);
    assert.deepEqual(options.records.alice.gwaioStarCards.cards["1"], {
      id: "card_for_1",
    });
  });

  it("skips stars the viewer cannot select and stars with no AI", async () => {
    const { coopStarCards, calls } = build({
      stars: [{}, { ai: null }, {}],
      canSelect: (starIndex) => starIndex !== 2,
    });

    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), [0]);
  });

  it("skips the treasure planet, whose offer is a loadout", async () => {
    const { coopStarCards, calls } = build({
      stars: [{}, {}],
      treasureStar: 1,
    });

    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), [0]);
  });

  it("fills only the gaps on a second refresh", async () => {
    const { coopStarCards, calls } = build({ stars: [{}, {}] });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), []);
  });

  // The regression the redeal flag exists for: a viewer's advertised card must
  // not change while the host merely moves around the galaxy.
  it("replaces every card only when the host re-deals", async () => {
    const { coopStarCards, calls } = build({ stars: [{}, {}] });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });

    assert.deepEqual(starsDealt(calls), [0, 1]);
  });

  it("never re-deals in a war that froze its tech", async () => {
    const { coopStarCards, calls } = build({ stars: [{}], staticTech: true });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });

    assert.deepEqual(starsDealt(calls), []);
  });

  // Handing the outgoing card back to chooseCards is what lets the deck avoid
  // offering the same card twice in a row.
  it("offers the card being replaced back to the deal as a system card", async () => {
    const { coopStarCards, calls } = build({ stars: [{}] });

    await coopStarCards.refresh();
    const first = calls.deals[0];
    calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });

    assert.deepEqual(first.systemCards, []);
    assert.deepEqual(calls.deals[0].systemCards, [{ id: "card_for_0" }]);
  });
});

describe("coop star cards refresh - what it writes", () => {
  // Without this the map grows for the whole war rather than shrinking with the
  // AI stars left to fight.
  it("drops the cards of stars the player has since taken", async () => {
    const { coopStarCards, options } = build({ stars: [{}, {}, {}] });

    await coopStarCards.refresh();
    assert.deepEqual(cardIndexes(options.records.alice), ["0", "1", "2"]);

    // Star 0 is now the player's, and a fourth star has come into reach - the
    // new card is what gives this pass anything to do at all.
    options.stars = [{ ai: null }, {}, {}, {}];
    await coopStarCards.refresh();

    assert.deepEqual(cardIndexes(options.records.alice), ["1", "2", "3"]);
  });

  it("does not write, save or broadcast when nothing changed", async () => {
    const { coopStarCards, calls } = build({ stars: [{}] });

    await coopStarCards.refresh();
    assert.equal(calls.upserts.length, 1);
    assert.deepEqual(calls.saves, [false]);
    assert.deepEqual(calls.snapshots, [["gwo_star_cards", true]]);

    await coopStarCards.refresh();

    assert.equal(calls.upserts.length, 1);
    assert.deepEqual(calls.saves, [false]);
    assert.equal(calls.snapshots.length, 1);
  });

  it("leaves a viewer with no saved inventory alone", async () => {
    const { coopStarCards, calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: { id: "alice", inventory: { cards: [] } },
        bob: { id: "bob" },
      },
    });

    await coopStarCards.refresh();

    assert.deepEqual(
      calls.upserts.map((record) => record.id),
      ["alice"]
    );
  });

  it("keeps each viewer's cards on their own record", async () => {
    const { coopStarCards, calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: { id: "alice", inventory: { cards: [] } },
        bob: { id: "bob", inventory: { cards: [] } },
      },
    });

    await coopStarCards.refresh();

    assert.deepEqual(
      calls.upserts.map((record) => record.id),
      ["alice", "bob"]
    );
    // Each viewer deals from their own stream, or two viewers would be offered
    // the same card on the same star.
    assert.deepEqual(
      calls.deals.map((request) => request.rng.playerKey),
      ["alice", "bob"]
    );
  });

  // Dropping `inventory: inventory` from the chooseCards request leaves the
  // deal falling back to the host's, silently and with every other assertion
  // in this file still green.
  it("deals each viewer against their own saved cards, not the host's", async () => {
    const { coopStarCards, calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: {
          id: "alice",
          inventory: { cards: [{ id: "gwaio_alice_tech" }] },
        },
        bob: { id: "bob", inventory: { cards: [{ id: "gwaio_bob_tech" }] } },
      },
    });

    await coopStarCards.refresh();

    assert.deepEqual(
      calls.deals.map((request) => request.inventory.cards()),
      [[{ id: "gwaio_alice_tech" }], [{ id: "gwaio_bob_tech" }]]
    );
  });

  // Why the record is re-read at write time rather than closed over: chooseCards
  // is async, so a viewer can have left and had their record dropped since this
  // pass began. See coop.md, "Per-player pre-dealt cards".
  it("writes nothing when the record goes while the deal is in flight", async () => {
    const { coopStarCards, calls } = build({
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: { id: "alice", inventory: { cards: [] } },
        bob: { id: "bob", inventory: { cards: [] } },
      },
      onDeal: (options) => delete options.records.alice,
    });

    await coopStarCards.refresh();

    // bob's deal ran after alice's record went, and still lands.
    assert.deepEqual(
      calls.upserts.map((record) => record.id),
      ["bob"]
    );
  });
});

describe("coop star cards refresh - the host's own banks", () => {
  // Applying a viewer's cards runs their loadout card's buff(), which would
  // otherwise unlock that loadout into the host's banks.
  it("suspends unlock banking around applying a viewer's cards", async () => {
    const { coopStarCards, calls } = build({
      records: {
        alice: { id: "alice", inventory: { cards: [{ id: "gwc_start_bot" }] } },
      },
    });

    await coopStarCards.refresh();

    assert.deepEqual(calls.bank, ["suspend", "resume"]);
  });

  it("does not touch banking for a viewer holding no cards yet", async () => {
    const { coopStarCards, calls } = build();
    await coopStarCards.refresh();
    assert.deepEqual(calls.bank, []);
  });

  // Leaving banking suspended would silently swallow the host's own unlocks for
  // the rest of the session, long after the failed refresh is forgotten.
  it("resumes banking even when applying a viewer's cards throws", async () => {
    const { coopStarCards, calls } = build({
      records: {
        alice: { id: "alice", inventory: { cards: [{ id: "gwc_start_bot" }] } },
      },
      onApply: () => {
        throw new Error("bad card");
      },
    });

    const errors = await captureErrors(() => coopStarCards.refresh());

    assert.deepEqual(calls.bank, ["suspend", "resume"]);
    assert.equal(calls.upserts.length, 0);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /failed to refresh co-op player star cards/);
  });

  it("reports a failed save rather than rejecting into the caller", async () => {
    const { coopStarCards } = build({ saveFails: true });

    const errors = await captureErrors(() => coopStarCards.refresh());

    assert.equal(errors.length, 1);
    assert.match(errors[0], /failed to refresh co-op player star cards/);
  });
});

describe("coop star cards refresh - coalescing", () => {
  it("returns the in-flight refresh to a caller arriving mid-run", async () => {
    const { coopStarCards, calls } = build({ stars: [{}] });

    await Promise.all([coopStarCards.refresh(), coopStarCards.refresh()]);

    // One deal, not two: the second call joined the first rather than starting
    // its own walk of the galaxy.
    assert.deepEqual(starsDealt(calls), [0]);
  });

  // A redeal coalesced into a plain refresh still has to happen, or the host's
  // own per-turn deal is lost whenever it lands during another refresh.
  it("re-deals afterwards if any coalesced caller asked to", async () => {
    const { coopStarCards, calls } = build({ stars: [{}] });

    await Promise.all([
      coopStarCards.refresh(),
      coopStarCards.refresh({ redeal: true }),
    ]);

    // The first pass fills the gap; the queued redeal then replaces it.
    assert.deepEqual(starsDealt(calls), [0, 0]);
  });

  // The host re-deals after a win, which is exactly when viewers hold
  // pendingTechCards. A gate that turned the re-deal away used to lose it, so
  // the viewers kept last turn's star cards.
  it("owes a re-deal the gate turned away, and pays it once the gate opens", async () => {
    const { coopStarCards, calls, options } = build({ stars: [{}, {}] });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    options.turnState = "explore";
    await coopStarCards.refresh({ redeal: true });
    assert.deepEqual(starsDealt(calls), [], "the gate is closed");

    options.turnState = "begin";
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), [0, 1]);

    calls.deals.length = 0;
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), [], "the debt is paid once");
  });

  it("owes a re-deal while a viewer still has an offer to answer", async () => {
    const { coopStarCards, calls, options } = build({ stars: [{}] });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    options.records.alice.pendingTechCards = { star: 0, cards: [] };
    await coopStarCards.refresh({ redeal: true });
    assert.deepEqual(starsDealt(calls), []);

    delete options.records.alice.pendingTechCards;
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), [0]);
  });

  it("owes a re-deal made while no viewer was connected", async () => {
    const { coopStarCards, calls, options } = build({ stars: [{}] });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    options.viewers = [];
    await coopStarCards.refresh({ redeal: true });

    options.viewers = [viewer("alice")];
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), [0]);
  });

  it("owes a re-deal that failed", async () => {
    let failing = false;
    const { coopStarCards, calls } = build({
      stars: [{}],
      records: {
        alice: { id: "alice", inventory: { cards: [{ id: "gwc_start_bot" }] } },
      },
      onApply: () => {
        if (failing) {
          throw new Error("bad card");
        }
      },
    });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    failing = true;
    const errors = await captureErrors(() =>
      coopStarCards.refresh({ redeal: true })
    );
    assert.equal(errors.length, 1);
    assert.deepEqual(starsDealt(calls), []);

    failing = false;
    await coopStarCards.refresh();
    assert.deepEqual(starsDealt(calls), [0]);
  });

  // The re-dealt viewer's record write triggers the next refresh, so owing
  // them again would re-deal them on every refresh while the other one failed.
  it("owes a failed re-deal only to the viewer it failed for", async () => {
    let failing = true;
    const { coopStarCards, calls } = build({
      stars: [{}],
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: { id: "alice", inventory: { cards: [] } },
        bob: { id: "bob", inventory: { cards: [{ id: "gwc_bad" }] } },
      },
      onApply: (inventory) => {
        if (failing && inventory.cards().length) {
          throw new Error("bad card");
        }
      },
    });

    await captureErrors(() => coopStarCards.refresh());
    calls.deals.length = 0;
    await captureErrors(() => coopStarCards.refresh({ redeal: true }));
    assert.deepEqual(starsDealt(calls), [0], "alice is re-dealt");

    calls.deals.length = 0;
    for (let i = 0; i < 5; i++) {
      await captureErrors(() => coopStarCards.refresh());
    }
    assert.deepEqual(starsDealt(calls), [], "alice is not re-dealt again");

    failing = false;
    await coopStarCards.refresh();
    assert.deepEqual(
      calls.deals.map((request) => request.rng.playerKey),
      ["bob"],
      "bob is still owed"
    );
  });

  it("does not owe a re-deal whose save failed", async () => {
    const { coopStarCards, calls } = build({
      stars: [{}],
      saveFails: true,
      records: {
        alice: {
          id: "alice",
          inventory: { cards: [] },
          gwaioStarCards: { turn: 6, cards: { 0: { id: "last_turns" } } },
        },
      },
    });

    const errors = await captureErrors(() =>
      coopStarCards.refresh({ redeal: true })
    );
    assert.equal(errors.length, 1, "the save failed");
    assert.deepEqual(starsDealt(calls), [0]);

    calls.deals.length = 0;
    await captureErrors(() => coopStarCards.refresh());
    assert.deepEqual(starsDealt(calls), []);
  });

  // A re-deal queued behind an in-flight refresh that the gate then turns
  // away is owed the same way as one called directly.
  it("owes a queued re-deal the gate turned away", async () => {
    const { coopStarCards, calls, options } = build({ stars: [{}] });

    await coopStarCards.refresh();
    calls.deals.length = 0;
    const first = coopStarCards.refresh();
    options.turnState = "explore";
    await Promise.all([first, coopStarCards.refresh({ redeal: true })]);
    const dealtWhileQueued = starsDealt(calls).length;

    options.turnState = "begin";
    calls.deals.length = 0;
    await coopStarCards.refresh();
    assert.equal(dealtWhileQueued, 0);
    assert.deepEqual(starsDealt(calls), [0]);
  });

  // The debt sits on the record, so it rides the save. Held in memory, a
  // gw_play reload between the refused re-deal and the viewer's choice lost it,
  // and the viewer kept last turn's cards.
  it("keeps a re-deal owed across a gw_play reload", async () => {
    const first = build({ stars: [{}] });
    await first.coopStarCards.refresh();
    first.options.turnState = "explore";
    await first.coopStarCards.refresh({ redeal: true });
    const records = first.options.records;
    release();

    const { coopStarCards, calls, options } = build({ stars: [{}], records });
    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), [0]);
    assert.equal(options.records.alice.gwaioStarCards.redealOwed, undefined);
  });

  it("owes a re-deal to a viewer away when the host re-deals", async () => {
    const { coopStarCards, calls, options } = build({
      stars: [{}],
      viewers: [viewer("alice"), viewer("bob")],
      records: {
        alice: { id: "alice", inventory: { cards: [] } },
        bob: { id: "bob", inventory: { cards: [] } },
      },
    });

    await coopStarCards.refresh();
    options.viewers = [viewer("alice")];
    calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });
    assert.deepEqual(
      calls.deals.map((request) => request.rng.playerKey),
      ["alice"]
    );

    options.viewers = [viewer("alice"), viewer("bob")];
    calls.deals.length = 0;
    await coopStarCards.refresh();
    assert.deepEqual(
      calls.deals.map((request) => request.rng.playerKey),
      ["bob"]
    );
  });

  // Left in place, the debt would re-deal the viewer on the first refresh of
  // the next turn - one that should only fill gaps.
  it("settles a debt that has nothing left to re-deal", async () => {
    const { coopStarCards, calls, options } = build({ stars: [{}] });

    await coopStarCards.refresh();
    options.turnState = "explore";
    await coopStarCards.refresh({ redeal: true });
    options.stars = [{ ai: null }];
    options.turnState = "begin";
    calls.deals.length = 0;
    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(calls), []);
    assert.equal(options.records.alice.gwaioStarCards.redealOwed, undefined);
  });

  // cards.js refreshes on every record write, and owing a re-deal writes
  // records. The refresh that write starts must join this one, not run
  // alongside it and re-deal the same viewer twice.
  it("coalesces the refresh its own debt writes trigger", async () => {
    let coopStarCards;
    const built = build({
      stars: [{}],
      slowDeals: true,
      onUpsert: () => {
        coopStarCards.refresh();
      },
    });
    coopStarCards = built.coopStarCards;

    await coopStarCards.refresh();
    built.calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });
    await coopStarCards.refresh();

    assert.deepEqual(starsDealt(built.calls), [0]);
  });

  it("runs a later refresh normally once the queue has drained", async () => {
    const { coopStarCards, calls } = build({ stars: [{}] });

    await Promise.all([coopStarCards.refresh(), coopStarCards.refresh()]);
    calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });

    assert.deepEqual(starsDealt(calls), [0]);
  });
});

describe("starCardForRecord", () => {
  it("is the record reader, exposed for cards_coop_deal.js", () => {
    const { coopStarCards } = build();
    assert.deepEqual(
      coopStarCards.starCardForRecord(
        { gwaioStarCards: { cards: { 4: { id: "gwc_combat_bots" } } } },
        4
      ),
      { id: "gwc_combat_bots" }
    );
  });
});
