"use strict";

// shared/lobby_specs.js: the stand-ins for stock GW.specs.genUnitSpecs and
// modSpecs while the battle lobby builds its local overlay. See specs.md,
// "The lobby overlay".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const lobbySpecs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/lobby_specs.js"
);

const stubs = createGlobalStubs();
afterEach(() => stubs.restoreGlobals());

const TANK = "/pa/units/land/attack_vehicle/attack_vehicle.json";
const MAP = "/pa/ai/unit_maps/ai_unit_map.json";

// A referee's file set: the host's .player and one viewer's .player1.
const refereeFiles = () => ({
  "/pa/units/unit_list.json.player": { units: [TANK + ".player"] },
  "/pa/units/unit_list.json.player1": { units: [TANK + ".player1"] },
  [TANK + ".player"]: { tools: ["referee"] },
  [TANK + ".player1"]: { tools: ["referee"] },
  "/pa/units/unit_list.json.ai0": { units: [TANK + ".ai0"] },
});

// Records every call to stock's two functions and to GWO's mod.
function fakes() {
  const calls = { gen: [], stockMod: [], mod: [] };
  return {
    calls,
    stock: {
      genUnitSpecs: (units, tag) => {
        calls.gen.push([units, tag]);
        return { stock: tag };
      },
      modSpecs: (...args) => calls.stockMod.push(args),
    },
    mod: (specs, mods, tag) => {
      calls.mod.push([specs, mods, tag]);
      return "gwo";
    },
  };
}

describe("sentByReferee", () => {
  it("is true only for a player tag whose unit list the referee sent", () => {
    const files = refereeFiles();
    assert.equal(lobbySpecs.sentByReferee(files, ".player"), true);
    assert.equal(lobbySpecs.sentByReferee(files, ".player1"), true);
    assert.equal(lobbySpecs.sentByReferee(files, ".player2"), false);
    assert.equal(lobbySpecs.sentByReferee(files, ".ai0"), false);
    assert.equal(lobbySpecs.sentByReferee(files, ".playerx"), false);
    assert.equal(lobbySpecs.sentByReferee(files, undefined), false);
    assert.equal(lobbySpecs.sentByReferee(undefined, ".player"), false);
  });
});

describe("replacements.genUnitSpecs", () => {
  it("resolves no files for a tag the referee sent, and fetches nothing", async () => {
    installFakeJQuery(stubs);
    const { calls, stock, mod } = fakes();
    const specs = lobbySpecs.replacements(refereeFiles(), stock, mod);

    const resolved = await specs.genUnitSpecs([TANK], ".player");

    assert.deepEqual(resolved, {});
    assert.deepEqual(calls.gen, []);
  });

  it("leaves any other tag to stock", () => {
    const { calls, stock, mod } = fakes();
    const specs = lobbySpecs.replacements(refereeFiles(), stock, mod);

    assert.deepEqual(specs.genUnitSpecs([TANK], ".ai0"), { stock: ".ai0" });
    assert.deepEqual(specs.genUnitSpecs([TANK], ".player2"), {
      stock: ".player2",
    });
    assert.deepEqual(calls.gen, [
      [[TANK], ".ai0"],
      [[TANK], ".player2"],
    ]);
  });
});

describe("replacements.modSpecs", () => {
  it("drops every file the referee sent for its tag, keeps the rest, and applies no mod", () => {
    const { calls, stock, mod } = fakes();
    const specs = lobbySpecs.replacements(refereeFiles(), stock, mod);
    const overlay = {
      [MAP + ".player"]: { unit_map: {} },
      [TANK + ".player"]: { tools: ["stock rebuild"] },
    };

    const result = specs.modSpecs(overlay, [{ file: TANK }], ".player");

    assert.equal(result, overlay);
    assert.deepEqual(overlay, { [MAP + ".player"]: { unit_map: {} } });
    assert.deepEqual(calls.mod, []);
    assert.deepEqual(calls.stockMod, []);
  });

  it("gives a tag the referee did not send to GWO's mod, not stock's", () => {
    const { calls, stock, mod } = fakes();
    const specs = lobbySpecs.replacements(refereeFiles(), stock, mod);
    const overlay = { [TANK + ".player2"]: { tools: [] } };
    const mods = [{ file: TANK, path: "max_health", op: "wipe" }];

    assert.equal(specs.modSpecs(overlay, mods, ".player2"), "gwo");
    assert.deepEqual(calls.mod, [[overlay, mods, ".player2"]]);
    assert.deepEqual(calls.stockMod, []);
  });

  it("treats every tag as unsent when the battle has no files", () => {
    const { calls, stock, mod } = fakes();
    const specs = lobbySpecs.replacements(undefined, stock, mod);

    specs.modSpecs({}, [], ".player");
    specs.genUnitSpecs([TANK], ".player");

    assert.equal(calls.mod.length, 1);
    assert.equal(calls.gen.length, 1);
  });
});
