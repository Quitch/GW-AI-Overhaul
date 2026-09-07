"use strict";

// Unit tests for shared/spec_cache.js, driven with an injected mock fetch.

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const specCache = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js"
);

// Records every id asked for and returns a fresh copy, so a mutating caller cannot
// reach back into the fixture. Unknown ids reject, mirroring a missing file.
function makeFetch(files) {
  const calls = [];
  const fetch = (item) => {
    calls.push(item);
    if (!Object.prototype.hasOwnProperty.call(files, item)) {
      return Promise.reject(new Error("no such spec: " + item));
    }
    return Promise.resolve(JSON.parse(JSON.stringify(files[item])));
  };
  return { fetch, calls };
}

// A spec graph exercising every reference field tagSpec renames.
const TANK = "/pa/units/tank.json";
const files = {
  [TANK]: {
    base_spec: "/pa/units/base_bot.json",
    tools: [{ spec_id: "/pa/tools/cannon.json" }],
    buildable_projectiles: ["/pa/projectiles/shell.json"],
  },
  "/pa/units/base_bot.json": { hp: 100 },
  "/pa/tools/cannon.json": { ammo_id: [{ id: "/pa/ammo/shell_ammo.json" }] },
  "/pa/projectiles/shell.json": {
    spawn_unit_on_death: "/pa/units/debris.json",
  },
  "/pa/ammo/shell_ammo.json": {},
  "/pa/units/debris.json": {},
};
const uniqueFileCount = Object.keys(files).length;

beforeEach(() => {
  // rawCache is module-level and persists across tests in-process.
  specCache.clearCache();
});

describe("genUnitSpecs - graph walk & tagging", () => {
  it("tags every reference field and reaches every transitive spec", async () => {
    const { fetch } = makeFetch(files);
    const results = await specCache.genUnitSpecs([TANK], ".x", { fetch });

    // unit_list is synthesized, not fetched.
    for (const id of Object.keys(files)) {
      assert.ok(id + ".x" in results, "missing tagged spec: " + id + ".x");
    }
    assert.ok("/pa/units/unit_list.json.x" in results);
    assert.deepEqual(results["/pa/units/unit_list.json.x"].units, [
      TANK + ".x",
    ]);

    const tank = results[TANK + ".x"];
    assert.equal(tank.base_spec, "/pa/units/base_bot.json.x");
    assert.equal(tank.tools[0].spec_id, "/pa/tools/cannon.json.x");
    assert.equal(tank.buildable_projectiles[0], "/pa/projectiles/shell.json.x");
    assert.equal(
      results["/pa/tools/cannon.json.x"].ammo_id[0].id,
      "/pa/ammo/shell_ammo.json.x"
    );
    assert.equal(
      results["/pa/projectiles/shell.json.x"].spawn_unit_on_death,
      "/pa/units/debris.json.x"
    );
  });

  it("returns undefined when no tag is given (matching base game)", () => {
    const { fetch, calls } = makeFetch(files);
    assert.equal(specCache.genUnitSpecs([TANK], "", { fetch }), undefined);
    assert.equal(
      specCache.genUnitSpecs([TANK], undefined, { fetch }),
      undefined
    );
    assert.equal(calls.length, 0);
  });
});

