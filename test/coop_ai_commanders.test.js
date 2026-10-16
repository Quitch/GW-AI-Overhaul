"use strict";

// gw_play/coop_ai.js, run as the scene runs it, for the commander check alone:
// the spec cache keeps a read for the whole visit, so no commander spec may be
// read before GW Server Mods' mount has settled.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");
const {
  installFakeJQuery,
  makeDeferred,
} = require("../scripts/lib/fake-jquery.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

const COMMANDER = "/pa/units/commanders/imperial_alpha/imperial_alpha.json";
const settle = () => new Promise(setImmediate);

// The scene as far as the script reads it on load, outside a co-op session.
// Every element lookup finds one element, so no markup is reported missing.
function installScene() {
  const scene = { logged: [], fetched: [], mount: makeDeferred() };
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: makeObservableArray([]),
  };
  stubs.setGlobal("model", {
    game: () => game,
    savedCoopPlayers: () => 1,
    gwCampaignRestartContext: () => undefined,
    gwCampaignActive: () => false,
    gwCampaignPerPlayerTechCards: () => false,
    isCampaignHost: () => false,
    gwoWhenBound: () => {},
  });
  stubs.setGlobal("ko", {
    observable: makeObservable,
    observableArray: makeObservableArray,
    computed: (fn) => makeObservable(fn()),
  });
  const element = {
    length: 1,
    find: () => element,
    filter: () => element,
    append: () => element,
    before: () => element,
  };
  const $ = installFakeJQuery(stubs);
  const jquery = Object.assign(() => element, $, {
    ajax: () => ({ then: () => {} }),
  });
  stubs.setGlobal("$", jquery);
  stubs.setGlobal("loadHtml", () => "");
  stubs.setGlobal("locTree", () => {});
  stubs.setGlobal("CommanderUtility", {
    afterCommandersLoaded: (fn) => fn(),
    getKnownCommanders: () => [COMMANDER],
    bySpec: { getObjectName: (path) => path },
  });
  stubs.setGlobal("PlayFab", { isCommanderOwned: () => true });
  stubs.setGlobal("requireGW", (deps, loaded) => {
    loaded(
      {
        mlaCommanders: (owned, fetch) =>
          Promise.all(owned.map(fetch)).then(() => owned),
      },
      () => ({}),
      {},
      {},
      {},
      () => {},
      {
        fetchRaw: (path) => {
          scene.fetched.push(path);
          return Promise.resolve({});
        },
      },
      { specFetch: () => {} },
      {},
      {},
      { mountRoot: () => scene.mount },
      {}
    );
  });
  stubs.setGlobal("console", {
    log: (text) => scene.logged.push(text),
    warn: (text) => scene.logged.push(text),
    error: (text) => scene.logged.push(text),
  });
  return scene;
}

describe("the co-op AI commander check", () => {
  it("reads no commander spec until the GWSM mount settles", async () => {
    const scene = installScene();

    runSceneScript(MOD_ROOT + "/gw_play/coop_ai.js");
    await settle();

    assert.deepEqual(scene.fetched, []);
    assert.deepEqual(scene.logged, []);

    scene.mount.resolve(true);
    await settle();

    assert.deepEqual(scene.fetched, [COMMANDER]);
    assert.deepEqual(scene.logged, [
      "[GW COOP AI] MLA commanders: 1 of 1 owned",
    ]);
  });

  it("reads them after a mount that failed", async () => {
    const scene = installScene();

    runSceneScript(MOD_ROOT + "/gw_play/coop_ai.js");
    scene.mount.reject(new Error("mount failed"));
    await settle();

    assert.deepEqual(scene.fetched, [COMMANDER]);
    assert.deepEqual(scene.logged, [
      "[GW COOP AI] MLA commanders: 1 of 1 owned",
    ]);
  });
});
