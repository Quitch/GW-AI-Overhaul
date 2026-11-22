"use strict";

// shared/war_store.js: committed, the read-back that resolves once a new
// war's game and systems records have committed, and settled, which only
// waits for the commit. The fake indexedDB hands the
// test each request and the transaction, so it settles them in any order.
// See galaxy.md, "Saving the new war".

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

const warStore = loadCouiModule(MOD_ROOT + "/shared/war_store.js");

const stubs = createGlobalStubs();
let timers;

beforeEach(() => {
  installFakeJQuery(stubs, { sync: true });
  timers = installFakeLodashTimers();
});

afterEach(() => {
  timers.restore();
  stubs.restoreGlobals();
});

const settle = () => new Promise((resolve) => setImmediate(resolve));

function fakeIndexedDB(records, options) {
  const opts = options || {};
  const fake = { opens: [], transactions: [], gets: [], closed: 0 };
  fake.db = {
    close: () => {
      fake.closed += 1;
    },
    transaction: (stores, mode) => {
      fake.transactions.push({ stores, mode });
      if (opts.transactionThrows) {
        throw opts.transactionThrows;
      }
      fake.transaction = {
        error: null,
        objectStore: (store) => ({
          get: (id) => {
            fake.gets.push({ store, id });
            return { result: records[store] };
          },
        }),
      };
      return fake.transaction;
    },
  };
  fake.open = function (...args) {
    fake.opens.push(args);
    if (opts.openThrows) {
      throw opts.openThrows;
    }
    fake.request = {};
    return fake.request;
  };
  stubs.setGlobal("indexedDB", fake);
  return fake;
}

// Runs the deferred read, opens the database, and returns the outcome once the
// transaction ends with `end` ("oncomplete" or "onabort").
async function readBack(fake, id, end) {
  const outcome = { settled: false };
  warStore.committed(id).then(
    () => {
      outcome.settled = "resolved";
    },
    (error) => {
      outcome.settled = "rejected";
      outcome.error = error;
    }
  );
  timers.delayed.shift().fn();
  fake.request.result = fake.db;
  fake.request.onsuccess();
  if (end) {
    fake.transaction[end]();
  }
  await settle();
  return outcome;
}

const BOTH = { games: { id: "7" }, systems: { id: "7" } };

