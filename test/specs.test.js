"use strict";

// Unit tests for shared/specs.js, the spec-merge engine that resolves base_spec
// inheritance and applies tech-card spec mods. This is the most self-contained piece
// of logic in the mod (see scripts/lib/amd-loader.js's module doc), so these tests
// exercise real regression risk rather than just exercising the test harness.
//
// Only `mod` and `additionalSpecs` are exposed (see the return statement at the
// bottom of specs.js) - flattenBaseSpecs/orderOfOperations are internal and are
// exercised indirectly through mod()'s observable behavior, same as any consumer.

const { describe, it, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const specs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js"
);

afterEach(() => {
  mock.restoreAll();
});

describe("specs.mod - basic ops", () => {
  it("replace overwrites the value at path", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "replace", value: 200 }],
      ""
    );
    assert.equal(data["unit.json"].hp, 200);
  });

  it("multiply scales a numeric value", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "multiply", value: 2 }],
      ""
    );
    assert.equal(data["unit.json"].hp, 200);
  });

  it("multiply on a non-number logs a warning and leaves the value unchanged", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = { "unit.json": { hp: "not-a-number" } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "multiply", value: 2 }],
      ""
    );
    assert.equal(data["unit.json"].hp, "not-a-number");
    assert.equal(warnMock.mock.callCount(), 1);
  });

  it("add sums a numeric value", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "add", value: 50 }],
      ""
    );
    assert.equal(data["unit.json"].hp, 150);
  });

  it("add on a nullish value sets it directly, creating the field", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "newField", op: "add", value: 5 }],
      ""
    );
    assert.equal(data["unit.json"].newField, 5);
  });

  it("merge shallow-assigns onto an existing object", () => {
    const data = { "unit.json": { audio: { found: "a" } } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "audio", op: "merge", value: { lost: "b" } }],
      ""
    );
    assert.deepEqual(data["unit.json"].audio, { found: "a", lost: "b" });
  });

  it("push appends to an existing array", () => {
    const data = { "unit.json": { tags: ["a"] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "push", value: "b" }],
      ""
    );
    assert.deepEqual(data["unit.json"].tags, ["a", "b"]);
  });

  it("push on a missing path creates the array", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "push", value: "a" }],
      ""
    );
    assert.deepEqual(data["unit.json"].tags, ["a"]);
  });

  it("pull removes a matching element from an array", () => {
    const data = { "unit.json": { tags: ["a", "b", "c"] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "pull", value: "b" }],
      ""
    );
    assert.deepEqual(data["unit.json"].tags, ["a", "c"]);
  });

  it("wipe removes a substring", () => {
    const data = { "unit.json": { description: "hello world" } };
    specs.mod(
      data,
      [
        {
          file: "unit.json",
          path: "description",
          op: "wipe",
          value: ["world", "there"],
        },
      ],
      ""
    );
    assert.equal(data["unit.json"].description, "hello there");
  });

  it("prepend adds to the front of an array", () => {
    const data = { "unit.json": { tags: ["b"] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "prepend", value: "a" }],
      ""
    );
    assert.deepEqual(data["unit.json"].tags, ["a", "b"]);
  });

  it("multiplyOrCreate sets the value when nullish", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "mult", op: "multiplyOrCreate", value: 5 }],
      ""
    );
    assert.equal(data["unit.json"].mult, 5);
  });

  it("multiplyOrCreate multiplies when already a number", () => {
    const data = { "unit.json": { mult: 3 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "mult", op: "multiplyOrCreate", value: 5 }],
      ""
    );
    assert.equal(data["unit.json"].mult, 15);
  });

  it("eval runs the given code against the current value", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [
        {
          file: "unit.json",
          path: "hp",
          op: "eval",
          value: "return attribute + 50;",
        },
      ],
      ""
    );
    assert.equal(data["unit.json"].hp, 150);
  });

  it("tag rewrites a file reference's spec-tag suffix", () => {
    const data = { "unit.json": { ref: "other_unit.json.oldtag" } };
    specs.mod(data, [{ file: "unit.json", path: "ref", op: "tag" }], ".newtag");
    assert.equal(data["unit.json"].ref, "other_unit.json.newtag");
  });

  it("clone (pathless) deep-clones the whole spec under a new tagged key", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [{ file: "unit.json", op: "clone", value: "unit_copy.json" }],
      ".tag1"
    );
    assert.deepEqual(data["unit_copy.json.tag1"], { hp: 100 });
    assert.notEqual(data["unit_copy.json.tag1"], data["unit.json"]); // real clone, not aliased
  });
});

describe("specs.mod - path walking", () => {
  it("auto-creates intermediate objects for a nested path", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "weapon.damage", op: "replace", value: 50 }],
      ""
    );
    assert.deepEqual(data["unit.json"].weapon, { damage: 50 });
  });

  it("addresses an existing array element by numeric index", () => {
    const data = { "unit.json": { list: [{ a: 1 }, { a: 2 }] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "list.0.a", op: "replace", value: 99 }],
      ""
    );
    assert.equal(data["unit.json"].list[0].a, 99);
    assert.equal(data["unit.json"].list[1].a, 2);
  });

  it('appends a new array element via a "+" path segment', () => {
    const data = { "unit.json": { list: [] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "list.+.a", op: "replace", value: 5 }],
      ""
    );
    assert.deepEqual(data["unit.json"].list, [{ a: 5 }]);
  });
});

