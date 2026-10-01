"use strict";

// The cards that change one recon.observer item name it by layer and channel,
// so a race or add-on unit that orders its items differently takes the same
// change. The reordered specs are Second Wave's jammer_titan and Legion's
// l_jammer_station, which share one order (GWO #447).

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");
const { fixtureIndex } = require("../scripts/lib/addon-fixture.js");

const specs = loadCouiModule(MOD_ROOT + "/gw_play/specs.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");

const card = (id) => loadCouiModule(path.join(CARDS_DIR, id + ".js"));

function buffMods(id) {
  const added = [];
  card(id).buff({
    maxCards: () => 0,
    addMods: (mods) => added.push(...mods),
    addUnits: () => {},
    addAIMods: () => {},
  });
  return added;
}

const item = (layer, channel, radius) => ({ layer, channel, radius });

// Applies the card's mods on `file` to a unit holding `items`, as the stand-in
// re-aim would: the mod keeps its path and lands on whatever unit it names.
function applied(id, file, items) {
  const target = "/stand_in.json";
  const data = { [target]: { recon: { observer: { items } } } };
  const mods = buffMods(id)
    .filter((mod) => mod.file === file)
    .map((mod) => Object.assign({}, mod, { file: target }));
  specs.mod(data, mods, "");
  return data[target].recon.observer.items.map((entry) => entry.radius);
}

const reordered = () => [
  item("surface_and_air", "sight", 200),
  item("surface_and_air", "radar", 500),
  item("underwater", "sight", 200),
  item("surface_and_air", "radar_jammer", 500),
];

describe("Radar Jamming Station Upgrade", () => {
  const id = "gwaio_upgrade_radarjammer";
  const file = gwoUnit.radarJammingStation;

  it("doubles the stock jammer in slot 2", () => {
    assert.deepEqual(
      applied(id, file, [
        item("surface_and_air", "sight", 100),
        item("underwater", "sight", 100),
        item("surface_and_air", "radar_jammer", 200),
      ]),
      [100, 100, 400]
    );
  });

  it("doubles a reordered unit's jammer and leaves its sight", () => {
    assert.deepEqual(applied(id, file, reordered()), [200, 500, 200, 1000]);
  });

  it("changes nothing on a stand-in that has no jammer", () => {
    assert.deepEqual(
      applied(id, file, [
        item("surface_and_air", "sight", 300),
        item("surface_and_air", "radar", 900),
        item("underwater", "sight", 300),
      ]),
      [300, 900, 300]
    );
  });
});

describe("Nyx Upgrade", () => {
  const id = "gwaio_upgrade_nyx";
  const file = gwoUnit.nyx;

  it("doubles the stock radar and jammer", () => {
    assert.deepEqual(
      applied(id, file, [
        item("surface_and_air", "sight", 100),
        item("surface_and_air", "radar", 260),
        item("surface_and_air", "radar_jammer", 75),
      ]),
      [100, 520, 150]
    );
  });

  it("doubles a reordered unit's radar and jammer and leaves its sight", () => {
    assert.deepEqual(applied(id, file, reordered()), [200, 1000, 200, 1000]);
  });
});

describe("Protocol: Blindness on radars", () => {
  const id = "gwaio_protocol_blindness";

  it("zeroes the stock radar's sight and keeps its radar", () => {
    assert.deepEqual(
      applied(id, gwoUnit.radar, [
        item("surface_and_air", "sight", 100),
        item("surface_and_air", "radar", 450),
        item("orbital", "sight", 600),
        item("underwater", "sight", 100),
        item("underwater", "radar", 450),
      ]),
      [0, 450, 600, 100, 450]
    );
  });

  it("zeroes the Arkyd's sight in slot 1 and keeps its radar in slot 0", () => {
    assert.deepEqual(
      applied(id, gwoUnit.arkyd, [
        item("surface_and_air", "radar", 600),
        item("surface_and_air", "sight", 300),
        item("orbital", "sight", 600),
        item("underwater", "sight", 300),
        item("underwater", "radar", 600),
      ]),
      [600, 0, 600, 300, 600]
    );
  });

  it("zeroes a reordered radar's sight wherever it is", () => {
    assert.deepEqual(
      applied(id, gwoUnit.radar, [
        item("orbital", "sight", 600),
        item("surface_and_air", "radar", 450),
        item("surface_and_air", "sight", 100),
      ]),
      [600, 450, 0]
    );
  });
});

describe("Planetary Radar Upgrade", () => {
  it("keeps its indexed mods on the Planetary Radar, which the enable card remade", () => {
    const mods = buffMods("gwaio_enable_planetaryradar").concat(
      buffMods("gwaio_upgrade_planetaryradar")
    );
    assert.equal(cells.remadeFiles(mods)[gwoUnit.deepSpaceOrbitalRadar], true);
    for (const raceId of ["mla", "legion", "bugs", "exiles"]) {
      const index = fixtureIndex(raceId);
      assert.deepEqual(
        cells.expandMods(mods, index.vanilla, index.race, () => true),
        mods,
        raceId
      );
    }
  });
});
