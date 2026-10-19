"use strict";

// gw_play/referee.js, run as the scene runs it, for the hire's first step
// alone: it reads the connected clients once and numbers the co-op AI tags
// from that same list, which gwoGenerateAI then reads (issue #578). Also the
// hire's registration with the launch's tracker (issue #626), and which failed
// hire clears launchingFight (issue #629).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
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
    active: options.active !== false,
    started: 0,
  };
  const game = {
    isTutorial: () => false,
    coopPlayerInventoryData: () => [],
  };
  stubs.setGlobal("model", {
    game: () => game,
    launchingFight: makeObservable(false),
    gwCampaignActive: () => scene.active,
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
      { describeError: (error) => error.message },
      {
        steps: (first, steps) => {
          scene.steps = steps;
          return {
            then: (done, fail) => {
              scene.fail = fail;
              return scene.chain;
            },
          };
        },
      },
      { aiRecords: () => [] },
      { getConnectedClients: () => scene.clients },
      {},
      {
        begin: (expected) => {
          scene.begun.push(expected);
          scene.started = 0;
        },
        track: (hire) => {
          scene.tracked.push(hire);
          scene.started += 1;
        },
        restoresAfterNext: () =>
          scene.begun[scene.begun.length - 1] === 2 && scene.started === 0,
      }
    )
  );
  scene.errors = [];
  stubs.setGlobal("console", {
    log: () => {},
    error: (message) => scene.errors.push(message),
  });

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

describe("a failed hire", () => {
  // Stock's restore remount follows a co-op host's first hire, and stock
  // clears launchingFight itself once it ends.
  function fail(options, hires) {
    installFakeJQuery(stubs, { sync: true });
    const scene = installScene(options);
    model.launchingFight(true);
    for (let i = 0; i < hires; i += 1) {
      scene.GWReferee.hire(model.game());
    }
    if (options.dropBeforeFailure) {
      scene.active = false;
    }
    let failure;
    scene.fail(new Error("spec read failed")).then(null, (error) => {
      failure = error;
    });
    scene.failure = failure;
    return scene;
  }

  it("leaves launchingFight to stock after a co-op host's first hire", () => {
    const scene = fail({ host: true }, 1);

    assert.equal(model.launchingFight(), true);
    assert.equal(scene.failure.message, "spec read failed");
    assert.deepEqual(scene.errors, [
      "Galactic War Overhaul (GWO): battle preparation failed: spec read failed",
    ]);
  });

  // Stock chose its two hires at the launch, and restores after the first
  // whatever the connection does next.
  it("leaves launchingFight to stock when the host's connection drops during its first hire", () => {
    fail({ host: true, dropBeforeFailure: true }, 1);

    assert.equal(model.launchingFight(), true);
  });

  it("clears launchingFight after a co-op host's second hire", () => {
    const scene = fail({ host: true }, 2);

    assert.equal(model.launchingFight(), false);
    assert.equal(scene.failure.message, "spec read failed");
  });

  it("clears launchingFight after a co-op viewer's hire", () => {
    fail({ host: false }, 1);

    assert.equal(model.launchingFight(), false);
  });

  it("clears launchingFight after a solo hire", () => {
    fail({ host: true, active: false }, 1);

    assert.equal(model.launchingFight(), false);
  });
});
