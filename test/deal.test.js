"use strict";

// Unit tests for shared/deal.js: dealCard's lifecycle, setupGwoCards' deck branch,
// and setupGwoDeck's ordering, which the seeded deal depends on.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const deal = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js"
);

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

// jQuery's Deferred.then absorbs the rejection the not-found path returns; a native
// promise surfaces it as an unhandledRejection. This swallows the callback's own
// rejection while leaving `result` free to reject for the caller.
function fakeLoaded() {
  return {
    then: function (callback) {
      Promise.resolve()
        .then(callback)
        .catch(function () {});
    },
  };
}

describe("dealCard", () => {
  it("resolves with a product merging the card's deal params", async () => {
    setGlobal("$", createFakeJQuery());
    const card = {
      id: "gwaio_upgrade_ant",
      getContext: function () {
        return { totalSize: 3 };
      },
      deal: function () {
        return { params: { chance: 60 } };
      },
    };
    const product = await deal.dealCard(
      { id: "gwaio_upgrade_ant" },
      fakeLoaded(),
      [card]
    );
    assert.deepEqual(product, { id: "gwaio_upgrade_ant", chance: 60 });
  });

  it("returns just the id when the card exposes no getContext/deal", async () => {
    setGlobal("$", createFakeJQuery());
    const product = await deal.dealCard({ id: "plain" }, fakeLoaded(), [
      { id: "plain" },
    ]);
    assert.deepEqual(product, { id: "plain" });
  });

  it("invokes keep and releaseContext with the deal and context", async () => {
    setGlobal("$", createFakeJQuery());
    const calls = {};
    const context = { totalSize: 1 };
    const dealResult = { params: { chance: 10 } };
    const card = {
      id: "c",
      getContext: function () {
        return context;
      },
      deal: function () {
        return dealResult;
      },
      keep: function (dealArg, contextArg) {
        calls.keep = { deal: dealArg, context: contextArg };
      },
      releaseContext: function (contextArg) {
        calls.releaseContext = contextArg;
      },
    };
    await deal.dealCard({ id: "c" }, fakeLoaded(), [card]);
    assert.deepEqual(calls.keep, { deal: dealResult, context: context });
    assert.equal(calls.releaseContext, context);
  });

  it("forwards params.rng to the card as deal's fourth argument", async () => {
    setGlobal("$", createFakeJQuery());
    const rng = () => 0.5;
    let seen;
    await deal.dealCard({ id: "c", rng: rng }, fakeLoaded(), [
      {
        id: "c",
        deal: function (system, context, inventory, cardRng) {
          seen = cardRng;
          return { params: {} };
        },
      },
    ]);
    assert.equal(seen, rng);
  });

  it("passes undefined when the caller supplies no rng", async () => {
    setGlobal("$", createFakeJQuery());
    let seen = "untouched";
    await deal.dealCard({ id: "c" }, fakeLoaded(), [
      {
        id: "c",
        deal: function (system, context, inventory, cardRng) {
          seen = cardRng;
          return { params: {} };
        },
      },
    ]);
    assert.equal(seen, undefined);
  });

  // A card reads the inventory it is handed, never model.game().inventory(),
  // which is always the host's. dealCard's own viewer caller is
  // gw_coop_per_player_loadout/gwo_loadouts.js; the cheats are host-only.
  it("forwards params.inventory to both getContext and deal", async () => {
    setGlobal("$", createFakeJQuery());
    const inventory = { cards: () => [{ id: "gwaio_viewer_tech" }] };
    const seen = {};
    await deal.dealCard({ id: "c", inventory: inventory }, fakeLoaded(), [
      {
        id: "c",
        getContext: function (galaxy, contextInventory) {
          seen.getContext = contextInventory;
          return {};
        },
        deal: function (system, context, dealInventory) {
          seen.deal = dealInventory;
          return { params: {} };
        },
      },
    ]);
    assert.equal(seen.getContext, inventory);
    assert.equal(seen.deal, inventory);
  });

  it("passes undefined when the caller supplies no inventory", async () => {
    setGlobal("$", createFakeJQuery());
    const seen = { getContext: "untouched", deal: "untouched" };
    await deal.dealCard({ id: "c" }, fakeLoaded(), [
      {
        id: "c",
        getContext: function (galaxy, contextInventory) {
          seen.getContext = contextInventory;
          return {};
        },
        deal: function (system, context, dealInventory) {
          seen.deal = dealInventory;
          return { params: {} };
        },
      },
    ]);
    assert.equal(seen.getContext, undefined);
    assert.equal(seen.deal, undefined);
  });

  it("rejects when the requested card id is not among the loaded cards", async () => {
    setGlobal("$", createFakeJQuery());
    await assert.rejects(
      deal.dealCard({ id: "missing" }, fakeLoaded(), [{ id: "other" }]),
      { message: "GWO card not found: missing" }
    );
  });

  // A throw inside the deferred callback neither rejects nor surfaces, so the
  // caller would wait forever. Every hook the card contract exposes is covered.
  for (const hook of ["getContext", "deal", "keep", "releaseContext"]) {
    it(`rejects when a card's ${hook}() throws`, async () => {
      setGlobal("$", createFakeJQuery());
      const card = {
        id: "c",
        getContext: () => ({}),
        deal: () => ({ params: {} }),
      };
      card[hook] = () => {
        throw new Error("card exploded");
      };
      await assert.rejects(deal.dealCard({ id: "c" }, fakeLoaded(), [card]), {
        message: "card exploded",
      });
    });
  }
});

