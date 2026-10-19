"use strict";

// gw_play/referee.js, run as the scene runs it, for mountFiles alone: it
// mounts the untagged unit list beside the battle's tagged one, and a list
// read that fails or never answers does not hold the battle (issue #617).

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const gwoPromise = loadCouiModule(MOD_ROOT + "/shared/gwo_promise.js");
const KEPT = "/pa/units/gwo_untagged_unit_list.json";

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// A referee from a hire, with its files in place, and what mountFiles mounts.
function installScene(untaggedListFile) {
  const scene = { mounted: [], errors: [] };
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
  stubs.setGlobal("api", {
    file: {
      mountMemoryFiles: (files) => {
        scene.mounted.push(files);
        return Promise.resolve(true);
      },
    },
  });
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
      Object.assign(() => {}, { createTreeCache: () => ({}) }),
      () => {},
      () => {},
      { mount: () => makeDeferred().resolve() },
      { installedRaces: () => ({}) },
      {
        cookFiles: (files) =>
          Object.fromEntries(
            Object.entries(files).map(([key, value]) => [
              key,
              JSON.stringify(value),
            ])
          ),
        describeError: (error) => error.message,
      },
      {
        within: gwoPromise.within,
        steps: (first, steps) => {
          scene.steps = steps;
          return { then: () => {} };
        },
      },
      { aiRecords: () => [] },
      { getConnectedClients: () => [] },
      { untaggedListFile: untaggedListFile }
    )
  );

  runSceneScript(MOD_ROOT + "/gw_play/referee.js");
  GWReferee.hire(game);
  const ref = scene.steps[scene.steps.length - 1]();
  ref.files({
    "/pa/units/unit_list.json.player": { units: ["/pa/units/a.json.player"] },
  });
  scene.ref = ref;
  return scene;
}

describe("mountFiles", () => {
  it("mounts the untagged unit list beside the tagged one", async () => {
    const scene = installScene(() =>
      Promise.resolve({ [KEPT]: { units: ["/pa/units/a.json"] } })
    );

    await scene.ref.mountFiles();

    assert.equal(scene.mounted.length, 1);
    const files = scene.mounted[0];
    assert.deepEqual(JSON.parse(files["/pa/units/unit_list.json"]).units, [
      "/pa/units/a.json.player",
    ]);
    assert.deepEqual(JSON.parse(files[KEPT]).units, ["/pa/units/a.json"]);
  });

  it("mounts the battle's files without it when the read fails", async () => {
    const scene = installScene(() =>
      Promise.reject(new Error("the unit list is tagged"))
    );

    await scene.ref.mountFiles();

    assert.equal(scene.mounted.length, 1);
    assert.ok(scene.mounted[0]["/pa/units/unit_list.json"]);
    assert.ok(!Object.hasOwn(scene.mounted[0], KEPT));
    assert.match(scene.errors[0], /no untagged unit list kept/);
  });

  it("mounts the battle's files without it when the read never answers", async (t) => {
    t.mock.timers.enable({ apis: ["setTimeout"] });
    const scene = installScene(() => new Promise(() => {}));

    const mounted = scene.ref.mountFiles();
    t.mock.timers.tick(10000);
    await mounted;

    assert.equal(scene.mounted.length, 1);
    assert.ok(!Object.hasOwn(scene.mounted[0], KEPT));
    assert.match(scene.errors[0], /timed out/);
  });
});
