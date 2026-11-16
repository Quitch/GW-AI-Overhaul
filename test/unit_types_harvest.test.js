"use strict";

// scripts/lib/unit-types-harvest.js over in-memory roots: a mod's shadow of a
// stock spec reaches the top-level view and never the stock one.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { harvestUnitTypes } = require("../scripts/lib/unit-types-harvest.js");

const SCOUT = "/pa/units/land/scout/scout.json";
const CANNON = "/pa/units/land/cannon/cannon.json";
const BASE = "/pa/units/land/base_bot/base_bot.json";
const BOT = "/pa/units/land/bot/bot.json";
const TANK = "/pa/units/land/tank/tank.json";
const MOD_TANK = "/pa/units/land/mod_tank/mod_tank.json";
const GHOST = "/pa/units/land/ghost/ghost.json";
const CLASSIC = "/pa/units/land/classic/classic.json";

function memoryRoot(files) {
  const byRel = {};
  for (const [specPath, content] of Object.entries(files)) {
    byRel[specPath.replace(/^\/pa\//, "")] = JSON.stringify(content);
  }
  return {
    has: (rel) => Object.prototype.hasOwnProperty.call(byRel, rel),
    read: (rel) => byRel[rel],
  };
}

const unitList = (units) => ({ "/pa/units/unit_list.json": { units } });

const pa = memoryRoot(
  Object.assign(unitList([SCOUT, CANNON, BOT, TANK, CLASSIC]), {
    [SCOUT]: { unit_types: ["UNITTYPE_Land"] },
    [CANNON]: { unit_types: ["UNITTYPE_Factory"], buildable_types: "Land" },
    [BASE]: { unit_types: ["UNITTYPE_Bot"] },
    [BOT]: { base_spec: BASE },
    [TANK]: { unit_types: ["UNITTYPE_Tank", "UNITTYPE_Land"] },
    [CLASSIC]: { unit_types: ["UNITTYPE_Land"] },
  })
);
const paEx1 = memoryRoot(
  Object.assign(unitList([SCOUT, CANNON, BOT, TANK, GHOST]), {
    [SCOUT]: { unit_types: ["UNITTYPE_Land", "UNITTYPE_CannonBuildable"] },
  })
);
const mod = memoryRoot(
  Object.assign(unitList([SCOUT, CANNON, BOT, TANK, MOD_TANK]), {
    [SCOUT]: { unit_types: ["UNITTYPE_Land"] },
    [CANNON]: {
      unit_types: ["UNITTYPE_Factory"],
      buildable_types: "Land | Naval",
    },
    [BASE]: { unit_types: ["UNITTYPE_Bot", "UNITTYPE_Custom1"] },
    [TANK]: { unit_types: ["UNITTYPE_Land", "UNITTYPE_Tank"] },
    [MOD_TANK]: { unit_types: ["UNITTYPE_Tank"], buildable_types: "" },
  })
);

describe("harvestUnitTypes", () => {
  const { fixture, shadows, missing } = harvestUnitTypes([pa, paEx1], [mod]);

  it("keeps the stock spec in `stock` where a mod shadows it", () => {
    assert.deepEqual(fixture.stock.units[SCOUT], [
      "UNITTYPE_Land",
      "UNITTYPE_CannonBuildable",
    ]);
    assert.deepEqual(fixture.units[SCOUT], ["UNITTYPE_Land"]);
  });

  it("resolves a base_spec the mod shadows only in the top-level view", () => {
    assert.deepEqual(fixture.stock.units[BOT], ["UNITTYPE_Bot"]);
    assert.deepEqual(fixture.units[BOT], ["UNITTYPE_Bot", "UNITTYPE_Custom1"]);
  });

  it("keeps the stock buildable_types where a mod changes them", () => {
    assert.equal(fixture.stock.buildable[CANNON], "Land");
    assert.equal(fixture.buildable[CANNON], "Land | Naval");
  });

  it("lists a mod's own unit only in the top-level view, without an empty buildable_types", () => {
    assert.deepEqual(fixture.units[MOD_TANK], ["UNITTYPE_Tank"]);
    assert.ok(!(MOD_TANK in fixture.stock.units));
    assert.ok(!(MOD_TANK in fixture.buildable));
  });

  it("takes the stock unit list from the last base-game root alone", () => {
    assert.ok(!(CLASSIC in fixture.stock.units));
    assert.ok(!(CLASSIC in fixture.units));
  });

  it("counts a listed unit with no spec as missing in each view", () => {
    assert.ok(!(GHOST in fixture.units));
    assert.ok(!(GHOST in fixture.stock.units));
    assert.deepEqual(missing, { stock: 1, units: 1 });
  });

  it("reports each stock unit the mods change, and not one they only reorder", () => {
    assert.deepEqual(fixture.units[TANK], ["UNITTYPE_Land", "UNITTYPE_Tank"]);
    assert.deepEqual(shadows, [
      { unit: BOT, field: "unit_types" },
      { unit: CANNON, field: "buildable_types" },
      { unit: SCOUT, field: "unit_types" },
    ]);
  });
});
