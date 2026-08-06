"use strict";

// Tests for shared/gwo_rng.js. The stream-independence and no-Math.random suites
// below are the two properties the rest of the seeding work rests on.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

function draws(rng, count) {
  return Array.from({ length: count }, () => rng());
}

describe("gwo_rng create", () => {
  it("reproduces the same sequence for the same seed", () => {
    assert.deepEqual(
      draws(gwoRng.create("gwo-test-1"), 100),
      draws(gwoRng.create("gwo-test-1"), 100)
    );
  });

  it("produces a different sequence for an adjacent seed", () => {
    assert.notDeepEqual(
      draws(gwoRng.create("gwo-test-1"), 20),
      draws(gwoRng.create("gwo-test-2"), 20)
    );
  });

  it("accepts numeric seeds, including zero", () => {
    assert.deepEqual(draws(gwoRng.create(0), 10), draws(gwoRng.create(0), 10));
    assert.notDeepEqual(
      draws(gwoRng.create(0), 10),
      draws(gwoRng.create(1), 10)
    );
    // The lobby stores the seed as a string, so "12345" and 12345 must agree.
    assert.deepEqual(
      draws(gwoRng.create(12345), 10),
      draws(gwoRng.create("12345"), 10)
    );
  });

  it("stays within [0, 1)", () => {
    const values = draws(gwoRng.create("range"), 1000);
    assert.ok(values.every((value) => value >= 0 && value < 1));
  });
});

describe("gwo_rng int", () => {
  it("is inclusive at both bounds, like _.random", () => {
    const rng = gwoRng.create("int-bounds");
    const seen = new Set(Array.from({ length: 500 }, () => rng.int(1, 3)));
    assert.deepEqual([...seen].sort(), [1, 2, 3]);
  });

  it("never leaves the range", () => {
    const rng = gwoRng.create("int-range");
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(5, 9);
      assert.ok(value >= 5 && value <= 9, `out of range: ${value}`);
    }
  });

  it("collapses to the bound when min equals max", () => {
    const rng = gwoRng.create("int-collapse");
    assert.equal(rng.int(7, 7), 7);
  });
});

describe("gwo_rng float", () => {
  it("stays within [min, max)", () => {
    const rng = gwoRng.create("float");
    for (let i = 0; i < 500; i++) {
      const value = rng.float(0.9, 1.1);
      assert.ok(value >= 0.9 && value < 1.1, `out of range: ${value}`);
    }
  });
});

describe("gwo_rng pick", () => {
  it("returns undefined for an empty or absent list", () => {
    const rng = gwoRng.create("pick-empty");
    assert.equal(rng.pick([]), undefined);
    assert.equal(rng.pick(undefined), undefined);
  });

  it("returns the sole element of a one-element list", () => {
    const rng = gwoRng.create("pick-one");
    assert.equal(rng.pick(["only"]), "only");
  });

  it("reaches every element", () => {
    const rng = gwoRng.create("pick-spread");
    const seen = new Set(
      Array.from({ length: 200 }, () => rng.pick(["a", "b", "c"]))
    );
    assert.deepEqual([...seen].sort(), ["a", "b", "c"]);
  });
});

describe("gwo_rng sample", () => {
  it("returns n distinct elements", () => {
    const rng = gwoRng.create("sample");
    const picked = rng.sample([1, 2, 3, 4, 5], 3);
    assert.equal(picked.length, 3);
    assert.equal(new Set(picked).size, 3);
  });

  it("returns the whole list when n exceeds its length", () => {
    const rng = gwoRng.create("sample-over");
    assert.deepEqual(rng.sample([1, 2, 3], 10).sort(), [1, 2, 3]);
  });

  // setupAIBuffs asks for a negative count near the origin. lodash clamps to [];
  // anything else breaks every low-distance AI.
  it("returns an empty array for a zero or negative n", () => {
    const rng = gwoRng.create("sample-negative");
    assert.deepEqual(rng.sample([1, 2, 3], 0), []);
    assert.deepEqual(rng.sample([1, 2, 3], -4), []);
  });

  it("does not mutate its input", () => {
    const rng = gwoRng.create("sample-pure");
    const list = [1, 2, 3, 4, 5];
    rng.sample(list, 3);
    assert.deepEqual(list, [1, 2, 3, 4, 5]);
  });
});

describe("gwo_rng shuffle", () => {
  it("keeps the same elements and leaves the input alone", () => {
    const rng = gwoRng.create("shuffle");
    const list = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle(list);
    assert.deepEqual(shuffled.slice().sort(), list.slice().sort());
    assert.deepEqual(list, [1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("shuffles identically for the same seed", () => {
    const list = [1, 2, 3, 4, 5, 6, 7, 8];
    assert.deepEqual(
      gwoRng.create("shuffle-same").shuffle(list),
      gwoRng.create("shuffle-same").shuffle(list)
    );
  });

  it("handles an empty or absent list", () => {
    const rng = gwoRng.create("shuffle-empty");
    assert.deepEqual(rng.shuffle([]), []);
    assert.deepEqual(rng.shuffle(undefined), []);
  });
});

describe("gwo_rng stream", () => {
  it("gives different streams different labels", () => {
    const root = gwoRng.create("root");
    assert.notDeepEqual(
      draws(root.stream("a"), 20),
      draws(root.stream("b"), 20)
    );
  });

  // A stream derives from the seed path, not a counter, so adding a draw in one
  // phase cannot move another's results. See galaxy.md.
  it("is unaffected by draws taken from the parent or a sibling first", () => {
    const clean = gwoRng.create("root").stream("a");

    const busy = gwoRng.create("root");
    draws(busy, 50);
    draws(busy.stream("b"), 50);
    const afterOtherWork = busy.stream("a");

    assert.deepEqual(draws(clean, 20), draws(afterOtherWork, 20));
  });

  it("separates indexes under one label", () => {
    const root = gwoRng.create("root");
    assert.notDeepEqual(
      draws(root.stream("star", 0), 20),
      draws(root.stream("star", 1), 20)
    );
  });

  it("cannot collide an indexed stream with a concatenated label", () => {
    const root = gwoRng.create("root");
    assert.notDeepEqual(
      draws(root.stream("a", 1), 20),
      draws(root.stream("a1"), 20)
    );
  });

  it("nests, and nested streams stay independent of their siblings", () => {
    const root = gwoRng.create("root");
    assert.notDeepEqual(
      draws(root.stream("ai", 0).stream("worker", 0), 20),
      draws(root.stream("ai", 0).stream("worker", 1), 20)
    );
    assert.deepEqual(
      draws(gwoRng.create("root").stream("ai", 2).stream("boss"), 20),
      draws(gwoRng.create("root").stream("ai", 2).stream("boss"), 20)
    );
  });
});

describe("gwo_rng independence from Math.random", () => {
  // A Math.random fallback creeping into any helper would make war generation
  // unreproducible again, and only this test would notice.
  it("never touches Math.random", () => {
    const nativeRandom = Math.random;
    Math.random = () => {
      throw new Error("gwo_rng must not draw from Math.random");
    };

    try {
      const rng = gwoRng.create("no-math-random");
      rng();
      rng.int(1, 10);
      rng.float(0, 1);
      rng.pick([1, 2, 3]);
      rng.sample([1, 2, 3, 4], 2);
      rng.shuffle([1, 2, 3, 4]);
      draws(rng.stream("child", 1), 10);
    } finally {
      Math.random = nativeRandom;
    }
  });
});
