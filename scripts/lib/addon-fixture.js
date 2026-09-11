"use strict";

// What the add-on tests share: the store zip an add-on's server mod ships
// as, when it is on disk, and the { vanilla, race } index race_cells.js
// would build over the harvested fixture (test/fixtures/unit_types.json) for
// MLA or a race, with every shipped add-on registered. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule } = require("./amd-loader.js");
const { ZipReader } = require("./zip-read.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const unitCells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const fixture = require("../../test/fixtures/unit_types.json");

const DOWNLOAD = path.join(
  process.env.LOCALAPPDATA || "",
  "Uber Entertainment",
  "Planetary Annihilation",
  "download"
);

// The zip under download/ for a mod identifier, or undefined.
function downloadZip(identifier) {
  const candidate = path.join(DOWNLOAD, identifier + ".zip");
  return fs.existsSync(candidate) ? candidate : undefined;
}

// A reader over every zip found among the identifiers, or undefined when
// none is on disk: `has(name)` and `names()` across all of them.
function zipsFor(identifiers) {
  const readers = identifiers
    .map(downloadZip)
    .filter(Boolean)
    .map((file) => new ZipReader(file));
  if (!readers.length) {
    return undefined;
  }
  return {
    has: (name) => readers.some((zip) => zip.has(name)),
    names: () => readers.flatMap((zip) => zip.names()),
    readJson: (name) => {
      const zip = readers.find((candidate) => candidate.has(name));
      return zip ? zip.readJson(name) : undefined;
    },
  };
}

// The index for `raceId` (MLA by default) as race_cells.js builds it: the
// base game's units on the vanilla side, and on the other the add-on units
// for MLA or the race's units for a race, exclusives marked.
function fixtureIndex(raceId) {
  const specs = {};
  for (const [unit, types] of Object.entries(fixture.units)) {
    specs[unit] = {
      unit_types: types,
      buildable_types: fixture.buildable[unit],
    };
  }
  const units = Object.keys(specs);
  const addonPaths = races.addonUnitPaths();
  const isAddon = (unit) => !!addonPaths[unit];
  const race = races.byId(raceId);
  const member = races.isMla(raceId)
    ? (types, unit) => unitCells.vanillaMember(types) && isAddon(unit)
    : unitCells.raceMember(race.unitTypeBit);
  return {
    vanilla: unitCells.buildIndex(
      units,
      specs,
      (types, unit) => unitCells.vanillaMember(types) && !isAddon(unit)
    ),
    race: unitCells.buildIndex(
      units,
      specs,
      member,
      unitCells.exclusiveMember(races.knownBits())
    ),
  };
}

// Whether the fixture was harvested with the add-on's units on disk.
function inFixture(addon) {
  return Object.values(addon.units).some((unit) =>
    Object.prototype.hasOwnProperty.call(fixture.units, unit)
  );
}

module.exports = { downloadZip, zipsFor, fixtureIndex, inFixture };
