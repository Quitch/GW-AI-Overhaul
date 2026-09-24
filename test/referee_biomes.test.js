"use strict";

// gw_play/referee_biomes.js: the biome step of a referee hire. It runs under
// jQuery 2.1.4's own Deferred, where a throw inside a callback does not reject
// anything, so every failure here must still settle the step. See galaxy.md,
// "Biome mods in a GW battle".

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");

// Replaced member by member in beforeEach, since the module keeps the object.
const biomeMods = {};
registerModuleStub(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biome_mods.js",
  biomeMods
);

const generateBiomes = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_biomes.js"
);

const stubs = createGlobalStubs();
let $;

const COOKED = { identifier: "cooked.biomes", served: "cook" };
const SERVED = { identifier: "served.biomes", served: "gwsm" };

const planet = (biome) => ({ generator: { biome: biome } });

const refereeFor = (system) => {
  let files = { "/pa/existing.json": "{}" };
  const ref = {
    stages: [],
    game: () => ({
      galaxy: () => ({ stars: () => [{ system: () => system }] }),
      currentStar: () => 0,
    }),
    files: (value) => {
      if (value !== undefined) {
        files = value;
      }
      return files;
    },
    stage: (key) => ref.stages.push(key),
  };
  return ref;
};

// What the step settled with, read synchronously: the fake runs callbacks
// inside resolve() and reject(), as jQuery 2.1.4 does.
const outcomeOf = (promise) => {
  const outcome = { state: "pending" };
  promise
    .done(() => {
      outcome.state = "resolved";
    })
    .fail((error) => {
      outcome.state = "rejected";
      outcome.error = error;
    });
  return outcome;
};

const pending = () => $.Deferred();
const resolved = (value) => $.Deferred().resolve(value).promise();
const rejected = (error) => $.Deferred().reject(error).promise();

beforeEach(() => {
  $ = installFakeJQuery(stubs, { sync: true });
  biomeMods.providers = () => resolved({});
  biomeMods.mount = () => resolved();
  biomeMods.cook = () => resolved({ files: {}, mods: [], served: {} });
  biomeMods.serve = () => resolved({ served: {}, missing: [] });
});

afterEach(() => {
  stubs.restoreGlobals();
});

