"use strict";

// Structural schema checks for the mod's declarative data: AI build-order JSON
// (pa/ai*/**/*.json) and the difficulty/personality tuning tables (JS data files
// wrapped in define({...})). None of this data has a formal schema anywhere else, so
// these checks are the only thing that would catch a typo'd field name or a
// wrong-typed value before it silently misbehaves in-game.
//
// Empirically tallied across the full corpus (573 build_list entries / 141
// platoon_templates entries / 119 unit_map entries, all 85 pa/ai*/**/*.json files):
//   - build_list: name/instance_count/priority/build_conditions are on every entry.
//     to_build is on 566/573 - the 7 without it are non-unit "action" entries (e.g.
//     "Teleport Commander To Planet", "Fabber Assist"), not a bug, so it's optional.
//   - platoon_templates: every entry has `units` (array).
//   - unit_map: every entry has exactly one of unit_types or spec_id.
// difficulty_levels.js/personalities.js entries don't share a single fixed key set
// (e.g. the difficulties list ends in a minimal {difficultyName, customDifficulty}
// "Custom" sentinel with none of the other ~25 tier fields) - so rather than a
// required-field list that would false-positive on legitimate minimal entries, these
// are checked for type *consistency*: any field that appears with more than one
// typeof across entries that have it is almost certainly a typo (e.g. a numeric
// field accidentally quoted as a string on one tier).

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../lib/amd-loader.js");
const { walkFiles } = require("../lib/walk.js");

const failures = [];

function fail(where, message) {
  failures.push(where + ": " + message);
}

function valueType(value) {
  return Array.isArray(value) ? "array" : typeof value;
}

// Flags any field whose typeof is inconsistent across the entries that have it.
// Robust to entries legitimately having different, non-overlapping field sets.
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

function checkAiJsonFiles() {
  const aiDirs = ["ai", "ai_penchant", "ai_tech"].map((d) =>
    path.join(REPO_ROOT, "pa", d)
  );
  const files = aiDirs.flatMap((dir) =>
    fs.existsSync(dir) ? walkFiles(dir, (name) => name.endsWith(".json")) : []
  );

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
    } else {
      fail(
        where,
        "unrecognized top-level shape (expected build_list, platoon_templates, or unit_map)"
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
  if (failures.length) {
    console.error("");
    failures.forEach((f) => console.error("  - " + f));
    process.exitCode = 1;
  }
}

main();
