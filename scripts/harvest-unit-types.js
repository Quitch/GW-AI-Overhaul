"use strict";

// Writes test/fixtures/unit_types.json: every unit the merged unit list names
// with its effective unit_types and buildable_types (base_spec chain
// resolved), from the PA install (pa_ex1 over pa) and the race and add-on
// server mods found on disk - a folder under server_mods/ or a zip under
// download/, later roots shadowing earlier ones as the runtime virtual
// filesystem does. CI has none of it, so the fixture is committed - re-run
// after a PA, race or add-on patch.
// See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { mediaDir } = require("./lib/pa-install.js");
const { byCodePoint, folderRoot, modRoots } = require("./lib/mod-roots.js");
const { shippedServerMods } = require("./lib/server-mods.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT =
  process.env.GWO_HARVEST_OUT ||
  path.join(REPO_ROOT, "test", "fixtures", "unit_types.json");

const MEDIA = mediaDir();

// A folder build beside a zip wins.
const SERVER_MODS = shippedServerMods();

const ROOTS = [
  folderRoot(path.join(MEDIA, "pa")),
  folderRoot(path.join(MEDIA, "pa_ex1")),
]
  .concat(modRoots(SERVER_MODS))
  .concat(
    (process.env.GWO_RACE_ROOTS || "")
      .split(path.delimiter)
      .filter(Boolean)
      .map((root) => folderRoot(path.join(root, "pa")))
  );

function readJson(specPath) {
  // "/pa/units/x.json" -> "units/x.json", last root that has it wins.
  const rel = specPath.replace(/^\/pa\//, "");
  for (let i = ROOTS.length - 1; i >= 0; i--) {
    if (ROOTS[i].has(rel)) {
      return JSON.parse(ROOTS[i].read(rel));
    }
  }
  return undefined;
}

function unitList() {
  const units = new Set();
  for (const root of ROOTS) {
    if (root.has("units/unit_list.json")) {
      for (const unit of JSON.parse(root.read("units/unit_list.json")).units) {
        units.add(unit);
      }
    }
  }
  return [...units].sort(byCodePoint);
}

// The first value of `field` up the base_spec chain; null when no spec on
// the chain is on disk at all.
function chainValue(specPath, field) {
  const seen = new Set();
  let current = specPath;
  let found = false;
  while (current && !seen.has(current)) {
    seen.add(current);
    const spec = readJson(current);
    if (!spec) {
      return found ? undefined : null;
    }
    found = true;
    if (spec[field] !== undefined) {
      return spec[field];
    }
    current = spec.base_spec;
  }
  return undefined;
}

function main() {
  if (!fs.existsSync(path.join(MEDIA, "pa"))) {
    console.error("harvest-unit-types: no PA install at " + MEDIA);
    process.exit(1);
  }
  const units = {};
  const buildable = {};
  let missing = 0;
  for (const unit of unitList()) {
    const types = chainValue(unit, "unit_types");
    if (types === null) {
      missing++;
      continue;
    }
    units[unit] = Array.isArray(types) ? types : [];
    const expression = chainValue(unit, "buildable_types");
    if (typeof expression === "string" && expression.length) {
      buildable[unit] = expression;
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ units, buildable }, null, 2) + "\n");
  console.log(
    "harvest-unit-types: " +
      Object.keys(units).length +
      " units from " +
      ROOTS.length +
      " roots written to " +
      path.relative(REPO_ROOT, OUT) +
      (missing ? " (" + missing + " listed units have no spec)" : "")
  );
}

main();