describe("committed", () => {
  it("opens nothing until the deferred step runs", async () => {
    const fake = fakeIndexedDB(BOTH);

    warStore.committed("7");
    await settle();

    assert.equal(fake.opens.length, 0);
    assert.equal(timers.delayed.length, 1);
    assert.equal(timers.delayed[0].wait, 1);
  });

  it("opens gw_manifest without a version", async () => {
    const fake = fakeIndexedDB(BOTH);

    await readBack(fake, "7", "oncomplete");

    assert.deepEqual(fake.opens, [["gw_manifest"]]);
  });

  it("reads the war's game and systems records in one read/write transaction over the stores stock writes", async () => {
    const fake = fakeIndexedDB(BOTH);

    await readBack(fake, "7", "oncomplete");

    assert.deepEqual(fake.transactions, [
      { stores: ["systems", "games", "manifest"], mode: "readwrite" },
    ]);
    assert.deepEqual(fake.gets, [
      { store: "games", id: "7" },
      { store: "systems", id: "7" },
    ]);
  });

  it("waits for the transaction to complete", async () => {
    const fake = fakeIndexedDB(BOTH);

    const outcome = await readBack(fake, "7");

    assert.equal(outcome.settled, false);
    assert.equal(fake.closed, 0);
  });

  it("resolves and closes the database when both records are there", async () => {
    const fake = fakeIndexedDB(BOTH);

    const outcome = await readBack(fake, "7", "oncomplete");

    assert.equal(outcome.settled, "resolved");
    assert.equal(fake.closed, 1);
  });

  it("rejects, marked incomplete, when the systems record is missing", async () => {
    const fake = fakeIndexedDB({ games: { id: "7" } });

    const outcome = await readBack(fake, "7", "oncomplete");

    assert.equal(outcome.settled, "rejected");
    assert.equal(outcome.error.gwoIncomplete, true);
    assert.equal(
      outcome.error.message,
      "War 7 was not stored: no systems record"
    );
    assert.equal(fake.closed, 1);
  });

  it("rejects, marked incomplete, when the game record is missing", async () => {
    const fake = fakeIndexedDB({ systems: { id: "7" } });

    const outcome = await readBack(fake, "7", "oncomplete");

    assert.equal(outcome.error.gwoIncomplete, true);
    assert.equal(
      outcome.error.message,
      "War 7 was not stored: no games record"
    );
  });

  it("names both stores when neither record is there", async () => {
    const fake = fakeIndexedDB({});

    const outcome = await readBack(fake, "7", "oncomplete");

    assert.equal(
      outcome.error.message,
      "War 7 was not stored: no games or systems record"
    );
  });

  it("rejects with the transaction's error, unmarked, when the read aborts", async () => {
    const fake = fakeIndexedDB(BOTH);
    const aborted = new Error("aborted");

    const outcome = { settled: false };
    warStore.committed("7").then(null, (error) => {
      outcome.error = error;
    });
    timers.delayed.shift().fn();
    fake.request.result = fake.db;
    fake.request.onsuccess();
    fake.transaction.error = aborted;
    fake.transaction.onabort();
    await settle();

    assert.equal(outcome.error, aborted);
    assert.equal(outcome.error.gwoIncomplete, undefined);
    assert.equal(fake.closed, 1);
  });

  it("rejects and closes the database when a store is missing", async () => {
    const missingStore = new Error("NotFoundError");
    const fake = fakeIndexedDB(BOTH, { transactionThrows: missingStore });

    const outcome = await readBack(fake, "7");

    assert.equal(outcome.settled, "rejected");
    assert.equal(outcome.error, missingStore);
    assert.equal(fake.closed, 1);
  });

  it("rejects when the database does not open", async () => {
    const fake = fakeIndexedDB(BOTH);
    const failed = new Error("UnknownError");

    const outcome = { settled: false };
    warStore.committed("7").then(null, (error) => {
      outcome.error = error;
    });
    timers.delayed.shift().fn();
    fake.request.error = failed;
    fake.request.onerror();
    await settle();

    assert.equal(outcome.error, failed);
    assert.equal(fake.closed, 0);
  });

  it("rejects when opening throws", async () => {
    const blocked = new Error("SecurityError");
    fakeIndexedDB(BOTH, { openThrows: blocked });

    const outcome = { settled: false };
    warStore.committed("7").then(null, (error) => {
      outcome.error = error;
    });
    timers.delayed.shift().fn();
    await settle();

    assert.equal(outcome.error, blocked);
  });
});

describe("settled", () => {
  const run = async (fake, id, end) => {
    const outcome = { settled: false };
    warStore.settled(id).then(
      () => {
        outcome.settled = "resolved";
      },
      (error) => {
        outcome.settled = "rejected";
        outcome.error = error;
      }
    );
    timers.delayed.shift().fn();
    fake.request.result = fake.db;
    fake.request.onsuccess();
    if (end) {
      fake.transaction[end]();
    }
    await settle();
    return outcome;
  };

  it("waits for the same read/write transaction to complete", async () => {
    const fake = fakeIndexedDB(BOTH);

    const outcome = await run(fake, "7");

    assert.equal(outcome.settled, false);
    assert.deepEqual(fake.transactions, [
      { stores: ["systems", "games", "manifest"], mode: "readwrite" },
    ]);
  });

  it("resolves and closes the database when the transaction completes", async () => {
    const fake = fakeIndexedDB(BOTH);

    const outcome = await run(fake, "7", "oncomplete");

    assert.equal(outcome.settled, "resolved");
    assert.equal(fake.closed, 1);
  });

  it("resolves when the war's records are missing", async () => {
    const fake = fakeIndexedDB({});

    const outcome = await run(fake, "7", "oncomplete");

    assert.equal(outcome.settled, "resolved");
  });

  it("rejects when the transaction aborts", async () => {
    const fake = fakeIndexedDB(BOTH);
    const aborted = new Error("aborted");

    const outcome = { settled: false };
    warStore.settled("7").then(null, (error) => {
      outcome.error = error;
    });
    timers.delayed.shift().fn();
    fake.request.result = fake.db;
    fake.request.onsuccess();
    fake.transaction.error = aborted;
    fake.transaction.onabort();
    await settle();

    assert.equal(outcome.error, aborted);
  });
});
