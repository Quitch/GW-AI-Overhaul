"use strict";

// Unit tests for the pure helpers of gw_play/cards_coop_reroll.js: the reroll-count
// arithmetic and the reroll-request validation chain. The factory it returns registers
// operator handlers and drives an async jQuery-deferred deal, so that part is exercised
// in-game; the helpers are reached here through the module's dead-in-production
// `typeof module` hook, via requireShippedModule.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const reroll = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_reroll.js"
);

describe("computeRerollDeal", () => {
  it("spends the first reroll on a fresh 3-card offer", () => {
    assert.deepEqual(reroll.computeRerollDeal(3, 3), {
      rerollsUsed: 0,
      nextRerollsUsed: 1,
      cardCount: 2,
      exhausted: false,
    });
  });

  it("spends the second reroll, leaving one card", () => {
    assert.deepEqual(reroll.computeRerollDeal(3, 2), {
      rerollsUsed: 1,
      nextRerollsUsed: 2,
      cardCount: 1,
      exhausted: false,
    });
  });

  it("is exhausted when only one card remains of a 3-card offer", () => {
    const state = reroll.computeRerollDeal(3, 1);
    assert.equal(state.exhausted, true);
    assert.equal(state.cardCount, 0);
  });

  it("gets an extra reroll from a bonus (4-card) offer", () => {
    assert.deepEqual(reroll.computeRerollDeal(4, 4), {
      rerollsUsed: 0,
      nextRerollsUsed: 1,
      cardCount: 3,
      exhausted: false,
    });
  });

  it("never reports negative rerolls used when more cards than offered remain", () => {
    assert.equal(reroll.computeRerollDeal(3, 5).rerollsUsed, 0);
  });
});

describe("pendingTechRerollValidationError", () => {
  const pending = { star: 2, cards: [{ id: "a" }], dealIndex: 1 };

  it("accepts a well-formed, current, non-loadout request", () => {
    assert.equal(
      reroll.pendingTechRerollValidationError(
        { star: 2, deal_index: 1 },
        pending,
        false
      ),
      undefined
    );
  });

  it("accepts a request that omits the optional star/deal_index guards", () => {
    assert.equal(
      reroll.pendingTechRerollValidationError({}, pending, false),
      undefined
    );
  });

  it("rejects pending cards with a non-numeric star or non-array cards", () => {
    assert.equal(
      reroll.pendingTechRerollValidationError(
        {},
        { star: "2", cards: [] },
        false
      ),
      "invalid pending tech cards"
    );
    assert.equal(
      reroll.pendingTechRerollValidationError(
        {},
        { star: 2, cards: null },
        false
      ),
      "invalid pending tech cards"
    );
  });

  it("rejects a stale star", () => {
    assert.equal(
      reroll.pendingTechRerollValidationError({ star: 3 }, pending, false),
      "stale pending tech star"
    );
  });

  it("rejects a stale deal index", () => {
    assert.equal(
      reroll.pendingTechRerollValidationError(
        { deal_index: 9 },
        pending,
        false
      ),
      "stale pending tech deal index"
    );
  });

  it("rejects a reroll of loadout cards", () => {
    assert.equal(
      reroll.pendingTechRerollValidationError({ star: 2 }, pending, true),
      "loadout cards cannot be rerolled"
    );
  });
});
