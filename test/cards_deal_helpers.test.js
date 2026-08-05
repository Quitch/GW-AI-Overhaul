"use strict";

// Unit tests for gw_play/cards_deal_helpers.js, the pure card-dealing helpers carved
// out of gw_play/cards.js (a self-invoking scene script that can't be loaded/tested in
// place).

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

describe("chooseDealIndex", () => {
  function hand(...chances) {
    return chances.map((chance) => ({ chance: chance }));
  }

  it("returns the first dealable card for a roll of 0", () => {
    assert.equal(helpers.chooseDealIndex(hand(10, 30, 60), 0), 0);
  });

  it("returns an index into fullHand, not into the filtered hand", () => {
    assert.equal(helpers.chooseDealIndex(hand(0, 0, 10), 0), 2);
  });

  it("never returns a zero-chance card", () => {
    const fullHand = hand(0, 5, 0, 5, 0);
    for (let i = 0; i < 100; i++) {
      const index = helpers.chooseDealIndex(fullHand, i / 100);
      assert.ok(index === 1 || index === 3, `roll ${i / 100} gave ${index}`);
    }
  });

  it("walks the weights in array order", () => {
    const fullHand = hand(10, 30, 60);
    assert.equal(helpers.chooseDealIndex(fullHand, 0.09), 0);
    assert.equal(helpers.chooseDealIndex(fullHand, 0.11), 1);
    assert.equal(helpers.chooseDealIndex(fullHand, 0.39), 1);
    assert.equal(helpers.chooseDealIndex(fullHand, 0.41), 2);
    assert.equal(helpers.chooseDealIndex(fullHand, 0.99), 2);
  });

  it("skips holes and entries with no deal", () => {
    assert.equal(
      helpers.chooseDealIndex([undefined, null, { chance: 10 }], 0),
      2
    );
  });

  it("returns undefined when nothing is dealable", () => {
    assert.equal(helpers.chooseDealIndex(hand(0, 0), 0), undefined);
    assert.equal(helpers.chooseDealIndex([], 0), undefined);
  });

  // Unreachable from the rng, which is [0, 1), but a caller could supply it.
  it("returns undefined rather than throwing for a roll of 1", () => {
    assert.equal(helpers.chooseDealIndex(hand(10, 30), 1), undefined);
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

  it("forwards its rng to gwoAI.penchants", () => {
    const priorLoc = global.loc;
    global.loc = (key) => key;
    try {
      const seen = [];
      const spy = {
        penchants: (rng) => {
          seen.push(rng);
          return { penchantName: "n", penchants: [] };
        },
      };
      const rng = () => 0.5;
      helpers.applyPenchantToSubcommander(
        subcommander(),
        { aiAlly: "Penchant" },
        spy,
        rng
      );
      assert.deepEqual(seen, [rng]);
    } finally {
      global.loc = priorLoc;
    }
  });
});

describe("buildGeneralCommanderMinions", () => {
  const gwoRng = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
  );
  const gwoCard = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"
  );

  // Distinct enough that two independent picks landing on the same one by
  // chance would be a 1-in-64 event, not a coin flip.
  const POOL = "abcdefgh".split("").map((name) => ({
    name: name,
    character: "cdr_" + name,
    personality: { personality_tags: [] },
  }));

  const gwoAI = {
    penchants: (rng) => ({
      penchantName: "p" + (rng ? Math.floor(rng() * 1000) : "?"),
      penchants: ["tag"],
    }),
  };

  function build(opts) {
    const priorLoc = global.loc;
    global.loc = (key) => key;
    try {
      return helpers.buildGeneralCommanderMinions({
        minionPool: opts.pool === undefined ? POOL : opts.pool,
        gwoSettings: opts.gwoSettings || { aiAlly: "TITANS" },
        gwoAI: gwoAI,
        gwoCard: gwoCard,
        rng: opts.seed === undefined ? undefined : gwoRng.create(opts.seed),
      });
    } finally {
      global.loc = priorLoc;
    }
  }

  const names = (minions) => minions.map((m) => m.minion.name);

  it("returns nothing for an empty pool", () => {
    assert.deepEqual(build({ pool: [], seed: "s" }), []);
    assert.deepEqual(
      build({ pool: undefined, seed: "s" }),
      build({ seed: "s" })
    );
  });

  it("grants two Sub Commander cards", () => {
    const minions = build({ seed: "s" });
    assert.equal(minions.length, 2);
    for (const card of minions) {
      assert.equal(card.id, "gwc_minion");
      assert.ok(card.minion);
      assert.ok(card.unique);
    }
  });

  it("reproduces the same pair for the same seed", () => {
    assert.deepEqual(build({ seed: "s" }), build({ seed: "s" }));
  });

  it("draws a different pair for a different seed", () => {
    const seen = new Set(
      ["s1", "s2", "s3", "s4", "s5"].map((seed) =>
        names(build({ seed })).join()
      )
    );
    assert.ok(seen.size > 1, "every seed produced the same pair");
  });

  // The property the per-minion streams exist for: turning the ally's penchant
  // on adds a draw to minion 0, which must not move minion 1.
  it("leaves the second minion alone when the first draws a penchant", () => {
    const withPenchant = build({
      seed: "s",
      gwoSettings: { aiAlly: "Penchant" },
    });
    const without = build({ seed: "s", gwoSettings: { aiAlly: "TITANS" } });
    assert.equal(withPenchant[1].minion.name, without[1].minion.name);
    assert.equal(withPenchant[0].minion.name, without[0].minion.name);
  });

  it("gives each minion its own unique marker", () => {
    const minions = build({ seed: "s" });
    assert.notEqual(minions[0].unique, minions[1].unique);
  });

  it("still deals two minions with no rng, for a war saved before seeds", () => {
    const minions = build({ seed: undefined });
    assert.equal(minions.length, 2);
    assert.ok(minions[0].unique);
    assert.ok(minions[1].unique);
  });

  it("copies the pool entry rather than mutating it", () => {
    build({ seed: "s", gwoSettings: { aiAlly: "Penchant" } });
    for (const entry of POOL) {
      assert.deepEqual(entry.personality.personality_tags, []);
      assert.equal(entry.character, "cdr_" + entry.name);
    }
  });
});

