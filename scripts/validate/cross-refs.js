"use strict";

// Cross-reference checks entirely within this repo (no base-game install needed, so
// these run anywhere including hosted CI - contrast with a unit-id-vs-base-game-specs
// check, which would need the player's local Steam install and can't run in CI; see
// this repo's docs for that as a separate, local-only script).
//
//   1. Every loadout card id (shared/loadouts.js) has a matching file under
//      ui/main/game/galactic_war/cards/.
//   2. Every `<unitsParam>.someKey` reference in a card that imports shared/units.js
//      actually exists as a key in units.js (a typo here is `undefined` at runtime
//      with no error - e.g. a card silently referencing a nonexistent unit).
//   3. Every `builders` role string in AI build-order JSON resolves against
//      pa/ai_penchant/unit_maps/ai_unit_map.json's unit_map, except a small set of
//      known special-cased literal names (see KNOWN_BUILDER_NAMES below).

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT, loadCouiModule } = require("../lib/amd-loader.js");
const { walkFiles } = require("../lib/walk.js");

const CARDS_DIR = path.join(REPO_ROOT, "ui", "main", "game", "galactic_war", "cards");
const LOADOUTS_PATH = path.join(
  REPO_ROOT,
  "ui",
  "mods",
  "com.pa.quitch.gwaioverhaul",
  "shared",
  "loadouts.js"
);
const UNITS_COUI = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js";
const UNIT_MAP_PATH = path.join(REPO_ROOT, "pa", "ai_penchant", "unit_maps", "ai_unit_map.json");

// Referenced directly in referee_ai.js's clusterAIModsInScopeOfFile() as literal
// commander/support-platform unit names, not resolved through the fabber/factory
// role map - confirmed by grep, not a gap in ai_unit_map.json.
const KNOWN_BUILDER_NAMES = new Set(["SupportCommander", "SupportPlatform"]);

const failures = [];
function fail(message) {
  failures.push(message);
}

// Strips `//` line comments before reference extraction - not a real JS parser, so a
// `//` inside a string literal would (harmlessly) also get stripped, but this repo's
// files don't do that near unit references. Without this, a reference intentionally
// commented out (e.g. "// gwoUnit.x - explanation") reads as a live one. Matches up to
// (not through) the next line terminator directly, rather than splitting on "\n" and
// anchoring on $ per line - these files are CRLF, and "." never matches "\r", so a
// $-anchored per-line replace silently fails to reach end-of-line on a \r\n file.
function stripLineComments(src) {
  return src.replace(/\/\/[^\n\r]*/g, "");
}

function checkLoadoutCardsExist() {
  // loadouts.js itself needs shared/gw_common (an unshipped base-game module), so it
  // can't be loaded through the AMD shim - read its source directly instead.
  const src = fs.readFileSync(LOADOUTS_PATH, "utf8");
  const ids = [...src.matchAll(/\bid:\s*"([^"]+)"/g)].map((m) => m[1]);

  if (!ids.length) {
    fail("cross-refs: found no card ids in loadouts.js - the extraction pattern may be stale");
    return;
  }

  for (const id of ids) {
    const cardPath = path.join(CARDS_DIR, id + ".js");
    if (!fs.existsSync(cardPath)) {
      fail('cross-refs: loadouts.js references card id "' + id + '" with no matching file: ' + cardPath);
    }
  }
  console.log("cross-refs: " + ids.length + " loadout card ids checked against cards/.");
}

// Finds the local parameter name a card bound shared/units.js to (by index-matching
// the define() dependency array against the factory's parameter list), rather than
// assuming every card calls it `gwoUnit` - most do, but this doesn't rely on that.
function findUnitsParamName(src) {
  // Negated character classes ([^\]]/[^)]), not lazy dot-all ([\s\S]*?): deps arrays
  // and parameter lists here never contain a literal `]`/`)` in their content, and
  // this avoids the backtracking risk of lazy-matching-across-anything patterns.
  const match = src.match(/define\(\s*\[([^\]]*)\]\s*,\s*function\s*\(([^)]*)\)/);
  if (!match) {
    return null;
  }
  const deps = match[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
  const params = match[2]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const index = deps.indexOf(UNITS_COUI);
  return index === -1 ? null : params[index] || null;
}

function checkUnitReferencesInCards() {
  const units = loadCouiModule(UNITS_COUI);
  const unitKeys = new Set(Object.keys(units));

  const cardFiles = fs.readdirSync(CARDS_DIR).filter((f) => f.endsWith(".js"));
  let checkedCards = 0;
  let checkedRefs = 0;

  for (const file of cardFiles) {
    const src = fs.readFileSync(path.join(CARDS_DIR, file), "utf8");
    const paramName = findUnitsParamName(src);
    if (!paramName) {
      continue; // this card doesn't depend on units.js at all
    }
    checkedCards++;

    const escaped = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const refPattern = new RegExp("\\b" + escaped + "\\.([A-Za-z_$][A-Za-z0-9_$]*)", "g");
    const referenced = new Set(
      [...stripLineComments(src).matchAll(refPattern)].map((m) => m[1])
    );

    for (const key of referenced) {
      checkedRefs++;
      if (!unitKeys.has(key)) {
        fail(
          "cross-refs: " + file + " references " + paramName + "." + key +
            ", which does not exist in units.js"
        );
      }
    }
  }

  console.log(
    "cross-refs: " + checkedRefs + " unit references across " + checkedCards +
      " cards checked against units.js (" + unitKeys.size + " known units)."
  );
}

function checkBuilderRoles() {
  const unitMap = JSON.parse(fs.readFileSync(UNIT_MAP_PATH, "utf8")).unit_map;
  const roleKeys = new Set(Object.keys(unitMap));

  const aiDirs = ["ai", "ai_penchant", "ai_tech"].map((d) => path.join(REPO_ROOT, "pa", d));
  const files = aiDirs.flatMap((dir) =>
    fs.existsSync(dir) ? walkFiles(dir, (name) => name.endsWith(".json")) : []
  );

  let checked = 0;
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(data.build_list)) {
      continue;
    }
    for (const entry of data.build_list) {
      for (const builder of entry.builders || []) {
        checked++;
        if (!roleKeys.has(builder) && !KNOWN_BUILDER_NAMES.has(builder)) {
          fail(
            "cross-refs: " +
              path.relative(REPO_ROOT, file) +
              ' build_list entry "' +
              entry.name +
              '" has unresolvable builder role "' +
              builder +
              '"'
          );
        }
      }
    }
  }

  console.log("cross-refs: " + checked + " builder role references checked against ai_unit_map.json.");
}

function main() {
  checkLoadoutCardsExist();
  checkUnitReferencesInCards();
  checkBuilderRoles();

  console.log("cross-refs: " + failures.length + " problems.");
  if (failures.length) {
    console.error("");
    failures.forEach((f) => console.error("  - " + f));
    process.exitCode = 1;
  }
}

main();
