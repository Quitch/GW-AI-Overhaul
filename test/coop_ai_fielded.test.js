"use strict";

// shared/coop_ai_fielded.js: a co-op AI player's inventory as the referee
// fields it for its race, over the harvested fixture's specs and cells, and
// what that makes of the scorer's judgement. See tech-cards.md, "A race's
// units".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { fixtureIndex } = require("../scripts/lib/addon-fixture.js");
const fixture = require("./fixtures/unit_types.json");

const coopAiFielded = loadCouiModule(MOD_ROOT + "/shared/coop_ai_fielded.js");
const coopAiUnits = loadCouiModule(MOD_ROOT + "/shared/coop_ai_units.js");
const coopAiCards = loadCouiModule(MOD_ROOT + "/shared/coop_ai_cards.js");
const unitGroups = loadCouiModule(MOD_ROOT + "/shared/unit_groups.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");
const gwoSpecs = loadCouiModule(MOD_ROOT + "/gw_play/specs.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");

races.registerShipped();

const specs = {};
for (const [unit, types] of Object.entries(fixture.units)) {
  specs[unit] = { unit_types: types, buildable_types: fixture.buildable[unit] };
}
const lookup = coopAiUnits.fromSpecs(
  { units: Object.keys(specs), specs },
  unitGroups.units,
  gwoSpecs.mod
);

const LEGION = fixtureIndex("legion");
const MLA = fixtureIndex("mla");
const viewOf = (race, cells) =>
  coopAiFielded.view({ race, cells, races, lookup });

const LEGION_COMMANDER = "/pa/units/commanders/l_overwatch/l_overwatch.json";
const HOST_COMMANDER =
  "/pa/units/commanders/imperial_invictus/imperial_invictus.json";
const LEGION_FACTORY =
  "/pa/units/land/l_vehicle_factory/l_vehicle_factory.json";
// Legion's units of the Ant's cell, Vehicle/Basic/Combat.
const ANT_CELL = LEGION.race.unitsByCell[LEGION.vanilla.cellOf[gwoUnit.ant]];

const health = (file) => ({
  file,
  path: "max_health",
  op: "multiply",
  value: 1.5,
});
const sorted = (list) => list.slice().sort();

describe("coop_ai_fielded inventory", () => {
  it("fields the race's units of the cells the vanilla ones held occupy", () => {
    const saved = {
      units: [LEGION_COMMANDER, gwoUnit.vehicleFactory, gwoUnit.ant],
      mods: [],
      cards: [{ id: "start" }],
    };
    const fielded = viewOf("legion", LEGION).inventory(saved);

    assert.ok(ANT_CELL.length > 1);
    for (const unit of ANT_CELL.concat(LEGION_COMMANDER, LEGION_FACTORY)) {
      assert.ok(fielded.units.includes(unit), unit);
    }
    assert.ok(!fielded.units.includes(gwoUnit.ant));
    assert.equal(fielded.cards, saved.cards);
    assert.equal(saved.units.length, 3, "the saved inventory is left as is");
  });

  it("lands a vanilla unit's mod on each of the race's units of its cell", () => {
    const fielded = viewOf("legion", LEGION).inventory({
      units: [LEGION_COMMANDER, gwoUnit.vehicleFactory, gwoUnit.ant],
      mods: [health(gwoUnit.ant)],
    });

    assert.deepEqual(
      sorted(fielded.mods.map((mod) => mod.file)),
      sorted(ANT_CELL)
    );
  });

  // The referee keeps a vanilla file's mod only where a fielded unit owns
  // it; the view also keeps it where a unit a card could grant does, so a
  // held mod does not move onto the unit as the card granting it is scored.
  it("keeps a held mod where it lands as a card grants the unit it names", () => {
    const mla = viewOf("mla", MLA);
    const held = {
      units: [HOST_COMMANDER, gwoUnit.botFactory, gwoUnit.dox],
      mods: [health(gwoUnit.ant)],
    };
    const granted = Object.assign({}, held, {
      units: held.units.concat(gwoUnit.vehicleFactory, gwoUnit.ant),
    });

    assert.ok(mla.inventory(held).mods.some((mod) => mod.file === gwoUnit.ant));
    assert.deepEqual(
      coopAiCards.effectOf(mla.inventory(held), mla.inventory(granted))
        .addedMods,
      []
    );
  });

  it("strips the race's units of a stripped vanilla unit, less those it fields", () => {
    const legion = viewOf("legion", LEGION);
    const stripped = (units) =>
      legion.inventory({ units, mods: [], strippedUnits: [gwoUnit.ant] })
        .strippedUnits;

    assert.deepEqual(sorted(stripped([LEGION_COMMANDER])), sorted(ANT_CELL));
    // The Inferno shares the Ant's cell, so the cell is fielded.
    assert.deepEqual(stripped([LEGION_COMMANDER, gwoUnit.inferno]), []);
  });

  it("hands back the same inventory for the same saved one, the latest 16 kept", () => {
    const legion = viewOf("legion", LEGION);
    const saved = { units: [LEGION_COMMANDER, gwoUnit.ant], mods: [] };
    const first = legion.inventory(saved);

    assert.equal(legion.inventory(saved), first);
    for (let i = 0; i < 16; i++) {
      legion.inventory({ units: [], mods: [] });
    }
    const again = legion.inventory(saved);
    assert.notEqual(again, first);
    assert.deepEqual(again, first);
  });
});

