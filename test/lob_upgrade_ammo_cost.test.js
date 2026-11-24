"use strict";

// GWO #173: Lob Upgrade Tech turns the Lob's ammo to time, and Artillery
// Ammunition Tech cuts ammo cost. Together they left a volley that never
// emptied. See specs.md, "Ammo-cost mods".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createAutoStub } = require("../scripts/lib/auto-stub.js");
const { loadAllCards } = require("../scripts/lib/card-probe.js");
const {
  createCapturingInventory,
  recordInto,
} = require("../scripts/lib/capturing-inventory.js");

const cards = loadAllCards().byFile;
const specs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/specs.js"
);
const gwoCard = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"
);
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);

const TAG = ".player";
const BASE_TURRET =
  "/pa/tools/base_artillery_turret/base_artillery_turret.json";

// The stock Lob weapon's ammo and range keys, as the base game ships them.
function stockSpecs() {
  return {
    [BASE_TURRET + TAG]: { target_priorities: ["Mobile"] },
    [gwoUnit.lobWeapon + TAG]: {
      base_spec: BASE_TURRET + TAG,
      max_firing_velocity: 185,
      ammo_source: "metal",
      ammo_capacity: 432,
      ammo_demand: 13,
      ammo_per_shot: 50,
      max_range: 340,
      carpet_fire: true,
      carpet_wait_for_full_ammo: true,
    },
  };
}

// A loadout reads the commander tag; nothing else steers which mods a card
// adds.
function modsOf(file) {
  const mods = [];
  cards.get(file).buff(
    createCapturingInventory({
      answers: {
        maxCards: () => 0,
        lookupCard: () => 0,
        hasCard: () => false,
        getTag: (context, name, def) =>
          context === "global" && name === "commander"
            ? gwoUnit.commander
            : def,
      },
      capture: { addMods: recordInto(mods) },
    }),
    createAutoStub()
  );
  return mods;
}

function cookedLob(mods) {
  const data = stockSpecs();
  // The cards name other artillery too, whose specs are not in the fixture.
  specs.mod(
    data,
    mods.filter((mod) => mod.file + TAG in data),
    TAG
  );
  const lob = data[gwoUnit.lobWeapon + TAG];
  return [
    lob.ammo_source,
    lob.ammo_capacity,
    lob.ammo_demand,
    lob.ammo_per_shot,
  ];
}

describe("Lob Upgrade Tech with Artillery Ammunition Tech", () => {
  const upgrade = modsOf("gwaio_upgrade_lob.js");
  const ammunition = modsOf("gwc_damage_artillery.js");

  it("keeps the upgrade's ammo, whichever card comes first", () => {
    [upgrade.concat(ammunition), ammunition.concat(upgrade)].forEach((mods) => {
      assert.deepEqual(cookedLob(mods), ["time", 17, 0, 2]);
    });
  });

  // The Guardians take every player's mods, so a card can arrive twice and
  // the two cards can come from different players.
  it("keeps it when the Guardians hold more than one copy", () => {
    assert.deepEqual(
      cookedLob(ammunition.concat(upgrade, ammunition, upgrade)),
      ["time", 17, 0, 2]
    );
  });

  it("still cuts the stock Lob's metal cost without the upgrade", () => {
    const cooked = cookedLob(ammunition);
    assert.equal(cooked[0], "metal");
    assert.deepEqual(
      cooked.slice(1).map((value) => Math.round(value * 10) / 10),
      [43.2, 1.3, 5]
    );
  });
});

describe("cards that cut ammo cost", () => {
  const isCut = (mod) =>
    mod.op === "multiply" &&
    gwoCard.paths.energyWeapon.includes(mod.path) &&
    mod.value < 1;
  const cutting = [...cards.keys()].filter(
    (file) =>
      typeof cards.get(file).buff === "function" && modsOf(file).some(isCut)
  );

  it("are the four known to", () => {
    assert.deepEqual(cutting.sort(), [
      "gwc_damage_artillery.js",
      "gwc_energy_efficiency_all.js",
      "gwc_energy_efficiency_weapons.js",
      "gwc_start_combatcdr.js",
    ]);
  });

  it("flag each cut, and nothing else", () => {
    cutting.forEach((file) => {
      modsOf(file).forEach((mod) => {
        assert.equal(
          mod.ammoCost === true,
          isCut(mod),
          file + " " + mod.file + " " + mod.path
        );
      });
    });
  });
});
