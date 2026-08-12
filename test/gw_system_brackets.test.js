"use strict";

// Tests for shared/gw_system_brackets.js, which derives how many armies a real .pas
// system seats and groups a Shared Systems pool into brackets.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const brackets = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_system_brackets.js",
);

function spots(count) {
  return Array.from({ length: count }, () => [0, 0, 0]);
}

function repeat(rule, count) {
  return Array.from({ length: count }, () => Object.assign({}, rule));
}

// A one-planet system. `zoneCount`/`rules` build landing_zones as {list, rules};
// `bareZones` builds the [[x, y, z], ...] form only map packs and My Systems produce.
function sys(name, options) {
  const opts = options || {};
  const planet = { generator: { biome: "earth" } };

  if (opts.zoneCount !== undefined) {
    planet.landing_zones = { list: spots(opts.zoneCount) };
    if (opts.rules) {
      planet.landing_zones.rules = opts.rules;
    }
  }
  if (opts.bareZones !== undefined) {
    planet.landing_zones = spots(opts.bareZones);
  }
  if (opts.numArmies !== undefined) {
    planet.generator.numArmies = opts.numArmies;
  }

  const system = { name: name, planets: [planet] };
  if (opts.players) {
    system.players = opts.players;
  }
  return system;
}

function withoutWarnings(run) {
  const original = console.warn;
  const messages = [];
  console.warn = (message) => messages.push(message);
  try {
    return { result: run(), warnings: messages };
  } finally {
    console.warn = original;
  }
}

function ranged(min, max, names) {
  return {
    min: min,
    max: max,
    systems: names.map((name) => sys(name, { zoneCount: 2 })),
  };
}

function names(systems) {
  return systems.map((system) => system.name);
}

describe("armyRange - declared players", () => {
  it("uses a declared range when the zones can seat it", () => {
    assert.deepEqual(
      brackets.armyRange(sys("a", { players: [4, 8], zoneCount: 8 })),
      [4, 8],
    );
  });

  it("floors a declared range at two armies", () => {
    assert.deepEqual(brackets.armyRange(sys("a", { players: [0, 0] })), [2, 2]);
  });

  it("reads string-typed declared bounds", () => {
    assert.deepEqual(
      brackets.armyRange(sys("a", { players: ["3", "6"], zoneCount: 6 })),
      [3, 6],
    );
  });

  it("prefers a declared range over what the zones would scan to", () => {
    // Eight flat zones would scan to [2, 8].
    assert.deepEqual(
      brackets.armyRange(
        sys("a", {
          players: [6, 6],
          zoneCount: 8,
          rules: repeat({ min: 2, max: 8 }, 8),
        }),
      ),
      [6, 6],
    );
  });
});

describe("armyRange - the landing zone cap", () => {
  it("caps a declared range at the number of spawns", () => {
    // Boading: ten players declared, two landing zones.
    assert.deepEqual(
      brackets.armyRange(sys("a", { players: [2, 10], zoneCount: 2 })),
      [2, 2],
    );
  });

  it("gives a capped system the same range as the same system undeclared", () => {
    const declared = sys("boading", { players: [2, 10], zoneCount: 2 });
    const undeclared = sys("abyss", { zoneCount: 2 });
    assert.deepEqual(
      brackets.armyRange(declared),
      brackets.armyRange(undeclared),
    );
  });

  it("pulls the minimum down with the maximum rather than inverting", () => {
    // Diskus - Shared declares [4, 10] on two zones.
    assert.deepEqual(
      brackets.armyRange(sys("a", { players: [4, 10], zoneCount: 2 })),
      [2, 2],
    );
  });

  it("does not raise a declared range towards a larger zone count", () => {
    // PAF 5p FFA: ten zones, five armies - the extras are alternate positions.
    assert.deepEqual(
      brackets.armyRange(sys("a", { players: [2, 5], zoneCount: 10 })),
      [2, 5],
    );
  });

  it("leaves a declared range alone when the system has no zones at all", () => {
    assert.deepEqual(
      brackets.armyRange(sys("a", { players: [2, 10] })),
      [2, 10],
    );
  });
});

