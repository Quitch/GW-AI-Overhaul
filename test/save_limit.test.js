"use strict";

// gw_play/save_limit.js: the time limit on the war save, for GWO's own saves
// and, once installed, for every stock save in gw_play.js.

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  MOD_ROOT,
  REPO_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  makeDeferred,
} = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

const saves = [];
let pendingSave;
const manifest = {
  saveGame: function (game) {
    saves.push({ game: game, self: this });
    pendingSave = makeDeferred();
    return pendingSave.promise();
  },
};
const stockSave = manifest.saveGame;
registerModuleStub("shared/gw_common", { manifest: manifest });

const saveLimit = loadCouiModule(MOD_ROOT + "/gw_play/save_limit.js");
const launchHires = loadCouiModule(MOD_ROOT + "/gw_play/launch_hires.js");

const stubs = createGlobalStubs();
const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  mock.timers.enable({ apis: ["setTimeout"] });
});

afterEach(() => {
  mock.timers.reset();
  stubs.restoreGlobals();
  manifest.saveGame = stockSave;
  saves.length = 0;
  pendingSave = undefined;
});

function setup(launching, jQueryOptions, hires) {
  const calls = { launching: [], errors: [] };
  installFakeJQuery(stubs, jQueryOptions);
  stubs.setGlobal(
    "console",
    Object.assign({}, console, {
      error: (message) => calls.errors.push(message),
    })
  );
  calls.launchingFight = makeObservable(launching, {
    onChange: (value) => calls.launching.push(value),
  });
  stubs.setGlobal("model", { launchingFight: calls.launchingFight });
  // As gw_play/referee.js begins each launch: solo, or a co-op host's two.
  calls.launchingFight.subscribe((value) => {
    if (value) {
      launchHires.begin(hires || 1);
    }
  });
  return calls;
}

// Stock fight: its save, then launchingFight, then its hire, in one
// synchronous step.
function fight(calls) {
  const seen = outcome(manifest.saveGame({ id: "war" }));
  calls.launchingFight(true);
  calls.hire = $.Deferred();
  launchHires.track(calls.hire.promise());
  calls.launching.length = 0;
  return seen;
}

// lodash keeps the setTimeout it found at load, so mock.timers misses it.
const nextTask = () => new Promise((resolve) => _.defer(resolve));

function outcome(promise) {
  const seen = { state: "pending" };
  promise.then(
    (value) => {
      seen.state = "resolved";
      seen.value = value;
    },
    (reason) => {
      seen.state = "rejected";
      seen.reason = reason;
    }
  );
  return seen;
}

async function expire() {
  mock.timers.tick(29999);
  await flush();
}

describe("save", () => {
  it("resolves with stock's result once the write lands", async () => {
    setup(false);
    const war = { id: "war" };

    const result = saveLimit.save(war);
    const seen = outcome(result);

    assert.equal(typeof result.promise, "function");
    assert.equal(saves.length, 1);
    assert.equal(saves[0].game, war);
    assert.equal(saves[0].self, manifest);

    pendingSave.resolve(war);
    await flush();
    assert.equal(seen.state, "resolved");
    assert.equal(seen.value, war);
  });

  it("fails a save that has not landed after 30 s, even during a launch", async () => {
    const calls = setup(true);
    const seen = outcome(saveLimit.save({ id: "war" }));

    await expire();
    assert.equal(seen.state, "pending");

    mock.timers.tick(1);
    await flush();
    assert.equal(seen.state, "rejected");
    assert.equal(seen.reason.gwoTimedOut, true);
    assert.equal(seen.reason.message, "War save timed out after 30000ms");
    assert.deepEqual(calls.launching, []);
  });

  it("ignores a save that lands after it has failed", async () => {
    setup(false);
    const seen = outcome(saveLimit.save({ id: "war" }));
    mock.timers.tick(30000);
    await flush();

    pendingSave.resolve();
    await flush();
    assert.equal(seen.state, "rejected");
  });

  // jQuery 2.1.4 runs callbacks inside resolve(), so a caller's throw escapes
  // through it, into a native promise reaction that would swallow it.
  it("logs a throw from a caller's continuation", async () => {
    const calls = setup(false, { sync: true });
    saveLimit.save({ id: "war" }).then(() => {
      throw new Error("caller bug");
    });

    pendingSave.resolve();
    await flush();
    assert.equal(calls.errors.length, 1);
    assert.match(
      calls.errors[0],
      /^Galactic War Overhaul \(GWO\): .*caller bug/
    );
  });

  it("logs a throw from a caller's failure handler", async () => {
    const calls = setup(false, { sync: true });
    saveLimit.save({ id: "war" }).then(null, () => {
      throw new Error("caller bug");
    });

    mock.timers.tick(30000);
    await flush();
    assert.equal(calls.errors.length, 1);
    assert.match(calls.errors[0], /caller bug/);
  });
});