describe("genUnitSpecs - fetch caching", () => {
  it("fetches each unique file exactly once across two different tags", async () => {
    const { fetch, calls } = makeFetch(files);

    const first = await specCache.genUnitSpecs([TANK], ".x", { fetch });
    assert.equal(
      calls.length,
      uniqueFileCount,
      "first tag should fetch every unique file once"
    );

    const second = await specCache.genUnitSpecs([TANK], ".y", { fetch });
    assert.equal(
      calls.length,
      uniqueFileCount,
      "second tag should fetch nothing new - everything is cached"
    );

    assert.equal(new Set(calls).size, calls.length);

    assert.equal(first[TANK + ".x"].base_spec, "/pa/units/base_bot.json.x");
    assert.equal(second[TANK + ".y"].base_spec, "/pa/units/base_bot.json.y");
  });

  it("does not let one tag's mutation leak into another (no cache poisoning)", async () => {
    const { fetch } = makeFetch(files);

    await specCache.genUnitSpecs([TANK], ".x", { fetch });
    const second = await specCache.genUnitSpecs([TANK], ".y", { fetch });

    // If the cached pristine copy had been tagged in place, the second walk would
    // observe ".x" references instead of ".y".
    assert.equal(
      second[TANK + ".y"].tools[0].spec_id,
      "/pa/tools/cannon.json.y"
    );
    assert.equal(
      second["/pa/tools/cannon.json.y"].ammo_id[0].id,
      "/pa/ammo/shell_ammo.json.y"
    );
  });

  it("skips a failed fetch without caching the failure (a later tag can retry)", async () => {
    const partial = Object.assign({}, files);
    delete partial["/pa/units/base_bot.json"];
    const { fetch, calls } = makeFetch(partial);

    const first = await specCache.genUnitSpecs([TANK], ".x", { fetch });
    assert.ok(!("/pa/units/base_bot.json.x" in first));

    partial["/pa/units/base_bot.json"] = { hp: 100 };
    const before = calls.length;
    const second = await specCache.genUnitSpecs([TANK], ".y", { fetch });
    assert.ok("/pa/units/base_bot.json.y" in second);
    assert.ok(
      calls.includes("/pa/units/base_bot.json"),
      "the previously-failed file should be re-fetched"
    );
    assert.ok(calls.length > before);
  });
});

describe("references", () => {
  // Every field the tagger renames, once each, so the two cannot drift apart.
  const spec = () => ({
    base_spec: "/pa/units/base.json",
    tools: [{ spec_id: "/pa/tools/a.json" }, { spec_id: "/pa/tools/b.json" }],
    replaceable_units: ["/pa/units/r1.json", "/pa/units/r2.json"],
    buildable_projectiles: ["/pa/units/p.json"],
    factory: { initial_build_spec: "/pa/units/f.json" },
    ammo_id: [{ id: "/pa/ammo/x.json" }, { id: "/pa/ammo/y.json" }],
    death_weapon: {
      ground_ammo_spec: "/pa/ammo/g.json",
      air_ammo_spec: "/pa/ammo/air.json",
    },
    spawn_unit_on_death: "/pa/units/spawn.json",
    unrelated: "/pa/units/not_a_reference.json",
  });

  it("lists every reference field, string or array, without touching the spec", () => {
    const input = spec();
    const before = JSON.stringify(input);

    const found = specCache.references(input);

    assert.deepEqual(found, [
      "/pa/units/base.json",
      "/pa/tools/a.json",
      "/pa/tools/b.json",
      "/pa/units/r1.json",
      "/pa/units/r2.json",
      "/pa/units/p.json",
      "/pa/units/f.json",
      "/pa/ammo/x.json",
      "/pa/ammo/y.json",
      "/pa/ammo/g.json",
      "/pa/ammo/air.json",
      "/pa/units/spawn.json",
    ]);
    assert.equal(JSON.stringify(input), before);
  });

  it("handles a string ammo_id and a non-object spec", () => {
    assert.deepEqual(specCache.references({ ammo_id: "/pa/ammo/one.json" }), [
      "/pa/ammo/one.json",
    ]);
    assert.deepEqual(specCache.references("not a spec"), []);
    assert.deepEqual(specCache.references({ base_spec: 7 }), []);
  });

  it("agrees with what genUnitSpecs tags", async () => {
    specCache.clearCache();
    const files = { "/pa/units/root.json": spec() };
    const fetch = (item) =>
      Promise.resolve(files[item] === undefined ? {} : files[item]);

    const out = await specCache.genUnitSpecs(["/pa/units/root.json"], ".t", {
      fetch,
    });

    const tagged = out["/pa/units/root.json.t"];
    const referenced = specCache.references(spec()).map((r) => r + ".t");
    assert.equal(tagged.base_spec, referenced[0]);
    assert.deepEqual(tagged.replaceable_units, referenced.slice(3, 5));
    assert.equal(tagged.spawn_unit_on_death, referenced[11]);
    assert.equal(tagged.unrelated, "/pa/units/not_a_reference.json");
    referenced.forEach((r) => assert.ok(r in out, r));
  });
});
