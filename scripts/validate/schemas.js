"use strict";

// Structural checks for the mod's declarative data, which has no schema anywhere
// else. See testing.md.
//
//   - build_list: every entry has name/instance_count/priority/build_conditions.
//     to_build is optional - some entries are non-unit "action" entries.
//   - platoon_templates: every entry has `units` (array).
//   - unit_map: every entry has exactly one of unit_types or spec_id.
//   - unit_cap (ai_config.json): the whole file is one numeric `unit_cap` key.
//
// difficulty_levels.js and personalities.js entries share no fixed key set - the
// "Custom" sentinel carries two of ~25 fields - so a required-field list would
// false-positive. They are checked for type consistency across entries instead.

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../lib/amd-loader.js");
const { reportProblems } = require("../lib/report-failures.js");
const { aiDataFiles } = require("../lib/walk.js");

// Every `test_type` the engine implements, harvested from media/pa/ai/ and
// media/pa_ex1/ai_queller/. Re-harvest after a PA patch adds tests. An entry with
// an unrecognised test silently never fires. See testing.md.
const KNOWN_TEST_TYPES = new Set([
  "AllMetalSpotsFull",
  "AlliedUnitCountOnPlanet",
  "AloneOnPlanet",
  "BaseThreat",
  "BaseThreatRatio",
  "BaseThreatened",
  "CanAffordBuildDemand",
  "CanAffordPotentialDrain",
  "CanAttackWithPoolUnits",
  "CanAttackWithPoolUnitsBomber",
  "CanAttackWithPoolUnitsFighter",
  "CanAttackWithPoolUnitsLand",
  "CanDeployLandFromBase",
  "CanDeployNavalFromBase",
  "CanFindControlPointToBuild",
  "CanFindMetalSpotToBuildAdvanced",
  "CanFindMetalSpotToBuildBasic",
  "CanFindPlaceToBuild",
  "CanProvideAirSupportWithPoolUnits",
  "CanProvideLandUnitAssistance",
  "CurrentEnergyEfficiency",
  "CurrentMetalEfficiency",
  "DesireEnergy",
  "DesireMetal",
  "DistFromMainBase",
  "DistFromNearestEnemyThreat",
  "EnemyAirPresenceOnPlanet",
  "EnemyOrbitalPresenceOnPlanet",
  "EnemyPresenceOnPlanet",
  "EnemySurfacePresenceOnPlanet",
  "EnergyStorageFrac",
  "EnergyStorageToProductionRatio",
  "FactoryHasOpenSlot",
  "FactorySlotsEmpty",
  "FocusTargetThreat",
  "FocusTargetThreatRatio",
  "HasPersonalityTag",
  "HaveEcoForAdvanced",
  "HaveFullPlanetIntel",
  "HaveHadANukeEvent",
  "HaveSeenEnemyUnits",
  "HaveThrustToMovePlanet",
  "MetMinAdvancedFabberCount",
  "MetMinBasicFabberCount",
  "MetalStorageFrac",
  "MetalStorageToProductionRatio",
  "NeedAdvancedAirFabber",
  "NeedAdvancedAirFactory",
  "NeedAdvancedBotFabber",
  "NeedAdvancedBotFactory",
  "NeedAdvancedNavalFactory",
  "NeedAdvancedVehicleFabber",
  "NeedAdvancedVehicleFactory",
  "NeedBasicAirFabber",
  "NeedBasicAirFactory",
  "NeedBasicBotFabber",
  "NeedBasicBotFactory",
  "NeedBasicNavalFactory",
  "NeedBasicVehicleFabber",
  "NeedBasicVehicleFactory",
  "NeedOrbitalFactory",
  "NeedOrbitalLauncher",
  "OtherPlanetCanProvideLandUnitAssistance",
  "OtherPlanetCanReceiveLandUnitAssistance",
  "OtherPlanetNeedsLandUnitAssistance",
  "OtherPlanetNeedsOrbitalUnitAssistance",
  "OtherPlanetNeedsReconAssistance",
  "PlanetCanBeUsedAsKineticWeapon",
  "PlanetCount",
  "PlanetHasUseablePlanetWeapon",
  "PlanetHighestEnemyArmyThreat",
  "PlanetHighestEnemyArmyThreatRatio",
  "PlanetIsGasGiant",
  "PlanetIsMainEcoBase",
  "PlanetIsRespawnable",
  "PlanetOrGasGiantWithoutPresence",
  "PlanetThreat",
  "PlanetWithoutFabberWithTeleporter",
  "PlanetWithoutPresence",
  "PotentialEnergyEfficiency",
  "PotentialMetalEfficiency",
  "PresenceOnOtherPlanet",
  "SafePlanetOrGasGiantWithoutPresence",
  "SystemThreat",
  "SystemToPlanetThreatRatio",
  "ThisPlanetNeedsLandUnitAssistance",
  "ThisPlanetNeedsOrbitalUnitAssistance",
  "ThisPlanetNeedsReconAssistance",
  "UnableToExpand",
  "UnitCount",
  "UnitCountAroundBase",
  "UnitCountInBase",
  "UnitCountInCelestialTransit",
  "UnitCountOnPlanet",
  "UnitCountPerPlanetRadius",
  "UnitCountonPlanet",
  "UnitPoolCount",
  "UnitRatioOnPlanet",
  "WantCommanderOffPlanet",
  "WantCommanderOffPlanetByTeleporter",
]);

