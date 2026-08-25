"use strict";

// gw_play/coop_host.js: the reply, lookup and write-back every host-side co-op
// operator handler shares.

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const coopHost = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_host.js"
);

const operator = { client_id: "abc", client_name: "Alice", request_id: "r1" };

const stubs = createGlobalStubs();

afterEach(() => {
  stubs.restoreGlobals();
  mock.restoreAll();
});

describe("coop_host.reply", () => {
  it("addresses the reply to the asking client and names it in the payload", () => {
    const sent = [];
    stubs.setGlobal("model", {
      sendCampaignHostOperator: (type, payload, meta) =>
        sent.push([type, payload, meta]),
    });

    coopHost.reply("gwo_result", operator, { changed: true });

    assert.deepEqual(sent, [
      [
        "gwo_result",
        { client_id: "abc", client_name: "Alice", changed: true },
        { target_client_id: "abc", request_id: "r1" },
      ],
    ]);
  });

  it("is a no-op when the model cannot send host operators", () => {
    stubs.setGlobal("model", {});
    coopHost.reply("gwo_result", operator, {});
  });
});

describe("coop_host.fail", () => {
  it("logs the failure and replies with the reason", () => {
    const sent = [];
    stubs.setGlobal("model", {
      sendCampaignHostOperator: (type, payload) => sent.push([type, payload]),
    });
    const errors = mock.method(console, "error", () => {});

    coopHost.fail("gwo_result", operator, "reroll", "no rerolls remain");

    assert.equal(
      errors.mock.calls[0].arguments[0],
      "[GW COOP] failed to reroll: no rerolls remain"
    );
    assert.deepEqual(sent, [
      [
        "gwo_result",
        { client_id: "abc", client_name: "Alice", error: "no rerolls remain" },
      ],
    ]);
  });

  it("logs but cannot reply to an operator with no client id", () => {
    const sent = [];
    stubs.setGlobal("model", {
      sendCampaignHostOperator: (type, payload) => sent.push([type, payload]),
    });
    mock.method(console, "error", () => {});

    coopHost.fail("gwo_result", { client_name: "Alice" }, "reroll", "why");

    assert.deepEqual(sent, []);
  });
});

describe("coop_host.recordFor", () => {
  it("looks the record up by the operator's client id and name", () => {
    const queries = [];
    const game = {
      findCoopPlayerInventoryData: (query) => {
        queries.push(query);
        return { id: "abc" };
      },
    };

    assert.deepEqual(coopHost.recordFor(game, operator), { id: "abc" });
    assert.deepEqual(queries, [{ id: "abc", name: "Alice" }]);
  });
});

describe("coop_host.upsertRecord", () => {
  it("stores a stamped copy with the patch applied and returns it", () => {
    const stored = [];
    const game = {
      upsertCoopPlayerInventoryData: (next) => {
        stored.push(next);
        return true;
      },
    };
    const record = { id: "abc", inventory: { cards: [] } };

    const next = coopHost.upsertRecord(game, record, { pendingTechCards: 1 });

    assert.equal(stored[0], next);
    assert.equal(next.pendingTechCards, 1);
    assert.equal(typeof next.updatedAt, "number");
    assert.notEqual(next.inventory, record.inventory);
    assert.equal(record.pendingTechCards, undefined);
  });

  it("lets the patch supply the timestamp", () => {
    const game = { upsertCoopPlayerInventoryData: () => true };
    const next = coopHost.upsertRecord(game, { id: "abc" }, { updatedAt: 7 });
    assert.equal(next.updatedAt, 7);
  });

  it("returns undefined when the store refuses the record", () => {
    const game = { upsertCoopPlayerInventoryData: () => false };
    assert.equal(coopHost.upsertRecord(game, { id: "abc" }, {}), undefined);
  });
});
