"use strict";

// The GWO delta in the shadowed base-game shared/js/gw_inventory.js: the hold
// that stops a viewer banking the host's loadouts while applying the host's
// inventory. See coop.md, "Whose unlocks are whose". The host side of the same
// hold is pinned in bank.test.js and the three cards_coop_* factory suites.
//
// shared/gw_bank and shared/gw_game_patches are base-game modules, so both are
// registered as stubs before the first load. The module hijacks patch() at
// define time, which means it writes onto the stub object this file owns - that
// is the handle for raising the flag, and why no test-only export is needed.
//
// The flag is module-private and node --test gives one process per file, not
// per test, so every test either consumes it or clears it in afterEach.

const { describe, it, before, after, afterEach } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  installGlobals,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

installGlobals();

// Opaque to this file: suspendUnlocks only hands it to the real bank, which
// bank.test.js already covers. Asserted by identity, so it must be the object
// the module received as shared/gw_bank.
const stockBank = { stock: true };
registerModuleStub("shared/gw_bank", stockBank);

const patched = [];
const gamePatches = {
  patch: function (game) {
    patched.push(game);
    return "stock";
  },
};
registerModuleStub("shared/gw_game_patches", gamePatches);

const bank = [];
registerModuleStub("coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js", {
  suspendUnlocks: (target) => bank.push(["suspend", target]),
  resumeUnlocks: () => bank.push("resume"),
});

// Enough knockout for the observables the prototype reads, writes and marks
// mutated. remove() drops every equal item, which is what GWO's removeUnits
// relies on to clear multiple copies of a unit.
function observable(initial) {
  let value = initial;
  const self = function (next) {
    if (arguments.length) {
      value = next;
    }
    return value;
  };
  self.valueHasMutated = () => mutations.push(value);
  return self;
}

function observableArray(initial) {
  const self = observable(initial || []);
  self.remove = (item) => self(self().filter((entry) => entry !== item));
  return self;
}

const mutations = [];

const stubs = createGlobalStubs();
stubs.setGlobal("ko", {
  observable,
  observableArray,
  // Own properties only, which is exactly the observables the constructor sets.
  toJS: (target) =>
    Object.keys(target).reduce((out, key) => {
      out[key] =
        typeof target[key] === "function" ? target[key]() : target[key];
      return out;
    }, {}),
});

// cards/<id> lookups, answered synchronously. applyCards is only asynchronous
// through _.delay, so a synchronous card keeps the suspend/resume pair
// observable without draining timers.
let cardModules = {};
stubs.setGlobal("requireGW", (ids, onLoad, onError) => {
  const id = String(ids[0]).replace("cards/", "");
  if (!Object.prototype.hasOwnProperty.call(cardModules, id)) {
    onError("no such card");
    return;
  }
  onLoad(cardModules[id]);
});

let role;
// Defined rather than assigned through the stub helper: Node ships its own
// sessionStorage accessor, and merely reading it to save a previous value emits
// an ExperimentalWarning about --localstorage-file.
const defineSessionStorage = (value) =>
  Object.defineProperty(global, "sessionStorage", {
    value,
    configurable: true,
    writable: true,
  });

defineSessionStorage({ getItem: () => JSON.stringify(role) });

// _.delay carries the dirty re-run. node:test's timer mocks cannot reach it -
// lodash 3 binds context.setTimeout once, at load - so it is captured by
// swapping the global lodash for one bound to a recording setTimeout.
const delayed = [];
let realLodash;

before(() => {
  realLodash = global._;
  global._ = realLodash.runInContext({
    setTimeout: (fn, wait) => delayed.push({ fn, wait }),
  });
});

after(() => {
  global._ = realLodash;
  stubs.restoreGlobals();
  delete global.sessionStorage;
});

const GWInventory = loadCouiModule("shared/gw_inventory");

// The GWO wrapper installed over the stub at define time.
const patch = gamePatches.patch;

const perPlayerTechGame = (on) => ({ perPlayerTechCards: () => on });

// Raises the hold the way GWGame.load does: a viewer session, then patch() with
// a per-player-tech game, immediately before the apply it is meant to cover.
function raise(session, game) {
  role = session === undefined ? "host" : session;
  return patch(game === undefined ? perPlayerTechGame(true) : game);
}

function inventoryHolding(cards) {
  const inventory = new GWInventory();
  inventory.load({ cards, maxCards: 5 });
  return inventory;
}

afterEach(() => {
  // Lowers the flag for the next test without consuming an apply.
  role = "host";
  patch(perPlayerTechGame(true));
  bank.length = 0;
  patched.length = 0;
  delayed.length = 0;
  mutations.length = 0;
  cardModules = {};
  role = "host";
});