describe("coop_ai_fielded reach and obtainable", () => {
  const legion = viewOf("legion", LEGION);
  const units = [gwoUnit.vehicleFactory, gwoUnit.ant];

  it("reaches from the race commander's own build list", () => {
    const fielded = legion.inventory({ units: units.concat(LEGION_COMMANDER) });
    const reached = legion.reachable(fielded.units, LEGION_COMMANDER, []);

    for (const unit of ANT_CELL.concat(LEGION_FACTORY)) {
      assert.ok(reached.includes(unit), unit);
    }
  });

  // A race AI takes the host's commander once the race's are all in use.
  it("gives another race's commander the race's build list, as the referee retags it", () => {
    const fielded = legion.inventory({ units: units.concat(HOST_COMMANDER) });
    const reached = legion.reachable(fielded.units, HOST_COMMANDER, []);

    for (const unit of ANT_CELL.concat(LEGION_FACTORY)) {
      assert.ok(reached.includes(unit), unit);
    }
    assert.deepEqual(
      lookup.reachable(fielded.units, HOST_COMMANDER, [], true),
      [HOST_COMMANDER]
    );
  });

  it("lists the race's units a card could grant, commanders aside", () => {
    for (const unit of ANT_CELL) {
      assert.ok(legion.obtainable.includes(unit), unit);
    }
    assert.ok(!legion.obtainable.includes(gwoUnit.ant));
    assert.ok(
      legion.obtainable.every(
        (unit) => lookup.classOf(unit).cls !== "Commander"
      )
    );
  });
});

describe("coop_ai_fielded scoring", () => {
  const legion = viewOf("legion", LEGION);
  const inventory = (commander) => ({
    units: [commander, gwoUnit.vehicleFactory, gwoUnit.ant],
    mods: [],
    aiMods: [],
    minions: [],
    cards: [{ id: "start" }],
    maxCards: 4,
  });
  const withCard = (before, changes) =>
    Object.assign({}, before, {
      units: before.units.concat(changes.units || []),
      mods: before.mods.concat(changes.mods || []),
      cards: before.cards.concat({ id: "card" }),
      maxCards: before.maxCards + 1,
    });
  const score = (before, changes, fielded) =>
    coopAiCards.scoreCard(before, withCard(before, changes), {
      lookup,
      commander: before.units[0],
      teamDomains: [],
      memo: {},
      fielded,
    });

  it("values a race unit's stat card as an MLA AI values its vanilla twin's", () => {
    const race = inventory(LEGION_COMMANDER);
    const shank = { mods: [health(gwoUnit.legion.shank)] };

    assert.equal(score(race, shank).mods, 0, "no saved path is the Shank");
    assert.ok(score(race, shank, legion).mods > 0);
    assert.equal(
      score(race, shank, legion).mods,
      score(inventory(HOST_COMMANDER), { mods: [health(gwoUnit.ant)] }).mods
    );
  });

  it("values a vanilla unit whose cell the race already fields at nothing", () => {
    const race = inventory(LEGION_COMMANDER);
    const inferno = { units: [gwoUnit.inferno] };

    assert.ok(score(race, inferno).unlock > 0);
    assert.equal(score(race, inferno, legion).unlock, 0);
  });
});
