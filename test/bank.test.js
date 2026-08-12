"use strict";

// shared/bank.js. GWO keeps its own loadout unlocks in a separate localStorage
// key so uninstalling the mod cannot leave the base game's gw_start list full of
// ids it will 404 on.
//
// The module builds its instance at load, reading ko/api/localStorage in the
// constructor, so the stubs go in before loadCouiModule rather than per test.
// That instance is a singleton, as in-game; each test reloads it from a seeded
// localStorage instead of building its own.

const { describe, it, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  installGlobals,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const LS_KEY = "gwaio_bank";

// Enough knockout for a list the module reads, writes, pushes to and subscribes
// to. push replaces the array rather than mutating it, which is all the module
// can observe.
function observableArray(initial) {
  let value = initial || [];
  const subscribers = [];
  const notify = () => subscribers.forEach((fn) => fn(value));

  const observable = function (next) {
    if (arguments.length) {
      value = next;
      notify();
    }
    return value;
  };
  observable.subscribe = (fn) => subscribers.push(fn);
  observable.push = (item) => {
    value = value.concat([item]);
    notify();
  };
  return observable;
}

const tally = { stats: {}, reads: [], writes: [] };
const storage = {
  setItem(key, value) {
    this[key] = value;
  },
};

installGlobals();
const stubs = createGlobalStubs();
stubs.setGlobal("ko", {
  observableArray,
  // ko.toJSON unwraps observables; the bank only ever holds startCards.
  toJSON: (target) =>
    JSON.stringify(
      Object.keys(target).reduce((out, key) => {
        out[key] =
          typeof target[key] === "function" ? target[key]() : target[key];
        return out;
      }, {})
    ),
});
// Defined rather than assigned through the stub helper: Node ships its own
// localStorage accessor, and merely reading it to save a previous value emits an
// ExperimentalWarning about --localstorage-file.
Object.defineProperty(global, "localStorage", {
  value: storage,
  configurable: true,
  writable: true,
});
after(() => delete global.localStorage);

stubs.setGlobal("api", {
  tally: {
    getStatInt: (name) => {
      tally.reads.push(name);
      return Promise.resolve(tally.stats[name] || 0);
    },
    setStatInt: (name, value) => {
      tally.writes.push([name, value]);
      tally.stats[name] = value;
    },
  },
});

after(() => stubs.restoreGlobals());

const bank = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js"
);

// Seeds the stored value and reloads, which is how a test gets the bank into a
// known state without a second instance.
function reload(stored) {
  if (stored === undefined) {
    delete storage[LS_KEY];
  } else {
    storage[LS_KEY] = stored;
  }
  tally.stats = {};
  tally.reads = [];
  tally.writes = [];
  bank.load();
}

const ids = () => bank.startCards().map((card) => card.id);

// The subscription writes the tally stat asynchronously; a couple of microtask
// turns is enough to let it land.
const settle = () => Promise.resolve().then(() => Promise.resolve());

beforeEach(() => reload(undefined));

describe("bank load", () => {
  it("starts empty for a player who has never unlocked anything", () => {
    assert.deepEqual(bank.startCards(), []);
  });

  it("restores what was stored", () => {
    reload(JSON.stringify({ startCards: [{ id: "gwaio_start_ceo" }] }));
    assert.deepEqual(ids(), ["gwaio_start_ceo"]);
  });

  // This runs during AMD load, and rejecting the module would take down every
  // gw_start module that requires it. A corrupt list must cost the unlocks, not
  // the scene.
  it("degrades a corrupt record to an empty one rather than throwing", () => {
    const warnings = [];
    const priorWarn = console.warn;
    console.warn = (message) => warnings.push(message);
    try {
      reload("{ this is not json");
    } finally {
      console.warn = priorWarn;
    }

    assert.deepEqual(bank.startCards(), []);
    assert.match(warnings[0], /Ignoring unreadable loadout unlock record/);
  });

  it("ignores a record whose card list is not one", () => {
    reload(JSON.stringify({ startCards: "gwaio_start_ceo" }));
    assert.deepEqual(bank.startCards(), []);
    reload(JSON.stringify({}));
    assert.deepEqual(bank.startCards(), []);
  });

  it("does not write the record back while loading it", () => {
    const stored = JSON.stringify({ startCards: [{ id: "gwaio_start_ceo" }] });
    reload(stored);
    assert.equal(storage[LS_KEY], stored);
  });
});

