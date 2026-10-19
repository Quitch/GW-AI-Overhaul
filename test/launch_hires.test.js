"use strict";

// gw_play/launch_hires.js: when the referee hires of the launch in progress
// have settled, which a save time-out's call-off waits for (issues #626 and
// #629).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const {
  MOD_ROOT,
  couiToFsPath,
  loadCouiModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

const LAUNCH_HIRES = MOD_ROOT + "/gw_play/launch_hires.js";
const launchHires = loadCouiModule(LAUNCH_HIRES);

// A copy no test has begun a launch on: the loaded module keeps its launch.
function freshLaunchHires() {
  let factory;
  new Function("define", fs.readFileSync(couiToFsPath(LAUNCH_HIRES), "utf8"))(
    (fn) => {
      factory = fn;
    }
  );
  return factory();
}

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// lodash keeps the setTimeout it found at load.
const nextTask = () => new Promise((resolve) => _.defer(resolve));

function outcome(promise) {
  const seen = { state: "pending" };
  promise.then(() => {
    seen.state = "settled";
  });
  return seen;
}

describe("launch hires", () => {
  // Without GWO's referee no launch is begun, and nothing is held.
  it("is settled before any launch is begun", () => {
    installFakeJQuery(stubs, { sync: true });

    assert.equal(outcome(freshLaunchHires().settled()).state, "settled");
  });

  it("is not settled while a launch has started no hire", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(1);

    assert.equal(outcome(launchHires.settled()).state, "pending");
  });

  it("settles when a launch's one hire resolves", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(1);
    const hire = $.Deferred();
    launchHires.track(hire.promise());
    const seen = outcome(launchHires.settled());

    assert.equal(seen.state, "pending");
    hire.resolve({});
    assert.equal(seen.state, "settled");
  });

  // Stock remounts the client mods between a co-op host's two hires.
  it("holds a co-op host's launch between its two hires", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    first.resolve({});
    assert.equal(seen.state, "pending");

    const second = $.Deferred();
    launchHires.track(second.promise());
    second.resolve({});
    assert.equal(seen.state, "settled");
  });

  it("waits for another mod's hire running beside the launch's", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(1);
    const seen = outcome(launchHires.settled());

    const other = $.Deferred();
    launchHires.track(other.promise());
    const stock = $.Deferred();
    launchHires.track(stock.promise());
    stock.resolve({});
    assert.equal(seen.state, "pending");

    other.resolve({});
    assert.equal(seen.state, "settled");
  });

  it("settles when a solo launch's hire fails", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(1);
    const seen = outcome(launchHires.settled());

    const hire = $.Deferred();
    launchHires.track(hire.promise());
    hire.reject(new Error("hire failed"));
    assert.equal(seen.state, "settled");
  });

  it("settles when a co-op host's second hire fails", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    first.resolve({});
    const second = $.Deferred();
    launchHires.track(second.promise());
    second.reject(new Error("hire failed"));
    assert.equal(seen.state, "settled");
  });

  // Stock hires no second referee, but restores the client mods first, and
  // starts that remount after the failed hire's handlers have run.
  it("holds a co-op host's failed first hire until stock's restore remount ends", async () => {
    installFakeJQuery(stubs, { sync: true });
    const busy2 = makeObservable(false);
    stubs.setGlobal("window", { CommunityModsManager: { busy2: busy2 } });
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    // Stock's restore, chained on the hire after GWO's handlers.
    first.then(null, () => busy2(true));
    first.reject(new Error("hire failed"));
    await nextTask();
    assert.equal(seen.state, "pending");

    busy2(false);
    assert.equal(seen.state, "settled");
  });

  // busy2 starts true, and stock's restriction remount before the hire sets
  // it false; without that remount, no restore follows either.
  it("settles a co-op host's failed first hire when busy2 was still true at the failure", async () => {
    installFakeJQuery(stubs, { sync: true });
    stubs.setGlobal("window", {
      CommunityModsManager: { busy2: makeObservable(true) },
    });
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    first.reject(new Error("hire failed"));
    await nextTask();
    assert.equal(seen.state, "settled");
  });

  it("settles a co-op host's failed first hire when busy2 stays false", async () => {
    installFakeJQuery(stubs, { sync: true });
    stubs.setGlobal("window", {
      CommunityModsManager: { busy2: makeObservable(false) },
    });
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    first.reject(new Error("hire failed"));
    await nextTask();
    assert.equal(seen.state, "settled");
  });

  it("settles a co-op host's failed first hire when no remount follows it", async () => {
    installFakeJQuery(stubs, { sync: true });
    stubs.setGlobal("window", {});
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    first.reject(new Error("hire failed"));
    assert.equal(seen.state, "pending");

    await nextTask();
    assert.equal(seen.state, "settled");
  });

  it("names a co-op host's first hire as the one stock restores after", () => {
    installFakeJQuery(stubs, { sync: true });
    assert.equal(freshLaunchHires().restoresAfterNext(), false);

    launchHires.begin(1);
    assert.equal(launchHires.restoresAfterNext(), false);

    launchHires.begin(2);
    assert.equal(launchHires.restoresAfterNext(), true);
    launchHires.track($.Deferred().promise());
    assert.equal(launchHires.restoresAfterNext(), false);
  });

  it("counts a hire against the launch it started in", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(1);
    const earlier = $.Deferred();
    launchHires.track(earlier.promise());
    launchHires.begin(1);
    const seen = outcome(launchHires.settled());

    earlier.resolve({});
    assert.equal(seen.state, "pending");

    const hire = $.Deferred();
    launchHires.track(hire.promise());
    hire.resolve({});
    assert.equal(seen.state, "settled");
  });
});
