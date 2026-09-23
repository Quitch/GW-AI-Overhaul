"use strict";

// Existence check for the ai_path source files this repo ships. Why shape is
// not asserted here: testing.md, "The validators". The remaining ai_path
// sources are base-game-owned or runtime-synthesised, and
// test/referee_ai_file_processing.test.js's mocks cover them.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../scripts/lib/amd-loader.js");

const REQUIRED_FILES = [
  // GWO-owned Penchant unit maps and AI config.
  "pa/ai_penchant/ai_config.json",
  "pa/ai_penchant/unit_maps/ai_unit_map.json",
  "pa/ai_penchant/unit_maps/ai_unit_map_x1.json",
  // Files GWO shadows over the base game.
  "pa/ai/fabber_builds/fabber_defense_builds.json",
  "pa/ai/factory_builds/factory_air_builds.json",
  "pa/ai/factory_builds/factory_air_builds_additional.json",
  "pa/ai/factory_builds/factory_land_builds.json",
  "pa/ai/factory_builds/factory_land_builds_additional.json",
  "pa/ai/factory_builds/factory_land_builds_x1.json",
  "pa/ai/factory_builds/factory_uc_builds_x1.json",
  "pa/ai/platoon_templates/platoon_templates.json",
];

describe("ai_path source files GWO ships", () => {
  for (const relativePath of REQUIRED_FILES) {
    it(`${relativePath} exists`, () => {
      assert.ok(
        fs.existsSync(path.join(REPO_ROOT, relativePath)),
        `expected ${relativePath} to exist`
      );
    });
  }
});
