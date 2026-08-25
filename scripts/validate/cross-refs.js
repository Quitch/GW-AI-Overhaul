"use strict";

// Cross-reference checks within this repo only, so they run in CI:
//
//   1. Every loadout card id has a file under ui/main/game/galactic_war/cards/.
//   2. Every `<unitsParam>.someKey` reference in a card resolves against units.js.
//      A typo there is `undefined` at runtime, with no error.
//   3. Every `builders` role in AI build-order JSON resolves against the unit map,
//      bar the literals in KNOWN_BUILDER_NAMES.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT, loadCouiModule } = require("../lib/amd-loader.js");
const { CARDS_DIR } = require("../lib/card-files.js");
const { reportProblems } = require("../lib/report-failures.js");
const { aiDataFiles } = require("../lib/walk.js");

const LOADOUT_IDS_COUI =
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js";
const UNITS_COUI = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js";
const UNIT_MAP_PATH = path.join(
  REPO_ROOT,
  "pa",
  "ai_penchant",
  "unit_maps",
  "ai_unit_map.json"
);

// referee_ai.js names these literally rather than resolving them through the
// role map, so their absence from ai_unit_map.json is not a gap.
const KNOWN_BUILDER_NAMES = new Set(["SupportCommander", "SupportPlatform"]);

const failures = [];
function fail(message) {
  failures.push(message);
}

// Without this, a commented-out reference reads as a live one. Not a real parser,
// so a `//` inside a string literal is stripped too - harmless here.
//
// Line comments match up to the next terminator rather than anchoring on $ per
// line: these files are CRLF and "." never matches "\r". Block comments go first,
// so a `//` inside one cannot swallow the closing delimiter.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n\r]*/g, "");
}

function checkLoadoutCardsExist() {
  // loadout_ids.js is plain data, so load it rather than scraping source.
  // loadouts.js needs the unshipped shared/gw_common and cannot be loaded.
  const ids = loadCouiModule(LOADOUT_IDS_COUI).all;

  if (!ids.length) {
    fail("cross-refs: loadout_ids.js exported no card ids");
    return;
  }

  for (const id of ids) {
    const cardPath = path.join(CARDS_DIR, id + ".js");
    if (!fs.existsSync(cardPath)) {
      fail(
        'cross-refs: loadout_ids.js references card id "' +
          id +
          '" with no matching file: ' +
          cardPath
      );
    }
  }
  console.log(
    "cross-refs: " + ids.length + " loadout card ids checked against cards/."
  );
}

// Index-matches the define() dependency array against the factory's parameter
// list, rather than assuming every card names it `gwoUnit`.
function findUnitsParamName(src) {
  // Negated character classes, not lazy dot-all: no deps array or parameter list
  // here contains a literal `]`/`)`, and this cannot backtrack pathologically.
  const match = src.match(
    /define\(\s*\[([^\]]*)\]\s*,\s*function\s*\(([^)]*)\)/
  );
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
      continue;
    }
    checkedCards++;

    const escaped = paramName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const refPattern = new RegExp(
      "\\b" + escaped + "\\.([A-Za-z_$][A-Za-z0-9_$]*)",
      "g"
    );
    const referenced = new Set(
      [...stripComments(src).matchAll(refPattern)].map((m) => m[1])
    );

    for (const key of referenced) {
      checkedRefs++;
      if (!unitKeys.has(key)) {
        fail(
          "cross-refs: " +
            file +
            " references " +
            paramName +
            "." +
            key +
            ", which does not exist in units.js"
        );
      }
    }
  }

  console.log(
    "cross-refs: " +
      checkedRefs +
      " unit references across " +
      checkedCards +
      " cards checked against units.js (" +
      unitKeys.size +
      " known units)."
  );
}

function checkBuilderRoles() {
  const unitMap = JSON.parse(fs.readFileSync(UNIT_MAP_PATH, "utf8")).unit_map;
  const roleKeys = new Set(Object.keys(unitMap));

  const files = aiDataFiles();

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

  console.log(
    "cross-refs: " +
      checked +
      " builder role references checked against ai_unit_map.json."
  );
}

function main() {
  checkLoadoutCardsExist();
  checkUnitReferencesInCards();
  checkBuilderRoles();

  console.log("cross-refs: " + failures.length + " problems.");
  reportProblems(failures);
}

main();
