"use strict";

// gw_play/cards_cheats.js installs model.cheats.testCards and
// model.cheats.giveCard. Both deal from GWO's deck rather than the base game's,
// which is the whole reason they are overridden - so what these pin is that the
// deck, the slot bookkeeping and the co-op guards are GWO's.
//
// testMinions is deliberately not covered: it calls the AMD global require(),
// and a file loaded through the Node harness gets CommonJS's own module-local
// require instead, which cannot be stubbed from outside. Every test here keeps
// gwc_minion out of testCards for that reason; giveCard reaches the same
// sub-commander draw without going through it.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_cheats.js"
);

// An inventory whose card list is a callable observable, as the base game's is.
function makeInventory(maxCards, initial) {
  const list = (initial || []).slice();
  const cards = function () {
    return list;
  };
  cards.push = (card) => list.push(card);
  cards.pop = () => list.pop();

  return {
    cards,
    maxCards: () => maxCards,
    applied: 0,
    applyCards() {
      this.applied += 1;
    },
  };
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      gwoCards: ["gwc_combat_bots", "gwc_orbital"],
      giveCardId: "gwc_combat_bots",
      isViewer: false,
      maxCards: 10,
      startingCards: [],
      duplicate: true,
      currentStar: 2,
      playerFaction: 0,
    },
    overrides
  );

  const calls = {
    dealt: [],
    snapshots: [],
    saves: [],
    aiDeals: [],
    penchants: [],
  };

  const inventory = makeInventory(options.maxCards, options.startingCards);
  const factions = [
    { minions: [{ name: "Able", commander: "/pa/units/x.json" }] },
    { minions: [{ name: "Baker" }] },
  ];

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  stubs.setGlobal("model", {
    cheats: { giveCardId: () => options.giveCardId },
    isCampaignViewer: () => options.isViewer,
    gwoCards: options.gwoCards,
    sendCampaignSnapshot: (name, flag) => calls.snapshots.push([name, flag]),
  });

  makeFactory({
    game: { currentStar: () => options.currentStar },
    galaxy: { stars: () => [{ id: 0 }, { id: 1 }, { id: 2 }] },
    inventory,
    gwoSettings: { penchant: "artillery" },
    playerFaction: options.playerFaction,
    gwoDeal: {
      dealCard: (request) => {
        calls.dealt.push(request);
        return Promise.resolve({ id: request.id });
      },
    },
    gwoAI: { name: "ai" },
    GWFactions: factions,
    gwoSave: (game, flag) => calls.saves.push(flag),
    cards: ["deck"],
    loaded: { loaded: true },
    dealCardToSelectableAI: (flag) => {
      calls.aiDeals.push(flag);
      return Promise.resolve();
    },
    helpers: {
      doNotDealCard: () => options.duplicate,
      // The real one rewrites the sub-commander in place, which is what makes
      // the clone in dealSubCommander load-bearing.
      applyPenchantToSubcommander: (subcommander, settings, ai) => {
        subcommander.penchant = settings.penchant;
        calls.penchants.push([subcommander, settings, ai]);
      },
    },
  });

  return {
    inventory,
    factions,
    calls,
    options,
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

// Neither cheat returns anything, so the chain is drained rather than awaited.
async function flush() {
  for (let turn = 0; turn < 6; turn++) {
    await new Promise((resolve) => setImmediate(resolve));
  }
}

const testCards = () => global.model.cheats.testCards();
const giveCard = () => global.model.cheats.giveCard();

const dealtIds = (calls) => calls.dealt.map((request) => request.id);

async function capture(stream, run) {
  const messages = [];
  const prior = console[stream];
  console[stream] = (...args) => messages.push(args.join(" "));
  try {
    await run();
  } finally {
    console[stream] = prior;
  }
  return messages;
}

describe("cheats install", () => {
  it("replaces both cheats so they deal from GWO's deck", () => {
    build();
    assert.equal(typeof global.model.cheats.testCards, "function");
    assert.equal(typeof global.model.cheats.giveCard, "function");
  });
});

describe("cheats testCards", () => {
  it("deals every card in GWO's deck at the current star", async () => {
    const { calls } = build();

    testCards();
    await flush();

    assert.deepEqual(dealtIds(calls), ["gwc_combat_bots", "gwc_orbital"]);
    // The star the player is standing on, not the first in the galaxy.
    assert.deepEqual(calls.dealt[0].star, { id: 2 });
    assert.equal(calls.dealt[0].inventory, active.inventory);
  });

  it("applies each dealt card to the inventory", async () => {
    const { inventory } = build();

    testCards();
    await flush();

    assert.deepEqual(
      inventory.cards().map((card) => card.id),
      ["gwc_combat_bots", "gwc_orbital"]
    );
    assert.equal(inventory.applied, 2);
  });

  it("re-deals to the selectable AI, broadcasts and saves once", async () => {
    const { calls } = build();

    testCards();
    await flush();

    assert.deepEqual(calls.aiDeals, [false]);
    assert.deepEqual(calls.snapshots, [["gwo_cheat_test_cards", true]]);
    assert.deepEqual(calls.saves, [true]);
  });

  // The point of the cheat: every card is checked against the duplicate rules
  // on the way in, and a card that fails is named.
  it("reports a card that fails the duplication test", async () => {
    const { calls } = build({ duplicate: false });

    const errors = await capture("error", async () => {
      testCards();
      await flush();
    });

    assert.deepEqual(errors, [
      "gwc_combat_bots failed duplication test",
      "gwc_orbital failed duplication test",
    ]);
    assert.deepEqual(dealtIds(calls), ["gwc_combat_bots", "gwc_orbital"]);
  });

  // A slot card is stamped unique, so it stacks rather than being rejected as a
  // duplicate of the last one - and is therefore not duplicate-tested.
  it("stamps a card slot unique and lets it overflow", async () => {
    const { inventory } = build({ gwoCards: ["gwc_add_card_slot"] });

    const errors = await capture("error", async () => {
      testCards();
      await flush();
    });

    const slot = inventory.cards()[0];
    assert.equal(slot.allowOverflow, true);
    assert.equal(typeof slot.unique, "number");
    assert.deepEqual(errors, []);
  });

  // A hand already over the limit needs a slot card per surplus card, or every
  // later deal in the sweep is rejected for want of room.
  it("buys a card slot for every card the hand is over its limit", async () => {
    const { calls } = build({
      maxCards: 0,
      startingCards: [{ id: "a" }, { id: "b" }, { id: "c" }],
      gwoCards: [],
    });

    testCards();
    await flush();

    // maxCards() + 1, because the start card does not use a slot.
    assert.deepEqual(dealtIds(calls), [
      "gwc_add_card_slot",
      "gwc_add_card_slot",
    ]);
  });

  it("buys no slots for a hand inside its limit", async () => {
    const { calls } = build({
      maxCards: 10,
      startingCards: [{ id: "a" }],
      gwoCards: [],
    });

    testCards();
    await flush();

    assert.deepEqual(dealtIds(calls), []);
  });

  // Viewers have no deck of their own to test and no authority to save.
  it("refuses to run for a co-op viewer", async () => {
    const { calls } = build({ isViewer: true });

    const errors = await capture("error", async () => {
      testCards();
      await flush();
    });

    assert.deepEqual(calls.dealt, []);
    assert.deepEqual(calls.saves, []);
    assert.match(
      errors[0],
      /cheats.testCards is unavailable for co-op viewers/
    );
  });
});

describe("cheats giveCard", () => {
  it("deals the named card and applies it", async () => {
    const { calls, inventory } = build({ giveCardId: "gwc_orbital" });

    giveCard();
    await flush();

    assert.deepEqual(dealtIds(calls), ["gwc_orbital"]);
    assert.deepEqual(
      inventory.cards().map((card) => card.id),
      ["gwc_orbital"]
    );
    assert.equal(inventory.applied, 1);
    assert.deepEqual(calls.aiDeals, [false]);
    assert.deepEqual(calls.snapshots, [["gwo_cheat_give_card", true]]);
    assert.deepEqual(calls.saves, [true]);
  });

  it("names a card it cannot find rather than dealing nothing quietly", async () => {
    const { calls } = build({ giveCardId: "gwc_not_a_card" });

    const errors = await capture("error", async () => {
      giveCard();
      await flush();
    });

    assert.deepEqual(calls.dealt, []);
    assert.deepEqual(errors, ["Unable to find a card called gwc_not_a_card"]);
  });

  // The minion card carries a sub-commander drawn from the player's own
  // faction, with the war's penchant applied - not a bare card.
  it("draws a sub-commander for the minion card", async () => {
    const { calls, inventory } = build({
      gwoCards: ["gwc_minion"],
      giveCardId: "gwc_minion",
    });

    giveCard();
    await flush();

    const card = inventory.cards()[0];
    assert.equal(card.minion.name, "Able");
    assert.equal(typeof card.unique, "number");
    assert.equal(calls.penchants.length, 1);
    assert.deepEqual(calls.penchants[0][1], { penchant: "artillery" });
  });

  it("draws the sub-commander from the player's own faction", async () => {
    const { inventory } = build({
      gwoCards: ["gwc_minion"],
      giveCardId: "gwc_minion",
      playerFaction: 1,
    });

    giveCard();
    await flush();

    assert.equal(inventory.cards()[0].minion.name, "Baker");
  });

  // Cloned, or the cheat would stamp the penchant onto the faction's own minion
  // and every later war in the session would inherit it.
  it("does not write the sub-commander back into the faction", async () => {
    const { inventory, factions } = build({
      gwoCards: ["gwc_minion"],
      giveCardId: "gwc_minion",
    });

    giveCard();
    await flush();

    assert.equal(inventory.cards()[0].minion.penchant, "artillery");
    assert.equal(factions[0].minions[0].penchant, undefined);
    assert.notEqual(inventory.cards()[0].minion, factions[0].minions[0]);
  });

  it("stamps a card slot unique and lets it overflow", async () => {
    const { inventory } = build({
      gwoCards: ["gwc_add_card_slot"],
      giveCardId: "gwc_add_card_slot",
    });

    giveCard();
    await flush();

    assert.equal(inventory.cards()[0].allowOverflow, true);
    assert.equal(typeof inventory.cards()[0].unique, "number");
  });

  it("refuses to run for a co-op viewer", async () => {
    const { calls } = build({ isViewer: true });

    const errors = await capture("error", async () => {
      giveCard();
      await flush();
    });

    assert.deepEqual(calls.dealt, []);
    assert.match(errors[0], /cheats.giveCard is unavailable for co-op viewers/);
  });
});
