"use strict";

// gw_play/save.js: the war save every GWO caller shares. Callers chain on what
// it returns, on a co-op viewer as on the host.

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  MOD_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  makeDeferred,
} = require("../scripts/lib/fake-jquery.js");

const saves = [];
let pendingSave;
registerModuleStub("shared/gw_common", {
  manifest: {
    saveGame: (game) => {
      saves.push(game);
      pendingSave = makeDeferred();
      return pendingSave.promise();
    },
  },
});

const gwoSave = loadCouiModule(MOD_ROOT + "/gw_play/save.js");

const stubs = createGlobalStubs();
const flush = () => new Promise((resolve) => setImmediate(resolve));

beforeEach(() => {
  mock.timers.enable({ apis: ["setTimeout"] });
});

afterEach(() => {
  mock.timers.reset();
  stubs.restoreGlobals();
  saves.length = 0;
  pendingSave = undefined;
});

function setup(viewer) {
  const calls = { drive: [], saved: [] };
  installFakeJQuery(stubs);
  stubs.setGlobal("model", {
    isCampaignViewer: () => viewer,
    driveAccessInProgress: (value) => calls.drive.push(value),
    game: () => ({ saved: (value) => calls.saved.push(value) }),
  });
  return calls;
}

describe("save", () => {
  it("resolves on a viewer without saving, and clears the Saving indicator", async () => {
    const calls = setup(true);

    const result = gwoSave({ id: "war" }, true);

    assert.equal(typeof result.then, "function");
    await result;
    assert.deepEqual(saves, []);
    assert.deepEqual(calls.saved, []);
    assert.deepEqual(calls.drive, [false]);
  });

  it("saves on the host, and clears the indicator once the save lands", async () => {
    const calls = setup(false);
    const war = { id: "war" };

    const result = gwoSave(war, true);

    assert.deepEqual(saves, [war]);
    assert.deepEqual(calls.saved, [false]);
    assert.deepEqual(calls.drive, [true]);

    pendingSave.resolve();
    await result;
    assert.deepEqual(calls.drive, [true, false]);

    mock.timers.tick(30000);
    await flush();
    assert.deepEqual(calls.drive, [true, false]);
  });

  // Stock's saveGame never settles when the write fails.
  it("fails a save that has not landed after 30 s, and clears the indicator", async () => {
    const calls = setup(false);
    let failure;
    gwoSave({ id: "war" }, true).fail((reason) => {
      failure = reason;
    });

    mock.timers.tick(29999);
    await flush();
    assert.deepEqual(calls.drive, [true]);
    assert.equal(failure, undefined);

    mock.timers.tick(1);
    await flush();
    assert.deepEqual(calls.drive, [true, false]);
    assert.equal(failure.gwoTimedOut, true);
    assert.equal(failure.message, "War save timed out after 30000ms");
  });

  it("ignores a save that lands after it has failed", async () => {
    const calls = setup(false);
    gwoSave({ id: "war" }, false);
    mock.timers.tick(30000);
    await flush();

    pendingSave.resolve();
    await flush();
    assert.deepEqual(calls.drive, [true, false]);
  });

  // Stock's saveGame marks them saved once it has written them, so an
  // earlier unsaved mark still gets its write.
  it("leaves the stars' saved mark alone when they are not part of the save", () => {
    const calls = setup(false);
    const war = { id: "war" };

    gwoSave(war, false);

    assert.deepEqual(saves, [war]);
    assert.deepEqual(calls.saved, []);
  });
});
