"use strict";

// Unit tests for shared/specs.js. Only `mod` and `additionalSpecs` are exposed, so
// flattenBaseSpecs and orderOfOperations are reached through mod()'s behaviour.

const { describe, it, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const specs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
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
      "",
    );
    assert.equal(data["unit.json"].hp, 200);
  });

  it("multiply scales a numeric value", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "multiply", value: 2 }],
      "",
    );
    assert.equal(data["unit.json"].hp, 200);
  });

  it("multiply on a non-number logs a warning and leaves the value unchanged", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = { "unit.json": { hp: "not-a-number" } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "multiply", value: 2 }],
      "",
    );
    assert.equal(data["unit.json"].hp, "not-a-number");
    assert.equal(warnMock.mock.callCount(), 1);
  });

  it("add sums a numeric value", () => {
    const data = { "unit.json": { hp: 100 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "add", value: 50 }],
      "",
    );
    assert.equal(data["unit.json"].hp, 150);
  });

  it("add on a nullish value sets it directly, creating the field", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "newField", op: "add", value: 5 }],
      "",
    );
    assert.equal(data["unit.json"].newField, 5);
  });

  it("merge shallow-assigns onto an existing object", () => {
    const data = { "unit.json": { audio: { found: "a" } } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "audio", op: "merge", value: { lost: "b" } }],
      "",
    );
    assert.deepEqual(data["unit.json"].audio, { found: "a", lost: "b" });
  });

  it("push appends to an existing array", () => {
    const data = { "unit.json": { tags: ["a"] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "push", value: "b" }],
      "",
    );
    assert.deepEqual(data["unit.json"].tags, ["a", "b"]);
  });

  it("push on a missing path creates the array", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "push", value: "a" }],
      "",
    );
    assert.deepEqual(data["unit.json"].tags, ["a"]);
  });

  it("pull removes a matching element from an array", () => {
    const data = { "unit.json": { tags: ["a", "b", "c"] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "pull", value: "b" }],
      "",
    );
    assert.deepEqual(data["unit.json"].tags, ["a", "c"]);
  });

  it("wipe substitutes one substring for another, given a [from, to] pair", () => {
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
      "",
    );
    assert.equal(data["unit.json"].description, "hello there");
  });

  it("prepend adds to the front of an array", () => {
    const data = { "unit.json": { tags: ["b"] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "tags", op: "prepend", value: "a" }],
      "",
    );
    assert.deepEqual(data["unit.json"].tags, ["a", "b"]);
  });

  it("multiplyOrCreate sets the value when nullish", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [{ file: "unit.json", path: "mult", op: "multiplyOrCreate", value: 5 }],
      "",
    );
    assert.equal(data["unit.json"].mult, 5);
  });

  it("multiplyOrCreate multiplies when already a number", () => {
    const data = { "unit.json": { mult: 3 } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "mult", op: "multiplyOrCreate", value: 5 }],
      "",
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
      "",
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
      ".tag1",
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
      "",
    );
    assert.deepEqual(data["unit.json"].weapon, { damage: 50 });
  });

  it("addresses an existing array element by numeric index", () => {
    const data = { "unit.json": { list: [{ a: 1 }, { a: 2 }] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "list.0.a", op: "replace", value: 99 }],
      "",
    );
    assert.equal(data["unit.json"].list[0].a, 99);
    assert.equal(data["unit.json"].list[1].a, 2);
  });

  it('appends a new array element via a "+" path segment', () => {
    const data = { "unit.json": { list: [] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "list.+.a", op: "replace", value: 5 }],
      "",
    );
    assert.deepEqual(data["unit.json"].list, [{ a: 5 }]);
  });

  it("replace creates a full missing path, building an array where a segment indexes", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [
        {
          file: "unit.json",
          path: "recon.observer.items.1.radius",
          op: "replace",
          value: 50,
        },
      ],
      "",
    );
    const items = data["unit.json"].recon.observer.items;
    assert.ok(Array.isArray(items), "items should be created as an array");
    assert.equal(items[1].radius, 50);
  });

  it("multiplyOrCreate sets the value along a missing array path", () => {
    const data = { "unit.json": {} };
    specs.mod(
      data,
      [
        {
          file: "unit.json",
          path: "recon.observer.items.1.radius",
          op: "multiplyOrCreate",
          value: 50,
        },
      ],
      "",
    );
    const items = data["unit.json"].recon.observer.items;
    assert.ok(Array.isArray(items), "items should be created as an array");
    assert.equal(items[1].radius, 50);
  });

  it("populates a missing index in an existing array without disturbing others", () => {
    const data = { "unit.json": { list: [{ a: 1 }] } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "list.1.a", op: "replace", value: 7 }],
      "",
    );
    assert.ok(Array.isArray(data["unit.json"].list));
    assert.equal(data["unit.json"].list[0].a, 1);
    assert.equal(data["unit.json"].list[1].a, 7);
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
      "",
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
      ".mytag",
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
      "",
    );
    assert.deepEqual(data["child.json"].ammo_id, ["x"]);
  });

  it("drops an unresolvable base_spec and warns, rather than throwing", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = { "child.json": { base_spec: "missing.json", armor: 5 } };
    specs.mod(
      data,
      [{ file: "child.json", path: "armor", op: "replace", value: 10 }],
      "",
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
      "",
    );
    // replace -> 10, multiply -> 20, add -> 25 (not the input order: 10*2's result +5 would
    // differ from any other application order, so this also pins the order itself)
    assert.equal(data["unit.json"].hp, 25);
  });

  // A clone is the only op that creates a spec id, so it has to run before the
  // ops that name the copy. Declared last here to prove the ordering, not luck.
  it("clones before the ops that target the copy", () => {
    const data = { "unit.json": { hp: 10 } };
    specs.mod(
      data,
      [
        { file: "copy.json", path: "hp", op: "replace", value: 50 },
        { file: "copy.json", path: "armour", op: "push", value: "plate" },
        { file: "unit.json", op: "clone", value: "copy.json" },
      ],
      ".tag1",
    );
    assert.deepEqual(data["copy.json.tag1"], { hp: 50, armour: ["plate"] });
    assert.equal(data["unit.json"].hp, 10, "the source must be left alone");
  });

  // Hoisting every replace ahead of every tag leaves the two tags adjacent, with
  // no replace between them to reset the value. Shipped pairing: killswitch and
  // the Colonel upgrade both tag the Colonel's death_weapon.ground_ammo_spec.
  it("tags a path only once when two cards tag it", () => {
    const data = { "unit.json": { ref: "stock.json.player" } };
    specs.mod(
      data,
      [
        { file: "unit.json", path: "ref", op: "replace", value: "a.json" },
        { file: "unit.json", path: "ref", op: "tag" },
        { file: "unit.json", path: "ref", op: "replace", value: "b.json" },
        { file: "unit.json", path: "ref", op: "tag" },
      ],
      ".player",
    );
    assert.equal(data["unit.json"].ref, "b.json.player");
  });

  // Mirror mode concatenates the host's mods onto the guardians' inventory, and
  // per-player tech adds every viewer's on top, so one card's mods can arrive twice.
  it("tags a path only once when one card's mods are duplicated", () => {
    const mods = [
      { file: "unit.json", path: "ref", op: "replace", value: "a.json" },
      { file: "unit.json", path: "ref", op: "tag" },
    ];
    const data = { "unit.json": { ref: "stock.json.ai0" } };
    specs.mod(data, mods.concat(mods), ".ai0");
    assert.equal(data["unit.json"].ref, "a.json.ai0");
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
      "",
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
      "",
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
      "",
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
        "",
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
      "",
    );
    assert.equal(data["unit.json"].hp, 999);
    assert.equal(errorMock.mock.callCount(), 1);
  });
});

