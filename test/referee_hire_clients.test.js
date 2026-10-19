"use strict";

// gw_play/referee.js, run as the scene runs it, for the hire's first step
// alone: it reads the connected clients once and numbers the co-op AI tags
// from that same list, which gwoGenerateAI then reads (issue #578). Also the
// hire's registration with the launch's tracker (issue #626).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

const HOST = { id: "host", name: "Host", role: "host" };
const VIEWER = { id: "v1", name: "A", role: "viewer" };

// The hire as far as its first step reads it. gwoPromise.steps keeps the
// steps rather than running them, so the test runs the first one itself.
function installScene(options) {
  const scene = {
    clients: [HOST, VIEWER],
    rosterCalls: [],
    begun: [],
    tracked: [],
    chain: { id: "hire" },
  };
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: () => [],
  };
  stubs.setGlobal("model", {
    game: () => game,
    launchingFight: makeObservable(false),
    gwCampaignActive: () => true,
    isCampaignHost: () => !!options.host,
    gwoCoopAi: options.coopAi
      ? {
          launchRoster: (clients) => {
            scene.rosterCalls.push(clients);
            return [{ tag: ".player1" }];
          },
        }
      : undefined,
  });
  stubs.setGlobal("ko", { observable: makeObservable });
  const GWReferee = {};
  scene.GWReferee = GWReferee;
  stubs.setGlobal("requireGW", (deps, loaded) =>
    loaded(
      {},
      GWReferee,
      () => {},
      Object.assign(() => {}, { createTreeCache: () => ({}) }),
      () => {},
      () => {},
      {},
      { installedRaces: () => ({}) },
      {},
      {
        steps: (first, steps) => {
          scene.steps = steps;
          return { then: () => scene.chain };
        },
      },
      { aiRecords: () => [] },
      { getConnectedClients: () => scene.clients },
      {},
      {
        begin: (expected) => scene.begun.push(expected),
        track: (hire) => scene.tracked.push(hire),
      }
    )
  );
  stubs.setGlobal("console", { log: () => {}, error: () => {} });

  runSceneScript(MOD_ROOT + "/gw_play/referee.js");
  // The last step returns the hire's referee, which the first fills in.
  scene.hire = () => {
    GWReferee.hire(game);
    scene.steps[0]();
    return scene.steps[scene.steps.length - 1]();
  };
  return scene;
}

describe("the hire's first step", () => {
  it("numbers the AI tags from the client list it keeps for the hire", () => {
    const scene = installScene({ coopAi: true });

    const ref = scene.hire();

    assert.deepEqual(ref.hireClients, [HOST, VIEWER]);
    assert.equal(scene.rosterCalls.length, 1);
    assert.equal(scene.rosterCalls[0], ref.hireClients);
    assert.deepEqual(ref.coopAis, [{ tag: ".player1" }]);
  });

  it("keeps a copy, so a later change to the live list cannot reach it", () => {
    const scene = installScene({ coopAi: true });

    const ref = scene.hire();
    scene.clients.push({ id: "v2", name: "B", role: "viewer" });

    assert.deepEqual(ref.hireClients, [HOST, VIEWER]);
  });

  it("keeps the list without the co-op AI modules too", () => {
    const scene = installScene({ coopAi: false });

    const ref = scene.hire();

    assert.deepEqual(ref.hireClients, [HOST, VIEWER]);
    assert.deepEqual(ref.coopAis, []);
  });
});

describe("the launch's tracker", () => {
  it("expects one hire from a launch that is not a co-op host's", () => {
    const scene = installScene({ host: false });

    model.launchingFight(true);
    model.launchingFight(false);

    assert.deepEqual(scene.begun, [1]);
  });

  it("expects two hires from a co-op host's launch", () => {
    const scene = installScene({ host: true });

    model.launchingFight(true);

    assert.deepEqual(scene.begun, [2]);
  });

  it("is given the promise the hire returns", () => {
    const scene = installScene({});

    const hire = scene.GWReferee.hire(model.game());

    assert.equal(hire, scene.chain);
    assert.deepEqual(scene.tracked, [scene.chain]);
  });
});
