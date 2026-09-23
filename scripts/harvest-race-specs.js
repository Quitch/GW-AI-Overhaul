"use strict";

// Writes test/fixtures/race_specs.json: for each race and add-on table
// scripts/lib/race-table-inputs.js lists, the mod's unit list and every spec
// its table is built from - the listed units the mod ships, and what their
// base_spec, tools, ammo and death weapons reach - trimmed to the fields the
// generator reads. Specs come from the table's server mods (a folder under
// server_mods/ or a zip under download/, the first mod listed winning), then
// the PA install (pa_ex1 over pa) for a table that falls back to it. CI has
// none of it, so the fixture is committed - re-run after a race or add-on
// patch, then `npm run generate:race-tables`. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const prettier = require("prettier");
const { ZipReader } = require("./lib/zip-read.js");
const { TABLES } = require("./lib/race-table-inputs.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const OUT =
  process.env.GWO_HARVEST_OUT ||
  path.join(REPO_ROOT, "test", "fixtures", "race_specs.json");

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

function folderRoot(mod, dir) {
  return {
    mod,
    has: (rel) => fs.existsSync(path.join(dir, rel)),
    read: (rel) => fs.readFileSync(path.join(dir, rel), "utf8"),
  };
}

function zipRoot(mod, file) {
  const zip = new ZipReader(file);
  return {
    mod,
    has: (rel) => zip.has("pa/" + rel),
    read: (rel) => zip.read("pa/" + rel).toString("utf8"),
  };
}

// A mod's roots, a folder build ahead of its zip.
function modRoots(mod) {
  const roots = [];
  for (const dir of [mod + "-dev", mod]) {
    const folder = path.join(USER_DATA, "server_mods", dir, "pa");
    if (fs.existsSync(folder)) {
      roots.push(folderRoot(mod, folder));
    }
  }
  const zip = path.join(USER_DATA, "download", mod + ".zip");
  if (fs.existsSync(zip)) {
    roots.push(zipRoot(mod, zip));
  }
  return roots;
}

function tableRoots(table) {
  let roots = [];
  for (const mod of table.mods) {
    const found = modRoots(mod);
    if (!found.length) {
      throw new Error(mod + " is on disk neither as a zip nor as a folder");
    }
    roots = roots.concat(found);
  }
  if (table.baseGame) {
    roots.push(
      folderRoot(null, path.join(MEDIA, "pa_ex1")),
      folderRoot(null, path.join(MEDIA, "pa"))
    );
  }
  return roots;
}

// "/pa/units/x.json" -> { mod, spec } from the first root that has it.
function lookup(roots, specPath) {
  const rel = specPath.replace(/^\/pa\//, "");
  for (const root of roots) {
    if (root.has(rel)) {
      let spec;
      try {
        spec = JSON.parse(root.read(rel));
      } catch {
        spec = {};
      }
      return { mod: root.mod, spec };
    }
  }
  return undefined;
}

function ammoIds(ammo) {
  if (typeof ammo === "string") {
    return ammo;
  }
  if (Array.isArray(ammo)) {
    return ammo
      .filter((entry) => entry && typeof entry.id === "string")
      .map((entry) => entry.id);
  }
  return undefined;
}

// The fields the generator reads, and the paths they reach.
function trim(spec) {
  const out = {};
  const reached = [];
  if (typeof spec.display_name === "string") {
    out.display_name = spec.display_name;
  }
  if (Array.isArray(spec.unit_types)) {
    out.unit_types = spec.unit_types;
  }
  if (typeof spec.base_spec === "string") {
    out.base_spec = spec.base_spec;
    reached.push(spec.base_spec);
  }
  if (Array.isArray(spec.tools)) {
    out.tools = spec.tools
      .map((tool) => tool && tool.spec_id)
      .filter((id) => typeof id === "string");
    reached.push(...out.tools);
  }
  const ammo = ammoIds(spec.ammo_id);
  if (ammo !== undefined) {
    out.ammo_id = ammo;
    reached.push(...[ammo].flat());
  }
  const death = spec.death_weapon;
  if (death && typeof death === "object") {
    out.death_weapon = {};
    for (const field of ["ground_ammo_spec", "air_ammo_spec"]) {
      if (typeof death[field] === "string") {
        out.death_weapon[field] = death[field];
        reached.push(death[field]);
      }
    }
  }
  return { out, reached };
}

function byCodePoint(a, b) {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

function harvestTable(table) {
  const roots = tableRoots(table);
  const own = roots.filter((root) => root.mod === table.mods[0]);
  const list = lookup(own, "/pa/units/unit_list.json");
  if (!list) {
    throw new Error(table.mods[0] + " ships no unit_list.json");
  }
  // Only the listed units a mod ships are read, so only those are kept.
  const modRootsOnly = roots.filter((root) => root.mod !== null);
  const unitList = list.spec.units.filter((unit) => lookup(modRootsOnly, unit));
  const queue = unitList.concat(
    Object.values(table.units || {}),
    Object.values(table.parts || {})
  );
  const found = {};
  while (queue.length) {
    const specPath = queue.shift();
    if (Object.hasOwn(found, specPath)) {
      continue;
    }
    const hit = lookup(roots, specPath);
    if (!hit) {
      continue;
    }
    const { out, reached } = trim(hit.spec);
    found[specPath] = { mod: hit.mod, out };
    queue.push(...reached);
  }
  // Grouped by where each spec came from: a mod's identifier, or baseGame.
  const specs = {};
  for (const origin of table.mods.concat(table.baseGame ? ["baseGame"] : [])) {
    specs[origin] = {};
  }
  for (const specPath of Object.keys(found).sort(byCodePoint)) {
    specs[found[specPath].mod || "baseGame"][specPath] = found[specPath].out;
  }
  return { mods: table.mods, unitList, specs };
}

function baseUnits() {
  const units = new Set();
  for (const dir of ["pa", "pa_ex1"]) {
    const file = path.join(MEDIA, dir, "units", "unit_list.json");
    for (const unit of JSON.parse(fs.readFileSync(file, "utf8")).units) {
      units.add(unit);
    }
  }
  return [...units].sort(byCodePoint);
}

async function main() {
  if (!fs.existsSync(path.join(MEDIA, "pa"))) {
    console.error("harvest-race-specs: no PA install at " + MEDIA);
    process.exit(1);
  }
  const tables = {};
  for (const table of TABLES) {
    tables[table.id] = harvestTable(table);
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  // Written as format:check wants it.
  const json = await prettier.format(
    JSON.stringify({ baseUnits: baseUnits(), tables }),
    { ...(await prettier.resolveConfig(OUT)), filepath: OUT }
  );
  fs.writeFileSync(OUT, json);
  console.log(
    "harvest-race-specs: " +
      TABLES.map((table) => table.id).join(", ") +
      " written to " +
      path.relative(REPO_ROOT, OUT)
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