describe("specs.mod - navigation pruning", () => {
  // An empty navigation object marks a structure as mobile. See specs.md.
  it("removes a navigation object left empty by a mod on a structure", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = { "struct.json": { hp: 100 } };
    specs.mod(
      data,
      [
        {
          file: "struct.json",
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.5,
        },
      ],
      "",
    );
    // multiply on a nonexistent numeric leaf leaves navigation.move_speed
    // undefined - which serialises to navigation: {} - so navigation is stripped.
    assert.equal("navigation" in data["struct.json"], false);
    assert.equal(data["struct.json"].hp, 100);
    // the multiply-on-missing warning still fires; pruning doesn't suppress it.
    assert.ok(warnMock.mock.callCount() >= 1);
  });

  it("removes navigation after several navigation.* mods all resolve to undefined", () => {
    mock.method(console, "warn", () => {});
    const data = { "struct.json": { hp: 100 } };
    specs.mod(
      data,
      [
        {
          file: "struct.json",
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "struct.json",
          path: "navigation.brake",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "struct.json",
          path: "navigation.acceleration",
          op: "multiply",
          value: 1.5,
        },
        {
          file: "struct.json",
          path: "navigation.turn_speed",
          op: "multiply",
          value: 1.5,
        },
      ],
      "",
    );
    assert.equal("navigation" in data["struct.json"], false);
  });

  it("keeps a populated navigation object on a genuinely mobile unit", () => {
    const data = { "unit.json": { navigation: { move_speed: 10 } } };
    specs.mod(
      data,
      [
        {
          file: "unit.json",
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.5,
        },
      ],
      "",
    );
    assert.equal("navigation" in data["unit.json"], true);
    assert.equal(data["unit.json"].navigation.move_speed, 15);
  });

  it("keeps navigation when a replace sets a real value alongside an undefined leaf", () => {
    mock.method(console, "warn", () => {});
    const data = { "struct.json": { hp: 100 } };
    specs.mod(
      data,
      [
        {
          file: "struct.json",
          path: "navigation.type",
          op: "replace",
          value: "Hover",
        },
        {
          file: "struct.json",
          path: "navigation.move_speed",
          op: "multiply",
          value: 1.5,
        },
      ],
      "",
    );
    // navigation.type is a real value, so navigation must survive (JSON would only
    // drop the undefined move_speed leaf, not the whole object).
    assert.equal("navigation" in data["struct.json"], true);
    assert.equal(data["struct.json"].navigation.type, "Hover");
  });

  it("leaves an existing empty navigation untouched for a non-navigation mod", () => {
    const data = { "unit.json": { hp: 100, navigation: {} } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "hp", op: "replace", value: 200 }],
      "",
    );
    // Pruning is scoped to navigation-targeting mods; unrelated mods don't trigger it.
    assert.equal("navigation" in data["unit.json"], true);
    assert.equal(data["unit.json"].hp, 200);
  });

  // Only an object can be "empty" in the sense pruning cares about. A mod that
  // makes navigation something else has said what it wants; the prune must not
  // second-guess it.
  it("leaves a navigation that is not an object alone", () => {
    const data = { "unit.json": { navigation: { type: "Air" } } };
    specs.mod(
      data,
      [{ file: "unit.json", path: "navigation", op: "replace", value: "walk" }],
      "",
    );
    assert.equal(data["unit.json"].navigation, "walk");
  });
});

