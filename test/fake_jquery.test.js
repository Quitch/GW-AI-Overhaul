"use strict";

// scripts/lib/fake-jquery.js: the default fake's .then refuses what jQuery 2
// would not wait for, and its $.when calls back as jQuery 2's does.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  createFakeJQuery,
  enginePromise,
  makeDeferred,
  rejected,
  resolved,
  when,
} = require("../scripts/lib/fake-jquery.js");

const FAKE = path.join(__dirname, "..", "scripts", "lib", "fake-jquery.js");
const TRAP = /a \.then callback returned a thenable with no promise\(\) method/;

// The fake reports the trap out of band as well, and that fails whichever test
// is running, so a chain that springs it runs in a process of its own. With
// `record`, the process logs both reports instead of dying of the second one.
function runChain(chain, record) {
  const prelude = record
    ? "const seen = [];" +
      "process.on('uncaughtException', (e) => seen.push('uncaught: ' + e.message));" +
      "process.on('exit', () => require('node:fs').writeSync(1, JSON.stringify(seen)));"
    : "";
  return spawnSync(
    process.execPath,
    [
      "-e",
      "const fake = require(" + JSON.stringify(FAKE) + ");" + prelude + chain,
    ],
    { encoding: "utf8" }
  );
}

function argsOf(promise, method) {
  return new Promise((resolve) => {
    promise[method || "then"]((...args) => resolve(args));
  });
}

describe("fake-jquery .then", () => {
  it("fails on an engine promise a callback returns, even when a .fail() swallows the rejection", () => {
    const run = runChain(
      "fake.resolved(1).then(() => fake.enginePromise()).fail(() => {});"
    );
    assert.notEqual(run.status, 0);
    assert.match(run.stderr, TRAP);
  });

  it("rejects the chain rather than wait, for a done callback, a fail callback and $.when's", () => {
    for (const chain of [
      "fake.resolved(1).then(() => Promise.resolve(2))",
      "fake.rejected(1).then(undefined, () => fake.enginePromise())",
      "fake.when(1, 2).then(() => fake.enginePromise())",
    ]) {
      const run = runChain(
        chain + ".fail((e) => seen.push('rejected: ' + e.message));",
        true
      );
      const seen = JSON.parse(run.stdout);
      assert.equal(seen.length, 2, chain);
      assert.ok(
        seen.some((line) => line.startsWith("rejected: ") && TRAP.test(line)),
        chain
      );
      assert.ok(
        seen.some((line) => line.startsWith("uncaught: ") && TRAP.test(line)),
        chain
      );
    }
  });

  it("waits for a jQuery promise a callback returns", async () => {
    const later = makeDeferred();
    const chained = resolved(1).then(() => later.promise());
    later.resolve(2);
    assert.equal(await chained, 2);
  });

  it("waits for $.getJSON's result a callback returns, as it has promise()", async () => {
    const $ = createFakeJQuery({ getJSON: (url) => ({ from: url }) });
    assert.deepEqual(await resolved(1).then(() => $.getJSON("x.json")), {
      from: "x.json",
    });
  });

  // jQuery ignores what these callbacks return.
  it("does not test what a done, fail or always callback returns", async () => {
    const ran = [];
    resolved(1).done(() => ran.push("done") && enginePromise());
    rejected(1).fail(() => ran.push("fail") && enginePromise());
    when(1, 2).always(() => ran.push("always") && enginePromise());
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(ran.sort(), ["always", "done", "fail"]);
  });
});

describe("fake-jquery when", () => {
  it("calls back with each argument's value as an argument of its own", async () => {
    assert.deepEqual(await argsOf(when(resolved("a"), "b")), ["a", "b"]);
    assert.deepEqual(await argsOf(when("a", resolved("b")), "done"), [
      "a",
      "b",
    ]);
    assert.deepEqual(await argsOf(when("a", "b"), "always"), ["a", "b"]);
  });

  it("passes on an argument settled with several values as an array", async () => {
    assert.deepEqual(await argsOf(when("z", when(resolved("a"), "b"))), [
      "z",
      ["a", "b"],
    ]);
    assert.deepEqual(await argsOf(when(when(resolved("a"), "b"))), ["a", "b"]);
  });

  it("calls back with one argument as itself, an array included", async () => {
    assert.deepEqual(await argsOf(when(resolved(["a", "b"]))), [["a", "b"]]);
  });

  it("calls back with no arguments when given none", async () => {
    assert.deepEqual(await argsOf(when()), []);
  });
});

describe("fake-jquery sync when", () => {
  const $ = createFakeJQuery({ sync: true });

  it("calls back inline with each argument's value as an argument of its own", () => {
    let args;
    $.when($.Deferred().resolve("a").promise(), "b").then((...got) => {
      args = got;
    });
    assert.deepEqual(args, ["a", "b"]);
  });

  it("calls back inside the resolve() of the last pending argument", () => {
    const pending = $.Deferred();
    let args;
    $.when("a", pending.promise()).done((...got) => {
      args = got;
    });
    assert.equal(args, undefined);
    pending.resolve("b", "c");
    assert.deepEqual(args, ["a", ["b", "c"]]);
  });

  it("rejects with the reason of an argument that rejects", () => {
    const failing = $.Deferred();
    let reason;
    $.when("a", failing.promise()).fail((why) => {
      reason = why;
    });
    failing.reject("no");
    assert.equal(reason, "no");
  });
});