const failures = [];

function fail(where, message) {
  failures.push(where + ": " + message);
}

function valueType(value) {
  return Array.isArray(value) ? "array" : typeof value;
}

function checkTypeConsistency(where, entries) {
  const typesByKey = {};
  for (const entry of entries) {
    for (const [key, value] of Object.entries(entry)) {
      typesByKey[key] = typesByKey[key] || new Set();
      typesByKey[key].add(valueType(value));
    }
  }
  for (const [key, types] of Object.entries(typesByKey)) {
    if (types.size > 1) {
      fail(
        where,
        "field `" +
          key +
          "` has inconsistent types across entries: " +
          [...types].join(", ")
      );
    }
  }
}

function checkBuildConditions(where, entryLabel, buildConditions) {
  if (!Array.isArray(buildConditions)) {
    fail(where, entryLabel + ": build_conditions must be an array");
    return;
  }
  buildConditions.forEach((testArray, i) => {
    if (!Array.isArray(testArray)) {
      fail(
        where,
        entryLabel + ": build_conditions[" + i + "] must be an array"
      );
      return;
    }
    testArray.forEach((test, j) => {
      if (typeof test !== "object" || test === null) {
        fail(
          where,
          entryLabel +
            ": build_conditions[" +
            i +
            "][" +
            j +
            "] must be an object"
        );
      } else if (typeof test.test_type !== "string") {
        fail(
          where,
          entryLabel +
            ": build_conditions[" +
            i +
            "][" +
            j +
            "] missing string `test_type`"
        );
      } else if (!KNOWN_TEST_TYPES.has(test.test_type)) {
        fail(
          where,
          entryLabel +
            ": build_conditions[" +
            i +
            "][" +
            j +
            '] unknown test_type "' +
            test.test_type +
            '" - the engine ignores it, so the condition group can never validate'
        );
      }
    });
  });
}

function checkBuildListFile(where, data) {
  checkTypeConsistency(where, data.build_list);
  data.build_list.forEach((entry, i) => {
    const label = "build_list[" + i + "] (" + (entry.name || "?") + ")";
    if (typeof entry.name !== "string") {
      fail(where, label + ": missing string `name`");
    }
    if (typeof entry.instance_count !== "number") {
      fail(where, label + ": missing number `instance_count`");
    }
    if (typeof entry.priority !== "number") {
      fail(where, label + ": missing number `priority`");
    }
    checkBuildConditions(where, label, entry.build_conditions);
  });
}

