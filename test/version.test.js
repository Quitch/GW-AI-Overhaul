"use strict";

// shared/version.js, modinfo.json and sonar-project.properties all carry the
// version and none can derive another, so a half-finished bump is invisible until
// a save or the Sonar dashboard claims the wrong one. See CONTRIBUTING.md,
// "Releasing".

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

  it("matches sonar.projectVersion, which labels the Sonar analysis", () => {
    const properties = fs.readFileSync(
      path.join(REPO_ROOT, "sonar-project.properties"),
      "utf8"
    );
    const match = properties.match(/^sonar\.projectVersion=(.*)$/m);
    assert.ok(match, "sonar-project.properties sets sonar.projectVersion");
    assert.equal(match[1].trim(), modinfo.version);
  });

  it("is a bare dotted string, as both consumers concatenate it directly", () => {
    assert.equal(typeof version, "string");
    assert.match(version, /^\d+\.\d+\.\d+$/);
  });
});