describe("referee biome step", () => {
  it("resolves with nothing to do when the system has only stock biomes", () => {
    const ref = refereeFor({ planets: [planet("earth")] });

    const outcome = outcomeOf(generateBiomes.call(ref));

    assert.equal(outcome.state, "resolved");
    assert.deepEqual(ref.biomeMods, []);
    assert.deepEqual(ref.biomeServed, {});
    assert.deepEqual(ref.stages, []);
  });

  it("cooks the stamped mods and collects the served ones", () => {
    const system = {
      planets: [planet("cooked_biome"), planet("served_biome")],
      gwoBiomeMods: [COOKED, SERVED],
    };
    const ref = refereeFor(system);
    const calls = [];
    biomeMods.mount = (mods) => {
      calls.push(["mount", mods]);
      return resolved();
    };
    biomeMods.cook = (mods) => {
      calls.push(["cook", mods]);
      return resolved({
        files: { "/pa/terrain/cooked_biome.json": "{}" },
        mods: [COOKED],
        served: { cooked_biome: COOKED },
      });
    };
    biomeMods.serve = (mods) => {
      calls.push(["serve", mods]);
      return resolved({ served: { served_biome: SERVED }, missing: [] });
    };

    const outcome = outcomeOf(generateBiomes.call(ref));

    assert.equal(outcome.state, "resolved");
    assert.deepEqual(calls, [
      ["mount", [COOKED]],
      ["cook", [COOKED]],
      ["serve", [SERVED]],
    ]);
    assert.deepEqual(ref.files(), {
      "/pa/existing.json": "{}",
      "/pa/terrain/cooked_biome.json": "{}",
    });
    assert.deepEqual(ref.biomeMods, [COOKED]);
    assert.deepEqual(ref.biomeServed, {
      cooked_biome: COOKED,
      served_biome: SERVED,
    });
    assert.deepEqual(ref.stages, ["!LOC:Processing biome mods"]);
  });

  it("stamps an unstamped system with the providers of its modded biomes", () => {
    const system = { planets: [planet("cooked_biome")] };
    const ref = refereeFor(system);
    biomeMods.providers = () => resolved({ cooked_biome: COOKED });

    const outcome = outcomeOf(generateBiomes.call(ref));

    assert.equal(outcome.state, "resolved");
    assert.deepEqual(system.gwoBiomeMods, [COOKED]);
  });

  it("leaves an unstamped system unstamped when no mod provides its biome", () => {
    const system = { planets: [planet("missing_biome")] };
    const ref = refereeFor(system);

    const outcome = outcomeOf(generateBiomes.call(ref));

    assert.equal(outcome.state, "resolved");
    assert.equal(system.gwoBiomeMods, undefined);
    assert.deepEqual(ref.stages, []);
  });

  it("still cooks when the mount rejects", () => {
    const ref = refereeFor({
      planets: [planet("cooked_biome")],
      gwoBiomeMods: [COOKED],
    });
    let cooked = false;
    biomeMods.mount = () => rejected("no mount");
    biomeMods.cook = () => {
      cooked = true;
      return resolved({ files: {}, mods: [], served: {} });
    };

    const outcome = outcomeOf(generateBiomes.call(ref));

    assert.equal(outcome.state, "resolved");
    assert.equal(cooked, true);
  });

  describe("settles as rejected when", () => {
    const stamped = () =>
      refereeFor({
        planets: [planet("cooked_biome")],
        gwoBiomeMods: [COOKED],
      });

    it("the provider lookup rejects", () => {
      const ref = refereeFor({ planets: [planet("cooked_biome")] });
      biomeMods.providers = () => rejected("no providers");

      const outcome = outcomeOf(generateBiomes.call(ref));

      assert.deepEqual(outcome, { state: "rejected", error: "no providers" });
    });

    it("the provider lookup's callback throws after it waited", () => {
      const ref = refereeFor({ planets: [planet("cooked_biome")] });
      const lookup = pending();
      biomeMods.providers = () => lookup.promise();

      const outcome = outcomeOf(generateBiomes.call(ref));
      assert.equal(outcome.state, "pending");
      // A providers map whose entry cannot be read as a record.
      lookup.resolve(
        Object.defineProperty({}, "cooked_biome", {
          enumerable: true,
          get: () => {
            throw new Error("bad provider");
          },
        })
      );

      assert.equal(outcome.state, "rejected");
      assert.equal(outcome.error.message, "bad provider");
    });

    it("the cook rejects", () => {
      const ref = stamped();
      biomeMods.cook = () => rejected("no cook");

      assert.deepEqual(outcomeOf(generateBiomes.call(ref)), {
        state: "rejected",
        error: "no cook",
      });
    });

    it("the cook's callback throws after it waited", () => {
      const ref = stamped();
      const cooking = pending();
      biomeMods.cook = () => cooking.promise();

      const outcome = outcomeOf(generateBiomes.call(ref));
      assert.equal(outcome.state, "pending");
      cooking.resolve(undefined);

      assert.equal(outcome.state, "rejected");
      assert.ok(outcome.error instanceof TypeError);
    });

    it("the serve rejects", () => {
      const ref = stamped();
      biomeMods.serve = () => rejected("no serve");

      assert.deepEqual(outcomeOf(generateBiomes.call(ref)), {
        state: "rejected",
        error: "no serve",
      });
    });

    it("the serve's callback throws after it waited", () => {
      const ref = stamped();
      const serving = pending();
      biomeMods.serve = () => serving.promise();

      const outcome = outcomeOf(generateBiomes.call(ref));
      assert.equal(outcome.state, "pending");
      serving.resolve(undefined);

      assert.equal(outcome.state, "rejected");
      assert.ok(outcome.error instanceof TypeError);
    });
  });
});