function checkPlatoonTemplatesFile(where, data) {
  const entries = Object.entries(data.platoon_templates);
  checkTypeConsistency(
    where,
    entries.map(([, v]) => v)
  );
  for (const [name, entry] of entries) {
    if (!Array.isArray(entry.units) || entry.units.length === 0) {
      fail(
        where,
        'platoon_templates["' + name + '"]: missing non-empty `units` array'
      );
      continue;
    }
    entry.units.forEach((unit, i) => {
      if (typeof unit.unit_types !== "string") {
        fail(
          where,
          'platoon_templates["' +
            name +
            '"].units[' +
            i +
            "]: missing string `unit_types`"
        );
      }
    });
  }
}

function checkUnitMapFile(where, data) {
  for (const [name, entry] of Object.entries(data.unit_map)) {
    const hasUnitTypes = typeof entry.unit_types === "string";
    const hasSpecId = typeof entry.spec_id === "string";
    if (hasUnitTypes === hasSpecId) {
      fail(
        where,
        'unit_map["' +
          name +
          '"]: must have exactly one of string `unit_types` or `spec_id`, has ' +
          (hasUnitTypes ? "both" : "neither")
      );
    }
  }
}

function checkAiConfigFile(where, data) {
  const keys = Object.keys(data);
  if (keys.length !== 1 || keys[0] !== "unit_cap") {
    fail(where, "expected exactly one key `unit_cap`, got: " + keys.join(", "));
  }
}

function checkAiJsonFiles() {
  const files = aiDataFiles();

  let checked = 0;
  for (const file of files) {
    const where = path.relative(REPO_ROOT, file);
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
      continue; // reported by validate:json already
    }

    if (Array.isArray(data.build_list)) {
      checkBuildListFile(where, data);
      checked++;
    } else if (
      data.platoon_templates &&
      typeof data.platoon_templates === "object"
    ) {
      checkPlatoonTemplatesFile(where, data);
      checked++;
    } else if (data.unit_map && typeof data.unit_map === "object") {
      checkUnitMapFile(where, data);
      checked++;
    } else if (typeof data.unit_cap === "number") {
      checkAiConfigFile(where, data);
      checked++;
    } else {
      fail(
        where,
        "unrecognized top-level shape (expected build_list, platoon_templates, unit_map, or unit_cap)"
      );
    }
  }

  console.log(
    "schemas: " + checked + " / " + files.length + " AI JSON files checked."
  );
}

function checkDifficultyLevels() {
  const where =
    "ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js";
  const data = loadCouiModule("coui://" + where);

  if (!Array.isArray(data.difficulties) || data.difficulties.length === 0) {
    fail(where, "missing non-empty `difficulties` array");
    return;
  }

  for (const [i, tier] of data.difficulties.entries()) {
    const label =
      "difficulties[" + i + "] (" + (tier.difficultyName || "?") + ")";
    if (typeof tier.difficultyName !== "string") {
      fail(where, label + ": missing string `difficultyName`");
    }
    if (typeof tier.customDifficulty !== "boolean") {
      fail(where, label + ": missing boolean `customDifficulty`");
    }
  }

  checkTypeConsistency(where, data.difficulties);
  console.log(
    "schemas: difficulty_levels.js checked (" +
      data.difficulties.length +
      " tiers)."
  );
}

function checkPersonalities() {
  const where = "ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js";
  const data = loadCouiModule("coui://" + where);
  const entries = Object.values(data);

  checkTypeConsistency(where, entries);
  console.log(
    "schemas: personalities.js checked (" + entries.length + " personalities)."
  );
}

function main() {
  checkAiJsonFiles();
  checkDifficultyLevels();
  checkPersonalities();

  console.log("schemas: " + failures.length + " problems.");
  reportProblems(failures);
}

main();
