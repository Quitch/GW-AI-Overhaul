"use strict";

// gw_play/bugfixes.js, run as the scene runs it: the Lucky Commander repair,
// which moves a Lucky Commander that GWO 5.76.0 banked in the base game's
// record into GWO's own. Its flag is the profile's, not the war's.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { runSceneScript } = require("../scripts/lib/scene-script.js");

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

// The base game's bank, as shared/gw_bank.js keeps it: its own copy of
// gw_bank, read when the scene loads and written back whole on each change.
function stockBankFor(store) {
  let startCards = structuredClone(store.gw_bank.startCards);
  const save = () => {
    store.gw_bank = { startCards: structuredClone(startCards) };
  };
  return {
    startCards: (...value) => {
      if (value.length) {
        startCards = value[0];
        save();
        return undefined;
      }
      return startCards;
    },
    addStartCard: (card) => {
      if (startCards.some((held) => held.id === card.id)) {
        return false;
      }
      startCards.push(card);
      save();
      return true;
    },
  };
}

// localStorage as the `local` extender reads it, keyed as the scene keys it.
// Returns the base game's bank, loaded from the same profile.
function installProfile(store) {
  const backedBy = (key) => {
    const observable = function (...value) {
      if (value.length) {
        store[key] = value[0];
        return undefined;
      }
      return store[key];
    };
    observable.valueHasMutated = () => {};
    return observable;
  };
  const extendable = () => ({ extend: (options) => backedBy(options.local) });
  stubs.setGlobal("ko", {
    observable: extendable,
    observableArray: extendable,
  });
  return stockBankFor(store);
}

// A war whose every war-side repair is already recorded, created by `version`.
function installWar(version) {
  const gwaio = {
    version,
    treasurePlanetFixed: true,
    clusterFixed: true,
    treasureLoadoutDerived: true,
    planetPositionFixed: true,
  };
  const star = { system: () => ({ gwaio, planets: [] }), cardList: () => [] };
  const game = {
    isTutorial: () => false,
    galaxy: () => ({ stars: () => [star], origin: () => 0 }),
    inventory: () => ({}),
  };
  stubs.setGlobal("model", { game: () => game });
}

function runRepair(stockBank) {
  const banked = [];
  const saves = [];
  const errors = [];
  stubs.setGlobal("console", { error: (text) => errors.push(text) });
  stubs.setGlobal("requireGW", (ids, onLoad) =>
    onLoad(
      (game) => saves.push(game),
      {},
      { addStartCard: (card) => banked.push(card.id) },
      {},
      { playerIsCluster: () => false },
      { bank: stockBank }
    )
  );
  runSceneScript(MOD_ROOT + "/gw_play/bugfixes.js");
  return { banked, saves, errors };
}

describe("the Lucky Commander repair", () => {
  // The war's version says when the war was made, not what the profile's bank
  // holds, so a war made after the fix never set the flag for a profile that
  // unlocked Lucky Commander under 5.76.0.
  it("moves the loadout into GWO's bank whatever version made the war", () => {
    const store = {
      gw_bank: {
        startCards: [{ id: "gwc_start_air" }, { id: "gwaio_start_lucky" }],
      },
    };
    const stockBank = installProfile(store);
    installWar("7.4.1");

    const { banked, saves, errors } = runRepair(stockBank);

    assert.deepEqual(errors, []);
    assert.deepEqual(banked, ["gwaio_start_lucky"]);
    assert.deepEqual(store.gw_bank.startCards, [{ id: "gwc_start_air" }]);
    assert.equal(store.gwaio_lucky_commander_moved, "true");
    assert.equal(saves.length, 1);
  });

  // Versions up to 7.4.1 set gwaio_lucky_commander_fixed from the war's
  // version without moving the card, so that flag proves nothing.
  it("moves it for a profile an older version marked as fixed", () => {
    const store = {
      gw_bank: { startCards: [{ id: "gwaio_start_lucky" }] },
      gwaio_lucky_commander_fixed: "true",
    };
    const stockBank = installProfile(store);
    installWar("7.4.1");

    const { banked } = runRepair(stockBank);

    assert.deepEqual(banked, ["gwaio_start_lucky"]);
    assert.deepEqual(store.gw_bank.startCards, []);
    assert.equal(store.gwaio_lucky_commander_moved, "true");
  });

  // The base game's bank still held the card it loaded, and its next unlock
  // wrote it back, after the flag had stopped any further repair.
  it("keeps the card out when the base game's bank next saves", () => {
    const store = {
      gw_bank: { startCards: [{ id: "gwaio_start_lucky" }] },
    };
    const stockBank = installProfile(store);
    installWar("7.4.1");

    runRepair(stockBank);
    stockBank.addStartCard({ id: "gwc_start_bot" });

    assert.deepEqual(store.gw_bank.startCards, [{ id: "gwc_start_bot" }]);
    assert.equal(store.gwaio_lucky_commander_moved, "true");
  });

  it("skips the scan once the profile's flag is set", () => {
    const store = {
      gw_bank: { startCards: [{ id: "gwaio_start_lucky" }] },
      gwaio_lucky_commander_moved: "true",
    };
    const stockBank = installProfile(store);
    installWar("7.4.1");

    const { banked, saves } = runRepair(stockBank);

    assert.deepEqual(banked, []);
    assert.deepEqual(store.gw_bank.startCards, [{ id: "gwaio_start_lucky" }]);
    assert.equal(saves.length, 0);
  });
});