describe("armyRange - the capacity scan", () => {
  it("caps flat zones at the zone count", () => {
    assert.deepEqual(
      brackets.armyRange(
        sys("a", { zoneCount: 4, rules: repeat({ min: 2, max: 4 }, 4) }),
      ),
      [2, 4],
    );
  });

  it("reads a tiered rule set back as the range its author built", () => {
    // Two zones for a duel plus four that only switch on from three armies.
    const rules = repeat({ min: 2, max: 2 }, 2).concat(
      repeat({ min: 3, max: 6 }, 4),
    );
    assert.deepEqual(
      brackets.armyRange(sys("a", { zoneCount: 6, rules: rules })),
      [2, 4],
    );
  });

  it("reads string-typed rule bounds", () => {
    assert.deepEqual(
      brackets.armyRange(
        sys("a", { zoneCount: 6, rules: repeat({ min: "3", max: "6" }, 6) }),
      ),
      [3, 6],
    );
  });

  it("falls back to the base game's defaults for a zero bound", () => {
    assert.deepEqual(
      brackets.armyRange(
        sys("a", { zoneCount: 4, rules: repeat({ min: 0, max: 0 }, 4) }),
      ),
      [2, 4],
    );
  });

  it("handles landing_zones given as a bare coordinate array", () => {
    assert.deepEqual(brackets.armyRange(sys("a", { bareZones: 2 })), [2, 2]);
  });

  it("handles a zone list with no rules at all", () => {
    assert.deepEqual(
      brackets.armyRange(sys("a", { zoneCount: 4, rules: [] })),
      [2, 4],
    );
  });
});

describe("armyRange - generated armies", () => {
  it("uses numArmies when no planet has a zone list", () => {
    assert.deepEqual(brackets.armyRange(sys("a", { numArmies: 6 })), [2, 6]);
  });

  it("reads numArmies from the pre-fixupPlanetConfig shape too", () => {
    const system = {
      name: "a",
      planets: [{ planet: { biome: "earth", numArmies: 6 } }],
    };
    assert.deepEqual(brackets.armyRange(system), [2, 6]);
  });

  it("ignores numArmies when any planet has hand-placed zones", () => {
    const system = {
      name: "a",
      planets: [
        sys("x", { zoneCount: 2 }).planets[0],
        sys("y", { numArmies: 8 }).planets[0],
      ],
    };
    assert.deepEqual(brackets.armyRange(system), [2, 2]);
  });
});

describe("armyRange - underivable", () => {
  it("returns null when a system carries no army information", () => {
    assert.equal(brackets.armyRange(sys("a")), null);
  });

  it("returns null for empty and malformed systems", () => {
    assert.equal(brackets.armyRange({ planets: [] }), null);
    assert.equal(brackets.armyRange({}), null);
    assert.equal(brackets.armyRange(undefined), null);
  });
});

describe("bracketsFrom", () => {
  // Systems within a bracket are ordered by name, not by their position in the pool -
  // see the pool order independence suite below for why.
  it("collapses identical ranges into one bracket, ordered by name", () => {
    const pool = [
      sys("c", { zoneCount: 2 }),
      sys("b", { zoneCount: 4, rules: repeat({ min: 2, max: 4 }, 4) }),
      sys("a", { zoneCount: 2 }),
    ];
    const built = brackets.bracketsFrom(pool);
    assert.equal(built.length, 2);
    assert.deepEqual(names(built[0].systems), ["a", "c"]);
    assert.deepEqual(names(built[1].systems), ["b"]);
  });

  it("drops the lowest bracket's minimum to zero so the origin star is served", () => {
    const built = brackets.bracketsFrom([
      sys("a", { zoneCount: 2 }),
      sys("b", { zoneCount: 4, rules: repeat({ min: 2, max: 4 }, 4) }),
    ]);
    assert.deepEqual(
      built.map((bracket) => [bracket.min, bracket.max]),
      [
        [0, 2],
        [2, 4],
      ],
    );
  });

  it("breaks a tie on the lowest minimum by the smallest range", () => {
    const built = brackets.bracketsFrom([
      sys("wide", { players: [2, 10], zoneCount: 10 }),
      sys("narrow", { players: [2, 4], zoneCount: 10 }),
      sys("high", { players: [4, 4], zoneCount: 10 }),
    ]);
    assert.deepEqual(
      built.map((bracket) => [bracket.min, bracket.max]),
      [
        [0, 4],
        [2, 10],
        [4, 4],
      ],
    );
  });

  it("still reaches zero when nothing in the pool supports two armies", () => {
    const built = brackets.bracketsFrom([
      sys("a", { players: [4, 6], zoneCount: 6 }),
      sys("b", { players: [6, 8], zoneCount: 8 }),
    ]);
    assert.deepEqual(
      built.map((bracket) => [bracket.min, bracket.max]),
      [
        [0, 6],
        [6, 8],
      ],
    );
  });

  it("warns once per underivable system and leaves it out of every bracket", () => {
    const run = withoutWarnings(() =>
      brackets.bracketsFrom([
        sys("keep", { zoneCount: 2 }),
        sys("drop-me"),
        sys("drop-me-too"),
      ]),
    );
    assert.equal(run.warnings.length, 2);
    assert.match(run.warnings[0], /drop-me/);
    assert.deepEqual(names(run.result[0].systems), ["keep"]);
    assert.equal(run.result.length, 1);
  });

  it("returns no brackets for an empty or wholly underivable pool", () => {
    assert.deepEqual(brackets.bracketsFrom([]), []);
    const run = withoutWarnings(() => brackets.bracketsFrom([sys("a")]));
    assert.deepEqual(run.result, []);
  });
});

