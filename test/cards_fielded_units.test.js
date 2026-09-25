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
  FIXTURE_ADDON_SPECS,
  FIXTURE_ADDON_UNITS,
  FIXTURE_SPECS,
  FIXTURE_UNITS,
  fixtureIndex,
} = require("../scripts/lib/race-fixture.js");

const cards = loadCouiModule(MOD_ROOT + "/shared/cards.js");
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const unitCells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");

const FX_TANK = FIXTURE_RACE.units.fxTank;
const FX_ADDON_TANK = FIXTURE_ADDON.units.fxAddonTank;

const { setGlobal, restoreGlobals } = createGlobalStubs();

const inventoryOf = (race, units) => ({
  units: () => units,
  hasCard: () => false,
  maxCards: () => 4,
  getTag: (ns, key) =>
    ns === "global" && key === "playerRace" ? race : undefined,
});

// The add-on index race_cells.js builds for MLA.
const mlaAddonIndex = () => {
  const units = FIXTURE_UNITS.concat(FIXTURE_ADDON_UNITS);
  const specs = Object.assign({}, FIXTURE_SPECS, FIXTURE_ADDON_SPECS);
  const addonPaths = races.addonUnitPaths();
  return {
    vanilla: unitCells.buildIndex(
      units,
      specs,
      (types, path) => unitCells.vanillaMember(types) && !addonPaths[path]
    ),
    race: unitCells.buildIndex(
      units,
      specs,
      (types, path) => unitCells.vanillaMember(types) && !!addonPaths[path],
      unitCells.exclusiveMember(races.knownBits())
    ),
  };
};

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
});

afterEach(() => {
  races.reset();
  restoreGlobals();
});

describe("fieldedUnits", () => {
  it("is the held paths until the player's cells are built", () => {
    const held = [gwoUnit.ant];

    assert.equal(cards.fieldedUnits(inventoryOf("mla", held)), held);
    assert.equal(cards.fieldedUnits(inventoryOf("fixture", held)), held);
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
    races.setCells("mla", mlaAddonIndex());

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
