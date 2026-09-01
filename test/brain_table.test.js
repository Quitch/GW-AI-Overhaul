"use strict";

// shared/brain_table.js: the per-race AI brain table - cell options, row
// seeding, the effective brain per army, and what a war records. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const brainTable = loadCouiModule(MOD_ROOT + "/shared/brain_table.js");

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
  races.register({ id: "legion" });
});

afterEach(() => {
  races.reset();
});

describe("cellOptions", () => {
  it("offers only the brains that support the race", () => {
    assert.deepEqual(brainTable.cellOptions("mla", true), [
      "Titans",
      "Queller",
      "Penchant",
    ]);
    assert.deepEqual(brainTable.cellOptions("legion", true), [
      "Titans",
      "Queller",
    ]);
    assert.deepEqual(brainTable.cellOptions("fixture", true), ["Titans"]);
  });

  it("withholds Queller on classic content only", () => {
    assert.deepEqual(brainTable.cellOptions("legion", false), ["Titans"]);
    assert.deepEqual(brainTable.cellOptions("mla", false), [
      "Titans",
      "Penchant",
    ]);
    // Undefined means "not asked", not "classic".
    assert.deepEqual(brainTable.cellOptions("legion", undefined), [
      "Titans",
      "Queller",
    ]);
  });
});

describe("seedRow", () => {
  it("carries the war-wide choice over, coerced where unsupported", () => {
    assert.deepEqual(brainTable.seedRow("legion", "Queller", "Penchant"), {
      enemy: "Queller",
      ally: "Titans",
    });
    assert.deepEqual(brainTable.seedRow("fixture", "Queller", "Penchant"), {
      enemy: "Titans",
      ally: "Titans",
    });
    assert.deepEqual(brainTable.seedRow("mla", "Penchant", "Queller"), {
      enemy: "Penchant",
      ally: "Queller",
    });
  });
});

describe("rowsFor", () => {
  it("keeps a stored cell that is still offerable and seeds the rest", () => {
    const rows = brainTable.rowsFor(
      { legion: { enemy: "Titans" } },
      ["mla", "legion", "fixture"],
      "Queller",
      "Penchant",
      true
    );

    assert.deepEqual(
      rows.map((row) => row.id),
      ["mla", "legion", "fixture"]
    );
    assert.equal(rows[1].enemy, "Titans"); // stored
    assert.equal(rows[1].ally, "Titans"); // seeded: Penchant coerced
    assert.equal(rows[2].enemy, "Titans"); // seeded: Queller coerced
    assert.deepEqual(rows[1].options, ["Titans", "Queller"]);
    assert.equal(
      rows.some((row) => row.stale),
      false
    );
  });

  it("replaces a stored cell the race cannot run", () => {
    const rows = brainTable.rowsFor(
      { fixture: { enemy: "Queller", ally: "Penchant" } },
      ["fixture"],
      "Titans",
      "Titans",
      true
    );

    assert.equal(rows[0].enemy, "Titans");
    assert.equal(rows[0].ally, "Titans");
  });

  it("drops a stored Queller when classic content withholds it", () => {
    const rows = brainTable.rowsFor(
      { legion: { enemy: "Queller", ally: "Queller" } },
      ["legion"],
      "Queller",
      "Queller",
      false
    );

    assert.equal(rows[0].enemy, "Titans");
    assert.deepEqual(rows[0].options, ["Titans"]);
  });

  it("appends a stored race no longer listed as a disabled row", () => {
    const rows = brainTable.rowsFor(
      { bugs: { enemy: "Titans", ally: "Titans" } },
      ["mla", "legion"],
      "Titans",
      "Titans",
      true
    );

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[2], {
      id: "bugs",
      stale: true,
      options: ["Titans"],
      enemy: "Titans",
      ally: "Titans",
    });
  });

  it("seeds every row from nothing stored", () => {
    const rows = brainTable.rowsFor(
      undefined,
      ["mla", "legion"],
      "Penchant",
      "Titans",
      true
    );

    assert.deepEqual(rows[0], {
      id: "mla",
      stale: false,
      options: ["Titans", "Queller", "Penchant"],
      enemy: "Penchant",
      ally: "Titans",
    });
    assert.equal(rows[1].enemy, "Titans"); // Penchant does not know Legion
  });
});

describe("resolve", () => {
  const table = {
    legion: { enemy: "Queller", ally: "Titans" },
    fixture: { enemy: "Queller", ally: "Penchant" },
  };

  it("answers from the race's row, per side", () => {
    assert.equal(
      brainTable.resolve(table, "Penchant", "Penchant", "enemy", "legion"),
      "Queller"
    );
    assert.equal(
      brainTable.resolve(table, "Penchant", "Penchant", "ally", "legion"),
      "Titans"
    );
  });

  it("coerces a row the race cannot run", () => {
    assert.equal(
      brainTable.resolve(table, "Titans", "Titans", "enemy", "fixture"),
      "Titans"
    );
    assert.equal(
      brainTable.resolve(table, "Titans", "Titans", "ally", "fixture"),
      "Titans"
    );
  });

  it("routes MLA to the war-wide strings, never the table", () => {
    const trap = { mla: { enemy: "Titans", ally: "Titans" } };

    assert.equal(
      brainTable.resolve(trap, "Penchant", "Queller", "enemy", "mla"),
      "Penchant"
    );
    assert.equal(
      brainTable.resolve(trap, "Penchant", "Queller", "ally", "mla"),
      "Queller"
    );
    assert.equal(
      brainTable.resolve(trap, "Penchant", undefined, "ally", undefined),
      "Penchant"
    );
  });

  it("falls back to the strings for a race with no row, then to Titans", () => {
    assert.equal(
      brainTable.resolve({}, "Queller", undefined, "enemy", "legion"),
      "Queller"
    );
    assert.equal(
      brainTable.resolve({}, "Penchant", undefined, "enemy", "legion"),
      "Titans"
    );
    assert.equal(
      brainTable.resolve(undefined, undefined, undefined, "enemy", "legion"),
      "Titans"
    );
  });
});

describe("recordFor", () => {
  it("records one coerced row per non-MLA race", () => {
    const record = brainTable.recordFor(
      { legion: { enemy: "Queller", ally: "Penchant" } },
      ["mla", "legion", "fixture"],
      "Penchant",
      "Penchant"
    );

    assert.deepEqual(record, {
      legion: { enemy: "Queller", ally: "Titans" },
      fixture: { enemy: "Titans", ally: "Titans" },
    });
  });

  it("seeds unstored races from the strings and never records MLA", () => {
    const record = brainTable.recordFor(
      undefined,
      ["mla"],
      "Queller",
      "Titans"
    );

    assert.deepEqual(record, {});
  });
});
