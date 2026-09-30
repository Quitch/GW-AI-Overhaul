"use strict";

// scripts/lib/loc-keys.js: what counts as a key, and how each site is read.
// The sources are handed in, so no test depends on the shipped tree's text.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");
const { extractFrom } = require("../scripts/lib/loc-keys.js");

const PANEL = "ui/mods/com.pa.quitch.gwaioverhaul/gw_start/test_panel.html";
const RACE = "ui/mods/com.pa.quitch.gwaioverhaul/race/test_race.js";
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

describe("HTML controls", () => {
  it("keys an option's text and a button's value as locTree looks them up", () => {
    const keys = extractFrom([
      at(PANEL, [
        "<select>",
        '  <option value="0.35">DIRE</option>',
        '  <option value="1"',
        "    >  Slower &amp; Steadier  </option",
        "  >",
        "  <option>Unclosed",
        "</select>",
        '<input type="button" value=" Reroll Tech " data-bind="visible: a > b" />',
      ]),
    ]);

    assert.deepEqual(
      ["DIRE", "Slower & Steadier", "Unclosed", "Reroll Tech"].map((key) =>
        sitesOf(keys, key).map((site) => [site.role, site.line])
      ),
      [
        [["html-control", 2]],
        [["html-control", 3]],
        [["html-control", 6]],
        [["html-control", 8]],
      ]
    );
  });

  it("skips what locTree skips, which a bare noloc on a button is not", () => {
    const keys = extractFrom([
      at(PANEL, [
        "<select>",
        '  <option data-noloc value="1">Kept English</option>',
        '  <option data-noloc="true">Also English</option>',
        "  <!-- <option>Commented Out</option> -->",
        "</select>",
        '<input type="button" noloc="true" value="Not Looked Up" />',
        '<input type="button" noloc value="Looked Up" />',
        '<input type="text" value="Typed" />',
        '<input type="BUTTON" value="Shouted" />',
      ]),
    ]);

    assert.deepEqual(Array.from(keys.keys()), ["Looked Up", "Shouted"]);
  });

  it("leaves out text with no letter in it", () => {
    const keys = extractFrom([
      at(PANEL, [
        "<select>",
        '  <option value="0">0%</option>',
        '  <option value="1">1</option>',
        '  <option value="0.1">0.1</option>',
        '  <option value="0.49">3 - FASTER RAMP UP</option>',
        "</select>",
      ]),
    ]);

    assert.deepEqual(Array.from(keys.keys()), ["3 - FASTER RAMP UP"]);
  });
});

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
    // The second literal sits 600 characters (the role window) after its
    // name:, so the window starts inside display_name.
    const keys = extractFrom([
      at(CARD, [
        "define([], function () {",
        '  var unit = { display_name: "!LOC:Loose Unit" };',
        "  var far = { display_name:" + " ".repeat(595) + '"!LOC:Far Unit" };',
        "  return unit;",
        "});",
      ]),
    ]);

    assert.equal(sitesOf(keys, "Loose Unit")[0].role, "loc-call");
    assert.equal(sitesOf(keys, "Far Unit")[0].role, "loc-call");
  });
});

describe("race unit names", () => {
  const race = at(RACE, [
    "define({",
    '  id: "test",',
    '  name: "!LOC:Testers",',
    "  unitNames: {",
    '    hive: "!LOC:Hive",',
    '    boomer: "!LOC:Boomer",',
    "  },",
    "});",
  ]);
  const elsewhere = at("ui/mods/test/a.js", ['loc("!LOC:Boomer");']);

  it("leaves them out unless keepExcluded is set", () => {
    const sites = (keys, key) =>
      sitesOf(keys, key).map((site) => [site.file, site.role]);

    const catalogued = extractFrom([race, elsewhere]);
    assert.deepEqual(Array.from(catalogued.keys()), ["Testers", "Boomer"]);
    assert.deepEqual(sites(catalogued, "Boomer"), [
      ["ui/mods/test/a.js", "loc-call"],
    ]);

    const all = extractFrom([race, elsewhere], { keepExcluded: true });
    assert.deepEqual(sites(all, "Hive"), [[RACE, "race-unit-name"]]);
    assert.deepEqual(
      sites(all, "Boomer").map((site) => site[1]),
      ["race-unit-name", "loc-call"]
    );
  });
});

describe("site order", () => {
  // B sorts before a by code unit, and after it under localeCompare.
  it("orders a key's sites by file in code-unit order, then by line", () => {
    const keys = extractFrom([
      at("ui/mods/test/a.js", ['loc("!LOC:Shared");', 'loc("!LOC:Shared");']),
      at("ui/mods/test/B.js", ['loc("!LOC:Shared");']),
    ]);

    assert.deepEqual(
      sitesOf(keys, "Shared").map((site) => [site.file, site.line]),
      [
        ["ui/mods/test/B.js", 1],
        ["ui/mods/test/a.js", 1],
        ["ui/mods/test/a.js", 2],
      ]
    );
  });
});
