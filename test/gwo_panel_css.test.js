"use strict";

// gw_play/gwo_panel.css against the panel's markup: a section that lists
// what stops the war playing as it was built has red rows, and its heading
// is red with them.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");

const PANEL = path.join(
  REPO_ROOT,
  "ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_panel"
);
const html = fs.readFileSync(PANEL + ".html", "utf8");
const css = fs
  .readFileSync(PANEL + ".css", "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "");

// { selector: colour } for every rule that sets one.
function colours() {
  const found = {};
  for (const [, selectors, body] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    const colour = /(?:^|;)\s*color:\s*([^;]+);/.exec(body);
    if (!colour) {
      continue;
    }
    for (const selector of selectors.split(",")) {
      found[selector.trim()] = colour[1].trim();
    }
  }
  return found;
}

// The id of each heading whose section's rows carry `rowClass`.
function headingsOver(rowClass) {
  return html
    .split("<h3")
    .slice(1)
    .filter((section) => section.includes(rowClass))
    .map((section) => /id="([^"]+)"/.exec(section.split(">")[0]))
    .filter(Boolean)
    .map((match) => match[1]);
}

describe("gwo_panel.css", () => {
  it("colours each heading as red as the missing rows under it", () => {
    const bySelector = colours();
    const rowColour = bySelector[".gwo-info .data.gwo-race-missing"];
    const headings = headingsOver("gwo-race-missing");

    assert.ok(rowColour);
    assert.deepEqual(headings, ["missing-races", "missing-map-packs"]);
    for (const id of headings) {
      assert.equal(bySelector["#" + id], rowColour, id);
    }
  });
});
