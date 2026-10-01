"use strict";

// What the race and add-on tests share: a mod's files as they are on disk,
// and the { vanilla, race } index race_cells.js would build over the
// harvested fixture (test/fixtures/unit_types.json) for MLA or a race, with
// every shipped add-on registered. See testing.md.

const { MOD_ROOT, loadCouiModule } = require("./amd-loader.js");
const { modRoots } = require("./mod-roots.js");

const raceCells = loadCouiModule(MOD_ROOT + "/gw_play/race_cells.js");
const fixture = require("../../test/fixtures/unit_types.json");

// The mods' files as the harvests read them, through mod-roots.js: each
// mod's store zip, then any server_mods/ build shadowing it. Undefined when
// none is on disk. `has(name)`, `names()` and `readJson(name)` take and give
// "pa/..." paths.
function modFiles(identifiers) {
  const roots = modRoots(identifiers);
  if (!roots.length) {
    return undefined;
  }
  const relative = (name) => name.replace(/^pa\//, "");
  return {
    has: (name) => roots.some((root) => root.has(relative(name))),
    names: () => [
      ...new Set(
        roots.flatMap((root) => root.list("").map((rel) => "pa/" + rel))
      ),
    ],
    readJson: (name) => {
      const root = roots.findLast((candidate) => candidate.has(relative(name)));
      return root ? JSON.parse(root.read(relative(name))) : undefined;
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
  return raceCells.buildIndex(raceId, Object.keys(specs), specs);
}

// Whether the fixture was harvested with the add-on's units on disk.
function inFixture(addon) {
  return Object.values(addon.units).some((unit) =>
    Object.prototype.hasOwnProperty.call(fixture.units, unit)
  );
}

module.exports = { modFiles, fixtureIndex, inFixture };
