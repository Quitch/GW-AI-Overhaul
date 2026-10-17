"use strict";

// gw_play/save_debt.js: the host's war save, owed while a deal, a star-card
// refresh, or a co-op AI pass holds it, so one win writes the war once. See
// coop.md, "One save per win".
//
// The module holds one debt and one hold count for the scene, so every test
// releases what it holds and runs the write it owes.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  MOD_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  makeDeferred,
} = require("../scripts/lib/fake-jquery.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

const writes = [];
registerModuleStub(MOD_ROOT + "/gw_play/save.js", (game, withStars) => {
  const deferred = makeDeferred();
  writes.push({ game, withStars, deferred });
  return deferred.promise();
});

const saveDebt = loadCouiModule(MOD_ROOT + "/gw_play/save_debt.js");

const stubs = createGlobalStubs();
let timers;
let errors;
const realError = console.error;

function setup() {
  installFakeJQuery(stubs);
  timers = installFakeLodashTimers();
  errors = [];
  console.error = (message) => errors.push(message);
}

afterEach(() => {
  timers.restore();
  stubs.restoreGlobals();
  console.error = realError;
  writes.length = 0;
});

function runDeferred() {
  const due = timers.delayed.splice(0);
  due.forEach((entry) => entry.fn());
}

function settled(promise) {
  const state = { value: "pending" };
  promise.then(
    () => {
      state.value = "resolved";
    },
    (reason) => {
      state.value = "rejected: " + reason;
    }
  );
  return state;
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe("save_debt", () => {
  it("writes at once with nothing held", async () => {
    setup();

    const result = saveDebt.owe("war", true);

    assert.equal(writes.length, 1);
    assert.deepEqual([writes[0].game, writes[0].withStars], ["war", true]);
    assert.equal(typeof result.promise, "function", "a jQuery promise");
    const state = settled(result);
    writes[0].deferred.resolve();
    await tick();
    assert.equal(state.value, "resolved");
    assert.equal(timers.delayed.length, 0);
  });

  it("owes the write while held, and writes once a tick after the release", async () => {
    setup();
    const release = saveDebt.hold();

    const state = settled(saveDebt.owe("war", false));
    assert.equal(writes.length, 0);

    release();
    assert.equal(writes.length, 0, "not in the releasing tick");
    runDeferred();
    assert.equal(writes.length, 1);
    assert.equal(state.value, "pending", "until the write lands");

    writes[0].deferred.resolve();
    await tick();
    assert.equal(state.value, "resolved");
  });

  it("joins every caller to one write, which saves the stars if any asked", async () => {
    setup();
    const release = saveDebt.hold();

    const first = settled(saveDebt.owe("old", false));
    const second = settled(saveDebt.owe("war", true));
    const third = settled(saveDebt.owe("war", false));
    release();
    runDeferred();

    assert.equal(writes.length, 1);
    assert.deepEqual([writes[0].game, writes[0].withStars], ["war", true]);
    writes[0].deferred.resolve();
    await tick();
    assert.deepEqual(
      [first.value, second.value, third.value],
      ["resolved", "resolved", "resolved"]
    );
  });

  it("joins a debt waiting on its tick, with nothing held", () => {
    setup();
    saveDebt.hold()();
    // Nothing was owed, so the release left nothing to write.
    assert.equal(timers.delayed.length, 0);

    const release = saveDebt.hold();
    saveDebt.owe("war", false);
    release();
    saveDebt.owe("war", false);

    assert.equal(writes.length, 0);
    runDeferred();
    assert.equal(writes.length, 1);
    writes[0].deferred.resolve();
  });

  it("keeps the debt while any hold is left", () => {
    setup();
    const first = saveDebt.hold();
    const second = saveDebt.hold();
    saveDebt.owe("war", false);

    first();
    first();
    assert.equal(timers.delayed.length, 0, "a release is honoured once");
    second();
    runDeferred();
    assert.equal(writes.length, 1);
    writes[0].deferred.resolve();
  });

  // A pass's end starts the star-card refresh, which holds as the pass lets go.
  it("keeps the debt owed when a hold is taken before the deferred write", () => {
    setup();
    const pass = saveDebt.hold();
    saveDebt.owe("war", false);

    pass();
    const refresh = saveDebt.hold();
    runDeferred();
    assert.equal(writes.length, 0);

    refresh();
    runDeferred();
    assert.equal(writes.length, 1);
    writes[0].deferred.resolve();
  });

  it("rejects every caller when the write fails, and logs it once", async () => {
    setup();
    const release = saveDebt.hold();
    const first = settled(saveDebt.owe("war", false));
    const second = settled(saveDebt.owe("war", false));
    release();
    runDeferred();

    writes[0].deferred.reject("disk full");
    await tick();
    assert.deepEqual(
      [first.value, second.value],
      ["rejected: disk full", "rejected: disk full"]
    );
    assert.deepEqual(errors, ["GWO failed to save the war: disk full"]);
  });

  it("logs a failed write made at once", async () => {
    setup();
    const state = settled(saveDebt.owe("war", false));

    writes[0].deferred.reject("disk full");
    await tick();
    assert.equal(state.value, "rejected: disk full");
    assert.deepEqual(errors, ["GWO failed to save the war: disk full"]);
  });

  it("writes at once again after a debt is paid", () => {
    setup();
    const release = saveDebt.hold();
    saveDebt.owe("war", false);
    release();
    runDeferred();
    writes[0].deferred.resolve();

    saveDebt.owe("war", false);
    assert.equal(writes.length, 2);
    writes[1].deferred.resolve();
  });
});
