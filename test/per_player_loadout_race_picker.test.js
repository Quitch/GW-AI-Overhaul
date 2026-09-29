"use strict";

// gw_coop_per_player_loadout/race_picker.js, run as the scene runs it. The
// war's promise from host_war.js is shared with Join's buildStartingInventory,
// and jQuery 2.1.4 runs no later callback on a promise once one has thrown.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// The markup calls the scene script makes, each answering with the same
// chainable stand-in, as jQuery would.
function fakeDollar() {
  const element = {};
  for (const name of ["remove", "prepend", "closest", "after", "html"]) {
    element[name] = () => element;
  }
  element.selectpicker = () => element;
  return Object.assign(() => element, createFakeJQuery({ sync: true }));
}

describe("the war's shared promise", () => {
  it("still reaches a later consumer when the picker's own work throws", () => {
    const $ = fakeDollar();
    const war = $.Deferred();
    const errors = [];
    stubs.setGlobal("$", $);
    stubs.setGlobal("ko", {
      observable: makeObservable,
      observableArray: makeObservableArray,
      // Knockout evaluates a computed as it is created.
      computed: (fn) => {
        fn();
        return fn;
      },
    });
    stubs.setGlobal("model", { selectedCommander: makeObservable("alpha") });
    stubs.setGlobal("loadHtml", () => "");
    stubs.setGlobal("console", { error: (text) => errors.push(text) });
    stubs.setGlobal("requireGW", (ids, onLoad) =>
      onLoad(
        { load: () => war.promise() },
        { registerAll: () => {} },
        { commanderArtHue: () => 0, MLA_ID: "mla" },
        {
          commanderTint: () => {
            throw new Error("tint failed");
          },
        },
        { CLUSTER_FACTION: 4 }
      )
    );

    runSceneScript(MOD_ROOT + "/gw_coop_per_player_loadout/race_picker.js");
    // The engine logs a throw from a deferred callback and carries on.
    try {
      war.resolve({ colour: [[0, 255, 0]], perPlayerRace: false, races: [] });
    } catch {
      errors.push("escaped");
    }
    let joined = false;
    war.promise().then(() => {
      joined = true;
    });

    assert.equal(joined, true);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /tint failed/);
  });
});
