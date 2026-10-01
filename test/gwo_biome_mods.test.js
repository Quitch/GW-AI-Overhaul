"use strict";

// shared/gwo_biome_mods.js providers(): the biomes the enabled server zip
// mods provide, read from each mod's catalogue. Pinned against the fake that
// models jQuery 2.1.4's Deferred, which hands every value of a $.when on
// through .then. See galaxy.md, "Biome mods in a GW battle".

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  enginePromise,
  installFakeJQuery,
} = require("../scripts/lib/fake-jquery.js");

const gwoBiomeMods = loadCouiModule(MOD_ROOT + "/shared/gwo_biome_mods.js");

const stubs = createGlobalStubs();
let catalogs;
let warnings;

beforeEach(() => {
  catalogs = {};
  warnings = [];
  installFakeJQuery(stubs, { sync: true });
  stubs.setGlobal("api", {
    file: { zip: { catalog: (path) => catalogs[path] } },
  });
  mock.method(console, "warn", (line) => warnings.push(line));
});

afterEach(() => {
  mock.restoreAll();
  stubs.restoreGlobals();
});

// GW Server Mods' manifest, listing these zip mods as active.
const serve = (identifiers) => {
  stubs.setGlobal("window", {
    GwServerMods: {
      manifest: {
        load: () => true,
        activeServerMods: () =>
          identifiers.map((identifier) => ({
            identifier: identifier,
            installedPath: "/zips/" + identifier + ".zip",
          })),
      },
    },
  });
};

// A mod's catalogue, held pending until the test lands or fails it.
const catalogue = (identifier, names) => {
  const pending = enginePromise();
  catalogs["/zips/" + identifier + ".zip"] = pending;
  return {
    land: () =>
      pending.resolve(names.map((name) => ({ name: name, crc32: 0, size: 1 }))),
    fail: () => pending.reject("unreadable"),
  };
};

// What the promise has settled with so far.
const settledWith = (promise) => {
  const values = [];
  promise.then((value) => values.push(value));
  return values;
};

// biome -> "identifier/service", per settled value.
const claims = (values) =>
  values.map((providers) =>
    Object.fromEntries(
      Object.entries(providers).map(([biome, record]) => [
        biome,
        record.identifier + "/" + record.served,
      ])
    )
  );

describe("gwoBiomeMods.providers", () => {
  it("finds no provider with no server zip mod enabled", () => {
    serve([]);

    assert.deepEqual(settledWith(gwoBiomeMods.providers()), [{}]);
  });

  it("reads a lone mod's catalogue", () => {
    serve(["alpha"]);
    const alpha = catalogue("alpha", ["pa/terrain/ash.json"]);

    const values = settledWith(gwoBiomeMods.providers());
    assert.deepEqual(values, []);

    alpha.land();
    assert.deepEqual(claims(values), [{ ash: "alpha/cook" }]);
  });

  it("waits for every catalogue, and gives a biome to the first mod listed", () => {
    serve(["alpha", "beta"]);
    const alpha = catalogue("alpha", [
      "pa/terrain/ash.json",
      "pa/terrain/shared.json",
    ]);
    const beta = catalogue("beta", [
      "pa/terrain/shared.json",
      "pa/terrain/dune.json",
      "pa/terrain/dune/rock.papa",
    ]);

    const values = settledWith(gwoBiomeMods.providers());
    beta.land();
    assert.deepEqual(values, []);

    alpha.land();
    assert.deepEqual(claims(values), [
      { ash: "alpha/cook", shared: "alpha/cook", dune: "beta/gwsm" },
    ]);
  });

  it("passes over a mod whose catalogue cannot be read", () => {
    serve(["alpha", "beta"]);
    const alpha = catalogue("alpha", ["pa/terrain/ash.json"]);
    const beta = catalogue("beta", ["pa/terrain/dune.json"]);

    const values = settledWith(gwoBiomeMods.providers());
    alpha.fail();
    beta.land();

    assert.deepEqual(claims(values), [{ dune: "beta/cook" }]);
    assert.deepEqual(warnings, [
      "gwoBiomeMods: could not read /zips/alpha.zip; skipping alpha",
    ]);
  });
});