describe("candidatesFor", () => {
  const built = [ranged(0, 2, ["small"]), ranged(2, 4, ["mid"])].concat([
    ranged(2, 10, ["large"]),
  ]);

  it("serves the nearest stars from the zero-minimum bracket alone", () => {
    assert.deepEqual(names(brackets.candidatesFor(built, 0)), ["small"]);
    assert.deepEqual(names(brackets.candidatesFor(built, 1)), ["small"]);
  });

  it("drops the smallest systems once the star is beyond their reach", () => {
    assert.deepEqual(names(brackets.candidatesFor(built, 3)), ["mid", "large"]);
  });

  it("clamps a star beyond every bracket to the largest", () => {
    assert.deepEqual(names(brackets.candidatesFor(built, 40)), ["large"]);
  });

  it("fills a gap in the cover from the closest bracket above it", () => {
    const gapped = [ranged(0, 2, ["small"]), ranged(6, 8, ["large"])];
    assert.deepEqual(names(brackets.candidatesFor(gapped, 4)), ["large"]);
  });

  it("returns nothing when there are no brackets", () => {
    assert.deepEqual(brackets.candidatesFor([], 2), []);
    assert.deepEqual(brackets.candidatesFor(undefined, 2), []);
  });
});

describe("selectorFor", () => {
  function counter() {
    const calls = { count: 0 };
    calls.random = () => {
      calls.count += 1;
      return (calls.count % 7) / 7;
    };
    return calls;
  }

  it("consumes randomness only while ordering the pool", () => {
    const built = brackets.bracketsFrom([
      sys("a", { zoneCount: 2 }),
      sys("b", { zoneCount: 2 }),
    ]);
    const random = counter();
    const selector = brackets.selectorFor(built, random.random);
    const ordering = random.count;

    selector.take(2);
    selector.take(2);
    assert.equal(random.count, ordering);
  });

  it("reproduces the same galaxy from the same random stream", () => {
    const pool = () => [
      sys("a", { zoneCount: 2 }),
      sys("b", { zoneCount: 2 }),
      sys("c", { zoneCount: 4, rules: repeat({ min: 2, max: 4 }, 4) }),
    ];
    const run = () => {
      const selector = brackets.selectorFor(
        brackets.bracketsFrom(pool()),
        counter().random,
      );
      return [
        selector.take(2).name,
        selector.take(2).name,
        selector.take(3).name,
      ];
    };
    assert.deepEqual(run(), run());
  });

  it("does not place the same system twice while others are free", () => {
    const built = brackets.bracketsFrom([
      sys("a", { zoneCount: 2 }),
      sys("b", { zoneCount: 2 }),
      sys("c", { zoneCount: 2 }),
    ]);
    const selector = brackets.selectorFor(built, counter().random);
    const placed = [
      selector.take(2).name,
      selector.take(2).name,
      selector.take(2).name,
    ];
    assert.deepEqual(placed.slice().sort(), ["a", "b", "c"]);
  });

  it("hands out the smallest fitting system before reaching a larger one", () => {
    const built = brackets.bracketsFrom([
      sys("small", { zoneCount: 2 }),
      sys("large", { players: [2, 8], zoneCount: 8 }),
    ]);
    const selector = brackets.selectorFor(built, counter().random);
    // Both fit a two-army star, but the eight-army system is kept back until the
    // smaller one is gone - which is why stars are served in distance order.
    assert.equal(selector.take(2).name, "small");
    assert.equal(selector.take(2).name, "large");
  });

  it("reuses a system rather than leaving a star empty once the pool runs out", () => {
    const built = brackets.bracketsFrom([sys("only", { zoneCount: 2 })]);
    const selector = brackets.selectorFor(built, counter().random);
    assert.equal(selector.take(2).name, "only");
    assert.equal(selector.take(2).name, "only");
  });

  it("returns a copy, leaving the pooled system untouched", () => {
    const pooled = sys("a", { zoneCount: 2 });
    const built = brackets.bracketsFrom([pooled]);
    const taken = brackets.selectorFor(built, counter().random).take(2);

    taken.planets[0].generator.biome = "lava";
    assert.equal(pooled.planets[0].generator.biome, "earth");
  });

  it("backfills starting_planet on the copy only", () => {
    const pooled = sys("a", { zoneCount: 2 });
    const built = brackets.bracketsFrom([pooled]);
    const taken = brackets.selectorFor(built, counter().random).take(2);

    assert.equal(taken.planets[0].starting_planet, true);
    assert.equal(pooled.planets[0].starting_planet, undefined);
  });

  it("leaves an existing starting planet where the author put it", () => {
    const pooled = sys("a", { zoneCount: 2 });
    pooled.planets.push({
      generator: { biome: "moon" },
      starting_planet: true,
    });
    const built = brackets.bracketsFrom([pooled]);
    const taken = brackets.selectorFor(built, counter().random).take(2);

    assert.equal(taken.planets[0].starting_planet, undefined);
    assert.equal(taken.planets[1].starting_planet, true);
  });

  it("skips a system the galaxy builder could not load", () => {
    const broken = sys("broken", { zoneCount: 2 });
    delete broken.planets[0].generator;
    const built = brackets.bracketsFrom([
      broken,
      sys("good", { zoneCount: 2 }),
    ]);
    const selector = brackets.selectorFor(built, counter().random);

    assert.equal(selector.take(2).name, "good");
  });

  it("returns null when nothing is usable and when there are no brackets", () => {
    const broken = sys("broken", { zoneCount: 2 });
    delete broken.planets[0].generator;
    const built = brackets.bracketsFrom([broken]);

    assert.equal(brackets.selectorFor(built, counter().random).take(2), null);
    assert.equal(brackets.selectorFor([], counter().random).take(2), null);
  });
});

