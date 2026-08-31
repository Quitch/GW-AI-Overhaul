"use strict";

// shared/gwo_promise.js: the adapter that turns an engine promise into one
// jQuery waits for. See constraints.md.

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
