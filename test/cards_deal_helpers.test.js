"use strict";

// Unit tests for gw_play/cards_deal_helpers.js, the pure card-dealing helpers carved
// out of gw_play/cards.js (a self-invoking scene script that can't be loaded/tested in
// place). The module's define() has no deps and touches only the lodash global, so it
// loads cleanly under the Node AMD harness with no engine stubs.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const helpers = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_deal_helpers.js"
);

describe("cardsOfferedCount", () => {
  function inventory(opts) {
    return {
      handIsFull: () => !!opts.full,
      hasCard: (id) => id === "gwaio_start_lucky" && !!opts.lucky,
    };
  }

  it("returns the base count with an empty-handed, luckless inventory", () => {
    assert.equal(helpers.cardsOfferedCount(3, inventory({})), 3);
  });

  it("adds one when the hand is full", () => {
    assert.equal(helpers.cardsOfferedCount(3, inventory({ full: true })), 4);
  });

  it("adds one when the Lucky start card is held", () => {
    assert.equal(helpers.cardsOfferedCount(3, inventory({ lucky: true })), 4);
  });

  it("adds one for each of a full hand and the Lucky card", () => {
    assert.equal(
      helpers.cardsOfferedCount(3, inventory({ full: true, lucky: true })),
      5
    );
  });

  it("returns the base count when given no inventory", () => {
    assert.equal(helpers.cardsOfferedCount(3, undefined), 3);
  });
});

describe("doNotDealCard", () => {
  const emptyInventory = { hasCard: () => false };
  const card = { id: "gwc_x" };

  it("withholds a card already held in the inventory", () => {
    assert.equal(
      helpers.doNotDealCard(
        { hasCard: (id) => id === "gwc_x" },
        card,
        [],
        true,
        false,
        []
      ),
      true
    );
  });

  it("withholds a card already dealt this round", () => {
    assert.equal(
      helpers.doNotDealCard(
        emptyInventory,
        card,
        [{ id: "gwc_x" }],
        true,
        false,
        []
      ),
      true
    );
  });

  it("withholds a card already present in the system (id as a value)", () => {
    assert.equal(
      helpers.doNotDealCard(emptyInventory, card, [], true, false, [
        { id: "gwc_x" },
      ]),
      true
    );
  });

  it("withholds a card already present in the system (id as an observable)", () => {
    assert.equal(
      helpers.doNotDealCard(emptyInventory, card, [], true, false, [
        { id: () => "gwc_x" },
      ]),
      true
    );
  });

  it("deals a fresh card no one holds", () => {
    assert.equal(
      helpers.doNotDealCard(emptyInventory, card, [], true, false, []),
      false
    );
  });

  it("never deals Additional Data Bank as a pre-dealt system card", () => {
    assert.equal(
      helpers.doNotDealCard(
        emptyInventory,
        { id: "gwc_add_card_slot" },
        [],
        false,
        false,
        []
      ),
      true
    );
  });

  it("treats a non-array systemCards as an empty system", () => {
    assert.equal(
      helpers.doNotDealCard(emptyInventory, card, [], true, false, undefined),
      false
    );
  });

  it("in testRun mode requires all three duplicate signals to be present", () => {
    const held = { hasCard: (id) => id === "gwc_x" };
    assert.equal(
      helpers.doNotDealCard(held, card, [{ id: "gwc_x" }], true, true, [
        { id: "gwc_x" },
      ]),
      true
    );
    // System has it, but it is neither held nor dealt this round.
    assert.equal(
      helpers.doNotDealCard(emptyInventory, card, [], true, true, [
        { id: "gwc_x" },
      ]),
      false
    );
  });
});

describe("isStartLoadoutCardId", () => {
  it("matches ids containing _start_", () => {
    assert.equal(helpers.isStartLoadoutCardId("gwaio_start_lucky"), true);
  });

  it("rejects ids without _start_", () => {
    assert.equal(helpers.isStartLoadoutCardId("gwc_minion"), false);
  });

  it("rejects non-string ids", () => {
    assert.equal(helpers.isStartLoadoutCardId(undefined), false);
    assert.equal(helpers.isStartLoadoutCardId(5), false);
  });
});

