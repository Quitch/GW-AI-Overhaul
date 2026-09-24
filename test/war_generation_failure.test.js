"use strict";

// gw_start/war_generation_failure.js: which failed war generations gw_start
// retries with a new seed, and what it tells the player when it gives up.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const failure = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/war_generation_failure.js"
);

describe("shouldRetry", () => {
  it("retries a spawn shortage until the fifth attempt", () => {
    for (const attempts of [1, 2, 3, 4]) {
      assert.equal(
        failure.shouldRetry(failure.SPAWN_SHORTAGE, attempts),
        true,
        "attempt " + attempts
      );
    }
    assert.equal(failure.shouldRetry(failure.SPAWN_SHORTAGE, 5), false);
  });

  // A new seed cannot fix a bug, so retrying one only hid it behind four
  // more failures and a seed the player never typed.
  it("never retries any other failure", () => {
    assert.equal(failure.shouldRetry(undefined, 1), false);
    assert.equal(failure.shouldRetry("something else", 1), false);
  });
});

describe("message", () => {
  // The test loader's loc is a passthrough, so the !LOC: key comes back.
  it("tells the player what to change for a spawn shortage", () => {
    const text = failure.message(failure.SPAWN_SHORTAGE, "abc");

    assert.match(text, /larger galaxy/);
    assert.match(text, /Faction Scaling/);
  });

  // Node 21+ defines navigator as a getter, so it is redefined, not assigned.
  const bugReport = (platform) => {
    const calls = [];
    const previousLoc = global.loc;
    const previousNavigator = Object.getOwnPropertyDescriptor(
      globalThis,
      "navigator"
    );
    global.loc = (text, options) => {
      calls.push([text, options]);
      return text;
    };
    Object.defineProperty(globalThis, "navigator", {
      value: { platform: platform },
      configurable: true,
    });
    try {
      failure.message(undefined, "b-seed");
    } finally {
      global.loc = previousLoc;
      if (previousNavigator) {
        Object.defineProperty(globalThis, "navigator", previousNavigator);
      } else {
        delete globalThis.navigator;
      }
    }
    return calls;
  };

  it("asks for a bug report with the seed and the log for anything else", () => {
    const calls = bugReport("Win32");

    assert.equal(calls.length, 1);
    assert.match(calls[0][0], /__url__/);
    assert.match(calls[0][0], /__seed__/);
    assert.match(calls[0][0], /__folder__/);
    assert.deepEqual(calls[0][1], {
      url: "https://github.com/Quitch/GW-AI-Overhaul/issues",
      seed: "b-seed",
      folder: "%LOCALAPPDATA%\\Uber Entertainment\\Planetary Annihilation\\log",
    });
  });

  it("names the log folder for the player's operating system", () => {
    const cases = [
      [
        "Win32",
        "%LOCALAPPDATA%\\Uber Entertainment\\Planetary Annihilation\\log",
      ],
      [
        "MacIntel",
        "~/Library/Application Support/Uber Entertainment/Planetary Annihilation/log",
      ],
      [
        "Linux x86_64",
        "~/.local/Uber Entertainment/Planetary Annihilation/log",
      ],
      [
        "SunOS",
        "%LOCALAPPDATA%\\Uber Entertainment\\Planetary Annihilation\\log",
      ],
    ];
    for (const [platform, folder] of cases) {
      assert.equal(bugReport(platform)[0][1].folder, folder, platform);
    }
  });
});