describe("install", () => {
  it("routes stock's saves through the limit, with stock's arguments", async () => {
    setup(false);
    saveLimit.install();
    const war = { id: "war" };

    const seen = outcome(manifest.saveGame(war));

    assert.notEqual(manifest.saveGame, stockSave);
    assert.equal(saves.length, 1);
    assert.equal(saves[0].game, war);
    assert.equal(saves[0].self, manifest);

    pendingSave.resolve(war);
    await flush();
    assert.equal(seen.value, war);
  });

  // A move, a tech delete, and a lost war each settle their own state on a
  // rejection.
  it("fails a stock save that has not landed after 30 s", async () => {
    const calls = setup(false);
    saveLimit.install();
    const seen = outcome(manifest.saveGame({ id: "war" }));

    await expire();
    assert.equal(seen.state, "pending");

    mock.timers.tick(1);
    await flush();
    assert.equal(seen.state, "rejected");
    assert.equal(seen.reason.gwoTimedOut, true);
    assert.deepEqual(calls.launching, []);
    assert.deepEqual(calls.errors, []);
  });

  // Stock fight's $.when would hand a rejection to an .always that throws.
  it("calls off a launch whose save has not landed, and leaves the save unsettled", async () => {
    const calls = setup(false);
    saveLimit.install();
    const seen = fight(calls);
    calls.hire.resolve({});

    mock.timers.tick(30000);
    await flush();
    assert.equal(seen.state, "pending");
    assert.deepEqual(calls.launching, [false]);
    assert.equal(calls.errors.length, 1);
    assert.match(calls.errors[0], /War save timed out after 30000ms/);

    pendingSave.resolve();
    await flush();
    assert.equal(seen.state, "pending");
  });

  // Issue #626: a second Fight would hire while the first launch's hire runs.
  it("holds the call-off until the launch's hire has settled", async () => {
    const calls = setup(false);
    saveLimit.install();
    fight(calls);

    mock.timers.tick(30000);
    await flush();
    assert.deepEqual(calls.launching, []);
    assert.equal(calls.launchingFight(), true);
    assert.equal(calls.errors.length, 1);

    calls.hire.resolve({});
    await flush();
    assert.deepEqual(calls.launching, [false]);
  });

  // GWO's referee clears launchingFight itself when a hire fails, and a new
  // Fight may follow before the failure reaches the call-off.
  it("leaves a launch the failed hire already ended alone", async () => {
    const calls = setup(false);
    saveLimit.install();
    fight(calls);
    const failed = calls.hire;
    mock.timers.tick(30000);
    await flush();

    calls.launchingFight(false);
    calls.launching.length = 0;
    await nextTask();
    fight(calls);
    failed.reject(new Error("hire failed"));
    await flush();
    assert.deepEqual(calls.launching, []);
    assert.equal(calls.launchingFight(), true);
  });

  // Issue #629: stock restores the client mods after a co-op host's failed
  // first hire, and a timed-out save leaves the clear to the call-off.
  it("holds a co-op host's call-off until stock's restore remount ends", async () => {
    const calls = setup(false, { sync: true }, 2);
    const busy2 = makeObservable(false);
    stubs.setGlobal("window", { CommunityModsManager: { busy2: busy2 } });
    saveLimit.install();
    fight(calls);
    mock.timers.tick(30000);
    await flush();

    // Stock's restore, chained on the hire after GWO's handlers.
    calls.hire.then(null, () => busy2(true));
    calls.hire.reject(new Error("hire failed"));
    await nextTask();
    await flush();
    assert.deepEqual(calls.launching, []);
    assert.equal(calls.launchingFight(), true);

    busy2(false);
    await flush();
    assert.deepEqual(calls.launching, [false]);
  });

  it("logs a throw from the call-off", async () => {
    const calls = setup(false);
    saveLimit.install();
    fight(calls);
    calls.launchingFight.subscribe((value) => {
      if (!value) {
        throw new Error("subscriber bug");
      }
    });

    mock.timers.tick(30000);
    await flush();
    calls.hire.resolve({});
    await flush();
    assert.equal(calls.errors.length, 2);
    assert.match(calls.errors[1], /subscriber bug/);
  });

  it("does not call off a launch when the save lands in time", async () => {
    const calls = setup(false);
    saveLimit.install();
    const seen = fight(calls);

    pendingSave.resolve();
    await flush();
    mock.timers.tick(30000);
    await flush();
    assert.equal(seen.state, "resolved");
    assert.deepEqual(calls.launching, []);
  });

  // A move's save, say, still writing when Fight is pressed.
  it("fails another save that times out during a launch, and leaves the launch alone", async () => {
    const calls = setup(false);
    saveLimit.install();
    const earlier = outcome(manifest.saveGame({ id: "move" }));
    await nextTask();
    mock.timers.tick(5000);
    const launch = fight(calls);
    const launchSave = pendingSave;

    mock.timers.tick(25000);
    await flush();
    assert.equal(earlier.state, "rejected");
    assert.equal(earlier.reason.gwoTimedOut, true);
    assert.deepEqual(calls.launching, []);
    assert.equal(calls.launchingFight(), true);

    launchSave.resolve();
    await flush();
    assert.equal(launch.state, "resolved");
  });

  it("leaves a later launch alone when an earlier launch's save times out", async () => {
    const calls = setup(false);
    saveLimit.install();
    const first = fight(calls);
    calls.launchingFight(false);
    await nextTask();
    mock.timers.tick(10000);
    fight(calls);

    mock.timers.tick(20000);
    await flush();
    assert.equal(first.state, "pending");
    assert.deepEqual(calls.launching, []);
    assert.equal(calls.launchingFight(), true);
    assert.equal(calls.errors.length, 1);
  });

  // The cheat path saves and returns without launching.
  it("fails a save that no launch followed in the same step", async () => {
    const calls = setup(false);
    saveLimit.install();
    const seen = outcome(manifest.saveGame({ id: "war" }));
    await nextTask();
    calls.launchingFight(true);
    calls.launching.length = 0;

    mock.timers.tick(30000);
    await flush();
    assert.equal(seen.state, "rejected");
    assert.deepEqual(calls.launching, []);
  });
});

// The scene script is not an AMD module, so its wiring is pinned by source.
describe("the save limit's install", () => {
  const script =
    "ui/mods/com.pa.quitch.gwaioverhaul/gw_play/save_limit_install.js";

  it("is a gw_play scene script", () => {
    const modinfo = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "modinfo.json"), "utf8")
    );
    assert.ok(modinfo.scenes.gw_play.includes("coui://" + script));
  });

  it("installs the limit, with an errback", () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, script), "utf8");
    assert.match(source, /gw_play\/save_limit\.js"/);
    assert.match(source, /saveLimit\.install\(\);/);
    assert.match(source, /function \(err\) \{/);
  });
});
