"use strict";

// gw_play/coop_publish.js: GWO's own snapshots to the viewers. Under per-player
// tech the server applies a viewer's tech choice to its copy before the host
// has it, and a snapshot replaces that copy, so a snapshot waits until every
// viewer is level. See coop.md, "Publishing to viewers".
//
// The module holds one debt and one hold count for the scene, so no test
// leaves either behind.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

const coopPublish = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_publish.js"
);

const HOST = { id: "host", name: "Host", role: "host" };
const ALICE = { id: "alice", name: "Alice", role: "viewer" };
const BOB = { id: "bob", name: "Bob", role: "viewer" };
const OPEN = { star: 3, cards: [{ id: "a" }] };

// Every ko.computed the module makes, across the file: it makes one a scene.
const computeds = [];
// The module makes its hold count once, so its reads go to the current run.
let currentReads = [];

function setup(overrides) {
  const options = Object.assign(
    {
      connected: [HOST, ALICE],
      perPlayerTech: true,
      records: { alice: { playerId: "alice", techCardDealCount: 2 } },
      hostDealCount: 2,
      setupBlocked: false,
      turnState: "begin",
      aiDeciding: false,
    },
    overrides
  );
  const snapshots = [];

  const reads = [];
  currentReads = reads;
  const read = (name, value) => () => {
    reads.push(name);
    return value();
  };

  const stubs = createGlobalStubs();
  stubs.setGlobal("ko", {
    computed: (fn) => {
      computeds.push(fn);
      return fn;
    },
    observable: (initial) => {
      const observable = makeObservable(initial);
      const tracked = function () {
        if (!arguments.length) {
          currentReads.push("held");
        }
        return observable.apply(null, arguments);
      };
      tracked.peek = observable.peek;
      return tracked;
    },
  });
  stubs.setGlobal("model", {
    gwCampaignConnectedClients: read("connected", () => options.connected),
    gwCampaignPerPlayerTechCards: () => options.perPlayerTech,
    gwCampaignPlayerSetupBlocked: read(
      "setupBlocked",
      () => options.setupBlocked
    ),
    gwoCoopAiDeciding: read("aiDeciding", () => options.aiDeciding),
    getCoopPlayerTechCardDealCount: (record) => record.techCardDealCount,
    sendCampaignSnapshot: (reason, force) => snapshots.push([reason, force]),
    game: () => ({
      findCoopPlayerInventoryData: (client) => options.records[client.id],
      coopPlayerInventoryData: read("records", () => options.records),
      hostTechCardDealCount: read("hostDealCount", () => options.hostDealCount),
      turnState: read("turnState", () => options.turnState),
    }),
  });

  return {
    options,
    reads,
    snapshots,
    restore: () => stubs.restoreGlobals(),
  };
}

const { build } = trackActive(setup);

