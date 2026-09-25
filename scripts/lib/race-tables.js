"use strict";

// Builds the `units` and `unitNames` tables of the race and add-on files from
// the harvested specs (test/fixtures/race_specs.json) and the hand-kept
// inputs (race-table-inputs.js), and splices them into the file. The rest of
// each file is hand-written and left as it is. See races.md, "Unit tables".

const path = require("node:path");
const prettier = require("prettier");
const { byCodePoint } = require("./mod-roots.js");
const { TABLES, ADDON_BIT_WORDS } = require("./race-table-inputs.js");

const REPO_ROOT = path.resolve(__dirname, "..", "..");
const LOC = "!LOC:";

function stemOf(specPath) {
  return path.posix.basename(specPath, ".json");
}

function dirOf(specPath) {
  return path.posix.basename(path.posix.dirname(specPath));
}

function upperFirst(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function stripLoc(name) {
  return name.startsWith(LOC) ? name.slice(LOC.length) : name;
}

function trimUnderscores(text) {
  let start = 0;
  let end = text.length;
  while (start < end && text[start] === "_") {
    start++;
  }
  while (end > start && text[end - 1] === "_") {
    end--;
  }
  return text.slice(start, end);
}

// "Bug Heavy AA Turret" -> "bugHeavyAATurret": words after the first keep
// their case.
function camelKeepCase(text) {
  const words = text.match(/[A-Za-z0-9]+/g);
  if (!words) {
    return "";
  }
  return words[0].toLowerCase() + words.slice(1).map(upperFirst).join("");
}

// "Planet-wide Radar" -> "planetWideRadar": every word lower-cased first,
// accents folded.
function camelLower(text) {
  const words = text
    .replaceAll("Æ", "Ae")
    .replaceAll("æ", "ae")
    .replaceAll("Ø", "O")
    .replaceAll("ß", "ss")
    .normalize("NFKD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .replaceAll(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : upperFirst(word.toLowerCase())
    )
    .join("");
}

// A spec by path, its `mod` the identifier of the mod that shipped it, or
// undefined for the base game; and the first value of a field up its
// base_spec chain.
function specsReader(source) {
  const read = (specPath) => {
    for (const [origin, specs] of Object.entries(source.specs)) {
      if (Object.hasOwn(specs, specPath)) {
        return {
          ...specs[specPath],
          mod: origin === "baseGame" ? undefined : origin,
        };
      }
    }
    return undefined;
  };
  const chain = (specPath, field) => {
    const seen = new Set();
    let current = specPath;
    while (current && !seen.has(current)) {
      seen.add(current);
      const spec = read(current);
      if (!spec) {
        return undefined;
      }
      if (spec[field] !== undefined) {
        return spec[field];
      }
      current = spec.base_spec;
    }
    return undefined;
  };
  return { read, chain };
}

// --- Races -----------------------------------------------------------------

function raceKeyFromName(input, name, stem) {
  let text = stripLoc(name || "").trim();
  if (!text) {
    return camelKeepCase(
      stem.replace(new RegExp(input.stemPrefix), "").replaceAll("_", " ")
    );
  }
  if (input.namePrefix) {
    text = text.replace(new RegExp(input.namePrefix), "");
  }
  if (text.startsWith("Advanced ")) {
    return camelKeepCase(text.slice("Advanced ".length)) + "Advanced";
  }
  return camelKeepCase(text);
}

// A research factory is <x>Research and the token it builds <x>Unlock,
// whatever their display names say.
function researchKey(key, stem) {
  const base = key.replace(/(Unlock|Research)$/, "");
  return base + (stem.startsWith("research_") ? "Research" : "Unlock");
}

// The role a part plays for its unit, from the part's file name less the
// unit's stem, the stem without its race prefix, or the part's directory.
function raceSuffix(input, ownerStem, partPath) {
  const partStem = stemOf(partPath);
  const prefix = [
    ownerStem,
    ownerStem.replace(new RegExp(input.stemPrefix), ""),
    dirOf(partPath),
  ].find(
    (candidate) => partStem.startsWith(candidate) && partStem !== candidate
  );
  const rest = trimUnderscores(
    prefix === undefined ? partStem : partStem.slice(prefix.length)
  )
    .replaceAll("tool_weapon", "weapon")
    .replaceAll("_tool", "");
  const plain = { weapon: "Weapon", ammo: "Ammo", build_arm: "BuildArm" };
  if (Object.hasOwn(plain, rest)) {
    return plain[rest];
  }
  return rest.split("_").filter(Boolean).map(upperFirst).join("");
}

function raceParts(input, spec, read) {
  const parts = [];
  for (const tool of spec.tools || []) {
    parts.push(tool);
    const ammo = read(tool)?.ammo_id;
    if (typeof ammo === "string") {
      parts.push(ammo);
    } else if (Array.isArray(ammo) && input.followAmmoArrays !== false) {
      parts.push(...ammo);
    }
  }
  if (spec.death_weapon && input.followDeathWeapons !== false) {
    const { ground_ammo_spec: ground, air_ammo_spec: air } = spec.death_weapon;
    parts.push(...[ground, air].filter(Boolean));
  }
  return parts;
}

// The listed units the race's own mod ships that carry its bit, in
// unit-list order.
function raceRows(input, source, reader) {
  const bit = "UNITTYPE_" + input.bit;
  const skip = input.skipPaths || [];
  return source.unitList.filter((unit) => {
    const spec = reader.read(unit);
    if (!spec || spec.mod !== source.mods[0]) {
      return false;
    }
    if (skip.some((fragment) => unit.includes(fragment))) {
      return false;
    }
    const types = input.ownTypesOnly
      ? spec.unit_types
      : reader.chain(unit, "unit_types");
    return (types || []).includes(bit);
  });
}

// A table holds the files the race's or add-on's own mod ships. A base-game
// file its units reuse keeps its stock key. See races.md, "Unit tables".
function isBaseGame(reader, specPath) {
  const spec = reader.read(specPath);
  return Boolean(spec) && spec.mod === undefined;
}

function pinned(input, reader, entries) {
  for (const [key, specPath] of entries) {
    if (isBaseGame(reader, specPath)) {
      throw new Error(
        input.id + ": " + key + " pins the base-game file " + specPath
      );
    }
  }
  return entries;
}

function sortedEntries(object) {
  return Object.keys(object)
    .sort(byCodePoint)
    .map((key) => [key, object[key]]);
}

// A race table under construction: key -> path, key -> display name, and
// the paths already keyed.
function raceTableBuilder(input, reader) {
  const names = input.names || {};
  const units = {};
  const unitNames = {};
  const seen = new Set();
  const add = (key, specPath) => {
    units[key] = specPath;
    seen.add(specPath);
  };
  return {
    units,
    unitNames,
    has: (specPath) => seen.has(specPath),
    taken: (key, specPath) =>
      Object.hasOwn(units, key) && units[key] !== specPath,
    addPart: add,
    addUnit: (key, specPath) => {
      add(key, specPath);
      const name = Object.hasOwn(names, specPath)
        ? names[specPath]
        : reader.read(specPath)?.display_name;
      if (name) {
        unitNames[key] = LOC + stripLoc(name);
      }
    },
  };
}

function raceUnitKey(input, reader, unit, stem) {
  const keys = input.keys || {};
  const key = Object.hasOwn(keys, unit)
    ? keys[unit]
    : raceKeyFromName(input, reader.read(unit).display_name, stem);
  return input.research && unit.includes("/research/")
    ? researchKey(key, stem)
    : key;
}

// `base`, else the first of base2, base3, ... for which isTaken is false.
function freeKey(base, isTaken) {
  let key = base;
  let n = 1;
  while (isTaken(key)) {
    n++;
    key = base + n;
  }
  return key;
}

// A unit key the fallbacks could not free; the input must pin one.
function keyClash(id, key, unit) {
  return new Error(
    id +
      ": key " +
      key +
      " for " +
      unit +
      " is already taken; pin a key in the table's input"
  );
}

// A unit's tools and ammo the harvest found, each keyed once.
function addRaceParts(input, reader, table, { key, unit, stem }) {
  const parts = raceParts(input, reader.read(unit), reader.read);
  for (const part of parts) {
    if (reader.read(part) && !isBaseGame(reader, part) && !table.has(part)) {
      const free = freeKey(key + raceSuffix(input, stem, part), (candidate) =>
        table.taken(candidate, part)
      );
      table.addPart(free, part);
    }
  }
}

// The race's units keyed by display name, then each unit's tools and ammo
// keyed by owner plus role. The input's own entries go in first. Keys sort
// in code-point order.
function buildRaceTable(input, source) {
  const reader = specsReader(source);
  const table = raceTableBuilder(input, reader);
  for (const [key, specPath] of pinned(
    input,
    reader,
    Object.entries(input.units || {})
  )) {
    table.addUnit(key, specPath);
  }
  for (const [key, specPath] of pinned(
    input,
    reader,
    Object.entries(input.parts || {})
  )) {
    table.addPart(key, specPath);
  }

  const owners = [];
  for (const unit of raceRows(input, source, reader)) {
    if (!table.has(unit)) {
      const stem = stemOf(unit);
      let key = raceUnitKey(input, reader, unit, stem);
      if (table.taken(key, unit)) {
        key += camelKeepCase(dirOf(unit));
      }
      if (table.taken(key, unit)) {
        throw keyClash(input.id, key, unit);
      }
      table.addUnit(key, unit);
      owners.push({ key, unit, stem });
    }
  }

  for (const owner of owners) {
    addRaceParts(input, reader, table, owner);
  }

  return {
    units: sortedEntries(table.units),
    unitNames: sortedEntries(table.unitNames),
  };
}

// --- Add-ons ---------------------------------------------------------------

function addonPartKey(entry, partPath, role) {
  let rest = stemOf(partPath);
  for (const prefix of [dirOf(partPath), stemOf(entry.unit)]) {
    if (rest.startsWith(prefix)) {
      rest = rest.slice(prefix.length);
    }
  }
  rest = rest
    .replace(/_?tool$/, "")
    .replace(/_?tool_weapon$/, "")
    .replace(/_?ammo$/, "")
    .replace(/_?build_arm$/, "")
    .replace(/_?weapon$/, "")
    .replace(/_?death$/, "")
    .replace(/^_/, "");
  return entry.key + upperFirst(camelLower(rest)) + role;
}

function addonParts(spec, chain) {
  const parts = [];
  const add = (partPath, role) => {
    const known = parts.some(
      (part) => part.path === partPath && part.role === role
    );
    if (typeof partPath === "string" && !known) {
      parts.push({ path: partPath, role });
    }
  };
  for (const tool of spec.tools || []) {
    const ammo = [chain(tool, "ammo_id") || []].flat();
    add(tool, ammo.length ? "Weapon" : "BuildArm");
    for (const id of ammo) {
      add(id, "Ammo");
    }
  }
  if (spec.death_weapon) {
    add(spec.death_weapon.ground_ammo_spec, "DeathAmmo");
    add(spec.death_weapon.air_ammo_spec, "DeathAmmo");
  }
  return parts;
}

// The listed units the base game does not list, each with its default key.
function addonEntries(source, baseUnits, reader) {
  const base = new Set(baseUnits);
  const entries = [];
  for (const unit of source.unitList) {
    const spec = reader.read(unit);
    if (base.has(unit) || !spec) {
      continue;
    }
    const display = spec.display_name;
    const bit = (reader.chain(unit, "unit_types") || [])
      .map((type) => type.replace(/^UNITTYPE_/, ""))
      .find((type) => /^Custom\d+$/.test(type) && type !== "Custom58");
    entries.push({
      unit,
      spec,
      display,
      bit,
      key: camelLower((display && stripLoc(display)) || dirOf(unit)),
    });
  }
  return entries;
}

function sharedKeys(entries) {
  const byKey = new Map();
  for (const entry of entries) {
    byKey.set(entry.key, (byKey.get(entry.key) || []).concat(entry));
  }
  return [...byKey.values()].filter((list) => list.length > 1).flat();
}

// A key two units share takes the race word of each one's bit; a key still
// shared becomes the unit's directory.
function resolveAddonKeys(entries) {
  for (const entry of sharedKeys(entries)) {
    if (entry.bit && Object.hasOwn(ADDON_BIT_WORDS, entry.bit)) {
      entry.key += ADDON_BIT_WORDS[entry.bit];
    }
  }
  for (const entry of sharedKeys(entries)) {
    entry.key = camelLower(dirOf(entry.unit));
  }
}

// The units the add-on lists and the base game does not, keyed by display
// name. Units sort by key, each followed by its parts.
function buildAddonTable(id, source, baseUnits) {
  const reader = specsReader(source);
  const entries = addonEntries(source, baseUnits, reader);
  resolveAddonKeys(entries);
  entries.sort((a, b) => byCodePoint(a.key, b.key));

  const units = {};
  const unitNames = [];
  for (const entry of entries) {
    if (Object.hasOwn(units, entry.key)) {
      throw keyClash(id, entry.key, entry.unit);
    }
    units[entry.key] = entry.unit;
    if (entry.display) {
      unitNames.push([entry.key, LOC + stripLoc(entry.display)]);
    }
    for (const { path: partPath, role } of addonParts(
      entry.spec,
      reader.chain
    )) {
      if (isBaseGame(reader, partPath)) {
        continue;
      }
      const key = freeKey(
        addonPartKey(entry, partPath, role),
        (candidate) => units[candidate]
      );
      units[key] = partPath;
    }
  }
  return { units: Object.entries(units), unitNames };
}

// --- Rendering -------------------------------------------------------------

// { units, unitNames }, each an array of [key, value] in file order.
function buildTable(input, fixture) {
  const source = fixture.tables[input.id];
  if (!source) {
    throw new Error("race_specs.json has no table " + input.id);
  }
  return input.strategy === "addon"
    ? buildAddonTable(input.id, source, fixture.baseUnits)
    : buildRaceTable(input, source);
}

function block(name, entries) {
  const lines = entries.map(
    ([key, value]) => "      " + key + ": " + JSON.stringify(value) + ","
  );
  return ["    " + name + ": {", ...lines, "    },"].join("\n");
}

const TABLE_START = "\n    units: {\n";
const FILE_END = "\n  };\n});\n";

// The file with its units and unitNames blocks - the last two properties of
// the descriptor - replaced, formatted as Prettier formats the repo. Line
// endings follow the file's own.
async function renderFile(input, table, current) {
  const eol = current.includes("\r\n") ? "\r\n" : "\n";
  const source = current.replaceAll("\r\n", "\n");
  const start = source.indexOf(TABLE_START);
  const end = source.lastIndexOf(FILE_END);
  if (start === -1 || end < start) {
    throw new Error(
      input.file + ": expected units and unitNames to close the descriptor"
    );
  }
  const spliced =
    source.slice(0, start + 1) +
    block("units", table.units) +
    "\n" +
    block("unitNames", table.unitNames) +
    source.slice(end);
  const filepath = path.join(REPO_ROOT, input.file);
  const options = (await prettier.resolveConfig(filepath)) || {};
  const formatted = await prettier.format(spliced, {
    ...options,
    filepath,
    endOfLine: "lf",
  });
  return eol === "\n" ? formatted : formatted.replaceAll("\n", eol);
}

// Every table's file as the generator writes it, { file: content }, given a
// reader for a file's current content.
async function generateAll(fixture, readCurrent) {
  const out = {};
  for (const input of TABLES) {
    out[input.file] = await renderFile(
      input,
      buildTable(input, fixture),
      readCurrent(input.file)
    );
  }
  return out;
}

module.exports = {
  REPO_ROOT,
  camelKeepCase,
  camelLower,
  buildTable,
  renderFile,
  generateAll,
};
