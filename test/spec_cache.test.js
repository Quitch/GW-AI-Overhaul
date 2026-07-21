"use strict";

// Unit tests for shared/spec_cache.js - GWO's caching reimplementation of the base
// game's GW.specs.genUnitSpecs (media/ui/main/game/galactic_war/shared/js/gw_specs.js).
// It walks the unit-spec dependency graph, appending a tag to every spec reference,
// but fetches+parses each raw file at most once and reuses it across every tag. These
// tests drive it with an injected mock fetch so no game/Chromium runtime is needed.

const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const specCache = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js"
);

// A mock deps.fetch that records every file id it is asked for and hands back a fresh
// deep copy of the pristine fixture (so a caller mutating the result can never reach
// back into the fixture). Unknown ids reject, mirroring a missing file.
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

    // Every reachable file plus the synthetic unit_list entry, all tagged.
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

    // No file id was fetched more than once in total.
    assert.equal(new Set(calls).size, calls.length);

    // Both tag outputs are fully populated and independently tagged.
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
    // base_bot is initially missing, so the first walk can't tag it.
    const partial = Object.assign({}, files);
    delete partial["/pa/units/base_bot.json"];
    const { fetch, calls } = makeFetch(partial);

    const first = await specCache.genUnitSpecs([TANK], ".x", { fetch });
    assert.ok(!("/pa/units/base_bot.json.x" in first));

    // Now provide it; a fresh tag should fetch it (the failure wasn't cached).
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
