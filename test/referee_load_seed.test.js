"use strict";

// gw_play/referee.js, run as the scene runs it, for the /pa/ai_tech/ files: the
// scene starts reading them while every mod is mounted, and each hire seeds
// the launch's tree cache from that read, so a co-op host's shared hire does
// not read a host-only mod's load file under stock's restricted mounts (issue
// #632). See coop.md, "Host-only load files".

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const gwoPromise = loadCouiModule(MOD_ROOT + "/shared/gwo_promise.js");
const LOAD_FILE = "/pa/ai_tech/fabber_builds/mym_card.json";

const stubs = createGlobalStubs();

afterEach(() => {
  stubs.restoreGlobals();
  mock.timers.reset();
});

function installScene(read) {
  const scene = { reads: 0, caches: [], errors: [] };
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: () => [],
  };
  stubs.setGlobal("model", {
    game: () => game,
    launchingFight: makeObservable(false),
    gwCampaignActive: () => false,
  });
  stubs.setGlobal("ko", { observable: makeObservable });
  stubs.setGlobal("$", { Deferred: makeDeferred });
  stubs.setGlobal("console", {
    log: () => {},
    error: (line) => scene.errors.push(line),
  });
  const GWReferee = {};
  stubs.setGlobal("requireGW", (deps, loaded) =>
    loaded(
      {},
      GWReferee,
      () => {},
      Object.assign(() => {}, {
        createTreeCache: () => {
          const cache = {
            seeded: [],
            seed: (files) => cache.seeded.push(files),
          };
          scene.caches.push(cache);
          return cache;
        },
      }),
      () => {},
      () => {},
      {},
      { installedRaces: () => ({}) },
      {
        describeError: (error) => error.message,
        loadAiTechFiles: () => {
          scene.reads += 1;
          return read();
        },
      },
      {
        settled: gwoPromise.settled,
        within: gwoPromise.within,
        steps: (first, steps) => {
          scene.steps = steps;
          return { then: () => ({}) };
        },
      },
      { aiRecords: () => [] },
      { getConnectedClients: () => [] },
      {},
      {
        begin: () => {},
        track: () => {},
        restoresAfterNext: () => false,
      }
    )
  );

  runSceneScript(MOD_ROOT + "/gw_play/referee.js");
  // The hire's seed step, run on its own; it resolves either way.
  scene.seedStep = () => {
    GWReferee.hire(game);
    const step = scene.steps[1]();
    return new Promise((resolve) => step.then(resolve, resolve));
  };
  return scene;
}

describe("the /pa/ai_tech/ files", () => {
  it("start being read when the scene loads", () => {
    const scene = installScene(() => Promise.resolve({}));

    assert.equal(scene.reads, 1);
    assert.equal(scene.caches.length, 0);
  });

  it("seed the launch's tree cache in the hire", async () => {
    const files = { [LOAD_FILE]: { build_list: [] } };
    const scene = installScene(() => Promise.resolve(files));

    await scene.seedStep();

    assert.equal(scene.caches.length, 1);
    assert.deepEqual(scene.caches[0].seeded, [files]);
    assert.deepEqual(scene.errors, []);
  });

  it("leave the cache unseeded and log when they cannot be read", async () => {
    const scene = installScene(() =>
      Promise.reject(new Error("nothing listed under /pa/ai_tech/"))
    );

    await scene.seedStep();

    assert.deepEqual(scene.caches[0].seeded, [undefined]);
    assert.equal(scene.errors.length, 1);
    assert.match(
      scene.errors[0],
      /AI load files not read before the hire: nothing listed under \/pa\/ai_tech\//
    );
  });

  it("hold the hire for at most ten seconds", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    const scene = installScene(() => new Promise(() => {}));

    const seeded = scene.seedStep();
    mock.timers.tick(10000);
    await seeded;

    assert.deepEqual(scene.caches[0].seeded, [undefined]);
    assert.match(scene.errors[0], /AI load file read timed out after 10000ms/);
  });
});
