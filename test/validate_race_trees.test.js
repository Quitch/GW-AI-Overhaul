"use strict";

// scripts/validate-race-trees.js, run end to end over a fixture install: a
// minimal media folder and one race's server mod, so CI catches the validator
// breaking without the real install. See testing.md, "The validators".

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const SCRIPT = path.join(__dirname, "..", "scripts", "validate-race-trees.js");
const RACE_MOD = "com.pa.nik.exiles";

function writeJson(root, rel, json) {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(json));
}

function buildFixture(dir) {
  const media = path.join(dir, "media");
  const userData = path.join(dir, "user_data");
  const base = path.join(media, "pa");
  writeJson(base, "ai/unit_maps/ai_unit_map.json", { unit_map: {} });
  writeJson(base, "ai/unit_maps/ai_unit_map_x1.json", { unit_map: {} });
  writeJson(base, "ai/fabber_builds/fixture_fabber.json", { build_list: [] });
  fs.mkdirSync(path.join(media, "pa_ex1"), { recursive: true });

  const mod = path.join(userData, "server_mods", RACE_MOD, "pa");
  writeJson(mod, "ai/unit_maps/exiles.json", { unit_map: {} });
  writeJson(mod, "ai/fabber_builds/exiles/fixture.json", { build_list: [] });
  writeJson(mod, "ai/factory_builds/exiles/fixture.json", { build_list: [] });
  writeJson(mod, "ai/platoon_builds/exiles/fixture.json", {
    build_list: [{ to_build: "FixturePlatoon" }],
  });
  writeJson(mod, "ai/platoon_templates/exiles/fixture.json", {
    platoon_templates: { FixturePlatoon: {} },
  });
  return { media, userData };
}

describe("validate-race-trees.js", () => {
  let dir;
  let run;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-race-trees-"));
    const { media, userData } = buildFixture(dir);
    run = spawnSync(process.execPath, [SCRIPT], {
      encoding: "utf8",
      env: Object.assign({}, process.env, {
        PA_MEDIA: media,
        PA_USER_DATA: userData,
      }),
    });
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("runs every check over a fixture install and passes", () => {
    assert.equal(run.status, 0, run.stderr + run.stdout);
    for (const line of [
      /^exiles: \d+ files match the manual merge exactly$/m,
      /^mla: \d+ files match the manual merge exactly$/m,
      /^exiles: no other layer's files among \d+ with every mod mounted$/m,
      /^exiles: all 1 platoon builds find their template$/m,
      /^exiles: descriptor matches the files on disk$/m,
    ]) {
      assert.match(run.stdout, line);
    }
  });

  it("explains the empty unit list once instead of warning per run", () => {
    assert.doesNotMatch(
      run.stderr + run.stdout,
      /gwoRaces: no \S+ unit in the unit list read/
    );
    const banner = run.stdout.match(
      /^Running without capability cells: the unit list is deliberately empty$/gm
    );
    assert.equal((banner || []).length, 1, run.stdout);
  });

  it("reads no race but the fixture's", () => {
    assert.doesNotMatch(run.stdout, /^(legion|bugs):/m);
  });
});
