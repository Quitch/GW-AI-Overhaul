"use strict";

// Filesystem contract check for the ai_path source directories this repo ships.
// The rest are base-game-owned or runtime-synthesised, and are covered by
// test/referee_ai_file_processing.test.js's mocks instead.
//
// Narrower than validate:json, which only asserts every .json parses: a rename here
// fails loudly rather than surfacing as a runtime 404 in-game.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");

function readJson(relativePath) {
  const fullPath = path.join(REPO_ROOT, relativePath);
  assert.ok(fs.existsSync(fullPath), `expected ${relativePath} to exist`);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

describe("pa/ai_penchant/ - GWO-owned Penchant unit maps", () => {
  it("ai_unit_map.json exists with a top-level unit_map object", () => {
    const json = readJson("pa/ai_penchant/unit_maps/ai_unit_map.json");
    assert.equal(typeof json.unit_map, "object");
    assert.ok(json.unit_map !== null);
  });

  it("ai_unit_map_x1.json exists with a top-level unit_map object", () => {
    const json = readJson("pa/ai_penchant/unit_maps/ai_unit_map_x1.json");
    assert.equal(typeof json.unit_map, "object");
    assert.ok(json.unit_map !== null);
  });
});

describe("pa/ai_penchant/ - AI config", () => {
  // Membership, not key order - a re-minify that reordered the file is not a
  // failure. The shape itself is validate:schemas' job.
  it("ai_config.json exists with only a numeric unit_cap", () => {
    const json = readJson("pa/ai_penchant/ai_config.json");
    assert.deepEqual(Object.keys(json).sort(), ["unit_cap"]);
    assert.equal(typeof json.unit_cap, "number");
  });
});

describe("pa/ai/ - files GWO shadows over the base game", () => {
  const buildListFiles = [
    "pa/ai/fabber_builds/fabber_defense_builds.json",
    "pa/ai/factory_builds/factory_air_builds_additional.json",
    "pa/ai/factory_builds/factory_land_builds.json",
    "pa/ai/factory_builds/factory_land_builds_additional.json",
    "pa/ai/factory_builds/factory_land_builds_x1.json",
    "pa/ai/factory_builds/factory_uc_builds_x1.json",
    "pa/ai/factory_builds/factory_air_builds.json",
  ];

  for (const relativePath of buildListFiles) {
    it(`${relativePath} exists with a top-level build_list array`, () => {
      const json = readJson(relativePath);
      assert.ok(
        Array.isArray(json.build_list),
        "expected build_list to be an array"
      );
    });
  }

  it("pa/ai/platoon_templates/platoon_templates.json exists with a top-level platoon_templates object", () => {
    const json = readJson("pa/ai/platoon_templates/platoon_templates.json");
    assert.equal(typeof json.platoon_templates, "object");
    assert.ok(json.platoon_templates !== null);
  });
});