describe("specs.additionalSpecs", () => {
  // By content, not count: a length check would pass on a swapped entry, which is
  // the mistake worth catching.
  it("holds every spec a card lends to a unit that does not already reference it", () => {
    assert.deepEqual(
      [...specs.additionalSpecs].sort(),
      [
        "/pa/units/air/air_scout/air_scout_ammo.json",
        "/pa/units/air/air_scout/air_scout_tool_weapon.json",
        "/pa/units/air/bomber/bomber_tool_weapon.json",
        "/pa/units/land/air_defense_adv/air_defense_adv_tool_weapon.json",
        "/pa/units/land/artillery_long/artillery_long_tool_weapon.json",
        "/pa/units/land/bot_bomb/bot_bomb_tool_weapon.json",
        "/pa/units/land/bot_sniper/bot_sniper_beam_tool_weapon.json",
        "/pa/units/land/bot_support_commander/bot_support_commander_tool_weapon.json",
        "/pa/units/land/fabrication_bot_combat/fabrication_bot_combat_build_arm.json",
        "/pa/units/land/fabrication_bot_combat_adv/fabrication_bot_combat_adv_build_arm.json",
        "/pa/units/land/land_scout/land_scout_ammo.json",
        "/pa/units/land/land_scout/land_scout_tool_weapon.json",
        "/pa/units/land/tank_flak/tank_flak_tool_weapon.json",
        "/pa/units/orbital/ion_defense/ion_defense_tool_antidrop.json",
        "/pa/units/orbital/orbital_laser/orbital_laser_tool_weapon.json",
        "/pa/units/orbital/orbital_railgun/orbital_railgun_tool_weapon.json",
        "/pa/units/sea/destroyer/destroyer_tool_torpedo.json",
        "/pa/units/sea/destroyer/destroyer_torpedo_ammo.json",
        "/pa/units/sea/drone_carrier/carrier/carrier_tool_weapon.json",
      ].sort(),
    );
  });
});