describe("filterStartLoadoutCards", () => {
  it("keeps only the start-loadout cards", () => {
    assert.deepEqual(
      helpers.filterStartLoadoutCards([
        { id: "gwaio_start_lucky" },
        { id: "gwc_minion" },
        { id: "gwaio_start_hoarder" },
      ]),
      [{ id: "gwaio_start_lucky" }, { id: "gwaio_start_hoarder" }]
    );
  });

  it("returns an empty array for a missing list", () => {
    assert.deepEqual(helpers.filterStartLoadoutCards(undefined), []);
  });
});

describe("buildPendingStartLoadoutCard", () => {
  it("wraps a bare id string and flags it for overflow", () => {
    assert.deepEqual(
      helpers.buildPendingStartLoadoutCard("gwaio_start_lucky"),
      {
        id: "gwaio_start_lucky",
        allowOverflow: true,
      }
    );
  });

  it("deep-clones a card object and adds allowOverflow when absent", () => {
    const input = { id: "gwaio_start_lucky", minions: [{ x: 1 }] };
    const result = helpers.buildPendingStartLoadoutCard(input);
    assert.deepEqual(result, {
      id: "gwaio_start_lucky",
      minions: [{ x: 1 }],
      allowOverflow: true,
    });
    // A clone, not the same reference.
    assert.notEqual(result, input);
    assert.notEqual(result.minions[0], input.minions[0]);
  });

  it("leaves an existing allowOverflow flag untouched", () => {
    assert.deepEqual(
      helpers.buildPendingStartLoadoutCard({
        id: "gwaio_start_lucky",
        allowOverflow: false,
      }),
      { id: "gwaio_start_lucky", allowOverflow: false }
    );
  });

  it("does not add allowOverflow to a non-loadout card", () => {
    assert.deepEqual(
      helpers.buildPendingStartLoadoutCard({ id: "gwc_minion" }),
      {
        id: "gwc_minion",
      }
    );
  });
});

describe("pendingCardsContainLoadout", () => {
  it("is true when the first pending card is a start loadout", () => {
    assert.equal(
      helpers.pendingCardsContainLoadout({
        cards: [{ id: "gwaio_start_lucky" }, { id: "gwc_minion" }],
      }),
      true
    );
  });

  it("is false when the first pending card is not a loadout", () => {
    assert.equal(
      helpers.pendingCardsContainLoadout({ cards: [{ id: "gwc_minion" }] }),
      false
    );
  });

  it("is false for empty or missing pending tech cards", () => {
    assert.equal(helpers.pendingCardsContainLoadout({ cards: [] }), false);
    assert.equal(helpers.pendingCardsContainLoadout(undefined), false);
  });
});

describe("applyPenchantToSubcommander", () => {
  // The helper reads the runtime `loc` global; in-game it localises, here it just
  // echoes the key so the appended name is assertable.
  const gwoAI = {
    penchants: () => ({ penchantName: "!LOC:Reckless", penchants: ["rush"] }),
  };

  function subcommander() {
    return {
      character: "Commander",
      personality: { personality_tags: ["base"] },
    };
  }

  it("appends the penchant name and tags for a Penchant ally", () => {
    const priorLoc = global.loc;
    global.loc = (key) => key;
    try {
      const sub = subcommander();
      helpers.applyPenchantToSubcommander(sub, { aiAlly: "Penchant" }, gwoAI);
      assert.equal(sub.character, "Commander !LOC:Reckless");
      assert.deepEqual(sub.personality.personality_tags, ["base", "rush"]);
    } finally {
      global.loc = priorLoc;
    }
  });

  it("is a no-op for a non-Penchant ally", () => {
    const sub = subcommander();
    helpers.applyPenchantToSubcommander(sub, { aiAlly: "Queller" }, gwoAI);
    assert.equal(sub.character, "Commander");
    assert.deepEqual(sub.personality.personality_tags, ["base"]);
  });

  it("is a no-op when gwoSettings is missing", () => {
    const sub = subcommander();
    helpers.applyPenchantToSubcommander(sub, undefined, gwoAI);
    assert.equal(sub.character, "Commander");
    assert.deepEqual(sub.personality.personality_tags, ["base"]);
  });
});
