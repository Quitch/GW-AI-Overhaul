"use strict";

// The three cards that deal once the player can build advanced structures:
// gwc_enable_defenses_t2, gwc_enable_titans and gwaio_enable_planetaryradar,
// each through gwoCard.hasAdvancedFabber or gwoCard.hasT2Access. See
// tech-cards.md.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../scripts/lib/amd-loader.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);
const gwoGroup = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js"
);
const load = (file) => loadCouiModule(path.join(CARDS_DIR, file));
const defences = load("gwc_enable_defenses_t2.js");
const titans = load("gwc_enable_titans.js");
const planetaryRadar = load("gwaio_enable_planetaryradar.js");

const CLUSTER = 4;
// Named rather than read from gwoGroup.fabbersCombat, so the cases below say
// which units must not open a card whatever the groups hold.
const COMBAT_FABBERS = [
  gwoUnit.angel,
  gwoUnit.barnacle,
  gwoUnit.mend,
  gwoUnit.stitch,
];

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

function chance(card, { units = [], cards = [], faction = 0 } = {}) {
  const inventory = {
    units: () => units,
    cards: () => cards.map((id) => ({ id })),
    getTag: (context, name) =>
      context === "global" && name === "playerFaction" ? faction : undefined,
  };
  return card.deal({}, {}, inventory).chance;
}

describe("Advanced Defense Technology", () => {
  it("is offered to the Naval Commander, whose loadout holds the advanced naval fabber", () => {
    setGlobal("model", { gwoCardsGrantingAdvancedTech: [] });

    assert.ok(
      chance(defences, {
        units: gwoGroup.naval,
        cards: ["gwaio_start_naval"],
      }) > 0
    );
  });

  it("is still offered for a card a mod lists as granting advanced tech", () => {
    setGlobal("model", {
      gwoCardsGrantingAdvancedTech: ["mym_enable_bots_all"],
    });

    assert.ok(chance(defences, { cards: ["mym_enable_bots_all"] }) > 0);
  });

  it("is not offered without an advanced fabber or such a card", () => {
    setGlobal("model", { gwoCardsGrantingAdvancedTech: [] });

    assert.equal(chance(defences), 0);
    assert.equal(chance(defences, { units: COMBAT_FABBERS }), 0);
    assert.equal(
      chance(defences, { units: [gwoUnit.colonel], faction: CLUSTER }),
      0
    );
  });

  it("is not offered once every advanced defence is held", () => {
    setGlobal("model", { gwoCardsGrantingAdvancedTech: [] });

    assert.equal(
      chance(defences, {
        units: gwoGroup.fabbersAdvanced.concat(
          gwoGroup.structuresDefencesAdvanced
        ),
      }),
      0
    );
  });
});

for (const [name, card] of [
  ["Titan Tech", titans],
  ["Planetary Radar Tech", planetaryRadar],
]) {
  describe(name, () => {
    it("is offered for an advanced fabber", () => {
      assert.ok(chance(card, { units: [gwoUnit.vehicleFabberAdvanced] }) > 0);
      assert.ok(chance(card, { units: [gwoUnit.colonel] }) > 0);
    });

    it("is not offered for a combat fabber alone", () => {
      for (const unit of COMBAT_FABBERS) {
        assert.equal(chance(card, { units: [unit] }), 0, unit);
      }
    });

    it("is not offered for a Cluster player's Colonel alone", () => {
      assert.equal(
        chance(card, { units: [gwoUnit.colonel], faction: CLUSTER }),
        0
      );
    });
  });
}

// GWO's own list. gw_play/cards.js is a scene script that touches the engine at
// load, so the list is read from its source, as card_deal_unit_gate.test.js
// reads card_tooltips.js.
function grantingAdvancedTech() {
  const source = fs.readFileSync(
    path.join(
      REPO_ROOT,
      "ui",
      "mods",
      "com.pa.quitch.gwaioverhaul",
      "gw_play",
      "cards.js"
    ),
    "utf8"
  );
  const block = /model\.gwoCardsGrantingAdvancedTech\.push\(([\s\S]*?)\);/.exec(
    source
  );
  assert.ok(block, "no model.gwoCardsGrantingAdvancedTech.push in cards.js");
  return [...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

// Each upgrade lets its basic fabber build advanced structures, the Ragnarok
// and the Planetary Radar among them, without granting an advanced fabber.
const FABRICATION_UPGRADES = [
  ["gwaio_upgrade_fabricationaircraft", gwoUnit.airFabber],
  ["gwaio_upgrade_fabricationbot", gwoUnit.botFabber],
  ["gwaio_upgrade_fabricationship", gwoUnit.navalFabber],
  ["gwaio_upgrade_fabricationvehicle", gwoUnit.vehicleFabber],
];

describe("a Fabrication Upgrade Tech", () => {
  for (const [name, card] of [
    ["Advanced Defense Technology", defences],
    ["Titan Tech", titans],
    ["Planetary Radar Tech", planetaryRadar],
  ]) {
    it("opens " + name + " with no advanced fabber", () => {
      const granting = grantingAdvancedTech();
      setGlobal("model", { gwoCardsGrantingAdvancedTech: granting });

      for (const [upgrade, basicFabber] of FABRICATION_UPGRADES) {
        assert.ok(
          granting.includes(upgrade),
          upgrade + " grants advanced tech"
        );
        assert.ok(
          chance(card, { units: [basicFabber], cards: [upgrade] }) > 0,
          upgrade
        );
      }
    });
  }
});

describe("Titan Tech's orbital route", () => {
  it("is offered for the orbital factory with an orbital fabber", () => {
    assert.ok(
      chance(titans, {
        units: [gwoUnit.orbitalFactory, gwoUnit.orbitalFabber],
        faction: CLUSTER,
      }) > 0
    );
    assert.equal(chance(titans, { units: [gwoUnit.orbitalFabber] }), 0);
  });
});