describe("setupGwoCards", () => {
  function loadoutAndBasicPresent(result) {
    assert.ok(result.includes("gwaio_start_backpacker"));
    assert.ok(result.includes("gwc_minion"));
  }

  it("includes the expanded card set for an Expanded deck", () => {
    setGlobal("model", {});
    const result = deal.setupGwoCards({ techCardDeck: "Expanded" });
    loadoutAndBasicPresent(result);
    assert.ok(result.includes("gwaio_upgrade_ant"));
  });

  it("includes the expanded card set when settings are absent (non-GWO/legacy saves)", () => {
    setGlobal("model", {});
    const result = deal.setupGwoCards(undefined);
    assert.ok(result.includes("gwaio_upgrade_ant"));
  });

  it("omits the expanded card set for a non-Expanded deck", () => {
    setGlobal("model", {});
    const result = deal.setupGwoCards({ techCardDeck: "Basic" });
    loadoutAndBasicPresent(result);
    assert.ok(!result.includes("gwaio_upgrade_ant"));
  });

  it("prepends any pre-existing model.gwoCards (modder compatibility)", () => {
    setGlobal("model", { gwoCards: ["custom_card"] });
    const result = deal.setupGwoCards({ techCardDeck: "Basic" });
    assert.equal(result[0], "custom_card");
  });

  it("tolerates a non-array model.gwoCards by treating it as empty", () => {
    setGlobal("model", { gwoCards: "not-an-array" });
    const result = deal.setupGwoCards({ techCardDeck: "Basic" });
    assert.ok(result.includes("gwc_minion"));
  });

  // setupGwoDeck indexes by position, so a repeat would leave a hole in the deck.
  it("deduplicates a modder id that collides with a shipped card", () => {
    setGlobal("model", { gwoCards: ["gwc_minion"] });
    const result = deal.setupGwoCards({ techCardDeck: "Basic" });
    assert.equal(result.filter((id) => id === "gwc_minion").length, 1);
  });

  it("yields no duplicates at all for either deck", () => {
    setGlobal("model", {});
    for (const techCardDeck of ["Basic", "Expanded"]) {
      const result = deal.setupGwoCards({ techCardDeck: techCardDeck });
      assert.equal(new Set(result).size, result.length, techCardDeck);
    }
  });
});

