"use strict";

// gw_play/cards_dealer.js: the dealer every hand and star card is drawn from.
// Each card of a hand is drawn by the cards' deal() weights, from a stream of
// its own, after the deck and the race gates have loaded.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  makeDeferred,
} = require("../scripts/lib/fake-jquery.js");

const makeDealer = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_dealer.js"
);
const realHelpers = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js"
);

// A card whose deal() answers `chance`, or `params` alongside it, and records
// what it was dealt against.
function card(id, chance, extra) {
  const calls = [];
  return Object.assign(
    {
      id,
      calls,
      deal: (star, context, inventory, rng) => {
        calls.push({ star, context, inventory, rng });
        return typeof chance === "function" ? chance() : { chance };
      },
    },
    extra
  );
}

// A deal stream whose iteration n rolls rolls[n].
function dealStream(rolls) {
  return { rolls };
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      cards: [card("a", 1), card("b", 3)],
      deck: ["a", "b"],
      notDealt: [],
      raceBlocked: [],
      cardsToUnits: [{ id: "a", units: ["unit_a"] }],
      unseededRolls: [0.1],
    },
    overrides
  );
  const calls = { notDealt: [], raceChecks: [], errors: [], seedrandom: 0 };
  const loaded = options.loaded || makeDeferred().resolve().promise();

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  stubs.setGlobal("model", { gwoCardsToUnits: options.cardsToUnits });
  stubs.setGlobal("console", {
    error: (text) => calls.errors.push(text),
  });
  // The game's Math.seedrandom, which Node lacks: a fresh source a call.
  Math.seedrandom = function () {
    calls.seedrandom += 1;
    const rolls = options.unseededRolls.slice();
    return () => rolls.shift();
  };

  const hostInventory = { owner: "host" };
  const galaxy = { stars: () => [] };
  const chooseCards = makeDealer({
    cards: options.cards,
    deck: options.deck,
    loaded,
    galaxy,
    inventory: hostInventory,
    helpers: {
      doNotDealCard: (inventory, dealt, list, addSlot, systemCards) => {
        calls.notDealt.push({
          inventory,
          id: dealt.id,
          list: list.slice(),
          addSlot,
          systemCards,
        });
        return options.notDealt.includes(dealt.id);
      },
      raceCanDeal: (races, inventory, cardId, cardsToUnits) => {
        calls.raceChecks.push({ races, inventory, cardId, cardsToUnits });
        return !options.raceBlocked.includes(cardId);
      },
      chooseDealIndex: realHelpers.chooseDealIndex,
    },
    gwoStreams: {
      iterationRng: (stream, iteration) => {
        if (!stream) {
          return undefined;
        }
        const roll = () => stream.rolls[iteration];
        roll.iteration = iteration;
        return roll;
      },
      cardRng: (iterationRng, cardId) =>
        iterationRng && { iteration: iterationRng.iteration, cardId },
    },
    gwoRaces: { name: "races" },
  });

  return {
    calls,
    options,
    chooseCards,
    hostInventory,
    galaxy,
    restore: () => {
      delete Math.seedrandom;
      stubs.restoreGlobals();
    },
  };
}

const { build } = trackActive(setup);

const ids = (list) => list.map((dealt) => dealt.id);

