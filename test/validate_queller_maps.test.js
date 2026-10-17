"use strict";

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const {
  TIERS,
  shadowRel,
  baseRels,
  checkShadow,
  diffObjects,
} = require("../scripts/lib/queller-maps.js");

const REPO_ROOT = path.join(__dirname, "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "validate-queller-maps.js");

const BASE = {
  unit_map: {
    BasicFabber: { unit_types: "Fabber & Basic" },
    LandMine: { spec_id: "/pa/units/land/land_mine/land_mine.json" },
  },
};
const MLA = {
  unit_map: { AnyMLAAirFactory: { unit_types: "Factory & Air & Custom58" } },
};

function merged() {
  return {
    unit_map: Object.assign(
      structuredClone(BASE.unit_map),
      structuredClone(MLA.unit_map)
    ),
  };
}

describe("queller-maps checkShadow", () => {
  it("passes the base map merged with mla.json", () => {
    assert.deepEqual(checkShadow(BASE, MLA, merged()), []);
  });

  it("names a missing key", () => {
    const shadow = merged();
    delete shadow.unit_map.AnyMLAAirFactory;
    assert.deepEqual(checkShadow(BASE, MLA, shadow), [
      "missing key: unit_map.AnyMLAAirFactory",
    ]);
  });

  it("names an extra key", () => {
    const shadow = merged();
    shadow.unit_map.Extra = { unit_types: "Extra" };
    assert.deepEqual(checkShadow(BASE, MLA, shadow), [
      "extra key: unit_map.Extra",
    ]);
  });

  it("names a differing value by its full path", () => {
    const shadow = merged();
    shadow.unit_map.LandMine.spec_id = "/pa/units/changed.json";
    assert.deepEqual(checkShadow(BASE, MLA, shadow), [
      'value differs: unit_map.LandMine.spec_id (expected "/pa/units/land/land_mine/land_mine.json", found "/pa/units/changed.json")',
    ]);
  });

  it("flags an mla.json entry the base map also has", () => {
    const mla = { unit_map: { LandMine: { unit_types: "Mine" } } };
    const shadow = structuredClone(BASE);
    shadow.unit_map.LandMine = mla.unit_map.LandMine;
    assert.deepEqual(checkShadow(BASE, mla, shadow), [
      "mla.json entry also in the base map: unit_map.LandMine",
    ]);
  });

  it("flags an mla.json key besides unit_map", () => {
    const mla = Object.assign({ other: 1 }, MLA);
    assert.deepEqual(checkShadow(BASE, mla, merged()), [
      "mla.json has a key besides unit_map: other",
    ]);
  });
});

describe("queller-maps diffObjects", () => {
  it("reports nothing for equal objects in a different key order", () => {
    assert.deepEqual(diffObjects("", { a: 1, b: [2] }, { b: [2], a: 1 }), []);
  });
});

describe("validate-queller-maps.js", () => {
  let dir;

  before(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "gwo-queller-maps-"));
  });

  after(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function run(media) {
    return spawnSync(process.execPath, [SCRIPT], {
      encoding: "utf8",
      env: Object.assign({}, process.env, { PA_MEDIA: media }),
    });
  }

  it("passes over a fixture install built from GWO's own copies", () => {
    const media = path.join(dir, "media");
    for (const tier of TIERS) {
      const shadow = JSON.parse(
        fs.readFileSync(path.join(REPO_ROOT, shadowRel(tier)), "utf8")
      );
      const base = { unit_map: {} };
      const mla = { unit_map: {} };
      for (const [key, value] of Object.entries(shadow.unit_map)) {
        (key.startsWith("AnyMLA") ? mla : base).unit_map[key] = value;
      }
      const rels = baseRels(tier);
      for (const [rel, json] of [
        [rels.map, base],
        [rels.mla, mla],
      ]) {
        fs.mkdirSync(path.dirname(path.join(media, rel)), { recursive: true });
        fs.writeFileSync(path.join(media, rel), JSON.stringify(json));
      }
    }
    const result = run(media);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.match(result.stdout, /q_uber.* \d+ entries match the merge exactly/);
    assert.match(result.stdout, /q_bronze.*q_uber.*: identical/);
  });

  it("fails with the path when the install is missing", () => {
    const result = run(path.join(dir, "nowhere"));
    assert.equal(result.status, 1);
    assert.match(result.stderr, /PA install not found at .*nowhere/);
  });
});
