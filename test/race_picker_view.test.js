"use strict";

// shared/race_picker_view.js, run as the scene runs it: a commander that
// CommanderUtility does not list is named from its own spec.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const MAXIM = "/pa/units/commanders/exiles_maxim/exiles_maxim.json";
const PUMA = "/pa/units/commanders/ft_commander/ft_commander.json";
const ALPHA = "/pa/units/commanders/imperial_alpha/imperial_alpha.json";

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// specs: what each race commander's spec file holds; listed: the names
// CommanderUtility already has, as it strips them itself.
function run(specs, listed) {
  stubs.setGlobal("model", {});
  stubs.setGlobal("ko", { observable: makeObservable });
  stubs.setGlobal("CommanderUtility", {
    bySpec: {
      getName: (spec) => listed[spec] || "",
      getImage: () => undefined,
      getProfileImage: () => undefined,
    },
  });
  stubs.setGlobal(
    "$",
    createFakeJQuery({
      getJSON: (url) => {
        const spec = url.replace(/^coui:\//, "");
        if (!specs[spec]) {
          throw new Error("no spec " + spec);
        }
        return specs[spec];
      },
    })
  );
  runSceneScript(MOD_ROOT + "/shared/race_picker_view.js");
  return global.model;
}

// The spec read settles on a later tick.
const settle = () => new Promise((resolve) => setImmediate(resolve));

describe("race_picker_view commander names", () => {
  it("drops the Commander suffix from a race commander's name", async () => {
    const view = run({ [MAXIM]: { display_name: "Maxim Commander" } }, {});

    view.gwoCommanderName(MAXIM);
    await settle();

    assert.equal(view.gwoCommanderName(MAXIM), "Maxim");
  });

  it("keeps a name without the suffix whole", async () => {
    const view = run({ [PUMA]: { display_name: "Puma" } }, {});

    view.gwoCommanderName(PUMA);
    await settle();

    assert.equal(view.gwoCommanderName(PUMA), "Puma");
  });

  it("leaves a listed commander's name as CommanderUtility gives it", () => {
    const view = run({}, { [ALPHA]: "Alpha" });

    assert.equal(view.gwoCommanderName(ALPHA), "Alpha");
  });
});
