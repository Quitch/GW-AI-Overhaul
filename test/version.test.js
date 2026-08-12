"use strict";

// shared/version.js and modinfo.json both carry the version and neither can derive
// the other, so a half-finished bump is invisible until a save claims the wrong one.
// This also keeps the release commit's one-line change covered - see testing.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../scripts/lib/amd-loader.js");

const version = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js",
);
const modinfo = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "modinfo.json"), "utf8"),
);

describe("mod version", () => {
  it("matches modinfo.json, which is what the game itself reads", () => {
    assert.equal(version, modinfo.version);
  });

  it("is a bare dotted string, as both consumers concatenate it directly", () => {
    assert.equal(typeof version, "string");
    assert.match(version, /^\d+\.\d+\.\d+$/);
  });
});
