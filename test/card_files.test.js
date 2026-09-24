"use strict";

// scripts/lib/card-files.js: the load triage every card sweep shares. A
// NOT_SHIPPED failure is a skip; anything else must come back as an error, or
// a sweep reports real breakage as skipped with the run still green.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCard } = require("../scripts/lib/card-files.js");

describe("loadCard", () => {
  it("returns the card a shipped file defines", () => {
    const loaded = loadCard("gwaio_anti_air.js");
    assert.deepEqual(Object.keys(loaded), ["card"]);
    assert.equal(typeof loaded.card.buff, "function");
  });

  it("skips a card that needs an unshipped base-game module", () => {
    // gwc_combat_air requires shared/gw_common, and this file stubs nothing.
    assert.deepEqual(loadCard("gwc_combat_air.js"), { skip: "notShipped" });
  });

  it("returns any other failure as the error thrown", () => {
    const loaded = loadCard("no_such_card.js");
    assert.deepEqual(Object.keys(loaded), ["error"]);
    assert.ok(loaded.error instanceof Error);
    assert.match(loaded.error.message, /no_such_card\.js/);
  });
});
