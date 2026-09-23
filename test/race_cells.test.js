"use strict";

// shared/race_cells.js signatureOf: the cache key for a unit list read, which
// decides whether a later caller may reuse an earlier read's specs and cells.
// The rest of the file is fetch glue.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const { signatureOf } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_cells.js"
);

describe("signatureOf", () => {
  // The old key was the count and the joined length, so swapping a unit for
  // one whose path had the same length served the old list's cells.
  it("differs for a list with the same count and total length", () => {
    assert.notEqual(
      signatureOf(["/pa/units/a.json", "/pa/units/b.json"]),
      signatureOf(["/pa/units/a.json", "/pa/units/c.json"])
    );
  });
});