describe("setupGwoDeck", () => {
  // Collects the requireGW callbacks instead of running them, so a test can fire
  // them in any order - which is what the engine's loader effectively does.
  function deferredRequireGW() {
    const pending = [];
    const requireGW = (ids, callback) => {
      pending.push({ id: ids[0].replace("cards/", ""), callback: callback });
    };
    return { pending, requireGW };
  }

  function run(gwoCards, order) {
    const { pending, requireGW } = deferredRequireGW();
    setGlobal("model", { gwoCards: gwoCards });
    setGlobal("requireGW", requireGW);

    const cards = [];
    const deck = [];
    let resolved = 0;
    deal.setupGwoDeck(cards, deck, gwoCards.length, {
      resolve: () => {
        resolved++;
      },
    });

    for (const index of order) {
      pending[index].callback({ id: "overwritten-by-setupGwoDeck" });
    }

    return { cards, deck, resolved };
  }

  const ids = ["gwc_alpha", "gwc_beta", "gwc_gamma", "gwc_delta"];

  it("places each card at its model.gwoCards index whatever order it loads in", () => {
    const reverse = run(ids, [3, 2, 1, 0]);
    assert.deepEqual(reverse.deck, ids);
    assert.deepEqual(
      reverse.cards.map((card) => card.id),
      ids
    );
  });

  it("produces the same deck regardless of load order", () => {
    const forward = run(ids, [0, 1, 2, 3]);
    const shuffled = run(ids, [2, 0, 3, 1]);
    assert.deepEqual(shuffled.deck, forward.deck);
  });

  it("resolves exactly once, after the last card loads", () => {
    const { pending, requireGW } = deferredRequireGW();
    setGlobal("model", { gwoCards: ids });
    setGlobal("requireGW", requireGW);

    let resolved = 0;
    deal.setupGwoDeck([], [], ids.length, {
      resolve: () => {
        resolved++;
      },
    });

    pending[0].callback({});
    pending[1].callback({});
    assert.equal(resolved, 0);
    pending[2].callback({});
    pending[3].callback({});
    assert.equal(resolved, 1);
  });

  // A third-party id whose module returns nothing must not leave the tally
  // outstanding: `loaded` would never resolve and every deal in the war would
  // wait on it forever.
  it("still resolves when a card module returns nothing", () => {
    const { pending, requireGW } = deferredRequireGW();
    setGlobal("model", { gwoCards: ids });
    setGlobal("requireGW", requireGW);

    const cards = [];
    const deck = [];
    let resolved = 0;
    deal.setupGwoDeck(cards, deck, ids.length, {
      resolve: () => {
        resolved++;
      },
    });

    pending[0].callback({});
    pending[1].callback(undefined);
    pending[2].callback({});
    pending[3].callback({});

    assert.equal(resolved, 1);
    assert.equal(cards[1], undefined);
    assert.equal(deck[1], undefined);
    // The surviving cards keep their own indices, so the deck does not shift.
    assert.equal(deck[2], "gwc_gamma");
  });

  // The co-op loadout scene deals one loadout and never a tech card, so it
  // passes the picker's loadout ids rather than the tech deck.
  it("loads the ids it is given in preference to model.gwoCards", () => {
    const { pending, requireGW } = deferredRequireGW();
    setGlobal("model", { gwoCards: ids });
    setGlobal("requireGW", requireGW);

    const loadoutIds = ["gwc_start_air", "anc_start_bot"];
    const cards = [];
    const deck = [];
    deal.setupGwoDeck(
      cards,
      deck,
      loadoutIds.length,
      { resolve: () => {} },
      loadoutIds
    );

    assert.deepEqual(
      pending.map((request) => request.id),
      loadoutIds
    );
  });

  it("falls back to model.gwoCards when no ids are given", () => {
    const { pending, requireGW } = deferredRequireGW();
    setGlobal("model", { gwoCards: ids });
    setGlobal("requireGW", requireGW);

    deal.setupGwoDeck([], [], ids.length, { resolve: () => {} });

    assert.deepEqual(
      pending.map((request) => request.id),
      ids
    );
  });

  // No requireGW callback fires for an empty list, so the tally never reaches
  // zero and the caller would wait on the promise forever.
  it("resolves immediately when there is nothing to load", () => {
    setGlobal("model", { gwoCards: [] });
    setGlobal("requireGW", () => {
      assert.fail("nothing should be requested");
    });

    let resolved = 0;
    deal.setupGwoDeck(
      [],
      [],
      0,
      {
        resolve: () => {
          resolved++;
        },
      },
      []
    );

    assert.equal(resolved, 1);
  });
});
