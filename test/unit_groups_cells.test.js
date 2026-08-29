"use strict";

// Validation by construction: the cell classifier reproduces the domain, tier
// and class GWO's unit groups encode by hand, over the harvested unit_types of
// every vanilla unit (test/fixtures/unit_types.json). A group member landing
// elsewhere is either a pinned deviation or a classifier bug. See races.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoGroup = loadCouiModule(MOD_ROOT + "/shared/unit_groups.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const fixture = require("./fixtures/unit_types.json").units;

// "*" matches any value of that part; "|" separates alternatives.
const EXPECTED = {
  botsBasicCombat: "Bot/Basic/Combat",
  botsAdvancedCombat: "Bot/Advanced/Combat",
  vehiclesBasicCombat: "Vehicle/Basic/Combat",
  vehiclesAdvancedCombat: "Vehicle/Advanced/Combat",
  airBasicCombat: "Air/Basic/Combat",
  airAdvancedCombat: "Air/Advanced/Combat",
  navalBasicCombat: "Naval/Basic/Combat",
  navalAdvancedCombat: "Naval/Advanced/Combat",
  orbitalBasicCombat: "Orbital/Basic/Combat",
  orbitalAdvancedCombat: "Orbital/Advanced/Combat",
  fabbersBasic: "*/Basic/Fabber",
  fabbersAdvanced: "*/Advanced/Fabber",
  factoriesBasic: "*/Basic/Factory",
  factoriesAdvanced: "*/Advanced/Factory",
  botFactories: "Bot/*/Factory",
  vehicleFactories: "Vehicle/*/Factory",
  airFactories: "Air/*/Factory",
  navalFactories: "Naval/*/Factory",
  orbitalFactories: "Orbital/*/Factory",
  structuresDefencesBasic: "*/Basic/Defense",
  structuresDefencesAdvanced: "*/Advanced/Defense",
  structuresArtillery: "*/*/Defense",
  structuresEcoBasic: "Land/Basic/Metal|Land/Basic/Energy",
  structuresEcoAdvanced: "*/Advanced/Metal|*/Advanced/Energy",
  structuresEcoStorage: "Land/Basic/Storage",
  structuresIntel: "*/*/Intel",
  structuresSuperWeapons: "*/*/Superweapon",
  teleporters: "*/*/Teleporter",
  titans: "*/*/Titan",
};

// Where a group's hand-picked membership and the unit's own types disagree.
// Each is a balance choice of the group, not a fact about the unit.
const DEVIATIONS = {
  botsAdvancedCombat: {
    [gwoUnit.colonel]: "Bot/Advanced/Commander",
    [gwoUnit.mend]: "Bot/Advanced/Fabber",
  },
  navalAdvancedCombat: { [gwoUnit.squall]: "Air/Basic/Combat" },
  fabbersBasic: {
    [gwoUnit.barnacle]: "Naval/Basic/Combat",
    [gwoUnit.stitch]: "Bot/Basic/Combat",
  },
  fabbersAdvanced: {
    [gwoUnit.angel]: "Air/Advanced/Combat",
    [gwoUnit.colonel]: "Bot/Advanced/Commander",
  },
  structuresDefencesBasic: { [gwoUnit.anchor]: "Orbital/Advanced/Defense" },
  structuresEcoAdvanced: { [gwoUnit.jig]: "Orbital/Basic/Metal" },
  // TITANS ships the Deepspace Radar as a stub typed Custom58 only.
  structuresIntel: { [gwoUnit.deepSpaceOrbitalRadar]: "Land/Basic/Structure" },
  teleporters: { [gwoUnit.helios]: "Orbital/Advanced/Titan" },
};

const matches = (pattern, key) =>
  pattern.split("|").some((alternative) => {
    const want = alternative.split("/");
    const got = key.split("/");
    return want.every((part, i) => part === "*" || part === got[i]);
  });

describe("the cell classifier against unit_groups.js", () => {
  for (const [group, pattern] of Object.entries(EXPECTED)) {
    it("puts every member of " + group + " in " + pattern, () => {
      const deviations = DEVIATIONS[group] || {};
      for (const unit of gwoGroup[group]) {
        assert.ok(fixture[unit], unit + " is not in the harvested fixture");
        const key = cells.classify(fixture[unit]).key;
        if (Object.prototype.hasOwnProperty.call(deviations, unit)) {
          assert.equal(key, deviations[unit], unit + " (pinned deviation)");
        } else {
          assert.ok(matches(pattern, key), group + ": " + unit + " -> " + key);
        }
      }
    });
  }

  it("pins no deviation that no longer deviates", () => {
    for (const [group, units] of Object.entries(DEVIATIONS)) {
      for (const unit of Object.keys(units)) {
        assert.ok(gwoGroup[group].includes(unit), group + " lacks " + unit);
        assert.ok(
          !matches(EXPECTED[group], cells.classify(fixture[unit]).key),
          group + ": " + unit + " no longer deviates"
        );
      }
    }
  });

  it("knows every unit units.js names", () => {
    const missing = Object.values(gwoUnit).filter(
      (unit) => /\/units\/.*\/([^/]+)\/\1\.json$/.test(unit) && !fixture[unit]
    );
    assert.deepEqual(missing, []);
  });
});

describe("the harvested fixture", () => {
  const media =
    process.env.PA_MEDIA ||
    "C:/Program Files (x86)/Steam/steamapps/common/Planetary Annihilation Titans/media";

  it("matches the installed game (skipped without one)", (t) => {
    if (!fs.existsSync(path.join(media, "pa", "units", "unit_list.json"))) {
      t.skip("no PA install");
      return;
    }
    const tmp = path.join(__dirname, "fixtures", "unit_types.tmp.json");
    const { execFileSync } = require("node:child_process");
    execFileSync(
      process.execPath,
      [path.join(__dirname, "..", "scripts", "harvest-unit-types.js")],
      { env: Object.assign({}, process.env, { GWO_HARVEST_OUT: tmp }) }
    );
    const fresh = JSON.parse(fs.readFileSync(tmp, "utf8")).units;
    fs.unlinkSync(tmp);
    assert.deepEqual(
      fixture,
      fresh,
      "test/fixtures/unit_types.json is stale: run node scripts/harvest-unit-types.js"
    );
  });
});
