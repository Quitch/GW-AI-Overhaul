"use strict";

// The two cards that draw inside deal(). Everything else in the deck is a pure
// function of the star and the inventory.
//
// gwc_minion is in KNOWN_UNLOADABLE because gw_factions reads api at define time.
// Stubbing api first is enough - that list is about what loads bare.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const { setGlobal, restoreGlobals } = createGlobalStubs();
setGlobal("api", { content: { usingTitans: () => true } });

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
);
const minionCard = loadCouiModule(
  "coui://ui/main/game/galactic_war/cards/gwc_minion.js",
);
const slotCard = loadCouiModule(
  "coui://ui/main/game/galactic_war/cards/gwc_add_card_slot.js",
);

after(restoreGlobals);

const MINIONS = "abcdefgh".split("").map((name) => ({
  name: name,
  character: "cdr_" + name,
  commander: "unit_" + name,
  personality: { personality_tags: [] },
}));

function inventory(over) {
  const opts = over || {};
  return Object.assign(
    {
      units: () => ["factory_vehicle"],
      minions: () => [],
      cards: () => [],
      maxCards: () => 5,
      handIsFull: () => false,
      hasCard: () => false,
      getTag: () => 0,
    },
    opts,
  );
}

// gwc_minion.deal reads the war settings off model.game() rather than context.
function installModel(gwoSettings) {
  setGlobal("model", {
    game: () => ({
      galaxy: () => ({
        origin: () => 0,
        stars: () => [{ system: () => ({ gwaio: gwoSettings }) }],
      }),
      coopPlayerInventoryData: () => [],
    }),
  });
}

const context = { totalSize: 10, faction: 0 };
const star = {};

describe("gwc_minion deal seeding", () => {
  before(() => {
    setGlobal("loc", (key) => key);
    // GWFactions is a shipped module; the deal indexes it by context.faction.
    const factions = loadCouiModule("shared/gw_factions");
    factions[0].minions = MINIONS;
  });

  const dealWith = (seed, gwoSettings) => {
    installModel(gwoSettings || { ai: "TITANS" });
    return minionCard.deal(
      star,
      context,
      inventory(),
      seed === undefined ? undefined : gwoRng.create(seed),
    );
  };

  it("reproduces the same Sub Commander and marker for the same seed", () => {
    const a = dealWith("s");
    const b = dealWith("s");
    assert.equal(a.params.minion.name, b.params.minion.name);
    assert.equal(a.params.unique, b.params.unique);
  });

  it("draws a different Sub Commander for a different seed", () => {
    const names = new Set(
      ["s1", "s2", "s3", "s4", "s5", "s6"].map(
        (seed) => dealWith(seed).params.minion.name,
      ),
    );
    assert.ok(names.size > 1, "every seed drew the same Sub Commander");
  });

  it("applies the penchant from the same stream, reproducibly", () => {
    const settings = { ai: "Penchant" };
    const a = dealWith("p", settings);
    const b = dealWith("p", settings);
    assert.equal(a.params.minion.character, b.params.minion.character);
    assert.deepEqual(
      a.params.minion.personality.personality_tags,
      b.params.minion.personality.personality_tags,
    );
  });

  it("still deals unseeded, for a war saved before seeds were recorded", () => {
    const deal = dealWith(undefined);
    assert.ok(deal.params.minion);
    assert.ok(deal.params.unique);
  });

  // The invariant the speculative-deal design rests on: the dealer calls deal()
  // on every card of the deck for every card of a hand and keeps one result.
  it("gives the same chance with and without an rng", () => {
    assert.equal(dealWith("s").chance, dealWith(undefined).chance);
  });

  it("copies the pool entry rather than mutating it", () => {
    dealWith("p", { ai: "Penchant" });
    for (const entry of MINIONS) {
      assert.deepEqual(entry.personality.personality_tags, []);
      assert.equal(entry.character, "cdr_" + entry.name);
    }
  });
});

describe("gwc_add_card_slot deal seeding", () => {
  const dealWith = (seed) =>
    slotCard.deal(
      star,
      context,
      inventory(),
      seed === undefined ? undefined : gwoRng.create(seed),
    );

  it("reproduces its marker for the same seed and varies it across seeds", () => {
    assert.equal(dealWith("s").params.unique, dealWith("s").params.unique);
    assert.notEqual(dealWith("s").params.unique, dealWith("t").params.unique);
  });

  it("gives the same chance with and without an rng", () => {
    assert.equal(dealWith("s").chance, dealWith(undefined).chance);
  });

  it("still deals unseeded", () => {
    assert.ok(dealWith(undefined).params.unique);
  });
});

describe("seeded unique markers", () => {
  // hasCard tests !card.unique, so a zero would make the card unrepeatable for
  // that seed forever. Both cards route through gwoCard.uniqueValue.
  it("are never falsy over a long seeded run", () => {
    const rng = gwoRng.create("marker-seed");
    for (let i = 0; i < 10000; i++) {
      const value = slotCard.deal(star, context, inventory(), rng).params
        .unique;
      assert.ok(value, `draw ${i} yielded ${value}`);
    }
  });
});
