"use strict";

// Save/restore for the engine globals shipped code reads at call time. A factory,
// not a singleton, so two suites never share a restore stack.

const { afterEach } = require("node:test");

function createGlobalStubs() {
  const restores = [];

  // The property is saved and put back whole, never read: Node 26 defines
  // localStorage as an accessor whose getter warns when read.
  function setGlobal(name, value) {
    const previous = Object.getOwnPropertyDescriptor(global, name);
    Object.defineProperty(global, name, {
      value: value,
      configurable: true,
      enumerable: true,
      writable: true,
    });
    restores.push(function () {
      if (previous) {
        Object.defineProperty(global, name, previous);
      } else {
        delete global[name];
      }
    });
  }

  function restoreGlobals() {
    while (restores.length) {
      restores.pop()();
    }
  }

  return { setGlobal, restoreGlobals };
}

// The factory-test scaffold: build() runs `setup` and keeps what it returns, so
// the afterEach registered here can call its restore(). release() restores
// early, for a test that builds more than once; current() is the live one.
function trackActive(setup) {
  let active;

  function release() {
    if (active) {
      active.restore();
      active = undefined;
    }
  }
  afterEach(release);

  return {
    build(overrides) {
      active = setup(overrides);
      return active;
    },
    release,
    current: () => active,
  };
}

module.exports = { createGlobalStubs, trackActive };