describe("gw_inventory - the patch hijack", () => {
  it("still calls the stock patch through, with its game and its answer", () => {
    const game = perPlayerTechGame(true);

    assert.equal(patch(game), "stock");
    assert.deepEqual(patched, [game]);
  });
});

describe("gw_inventory - holding the bank for another player's cards", () => {
  it("suspends around the apply a viewer session flagged, and resumes after", () => {
    cardModules.gwc_start_orbital = { buff: () => {}, dull: () => {} };
    raise("viewer");

    inventoryHolding([{ id: "gwc_start_orbital" }]).applyCards();

    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });

  it("leaves banking alone for every other kind of load", () => {
    const cases = {
      "a host session": ["host", perPlayerTechGame(true)],
      "shared tech": ["viewer", perPlayerTechGame(false)],
      "no game at all": ["viewer", undefined],
      "a game predating per-player tech": ["viewer", {}],
    };

    for (const [name, [session, game]] of Object.entries(cases)) {
      cardModules.gwc_start_orbital = { buff: () => {}, dull: () => {} };
      role = session;
      patch(game);

      inventoryHolding([{ id: "gwc_start_orbital" }]).applyCards();

      assert.deepEqual(bank, [], name);
      bank.length = 0;
    }
  });

  // The role is read before the campaign half of `model` exists, so a runtime
  // with no sessionStorage at all has to degrade rather than throw.
  it("leaves banking alone when the session role cannot be read", () => {
    cardModules.gwc_start_orbital = { buff: () => {}, dull: () => {} };
    delete global.sessionStorage;
    patch(perPlayerTechGame(true));

    inventoryHolding([{ id: "gwc_start_orbital" }]).applyCards();

    assert.deepEqual(bank, []);
    defineSessionStorage({ getItem: () => JSON.stringify(role) });
  });

  // The apply GWGame.load flagged is the one immediately following, so the
  // viewer's own later card choices bank normally.
  it("holds for one apply only", () => {
    cardModules.gwc_start_orbital = { buff: () => {}, dull: () => {} };
    raise("viewer");
    const inventory = inventoryHolding([{ id: "gwc_start_orbital" }]);

    inventory.applyCards();
    inventory.applyCards();

    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });

  // A card calling applyCards from its own buff only marks the pass dirty;
  // finishApplyCards re-runs the real one on a delay. That re-run is a fresh
  // pass, and the flag is already spent, so it must not suspend a second time.
  it("does not hold again for the re-run a dirty pass schedules", () => {
    let dirtied = false;
    let inventory;
    cardModules.gwc_start_orbital = {
      buff: () => {
        if (!dirtied) {
          dirtied = true;
          inventory.applyCards();
        }
      },
      dull: () => {},
    };
    raise("viewer");
    inventory = inventoryHolding([{ id: "gwc_start_orbital" }]);

    inventory.applyCards();
    assert.equal(delayed.length, 1, "the dirty re-run was scheduled");
    delayed.shift().fn();

    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });

  it("resumes even when a card fails to load", () => {
    raise("viewer");
    const errors = [];
    const priorError = console.error;
    console.error = (message) => errors.push(message);

    try {
      inventoryHolding([{ id: "gwc_missing" }]).applyCards();
    } finally {
      console.error = priorError;
    }

    // Once for the buff pass and once for the dull pass.
    assert.equal(errors.length, 2);
    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });
});