describe("explorationStillLive", () => {
  function game(opts) {
    return {
      turnState: () => opts.turnState,
      currentStar: () => opts.currentStar,
    };
  }

  function star(explored) {
    return { hasCard: () => !explored };
  }

  const live = game({ turnState: "explore", currentStar: 17 });

  it("accepts a deal landing on the star its exploration started from", () => {
    assert.equal(helpers.explorationStillLive(live, 17, star(false)), true);
  });

  it("rejects a deal landing after the turn ended", () => {
    const ended = game({ turnState: "end", currentStar: 17 });
    assert.equal(helpers.explorationStillLive(ended, 17, star(false)), false);
  });

  it("rejects a deal landing after the turn returned to begin", () => {
    const begun = game({ turnState: "begin", currentStar: 17 });
    assert.equal(helpers.explorationStillLive(begun, 17, star(false)), false);
  });

  it("rejects a deal whose star is no longer the current one", () => {
    const moved = game({ turnState: "explore", currentStar: 18 });
    assert.equal(helpers.explorationStillLive(moved, 17, star(false)), false);
  });

  it("rejects a deal for a star already resolved by a win", () => {
    assert.equal(helpers.explorationStillLive(live, 17, star(true)), false);
  });

  it("rejects a non-numeric star index", () => {
    assert.equal(
      helpers.explorationStillLive(live, undefined, star(false)),
      false
    );
    assert.equal(helpers.explorationStillLive(live, "17", star(false)), false);
  });

  it("rejects a missing game or star without throwing", () => {
    assert.equal(
      helpers.explorationStillLive(undefined, 17, star(false)),
      false
    );
    assert.equal(helpers.explorationStillLive(live, 17, undefined), false);
  });

  it("rejects a game or star missing the accessors it reads", () => {
    assert.equal(helpers.explorationStillLive({}, 17, star(false)), false);
    assert.equal(
      helpers.explorationStillLive(
        { turnState: () => "explore" },
        17,
        star(false)
      ),
      false
    );
    assert.equal(helpers.explorationStillLive(live, 17, {}), false);
  });
});
