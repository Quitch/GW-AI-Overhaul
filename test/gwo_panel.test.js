"use strict";

// gw_play/gwo_panel.js, run as the scene runs it: the loader that waits for
// the war's settings on the origin system before it builds the panel.

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
  const scene = { system: {}, logged: [], disposed: false };
  const game = {
    isTutorial: () => false,
    hardcore: () => false,
    galaxy: () => ({
      stars: () => [{ system: () => scene.system }],
      origin: () => 0,
    }),
  };
  stubs.setGlobal("model", {
    game: () => game,
    setDefaultGwCoopLobbyTitle: () => {},
    gwCampaignConnectedClients: () => [],
    gwCampaignMaxClients: () => 1,
    gwCampaignMaxClientsLocked: () => false,
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
  it("builds the panel when the origin system holds the war's settings", () => {
    const scene = installScene();
    scene.system = { gwaio: { difficulty: "!LOC:Hard" } };

    runSceneScript(MOD_ROOT + "/gw_play/gwo_panel.js");

    assert.deepEqual(scene.logged, ["GWO settings found and panel loading"]);
    assert.equal(scene.disposed, true);
  });

  it("warns once and stays subscribed until the settings appear", () => {
    const scene = installScene();
    const warning =
      "No GWO settings on the origin system yet; the war information panel will load if they appear.";

    runSceneScript(MOD_ROOT + "/gw_play/gwo_panel.js");
    scene.reevaluate();

    assert.deepEqual(scene.logged, [warning]);
    assert.equal(scene.disposed, false);

    scene.system = { gwaio: { difficulty: "!LOC:Hard" } };
    scene.reevaluate();

    assert.deepEqual(scene.logged, [
      warning,
      "GWO settings found and panel loading",
    ]);
    assert.equal(scene.disposed, true);
  });
});
