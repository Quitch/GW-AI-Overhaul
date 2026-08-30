"use strict";

// Writes test/fixtures/unit_types.json: every unit the merged unit list names
// with its effective unit_types and buildable_types (base_spec chain
// resolved), from the PA install (pa_ex1 over pa) and the race server mods
// found on disk - a folder under server_mods/ or a zip under download/, later
// roots shadowing earlier ones as the runtime virtual filesystem does. CI has
// none of it, so the fixture is committed - re-run after a PA or race patch.
// See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { ZipReader } = require("./lib/zip-read.js");

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

// The race server mods GWO knows, in the order GW Server Mods mounts them
// (each shadows the ones before it). A folder build beside a zip wins.
const RACE_MODS = [
  "com.pa.legion-expansion-server",
  "com.pa.ferretmaster.commander-merge",
  "com.pa.ferretmaster.bugs",
  "com.pa.nik.exiles",
];

function folderRoot(dir) {
  return {
    name: dir,
    has: (rel) => fs.existsSync(path.join(dir, rel)),
    read: (rel) => fs.readFileSync(path.join(dir, rel), "utf8"),
  };
}

function zipRoot(file) {
  const zip = new ZipReader(file);
  return {
    name: file,
    has: (rel) => zip.has("pa/" + rel),
    read: (rel) => zip.read("pa/" + rel).toString("utf8"),
  };
}

function raceRoots() {
  const roots = [];
  for (const id of RACE_MODS) {
    const zip = path.join(USER_DATA, "download", id + ".zip");
    if (fs.existsSync(zip)) {
      roots.push(zipRoot(zip));
    }
    for (const dir of [id, id + "-dev"]) {
      const folder = path.join(USER_DATA, "server_mods", dir, "pa");
      if (fs.existsSync(folder)) {
        roots.push(folderRoot(folder));
      }
    }
  }
  return roots;
}

const ROOTS = [
  folderRoot(path.join(MEDIA, "pa")),
  folderRoot(path.join(MEDIA, "pa_ex1")),
]
  .concat(raceRoots())
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
  return [...units].sort();
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
