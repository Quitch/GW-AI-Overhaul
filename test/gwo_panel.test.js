"use strict";

// gw_play/gwo_panel.js, run as the scene runs it: the loader that waits for
// the war's settings on the origin system before it builds the panel. A co-op
// viewer's scene starts on stock's bootstrap game, whose galaxy has no stars.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// The scene as the loader and the panel's first steps read it. Knockout
// evaluates a computed as it is created; `reevaluate` is the loader's own
// computed running again, as it does when the game it read changes.
function installScene() {
  const scene = { stars: [], logged: [], disposed: false };
  const game = {
    isTutorial: () => false,
    hardcore: () => false,
    galaxy: () => ({ stars: () => scene.stars, origin: () => 0 }),
  };
  stubs.setGlobal("model", {
    game: () => game,
    setDefaultGwCoopLobbyTitle: () => {},
    gwCampaignConnectedClients: () => [],
    gwoCoopAi: { count: () => 0 },
    isCampaignViewer: () => false,
    gwCampaignConnected: makeObservable(false),
    devMode: makeObservable(false),
  });
  stubs.setGlobal("ko", {
    observable: makeObservable,
    observableArray: makeObservableArray,
    computed: (fn) => {
      scene.reevaluate = scene.reevaluate || fn;
      fn();
      return {
        dispose: () => {
          scene.disposed = true;
        },
      };
    },
  });
  stubs.setGlobal("requireGW", () => {});
  stubs.setGlobal("console", {
    log: (text) => scene.logged.push(text),
    warn: (text) => scene.logged.push(text),
    error: (text) => scene.logged.push(text),
  });
  return scene;
}

describe("the panel loader", () => {
  it("waits, without throwing, while the galaxy has no stars", () => {
    const scene = installScene();

    runSceneScript(MOD_ROOT + "/gw_play/gwo_panel.js");

    assert.deepEqual(scene.logged, []);
    assert.equal(scene.disposed, false);
  });

  it("builds the panel once the war's stars arrive", () => {
    const scene = installScene();
    runSceneScript(MOD_ROOT + "/gw_play/gwo_panel.js");

    scene.stars = [{ system: () => ({ gwaio: { difficulty: "!LOC:Hard" } }) }];
    scene.reevaluate();

    assert.deepEqual(scene.logged, ["GWO settings found and panel loading"]);
    assert.equal(scene.disposed, true);
  });
});
