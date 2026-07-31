"use strict";

// `shared/version.js` and `modinfo.json` both carry the mod version: the first is what
// the war information panel shows and what gets stamped into new war saves, the second
// is what the game itself reads. Neither can be derived from the other at runtime, so
// version.js's comment tells contributors to bump both together when cutting a release
// - this is the check that they actually did. A half-finished bump is invisible until a
// save written by one version claims to be the other.
//
// It also keeps the release commit's one-line version change covered: the SonarCloud
// new-code baseline is the previous version, so a bump always lands inside the new-code
// period, and an uncovered one drags "Coverage on New Code" to 0% on its own.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../scripts/lib/amd-loader.js");

const version = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js"
);
const modinfo = JSON.parse(
  fs.readFileSync(path.join(REPO_ROOT, "modinfo.json"), "utf8")
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