// Every op is handed whatever the spec already holds at the path, which for a
// card written against the wrong unit is routinely the wrong shape. These pin
// the two answers to that: warn and leave it alone, or coerce it.
describe("specs.mod - ops given the wrong shape", () => {
  const refuses = (spec, mod, expected) => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = { "unit.json": spec };
    specs.mod(data, [Object.assign({ file: "unit.json" }, mod)], "");
    assert.deepEqual(data["unit.json"], expected);
    assert.equal(warnMock.mock.callCount(), 1);
  };

  it("add refuses a value that is neither number, string nor absent", () => {
    refuses(
      { types: ["bot"] },
      { path: "types", op: "add", value: 1 },
      { types: ["bot"] },
    );
  });

  it("merge refuses a value that is not an object", () => {
    refuses(
      { hp: 100 },
      { path: "hp", op: "merge", value: { armour: 1 } },
      { hp: 100 },
    );
  });

  it("multiplyOrCreate refuses a value that is neither number nor absent", () => {
    refuses(
      { hp: "lots" },
      { path: "hp", op: "multiplyOrCreate", value: 2 },
      { hp: "lots" },
    );
  });

  it("tag refuses a value that is not a string", () => {
    refuses({ model: 100 }, { path: "model", op: "tag" }, { model: 100 });
  });

  // tag rewrites a ".json" suffix, so a value without one has nothing to
  // rewrite - appending the tag anyway would invent a path to a missing spec.
  it("tag refuses a string that names no .json file", () => {
    refuses({ model: "tank" }, { path: "model", op: "tag" }, { model: "tank" });
  });
});

// The list and string ops coerce instead of refusing, so a card can target a
// field whose base value is a bare scalar without knowing it in advance.
describe("specs.mod - ops that coerce what they are given", () => {
  const apply = (spec, mod) => {
    const data = { "unit.json": spec };
    specs.mod(data, [Object.assign({ file: "unit.json" }, mod)], "");
    return data["unit.json"];
  };

  it("push wraps a bare value into an array before appending", () => {
    assert.deepEqual(
      apply({ types: "bot" }, { path: "types", op: "push", value: "tank" }),
      { types: ["bot", "tank"] },
    );
  });

  it("push treats an explicit null as an empty list", () => {
    assert.deepEqual(
      apply({ types: null }, { path: "types", op: "push", value: "tank" }),
      { types: ["tank"] },
    );
  });

  it("push appends every element when the value is itself a list", () => {
    assert.deepEqual(
      apply(
        { types: ["bot"] },
        { path: "types", op: "push", value: ["tank", "air"] },
      ),
      { types: ["bot", "tank", "air"] },
    );
  });

  it("pull wraps a bare value before removing from it", () => {
    assert.deepEqual(
      apply({ types: "bot" }, { path: "types", op: "pull", value: "bot" }),
      { types: [] },
    );
  });

  it("pull treats an explicit null as an empty list", () => {
    assert.deepEqual(
      apply({ types: null }, { path: "types", op: "pull", value: "bot" }),
      { types: [] },
    );
  });

  it("pull removes every element when the value is a list", () => {
    assert.deepEqual(
      apply(
        { types: ["a", "b", "c"] },
        { path: "types", op: "pull", value: ["a", "c"] },
      ),
      { types: ["b"] },
    );
  });

  it("prepend wraps a bare value before pushing onto the front", () => {
    assert.deepEqual(
      apply({ types: "bot" }, { path: "types", op: "prepend", value: "tank" }),
      { types: ["tank", "bot"] },
    );
  });

  it("prepend treats an explicit null as an empty list", () => {
    assert.deepEqual(
      apply({ types: null }, { path: "types", op: "prepend", value: "tank" }),
      { types: ["tank"] },
    );
  });

  // Order matters for buildable_types and build lists, where the engine takes
  // the first match - so a prepended list keeps its own order ahead of the rest.
  it("prepend puts a whole list in front, in its own order", () => {
    assert.deepEqual(
      apply(
        { types: ["bot"] },
        { path: "types", op: "prepend", value: ["tank", "air"] },
      ),
      { types: ["tank", "air", "bot"] },
    );
  });

  it("wipe stringifies a value that is not a string", () => {
    assert.deepEqual(
      apply({ hp: 1200 }, { path: "hp", op: "wipe", value: ["0", ""] }),
      { hp: "12" },
    );
  });

  it("wipe treats an absent value as an empty string", () => {
    assert.deepEqual(
      apply({}, { path: "missing", op: "wipe", value: ["a", "b"] }),
      { missing: "" },
    );
  });

  // A bare value means "delete every occurrence", which is what makes wipe
  // usable for stripping a path fragment.
  it("wipe deletes every occurrence when given a bare value", () => {
    assert.deepEqual(
      apply(
        { model: "/pa/units/land/tank/tank.json" },
        { path: "model", op: "wipe", value: "/tank" },
      ),
      { model: "/pa/units/land.json" },
    );
  });
});

