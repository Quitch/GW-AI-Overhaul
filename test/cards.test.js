"use strict";

// Unit tests for shared/cards.js, the pure-logic helpers nearly every tech card's
// deal()/buff() delegates to: the unit-membership predicates, the loadout-icon
// lookup (a 9-way tier switch over a localStorage record), the co-op cross-player
// card matching (id-then-name fallback), advanced-tech detection, and the dull
// bookkeeping. The module's define() has no deps and touches model/window only
// inside function bodies, so it loads cleanly under the Node AMD harness; the few
// functions that read those globals get a minimal stand-in installed per-test.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const cards = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"
);

// Save/restore engine globals the functions under test read at call time, so no test
// leaks a model/window stub into the next one.
const restores = [];
function setGlobal(name, value) {
  const had = Object.prototype.hasOwnProperty.call(global, name);
  const previous = global[name];
  global[name] = value;
  restores.push(function () {
    if (had) {
      global[name] = previous;
    } else {
      delete global[name];
    }
  });
}
afterEach(() => {
  while (restores.length) {
    restores.pop()();
  }
});

describe("hasUnit", () => {
  it("matches a single unit passed as a string", () => {
    assert.equal(cards.hasUnit(["a", "b"], "a"), true);
    assert.equal(cards.hasUnit(["a", "b"], "c"), false);
  });

  it("matches when the inventory has any one of an array of units", () => {
    assert.equal(cards.hasUnit(["a", "b"], ["c", "b"]), true);
    assert.equal(cards.hasUnit(["a", "b"], ["c", "d"]), false);
  });
});

describe("hasAllUnits", () => {
  it("matches a single unit passed as a string", () => {
    assert.equal(cards.hasAllUnits(["a", "b"], "b"), true);
    assert.equal(cards.hasAllUnits(["a", "b"], "c"), false);
  });

  it("requires every unit of an array to be present", () => {
    assert.equal(cards.hasAllUnits(["a", "b", "c"], ["a", "c"]), true);
    assert.equal(cards.hasAllUnits(["a", "b"], ["a", "c"]), false);
  });
});

describe("missingUnit", () => {
  it("is the negation of membership for a string", () => {
    assert.equal(cards.missingUnit(["a", "b"], "c"), true);
    assert.equal(cards.missingUnit(["a", "b"], "a"), false);
  });

  it("is true when any one of an array of units is absent", () => {
    assert.equal(cards.missingUnit(["a", "b"], ["a", "c"]), true);
    assert.equal(cards.missingUnit(["a", "b"], ["a", "b"]), false);
  });
});

describe("missingAllUnits", () => {
  it("is the negation of membership for a string", () => {
    assert.equal(cards.missingAllUnits(["a", "b"], "c"), true);
    assert.equal(cards.missingAllUnits(["a", "b"], "a"), false);
  });

  it("is true only when every unit of an array is absent", () => {
    assert.equal(cards.missingAllUnits(["a", "b"], ["c", "d"]), true);
    assert.equal(cards.missingAllUnits(["a", "b"], ["b", "d"]), false);
  });
});

describe("upgradeDeal", () => {
  it("returns the given chance, wrapped for overflow, when available", () => {
    assert.deepEqual(cards.upgradeDeal(true, 30), {
      params: { allowOverflow: true },
      chance: 30,
    });
  });

  it("defaults to a chance of 60 when none is given", () => {
    assert.deepEqual(cards.upgradeDeal(true), {
      params: { allowOverflow: true },
      chance: 60,
    });
  });

  it("returns a chance of 0 when unavailable", () => {
    assert.deepEqual(cards.upgradeDeal(false, 30), {
      params: { allowOverflow: true },
      chance: 0,
    });
  });
});

describe("conditionalDeal", () => {
  it("returns the given chance when available", () => {
    assert.deepEqual(cards.conditionalDeal(true, 70), { chance: 70 });
  });

  it("returns a chance of 0 when unavailable", () => {
    assert.deepEqual(cards.conditionalDeal(false, 70), { chance: 0 });
  });
});

