"use strict";

// gw_play/launch_progress_state.js: the battle-preparation screen's rules.
// The scene bootstrap, gw_play/launch_progress.js, injects the HTML and wraps
// model.fight, so it has no test of its own. See docs/testing.md.

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

const createLaunchProgress = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/launch_progress_state.js"
);

let progress;

beforeEach(() => {
  progress = createLaunchProgress({
    visible: makeObservable(false),
    title: makeObservable(""),
    message: makeObservable(""),
    steps: makeObservableArray([]),
    labels: { title: "PREPARING", message: "Saving" },
  });
});

describe("begin", () => {
  it("shows the screen with the launch labels", () => {
    progress.begin();
    assert.equal(progress.visible(), true);
    assert.equal(progress.title(), "PREPARING");
    assert.equal(progress.message(), "Saving");
    assert.deepEqual(progress.steps(), []);
  });

  // Both the fight wrapper and the launchingFight fallback call it.
  it("is idempotent while a launch is showing", () => {
    progress.begin();
    progress.stage("AI mods");
    progress.begin();
    assert.equal(progress.message(), "AI mods");
    assert.deepEqual(progress.steps(), ["Saving"]);
  });
});

describe("stage", () => {
  // GW Server Mods mounts on scene entry as well as on Fight.
  it("is a no-op when nothing is launching", () => {
    progress.stage("Mounting server mods");
    assert.equal(progress.visible(), false);
    assert.equal(progress.message(), "");
    assert.deepEqual(progress.steps(), []);
  });

  it("moves the previous message into the step list", () => {
    progress.begin();
    progress.stage("Tech cards");
    progress.stage("AI mods");
    assert.equal(progress.message(), "AI mods");
    assert.deepEqual(progress.steps(), ["Saving", "Tech cards"]);
  });
});

describe("end", () => {
  it("hides and clears", () => {
    progress.begin();
    progress.stage("Tech cards");
    progress.end();
    assert.equal(progress.visible(), false);
    assert.equal(progress.message(), "");
    assert.deepEqual(progress.steps(), []);
  });
});

describe("settle", () => {
  it("hides when stock fight returned without launching", () => {
    progress.begin();
    progress.settle(undefined, () => false);
    assert.equal(progress.visible(), false);
  });

  it("keeps showing once a launch is under way", () => {
    progress.begin();
    progress.settle(undefined, () => true);
    assert.equal(progress.visible(), true);
  });

  // An outer wrapper (GW Server Mods) runs stock fight after its own promise.
  it("waits for a promised fight before deciding", () => {
    let resolve;
    const thenable = {
      then: (onDone) => {
        resolve = onDone;
      },
    };
    let launching = false;
    progress.begin();
    progress.settle(thenable, () => launching);
    assert.equal(progress.visible(), true);
    launching = true;
    resolve();
    assert.equal(progress.visible(), true);
  });

  it("hides when a promised fight ends without launching", () => {
    let reject;
    const thenable = {
      then: (onDone, onFail) => {
        reject = onFail;
      },
    };
    progress.begin();
    progress.settle(thenable, () => false);
    reject();
    assert.equal(progress.visible(), false);
  });
});