describe("the dealer", () => {
  it("draws each card of a hand by the cards' weights, from its own iteration stream", async () => {
    const run = build();
    const star = { index: 4 };

    const hand = await run.chooseCards({
      count: 2,
      star,
      rng: dealStream([0.1, 0.9]),
    });

    // 0.1 of a total weight of 4 falls in a's 1; 0.9 falls in b's 3.
    assert.deepEqual(hand, [{ id: "a" }, { id: "b" }]);
    const [first, second] = run.options.cards[0].calls;
    assert.equal(first.star, star);
    assert.deepEqual(first.rng, { iteration: 0, cardId: "a" });
    assert.deepEqual(second.rng, { iteration: 1, cardId: "a" });
    assert.equal(run.calls.seedrandom, 0);
  });

  it("waits for the deck and the race gates to load", async () => {
    const pending = makeDeferred();
    const run = build({ loaded: pending.promise() });
    let dealt;

    const dealing = run
      .chooseCards({ count: 1, rng: dealStream([0]) })
      .then((hand) => {
        dealt = hand;
      });
    await new Promise(setImmediate);
    assert.equal(dealt, undefined);
    assert.equal(run.options.cards[0].calls.length, 0);

    pending.resolve();
    await dealing;
    assert.deepEqual(dealt, [{ id: "a" }]);
  });

  it("weighs the host's inventory unless handed a player's own", async () => {
    const run = build();

    await run.chooseCards({ count: 1, rng: dealStream([0]) });
    const playerInventory = { owner: "viewer" };
    await run.chooseCards({
      count: 1,
      rng: dealStream([0]),
      inventory: playerInventory,
    });

    const calls = run.options.cards[0].calls;
    assert.equal(calls[0].inventory, run.hostInventory);
    assert.equal(calls[1].inventory, playerInventory);
    assert.equal(run.calls.notDealt[2].inventory, playerInventory);
    assert.equal(run.calls.raceChecks[2].inventory, playerInventory);
  });

  it("takes each card's context once a hand, from the galaxy and the inventory dealt to", async () => {
    const contexts = [];
    const withContext = card("a", 1, {
      getContext: (galaxy, inventory) => {
        contexts.push({ galaxy, inventory });
        return { size: 9 };
      },
    });
    const run = build({ cards: [withContext, card("b", 3)] });

    await run.chooseCards({ count: 3, rng: dealStream([0, 0, 0]) });

    assert.equal(contexts.length, 1);
    assert.equal(contexts[0].galaxy, run.galaxy);
    assert.equal(contexts[0].inventory, run.hostInventory);
    assert.deepEqual(
      withContext.calls.map((call) => call.context),
      [{ size: 9 }, { size: 9 }, { size: 9 }]
    );
  });

  it("deals around a card that failed to load, by its deck position", async () => {
    const run = build({ cards: [undefined, card("b", 1)] });

    const hand = await run.chooseCards({ count: 1, rng: dealStream([0.5]) });

    assert.deepEqual(hand, [{ id: "b" }]);
  });

  it("skips a card whose deal() throws, and logs it", async () => {
    const throwing = card("a", () => {
      throw new Error("broken card");
    });
    const run = build({ cards: [throwing, card("b", 1)] });

    const hand = await run.chooseCards({ count: 1, rng: dealStream([0]) });

    assert.deepEqual(hand, [{ id: "b" }]);
    assert.equal(run.calls.errors.length, 1);
    assert.match(
      run.calls.errors[0],
      /^Tech card deal\(\) threw, skipping a: /
    );
  });

  it("deals a card whose getContext() throws with no context, and logs it", async () => {
    const throwing = card("a", 1, {
      getContext: () => {
        throw new Error("no context");
      },
    });
    const run = build({ cards: [throwing] });

    const hand = await run.chooseCards({ count: 1, rng: dealStream([0]) });

    assert.deepEqual(hand, [{ id: "a" }]);
    assert.equal(throwing.calls[0].context, undefined);
    assert.match(
      run.calls.errors[0],
      /^Tech card getContext\(\) threw, skipping a: /
    );
  });

  it("gives no chance to a card the deal refuses or the player's race cannot use", async () => {
    const run = build({
      cards: [card("a", 1), card("b", 1), card("c", 1)],
      deck: ["a", "b", "c"],
      notDealt: ["a"],
      raceBlocked: ["b"],
    });

    const hand = await run.chooseCards({ count: 1, rng: dealStream([0]) });

    assert.deepEqual(hand, [{ id: "c" }]);
    // The race gate is asked only of a card the deal rule lets through.
    assert.deepEqual(
      run.calls.raceChecks.map((check) => check.cardId),
      ["b", "c"]
    );
    assert.equal(run.calls.raceChecks[0].races.name, "races");
    assert.equal(
      run.calls.raceChecks[0].cardsToUnits,
      run.options.cardsToUnits
    );
  });

  it("checks each card against the hand dealt so far, the slot rule and the star's own cards", async () => {
    const run = build();
    const systemCards = [{ id: "pre_dealt" }];

    await run.chooseCards({
      count: 2,
      rng: dealStream([0, 0]),
      addSlot: false,
      systemCards,
    });

    const lists = run.calls.notDealt.map((call) => ids(call.list));
    assert.deepEqual(lists, [[], [], ["a"], ["a"]]);
    assert.equal(run.calls.notDealt[0].addSlot, false);
    assert.equal(run.calls.notDealt[0].systemCards, systemCards);
  });

  it("adds a card's plain-object params to the card dealt, and nothing else", async () => {
    const run = build({
      cards: [
        card("a", () => ({ chance: 1, params: { minion: "x" } })),
        card("b", () => ({ chance: 1, params: ["not", "plain"] })),
      ],
    });

    const hand = await run.chooseCards({
      count: 2,
      rng: dealStream([0, 0.9]),
    });

    assert.deepEqual(hand, [{ id: "a", minion: "x" }, { id: "b" }]);
  });

  it("deals nothing for a draw no card can win", async () => {
    const run = build({
      cards: [card("a", 0), card("b", undefined, { deal: undefined })],
    });

    const hand = await run.chooseCards({ count: 2, rng: dealStream([0, 0]) });

    assert.deepEqual(hand, []);
  });

  it("draws a hand from one unseeded source when the caller has no stream", async () => {
    const run = build({ unseededRolls: [0.1, 0.9] });

    const hand = await run.chooseCards({ count: 2 });

    assert.deepEqual(ids(hand), ["a", "b"]);
    assert.equal(run.calls.seedrandom, 1);
    assert.equal(run.options.cards[0].calls[0].rng, undefined);
  });
});