describe("travelledShort", () => {
  const numberOfSystems = [10, 20, 30, 40];

  function systemAt(dist) {
    return { distance: () => dist };
  }

  it("is false for a nearby system in a large galaxy", () => {
    assert.equal(
      cards.travelledShort(systemAt(1), { totalSize: 50 }, numberOfSystems),
      false
    );
  });

  it("is true once distance exceeds the tier threshold for the galaxy size", () => {
    assert.equal(
      cards.travelledShort(systemAt(3), { totalSize: 10 }, numberOfSystems),
      true
    );
  });

  it("is true for any system beyond the final flat distance cutoff", () => {
    assert.equal(
      cards.travelledShort(systemAt(7), { totalSize: 1000 }, numberOfSystems),
      true
    );
  });
});

describe("farForSize", () => {
  // Real nine-size table (base five + Bigger-GW's four). A distinct-per-tier ladder
  // is used for the indexing assertions so they test the tier lookup itself, not the
  // shipped threshold values (which are free to be retuned).
  const numberOfSystems = [18, 24, 36, 54, 78, 108, 144, 186, 234];
  const ladder = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  function systemAt(dist) {
    return { distance: () => dist };
  }

  function far(totalSize, dist) {
    return cards.farForSize(
      systemAt(dist),
      { totalSize: totalSize },
      numberOfSystems,
      ladder
    );
  }

  it("uses the ladder entry for the galaxy's size tier", () => {
    // Large is index 2 -> threshold 30; Rediq is index 4 -> threshold 50.
    assert.equal(far(36, 30), false);
    assert.equal(far(36, 31), true);
    assert.equal(far(78, 50), false);
    assert.equal(far(78, 51), true);
  });

  it("uses the final entry for the largest listed size", () => {
    assert.equal(far(234, 90), false);
    assert.equal(far(234, 91), true);
  });

  it("clamps galaxies larger than the whole table to the final tier", () => {
    assert.equal(far(9999, 90), false);
    assert.equal(far(9999, 91), true);
  });

  it("indexes by the caller's table length (base five-size table)", () => {
    // With only the base five sizes, Rediq (78) is the last tier -> ladder[4] = 50.
    const baseSizes = [18, 24, 36, 54, 78];
    assert.equal(
      cards.farForSize(systemAt(50), { totalSize: 78 }, baseSizes, ladder),
      false
    );
    assert.equal(
      cards.farForSize(systemAt(51), { totalSize: 78 }, baseSizes, ladder),
      true
    );
  });
});

describe("travelled* distance wrappers", () => {
  // The named wrappers keep their ladder tables private, so their
  // travelledShort <= travelledModerate <= travelledFar ordering is verified
  // behaviourally: with all three tested against the same system, the stricter
  // (larger-threshold) tier can only fire once the looser ones already have.
  // Sweeping distances and asserting that implication exercises the ordering
  // without reaching into the ladders.
  const numberOfSystems = [18, 24, 36, 54, 78, 108, 144, 186, 234];

  function systemAt(dist) {
    return { distance: () => dist };
  }

  it("orders short <= moderate <= far (stricter implies looser)", () => {
    const context = { totalSize: 36 };
    let sawShort = false;
    let sawFar = false;
    for (let dist = 0; dist <= 20; dist++) {
      const system = systemAt(dist);
      const shortTravel = cards.travelledShort(
        system,
        context,
        numberOfSystems
      );
      const moderate = cards.travelledModerate(
        system,
        context,
        numberOfSystems
      );
      const far = cards.travelledFar(system, context, numberOfSystems);
      if (far) {
        assert.ok(moderate, "far implies moderate at distance " + dist);
        sawFar = true;
      }
      if (moderate) {
        assert.ok(shortTravel, "moderate implies short at distance " + dist);
      }
      if (shortTravel) {
        sawShort = true;
      }
    }
    // Guard against a vacuous pass: the sweep must reach both the loosest and the
    // strictest tier for the implications above to mean anything.
    assert.ok(sawShort, "sweep should trigger the short tier");
    assert.ok(sawFar, "sweep should trigger the far tier");
  });
});

