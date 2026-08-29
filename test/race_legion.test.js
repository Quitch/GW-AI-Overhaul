"use strict";

// race/legion.js: the Legion Expansion descriptor and its unit table. The
// table is checked against the mod's zip when one is installed locally, since
// CI has no copy of Legion.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const legion = loadCouiModule(MOD_ROOT + "/race/legion.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const cardUnits = loadCouiModule(MOD_ROOT + "/gw_play/card_units.js");

// Units Legion has no counterpart for, so the cards that only touch them are
// withheld from a Legion player. A change here is a balance decision.
const WITHHELD = [
  "gwaio_enable_planetaryradar",
  "gwaio_upgrade_angel",
  "gwaio_upgrade_boom",
  "gwaio_upgrade_icarus",
  "gwaio_upgrade_kessler",
  "gwaio_upgrade_kraken",
  "gwaio_upgrade_lob",
  "gwaio_upgrade_manhattan",
  "gwaio_upgrade_mend",
  "gwaio_upgrade_planetaryradar",
  "gwaio_upgrade_radarjammer",
  "gwaio_upgrade_skitter",
  "gwaio_upgrade_solararray",
  "gwaio_upgrade_spinner",
  "gwaio_upgrade_ward",
];

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
    assert.equal(race.commanderTypes.buildable, "CmdBuild & Custom1");
    assert.ok(race.ai.titans.sources.length >= 4);
    assert.deepEqual(race.ai.queller.exclude, ["/mla/", "/unit_maps/mla.json"]);
    assert.ok(race.playerIcon.fill && race.playerIcon.outline);
  });

  it("keys every Legion spec, and binds only keys both tables have", () => {
    for (const [key, value] of Object.entries(legion.units)) {
      assert.match(key, /^[a-z][A-Za-z0-9]*$/, key);
      assert.match(value, /^\/pa\/(units|ammo|tools)\/.*\.json$/, key);
    }
    for (const [key, mlaKeys] of Object.entries(legion.mla)) {
      assert.ok(key in legion.units, key + " is bound but not in units");
      for (const mlaKey of [].concat(mlaKeys)) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(gwoUnit, mlaKey),
          key + " -> " + mlaKey + " is not a units.js key"
        );
      }
    }
    assert.ok(Object.keys(legion.units).length >= 350);
    assert.ok(Object.keys(legion.mla).length >= 250);
    assert.equal(legion.units.shank, races.byId("legion").pathMap[gwoUnit.ant]);
  });

  it("names units by Legion key, each in the table", () => {
    for (const key of Object.keys(legion.unitNames)) {
      assert.ok(key in legion.units, key + " is named but not in units");
    }
    assert.equal(legion.unitNames.shank, "!LOC:Shank");
  });

  it("keeps every card dealable except those touching units Legion lacks", () => {
    const withheld = cardUnits.cards
      .filter((card) => !races.cardUsable("legion", card.units))
      .map((card) => card.id)
      .sort();

    assert.deepEqual(withheld, WITHHELD);
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
