"use strict";

// Runs a tech card's deal() and buff() under Node, so a test can ask what a card
// would be offered at and what it grants. Contrast cards-contract.js, which only
// shape-checks what define() returns. See testing.md.

const path = require("node:path");
const { loadCouiModule, registerModuleStub } = require("./amd-loader.js");
const { createAutoStub } = require("./auto-stub.js");
const {
  CARDS_DIR,
  classifyLoadFailure,
  listCardFiles,
} = require("./card-files.js");

// A real array, not createAutoStub(): farForSize walks
// `Math.min(numberOfSystems.length, thresholds.length) - 1`, and a stub makes that
// NaN, so the tier loop never runs and every card scores at tier 0. The sweep would
// still pass while testing almost nothing.
//
// The base game ships five sizes; these are the nine that shared/cards.js's own
// distances tables are cut for, which is the five plus the four Bigger Galactic War
// adds. Nine makes every tier reachable, and its thresholds are a superset of the
// five-size ones. Same table as cards.test.js.
const GW_COMMON_STUB = {
  balance: {
    initialCardSlots: 4,
    numberOfSystems: [18, 24, 36, 54, 78, 108, 144, 186, 234],
  },
};

// One size either side of every numberOfSystems boundary, so every tier of every
// distances table is selected. distances.far tops out at 13, so distance 0..15
// straddles the largest threshold: a card offered only at the far edge of the
// largest galaxy is still probed.
const TOTAL_SIZES = [1, 19, 25, 37, 55, 79, 109, 145, 187, 235];
const MAX_DISTANCE = 15;

// shared/bank.js builds itself at define time, so the loadout cards read ko and
// localStorage before anything is probed. Same stand-ins as
// cluster_subcommander_buildable.test.js.
function makeObservable(initial) {
  let value = initial;
  const observable = function () {
    if (arguments.length) {
      value = arguments[0];
      return;
    }
    return value;
  };
  observable.subscribe = () => ({ dispose: () => {} });
  observable.extend = () => observable;
  return observable;
}

let harnessInstalled = false;

function installCardHarness() {
  if (harnessInstalled) {
    return;
  }
  registerModuleStub("shared/gw_common", GW_COMMON_STUB);
  global.ko = {
    observable: makeObservable,
    observableArray: makeObservable,
    computed: (fn) => fn,
  };
  global.localStorage = {};
  harnessInstalled = true;
}

// Deliberately no `model` global. No card in scope reads one inside deal(), and
// leaving it undefined means a card that starts to throws here rather than being
// silently weighted against a fake galaxy - the same reasoning amd-loader.js gives
// for leaving api/model/ko undefined.
function loadAllCards() {
  installCardHarness();

  const byFile = new Map();
  const unloadable = [];

  for (const file of listCardFiles()) {
    try {
      byFile.set(file, loadCouiModule(path.join(CARDS_DIR, file)));
    } catch (e) {
      if (classifyLoadFailure(e, file)) {
        unloadable.push(file);
        continue;
      }
      throw e;
    }
  }

  return { byFile, unloadable };
}

function cardIdFromFile(file) {
  return file.replace(/\.js$/, "");
}

// Auto-stubbed only as a fallback, so a future gwc_start.buff() call does not need
// this fixture updated. The three answers given explicitly are the ones that steer
// what it grants: a non-Cluster player, holding the base commander.
function recordGrantedUnits(buff, gwoUnit, hasCard) {
  let granted = [];
  const inventory = new Proxy(
    {
      addUnits: function (units) {
        granted = granted.concat(units);
        return createAutoStub();
      },
      addMods: () => createAutoStub(),
      addAIMods: () => createAutoStub(),
      removeUnits: () => createAutoStub(),
      maxCards: () => 0,
      lookupCard: () => 0,
      hasCard: () => hasCard,
      getTag: function (context, name, def) {
        if (context === "global" && name === "commander") {
          return gwoUnit.commander;
        }
        if (context === "global" && name === "playerFaction") {
          return 0;
        }
        return def;
      },
      setTag: () => createAutoStub(),
    },
    {
      get(target, prop) {
        return prop in target ? target[prop] : createAutoStub();
      },
    }
  );

  buff(inventory);
  return granted.filter((unit) => typeof unit === "string");
}

// The guaranteed starter set is whatever gwc_start.buff() actually grants, recorded
// rather than restated: a change to gwoGroup.orbitalBasic must move this baseline
// instead of silently disagreeing with it.
function starterUnits(cards, gwoUnit) {
  const gwcStart = cards.get("gwc_start.js");
  if (!gwcStart) {
    throw new Error("card-probe: gwc_start.js did not load");
  }
  return new Set(recordGrantedUnits(gwcStart.buff, gwoUnit, false));
}

// Both branches of a hasCard fork are real in-game states, so take each card down
// both rather than whichever a fixed answer picks - as
// cluster_subcommander_buildable.test.js does.
function grantedUnits(card, gwoUnit) {
  const granted = new Set();
  if (typeof card.buff !== "function") {
    return granted;
  }
  for (const hasCard of [false, true]) {
    for (const unit of recordGrantedUnits(card.buff, gwoUnit, hasCard)) {
      granted.add(unit);
    }
  }
  return granted;
}

// A plain object rather than createAutoStub(): every call a card makes at deal time
// is answered here, so one reaching for anything else fails loudly instead of being
// scored against a proxy that says yes to everything.
function makeInventory(units) {
  return {
    units: () => units,
    // No other tech held - the state under test is a player holding this card alone.
    cards: () => [],
    // subcommanderWeight returns 0 with an empty retinue, so a card gated on it
    // looks permanently undealable. Every such card today is out of scope (no
    // card_units.js entry); one brought into scope needs this swept too.
    minions: () => [],
    hasCard: () => false,
    // -1 is gw_inventory's "absent". 0 would mean "the first card in the hand".
    lookupCard: () => -1,
    getTag: (context, name, def) => def,
    setTag: () => {},
    maxCards: () => 10,
    handIsFull: () => false,
    // deal() must not mutate, but a card that does should be a no-op here rather
    // than a crash; either way the mutation cannot reach the assertion.
    addMods: () => {},
    addUnits: () => {},
    addAIMods: () => {},
    removeUnits: () => {},
  };
}

// chance must not depend on rng - tech-cards.md - so any fixed draw will do.
const fixedRng = () => 0.5;

function chanceFrom(result) {
  if (!result || typeof result !== "object") {
    return 0;
  }
  return typeof result.chance === "number" ? result.chance : 0;
}

// The highest weight the card reaches anywhere in the galaxy, so "never offered"
// means never, rather than not at the one distance a spot check happened to pick.
function maxChance(card, inventory) {
  let highest = 0;
  for (const totalSize of TOTAL_SIZES) {
    const context = { totalSize };
    for (let distance = 0; distance <= MAX_DISTANCE; distance++) {
      const system = { distance: () => distance };
      const chance = chanceFrom(
        card.deal(system, context, inventory, fixedRng)
      );
      if (chance > highest) {
        highest = chance;
      }
    }
  }
  return highest;
}

module.exports = {
  CARDS_DIR,
  GW_COMMON_STUB,
  MAX_DISTANCE,
  TOTAL_SIZES,
  cardIdFromFile,
  grantedUnits,
  installCardHarness,
  loadAllCards,
  makeInventory,
  maxChance,
  starterUnits,
};