describe("antiTechDeal", () => {
  function inventoryWithCard(id) {
    return { hasCard: (cardId) => cardId === id };
  }

  it("returns a chance of 0 when the excluded counterpart card is held", () => {
    setGlobal("model", {});
    assert.deepEqual(
      cards.antiTechDeal(
        inventoryWithCard("gwaio_anti_orbital"),
        70,
        "gwaio_anti_orbital"
      ),
      { chance: 0 }
    );
  });

  it("halves the base chance once any anti_ tech card is already held", () => {
    setGlobal("model", {
      game: () => ({
        inventory: () => ({ cards: () => [{ id: "gwaio_anti_air" }] }),
      }),
    });
    assert.deepEqual(
      cards.antiTechDeal(inventoryWithCard("none"), 70, "gwaio_anti_orbital"),
      { chance: 35 }
    );
  });

  it("returns the full base chance when no anti_ tech is held yet", () => {
    setGlobal("model", {
      game: () => ({ inventory: () => ({ cards: () => [] }) }),
    });
    assert.deepEqual(
      cards.antiTechDeal(inventoryWithCard("none"), 70, "gwaio_anti_orbital"),
      { chance: 70 }
    );
  });
});

describe("mods", () => {
  it("builds one addMods entry per prop, sharing the given file and op", () => {
    assert.deepEqual(cards.mods("unit.json", "replace", { a: 1, b: 2 }), [
      { file: "unit.json", path: "a", op: "replace", value: 1 },
      { file: "unit.json", path: "b", op: "replace", value: 2 },
    ]);
  });

  it("returns an empty array for an empty props object", () => {
    assert.deepEqual(cards.mods("unit.json", "replace", {}), []);
  });
});

describe("loadoutIcon", () => {
  const iconPath = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/img/";
  const fallback =
    "coui://ui/main/game/galactic_war/shared/img/red-commander.png";

  function withVictory(loadoutId, stored) {
    const store = {};
    if (stored !== undefined) {
      store["gwaio_victory_" + loadoutId] = JSON.stringify(stored);
    }
    setGlobal("window", { localStorage: store });
  }

  it("maps each tier to its icon when stored as a bare number", () => {
    const expected = {
      "-1": "-1_beginner",
      0: "0_casual",
      1: "1_iron",
      2: "2_bronze",
      3: "3_silver",
      4: "4_gold",
      5: "5_platinum",
      6: "6_diamond",
      7: "7_uber",
    };
    Object.keys(expected).forEach((tier) => {
      withVictory("x", Number(tier));
      assert.equal(cards.loadoutIcon("x"), iconPath + expected[tier] + ".png");
    });
  });

  it("uses the hardcore suffix when the record is a [icon, hardcore] pair", () => {
    withVictory("x", [5, true]);
    assert.equal(cards.loadoutIcon("x"), iconPath + "5_platinum_hardcore.png");
  });

  it("uses the normal suffix when the pair's hardcore flag is false", () => {
    withVictory("x", [2, false]);
    assert.equal(cards.loadoutIcon("x"), iconPath + "2_bronze.png");
  });

  it("falls back to the red commander when nothing is stored", () => {
    withVictory("x", undefined);
    assert.equal(cards.loadoutIcon("x"), fallback);
  });

  it("falls back to the red commander for an unrecognised tier", () => {
    withVictory("x", 99);
    assert.equal(cards.loadoutIcon("x"), fallback);
  });
});

describe("hasT2Access", () => {
  function inventoryWithCards(ids) {
    return {
      cards: function () {
        return ids.map(function (id) {
          return { id: id };
        });
      },
    };
  }

  it("is true when any held card grants advanced tech", () => {
    setGlobal("model", { gwoCardsGrantingAdvancedTech: ["gwc_enable_titans"] });
    assert.equal(
      cards.hasT2Access(
        inventoryWithCards(["gwc_minion", "gwc_enable_titans"])
      ),
      true
    );
  });

  it("is false when no held card grants advanced tech", () => {
    setGlobal("model", { gwoCardsGrantingAdvancedTech: ["gwc_enable_titans"] });
    assert.equal(cards.hasT2Access(inventoryWithCards(["gwc_minion"])), false);
  });
});

