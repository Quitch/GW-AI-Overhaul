"use strict";

// gw_play/launch_hires.js: when the referee hires of the launch in progress
// have settled, which a save time-out's call-off waits for (issue #626).

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

  // A failed first hire is the end of a co-op host's launch: stock hires no
  // second referee.
  it("settles when a hire fails", () => {
    installFakeJQuery(stubs, { sync: true });
    launchHires.begin(2);
    const seen = outcome(launchHires.settled());

    const first = $.Deferred();
    launchHires.track(first.promise());
    first.reject(new Error("hire failed"));
    assert.equal(seen.state, "settled");
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
