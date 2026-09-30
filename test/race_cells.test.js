"use strict";

// gw_play/race_cells.js: signatureOf, the cache key for a unit list read,
// which decides whether a later caller may reuse an earlier read's specs and
// cells; and what load and indexFor keep of a read in which a spec failed.

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  MOD_ROOT,
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  FIXTURE_RACE,
  FIXTURE_SPECS,
  FIXTURE_UNITS,
} = require("../scripts/lib/race-fixture.js");

const { signatureOf } = requireShippedModule(
  MOD_ROOT + "/gw_play/race_cells.js"
);
const raceCells = loadCouiModule(MOD_ROOT + "/gw_play/race_cells.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const specCache = loadCouiModule(MOD_ROOT + "/gw_play/spec_cache.js");

describe("signatureOf", () => {
  it("is the same for the same list", () => {
    assert.equal(
      signatureOf(["/pa/units/a.json", "/pa/units/b.json"]),
      signatureOf(["/pa/units/a.json", "/pa/units/b.json"])
    );
  });

  // One unit swapped for another of the same path length: the count and the
  // joined length match, and the key must still differ.
  it("differs for a list with the same count and total length", () => {
    assert.notEqual(
      signatureOf(["/pa/units/a.json", "/pa/units/b.json"]),
      signatureOf(["/pa/units/a.json", "/pa/units/c.json"])
    );
  });
});

// A spec read while a race's zip mounts can fail and then succeed. A read in
// which one failed was kept for the scene, so the race's cells never had the
// unit. The module caches per unit list, so each test reads its own list, and
// spec_cache.js keeps what it read, so each test starts it empty.
describe("a read in which a spec failed", () => {
  const stubs = createGlobalStubs();
  const [FX_TANK] = FIXTURE_UNITS.filter((path) => path.includes("/fx_tank/"));

  beforeEach(() => {
    specCache.clearCache();
    mock.method(console, "log", () => {});
    mock.method(console, "warn", () => {});
  });

  afterEach(() => {
    stubs.restoreGlobals();
    races.reset();
    mock.restoreAll();
  });

  // $.ajax as gameFilePaths.specFetch calls it, over the fixture's specs. The
  // path a test adds to make its list its own reads as an empty spec.
  function serveSpecs(unreadable) {
    stubs.setGlobal("$", {
      ajax: (options) => {
        const item = options.url.slice("coui:/".length);
        setImmediate(() => {
          if (unreadable.has(item)) {
            options.error({}, "error", "not mounted yet");
          } else {
            options.success(JSON.stringify(FIXTURE_SPECS[item] || {}));
          }
        });
      },
    });
  }

  it("is read again by the next caller, and kept once whole", async () => {
    const unreadable = new Set([FX_TANK]);
    serveSpecs(unreadable);
    const units = FIXTURE_UNITS.concat(["/pa/units/load_test.json"]);

    const first = await raceCells.load(units);
    unreadable.clear();
    const second = await raceCells.load(units);
    const third = await raceCells.load(units);

    assert.ok(!Object.hasOwn(first.specs, FX_TANK));
    assert.ok(Object.hasOwn(second.specs, FX_TANK));
    assert.equal(third, second);
  });

  it("builds the race's cells again for the next caller, and keeps them once whole", async () => {
    races.register(FIXTURE_RACE);
    const unreadable = new Set([FX_TANK]);
    serveSpecs(unreadable);
    const units = FIXTURE_UNITS.concat(["/pa/units/index_test.json"]);

    const first = await raceCells.indexFor("fixture", units);
    unreadable.clear();
    const second = await raceCells.indexFor("fixture", units);
    const third = await raceCells.indexFor("fixture", units);

    assert.ok(!first.race.units.includes(FX_TANK));
    assert.ok(second.race.units.includes(FX_TANK));
    assert.equal(races.cellsOf("fixture"), second);
    assert.equal(third, second);
  });

  it("still hands the partial cells to the caller that read them", async () => {
    races.register(FIXTURE_RACE);
    serveSpecs(new Set([FX_TANK]));
    const units = FIXTURE_UNITS.concat(["/pa/units/partial_test.json"]);

    const index = await raceCells.indexFor("fixture", units);

    assert.ok(index.race.units.length > 0);
    assert.equal(races.cellsOf("fixture"), index);
  });
});
