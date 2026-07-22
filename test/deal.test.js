"use strict";

// Unit tests for shared/deal.js: dealCard (resolve/reject and the getContext ->
// deal -> keep/releaseContext lifecycle over a loaded card) and setupGwoCards (the
// techCardDeck branch that decides whether the Expanded card set is included). Both
// touch engine globals only at call time - $ (jQuery Deferred) for dealCard, model
// for setupGwoCards - so the module loads under the Node AMD harness and we install
// the fake $/model per describe block. setupGwoDeck is left untested: it's thin glue
// over requireGW's async card loading with no branching worth pinning.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const deal = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/deal.js"
);

const restores = [];
function setGlobal(name, value) {
  const had = Object.prototype.hasOwnProperty.call(global, name);
  const previous = global[name];
  global[name] = value;
  restores.push(function () {
    if (had) {
      global[name] = previous;
    } else {
      delete global[name];
    }
  });
}
afterEach(() => {
  while (restores.length) {
    restores.pop()();
  }
});

// dealCard runs its body inside loaded.then(...). In the not-found path that callback
// returns the (already-rejected) result deferred; jQuery's Deferred.then absorbs that,
// but native promises would surface it as a Node unhandledRejection. This stand-in
// swallows the callback's own returned rejection while leaving `result` free to reject
// for the caller to await - so we assert on dealCard's return value, not this seam.
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

  it("rejects when the requested card id is not among the loaded cards", async () => {
    setGlobal("$", createFakeJQuery());
    await assert.rejects(
      deal.dealCard({ id: "missing" }, fakeLoaded(), [{ id: "other" }]),
      { message: "GWO card not found: missing" }
    );
  });
});

describe("setupGwoCards", () => {
  function loadoutAndBasicPresent(result) {
    // A loadout and a basic card should always be present regardless of deck mode.
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
});
