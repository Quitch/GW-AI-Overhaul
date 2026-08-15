"use strict";

// The Conquest player-held pulse: a looping ring, so unlike the ping marker
// it never times itself out and must leave the idle frame rate alone.

const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const { createLayer, pulseFrame } = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/conquest_pulse.js"
);

const PULSE_MS = 1800;

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
  };
}

// The marker times itself from _.now(), swapped for a clock the test drives.
// lodash 3's now() rejects a non-native Date.now and falls back to
// `new Date().getTime()`, so the stand-in has to be constructible.
let clock = 1000;
let realLodash;

function FakeDate() {
  this.getTime = () => clock;
}

before(() => {
  realLodash = global._;
  global._ = realLodash.runInContext({ Date: FakeDate });
});

after(() => {
  global._ = realLodash;
});

let active;

function build() {
  const systems = {
    0: { systemDisplay: displayObject({}) },
    1: { systemDisplay: displayObject({}) },
  };

  const stubs = createGlobalStubs();
  stubs.setGlobal("createjs", fakeCreatejs());

  active = {
    systems,
    layer: createLayer({
      systemFor: (star) => systems[star],
      colour: "rgba(10,20,30,1)",
    }),
    restore: () => stubs.restoreGlobals(),
  };
  return active;
}

afterEach(() => {
  clock = 1000;
  if (active) {
    active.restore();
    active = undefined;
  }
});

const tickOf = (system) => system.systemDisplay.children[0].listeners[0][1];

describe("pulseFrame", () => {
  it("starts each pulse tight and opaque", () => {
    assert.deepEqual(pulseFrame(0), { ringScale: 0.35, ringAlpha: 1 });
  });

  it("expands and fades through a pulse", () => {
    const half = pulseFrame(PULSE_MS / 2);
    assert.ok(half.ringScale > 0.35, String(half.ringScale));
    assert.equal(half.ringAlpha, 0.5);
  });

  it("loops instead of finishing", () => {
    assert.deepEqual(pulseFrame(PULSE_MS), pulseFrame(0));
    assert.deepEqual(pulseFrame(PULSE_MS * 5 + 450), pulseFrame(450));
    assert.equal(pulseFrame(PULSE_MS * 1000).done, undefined);
  });

  it("treats a junk clock as the pulse start", () => {
    assert.deepEqual(pulseFrame(undefined), pulseFrame(0));
    assert.deepEqual(pulseFrame(-5), pulseFrame(0));
  });
});

describe("raising and removing markers", () => {
  it("hangs one ring off the star it names", () => {
    const { layer, systems } = build();

    layer.raise(0);
    layer.raise(0);

    assert.equal(systems[0].systemDisplay.children.length, 1);
    const marker = systems[0].systemDisplay.children[0];
    // systems.js sorts an undefined z ahead of every number, which would put
    // the marker under the star icon.
    assert.equal(marker.z, 2);
    assert.equal(marker.mouseEnabled, false);
    assert.equal(marker.children.length, 1);
  });

  it("ignores a star the galaxy no longer has", () => {
    const { layer, systems } = build();
    layer.raise(7);
    assert.equal(systems[0].systemDisplay.children.length, 0);
  });

  it("keeps pulsing past a full cycle without removing itself", () => {
    const { layer, systems } = build();

    layer.raise(0);
    const ring = systems[0].systemDisplay.children[0].children[0];

    clock += PULSE_MS / 2;
    tickOf(systems[0])();
    const scale = ring.scaleX;
    assert.ok(scale > 0.35, String(scale));
    assert.equal(ring.alpha, 0.5);

    clock += PULSE_MS;
    tickOf(systems[0])();
    assert.equal(ring.scaleX, scale);
    assert.equal(systems[0].systemDisplay.children.length, 1);
  });

  it("removes a marker once however often it is asked", () => {
    const { layer, systems } = build();

    layer.raise(0);
    const marker = systems[0].systemDisplay.children[0];
    layer.remove(0);
    layer.remove(0);
    layer.remove(7);

    assert.deepEqual(systems[0].systemDisplay.children, []);
    assert.deepEqual(marker.listeners, []);
    assert.equal(marker.parent, undefined);
  });
});

describe("syncing to the held map", () => {
  it("raises the named stars and drops the rest", () => {
    const { layer, systems } = build();

    layer.sync({ 0: true, 1: true });
    assert.equal(systems[0].systemDisplay.children.length, 1);
    assert.equal(systems[1].systemDisplay.children.length, 1);

    layer.sync({ 1: true });
    assert.equal(systems[0].systemDisplay.children.length, 0);
    assert.equal(systems[1].systemDisplay.children.length, 1);

    layer.sync({});
    assert.equal(systems[1].systemDisplay.children.length, 0);
  });

  it("leaves an already-raised marker pulsing through a sync", () => {
    const { layer, systems } = build();

    layer.sync({ 0: true });
    const marker = systems[0].systemDisplay.children[0];
    layer.sync({ 0: true });

    assert.equal(systems[0].systemDisplay.children[0], marker);
  });
});
