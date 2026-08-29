"use strict";

// race/legion.js: the Legion Expansion descriptor, its unit table, and what
// the capability cells make of Legion's units against GWO's cards. The cells
// come from the harvested fixture (test/fixtures/unit_types.json), which
// carries Legion's units when the mod's source tree was on disk at harvest.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const legion = loadCouiModule(MOD_ROOT + "/race/legion.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const cardUnits = loadCouiModule(MOD_ROOT + "/gw_play/card_units.js");
const helpers = loadCouiModule(MOD_ROOT + "/gw_play/cards_deal_helpers.js");
const fixture = require("./fixtures/unit_types.json").units;

// Cards a Legion player is never dealt beyond the MLA-only set every race
// shares (cards_deal_helpers.MLA_ONLY and the unit upgrades): those naming
// only units in cells Legion leaves empty. None today - Legion fills every
// cell GWO's cards open. A change here is a balance decision.
const WITHHELD_BY_CELLS = [];

const legionUnits = Object.keys(fixture).filter((unit) =>
  fixture[unit].includes("UNITTYPE_Custom1")
);

function legionIndex() {
  const specs = {};
  for (const [unit, types] of Object.entries(fixture)) {
    specs[unit] = { unit_types: types };
  }
  const units = Object.keys(specs);
  return {
    vanilla: cells.buildIndex(units, specs, cells.vanillaMember),
    race: cells.buildIndex(units, specs, cells.raceMember("Custom1")),
  };
}

function legionZip() {
  const candidates = [
    process.env.GWO_LEGION_ZIP,
    path.join(
      process.env.LOCALAPPDATA || "",
      "Uber Entertainment",
      "Planetary Annihilation",
      "download",
      "com.pa.legion-expansion-server.zip"
    ),
  ];
  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

describe("the Legion descriptor", () => {
  it("is registered as shipped, with its six commanders and both AI layouts", () => {
    const race = races.byId("legion");

    assert.equal(race.id, "legion");
    assert.equal(race.commanders.length, 6);
    assert.equal(race.unitTypeBit, "Custom1");
    assert.equal(race.commanderArtHue, 0);
    assert.equal(race.commanderTypes.buildable, "CmdBuild & Custom1");
    assert.ok(race.ai.titans.sources.length >= 4);
    assert.deepEqual(race.ai.queller.exclude, ["/mla/", "/unit_maps/mla.json"]);
    assert.ok(race.playerIcon.fill && race.playerIcon.outline);
  });

  it("keys every Legion spec by a Legion name", () => {
    for (const [key, value] of Object.entries(legion.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    assert.ok(Object.keys(legion.units).length >= 350);
    assert.equal(legion.mla, undefined);
  });

  it("names units by Legion key, each in the table", () => {
    for (const key of Object.keys(legion.unitNames)) {
      assert.ok(key in legion.units, key + " is named but not in units");
    }
    assert.equal(legion.unitNames.shank, "!LOC:Shank");
    assert.equal(
      races.byId("legion").unitNames[legion.units.shank],
      "!LOC:Shank"
    );
  });

  it("maps to files the installed Legion zip ships (skipped without one)", (t) => {
    const zipPath = legionZip();
    if (!zipPath) {
      t.skip("no Legion zip installed");
      return;
    }
    // A zip's central directory lists every entry name in plain text.
    const bytes = fs.readFileSync(zipPath).toString("latin1");
    for (const [key, value] of Object.entries(legion.units)) {
      if (!/\/l_/.test(value)) {
        continue;
      }
      assert.ok(bytes.includes(value.slice(1)), key + " -> " + value);
    }
    for (const commander of legion.commanders) {
      assert.ok(bytes.includes(commander.spec.slice(1)), commander.spec);
    }
  });
});

describe("Legion under capability cells", () => {
  before(() => {
    if (legionUnits.length) {
      races.setCells("legion", legionIndex());
    }
  });
  after(() => {
    races.reset();
    races.registerShipped();
  });

  it("has units in every cell the starter set and the gwc_ cards open (skipped without Legion in the fixture)", (t) => {
    if (!legionUnits.length) {
      t.skip("fixture harvested without Legion");
      return;
    }
    const index = races.cellsOf("legion");
    for (const cell of [
      "Bot/Basic/Combat",
      "Bot/Advanced/Combat",
      "Vehicle/Basic/Combat",
      "Vehicle/Advanced/Combat",
      "Air/Basic/Combat",
      "Air/Advanced/Combat",
      "Naval/Basic/Combat",
      "Orbital/Basic/Combat",
      "Bot/Basic/Fabber",
      "Vehicle/Basic/Factory",
      "Land/Basic/Metal",
      "Land/Basic/Energy",
      "Land/Basic/Defense",
      "Land/Advanced/Superweapon",
      "Land/Basic/Intel",
      "Land/Basic/Teleporter",
      "Land/Basic/Commander",
    ]) {
      assert.ok(index.race.unitsByCell[cell], cell + " has no Legion unit");
    }
    assert.equal(index.race.cellOf[legion.units.shank], "Vehicle/Basic/Combat");
    assert.equal(index.race.unitsByCell["Land/Basic/Storage"], undefined);
    assert.equal(index.race.unitsByCell["Land/Basic/Commander"].length, 7);
  });

  it("withholds only the MLA-only cards and those naming cells Legion lacks", (t) => {
    if (!legionUnits.length) {
      t.skip("fixture harvested without Legion");
      return;
    }
    const inventory = { getTag: () => "legion" };
    const withheld = cardUnits.cards
      .filter(
        (card) =>
          !helpers.raceCanDeal(races, inventory, card.id, cardUnits.cards)
      )
      .map((card) => card.id)
      .sort();
    const expected = cardUnits.cards
      .map((card) => card.id)
      .filter((id) => helpers.mlaOnlyCard(id) || WITHHELD_BY_CELLS.includes(id))
      .sort();

    assert.deepEqual(withheld, expected);
    assert.ok(withheld.includes("gwaio_upgrade_ant"));
    assert.ok(!withheld.includes("gwaio_upgrade_ubercannon_structure"));
    assert.ok(!withheld.includes("gwc_combat_bots"));
    assert.ok(!withheld.includes("gwc_storage_1"));
  });
});
