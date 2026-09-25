"use strict";

// shared/brain_table.js: the per-race AI brain table - cell options, row
// seeding, the effective brain per army, and what a war records. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

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
    assert.deepEqual(brainTable.cellOptions("mla"), [
      "Titans",
      "Queller",
      "Penchant",
    ]);
    assert.deepEqual(brainTable.cellOptions("legion"), ["Titans", "Queller"]);
    assert.deepEqual(brainTable.cellOptions("fixture"), ["Titans"]);
  });
});

describe("seedRow", () => {
  it("carries the war-wide choice over, coerced where unsupported", () => {
    assert.deepEqual(brainTable.seedRow("legion", "Queller", "Penchant"), {
      enemy: "Queller",
      ally: "Titans",
      coop: "Queller",
    });
    assert.deepEqual(brainTable.seedRow("fixture", "Queller", "Penchant"), {
      enemy: "Titans",
      ally: "Titans",
      coop: "Titans",
    });
    assert.deepEqual(brainTable.seedRow("mla", "Penchant", "Queller"), {
      enemy: "Penchant",
      ally: "Queller",
      coop: "Penchant",
    });
  });

  it("seeds the co-op cell from its own choice when one is set", () => {
    assert.deepEqual(
      brainTable.seedRow("legion", "Titans", "Titans", "Queller"),
      { enemy: "Titans", ally: "Titans", coop: "Queller" }
    );
    assert.equal(
      brainTable.seedRow("fixture", "Titans", "Titans", "Queller").coop,
      "Titans"
    );
  });
});

