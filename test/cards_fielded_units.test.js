"use strict";

// gwoCard.fieldedUnits: the paths held plus the race or add-on units they
// bring at launch, which a card's deal() reads to see race units. See
// races.md, "Capability cells".

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  FIXTURE_RACE,
  FIXTURE_ADDON,
  fixtureIndex,
  fixtureAddonIndex,
} = require("../scripts/lib/race-fixture.js");

const cards = loadCouiModule(MOD_ROOT + "/shared/cards.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");

const FX_TANK = FIXTURE_RACE.units.fxTank;
const FX_ADDON_TANK = FIXTURE_ADDON.units.fxAddonTank;
const oTank = "/pa/units/land/o_tank/o_tank.json";

const { setGlobal, restoreGlobals } = createGlobalStubs();

const inventoryOf = (race, units) => ({
  units: () => units,
  hasCard: () => false,
  maxCards: () => 4,
  getTag: (ns, key) =>
    ns === "global" && key === "playerRace" ? race : undefined,
});

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
});

afterEach(() => {
  races.reset();
  restoreGlobals();
});

describe("fieldedUnits", () => {
  it("is the held paths the race owns until its cells are built", () => {
    races.register({ id: "other", unitTypeBit: "Custom9", units: { oTank } });
    const held = [gwoUnit.ant, FX_TANK, oTank];

    assert.deepEqual(cards.fieldedUnits(inventoryOf("mla", held)), [
      gwoUnit.ant,
    ]);
    assert.deepEqual(cards.fieldedUnits(inventoryOf("fixture", held)), [
      gwoUnit.ant,
      FX_TANK,
    ]);
  });

  it("drops another race's unit held once the cells are built", () => {
    races.register({ id: "other", unitTypeBit: "Custom9", units: { oTank } });
    races.setCells("fixture", fixtureIndex());
    const fielded = cards.fieldedUnits(
      inventoryOf("fixture", [gwoUnit.ant, oTank])
    );

    assert.ok(fielded.includes(FX_TANK));
    assert.equal(fielded.includes(oTank), false);
  });

  it("adds the race units the held paths bring, keeping the held ones", () => {
    races.setCells("fixture", fixtureIndex());
    const fielded = cards.fieldedUnits(
      inventoryOf("fixture", [gwoUnit.ant, gwoUnit.commander])
    );

    assert.ok(fielded.includes(FX_TANK));
    assert.ok(cards.hasUnit(fielded, gwoUnit.ant));
    assert.ok(cards.hasUnit(fielded, gwoUnit.commander));
    assert.equal(
      cards.hasUnit(
        cards.fieldedUnits(inventoryOf("fixture", [gwoUnit.dox])),
        FX_TANK
      ),
      false
    );
  });

  it("adds an MLA player's add-on units once the add-on index is built", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.setCells("mla", fixtureAddonIndex());

    const fielded = cards.fieldedUnits(inventoryOf("mla", [gwoUnit.ant]));
    assert.ok(fielded.includes(gwoUnit.ant));
    assert.ok(fielded.includes(FX_ADDON_TANK));
  });

  it("reuses its answer until the race, held paths or cells change", () => {
    races.setCells("fixture", fixtureIndex());
    const first = cards.fieldedUnits(inventoryOf("fixture", [gwoUnit.ant]));

    assert.equal(
      cards.fieldedUnits(inventoryOf("fixture", [gwoUnit.ant])),
      first
    );
    assert.notEqual(
      cards.fieldedUnits(inventoryOf("fixture", [gwoUnit.ant, gwoUnit.dox])),
      first
    );

    races.setCells("fixture", fixtureIndex());
    const rebuilt = cards.fieldedUnits(inventoryOf("fixture", [gwoUnit.ant]));
    assert.notEqual(rebuilt, first);
    assert.deepEqual(rebuilt, first);
  });
});

describe("upgradeCard with a race unit required", () => {
  it("deals once the held paths bring the race unit", () => {
    setGlobal("loc", (s) => s);
    races.setCells("fixture", fixtureIndex());
    const card = cards.upgradeCard({
      name: "!LOC:Fixture Tank Upgrade Tech",
      description: "!LOC:More health.",
      requires: FX_TANK,
    });

    assert.equal(
      card.deal({}, {}, inventoryOf("fixture", [gwoUnit.ant])).chance,
      60
    );
    assert.equal(
      card.deal({}, {}, inventoryOf("fixture", [gwoUnit.dox])).chance,
      0
    );
    assert.equal(
      card.deal({}, {}, inventoryOf("mla", [gwoUnit.ant])).chance,
      0
    );
  });
});
