"use strict";

// gw_play/referee.js's model.fight wrapper: a co-op host's Fight reads the
// /pa/ai_tech/ files into a tree cache before stock fight runs, and the launch's
// hires use that cache (issue #632). See coop.md, "Host-only load files".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

function installScene(options) {
  const scene = {
    coop: options.coop,
    stockReturnsEarly: false,
    caches: [],
    primed: [],
    fights: [],
    refs: [],
    finishPrime: null,
  };
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: () => [],
  };
  const model = {
    game: () => game,
    launchingFight: makeObservable(false),
    gwCampaignActive: () => scene.coop,
    isCampaignHost: () => scene.coop,
    fight: function () {
      scene.fights.push({ self: this, args: Array.from(arguments) });
      if (!scene.stockReturnsEarly) {
        model.launchingFight(true);
      }
      return "stock result";
    },
  };
  scene.model = model;
  stubs.setGlobal("model", model);
  stubs.setGlobal("ko", { observable: makeObservable });
  const GWReferee = {};
  stubs.setGlobal("requireGW", (deps, loaded) =>
    loaded(
      {},
      GWReferee,
      function () {
        scene.refs.push(this);
      },
      Object.assign(() => {}, {
        createTreeCache: () => {
          const cache = { id: scene.caches.length };
          scene.caches.push(cache);
          return cache;
        },
      }),
      () => {},
      () => {},
      {},
      { installedRaces: () => ({}) },
      { describeError: (error) => error.message },
      {
        steps: (first, steps) => {
          scene.steps = steps;
          return { then: () => ({}) };
        },
        settled: (promise) =>
          promise.then(
            () => undefined,
            () => undefined
          ),
      },
      { aiRecords: () => [] },
      { getConnectedClients: () => [] },
      {},
      {
        begin: () => {},
        track: () => {},
        restoresAfterNext: () => false,
      },
      {
        prime: (cache) => {
          scene.primed.push(cache);
          return new Promise((resolve) => {
            scene.finishPrime = resolve;
          });
        },
      }
    )
  );
  stubs.setGlobal("console", { log: () => {}, error: () => {} });

  runSceneScript(MOD_ROOT + "/gw_play/referee.js");
  // The cache a hire takes, read from the referee its game-files step is
  // bound to.
  scene.hireCache = () => {
    GWReferee.hire(game);
    scene.steps[1]();
    return scene.refs[scene.refs.length - 1].treeCache;
  };
  return scene;
}

describe("a co-op host's Fight", () => {
  it("reads the load files into a new cache before stock fight runs", async () => {
    const scene = installScene({ coop: true });

    const result = scene.model.fight(scene.model, null, false);

    assert.deepEqual(scene.primed, [scene.caches[0]]);
    assert.equal(scene.fights.length, 0);

    scene.finishPrime();
    assert.equal(await result, "stock result");
    assert.equal(scene.fights.length, 1);
    assert.equal(scene.fights[0].self, scene.model);
    assert.deepEqual(scene.fights[0].args, [scene.model, null, false]);
  });

  it("hands that cache to both of the launch's hires", async () => {
    const scene = installScene({ coop: true });

    const result = scene.model.fight(scene.model, null, false);
    scene.finishPrime();
    await result;

    assert.equal(scene.hireCache(), scene.caches[0]);
    assert.equal(scene.hireCache(), scene.caches[0]);
    assert.equal(scene.caches.length, 1);
  });

  it("answers a second click while the files are read with the first's promise", async () => {
    const scene = installScene({ coop: true });

    const first = scene.model.fight(scene.model, null, false);
    const second = scene.model.fight(scene.model, null, false);

    assert.equal(second, first);
    assert.equal(scene.primed.length, 1);
    scene.finishPrime();
    await first;
    assert.equal(scene.fights.length, 1);
  });

  it("passes the cheat path straight to stock", () => {
    const scene = installScene({ coop: true });

    assert.equal(scene.model.fight(scene.model, null, true), "stock result");

    assert.equal(scene.primed.length, 0);
    assert.equal(scene.fights.length, 1);
  });

  it("passes a Fight during a launch straight to stock", () => {
    const scene = installScene({ coop: true });
    scene.model.launchingFight(true);

    scene.model.fight(scene.model, null, false);

    assert.equal(scene.primed.length, 0);
    assert.equal(scene.fights.length, 1);
  });
});

describe("a solo Fight", () => {
  it("calls stock at once, and the hire creates its own cache", () => {
    const scene = installScene({ coop: false });

    assert.equal(scene.model.fight(scene.model, null, false), "stock result");

    assert.equal(scene.primed.length, 0);
    assert.equal(scene.fights.length, 1);
    assert.equal(scene.hireCache(), scene.caches[0]);
  });

  it("does not take the cache of a co-op Fight that stock refused", async () => {
    const scene = installScene({ coop: true });
    scene.stockReturnsEarly = true;
    const refused = scene.model.fight(scene.model, null, false);
    scene.finishPrime();
    await refused;

    scene.coop = false;
    scene.stockReturnsEarly = false;
    scene.model.fight(scene.model, null, false);

    assert.equal(scene.hireCache(), scene.caches[1]);
  });
});
