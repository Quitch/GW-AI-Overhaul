"use strict";

// The host-side half of gw_play/cards_coop_star_cards.js: the factory that walks
// the galaxy, deals a card per viewer per selectable AI star, and writes the
// result to each viewer's co-op inventory record.
//
// The factory takes every collaborator through params except `model`, which is a
// gw_play scene global read at call time - so it is stubbed here the same way
// scripts/lib/ai-path-fixtures.js does. The pure predicates the factory delegates
// to are pinned separately in cards_coop_star_cards.test.js.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js"
);

const viewer = (id, extra) =>
  Object.assign({ id, name: id, role: "viewer" }, extra);

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

// A minimal stand-in for the base game's GWInventory: the factory only loads a
// record's saved cards, counts them, and applies them.
function inventoryClass(onApply) {
  return function GWInventory() {
    let loaded = [];
    this.load = (data) => {
      loaded = (data && data.cards) || [];
    };
    this.cards = () => loaded;
    this.applyCards = (done) => {
      if (onApply) {
        onApply(this);
      }
      done();
    };
  };
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
      saveFails: false,
    },
    overrides
  );

  const calls = { upserts: [], deals: [], saves: [], snapshots: [], bank: [] };

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
      return true;
    },
    stats: () => ({ turns: () => options.turn }),
    hostTechCardDealCount: () => options.hostDealCount,
    turnState: () => options.turnState,
  };

  const coopStarCards = makeFactory({
    game,
    // The request carries no star index of its own, so the deal is identified
    // by the stream the factory asked for - which is keyed by exactly that.
    chooseCards: (request) => {
      calls.deals.push(request);
      return Promise.resolve([{ id: "card_for_" + request.rng.starIndex }]);
    },
    GWInventory: inventoryClass(options.onApply),
    gwoStreams: {
      coopStarDealRng: (warRng, playerKey, starIndex, turn) => ({
        playerKey,
        starIndex,
        turn,
      }),
      coopPlayerKey: (record, client) => client.id,
    },
    warRng: { seed: "war" },
    gwoBank: {
      suspendUnlocks: () => calls.bank.push("suspend"),
      resumeUnlocks: () => calls.bank.push("resume"),
    },
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

// Collects everything console.error emits, so the factory's swallow-and-log
// error path can be asserted rather than just not crashing.
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
      active.restore();
      active = undefined;
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

  it("runs a later refresh normally once the queue has drained", async () => {
    const { coopStarCards, calls } = build({ stars: [{}] });

    await Promise.all([coopStarCards.refresh(), coopStarCards.refresh()]);
    calls.deals.length = 0;
    await coopStarCards.refresh({ redeal: true });

    assert.deepEqual(starsDealt(calls), [0]);
  });
});

describe("starCardForClient", () => {
  it("is the record reader, exposed for the viewer-side view model", () => {
    const { coopStarCards } = build();
    assert.deepEqual(
      coopStarCards.starCardForClient(
        { gwaioStarCards: { cards: { 4: { id: "gwc_combat_bots" } } } },
        4
      ),
      { id: "gwc_combat_bots" }
    );
  });
});