describe("bracketsFrom - pool order independence", () => {
  // Shared Systems assembles its pool in resolution order, and selectorFor keys off
  // pool order, so without a sort one seed places different systems each load.
  const pool = [
    sys("Alpha", { zoneCount: 2 }),
    sys("Bravo", { zoneCount: 4 }),
    sys("Charlie", { zoneCount: 2 }),
    sys("Delta", { zoneCount: 8 }),
    sys("Echo", { zoneCount: 4 }),
  ];

  const names = (built) =>
    built.map((b) => [b.min, b.max, b.systems.map((s) => s.name)]);

  it("brackets identically however the pool is ordered", () => {
    const forwards = names(brackets.bracketsFrom(pool.slice()));
    const backwards = names(brackets.bracketsFrom(pool.slice().reverse()));
    const rotated = names(
      brackets.bracketsFrom(pool.slice(2).concat(pool.slice(0, 2))),
    );
    assert.deepEqual(backwards, forwards);
    assert.deepEqual(rotated, forwards);
  });

  it("selects the same system for a distance however the pool is ordered", () => {
    // A fixed sequence, so any difference comes from pool order, not the draws.
    const sequence = () => {
      let count = 0;
      return () => {
        count += 1;
        return (count % 7) / 7;
      };
    };
    const pick = (list) =>
      brackets.selectorFor(brackets.bracketsFrom(list), sequence()).take(4)
        .name;
    assert.equal(pick(pool.slice().reverse()), pick(pool.slice()));
  });

  it("does not mutate the caller's array", () => {
    const original = pool.slice().reverse();
    const snapshot = original.map((s) => s.name);
    brackets.bracketsFrom(original);
    assert.deepEqual(
      original.map((s) => s.name),
      snapshot,
    );
  });
});
