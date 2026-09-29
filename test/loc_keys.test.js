"use strict";

// scripts/lib/loc-keys.js: what counts as a key, and how each site is read.
// The sources are handed in, so no test depends on the shipped tree's text.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");
const { extractFrom } = require("../scripts/lib/loc-keys.js");

const CARD = "ui/main/game/galactic_war/cards/gwaio_test_card.js";

function at(rel, lines) {
  return {
    file: path.join(REPO_ROOT, ...rel.split("/")),
    source: lines.join("\n"),
  };
}

function sitesOf(keys, key) {
  assert.ok(keys.has(key), "no key " + JSON.stringify(key));
  return keys.get(key).sites;
}

describe("card roles", () => {
  it("reads a card mod's display_name and description as the unit's", () => {
    const keys = extractFrom([
      at(CARD, [
        "define([], function () {",
        "  return {",
        '    summarize: _.constant("!LOC:Radar Tech"),',
        '    describe: _.constant("!LOC:Enables the radar."),',
        "    buff: function (inventory) {",
        "      inventory.addMods(",
        "        gwoCard",
        '          .mods(unit, "replace", {',
        '            display_name: "!LOC:Radar",',
        "            description:",
        '              "!LOC:Radar - Sees everything.",',
        "          })",
        "      );",
        "    },",
        "  };",
        "});",
      ]),
    ]);

    assert.deepEqual(
      [
        "Radar Tech",
        "Enables the radar.",
        "Radar",
        "Radar - Sees everything.",
      ].map((key) => sitesOf(keys, key)[0].role),
      ["card-name", "card-description", "loc-call", "loc-call"]
    );
    assert.deepEqual(sitesOf(keys, "Radar Tech")[0].context, {
      card: "gwaio_test_card",
      cardDescriptions: ["Enables the radar."],
    });
  });

  it("does not take the end of a longer property name for a marker", () => {
    const keys = extractFrom([
      at(CARD, [
        "define([], function () {",
        '  var unit = { display_name: "!LOC:Loose Unit" };',
        "  return unit;",
        "});",
      ]),
    ]);

    assert.equal(sitesOf(keys, "Loose Unit")[0].role, "loc-call");
  });
});
