"use strict";

// gw_play/treasure_loadouts.js. The offer is derived rather than stored, so these
// pin the two properties that makes possible: it depends only on the player and
// the star, and it sees mod loadouts the base game's unlock record cannot hold.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const treasure = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js"
);
const streams = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js"
);
const loadoutIds = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js"
);

const war = () => streams.warRng({ seed: "a-war-seed" });

function pick(record, playerKey, starIndex) {
  return treasure.pickTreasureLoadout({
    isUnlocked: (card) => treasure.recordHasUnlockedLoadout(record, card),
    rng: streams.treasureLoadoutRng(war(), playerKey, starIndex),
  });
}

describe("treasureLoadoutPool", () => {
  it("offers every unlockable loadout and no starting one", () => {
    const ids = treasure.treasureLoadoutPool().map((card) => card.id);
    assert.deepEqual(
      ids,
      loadoutIds.lockedBase.concat(loadoutIds.unlockable),
      "the pool must match what gw_start/setup.js drew from"
    );
    for (const id of loadoutIds.starting) {
      assert.ok(!ids.includes(id), `${id} is available from the start`);
    }
  });
});

// gw_game.js's defeatTeam(undefined) clears the Guardians' own ai() when you beat
// them, so nothing on the star says "treasure planet" by the time it is explored.
describe("isTreasureStar", () => {
  it("identifies the star by the index the war recorded", () => {
    assert.equal(treasure.isTreasureStar({ treasureStar: 7 }, 7), true);
    assert.equal(treasure.isTreasureStar({ treasureStar: 7 }, 8), false);
  });

  it("identifies star zero, which must not read as absent", () => {
    assert.equal(treasure.isTreasureStar({ treasureStar: 0 }, 0), true);
  });

  it("is false for a war that recorded no treasure star", () => {
    assert.equal(treasure.isTreasureStar({}, 0), false);
    assert.equal(treasure.isTreasureStar(undefined, 0), false);
    assert.equal(
      treasure.isTreasureStar({ treasureStar: undefined }, 0),
      false
    );
  });
});

describe("findTreasureStar", () => {
  const star = (ai, cards) => ({
    ai: () => ai,
    cardList: () => cards || [],
  });

  it("finds the Guardians while they still stand", () => {
    assert.equal(
      treasure.findTreasureStar([
        star(undefined),
        star({ treasurePlanet: true }),
        star({}),
      ]),
      1
    );
  });

  // Once they are beaten the ai is gone, and the pre-dealt loadout the old war
  // left behind is the only thing marking the star.
  it("falls back to the star still holding a pre-dealt loadout", () => {
    assert.equal(
      treasure.findTreasureStar([
        star(undefined, [{ id: "gwc_combat_bots" }]),
        star(undefined, [{ id: "gwaio_start_ceo" }]),
      ]),
      1
    );
  });

  it("prefers the live Guardians over a stray loadout card", () => {
    assert.equal(
      treasure.findTreasureStar([
        star(undefined, [{ id: "gwaio_start_ceo" }]),
        star({ treasurePlanet: true }),
      ]),
      1
    );
  });

  // The loadout has already been taken, or the war never had a treasure planet.
  it("is undefined when nothing marks a treasure star", () => {
    assert.equal(
      treasure.findTreasureStar([star(undefined), star({})]),
      undefined
    );
    assert.equal(treasure.findTreasureStar([]), undefined);
  });
});

// A loadout won mid-war unlocks the commander and grants nothing in this war,
// so the card never reaches the inventory and its buff() never banks for us.
describe("bankStartCard", () => {
  const banks = () => {
    const stockBank = {
      added: [],
      addStartCard: (c) => stockBank.added.push(c),
    };
    const gwoBank = { added: [], addStartCard: (c) => gwoBank.added.push(c) };
    return { stockBank, gwoBank };
  };

  it("keeps mod loadouts out of the base game's bank", () => {
    const { stockBank, gwoBank } = banks();
    treasure.bankStartCard({
      card: { id: "gwaio_start_lucky" },
      stockBank,
      gwoBank,
    });
    assert.deepEqual(gwoBank.added, [{ id: "gwaio_start_lucky" }]);
    assert.deepEqual(stockBank.added, []);
  });

  it("banks a base loadout where the base game keeps it", () => {
    const { stockBank, gwoBank } = banks();
    treasure.bankStartCard({
      card: { id: "gwc_start_artillery" },
      stockBank,
      gwoBank,
    });
    assert.deepEqual(stockBank.added, [{ id: "gwc_start_artillery" }]);
    assert.deepEqual(gwoBank.added, []);
  });

  it("banks nothing for an ordinary tech card", () => {
    const { stockBank, gwoBank } = banks();
    assert.equal(
      treasure.bankStartCard({
        card: { id: "gwc_combat_bots" },
        stockBank,
        gwoBank,
      }),
      false
    );
    assert.deepEqual(stockBank.added, []);
    assert.deepEqual(gwoBank.added, []);
  });
});