// A spec field holding a path to another spec is walked into rather than
// treated as a leaf, which is how a card reaches a unit's tool or ammo without
// naming that file itself.
describe("specs.mod - walking into a referenced spec", () => {
  it("follows a string field to the spec it names and mods that", () => {
    const data = {
      "unit.json": { tools: "tool.json" },
      "tool.json": { damage: 10 },
    };

    specs.mod(
      data,
      [{ file: "unit.json", path: "tools.damage", op: "multiply", value: 2 }],
      "",
    );

    assert.equal(data["tool.json"].damage, 20);
    // The reference itself is untouched - only what it points at changed.
    assert.equal(data["unit.json"].tools, "tool.json");
  });

  it("logs and skips a reference to a spec that is not loaded", () => {
    const errorMock = mock.method(console, "error", () => {});
    const data = { "unit.json": { tools: "missing.json" } };

    specs.mod(
      data,
      [{ file: "unit.json", path: "tools.damage", op: "multiply", value: 2 }],
      "",
    );

    assert.deepEqual(data["unit.json"], { tools: "missing.json" });
    assert.equal(errorMock.mock.callCount(), 1);
  });
});

describe("specs.mod - clone through a reference", () => {
  it("clones the spec a string field names, not the string", () => {
    const data = {
      "unit.json": { tools: "tool.json" },
      "tool.json": { damage: 10 },
    };

    specs.mod(
      data,
      [{ file: "unit.json", path: "tools", op: "clone", value: "copy.json" }],
      "",
    );

    assert.deepEqual(data["copy.json"], { damage: 10 });
    assert.notEqual(
      data["copy.json"],
      data["tool.json"],
      "the copy must not alias the spec it was taken from",
    );
    assert.equal(data["unit.json"].tools, "tool.json");
  });

  it("stores the raw string when it names no loaded spec", () => {
    const data = { "unit.json": { tools: "missing.json" } };

    specs.mod(
      data,
      [{ file: "unit.json", path: "tools", op: "clone", value: "copy.json" }],
      "",
    );

    assert.equal(data["copy.json"], "missing.json");
  });
});

describe("specs.mod - circular base_spec", () => {
  // Two specs naming each other would otherwise recurse until the stack blew,
  // taking the whole scene with it.
  it("warns and stops at the repeat rather than recursing forever", () => {
    const warnMock = mock.method(console, "warn", () => {});
    const data = {
      "a.json": { base_spec: "b.json", hp: 1 },
      "b.json": { base_spec: "a.json", armour: 2 },
    };

    specs.mod(
      data,
      [{ file: "a.json", path: "hp", op: "replace", value: 9 }],
      "",
    );

    assert.deepEqual(data["a.json"], { hp: 9, armour: 2 });
    assert.equal(warnMock.mock.callCount(), 1);
    assert.match(warnMock.mock.calls[0].arguments[0], /circular base_spec/);
  });
});