describe("rowsFor", () => {
  it("keeps a stored cell that is still offerable and seeds the rest", () => {
    const rows = brainTable.rowsFor(
      { legion: { enemy: "Titans" } },
      ["mla", "legion", "fixture"],
      "Queller",
      "Penchant"
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
      "Titans"
    );

    assert.equal(rows[0].enemy, "Titans");
    assert.equal(rows[0].ally, "Titans");
  });

  it("appends a stored race no longer listed as a disabled row", () => {
    const rows = brainTable.rowsFor(
      { bugs: { enemy: "Titans", ally: "Titans" } },
      ["mla", "legion"],
      "Titans",
      "Titans"
    );

    assert.equal(rows.length, 3);
    assert.deepEqual(rows[2], {
      id: "bugs",
      stale: true,
      options: ["Titans"],
      allyOptions: ["Titans"],
      coopOptions: ["Titans"],
      enemy: "Titans",
      ally: "Titans",
      coop: "Titans",
      coopFollows: true,
    });
  });

  // The ally select binds allyOptions, so a stale row whose brains differ
  // shows its own ally brain rather than the enemy's.
  it("lists each side's own stored brain on a stale row", () => {
    const rows = brainTable.rowsFor(
      { bugs: { enemy: "Queller", ally: "Penchant" } },
      ["mla"],
      "Titans",
      "Titans"
    );

    assert.deepEqual(rows[1].options, ["Queller"]);
    assert.deepEqual(rows[1].allyOptions, ["Penchant"]);
    assert.equal(rows[1].ally, "Penchant");
    // Stored before the co-op column: it follows the opponent.
    assert.deepEqual(rows[1].coopOptions, ["Queller"]);
    assert.equal(rows[1].coop, "Queller");
  });

  it("lists a stale row's own stored co-op brain", () => {
    const rows = brainTable.rowsFor(
      { bugs: { enemy: "Queller", ally: "Penchant", coop: "Titans" } },
      ["mla"],
      "Titans",
      "Titans"
    );

    assert.deepEqual(rows[1].coopOptions, ["Titans"]);
    assert.equal(rows[1].coop, "Titans");
  });

  it("keeps a stored co-op cell, and follows the stored opponent without one", () => {
    const rows = brainTable.rowsFor(
      {
        legion: { enemy: "Titans", ally: "Titans", coop: "Queller" },
        fixture: { enemy: "Titans", ally: "Titans" },
      },
      ["mla", "legion", "fixture"],
      "Penchant",
      "Titans",
      "Queller"
    );

    assert.equal(rows[0].coop, "Queller"); // MLA: the war-wide co-op choice
    assert.equal(rows[1].coop, "Queller"); // stored
    assert.equal(rows[2].coop, "Titans"); // the stored opponent
    assert.deepEqual(rows[1].coopOptions, ["Titans", "Queller"]);
  });

  it("seeds an unstored co-op cell from the opponent's choice when none is set", () => {
    const rows = brainTable.rowsFor(undefined, ["mla", "legion"], "Queller");

    assert.equal(rows[0].coop, "Queller");
    assert.equal(rows[1].coop, "Queller");
  });

  it("seeds every row from nothing stored", () => {
    const rows = brainTable.rowsFor(
      undefined,
      ["mla", "legion"],
      "Penchant",
      "Titans"
    );

    assert.deepEqual(rows[0], {
      id: "mla",
      stale: false,
      options: ["Titans", "Queller", "Penchant"],
      allyOptions: ["Titans", "Queller", "Penchant"],
      coopOptions: ["Titans", "Queller", "Penchant"],
      coopFollows: true,
      enemy: "Penchant",
      ally: "Titans",
      coop: "Penchant",
    });
    assert.equal(rows[1].enemy, "Titans"); // Penchant does not know Legion
  });

  // An unset co-op cell follows the opponent, so the modal must not pin it
  // to whatever the opponent was when it opened.
  it("says which co-op cells follow their opponent", () => {
    const rows = brainTable.rowsFor(
      {
        legion: { enemy: "Queller", ally: "Titans", coop: "Titans" },
        bugs: { enemy: "Titans", ally: "Titans" },
      },
      ["mla", "legion", "bugs"],
      "Titans",
      "Titans"
    );
    assert.deepEqual(
      rows.map((row) => [row.id, row.coopFollows]),
      [
        ["mla", true],
        ["legion", false],
        ["bugs", true],
      ]
    );

    const pinned = brainTable.rowsFor(
      undefined,
      ["mla"],
      "Titans",
      "Titans",
      "Queller"
    );
    assert.equal(pinned[0].coopFollows, false);
    assert.equal(pinned[0].coop, "Queller");
  });

  it("follows the opponent where a stored co-op brain cannot run the race", () => {
    const rows = brainTable.rowsFor(
      { legion: { enemy: "Titans", ally: "Titans", coop: "Penchant" } },
      ["legion"],
      "Titans",
      "Titans"
    );
    assert.equal(rows[0].coopFollows, true);
    assert.equal(rows[0].coop, "Titans");
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

  it("answers the co-op side from the race's co-op cell", () => {
    const withCoop = {
      legion: { enemy: "Titans", ally: "Titans", coop: "Queller" },
    };

    assert.equal(
      brainTable.resolve(withCoop, "Titans", "Titans", "coop", "legion"),
      "Queller"
    );
    assert.equal(
      brainTable.resolve(withCoop, "Titans", "Titans", "enemy", "legion"),
      "Titans"
    );
  });

  // A war saved before the co-op column resolves its co-op side exactly like
  // its enemy side, row by row and for MLA.
  it("resolves a war saved before the co-op column like its enemy side", () => {
    for (const race of ["mla", "legion", "fixture", "bugs"]) {
      assert.equal(
        brainTable.resolve(table, "Penchant", "Titans", "coop", race),
        brainTable.resolve(table, "Penchant", "Titans", "enemy", race),
        race
      );
    }
  });

  it("routes MLA's co-op side to the war-wide co-op string", () => {
    assert.equal(
      brainTable.resolve(table, "Penchant", "Titans", "coop", "mla", "Queller"),
      "Queller"
    );
    // A race with no co-op cell follows its opponent, not the MLA string.
    assert.equal(
      brainTable.resolve(
        table,
        "Penchant",
        "Titans",
        "coop",
        "legion",
        "Titans"
      ),
      "Queller"
    );
    // A race with no row takes the co-op string.
    assert.equal(
      brainTable.resolve({}, "Titans", "Titans", "coop", "legion", "Queller"),
      "Queller"
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
      legion: { enemy: "Queller", ally: "Titans", coop: "Queller" },
      fixture: { enemy: "Titans", ally: "Titans", coop: "Titans" },
    });
  });

  it("records each race's co-op cell, coerced, beside the other two", () => {
    races.register({ id: "bugs" });
    const record = brainTable.recordFor(
      {
        legion: { enemy: "Titans", ally: "Titans", coop: "Queller" },
        fixture: { enemy: "Titans", ally: "Titans", coop: "Queller" },
      },
      ["legion", "fixture", "bugs"],
      "Titans",
      "Titans",
      "Queller"
    );

    assert.deepEqual(record, {
      legion: { enemy: "Titans", ally: "Titans", coop: "Queller" },
      fixture: { enemy: "Titans", ally: "Titans", coop: "Titans" },
      // No row: the war-wide co-op choice, coerced for the race.
      bugs: { enemy: "Titans", ally: "Titans", coop: "Titans" },
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
