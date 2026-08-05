"use strict";

// Unit tests for shared/deal.js: dealCard's lifecycle and setupGwoCards' deck
// branch. setupGwoDeck is untested - thin async glue with no branching to pin.

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
