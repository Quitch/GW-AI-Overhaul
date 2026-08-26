"use strict";

// A card whose wording was corrected returns the new text to English readers and
// the original to everyone else, so the community translations keep resolving.
// The two arms differ by a few words, which makes them exactly the thing a later
// tidy-up rewrites the wrong half of. The expected values below are the v6.9.0
// strings - the release those translations were made against.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { CARDS_DIR } = require("../scripts/lib/card-files.js");
const { installCardHarness } = require("../scripts/lib/card-probe.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

// Loadout cards reach for gw_common, ko and localStorage at define time, before
// any test runs.
installCardHarness();

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

// Loaded up front: the first loadCouiModule installs the loader's own i18n stub
// over whatever a test set, so no card may be loaded mid-test.
const cards = new Map();
function cardFor(file) {
  if (!cards.has(file)) {
    cards.set(file, loadCouiModule(path.join(CARDS_DIR, file)));
  }
  return cards.get(file);
}

function describeIn(file, language) {
  setGlobal("i18n", { detectLanguage: () => language });
  return cardFor(file).describe();
}

const TRANSLATED = [
  {
    file: "gwc_cost_economy.js",
    text: "!LOC:Economy Fabrication Tech reduces metal build costs of all metal and energy production structures by 50%",
  },
  {
    file: "gwc_damage_artillery.js",
    text: "!LOC:Artillery Ammunition Tech increases the damage of all artillery structures by 25% and reduces their energy usage by 90%. Requires technology to build artillery structures and units.",
  },
  {
    file: "gwc_enable_air_all.js",
    text: "!LOC:Complete air tech enables building of all mobile air units and factories. Basic air factories are built via your commander or any basic fabricator. Advanced factories are built via a basic or advanced vehicle fabricator.",
  },
  {
    file: "gwc_enable_bots_all.js",
    text: "!LOC:Complete Bot tech enables building of all Bots and all Bot Factories. Basic Bot factories are built via your commander or any basic fabricator. Advanced Bot factories are built via basic or advanced bot fabricators.",
  },
  {
    file: "gwc_enable_defenses_t2.js",
    text: "!LOC:Advanced Defense Technology enables more powerful defenses. Advanced defenses are built via advanced fabricators. Advanced defenses include tactical missile launchers, triple barrel laser turrets, and anti-air flak towers.",
  },
  {
    file: "gwc_enable_sea_all.js",
    text: "!LOC:Complete Naval Tech enables building of all naval units and all naval factories. Basic naval factories are built via your commander or any basic fabricator. Advanced naval factories are built via basic or advanced naval fabricators.",
  },
  {
    file: "gwc_enable_vehicles_all.js",
    text: "!LOC:Complete Vehicle tech enables building of all Vehicle and all Vehicle Factories. Basic Vehicle factories are built via your commander or any basic fabricator. Advanced Vehicle factories are built via basic or advanced vehicle fabricators.",
  },
  {
    file: "gwc_energy_efficiency_all.js",
    text: "!LOC:Complete Energy Tech reduces energy costs for intelligence structures by 75%, weapon energy costs by 75%.",
  },
  {
    file: "gwc_energy_efficiency_intel.js",
    text: "!LOC:Improved Intelligence Tech reduces energy costs for intelligence structures by 75%",
  },
  {
    file: "nem_start_nuke.js",
    text: "!LOC:Replaces conventional nukes with a new low-cost/low-yield variant and relies heavily on it for both offense and defence.",
  },
  // The interior !LOC: is the second key showing through the identity loc() stub.
  // A player sees neither marker, so losing one here means a key stopped being
  // looked up - which is the regression this entry exists to catch.
  {
    file: "gwaio_start_paratrooper.js",
    text: "!LOC:Contains no basic factories, just Lobs and Unit Cannons built by the commander. Strike from the skies, brothers! !LOC:Halves the cost of both. All land units can be built from the Unit Cannon as they are unlocked.",
  },
  {
    file: "gwaio_upgrade_planetaryradar.js",
    text: "!LOC:Planetary Upgrade Tech increases the vision of the planetary radar to match its radar.<br> <br>!LOC:Adds a new slot for another technology.",
  },
  {
    file: "gwaio_start_tourist.js",
    text: "!LOC:You turned up with a fat wallet, but little else. Huge amounts of storage, but no Metal Extractors and no basic land or air factories. Sub Commanders will not do anything except defend themselves and automatically transfer their excess income to you.",
  },
];

TRANSLATED.forEach((card) => cardFor(card.file));

describe("corrected card text is English-only", () => {
  for (const card of TRANSLATED) {
    it("hands " + card.file + " unchanged to a translated locale", () => {
      assert.equal(describeIn(card.file, "de"), card.text);
    });

    it("hands " + card.file + " the corrected text in English", () => {
      assert.notEqual(describeIn(card.file, "en"), card.text);
    });
  }

  // detectLanguage reports nothing when the engine has no locale to give, and the
  // source strings are English, so that reader gets the correction too.
  it("treats an undetected language as English", () => {
    for (const card of TRANSLATED) {
      assert.notEqual(describeIn(card.file, undefined), card.text);
    }
  });
});
