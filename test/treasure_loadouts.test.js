"use strict";

// gw_play/treasure_loadouts.js. The offer is derived rather than stored, so these
// pin the two properties that makes possible: it depends only on the player and
// the star, and it sees mod loadouts the base game's unlock record cannot hold.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const treasure = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/treasure_loadouts.js"
);
const streams = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js"
);
const loadoutIds = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js"
);

// treasureLoadoutPool reads model.gwoNewStartCards for the mod loadouts, so the
// global has to exist for every test, not just the ones registering any. Set for
// the file rather than per test: the install helper below stubs model itself and
// restores back to this.
const fileStubs = createGlobalStubs();
fileStubs.setGlobal("model", {});

function withModLoadouts(ids, run) {
  model.gwoNewStartCards = ids;
  try {
    return run();
  } finally {
    delete model.gwoNewStartCards;
  }
}

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
      "with no mod registered the pool is GWO's own earnable loadouts"
    );
    for (const id of loadoutIds.starting) {
      assert.ok(!ids.includes(id), `${id} is available from the start`);
    }
  });

  it("offers a mod's locked loadout alongside GWO's", () => {
    const ids = withModLoadouts([{ id: "mym_start_one" }], () =>
      treasure.treasureLoadoutPool().map((card) => card.id)
    );

    assert.ok(ids.includes("mym_start_one"), "the mod loadout is unreachable");
    assert.ok(ids.includes("gwaio_start_ceo"), "GWO's own are still offered");
  });

  it("accepts a bare id as well as a card object", () => {
    const ids = withModLoadouts(["mym_start_bare"], () =>
      treasure.treasureLoadoutPool().map((card) => card.id)
    );

    assert.ok(ids.includes("mym_start_bare"));
  });

  it("deduplicates a mod id that collides with a shipped one", () => {
    const ids = withModLoadouts([{ id: "gwaio_start_ceo" }], () =>
      treasure.treasureLoadoutPool().map((card) => card.id)
    );

    assert.equal(
      ids.filter((id) => id === "gwaio_start_ceo").length,
      1,
      "a duplicate would weight that loadout twice in the draw"
    );
  });

  it("ignores registered ids that are not loadouts", () => {
    const ids = withModLoadouts(
      [{ id: "mym_damage_bots" }, { id: undefined }, undefined],
      () => treasure.treasureLoadoutPool().map((card) => card.id)
    );

    assert.deepEqual(ids, loadoutIds.lockedBase.concat(loadoutIds.unlockable));
  });

  it("survives the global being absent or the wrong type", () => {
    const expected = loadoutIds.lockedBase.concat(loadoutIds.unlockable);

    assert.deepEqual(
      treasure.treasureLoadoutPool().map((card) => card.id),
      expected
    );
    assert.deepEqual(
      withModLoadouts("not an array", () =>
        treasure.treasureLoadoutPool().map((card) => card.id)
      ),
      expected
    );
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

// The host has to know which loadouts a viewer already owns to offer them a
// treasure planet they can use, and cannot learn the mod ones any other way:
// the base game's own report drops every id outside the "gwc_start" prefix.
// install() is both halves of that exchange, over model/ko.
const REPORT = "gwo_report_unlocked_loadouts";

const bank = (ids) => ({
  added: [],
  startCards: () => (ids || []).map((id) => ({ id })),
  addStartCard(card) {
    this.added.push(card);
    return true;
  },
});

function install(overrides = {}) {
  const options = Object.assign(
    {
      records: { alice: { id: "alice" } },
      isViewer: true,
      campaignActive: true,
      perPlayerTech: true,
      hasRecord: true,
      upsertOk: true,
      stockIds: ["gwc_start_artillery"],
      gwoIds: ["gwaio_start_ceo"],
    },
    overrides
  );

  const calls = { upserts: [], reported: [], snapshots: [] };
  const handlers = {};
  // ko.computed evaluates eagerly and again on every dependency change; the
  // shipped code's "have I already said this?" guard only shows up on a re-run.
  const computeds = [];

  const stubs = createGlobalStubs();
  stubs.setGlobal("ko", {
    computed: (fn) => {
      computeds.push(fn);
      fn();
    },
  });
  stubs.setGlobal("model", {
    registerCampaignViewerOperatorHandler: (name, fn) => {
      handlers[name] = fn;
    },
    isCampaignViewer: () => options.isViewer,
    gwCampaignActive: () => options.campaignActive,
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    currentCoopPlayerInventoryData: () =>
      options.hasRecord ? { id: "alice" } : undefined,
    sendCampaignViewerOperator: (name, payload) =>
      calls.reported.push([name, payload]),
    sendCampaignSnapshot: (name, flag) => calls.snapshots.push([name, flag]),
  });

  const stockBank = bank(options.stockIds);
  const gwoBank = bank(options.gwoIds);

  const installed = treasure.install({
    game: {
      findCoopPlayerInventoryData: (query) => options.records[query.id],
      upsertCoopPlayerInventoryData: (record) => {
        if (!options.upsertOk) {
          return false;
        }
        calls.upserts.push(record);
        options.records[record.id] = record;
        return true;
      },
    },
    stockBank,
    gwoBank,
  });

  return {
    installed,
    handlers,
    calls,
    options,
    stockBank,
    gwoBank,
    rerun: () => computeds.forEach((fn) => fn()),
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
  active = install(overrides);
  return active;
}

describe("localUnlockedLoadoutIds", () => {
  it("merges both banks into one list of loadout ids", () => {
    assert.deepEqual(
      treasure.localUnlockedLoadoutIds(
        bank(["gwc_start_artillery"]),
        bank(["gwaio_start_ceo"])
      ),
      ["gwc_start_artillery", "gwaio_start_ceo"]
    );
  });

  it("drops anything that is not a loadout, and repeats", () => {
    assert.deepEqual(
      treasure.localUnlockedLoadoutIds(
        bank(["gwc_start_artillery", "gwc_combat_bots"]),
        bank(["gwc_start_artillery", "gwaio_start_ceo"])
      ),
      ["gwc_start_artillery", "gwaio_start_ceo"]
    );
  });

  it("is empty for a player who has unlocked nothing", () => {
    assert.deepEqual(treasure.localUnlockedLoadoutIds(bank(), bank()), []);
  });
});

describe("treasure loadouts install - reporting a viewer's unlocks", () => {
  it("tells the host what this viewer owns, mod loadouts included", () => {
    const { calls } = build();

    assert.deepEqual(calls.reported, [
      [
        REPORT,
        {
          unlocked_start_card_ids: ["gwc_start_artillery", "gwaio_start_ceo"],
        },
      ],
    ]);
  });

  it("says nothing when this client is not a co-op viewer", () => {
    for (const off of [
      { isViewer: false },
      { campaignActive: false },
      { perPlayerTech: false },
      { hasRecord: false },
    ]) {
      const { calls } = build(off);
      assert.deepEqual(calls.reported, [], JSON.stringify(off));
      active.restore();
      active = undefined;
    }
  });

  // The computed re-runs on every observable it touched, and the host stores the
  // list verbatim - repeating an unchanged list is pure snapshot traffic.
  it("does not repeat a list it has already sent", () => {
    const { calls, rerun } = build();
    rerun();
    rerun();
    assert.equal(calls.reported.length, 1);
  });

  it("reports again once the player unlocks something new", () => {
    const built = build();
    built.gwoBank.startCards = () => [
      { id: "gwaio_start_ceo" },
      { id: "gwaio_start_nomad" },
    ];

    built.rerun();

    assert.equal(built.calls.reported.length, 2);
    assert.deepEqual(built.calls.reported[1][1].unlocked_start_card_ids, [
      "gwc_start_artillery",
      "gwaio_start_ceo",
      "gwaio_start_nomad",
    ]);
  });
});

describe("treasure loadouts install - storing a reported list", () => {
  const operator = (ids) => ({
    client_id: "alice",
    client_name: "alice",
    payload: { unlocked_start_card_ids: ids },
  });

  it("stores what a viewer reported and broadcasts it", () => {
    const { handlers, calls } = build();

    handlers[REPORT](operator(["gwaio_start_ceo"]));

    assert.deepEqual(calls.upserts[0].gwaioUnlockedStartCardIds, [
      "gwaio_start_ceo",
    ]);
    assert.deepEqual(calls.snapshots, [[REPORT, true]]);
  });

  // The payload crosses the wire from another client, so it is filtered rather
  // than trusted.
  it("keeps only loadout ids out of what arrives", () => {
    const { handlers, calls } = build();

    handlers[REPORT](operator(["gwaio_start_ceo", "gwc_combat_bots", 7]));

    assert.deepEqual(calls.upserts[0].gwaioUnlockedStartCardIds, [
      "gwaio_start_ceo",
    ]);
  });

  it("survives a report carrying no list at all", () => {
    const { handlers, calls } = build();

    handlers[REPORT]({ client_id: "alice", client_name: "alice" });

    assert.deepEqual(calls.upserts[0].gwaioUnlockedStartCardIds, []);
  });

  it("does not rewrite or rebroadcast an unchanged list", () => {
    const { handlers, calls } = build();

    handlers[REPORT](operator(["gwaio_start_ceo"]));
    handlers[REPORT](operator(["gwaio_start_ceo"]));

    assert.equal(calls.upserts.length, 1);
    assert.equal(calls.snapshots.length, 1);
  });

  it("warns and stores nothing for a client with no record", () => {
    const { handlers, calls } = build({ records: {} });
    const warnings = [];
    const priorWarn = console.warn;
    console.warn = (message) => warnings.push(message);
    try {
      handlers[REPORT](operator(["gwaio_start_ceo"]));
    } finally {
      console.warn = priorWarn;
    }

    assert.deepEqual(calls.upserts, []);
    assert.match(warnings[0], /no record for reported loadout unlocks/);
  });

  it("does not broadcast a list it failed to store", () => {
    const { handlers, calls } = build({ upsertOk: false });
    const errors = [];
    const priorError = console.error;
    console.error = (message) => errors.push(message);
    try {
      handlers[REPORT](operator(["gwaio_start_ceo"]));
    } finally {
      console.error = priorError;
    }

    assert.deepEqual(calls.snapshots, []);
    assert.match(errors[0], /failed to store reported loadout unlocks/);
  });
});

// A viewer's own claim, as opposed to the host's cards being applied to it -
// gw_inventory.js suspends banking for the latter.
describe("treasure loadouts install - bankOwnLoadout", () => {
  it("banks a mod loadout the viewer just won", () => {
    const { installed, gwoBank, stockBank } = build();

    assert.equal(installed.bankOwnLoadout({ id: "gwaio_start_nomad" }), true);

    assert.deepEqual(gwoBank.added, [{ id: "gwaio_start_nomad" }]);
    assert.deepEqual(stockBank.added, []);
  });

  it("banks a base loadout where the base game keeps it", () => {
    const { installed, gwoBank, stockBank } = build();

    installed.bankOwnLoadout({ id: "gwc_start_storage" });

    assert.deepEqual(stockBank.added, [{ id: "gwc_start_storage" }]);
    assert.deepEqual(gwoBank.added, []);
  });

  it("banks nothing for an ordinary tech card", () => {
    const { installed, gwoBank, stockBank } = build();

    assert.equal(installed.bankOwnLoadout({ id: "gwc_combat_bots" }), false);

    assert.deepEqual(gwoBank.added, []);
    assert.deepEqual(stockBank.added, []);
  });
});
