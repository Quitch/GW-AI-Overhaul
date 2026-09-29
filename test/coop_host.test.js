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

  // An AI's record late in a war: some 2000 mods, star cards, and a hand.
  const lateWarRecord = () => ({
    playerId: "gwo_ai_1",
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
    updatedAt: 1,
    techCardDealCount: 7,
    gwaioAi: { serial: 1, name: "Sorian", personality: "absurd", race: "mla" },
    inventory: {
      units: ["/pa/units/land/tank_light_laser/tank_light_laser.json"],
      aiMods: [{ type: "fabber", op: "append", toBuild: "Dox", value: 2 }],
      mods: _.times(2000, (i) => ({
        file: "/pa/units/u" + (i % 97) + ".json",
        path: "weapons.0.damage",
        op: "multiply",
        value: 1 + (i % 7) / 10,
      })),
      maxCards: 9,
      cards: [
        { id: "gwc_start_bot" },
        { id: "gwc_minion", minion: { name: "Alpha" }, unique: 1.25 },
      ],
      minions: [{ name: "Alpha" }],
      tags: { global: { playerFaction: 0, playerRace: "mla" } },
    },
    gwaioStarCards: { turn: 12, cards: { 3: { id: "gwc_damage_air" } } },
    pendingTechCards: {
      star: 3,
      cards: [{ id: "gwc_damage_air" }],
      dealIndex: 8,
      cardsOffered: 3,
      updatedAt: 2,
    },
  });
  const accepting = { upsertCoopPlayerInventoryData: () => true };

  it("stores what a deep copy would, sharing nothing with the record", () => {
    const record = lateWarRecord();
    const patch = { updatedAt: 9, techCardDealCount: 8 };
    const next = coopHost.upsertRecord(accepting, record, patch);

    assert.deepEqual(next, _.assign({}, _.cloneDeep(record), patch));
    next.inventory.mods[0].value = 99;
    next.gwaioStarCards.cards[3].id = "gwc_damage_bots";
    assert.deepEqual(record, lateWarRecord());
  });

  // Stock writes a record's inventory as inventory.save(), which carries
  // GWInventory's methods.
  it("stores plain data, leaving a saved inventory's methods behind", () => {
    const record = lateWarRecord();
    record.inventory.getTag = function () {};
    record.inventory.load = function () {};
    const next = coopHost.upsertRecord(accepting, record, { updatedAt: 9 });

    assert.deepEqual(next, _.assign(lateWarRecord(), { updatedAt: 9 }));
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
