"use strict";

// gw_play/coop_ping_marker.js, both halves: pulseFrame, the pure frame maths,
// and the CreateJS layer built on it - what it attaches to a star, how it
// takes itself back off, and the two ways it can be told the map is not
// ticking. The layer tests assert the ring is wired to pulseFrame's output;
// the values it should be wired to are the "marker pulse" describe at the end.

const {
  describe,
  it,
  before,
  after,
  beforeEach,
  afterEach,
} = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

const { createLayer, pulseFrame } = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ping_marker.js"
);

const PULSE_MS = 900;
const LIFETIME_MS = 2700;
const BACKSTOP_MS = LIFETIME_MS + 2000;

function displayObject(target) {
  target.children = [];
  target.listeners = [];
  target.addChild = function (child) {
    child.parent = target;
    target.children.push(child);
  };
  target.removeChild = function (child) {
    target.children = target.children.filter((held) => held !== child);
    child.parent = undefined;
  };
  target.addEventListener = function (type, fn) {
    target.listeners.push([type, fn]);
  };
  target.removeEventListener = function (type, fn) {
    target.listeners = target.listeners.filter(
      (held) => !(held[0] === type && held[1] === fn)
    );
  };
  return target;
}

function fakeCreatejs() {
  const graphics = {};
  for (const method of ["setStrokeStyle", "beginStroke", "drawCircle"]) {
    graphics[method] = () => graphics;
  }

  return {
    Container: function () {
      displayObject(this);
    },
    Shape: function () {
      displayObject(this);
      this.graphics = graphics;
    },
    Bitmap: function (url) {
      displayObject(this);
      this.url = url;
    },
  };
}

// The marker times itself from _.now() and cleans up on a _.delay, so both are
// swapped for a clock the test drives.
let clock = 1000;
let timers;

before(() => {
  timers = installFakeLodashTimers({ now: () => clock });
});

after(() => timers.restore());

let active;

function build(overrides = {}) {
  const options = Object.assign({ hasThrottleHook: true }, overrides);

  const calls = { interactiveFrames: [] };
  const system = { systemDisplay: displayObject({}) };

  const stubs = createGlobalStubs();
  stubs.setGlobal("createjs", fakeCreatejs());
  stubs.setGlobal("model", {
    gwoRequestInteractiveFrames: options.hasThrottleHook
      ? (duration) => calls.interactiveFrames.push(duration)
      : undefined,
  });

  active = {
    calls,
    system,
    layer: createLayer({
      systemFor: (star) => (star === 0 ? system : undefined),
    }),
    restore: () => stubs.restoreGlobals(),
  };
  return active;
}

beforeEach(() => {
  clock = 1000;
  timers.delayed.length = 0;
});

afterEach(() => {
  if (active) {
    active.restore();
    active = undefined;
  }
});

const tickOf = (system) => system.systemDisplay.children[0].listeners[0][1];

describe("raising a marker", () => {
  it("hangs a marker off the star it names", () => {
    const { layer, system } = build();

    layer.raise(0);

    assert.equal(system.systemDisplay.children.length, 1);
    const marker = system.systemDisplay.children[0];
    // systems.js sorts an undefined z ahead of every number, which would put
    // the marker under the star icon.
    assert.equal(marker.z, 2);
    assert.equal(marker.mouseEnabled, false);
    assert.equal(marker.mouseChildren, false);
    assert.equal(marker.children.length, 2);
    assert.match(marker.children[1].url, /icon_si_ping\.png$/);
  });

  it("lifts the map off its idle frame rate for the marker's life", () => {
    const { layer, calls } = build();
    layer.raise(0);
    assert.deepEqual(calls.interactiveFrames, [LIFETIME_MS]);
  });

  // galaxy_map_perf.js loads after this file, and stands down entirely in a
  // tutorial.
  it("works without the frame rate hook", () => {
    const { layer, system } = build({ hasThrottleHook: false });
    layer.raise(0);
    assert.equal(system.systemDisplay.children.length, 1);
  });

  it("ignores a star the galaxy no longer has", () => {
    const { layer, system } = build();
    layer.raise(7);
    assert.equal(system.systemDisplay.children.length, 0);
    assert.equal(timers.delayed.length, 0);
  });

  // Re-pinging a live star restarts it rather than stacking a second marker.
  it("restarts the marker already on a star instead of adding another", () => {
    const { layer, system } = build();

    layer.raise(0);
    const marker = system.systemDisplay.children[0];
    clock += LIFETIME_MS - 100;
    layer.raise(0);

    assert.equal(system.systemDisplay.children.length, 1);
    assert.equal(system.systemDisplay.children[0], marker);

    clock += 200;
    tickOf(system)();
    assert.equal(system.systemDisplay.children.length, 1);
  });
});