describe("specs.mod - base_spec inheritance", () => {
  it("flattens an inherited base_spec onto the child before applying the mod", () => {
    const data = {
      "base.json": { hp: 100, tags: ["base"] },
      "child.json": { base_spec: "base.json", armor: 10 },
    };
    specs.mod(
      data,
      [{ file: "child.json", path: "armor", op: "replace", value: 20 }],
      ""
    );
    assert.equal(data["child.json"].hp, 100);
    assert.deepEqual(data["child.json"].tags, ["base"]);
    assert.equal(data["child.json"].armor, 20);
    assert.equal("base_spec" in data["child.json"], false);
  });

  it("prefers the spec-tagged base variant when one exists", () => {
    const data = {
      "base.json.mytag": { hp: 200 },
      "base.json": { hp: 100 },
      "child.json": { base_spec: "base.json", armor: 5 },
    };
    specs.mod(
      data,
      [{ file: "child.json", path: "armor", op: "replace", value: 5 }],
      ".mytag"
    );
    assert.equal(data["child.json"].hp, 200);
  });

  it("child arrays fully replace base arrays rather than merging index-by-index", () => {
    const data = {
      "base.json": { ammo_id: ["a", "b", "c"] },
      "child.json": { base_spec: "base.json", ammo_id: ["x"] },
    };
    specs.mod(
      data,
      [{ file: "child.json", path: "other", op: "replace", value: 1 }],
      ""
    );
    assert.deepEqual(data["child.json"].ammo_id, ["x"]);
  });

  it("drops an unresolvable base_spec and warns, rather than throwing", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = { "child.json": { base_spec: "missing.json", armor: 5 } };
    specs.mod(
      data,
      [{ file: "child.json", path: "armor", op: "replace", value: 10 }],
      ""
    );
    assert.equal(data["child.json"].armor, 10);
    assert.equal("base_spec" in data["child.json"], false);
    assert.equal(warnMock.mock.callCount(), 1);
  });
});

describe("specs.mod - operation ordering", () => {
  it("applies replace, then multiply, then add, regardless of input order", () => {
    const data = { "unit.json": { hp: 10 } };
    specs.mod(
      data,
      [
        { file: "unit.json", path: "hp", op: "add", value: 5 },
        { file: "unit.json", path: "hp", op: "multiply", value: 2 },
        { file: "unit.json", path: "hp", op: "replace", value: 10 },
      ],
      ""
    );
    // replace -> 10, multiply -> 20, add -> 25 (not the input order: 10*2's result +5 would
    // differ from any other application order, so this also pins the order itself)
    assert.equal(data["unit.json"].hp, 25);
  });
});

describe("specs.mod - malformed-mod tolerance", () => {
  it("logs and skips an unknown op without throwing or blocking later mods", () => {
    const errorMock = mock.method(console, "error", () => {});
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [
        { file: "unit.json", path: "hp", op: "not_a_real_op", value: 1 },
        { file: "unit.json", path: "hp", op: "replace", value: 555 },
      ],
      ""
    );
    assert.equal(data["unit.json"].hp, 555);
    assert.equal(errorMock.mock.callCount(), 1);
  });

  it("logs and skips a pathless op that requires a path", () => {
    const errorMock = mock.method(console, "error", () => {});
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [
        { file: "unit.json", op: "multiply", value: 2 },
        { file: "unit.json", path: "hp", op: "replace", value: 777 },
      ],
      ""
    );
    // The pathless multiply is a no-op; the later mod still applies.
    assert.equal(data["unit.json"].hp, 777);
    assert.equal(errorMock.mock.callCount(), 1);
  });

  it("logs and skips a mod whose intermediate path segment is not traversable", () => {
    const errorMock = mock.method(console, "error", () => {});
    const data = { "unit.json": { a: 5 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "a.b", op: "replace", value: 1 }],
      ""
    );
    // `a` is a primitive, so it can't be walked into; the mod aborts unchanged.
    assert.equal(data["unit.json"].a, 5);
    assert.equal(errorMock.mock.callCount(), 1);
  });

  it("warns and continues when the target file is missing", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = {};
    assert.doesNotThrow(() => {
      specs.mod(
        data,
        [{ file: "missing.json", path: "hp", op: "replace", value: 1 }],
        ""
      );
    });
    assert.equal(warnMock.mock.callCount(), 1);
  });

  it("catches a throwing mod (e.g. bad eval code) and continues with the rest", () => {
    const errorMock = mock.method(console, "error", () => {});
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [
        {
          file: "unit.json",
          path: "hp",
          op: "eval",
          value: "this is not valid JS(((",
        },
        { file: "unit.json", path: "hp", op: "replace", value: 999 },
      ],
      ""
    );
    assert.equal(data["unit.json"].hp, 999);
    assert.equal(errorMock.mock.callCount(), 1);
  });
});

describe("specs.additionalSpecs", () => {
  it("is a fixed list of extra unit spec file paths", () => {
    assert.equal(specs.additionalSpecs.length, 6);
    for (const entry of specs.additionalSpecs) {
      assert.equal(typeof entry, "string");
      assert.match(entry, /^\/pa\//);
    }
  });
});
