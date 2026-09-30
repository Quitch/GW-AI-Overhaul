"use strict";

// gw_play/save.js: the war save every GWO caller shares. Callers chain on what
// it returns, on a co-op viewer as on the host.

const { describe, it, afterEach } = require("node:test");
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

afterEach(() => {
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
  });

  it("marks the stars saved when they are not part of the save", () => {
    const calls = setup(false);

    gwoSave({ id: "war" }, false);

    assert.deepEqual(calls.saved, [true]);
  });
});
