"use strict";

// gw_play/launch_progress_state.js: the battle-preparation screen's rules.
// The scene bootstrap, gw_play/launch_progress.js, injects the HTML, wires the
// co-op operator, and wraps model.fight, so it has no test of its own. See
// docs/testing.md.

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

describe("co-op mirroring", () => {
  let sent;
  let host;
  let viewer;

  const create = (loc, broadcast) =>
    createLaunchProgress({
      visible: makeObservable(false),
      title: makeObservable(""),
      message: makeObservable(""),
      steps: makeObservableArray([]),
      labels: { title: "PREPARING", message: "Saving" },
      loc,
      broadcast,
    });

  const hostLoc = () => {
    throw new Error("the host shows the caller's text as given");
  };
  const viewerLoc = (key, options) =>
    "de:" +
    key.replace("!LOC:", "") +
    (options ? " " + JSON.stringify(options) : "");

  beforeEach(() => {
    sent = [];
    host = create(hostLoc, (payload) => sent.push(payload));
    viewer = create(viewerLoc, () => {
      throw new Error("a viewer must not broadcast");
    });
  });

  const relay = () => {
    for (const payload of sent) {
      viewer.receive(payload);
    }
  };

  it("sends a keyed stage's key and prefix, and the viewer localises them", () => {
    host.begin();
    host.stage("Co-op shared setup: Processing tech cards", {
      key: "!LOC:Processing tech cards",
      prefix: "!LOC:Co-op shared setup",
    });
    assert.deepEqual(sent[1], {
      action: "stage",
      message: "Co-op shared setup: Processing tech cards",
      key: "!LOC:Processing tech cards",
      prefix: "!LOC:Co-op shared setup",
    });
    assert.equal(host.message(), "Co-op shared setup: Processing tech cards");
    relay();
    assert.equal(
      viewer.message(),
      "de:Co-op shared setup: de:Processing tech cards"
    );
    assert.deepEqual(viewer.steps(), ["Saving"]);
  });

  it("sends no prefix for a keyed stage without one", () => {
    host.begin();
    host.stage("Mounting game files", {
      key: "!LOC:Mounting game files",
      prefix: "",
    });
    assert.deepEqual(sent[1], {
      action: "stage",
      message: "Mounting game files",
      key: "!LOC:Mounting game files",
    });
    relay();
    assert.equal(host.message(), "Mounting game files");
    assert.equal(viewer.message(), "de:Mounting game files");
  });

  it("keeps the caller's interpolated text and sends its loc options", () => {
    host.begin();
    host.stage("Processing 3 mods", {
      key: "!LOC:Processing __count__ mods",
      options: { count: 3 },
    });
    assert.equal(host.message(), "Processing 3 mods");
    assert.deepEqual(sent[1].options, { count: 3 });
    relay();
    assert.equal(viewer.message(), 'de:Processing __count__ mods {"count":3}');
  });

  // GW Server Mods holds stock fight while it mounts, so a viewer can join
  // between the host's one begin and its first stage.
  it("opens a viewer's panel for a stage that arrives before any begin", () => {
    host.begin();
    host.stage("Mounting server mods");
    viewer.receive(sent[1]);
    assert.equal(viewer.visible(), true);
    assert.equal(viewer.title(), "PREPARING");
    assert.equal(viewer.message(), "Mounting server mods");
    assert.deepEqual(viewer.steps(), ["Saving"]);
  });

  it("builds a keyed stage without a loc dependency", () => {
    const bare = createLaunchProgress({
      visible: makeObservable(false),
      title: makeObservable(""),
      message: makeObservable(""),
      steps: makeObservableArray([]),
      labels: { title: "PREPARING", message: "Saving" },
    });
    bare.begin();
    bare.stage("Mounting game files", { key: "!LOC:Mounting game files" });
    assert.equal(bare.message(), "Mounting game files");
    bare.receive({
      action: "stage",
      message: "Processing tech cards",
      key: "!LOC:Processing tech cards",
      prefix: "!LOC:Co-op shared setup",
    });
    assert.equal(
      bare.message(),
      "!LOC:Co-op shared setup: !LOC:Processing tech cards"
    );
  });

  // GW Server Mods passes text it localised itself.
  it("mirrors a plain-text stage as given", () => {
    host.begin();
    host.stage("Mounting server mods");
    assert.deepEqual(sent[1], {
      action: "stage",
      message: "Mounting server mods",
    });
    relay();
    assert.equal(host.message(), "Mounting server mods");
    assert.equal(viewer.message(), "Mounting server mods");
  });

  it("sends nothing for a stage outside a launch", () => {
    host.stage("Mounting server mods");
    assert.deepEqual(sent, []);
  });

  // Both the fight wrapper and the launchingFight fallback call them.
  it("sends begin and end once each per launch", () => {
    host.begin();
    host.begin();
    host.end();
    host.end();
    assert.deepEqual(
      sent.map((payload) => payload.action),
      ["begin", "end"]
    );
  });

  it("sends no end when nothing was showing", () => {
    host.end();
    host.settle(undefined, () => false);
    assert.deepEqual(sent, []);
  });

  it("closes the viewer's panel on end", () => {
    host.begin();
    host.stage("Mounting server mods");
    host.end();
    relay();
    assert.equal(viewer.visible(), false);
    assert.equal(viewer.message(), "");
    assert.deepEqual(viewer.steps(), []);
  });
});
