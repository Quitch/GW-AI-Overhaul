"use strict";

// shared/loadout_banks.js. A third-party card mod registers its own unlock bank
// here, so these pin the two properties that make that safe: a mod that is not
// installed changes nothing, and a mod that is installed cannot break the
// loadout list by shipping a broken bank.

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const banksPath =
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_banks.js";

const stubs = createGlobalStubs();
afterEach(() => {
  stubs.restoreGlobals();
  mock.restoreAll();
});

const banks = loadCouiModule(banksPath);

// The loader caches modules, so every test shares one instance and resolve()
// writes state onto it. Clearing against an empty registry first stops one
// test's banks leaking into the next.
function loadBanks(registry) {
  stubs.setGlobal("model", {});
  banks.resolve([]);
  stubs.setGlobal(
    "model",
    registry === undefined ? {} : { gwoLoadoutBanks: registry }
  );
  return banks;
}

function fakeBank(ids) {
  const held = ids.slice();
  return {
    startCards: () => held.map((id) => ({ id })),
    hasStartCard: (card) => held.includes(card && card.id ? card.id : card),
    addStartCard: (card) => {
      const id = card && card.id ? card.id : card;
      if (held.includes(id)) {
        return false;
      }
      held.push(id);
      return true;
    },
  };
}

describe("paths", () => {
  it("is empty when no mod has registered", () => {
    assert.deepEqual(loadBanks(undefined).paths(), []);
  });

  it("survives a registry that is not an array", () => {
    // gw_play is a fresh page, so the global may be anything or nothing.
    assert.deepEqual(loadBanks("not an array").paths(), []);
  });

  it("deduplicates and drops entries with no usable path", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://a/bank.js" },
      { prefix: "c_start_", path: "" },
      { prefix: "d_start_" },
      undefined,
    ]);

    assert.deepEqual(banks.paths(), ["coui://a/bank.js"]);
  });
});

describe("resolve", () => {
  it("pairs each registered prefix with the module from its path", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://b/bank.js" },
    ]);
    const a = fakeBank(["a_start_one"]);
    const b = fakeBank(["b_start_one"]);

    const resolved = banks.resolve([a, b]);

    assert.equal(resolved.length, 2);
    assert.equal(resolved[0].prefix, "a_start_");
    assert.equal(resolved[0].bank, a);
    assert.equal(resolved[1].bank, b);
  });

  it("shares one loaded module between two prefixes registering it", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://one/bank.js" },
      { prefix: "b_start_", path: "coui://one/bank.js" },
    ]);
    const only = fakeBank([]);

    const resolved = banks.resolve([only]);

    assert.equal(resolved.length, 2);
    assert.equal(resolved[0].bank, only);
    assert.equal(resolved[1].bank, only);
  });

  it("drops a bank that failed to load rather than throwing", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://b/bank.js" },
    ]);

    const resolved = banks.resolve([undefined, fakeBank(["b_start_one"])]);

    assert.equal(resolved.length, 1, "the broken mod is skipped, not fatal");
    assert.equal(resolved[0].prefix, "b_start_");
  });

  it("drops a module that is not bank shaped", () => {
    const banks = loadBanks([{ prefix: "a_start_", path: "coui://a/bank.js" }]);

    assert.deepEqual(banks.resolve([{ notABank: true }]), []);
  });

  // Both halves of the published contract, not just the one read first: a bank
  // that cannot record an unlock has to be refused here rather than throwing at
  // award time, once the player has already beaten the treasure planet.
  it("drops a bank that can answer hasStartCard but not addStartCard", () => {
    const banks = loadBanks([{ prefix: "a_start_", path: "coui://a/bank.js" }]);
    const readOnly = fakeBank(["a_start_one"]);
    delete readOnly.addStartCard;

    assert.deepEqual(banks.resolve([readOnly]), []);
  });
});

describe("hasStartCard", () => {
  it("is false before resolve, so a slow bank never claims an unlock", () => {
    const banks = loadBanks([{ prefix: "a_start_", path: "coui://a/bank.js" }]);

    assert.equal(banks.hasStartCard({ id: "a_start_one" }), false);
  });

  it("is true when any registered bank holds the card", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://b/bank.js" },
    ]);
    banks.resolve([fakeBank([]), fakeBank(["b_start_one"])]);

    assert.equal(banks.hasStartCard({ id: "b_start_one" }), true);
    assert.equal(banks.hasStartCard({ id: "b_start_two" }), false);
  });

  // Readers include the gw_start loadout list and a ko.computed, so one mod's
  // bank throwing must not empty the picker or break a binding.
  it("skips a bank that throws and still consults the others", () => {
    const errorMock = mock.method(console, "error", () => {});
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://b/bank.js" },
    ]);
    const thrower = fakeBank([]);
    thrower.hasStartCard = () => {
      throw new Error("bank exploded");
    };
    banks.resolve([thrower, fakeBank(["b_start_one"])]);

    assert.equal(banks.hasStartCard({ id: "b_start_one" }), true);
    assert.equal(errorMock.mock.callCount(), 1);
  });
});

describe("bankFor", () => {
  it("routes an id to the mod whose prefix it carries", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://b/bank.js" },
    ]);
    const a = fakeBank([]);
    const b = fakeBank([]);
    banks.resolve([a, b]);

    assert.equal(banks.bankFor("b_start_one"), b);
    assert.equal(banks.bankFor("a_start_one"), a);
  });

  it("is undefined for an id no mod claims", () => {
    const banks = loadBanks([{ prefix: "a_start_", path: "coui://a/bank.js" }]);
    banks.resolve([fakeBank([])]);

    assert.equal(banks.bankFor("gwc_start_bot"), undefined);
    assert.equal(banks.bankFor("gwaio_start_ceo"), undefined);
    assert.equal(banks.bankFor(undefined), undefined);
  });

  it("matches on the prefix only at the start of the id", () => {
    const banks = loadBanks([{ prefix: "a_start_", path: "coui://a/bank.js" }]);
    banks.resolve([fakeBank([])]);

    assert.equal(banks.bankFor("not_a_start_one"), undefined);
  });
});

describe("startCards", () => {
  it("flattens every registered bank's holdings into one list", () => {
    const banks = loadBanks([
      { prefix: "a_start_", path: "coui://a/bank.js" },
      { prefix: "b_start_", path: "coui://b/bank.js" },
    ]);
    banks.resolve([fakeBank(["a_start_one"]), fakeBank(["b_start_one"])]);

    assert.deepEqual(
      banks.startCards().map((card) => card.id),
      ["a_start_one", "b_start_one"]
    );
  });

  it("is empty with nothing registered", () => {
    assert.deepEqual(loadBanks(undefined).startCards(), []);
  });
});