describe("bank addStartCard", () => {
  it("records an unlock and persists it under GWO's own key", () => {
    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), true);

    assert.deepEqual(ids(), ["gwaio_start_ceo"]);
    assert.deepEqual(JSON.parse(storage[LS_KEY]), {
      startCards: [{ id: "gwaio_start_ceo" }],
    });
  });

  // Every card's buff() runs on every inventory application, so the same unlock
  // arrives many times over a war.
  it("records an unlock once", () => {
    bank.addStartCard({ id: "gwaio_start_ceo" });

    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), false);

    assert.deepEqual(ids(), ["gwaio_start_ceo"]);
  });

  it("keeps unlocks that differ", () => {
    bank.addStartCard({ id: "gwaio_start_ceo" });
    bank.addStartCard({ id: "gwaio_start_nomad" });
    assert.deepEqual(ids(), ["gwaio_start_ceo", "gwaio_start_nomad"]);
  });

  it("recognises a card it already holds by identity as well as by id", () => {
    const card = { id: "gwaio_start_ceo" };
    bank.addStartCard(card);
    assert.equal(bank.hasStartCard(card), true);
    assert.equal(bank.hasStartCard({ id: "gwaio_start_ceo" }), true);
    assert.equal(bank.hasStartCard({ id: "gwaio_start_nomad" }), false);
  });
});

// The stat drives the base game's own "loadouts unlocked" achievement, which
// counts GWO's loadouts too.
describe("bank unlock tally", () => {
  it("raises the recorded count as unlocks arrive", async () => {
    bank.addStartCard({ id: "gwaio_start_ceo" });
    await settle();
    assert.deepEqual(tally.writes, [["gw_unlocked_loadouts", 1]]);

    bank.addStartCard({ id: "gwaio_start_nomad" });
    await settle();
    assert.deepEqual(tally.writes[1], ["gw_unlocked_loadouts", 2]);
  });

  it("never lowers a count the player has already earned", async () => {
    reload(undefined);
    tally.stats.gw_unlocked_loadouts = 9;

    bank.addStartCard({ id: "gwaio_start_ceo" });
    await settle();

    assert.deepEqual(tally.writes, []);
  });

  it("asks for nothing when the list empties", async () => {
    reload(JSON.stringify({ startCards: [] }));
    await settle();
    assert.deepEqual(tally.reads, []);
  });
});

// A co-op host applies its viewers' inventories to weight their deals, which
// runs their loadout cards' buff(). Without this the host quietly unlocks every
// loadout its viewers are playing.
describe("bank suspendUnlocks", () => {
  const stock = () => {
    const added = [];
    return {
      added,
      addStartCard(card) {
        added.push(card);
        return true;
      },
    };
  };

  it("stops both banks recording anything while suspended", () => {
    const stockBank = stock();

    bank.suspendUnlocks(stockBank);

    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), false);
    assert.equal(stockBank.addStartCard({ id: "gwc_start_bot" }), false);
    assert.deepEqual(bank.startCards(), []);
    assert.deepEqual(stockBank.added, []);

    bank.resumeUnlocks();
  });

  it("records again once resumed", () => {
    const stockBank = stock();

    bank.suspendUnlocks(stockBank);
    bank.resumeUnlocks();

    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), true);
    assert.equal(stockBank.addStartCard({ id: "gwc_start_bot" }), true);
  });

  // Counted, because those applications overlap: an inner resume must not let
  // the outer one's cards through.
  it("stays suspended until every suspension is resumed", () => {
    const stockBank = stock();

    bank.suspendUnlocks(stockBank);
    bank.suspendUnlocks(stockBank);
    bank.resumeUnlocks();

    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), false);

    bank.resumeUnlocks();

    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), true);
  });

  it("ignores a resume that matches no suspension", () => {
    const stockBank = stock();
    const own = stockBank.addStartCard;

    bank.resumeUnlocks();

    assert.equal(stockBank.addStartCard, own);
    assert.equal(bank.addStartCard({ id: "gwaio_start_ceo" }), true);
  });

  // Restored by value rather than by deleting the override, so a bank another
  // mod had already patched keeps that mod's version.
  it("gives the stock bank back the function it had, not the original", () => {
    const stockBank = stock();
    const patchedByAnotherMod = function () {
      return "another mod";
    };
    stockBank.addStartCard = patchedByAnotherMod;

    bank.suspendUnlocks(stockBank);
    bank.resumeUnlocks();

    assert.equal(stockBank.addStartCard, patchedByAnotherMod);
  });
});