describe("coop_publish", () => {
  it("publishes at once when every viewer is level", () => {
    const run = build();

    assert.equal(coopPublish.publish("gwo_reroll_pending_tech"), true);
    assert.deepEqual(run.snapshots, [["gwo_reroll_pending_tech", true]]);
    assert.equal(coopPublish.settle(), false, "nothing is left owed");
    assert.equal(computeds.length, 0, "nothing held, so nothing watched");
  });

  // Its choice would reach the server before the host, and a snapshot sent
  // in between would replace it there.
  it("holds the snapshot while a viewer has an offer open", () => {
    const run = build({
      records: {
        alice: {
          playerId: "alice",
          techCardDealCount: 1,
          pendingTechCards: { star: 3, cards: [{ id: "a" }] },
        },
      },
    });

    assert.equal(coopPublish.publish("gwo_reroll_pending_tech"), false);
    assert.deepEqual(run.snapshots, []);

    run.options.records.alice = { playerId: "alice", techCardDealCount: 2 };
    assert.equal(coopPublish.settle(), true);
    assert.deepEqual(run.snapshots, [["gwo_reroll_pending_tech", true]]);
  });

  it("holds the snapshot while a viewer is picking or the host explores", () => {
    for (const held of [
      { setupBlocked: true },
      { turnState: "explore" },
      { aiDeciding: true },
      { hostDealCount: 3 },
      {
        connected: [
          HOST,
          Object.assign({}, ALICE, { loading_status: "picking_tech_cards" }),
        ],
      },
    ]) {
      const run = build(held);
      assert.equal(
        coopPublish.publish("gwo_setup_general_commander"),
        false,
        JSON.stringify(held)
      );
      assert.deepEqual(run.snapshots, [], JSON.stringify(held));
      run.options.connected = [HOST];
      coopPublish.settle();
      run.restore();
    }
  });

  it("publishes at once under shared tech, where viewers hold no tech", () => {
    const run = build({
      perPlayerTech: false,
      records: {
        alice: {
          playerId: "alice",
          pendingTechCards: { star: 3, cards: [] },
        },
      },
    });

    assert.equal(coopPublish.publish("gwo_coop_ai_add"), true);
    assert.deepEqual(run.snapshots, [["gwo_coop_ai_add", true]]);
  });

  // A joiner's initial sync asks for a snapshot of its own.
  it("drops the debt once no viewer is left to tell", () => {
    const run = build({ hostDealCount: 3 });
    coopPublish.publish("gwo_coop_ai_kick");

    run.options.connected = [HOST];
    assert.equal(coopPublish.settle(), false);
    run.options.connected = [HOST, ALICE];
    run.options.hostDealCount = 2;
    assert.equal(coopPublish.settle(), false);
    assert.deepEqual(run.snapshots, []);
  });

  // A viewer waiting on its reroll has its offer hidden, so it cannot choose
  // while the snapshot goes out; only another viewer could.
  it("publishes a reroll at once when only the rerolling viewer has an offer", () => {
    const run = build({
      turnState: "explore",
      records: {
        alice: {
          playerId: "alice",
          techCardDealCount: 1,
          pendingTechCards: OPEN,
        },
      },
    });

    assert.equal(coopPublish.publish("gwo_reroll_pending_tech", ALICE), true);
    assert.deepEqual(run.snapshots, [["gwo_reroll_pending_tech", true]]);
  });

  it("holds a reroll while another viewer has an offer, until everyone is level", () => {
    const run = build({
      connected: [HOST, ALICE, BOB],
      records: {
        alice: {
          playerId: "alice",
          techCardDealCount: 1,
          pendingTechCards: OPEN,
        },
        bob: { playerId: "bob", techCardDealCount: 1, pendingTechCards: OPEN },
      },
    });

    assert.equal(coopPublish.publish("gwo_reroll_pending_tech", ALICE), false);
    assert.deepEqual(run.snapshots, []);

    // Once it is held, the rerolling viewer can choose too.
    run.options.records.bob = { playerId: "bob", techCardDealCount: 2 };
    assert.equal(coopPublish.settle(), false);
    run.options.records.alice = { playerId: "alice", techCardDealCount: 2 };
    assert.equal(coopPublish.settle(), true);
    assert.deepEqual(run.snapshots, [["gwo_reroll_pending_tech", true]]);
  });

  it("owes one snapshot however many publishes wait, under the latest reason", () => {
    const run = build({ hostDealCount: 3 });
    coopPublish.publish("gwo_coop_ai_add");
    coopPublish.publish("gwo_reroll_pending_tech");

    run.options.hostDealCount = 2;
    assert.equal(coopPublish.settle(), true);
    assert.equal(coopPublish.settle(), false);
    assert.deepEqual(run.snapshots, [["gwo_reroll_pending_tech", true]]);
  });

  // Made by the module itself, so a held snapshot goes out even if the
  // co-op AI modules that once settled it never load.
  it("settles a held debt whenever what the test reads changes", () => {
    const run = build({ hostDealCount: 3 });
    coopPublish.publish("gwo_reroll_pending_tech");
    coopPublish.publish("gwo_coop_ai_add");
    assert.equal(computeds.length, 1, "one watcher for the scene");

    run.options.hostDealCount = 2;
    run.reads.length = 0;
    const timers = installFakeLodashTimers();
    try {
      computeds[0]();
    } finally {
      timers.restore();
    }
    assert.deepEqual(run.reads, [
      "connected",
      "records",
      "hostDealCount",
      "turnState",
      "setupBlocked",
      "aiDeciding",
      "held",
    ]);
    assert.deepEqual(run.snapshots, [], "deferred, not run in the computed");

    assert.equal(timers.delayed.length, 1);
    timers.delayed[0].fn();
    assert.deepEqual(run.snapshots, [["gwo_coop_ai_add", true]]);
  });

  // A win publishes the AI players' deal, then the star cards: one snapshot
  // carries both.
  it("keeps a debt while held, and sends one snapshot under the latest reason at release", () => {
    const run = build();
    const release = coopPublish.hold();

    assert.equal(coopPublish.publish("gwo_coop_ai_deal"), false);
    assert.equal(coopPublish.publish("gwo_star_cards"), false);
    assert.equal(coopPublish.settle(), false);
    assert.deepEqual(run.snapshots, []);

    release();
    release();
    assert.equal(coopPublish.settle(), true);
    assert.equal(coopPublish.settle(), false);
    assert.deepEqual(run.snapshots, [["gwo_star_cards", true]]);
  });

  it("keeps a debt until every hold is released", () => {
    const run = build();
    const first = coopPublish.hold();
    const second = coopPublish.hold();
    coopPublish.publish("gwo_cheat_give_card");

    first();
    assert.equal(coopPublish.settle(), false);
    second();
    assert.equal(coopPublish.settle(), true);
    assert.deepEqual(run.snapshots, [["gwo_cheat_give_card", true]]);
  });

  // A star-card refresh takes one inside cards.js's computed, which would
  // otherwise re-run, and refresh again, on every release.
  it("takes and releases a hold, and settles, without reading the count", () => {
    const run = build();
    run.reads.length = 0;
    const release = coopPublish.hold();
    coopPublish.publish("gwo_coop_ai_deal");
    release();
    coopPublish.settle();

    assert.equal(run.reads.includes("held"), false);
  });

  it("sends nothing at release with no debt", () => {
    const run = build();
    coopPublish.hold()();

    assert.equal(coopPublish.settle(), false);
    assert.deepEqual(run.snapshots, []);
  });

  it("still drops a held debt once no viewer is left to tell", () => {
    const run = build();
    const release = coopPublish.hold();
    coopPublish.publish("gwo_coop_ai_deal");

    run.options.connected = [HOST];
    assert.equal(coopPublish.settle(), false);
    run.options.connected = [HOST, ALICE];
    release();
    assert.equal(coopPublish.settle(), false);
    assert.deepEqual(run.snapshots, []);
  });

  it("holds under shared tech too", () => {
    const run = build({ perPlayerTech: false });
    const release = coopPublish.hold();

    assert.equal(coopPublish.publish("gwo_coop_ai_deal"), false);
    release();
    assert.equal(coopPublish.settle(), true);
    assert.deepEqual(run.snapshots, [["gwo_coop_ai_deal", true]]);
  });

  // The rerolling viewer waits with its offer hidden.
  it("publishes a reroll at once while held", () => {
    const run = build();
    const release = coopPublish.hold();

    try {
      assert.equal(coopPublish.publish("gwo_reroll_pending_tech", ALICE), true);
      assert.deepEqual(run.snapshots, [["gwo_reroll_pending_tech", true]]);
    } finally {
      release();
    }
  });
});
