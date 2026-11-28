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

const {
  describe,
  it,
  before,
  after,
  beforeEach,
  afterEach,
  mock,
} = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  installGlobals,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

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

// defeat_team.test.js covers the function; here it only matters that the patch
// hijack hands it the game.
const defeatTeamInstalls = [];
registerModuleStub(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/defeat_team.js",
  { install: (game) => defeatTeamInstalls.push(game) }
);

const mutations = [];
const hooks = { onMutate: (value) => mutations.push(value) };

const stubs = createGlobalStubs();
stubs.setGlobal("ko", {
  observable: (initial) => makeObservable(initial, hooks),
  observableArray: (initial) => makeObservableArray(initial, hooks),
  // As knockout's own: every enumerable property, the prototype's methods
  // included, with each observable read. GWInventory.save() is this, so a save
  // carries GWInventory's methods, as it does in the game.
  toJS: (target) => {
    const out = {};
    for (const key in target) {
      const value = target[key];
      out[key] =
        typeof value === "function" && value.subscribe
          ? JSON.parse(JSON.stringify(value()))
          : value;
    }
    return out;
  },
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

// Keyed, and null for any other key as sessionStorage is, so the module must
// ask for the key stock writes the role under.
const sessionRole = {
  getItem: (key) => (key === "gw_campaign_role" ? JSON.stringify(role) : null),
};
defineSessionStorage(sessionRole);

// _.delay carries the dirty re-run.
let timers;

before(() => {
  timers = installFakeLodashTimers();
});

after(() => {
  timers.restore();
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
  defeatTeamInstalls.length = 0;
  timers.delayed.length = 0;
  mutations.length = 0;
  cardModules = {};
  role = "host";
});

afterEach(() => {
  mock.restoreAll();
});

describe("gw_inventory - the patch hijack", () => {
  it("still calls the stock patch through, with its game and its answer", () => {
    const game = perPlayerTechGame(true);

    assert.equal(patch(game), "stock");
    assert.deepEqual(patched, [game]);
  });

  it("installs GWO's defeatTeam on the game it is handed", () => {
    const game = perPlayerTechGame(false);

    patch(game);

    assert.deepEqual(defeatTeamInstalls, [game]);
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
    defineSessionStorage(sessionRole);
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
  // finishApplyCards re-runs the real one on a delay. The re-run applies the
  // same host cards, so it keeps the one hold until a pass ends clean.
  const dirtyingCard = (times, inventoryOf) => {
    let left = times;
    return {
      buff: () => {
        if (left) {
          left--;
          inventoryOf().applyCards();
        }
      },
      dull: () => {},
    };
  };

  it("keeps the hold through the re-run a dirty pass schedules", () => {
    let inventory;
    cardModules.gwc_dirty = dirtyingCard(1, () => inventory);
    raise("viewer");
    inventory = inventoryHolding([{ id: "gwc_dirty" }]);

    inventory.applyCards();
    assert.equal(timers.delayed.length, 1, "the dirty re-run was scheduled");
    assert.deepEqual(bank, [["suspend", stockBank]]);
    timers.delayed.shift().fn();

    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });

  it("keeps the hold until the last of chained re-runs", () => {
    let inventory;
    cardModules.gwc_dirty = dirtyingCard(2, () => inventory);
    raise("viewer");
    let done = 0;
    inventory = inventoryHolding([{ id: "gwc_dirty" }]);

    inventory.applyCards(() => {
      done++;
    });
    timers.delayed.shift().fn();
    assert.deepEqual(bank, [["suspend", stockBank]]);
    timers.delayed.shift().fn();
    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
    timers.delayed.shift().fn();

    assert.equal(done, 1);
    assert.equal(timers.delayed.length, 0);
  });

  it("does not hold a dirty re-run that nothing flagged", () => {
    let inventory;
    cardModules.gwc_dirty = dirtyingCard(1, () => inventory);
    raise("host");
    inventory = inventoryHolding([{ id: "gwc_dirty" }]);

    inventory.applyCards();
    timers.delayed.shift().fn();

    assert.deepEqual(bank, []);
  });

  // As stock, the re-run is the applyCards in place when the pass finished, so
  // a pass started in the gap cannot absorb it and strand the carried hold.
  it("re-runs the method in place when the pass finished", () => {
    let inventory;
    let buffs = 0;
    const dirtying = dirtyingCard(1, () => inventory);
    cardModules.gwc_dirty = {
      buff: (inv) => {
        buffs++;
        dirtying.buff(inv);
      },
      dull: () => {},
    };
    raise("viewer");
    inventory = inventoryHolding([{ id: "gwc_dirty" }]);

    inventory.applyCards();
    const reRun = timers.delayed.shift();
    let standInCalls = 0;
    inventory.applyCards = () => {
      standInCalls++;
    };
    reRun.fn();

    assert.equal(standInCalls, 0);
    assert.equal(buffs, 2);
    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });

  it("resumes even when a card fails to load", () => {
    raise("viewer");
    const errorMock = mock.method(console, "error", () => {});
    inventoryHolding([{ id: "gwc_missing" }]).applyCards();

    // Once for the buff pass and once for the dull pass.
    assert.equal(errorMock.mock.callCount(), 2);
    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
  });
});

// A third-party card's buff or dull runs inside the requireGW success callback,
// which does not catch. Without the catch, finishCard never ran: done and the
// unlock resume were lost for the session.
describe("gw_inventory - a card that throws", () => {
  it("still reaches done, and resumes unlocks", () => {
    const errorMock = mock.method(console, "error", () => {});
    cardModules.gwc_thrower = {
      buff: () => {
        throw new Error("buff exploded");
      },
      dull: () => {},
    };
    cardModules.gwc_start_orbital = { buff: () => {}, dull: () => {} };
    raise("viewer");
    let done = 0;

    inventoryHolding([
      { id: "gwc_thrower" },
      { id: "gwc_start_orbital" },
    ]).applyCards(() => {
      done++;
    });
    timers.delayed.shift().fn();

    assert.equal(done, 1);
    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
    assert.deepEqual(
      errorMock.mock.calls.map((call) => call.arguments),
      [["GWO card gwc_thrower threw in buff: Error: buff exploded"]]
    );
  });

  it("removes the pass's getTag and setTag overrides", () => {
    mock.method(console, "error", () => {});
    cardModules.gwc_thrower = {
      buff: () => {},
      dull: () => {
        throw new Error("dull exploded");
      },
    };
    const inventory = inventoryHolding([{ id: "gwc_thrower" }]);

    inventory.applyCards();

    assert.equal(Object.hasOwn(inventory, "getTag"), false);
    assert.equal(Object.hasOwn(inventory, "setTag"), false);
    assert.equal(Object.hasOwn(inventory, "applyCards"), false);
  });
});

const drain = () => {
  while (timers.delayed.length) {
    timers.delayed.shift().fn();
  }
};

describe("gw_inventory - a card that fails to load", () => {
  // The loader can run a failed require's errback a second time, when the
  // next require's check re-emits the module's error. Counting both ended the
  // phase before the other cards had run.
  it("counts a card whose errback runs twice once", () => {
    mock.method(console, "error", () => {});
    const order = [];
    cardModules.gwc_start_orbital = {
      buff: () => order.push("buff"),
      dull: () => order.push("dull"),
    };
    const requireCards = global.requireGW;
    global.requireGW = (ids, onLoad, onError) => {
      if (ids[0] === "cards/gwc_missing") {
        onError("no such card");
        onError("no such card");
        return;
      }
      requireCards(ids, onLoad, onError);
    };

    try {
      inventoryHolding([
        { id: "gwc_missing" },
        { id: "gwc_start_orbital" },
      ]).applyCards(() => order.push("done"));
      drain();
    } finally {
      global.requireGW = requireCards;
    }

    assert.deepEqual(order, ["buff", "dull", "done"]);
  });
});

// A co-op viewer's loadout from a card mod the host lacks fails to load on the
// host. With no buff the inventory had no commander, and the battle could not
// end. See coop.md, "Records at launch".
// The card's first request is held until the test settles it; later ones, such
// as the dull pass's, are answered at once.
const withLateCard = (id, answer, run) => {
  let held;
  let settled = false;
  const requireCards = global.requireGW;
  global.requireGW = (ids, onLoad, onError) => {
    if (ids[0] !== "cards/" + id) {
      requireCards(ids, onLoad, onError);
    } else if (settled) {
      answer(onLoad, onError);
    } else {
      held = () => answer(onLoad, onError);
    }
  };
  try {
    run(() => {
      assert.equal(typeof held, "function", id + " was never requested");
      settled = true;
      held();
    });
  } finally {
    global.requireGW = requireCards;
  }
};

describe("gw_inventory - a loadout that fails to load", () => {
  const standardStart = (calls) => ({
    buff: (inventory, params) => calls.push(["start", inventory, params]),
    dull: () => calls.push(["start dull"]),
  });

  it("gives the standard start in its place", () => {
    mock.method(console, "error", () => {});
    const warnMock = mock.method(console, "warn", () => {});
    const calls = [];
    cardModules.gwc_start = standardStart(calls);
    cardModules.gwc_bld_efficiency = {
      buff: () => calls.push(["tech buff"]),
      dull: () => calls.push(["tech dull"]),
    };
    const inventory = inventoryHolding([
      { id: "mym_start_missing", extra: 1 },
      { id: "gwc_bld_efficiency" },
    ]);

    inventory.applyCards(() => calls.push(["done"]));
    drain();

    assert.deepEqual(calls, [
      ["start", inventory, { id: "mym_start_missing", extra: 1 }],
      ["tech buff"],
      ["tech dull"],
      ["done"],
    ]);
    assert.deepEqual(
      warnMock.mock.calls.map((call) => call.arguments),
      [["GWO: the standard start replaces mym_start_missing"]]
    );
  });

  // Spec ops past the front of orderOfOperations run in the order the cards
  // added them, so the loadout's slot has to buff first however its module
  // arrives. See specs.md.
  const withLateLoadout = (answer, run) =>
    withLateCard("mym_start_late", answer, run);

  const techCard = (calls) => ({
    buff: (inventory) => {
      calls.push(["tech buff"]);
      inventory.addMods([{ op: "push", from: "tech" }]);
    },
    dull: () => calls.push(["tech dull"]),
  });

  // Applies [late loadout, tech card] and settles the loadout only after the
  // rest of the hand has had its chance to run. Returns the mods' sources.
  const applyLateHand = (answer, calls) => {
    cardModules.gwc_bld_efficiency = techCard(calls);
    const inventory = inventoryHolding([
      { id: "mym_start_late" },
      { id: "gwc_bld_efficiency" },
    ]);
    withLateLoadout(answer, (settleLoadout) => {
      inventory.applyCards(() => calls.push(["done"]));
      // The rest of the hand waits for the loadout's slot.
      assert.deepEqual(calls, []);
      settleLoadout();
      drain();
    });
    return inventory.mods().map((mod) => mod.from);
  };

  it("buffs the standard start before the rest when the loadout fails late", () => {
    mock.method(console, "error", () => {});
    mock.method(console, "warn", () => {});
    const calls = [];
    cardModules.gwc_start = {
      buff: (inventory) => {
        calls.push(["start"]);
        inventory.addMods([{ op: "tag", from: "start" }]);
      },
      dull: () => {},
    };

    const mods = applyLateHand(
      (onLoad, onError) => onError("no such card"),
      calls
    );

    assert.deepEqual(calls, [
      ["start"],
      ["tech buff"],
      ["tech dull"],
      ["done"],
    ]);
    assert.deepEqual(mods, ["start", "tech"]);
  });

  it("buffs a loadout that loads late before the rest", () => {
    const calls = [];

    const mods = applyLateHand(
      (onLoad) =>
        onLoad({
          buff: (held) => {
            calls.push(["loadout buff"]);
            held.addMods([{ op: "push", from: "loadout" }]);
          },
          dull: () => {},
        }),
      calls
    );

    assert.deepEqual(calls, [
      ["loadout buff"],
      ["tech buff"],
      ["tech dull"],
      ["done"],
    ]);
    assert.deepEqual(mods, ["loadout", "tech"]);
  });

  it("finishes a hand whose only card is a loadout that loads late", () => {
    const calls = [];
    const inventory = inventoryHolding([{ id: "mym_start_late" }]);

    withLateLoadout(
      (onLoad) =>
        onLoad({
          buff: () => calls.push(["loadout buff"]),
          dull: () => calls.push(["loadout dull"]),
        }),
      (settleLoadout) => {
        inventory.applyCards(() => calls.push(["done"]));
        settleLoadout();
        drain();
      }
    );

    assert.deepEqual(calls, [["loadout buff"], ["loadout dull"], ["done"]]);
  });

  // A record is saved data, so an entry that is not a card can reach here.
  // It must fail to load and finish, not throw from inside the first card's
  // callback, where the caller's catch cannot release the unlock hold.
  it("finishes past an entry that is not a card", () => {
    const errorMock = mock.method(console, "error", () => {});
    const calls = [];
    cardModules.gwc_start_orbital = {
      buff: () => calls.push(["loadout buff"]),
      dull: () => {},
    };

    inventoryHolding([{ id: "gwc_start_orbital" }, null]).applyCards(() =>
      calls.push(["done"])
    );
    drain();

    assert.deepEqual(calls, [["loadout buff"], ["done"]]);
    assert.ok(
      errorMock.mock.calls.some((call) =>
        /^Failed loading card null /.test(call.arguments[0])
      )
    );
  });

  it("gives it once when the loader runs the errback twice", () => {
    mock.method(console, "error", () => {});
    mock.method(console, "warn", () => {});
    const calls = [];
    cardModules.gwc_start = standardStart(calls);
    const requireCards = global.requireGW;
    global.requireGW = (ids, onLoad, onError) => {
      if (ids[0] === "cards/mym_start_missing") {
        onError("no such card");
        onError("no such card");
        return;
      }
      requireCards(ids, onLoad, onError);
    };

    try {
      inventoryHolding([{ id: "mym_start_missing" }]).applyCards(() =>
        calls.push(["done"])
      );
      drain();
    } finally {
      global.requireGW = requireCards;
    }

    assert.equal(calls.filter((call) => call[0] === "start").length, 1);
    assert.deepEqual(calls.at(-1), ["done"]);
  });

  it("leaves a loadout that is not the first card, and a tech card, without one", () => {
    mock.method(console, "error", () => {});
    const warnMock = mock.method(console, "warn", () => {});
    const calls = [];
    cardModules.gwc_start = standardStart(calls);
    cardModules.gwc_start_orbital = {
      buff: () => calls.push(["loadout buff"]),
      dull: () => {},
    };

    inventoryHolding([
      { id: "gwc_start_orbital" },
      { id: "mym_start_missing" },
    ]).applyCards(() => calls.push(["done"]));
    inventoryHolding([{ id: "gwc_missing" }]).applyCards(() =>
      calls.push(["done"])
    );
    drain();

    assert.deepEqual(calls, [["loadout buff"], ["done"], ["done"]]);
    assert.equal(warnMock.mock.callCount(), 0);
  });

  it("still finishes when the standard start cannot load either", () => {
    const errorMock = mock.method(console, "error", () => {});
    mock.method(console, "warn", () => {});
    let done = 0;

    inventoryHolding([{ id: "mym_start_missing" }]).applyCards(() => {
      done++;
    });
    drain();

    assert.equal(done, 1);
    // The loadout in the buff pass and the dull pass, and the standard start.
    assert.deepEqual(
      errorMock.mock.calls.map((call) => call.arguments[0]),
      [
        "Failed loading card mym_start_missing : no such card",
        "GWO: the standard start did not load either: no such card",
        "Failed loading card mym_start_missing : no such card",
      ]
    );
  });
});

// A tag by index counts on every earlier card's push and prepend having run, so
// the cards run in hand order whichever module arrives first. See specs.md.
describe("gw_inventory - hand order", () => {
  it("buffs and dulls in hand order when a later card's module arrives first", () => {
    const calls = [];
    const recording = (id) => ({
      buff: (inventory) => {
        calls.push(id + " buff");
        inventory.addMods([{ op: "push", from: id }]);
      },
      dull: () => calls.push(id + " dull"),
    });
    cardModules.gwc_start_orbital = recording("gwc_start_orbital");
    cardModules.gwc_bld_efficiency = recording("gwc_bld_efficiency");
    const inventory = inventoryHolding([
      { id: "gwc_start_orbital" },
      { id: "gwc_late" },
      { id: "gwc_bld_efficiency" },
    ]);

    withLateCard(
      "gwc_late",
      (onLoad) => onLoad(recording("gwc_late")),
      (settleLate) => {
        inventory.applyCards(() => calls.push("done"));
        assert.deepEqual(calls, []);
        settleLate();
        drain();
      }
    );

    assert.deepEqual(calls, [
      "gwc_start_orbital buff",
      "gwc_late buff",
      "gwc_bld_efficiency buff",
      "gwc_start_orbital dull",
      "gwc_late dull",
      "gwc_bld_efficiency dull",
      "done",
    ]);
    assert.deepEqual(
      inventory.mods().map((mod) => mod.from),
      ["gwc_start_orbital", "gwc_late", "gwc_bld_efficiency"]
    );
  });
});

// bank.applyInventoryHeld sets gwoFinish on the inventories it applies. A pass
// whose card modules are all loaded then runs them in the call, in hand order,
// and hands done to gwoFinish rather than _.delay.
describe("gw_inventory - an apply with gwoFinish", () => {
  let loads;
  let requireCards;

  beforeEach(() => {
    loads = [];
    requireCards = global.requireGW;
    const loader = (ids, onLoad, onError) => {
      if (typeof ids === "string") {
        return cardModules[ids.replace("cards/", "")];
      }
      loads.push(() => requireCards(ids, onLoad, onError));
      return undefined;
    };
    loader.defined = (id) =>
      Object.hasOwn(cardModules, id.replace("cards/", ""));
    global.requireGW = loader;
  });

  afterEach(() => {
    global.requireGW = requireCards;
  });

  const recordingCards = (order, ids) => {
    for (const id of ids) {
      cardModules[id] = {
        buff: () => order.push(id + " buff"),
        dull: () => order.push(id + " dull"),
      };
    }
  };

  const finishing = (cards, finished) => {
    const inventory = inventoryHolding(cards);
    inventory.gwoFinish = (done) => finished.push(done);
    return inventory;
  };

  it("runs loaded cards in the call and hands done to gwoFinish", () => {
    const order = [];
    const finished = [];
    recordingCards(order, ["gwc_a", "gwc_b"]);
    const done = () => {};

    finishing(["gwc_a", { id: "gwc_b" }], finished).applyCards(done);

    assert.deepEqual(order, [
      "gwc_a buff",
      "gwc_b buff",
      "gwc_a dull",
      "gwc_b dull",
    ]);
    assert.deepEqual(finished, [done]);
    assert.deepEqual(loads, []);
    assert.deepEqual(timers.delayed, []);
  });

  it("goes through the loader when a card is not loaded yet", () => {
    mock.method(console, "error", () => {});
    const order = [];
    const finished = [];
    recordingCards(order, ["gwc_a"]);

    finishing([{ id: "gwc_a" }, { id: "gwc_missing" }], finished).applyCards(
      () => order.push("done")
    );
    assert.deepEqual(order, []);
    while (loads.length) {
      loads.shift()();
    }
    timers.delayed.shift().fn();

    assert.deepEqual(order, ["gwc_a buff", "gwc_a dull", "done"]);
    assert.deepEqual(finished, []);
  });

  it("goes through the loader without gwoFinish", () => {
    const order = [];
    recordingCards(order, ["gwc_a"]);

    inventoryHolding([{ id: "gwc_a" }]).applyCards(() => order.push("done"));
    assert.deepEqual(order, []);
    while (loads.length) {
      loads.shift()();
    }
    timers.delayed.shift().fn();

    assert.deepEqual(order, ["gwc_a buff", "gwc_a dull", "done"]);
  });

  // A card mod's buff may call applyCards: the re-run waits on _.delay as
  // before, runs at once again, keeps the viewer hold, and hands done over
  // once.
  it("re-runs a pass a card marks dirty, and hands done over once", () => {
    const order = [];
    const finished = [];
    let reapplied = false;
    let inventory;
    cardModules.gwc_dirty = {
      buff: () => {
        order.push("buff");
        if (!reapplied) {
          reapplied = true;
          inventory.applyCards();
        }
      },
      dull: () => order.push("dull"),
    };
    raise("viewer");
    const done = () => {};
    inventory = finishing([{ id: "gwc_dirty" }], finished);

    inventory.applyCards(done);
    assert.deepEqual(order, ["buff", "dull"]);
    assert.deepEqual(finished, []);
    assert.deepEqual(bank, [["suspend", stockBank]]);
    timers.delayed.shift().fn();

    assert.deepEqual(order, ["buff", "dull", "buff", "dull"]);
    assert.deepEqual(finished, [done]);
    assert.deepEqual(bank, [["suspend", stockBank], "resume"]);
    assert.deepEqual(timers.delayed, []);
    assert.deepEqual(loads, []);
  });

  it("still finishes when a loaded card throws", () => {
    const errorMock = mock.method(console, "error", () => {});
    const finished = [];
    cardModules.gwc_thrower = {
      buff: () => {
        throw new Error("buff exploded");
      },
      dull: () => {},
    };

    finishing([{ id: "gwc_thrower" }], finished).applyCards(() => {});

    assert.equal(finished.length, 1);
    assert.deepEqual(
      errorMock.mock.calls.map((call) => call.arguments),
      [["GWO card gwc_thrower threw in buff: Error: buff exploded"]]
    );
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

  // A copied getTag reads tags() off the save, where tags is plain, so a
  // reader of a saved record reads its plain tags (races.raceOf).
  it("saves what it loaded, and the prototype's methods with it", () => {
    const config = {
      units: ["u"],
      removedUnits: ["r"],
      aiMods: [{ id: "m" }],
      mods: ["mod"],
      maxCards: 3,
      cards: [{ id: "gwc_x" }],
      minions: [{ id: "min" }],
      tags: { global: { playerFaction: 1 } },
    };
    const inventory = new GWInventory();

    inventory.load(config);
    const saved = inventory.save();

    assert.deepEqual(JSON.parse(JSON.stringify(saved)), config);
    assert.equal(saved.getTag, GWInventory.prototype.getTag);
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

  it("adds and removes a group nested in the list, and a single unit", () => {
    const inventory = new GWInventory();
    inventory.load({ units: ["a"] });

    inventory.addUnits([["b", ["c"]], "d"]);
    inventory.addUnits("e");
    assert.deepEqual(inventory.units(), ["a", "b", "c", "d", "e"]);

    inventory.removeUnits([["b"], "d"]);
    inventory.removeUnits("e");
    assert.deepEqual(inventory.units(), ["a", "c"]);

    inventory.addUnits([{ table: "f" }, "g"]);
    inventory.removeUnits({ table: "a" });
    assert.deepEqual(inventory.units(), ["a", "c", "g"]);
  });

  // See races.md, "Capability cells": race translation reads the removals.
  it("records each removed path once, groups flattened", () => {
    const inventory = new GWInventory();
    inventory.load({ units: ["a", "b"] });

    inventory.removeUnits([["a", ["x"]], "a"]);
    inventory.removeUnits({ table: "b" });

    assert.deepEqual(inventory.removedUnits(), ["a", "x"]);
    assert.deepEqual(inventory.units(), ["b"]);
  });

  // A held path wins over the record, so adding it back needs no write.
  it("keeps the record when a removed path is added again", () => {
    const inventory = new GWInventory();
    inventory.load({});

    inventory.removeUnits(["a", "b"]);
    inventory.addUnits([["a"]]);

    assert.deepEqual(inventory.removedUnits(), ["a", "b"]);
    assert.deepEqual(inventory.units(), ["a"]);
  });

  it("starts each apply with no removals, and a dull's removal outlasts a buff's grant", () => {
    cardModules.gwc_forbid = {
      buff: (inventory) => inventory.addUnits(["a"]),
      dull: (inventory) => inventory.removeUnits(["a"]),
    };
    const inventory = inventoryHolding([{ id: "gwc_forbid" }]);
    inventory.removedUnits(["stale"]);

    inventory.applyCards();

    assert.deepEqual(inventory.removedUnits(), ["a"]);
    assert.deepEqual(inventory.units(), []);
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
