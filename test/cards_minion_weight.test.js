"use strict";

// How likely gwc_minion is to be offered. The weight falls off with the Sub
// Commanders already in play, and in co-op that means everybody's, not just the
// dealing player's - deal() gets the viewer's own inventory but coopMinionCount
// reads model.game(), which is the host's game object. The Math.max over the two
// is what reconciles them; cards_deal_seeding.test.js deals against an inventory
// with no minions and no co-op records, so neither arm was ever discriminated.
//
// gwc_minion is in KNOWN_UNLOADABLE because gw_factions reads api at define
// time. Stubbing api first is enough - that list is about what loads bare.

const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const { setGlobal, restoreGlobals } = createGlobalStubs();
setGlobal("api", { content: { usingTitans: () => true } });

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const minionCard = loadCouiModule(
  "coui://ui/main/game/galactic_war/cards/gwc_minion.js",
);
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
);

after(restoreGlobals);

const BASE_CHANCE = 80;

const minions = (count) =>
  Array.from({ length: count }, (unused, n) => ({ name: "cdr_" + n }));

// A viewer's own inventory, as chooseCards hands it to deal(). Holding an
// opening factory and none of the three cards that zero the weight, so the
// subject is the minion count alone.
function inventory(over) {
  return Object.assign(
    {
      units: () => [gwoUnit.vehicleFactory],
      minions: () => [],
      hasCard: () => false,
    },
    over || {},
  );
}

const coopRecord = (id, minionCount) => ({
  id,
  inventory: { minions: minions(minionCount) },
});

function install(over) {
  const options = Object.assign({ coopRecords: [], omitCoop: false }, over);
  const game = {
    galaxy: () => ({
      origin: () => 0,
      stars: () => [{ system: () => ({ gwaio: { ai: "TITANS" } }) }],
    }),
  };

  if (!options.omitCoop) {
    game.coopPlayerInventoryData = () => options.coopRecords;
  }

  setGlobal("model", { game: () => game });
}

const chanceFor = (over, hostMinions) => {
  install(over);
  return minionCard.deal(
    {},
    { totalSize: 10, faction: 0 },
    inventory(hostMinions === undefined ? {} : { minions: () => hostMinions }),
    undefined,
  ).chance;
};

before(() => {
  setGlobal("loc", (key) => key);
  const factions = loadCouiModule("shared/gw_factions");
  factions[0].minions = [{ name: "a", personality: { personality_tags: [] } }];
});

afterEach(() => setGlobal("model", undefined));

describe("gwc_minion weight - counting Sub Commanders", () => {
  it("offers at full weight to a player with none", () => {
    assert.equal(chanceFor({}), BASE_CHANCE);
  });

  it("falls off with the dealing player's own", () => {
    assert.equal(chanceFor({}, minions(2)), BASE_CHANCE / 3);
  });

  // A viewer dealing against its own empty inventory still has to see the ones
  // its co-op partners hold, or every player is offered a Sub Commander at full
  // weight until they each have one.
  it("falls off with a co-op partner's, against an empty inventory", () => {
    assert.equal(
      chanceFor({ coopRecords: [coopRecord("alice", 2)] }),
      BASE_CHANCE / 3,
    );
  });

  it("sums the records of every co-op player", () => {
    assert.equal(
      chanceFor({
        coopRecords: [coopRecord("alice", 2), coopRecord("bob", 1)],
      }),
      BASE_CHANCE / 4,
    );
  });

  // The host is never in coopPlayerInventoryData, so its own count can exceed
  // the co-op total. Collapsing the Math.max to either side loses one of these.
  it("takes whichever of the two counts is larger", () => {
    assert.equal(
      chanceFor({ coopRecords: [coopRecord("alice", 1)] }, minions(3)),
      BASE_CHANCE / 4,
    );
    assert.equal(
      chanceFor({ coopRecords: [coopRecord("alice", 3)] }, minions(1)),
      BASE_CHANCE / 4,
    );
  });

  // Deliberate: a player who leaves and rejoins must not have their Sub
  // Commanders vanish and reappear. See coop.md, "Resolving viewers".
  it("counts a player who is not currently connected", () => {
    install({ coopRecords: [coopRecord("departed", 2)] });
    // Everywhere else in the mod this is what decides who counts.
    global.model.gwCampaignConnectedClients = () => [];

    const result = minionCard.deal(
      {},
      { totalSize: 10, faction: 0 },
      inventory(),
      undefined,
    );

    assert.equal(result.chance, BASE_CHANCE / 3);
  });
});

describe("gwc_minion weight - malformed co-op state", () => {
  it("treats a war with no co-op records at all as solo", () => {
    assert.equal(chanceFor({ omitCoop: true }, minions(1)), BASE_CHANCE / 2);
  });

  it("contributes nothing for a record it cannot read, rather than aborting", () => {
    const broken = [
      null,
      undefined,
      {},
      { inventory: {} },
      { inventory: { minions: "junk" } },
    ];

    assert.equal(
      chanceFor({ coopRecords: broken.concat([coopRecord("alice", 1)]) }),
      BASE_CHANCE / 2,
    );
  });
});

describe("gwc_minion weight - what zeroes it", () => {
  const zeroing = {
    "no opening factory": { units: () => [] },
    "the deep space start": { hasCard: (id) => id === "nem_start_deepspace" },
    "the tourist start": { hasCard: (id) => id === "gwaio_start_tourist" },
  };

  // Each short-circuits before the count, so a crowded galaxy cannot revive it.
  for (const [name, over] of Object.entries(zeroing)) {
    it("offers nothing with " + name, () => {
      install({ coopRecords: [coopRecord("alice", 4)] });
      const result = minionCard.deal(
        {},
        { totalSize: 10, faction: 0 },
        inventory(over),
        undefined,
      );
      assert.equal(result.chance, 0);
    });
  }
});