describe("animating and removing a marker", () => {
  it("expands and fades the ring as the clock runs", () => {
    const { layer, system } = build();

    layer.raise(0);
    const ring = system.systemDisplay.children[0].children[0];

    clock += 450;
    tickOf(system)();
    const scale = ring.scaleX;
    assert.ok(scale > 0.35, String(scale));
    assert.ok(ring.alpha < 1, String(ring.alpha));

    clock += 100;
    tickOf(system)();
    assert.ok(ring.scaleX > scale);
  });

  it("takes itself off the star once the pulses are done", () => {
    const { layer, system } = build();

    layer.raise(0);
    const marker = system.systemDisplay.children[0];

    clock += LIFETIME_MS;
    tickOf(system)();

    assert.deepEqual(system.systemDisplay.children, []);
    assert.deepEqual(marker.listeners, []);
    assert.equal(marker.parent, undefined);
  });

  // Ticks stop entirely while the UI is hidden, so a marker raised just before
  // a battle launch is only cleaned up by the timer.
  it("cleans up on a timer when the map stops ticking", () => {
    const { layer, system } = build();

    layer.raise(0);

    assert.equal(timers.delayed.length, 1);
    assert.equal(timers.delayed[0].wait, BACKSTOP_MS);
    timers.delayed[0].fn();

    assert.deepEqual(system.systemDisplay.children, []);
  });

  it("pushes the timer back when the star is pinged again", () => {
    const { layer } = build();

    layer.raise(0);
    clock += 1000;
    layer.raise(0);

    assert.equal(timers.delayed.length, 2);
  });

  it("removes a marker once however often it is asked", () => {
    const { layer, system } = build();

    layer.raise(0);
    layer.remove(0);
    layer.remove(0);
    layer.remove(7);

    assert.deepEqual(system.systemDisplay.children, []);
  });
});

describe("marker pulse", () => {
  it("starts small, opaque and fully lit", () => {
    const frame = pulseFrame(0);
    assert.equal(frame.ringScale, 0.35);
    assert.equal(frame.ringAlpha, 1);
    assert.equal(frame.iconAlpha, 1);
    assert.equal(frame.done, false);
  });

  it("expands the ring as it fades, within a pulse", () => {
    let previous = pulseFrame(0);
    for (let elapsed = 50; elapsed < PULSE_MS; elapsed += 50) {
      const frame = pulseFrame(elapsed);
      assert.ok(frame.ringScale > previous.ringScale, String(elapsed));
      assert.ok(frame.ringAlpha < previous.ringAlpha, String(elapsed));
      previous = frame;
    }
  });

  it("snaps back at each pulse boundary", () => {
    for (const boundary of [PULSE_MS, PULSE_MS * 2]) {
      assert.ok(
        pulseFrame(boundary).ringScale < pulseFrame(boundary - 1).ringScale,
        String(boundary)
      );
      assert.equal(pulseFrame(boundary).ringScale, pulseFrame(0).ringScale);
    }
  });

  it("holds the icon lit before fading it out at the end", () => {
    assert.equal(pulseFrame(LIFETIME_MS * 0.75).iconAlpha, 1);
    const late = pulseFrame(LIFETIME_MS - 100).iconAlpha;
    assert.ok(late > 0, String(late));
    assert.ok(late < 1, String(late));
  });

  it("is done at the end of the last pulse and stays done", () => {
    assert.equal(pulseFrame(LIFETIME_MS - 1).done, false);
    assert.equal(pulseFrame(LIFETIME_MS).done, true);
    assert.equal(pulseFrame(LIFETIME_MS * 100).done, true);
    assert.equal(pulseFrame(LIFETIME_MS).iconAlpha, 0);
  });

  // A clock that jumped backwards must not restart the pulse or make the ring
  // scale negative.
  it("clamps a negative or unusable elapsed time to the start", () => {
    const start = pulseFrame(0);
    for (const elapsed of [-1, -LIFETIME_MS, NaN, undefined, null, "500"]) {
      assert.deepEqual(pulseFrame(elapsed), start, String(elapsed));
    }
  });
});
