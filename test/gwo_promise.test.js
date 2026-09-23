"use strict";

// shared/gwo_promise.js: settled, the adapter that turns an engine promise
// into one jQuery waits for, and steps, a chain that a step's synchronous
// throw rejects. See constraints.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  enginePromise,
  installFakeJQuery,
} = require("../scripts/lib/fake-jquery.js");

const gwoPromise = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js"
);

const stubs = createGlobalStubs();

// $.when settles through Promise.all, so a checkpoint waits for the queue to
// drain rather than a fixed number of ticks.
const flush = () => new Promise((resolve) => setImmediate(resolve));
let $;

beforeEach(() => {
  $ = installFakeJQuery(stubs);
});

afterEach(() => {
  stubs.restoreGlobals();
});

describe("settled", () => {
  it("resolves with what the engine promise gave", async () => {
    const engine = enginePromise();
    const waiting = gwoPromise.settled(engine);

    engine.resolve("mounted");

    assert.equal(await waiting, "mounted");
  });

  it("resolves with onFailure()'s value rather than rejecting", async () => {
    const engine = enginePromise();
    const waiting = gwoPromise.settled(engine, () => "fallback");

    engine.reject(new Error("no"));

    assert.equal(await waiting, "fallback");
  });

  it("resolves undefined when a failure has nothing to fall back on", async () => {
    const engine = enginePromise();
    const waiting = gwoPromise.settled(engine);

    engine.reject(new Error("no"));

    assert.equal(await waiting, undefined);
  });

  // The point of the module: $.when identifies a promise by a `promise`
  // method, which an engine promise has not got, so it never waits for one.
  it("hands back a promise $.when waits for, where the engine promise is not", async () => {
    const engine = enginePromise();
    const waited = [];

    $.when(engine).always(() => waited.push("engine"));
    $.when(gwoPromise.settled(engine)).always(() => waited.push("adapted"));

    await flush();
    assert.deepEqual(waited, ["engine"]);

    engine.resolve(true);
    await flush();
    assert.deepEqual(waited, ["engine", "adapted"]);
  });
});

// steps exists for jQuery 2.1.4's Deferred, so it is pinned against the fake
// that models it: callbacks run inside resolve(), a throw escapes through it,
// and the Deferred is stuck afterwards.
describe("steps under jQuery 2's Deferred", () => {
  beforeEach(() => {
    $ = installFakeJQuery(stubs, { sync: true });
  });

  it("models the trap: without steps, a throw leaves the fail handler unrun", () => {
    const start = $.Deferred();
    let failed = false;

    start
      .promise()
      .then(() => {
        throw new Error("step broke");
      })
      .then(null, () => {
        failed = true;
      });

    assert.throws(() => start.resolve(), /step broke/);
    assert.equal(failed, false);

    // And the Deferred is stuck: a consumer attached now never runs.
    let later = false;
    start.done(() => {
      later = true;
    });
    assert.equal(later, false);
  });

  it("rejects with the first step's synchronous throw and skips the rest", () => {
    const start = $.Deferred();
    const ran = [];
    let reason;

    gwoPromise
      .steps(start.promise(), [
        () => {
          throw new Error("first broke");
        },
        () => ran.push("second"),
      ])
      .then(null, (e) => {
        reason = e;
      });

    start.resolve();

    assert.deepEqual(ran, []);
    assert.equal(reason.message, "first broke");
  });

  it("rejects the same way for a step later than the first", () => {
    const start = $.Deferred();
    let reason;

    gwoPromise
      .steps(start.promise(), [
        () => "one",
        () => "two",
        () => "three",
        () => {
          throw new Error("fourth broke");
        },
      ])
      .then(null, (e) => {
        reason = e;
      });

    start.resolve();

    assert.equal(reason.message, "fourth broke");
  });

  it("hands each step the previous step's value and resolves with the last", () => {
    const start = $.Deferred();
    const seen = [];
    let result;

    gwoPromise
      .steps(start.promise(), [
        (value) => {
          seen.push(value);
          return value + 1;
        },
        (value) => {
          seen.push(value);
          return value + 1;
        },
      ])
      .done((value) => {
        result = value;
      });

    start.resolve(1);

    assert.deepEqual(seen, [1, 2]);
    assert.equal(result, 3);
  });

  it("waits for a step's promise before the next step", () => {
    const start = $.Deferred();
    const slow = $.Deferred();
    const ran = [];

    gwoPromise.steps(start.promise(), [
      () => slow.promise(),
      (value) => ran.push(value),
    ]);

    start.resolve();
    assert.deepEqual(ran, []);

    slow.resolve("slow done");
    assert.deepEqual(ran, ["slow done"]);
  });

  it("rejects when the start rejects, running no step", () => {
    const start = $.Deferred();
    const ran = [];
    let reason;

    gwoPromise
      .steps(start.promise(), [() => ran.push("step")])
      .then(null, (e) => {
        reason = e;
      });

    start.reject(new Error("no races"));

    assert.deepEqual(ran, []);
    assert.equal(reason.message, "no races");
  });
});
