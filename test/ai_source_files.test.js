"use strict";

// Real filesystem contract check for the ai_path SOURCE directories this repo
// actually ships (pa/ai_penchant/ in full, and the handful of files GWO shadows
// under pa/ai/). Everything else referee_ai.js/referee_game_files.js read from
// (pa/ai/ in general, pa_ex1/ai_queller/, pa/ai_subcommander/, pa/ai_cluster/) is
// either base-game-owned (not present in this repo - see amd-loader.js's own
// NOT_SHIPPED boundary) or a purely runtime-synthesized virtual mount path with no
// on-disk existence at all. That coverage instead lives in
// test/referee_ai_file_processing.test.js's mocked api.file.list/$.getJSON behavior.
//
// Distinct in purpose from scripts/validate/json-valid.js, which already asserts
// every .json file in the repo parses - this file is a narrower *contract* check
// tied to the exact paths referee_ai.js/referee_game_files.js read from, so a
// rename/move of one of these files fails loudly here instead of surfacing only as
// a confusing runtime 404 in-game.

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