describe("isBaseLoadoutCardId", () => {
  // The server's own predicate. Ids failing it are pushed into a viewer's war
  // inventory instead of being recorded as an unlock, which is what GWO has to
  // intercept.
  it("matches only the ids the base game records as unlocks", () => {
    assert.equal(treasure.isBaseLoadoutCardId("gwc_start_artillery"), true);
    assert.equal(treasure.isBaseLoadoutCardId("gwaio_start_lucky"), false);
    assert.equal(treasure.isBaseLoadoutCardId("nem_start_nuke"), false);
    assert.equal(treasure.isBaseLoadoutCardId("gwc_combat_bots"), false);
    assert.equal(treasure.isBaseLoadoutCardId(undefined), false);
  });
});

describe("recordHasUnlockedLoadout", () => {
  it("reads the base game's own unlock list", () => {
    const record = { unlockedStartCardIds: ["gwc_start_subcdr"] };
    assert.equal(
      treasure.recordHasUnlockedLoadout(record, "gwc_start_subcdr"),
      true
    );
    assert.equal(
      treasure.recordHasUnlockedLoadout(record, "gwc_start_storage"),
      false
    );
  });

  // The regression this field exists for: normalizeUnlockedStartCardIds filters
  // to ids beginning "gwc_start", so a mod loadout can never reach the base list.
  it("recognises a mod loadout held only in the GWO list", () => {
    const record = {
      unlockedStartCardIds: [],
      gwaioUnlockedStartCardIds: ["gwaio_start_ceo"],
    };
    assert.equal(
      treasure.recordHasUnlockedLoadout(record, "gwaio_start_ceo"),
      true
    );
    assert.equal(
      treasure.recordHasUnlockedLoadout(record, "nem_start_nuke"),
      false
    );
  });

  it("counts the loadout the player is playing this war", () => {
    assert.equal(
      treasure.recordHasUnlockedLoadout(
        { loadoutCardId: "gwaio_start_nomad" },
        "gwaio_start_nomad"
      ),
      true
    );
  });

  it("accepts a card object as readily as an id", () => {
    const record = { gwaioUnlockedStartCardIds: ["gwaio_start_ceo"] };
    assert.equal(
      treasure.recordHasUnlockedLoadout(record, { id: "gwaio_start_ceo" }),
      true
    );
  });

  it("is false for anything that is not a loadout", () => {
    const record = { gwaioUnlockedStartCardIds: ["gwaio_start_ceo"] };
    assert.equal(
      treasure.recordHasUnlockedLoadout(record, "gwaio_upgrade_airfactory"),
      false
    );
    assert.equal(treasure.recordHasUnlockedLoadout(record, undefined), false);
  });

  it("survives a record with no unlock metadata at all", () => {
    assert.equal(
      treasure.recordHasUnlockedLoadout(undefined, "gwc_start_subcdr"),
      false
    );
    assert.equal(
      treasure.recordHasUnlockedLoadout({}, "gwc_start_subcdr"),
      false
    );
    assert.equal(
      treasure.recordHasUnlockedLoadout(
        { unlockedStartCardIds: "not an array" },
        "gwc_start_subcdr"
      ),
      false
    );
  });
});

describe("pickTreasureLoadout", () => {
  it("never offers a loadout the player already holds", () => {
    const pool = treasure.treasureLoadoutPool();
    const record = {
      gwaioUnlockedStartCardIds: pool
        .slice(0, pool.length - 1)
        .map((card) => card.id),
    };
    assert.equal(pick(record, "uber-1", 3).id, pool[pool.length - 1].id);
  });

  it("marks the offer as allowed to overflow a full hand", () => {
    assert.equal(pick({}, "uber-1", 3).allowOverflow, true);
  });

  // A catch-up deal replays an old star for a player who was absent when it was
  // explored, and must reproduce the offer they would have had.
  it("reproduces the same offer for the same player and star", () => {
    assert.deepEqual(pick({}, "uber-1", 3), pick({}, "uber-1", 3));
  });

  it("gives each player and each star their own offer", () => {
    const perPlayer = ["host", "uber-1", "uber-2", "uber-3"].map(
      (key) => pick({}, key, 3).id
    );
    const perStar = [3, 4, 5, 6].map((star) => pick({}, "uber-1", star).id);
    assert.ok(new Set(perPlayer).size > 1, "every player got the same loadout");
    assert.ok(new Set(perStar).size > 1, "every star offered the same loadout");
  });

  it("offers nothing once the player holds every loadout", () => {
    const record = {
      gwaioUnlockedStartCardIds: treasure
        .treasureLoadoutPool()
        .map((card) => card.id),
    };
    assert.equal(pick(record, "uber-1", 3), undefined);
  });

  // Wars saved before seeds were recorded have no warRng at all.
  it("falls back to an unseeded draw with no rng", () => {
    const card = treasure.pickTreasureLoadout({
      isUnlocked: () => false,
      rng: undefined,
    });
    assert.ok(
      treasure.treasureLoadoutPool().some((entry) => entry.id === card.id)
    );
  });

  it("does not mutate the shared pool", () => {
    const pool = treasure.treasureLoadoutPool();
    treasure.pickTreasureLoadout({ pool: pool, isUnlocked: () => false });
    assert.ok(
      pool.every((card) => card.allowOverflow === undefined),
      "buildPendingStartLoadoutCard must clone before stamping allowOverflow"
    );
  });
});