describe("getAllConnectedPlayerCards / anyPlayerHasCard", () => {
  // A host inventory plus two co-op players; only "alice" is a connected client, so
  // only her cards should be folded in. "bob" is present in the game data but not
  // connected, exercising the isConnectedPlayerInventory filter.
  function installCoopModel(connectedClients) {
    const hostInventory = {
      cards: function () {
        return [{ id: "host_card" }];
      },
      hasCard: function (id) {
        return id === "host_card";
      },
    };
    const game = {
      coopPlayerInventoryData: function () {
        return [
          { id: "alice", inventory: { cards: [{ id: "alice_card" }] } },
          { id: "bob", inventory: { cards: [{ id: "bob_card" }] } },
        ];
      },
    };
    setGlobal("model", {
      game: function () {
        return game;
      },
      gwCampaignConnectedClients: function () {
        return connectedClients;
      },
    });
    return { hostInventory: hostInventory, game: game };
  }

  it("merges host cards with connected players' cards, ignoring the disconnected", () => {
    const { hostInventory, game } = installCoopModel([{ id: "alice" }]);
    assert.deepEqual(cards.getAllConnectedPlayerCards(hostInventory, game), [
      { id: "host_card" },
      { id: "alice_card" },
    ]);
  });

  it("matches a connected player by name when ids are absent", () => {
    const hostInventory = {
      cards: function () {
        return [];
      },
    };
    const game = {
      coopPlayerInventoryData: function () {
        return [
          { name: "Alice", inventory: { cards: [{ id: "alice_card" }] } },
        ];
      },
    };
    setGlobal("model", {
      game: function () {
        return game;
      },
      gwCampaignConnectedClients: function () {
        return [{ name: "Alice" }];
      },
    });
    assert.deepEqual(cards.getAllConnectedPlayerCards(hostInventory, game), [
      { id: "alice_card" },
    ]);
  });

  it("anyPlayerHasCard short-circuits on the host's own inventory", () => {
    const { hostInventory, game } = installCoopModel([]);
    assert.equal(
      cards.anyPlayerHasCard(hostInventory, "host_card", game),
      true
    );
  });

  it("anyPlayerHasCard finds a card held by a connected player", () => {
    const { hostInventory, game } = installCoopModel([{ id: "alice" }]);
    assert.equal(
      cards.anyPlayerHasCard(hostInventory, "alice_card", game),
      true
    );
  });

  it("anyPlayerHasCard ignores a card held only by a disconnected player", () => {
    const { hostInventory, game } = installCoopModel([{ id: "alice" }]);
    assert.equal(
      cards.anyPlayerHasCard(hostInventory, "bob_card", game),
      false
    );
  });
});

describe("applyDulls", () => {
  // A minimal inventory recording removeUnits/setTag so we can assert the dull path.
  function fakeInventory(lookup, buffCount) {
    const tags = { ":buffCount": buffCount };
    return {
      removed: null,
      cleared: false,
      lookupCard: function () {
        return lookup;
      },
      getTag: function (namespace, key, fallback) {
        const value = tags[namespace + ":" + key];
        return value === undefined ? fallback : value;
      },
      setTag: function (namespace, key, value) {
        tags[namespace + ":" + key] = value;
        if (key === "buffCount" && value === undefined) {
          this.cleared = true;
        }
      },
      removeUnits: function (units) {
        this.removed = units;
      },
    };
  }

  it("removes the units once for the first card that has been buffed", () => {
    const inventory = fakeInventory(0, 1);
    cards.applyDulls("card", inventory, ["unit_a"]);
    assert.deepEqual(inventory.removed, ["unit_a"]);
    assert.equal(inventory.cleared, true);
  });

  it("does nothing when this is not the buffing card (lookupCard !== 0)", () => {
    const inventory = fakeInventory(1, 1);
    cards.applyDulls("card", inventory, ["unit_a"]);
    assert.equal(inventory.removed, null);
  });

  it("does nothing when no buff was applied this cycle (buffCount falsy)", () => {
    const inventory = fakeInventory(0, 0);
    cards.applyDulls("card", inventory, ["unit_a"]);
    assert.equal(inventory.removed, null);
  });
});
