"use strict";

// Unit tests for shared/cards.js, the helpers nearly every card delegates to.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const cards = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"
);

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

// A host holding cards the player being dealt to does not, so a helper that
// reaches for model.game().inventory() fails rather than coincidentally
// agreeing. model.game() is always the host's; a card must read the inventory
// it was passed - see CLAUDE.md.
function installContradictingHost(hostCardIds, extra) {
  setGlobal(
    "model",
    Object.assign(
      {
        game: () => ({
          inventory: () => ({
            cards: () => hostCardIds.map((id) => ({ id })),
          }),
        }),
      },
      extra
    )
  );
}

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

  it("honours an explicit chance of 0 rather than applying the default", () => {
    assert.deepEqual(cards.upgradeDeal(true, 0), {
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

describe("commanderWeight", () => {
  // Faction index 4 is Cluster, whose Sub Commanders are not commanders.
  const CLUSTER = 4;
  const withRetinue = (count, faction) => ({
    minions: () => new Array(count).fill({}),
    getTag: (scope, key) =>
      scope === "global" && key === "playerFaction" ? faction : undefined,
  });

  it("returns the base weight when no Sub Commanders are fielded", () => {
    assert.equal(cards.commanderWeight(withRetinue(0, 1), 45), 45);
  });

  it("adds a third of the base per commander, from the first one on", () => {
    assert.equal(cards.commanderWeight(withRetinue(1, 1), 45), 60);
    assert.equal(cards.commanderWeight(withRetinue(2, 1), 45), 75);
  });

  it("caps at double the base, not subcommanderWeight's flat 90", () => {
    assert.equal(cards.commanderWeight(withRetinue(3, 1), 45), 90);
    assert.equal(cards.commanderWeight(withRetinue(20, 1), 45), 90);
    assert.equal(cards.commanderWeight(withRetinue(20, 1), 70), 140);
  });

  it("ignores the retinue for Cluster, which fields no extra commanders", () => {
    assert.equal(cards.commanderWeight(withRetinue(0, CLUSTER), 45), 45);
    assert.equal(cards.commanderWeight(withRetinue(5, CLUSTER), 45), 45);
  });

  it("scales for every other faction, and when the tag is unset", () => {
    for (const faction of [0, 1, 2, 3, 5, undefined]) {
      assert.equal(cards.commanderWeight(withRetinue(2, faction), 45), 75);
    }
  });
});

describe("subcommanderWeight", () => {
  const withMinions = (count) => ({
    minions: () => new Array(count).fill({}),
  });

  it("returns 0 with no Sub Commanders, as the card does nothing", () => {
    assert.equal(cards.subcommanderWeight(withMinions(0), 45), 0);
  });

  it("opens at the full base weight for the first Sub Commander", () => {
    assert.equal(cards.subcommanderWeight(withMinions(1), 45), 45);
  });

  it("adds a third of the base for each Sub Commander after the first", () => {
    assert.equal(cards.subcommanderWeight(withMinions(2), 45), 60);
    assert.equal(cards.subcommanderWeight(withMinions(3), 45), 75);
  });

  it("never exceeds the shared ceiling, however large the retinue", () => {
    assert.equal(cards.subcommanderWeight(withMinions(4), 45), 90);
    assert.equal(cards.subcommanderWeight(withMinions(20), 45), 90);
    assert.equal(cards.subcommanderWeight(withMinions(20), 55), 90);
  });

  it("keeps a lower base below a higher one at every retinue size", () => {
    for (let n = 1; n <= 6; n++) {
      assert.ok(
        cards.subcommanderWeight(withMinions(n), 35) <=
          cards.subcommanderWeight(withMinions(n), 55)
      );
    }
  });
});

describe("floodsPlanets", () => {
  function holding(...ids) {
    return { hasCard: (id) => ids.includes(id) };
  }

  it("is true for a naval start", () => {
    assert.equal(cards.floodsPlanets(holding("gwaio_start_naval")), true);
  });

  it("is true for Tsunami tech", () => {
    assert.equal(cards.floodsPlanets(holding("gwaio_enable_tsunami")), true);
  });

  it("is false otherwise", () => {
    assert.equal(cards.floodsPlanets(holding("gwc_start_air")), false);
  });
});

describe("playerIsCluster", () => {
  function faction(value) {
    return {
      getTag: (context, name) =>
        context === "global" && name === "playerFaction" ? value : undefined,
    };
  }

  it("is true only for the Cluster faction index", () => {
    assert.equal(cards.playerIsCluster(faction(4)), true);
    assert.equal(cards.playerIsCluster(faction(0)), false);
    assert.equal(cards.playerIsCluster(faction("4")), false);
    assert.equal(cards.playerIsCluster(faction(undefined)), false);
  });
});

describe("navalWeight", () => {
  // Full weight is reserved for the two states that flood every planet fought on;
  // anywhere else naval is a gamble on the map and the card is offered less rather
  // than withheld.
  const holding = (...cardIds) => ({
    hasCard: (id) => cardIds.includes(id),
  });

  it("returns the full chance for a naval start", () => {
    assert.equal(cards.navalWeight(holding("gwaio_start_naval"), 70), 70);
  });

  it("returns the full chance for Tsunami tech", () => {
    assert.equal(cards.navalWeight(holding("gwaio_enable_tsunami"), 70), 70);
  });

  it("falls back to 40% of the base when neither floods planets", () => {
    assert.equal(cards.navalWeight(holding(), 70), 28);
    assert.equal(cards.navalWeight(holding("gwaio_start_air"), 30), 12);
  });

  it("rounds the fallback to a whole chance", () => {
    // No shipped card passes a base that divides unevenly, so this pins the
    // rounding for one that later does rather than describing today's callers.
    assert.equal(cards.navalWeight(holding(), 33), 13);
  });

  it("uses an explicit dry chance in place of the fallback, including 0", () => {
    assert.equal(cards.navalWeight(holding(), 70, 15), 15);
    assert.equal(cards.navalWeight(holding(), 70, 0), 0);
  });

  it("ignores the dry chance once planets are flooded", () => {
    assert.equal(cards.navalWeight(holding("gwaio_start_naval"), 70, 15), 70);
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
      cards.travelledShort(systemAt(4), { totalSize: 10 }, numberOfSystems),
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
  // A distinct-per-tier thresholds array, so these test the tier lookup itself
  // rather than the shipped values, which are free to be retuned.
  const numberOfSystems = [18, 24, 36, 54, 78, 108, 144, 186, 234];
  const thresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90];

  function systemAt(dist) {
    return { distance: () => dist };
  }

  function far(totalSize, dist) {
    return cards.farForSize(
      systemAt(dist),
      { totalSize: totalSize },
      numberOfSystems,
      thresholds
    );
  }

  it("uses the thresholds entry for the galaxy's size tier", () => {
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
    // With only the base five sizes, Rediq (78) is the last tier -> thresholds[4] = 50.
    const baseSizes = [18, 24, 36, 54, 78];
    assert.equal(
      cards.farForSize(systemAt(50), { totalSize: 78 }, baseSizes, thresholds),
      false
    );
    assert.equal(
      cards.farForSize(systemAt(51), { totalSize: 78 }, baseSizes, thresholds),
      true
    );
  });
});

describe("travelled* distance wrappers", () => {
  // The wrappers keep their tables private, so the short <= moderate <= far
  // ordering is verified behaviourally: a stricter tier can only fire once the
  // looser ones already have.
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
  function inventoryWith(cardIds) {
    return {
      hasCard: (cardId) => cardIds.indexOf(cardId) !== -1,
      cards: () => cardIds.map((id) => ({ id })),
    };
  }

  const installAntiAirHost = () => installContradictingHost(["gwaio_anti_air"]);

  it("returns a chance of 0 when the excluded counterpart card is held", () => {
    installAntiAirHost();
    assert.deepEqual(
      cards.antiTechDeal(
        inventoryWith(["gwaio_anti_orbital"]),
        70,
        "gwaio_anti_orbital"
      ),
      { chance: 0 }
    );
  });

  it("halves the base chance once any anti_ tech card is already held", () => {
    installContradictingHost([]);
    assert.deepEqual(
      cards.antiTechDeal(
        inventoryWith(["gwaio_anti_air"]),
        70,
        "gwaio_anti_orbital"
      ),
      { chance: 35 }
    );
  });

  it("returns the full base chance when no anti_ tech is held yet", () => {
    installAntiAirHost();
    assert.deepEqual(
      cards.antiTechDeal(inventoryWith([]), 70, "gwaio_anti_orbital"),
      { chance: 70 }
    );
  });

  it("weights a co-op viewer's offer on the viewer's own anti_ tech, not the host's", () => {
    installAntiAirHost();
    assert.deepEqual(
      cards.antiTechDeal(inventoryWith([]), 40, "gwaio_anti_sea").chance,
      40
    );
  });
});

describe("loadout", () => {
  const CARD = { id: "mym_start_one" };

  function harness(state) {
    const calls = [];
    const inventory = {
      lookupCard: () => state.lookupCard,
      getTag: (context, name, fallback) =>
        name === "buffCount" ? state.buffCount : fallback,
      setTag: (context, name, value) => {
        if (name === "buffCount") {
          state.buffCount = value;
        }
        calls.push(["setTag", name, value]);
      },
      maxCards: (value) => {
        if (value !== undefined) {
          state.maxCards = value;
          calls.push(["maxCards", value]);
        }
        return state.maxCards;
      },
      removeUnits: (units) => calls.push(["removeUnits", units]),
    };
    const options = {
      bank: { addStartCard: (card) => calls.push(["bank", card.id]) },
      start: { buff: () => calls.push(["start"]) },
      apply: () => calls.push(["apply"]),
    };
    return { calls, inventory, options };
  }

  it("runs the default start and apply on the first buff, then counts it", () => {
    const h = harness({ lookupCard: 0, buffCount: 0, maxCards: 4 });
    cards.loadout(CARD, h.options).buff(h.inventory);
    assert.deepEqual(h.calls, [
      ["start"],
      ["apply"],
      ["setTag", "buffCount", 1],
    ]);
  });

  it("only adds a slot on a later buff of the start card", () => {
    const h = harness({ lookupCard: 0, buffCount: 1, maxCards: 4 });
    cards.loadout(CARD, h.options).buff(h.inventory);
    assert.deepEqual(h.calls, [
      ["maxCards", 5],
      ["setTag", "buffCount", 2],
    ]);
  });

  it("skips that slot when repeatSlot is false", () => {
    const h = harness({ lookupCard: 0, buffCount: 1, maxCards: 4 });
    h.options.repeatSlot = false;
    cards.loadout(CARD, h.options).buff(h.inventory);
    assert.deepEqual(h.calls, [["setTag", "buffCount", 2]]);
  });

  it("runs always on every buff of the start card, with the context", () => {
    const h = harness({ lookupCard: 0, buffCount: 0, maxCards: 4 });
    h.options.always = (inventory, context) =>
      h.calls.push(["always", context]);
    const frame = cards.loadout(CARD, h.options);
    frame.buff(h.inventory, "first");
    h.calls.length = 0;
    cards.loadout(CARD, h.options).buff(h.inventory, "again");
    assert.deepEqual(h.calls, [
      ["maxCards", 5],
      ["always", "again"],
      ["setTag", "buffCount", 2],
    ]);
  });

  it("banks a copy dealt later in the war and adds its slot", () => {
    const h = harness({ lookupCard: -1, buffCount: 0, maxCards: 4 });
    cards.loadout(CARD, h.options).buff(h.inventory);
    assert.deepEqual(h.calls, [
      ["maxCards", 5],
      ["bank", "mym_start_one"],
    ]);
  });

  it("works without an apply body", () => {
    const h = harness({ lookupCard: 0, buffCount: 0, maxCards: 4 });
    delete h.options.apply;
    cards.loadout(CARD, h.options).buff(h.inventory);
    assert.deepEqual(h.calls, [["start"], ["setTag", "buffCount", 1]]);
  });

  it("dulls the listed units through applyDulls", () => {
    const h = harness({ lookupCard: 0, buffCount: 1, maxCards: 4 });
    h.options.dulls = ["a.json"];
    cards.loadout(CARD, h.options).dull(h.inventory);
    assert.deepEqual(h.calls, [
      ["removeUnits", ["a.json"]],
      ["setTag", "buffCount", undefined],
    ]);
  });

  it("lets dulls be computed from the inventory", () => {
    const h = harness({ lookupCard: 0, buffCount: 1, maxCards: 4 });
    h.options.dulls = (inventory) => [inventory.lookupCard()];
    cards.loadout(CARD, h.options).dull(h.inventory);
    assert.deepEqual(h.calls[0], ["removeUnits", [0]]);
  });

  it("dulls nothing, but still clears the count, without a dulls option", () => {
    const h = harness({ lookupCard: 0, buffCount: 1, maxCards: 4 });
    cards.loadout(CARD, h.options).dull(h.inventory);
    assert.deepEqual(h.calls, [
      ["removeUnits", undefined],
      ["setTag", "buffCount", undefined],
    ]);
  });
});

describe("lockedHint", () => {
  it("pairs the locked-commander icon with the given description", () => {
    const hint = cards.lockedHint("!LOC:Nomad Commander");
    assert.equal(typeof hint, "function");
    assert.deepEqual(hint(), {
      icon: "coui://ui/main/game/galactic_war/gw_play/img/tech/gwc_commander_locked.png",
      description: "!LOC:Nomad Commander",
    });
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

describe("paths", () => {
  it("lists the navigation set in the order the speed cards emit it", () => {
    assert.deepEqual(cards.paths.navigation, [
      "navigation.move_speed",
      "navigation.brake",
      "navigation.acceleration",
      "navigation.turn_speed",
    ]);
  });

  it("lists the damage pair and the energy-weapon triple", () => {
    assert.deepEqual(cards.paths.damage, ["damage", "splash_damage"]);
    assert.deepEqual(cards.paths.energyWeapon, [
      "ammo_capacity",
      "ammo_demand",
      "ammo_per_shot",
    ]);
  });
});

describe("observerPaths", () => {
  it("names the given field of the first count observer slots", () => {
    assert.deepEqual(cards.observerPaths(3, "radius"), [
      "recon.observer.items.0.radius",
      "recon.observer.items.1.radius",
      "recon.observer.items.2.radius",
    ]);
  });

  it("returns nothing for a count of 0", () => {
    assert.deepEqual(cards.observerPaths(0, "radius"), []);
  });
});

describe("eachPath", () => {
  it("gives every path the same value, in path order", () => {
    const props = cards.eachPath(["a", "b.c"], 1.5);
    assert.deepEqual(props, { a: 1.5, "b.c": 1.5 });
    assert.deepEqual(Object.keys(props), ["a", "b.c"]);
  });

  it("feeds mods() the same descriptors a literal would", () => {
    assert.deepEqual(
      cards.mods("u.json", "multiply", cards.eachPath(cards.paths.damage, 2)),
      [
        { file: "u.json", path: "damage", op: "multiply", value: 2 },
        { file: "u.json", path: "splash_damage", op: "multiply", value: 2 },
      ]
    );
  });

  it("returns an empty object for no paths", () => {
    assert.deepEqual(cards.eachPath([], 1), {});
  });
});

describe("flatMapMods", () => {
  it("emits every prop for one file before moving to the next", () => {
    assert.deepEqual(
      cards.flatMapMods(["a.json", "b.json"], "multiply", { x: 1, y: 2 }),
      [
        { file: "a.json", path: "x", op: "multiply", value: 1 },
        { file: "a.json", path: "y", op: "multiply", value: 2 },
        { file: "b.json", path: "x", op: "multiply", value: 1 },
        { file: "b.json", path: "y", op: "multiply", value: 2 },
      ]
    );
  });

  it("treats a single file string as a one-file list", () => {
    assert.deepEqual(
      cards.flatMapMods("a.json", "replace", { x: 1 }),
      cards.mods("a.json", "replace", { x: 1 })
    );
  });

  it("returns an empty array for no files", () => {
    assert.deepEqual(cards.flatMapMods([], "replace", { x: 1 }), []);
  });
});

describe("isEnglish", () => {
  function detecting(language) {
    setGlobal("i18n", { detectLanguage: () => language });
  }

  // The two English locales PA ships in ui/main/_i18n/locales.
  it("accepts the bare English locale", () => {
    detecting("en");
    assert.equal(cards.isEnglish(), true);
  });

  it("accepts a regional English locale", () => {
    detecting("en-US");
    assert.equal(cards.isEnglish(), true);
  });

  // detectLanguage reads the querystring, a cookie, then navigator.language, none of
  // which the engine is obliged to supply. Falling through to the non-English arm would
  // show English players the text the English arm exists to correct.
  it("treats an undetected language as English", () => {
    detecting(undefined);
    assert.equal(cards.isEnglish(), true);
  });

  it("rejects the other locales the game ships", () => {
    ["ar", "cs-CZ", "da", "de", "de-AT", "es-ES", "fi", "fr", "hu-HU"].forEach(
      (language) => {
        detecting(language);
        assert.equal(cards.isEnglish(), false, language);
      }
    );
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

  // The host holds the unlock throughout, so a regression to
  // model.game().inventory() would report true for everybody.
  const installGrantingHost = () =>
    installContradictingHost(["gwc_enable_titans"], {
      gwoCardsGrantingAdvancedTech: ["gwc_enable_titans"],
    });

  it("is true when any held card grants advanced tech", () => {
    installGrantingHost();
    assert.equal(
      cards.hasT2Access(
        inventoryWithCards(["gwc_minion", "gwc_enable_titans"])
      ),
      true
    );
  });

  it("is false when no held card grants advanced tech", () => {
    installGrantingHost();
    assert.equal(cards.hasT2Access(inventoryWithCards(["gwc_minion"])), false);
  });

  // Its one caller, cards/gwc_enable_defenses_t2.js, calls it inside deal(),
  // which under per-player tech runs against a viewer's inventory.
  it("reads a co-op viewer's own cards, not the host's", () => {
    installGrantingHost();
    assert.equal(cards.hasT2Access(inventoryWithCards([])), false);
  });
});

describe("getAllConnectedPlayerCards / anyPlayerHasCard", () => {
  // "bob" is in the game data but not connected, so only alice's cards fold in.
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

  // section_of_foreign_intelligence.js calls anyPlayerHasCard with two
  // arguments, so the `game || model.game()` fallback is the live path there
  // while referee_config.js always passes one.
  describe("falling back to the current game", () => {
    it("reads the current game when none is given", () => {
      const { hostInventory } = installCoopModel([{ id: "alice" }]);

      assert.deepEqual(cards.getAllConnectedPlayerCards(hostInventory), [
        { id: "host_card" },
        { id: "alice_card" },
      ]);
      assert.equal(cards.anyPlayerHasCard(hostInventory, "alice_card"), true);
    });

    it("prefers a game it was given over the current one", () => {
      const { hostInventory } = installCoopModel([
        { id: "alice" },
        { id: "carol" },
      ]);
      const otherGame = {
        coopPlayerInventoryData: () => [
          { id: "carol", inventory: { cards: [{ id: "carol_card" }] } },
        ],
      };

      assert.deepEqual(
        cards.getAllConnectedPlayerCards(hostInventory, otherGame),
        [{ id: "host_card" }, { id: "carol_card" }]
      );
      assert.equal(
        cards.anyPlayerHasCard(hostInventory, "alice_card", otherGame),
        false
      );
    });
  });
});

describe("applyDulls", () => {
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

describe("uniqueValue", () => {
  const gwoRng = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
  );

  // gw_inventory.hasCard tests !card.unique, so a zero would permanently stop
  // that card being dealt again for that seed.
  it("is always truthy for a seeded rng", () => {
    const rng = gwoRng.create("unique-seed");
    for (let i = 0; i < 10000; i++) {
      const value = cards.uniqueValue(rng);
      assert.ok(value, `draw ${i} yielded ${value}`);
      assert.ok(value >= 1, `draw ${i} fell below 1: ${value}`);
      assert.ok(value < 2, `draw ${i} reached 2 or above: ${value}`);
    }
  });

  it("reproduces the same value for the same seed", () => {
    assert.equal(
      cards.uniqueValue(gwoRng.create("s")),
      cards.uniqueValue(gwoRng.create("s"))
    );
    assert.notEqual(
      cards.uniqueValue(gwoRng.create("s")),
      cards.uniqueValue(gwoRng.create("t"))
    );
  });

  it("falls back to Math.random with no rng, unchanged from before", () => {
    const priorRandom = Math.random;
    Math.random = () => 0.25;
    try {
      assert.equal(cards.uniqueValue(), 0.25);
      assert.equal(cards.uniqueValue(undefined), 0.25);
    } finally {
      Math.random = priorRandom;
    }
  });
});