describe("gw_inventory - the inventory itself", () => {
  it("loads an absent config as an empty inventory", () => {
    const inventory = new GWInventory();

    inventory.load();

    assert.deepEqual(inventory.cards(), []);
    assert.deepEqual(inventory.units(), []);
    assert.deepEqual(inventory.aiMods(), []);
    assert.deepEqual(inventory.mods(), []);
    assert.deepEqual(inventory.minions(), []);
    assert.deepEqual(inventory.tags(), {});
    assert.equal(inventory.maxCards(), 0);
  });

  // A saved maxCards of 0 is a real value, not an absent one.
  it("keeps a saved maxCards of zero", () => {
    const inventory = new GWInventory();
    inventory.load({ maxCards: 0 });
    assert.equal(inventory.maxCards(), 0);
  });

  it("loads cards without applying them", () => {
    const inventory = new GWInventory();

    inventory.load({ cards: [{ id: "gwc_missing" }] });

    assert.deepEqual(inventory.cards(), [{ id: "gwc_missing" }]);
    assert.deepEqual(bank, []);
  });

  it("saves what it loaded", () => {
    const config = {
      units: ["u"],
      aiMods: [{ id: "m" }],
      mods: ["mod"],
      maxCards: 3,
      cards: [{ id: "gwc_x" }],
      minions: [{ id: "min" }],
      tags: { global: { playerFaction: 1 } },
    };
    const inventory = new GWInventory();

    inventory.load(config);

    assert.deepEqual(inventory.save(), config);
  });

  it("appends units, ai mods and mods", () => {
    const inventory = new GWInventory();
    inventory.load({ units: ["a"] });

    inventory.addUnits(["b", "c"]);
    inventory.addAIMods([{ id: "m" }]);
    inventory.addMods(["mod"]);

    assert.deepEqual(inventory.units(), ["a", "b", "c"]);
    assert.deepEqual(inventory.aiMods(), [{ id: "m" }]);
    assert.deepEqual(inventory.mods(), ["mod"]);
  });

  // GWO's change to the stock behaviour: stock removes one copy per remove,
  // leaving a unit two cards granted still buildable after one is dulled.
  it("removes every copy of a unit", () => {
    const inventory = new GWInventory();
    inventory.load({ units: ["tank", "bot", "tank"] });

    inventory.removeUnits(["tank"]);

    assert.deepEqual(inventory.units(), ["bot"]);
  });

  it("finds a held card, but not a unique one", () => {
    const inventory = new GWInventory();
    inventory.load({ cards: [{ id: "gwc_a" }, { id: "gwc_u", unique: true }] });

    assert.equal(inventory.hasCard("gwc_a"), true);
    assert.equal(inventory.hasCard("gwc_u"), false);
    assert.equal(inventory.hasCard("gwc_absent"), false);
  });

  it("matches a card-like by its id function", () => {
    const inventory = new GWInventory();
    inventory.load({ cards: [{ id: "gwc_a" }] });

    assert.equal(inventory.hasCardLike({ id: () => "gwc_a" }), true);
    assert.equal(inventory.hasCardLike({ id: () => "gwc_b" }), false);
    assert.equal(inventory.hasCardLike(undefined), false);
    assert.equal(inventory.hasCardLike({}), false);
  });

  it("looks a card up by id or by shape", () => {
    const inventory = new GWInventory();
    inventory.load({ cards: [{ id: "gwc_a" }, { id: "gwc_b", n: 2 }] });

    assert.equal(inventory.lookupCard("gwc_b"), 1);
    assert.equal(inventory.lookupCard({ n: 2 }), 1);
    assert.equal(inventory.lookupCard("gwc_absent"), -1);
  });

  it("fits a card only while there is room, unless it overflows", () => {
    const inventory = new GWInventory();
    inventory.load({ cards: [{ id: "gwc_a" }], maxCards: 2 });

    assert.equal(inventory.canFitCard("gwc_b"), true);
    assert.equal(inventory.handIsFull(), false);

    inventory.load({ cards: [{ id: "gwc_a" }, { id: "gwc_b" }], maxCards: 2 });

    assert.equal(inventory.canFitCard("gwc_c"), false);
    assert.equal(inventory.canFitCard({ allowOverflow: true }), true);
    assert.equal(inventory.handIsFull(), true);
  });

  it("reads a tag back, and only writes one when given a default", () => {
    const inventory = new GWInventory();
    inventory.load({ tags: { global: { playerFaction: 2 } } });

    assert.equal(inventory.getTag("global", "playerFaction"), 2);
    assert.equal(inventory.getTag("global", "absent"), undefined);
    assert.equal(inventory.getTag("absent", "absent"), undefined);
    assert.deepEqual(inventory.tags(), { global: { playerFaction: 2 } });

    assert.equal(inventory.getTag("global", "seeded", 7), 7);
    assert.equal(inventory.getTag("fresh", "seeded", 8), 8);
    assert.deepEqual(inventory.tags(), {
      global: { playerFaction: 2, seeded: 7 },
      fresh: { seeded: 8 },
    });
  });

  it("drops a tag context once its last tag is unset", () => {
    const inventory = new GWInventory();
    inventory.load({ tags: {} });

    inventory.setTag("card", "kept", 1);
    inventory.setTag("card", "dropped", 2);
    inventory.setTag("card", "dropped", undefined);
    assert.deepEqual(inventory.tags(), { card: { kept: 1 } });

    inventory.setTag("card", "kept", undefined);
    assert.deepEqual(inventory.tags(), {});

    // Unsetting what was never set is not a mutation.
    mutations.length = 0;
    inventory.setTag("absent", "absent", undefined);
    assert.deepEqual(mutations, []);
  });
});
