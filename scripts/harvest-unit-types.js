"use strict";

// Writes test/fixtures/unit_types.json: every unit the merged unit list names
// with its effective unit_types (base_spec chain resolved), from the PA install
// (pa_ex1 over pa) and any race source tree on disk. CI has neither, so the
// fixture is committed - re-run after a PA or race patch. See testing.md.

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT =
  process.env.GWO_HARVEST_OUT ||
  path.join(REPO_ROOT, "test", "fixtures", "unit_types.json");

const MEDIA =
  process.env.PA_MEDIA ||
  "C:/Program Files (x86)/Steam/steamapps/common/Planetary Annihilation Titans/media";
const USER_DATA =
  process.env.PA_USER_DATA ||
  path.join(
    process.env.LOCALAPPDATA || "",
    "Uber Entertainment",
    "Planetary Annihilation"
  );

// Later roots shadow earlier ones, as the runtime virtual filesystem does.
const ROOTS = [
  path.join(MEDIA, "pa"),
  path.join(MEDIA, "pa_ex1"),
  path.join(
    USER_DATA,
    "server_mods",
    "com.pa.legion-expansion-server-dev",
    "pa"
  ),
].concat(
  (process.env.GWO_RACE_ROOTS || "")
    .split(path.delimiter)
    .filter(Boolean)
    .map((root) => path.join(root, "pa"))
);

function readJson(specPath) {
  // "/pa/units/x.json" -> "<root>/units/x.json", last root that has it wins.
  const rel = specPath.replace(/^\/pa\//, "");
  for (let i = ROOTS.length - 1; i >= 0; i--) {
    const candidate = path.join(ROOTS[i], rel);
    if (fs.existsSync(candidate)) {
      return JSON.parse(fs.readFileSync(candidate, "utf8"));
    }
  }
  return undefined;
}

function unitList() {
  const units = new Set();
  for (const root of ROOTS) {
    const listPath = path.join(root, "units", "unit_list.json");
    if (fs.existsSync(listPath)) {
      for (const unit of JSON.parse(fs.readFileSync(listPath, "utf8")).units) {
        units.add(unit);
      }
    }
  }
  return [...units].sort();
}

function effectiveTypes(specPath) {
  const seen = new Set();
  let current = specPath;
  while (current && !seen.has(current)) {
    seen.add(current);
    const spec = readJson(current);
    if (!spec) {
      return undefined;
    }
    if (Array.isArray(spec.unit_types)) {
      return spec.unit_types;
    }
    current = spec.base_spec;
  }
  return [];
}

function main() {
  if (!fs.existsSync(path.join(MEDIA, "pa"))) {
    console.error("harvest-unit-types: no PA install at " + MEDIA);
    process.exit(1);
  }
  const units = {};
  let missing = 0;
  for (const unit of unitList()) {
    const types = effectiveTypes(unit);
    if (types === undefined) {
      missing++;
      continue;
    }
    units[unit] = types;
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ units }, null, 2) + "\n");
  console.log(
    "harvest-unit-types: " +
      Object.keys(units).length +
      " units written to " +
      path.relative(REPO_ROOT, OUT) +
      (missing ? " (" + missing + " listed units have no spec on disk)" : "")
  );
}

main();
