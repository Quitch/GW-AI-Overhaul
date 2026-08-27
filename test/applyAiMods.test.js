"use strict";

// referee_ai.js's applyAiMods, reached through its test-only export hook - hence
// requireShippedModule rather than loadCouiModule. See testing.md.

const { describe, it, mock, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const { applyAiMods } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);

afterEach(() => {
  mock.restoreAll();
});

function buildJson(builds) {
  return { build_list: builds };
}

describe("applyAiMods - append", () => {
  it("concatenates onto an existing array field", () => {
    const json = buildJson([{ to_build: "Bot", builders: ["A"] }]);
    applyAiMods(json, [
      { op: "append", toBuild: "Bot", idToMod: "builders", value: "B" },
    ]);
    assert.deepEqual(json.build_list[0].builders, ["A", "B"]);
  });

  it("adds to a numeric field", () => {
    const json = buildJson([{ to_build: "Bot", priority: 100 }]);
    applyAiMods(json, [
      { op: "append", toBuild: "Bot", idToMod: "priority", value: 50 },
    ]);
    assert.equal(json.build_list[0].priority, 150);
  });

  it("only affects builds matching to_build", () => {
    const json = buildJson([
      { to_build: "Bot", builders: ["A"] },
      { to_build: "Tank", builders: ["A"] },
    ]);
    applyAiMods(json, [
      { op: "append", toBuild: "Bot", idToMod: "builders", value: "B" },
    ]);
    assert.deepEqual(json.build_list[0].builders, ["A", "B"]);
    assert.deepEqual(json.build_list[1].builders, ["A"]);
  });

  it("with refId/refValue but no matchAll, falls through to build_conditions when the ref doesn't match the build itself", () => {
    const json = buildJson([
      {
        to_build: "Bot",
        priority: 100,
        build_conditions: [[{ test_type: "SomeTest", priority: 5 }]],
      },
    ]);
    applyAiMods(json, [
      {
        op: "append",
        toBuild: "Bot",
        idToMod: "priority",
        value: 1,
        refId: "test_type",
        refValue: "SomeTest",
      },
    ]);
    // build.priority has no `test_type` field to match refId against, so the build-level
    // branch is skipped and the matching build_conditions test is updated instead.
    assert.equal(json.build_list[0].priority, 100);
    assert.equal(json.build_list[0].build_conditions[0][0].priority, 6);
  });
});

describe("applyAiMods - prepend", () => {
  // prepend concats value-first, so a bare scalar must be wrapped or it dispatches
  // to String.prototype.concat. Both branches below pin that.
  it("concatenates in front of an existing array field, given an array value", () => {
    const json = buildJson([{ to_build: "Bot", builders: ["B"] }]);
    applyAiMods(json, [
      { op: "prepend", toBuild: "Bot", idToMod: "builders", value: ["A"] },
    ]);
    assert.deepEqual(json.build_list[0].builders, ["A", "B"]);
  });

  it("with a bare scalar value, prepends it as a single array element", () => {
    const json = buildJson([{ to_build: "Bot", builders: ["B"] }]);
    applyAiMods(json, [
      { op: "prepend", toBuild: "Bot", idToMod: "builders", value: "A" },
    ]);
    assert.deepEqual(json.build_list[0].builders, ["A", "B"]);
  });

  it("with a bare scalar value, prepends it as a single array element in a build_conditions test", () => {
    const json = buildJson([
      {
        to_build: "Bot",
        build_conditions: [[{ test_type: "SomeTest", builders: ["B"] }]],
      },
    ]);
    applyAiMods(json, [
      {
        op: "prepend",
        toBuild: "Bot",
        idToMod: "builders",
        value: "A",
        matchAll: true,
      },
    ]);
    assert.deepEqual(json.build_list[0].build_conditions[0][0].builders, [
      "A",
      "B",
    ]);
  });

  // One descriptor can match both array and non-array targets, and reassigning the
  // shared `value` leaks the wrapper into the later ones. Pinned on a numeric
  // target, where [1] + 2 is "12"; a string target would hide it.
  it("does not let an array target corrupt a later non-array target", () => {
    const json = buildJson([
      { to_build: "Bot", priority: [10] },
      { to_build: "Bot", priority: 2 },
    ]);
    applyAiMods(json, [
      { op: "prepend", toBuild: "Bot", idToMod: "priority", value: 1 },
    ]);
    assert.deepEqual(json.build_list[0].priority, [1, 10]);
    assert.equal(json.build_list[1].priority, 3);
  });
});

describe("applyAiMods - replace", () => {
  it("overwrites a matched field", () => {
    const json = buildJson([{ to_build: "Bot", priority: 100 }]);
    applyAiMods(json, [
      { op: "replace", toBuild: "Bot", idToMod: "priority", value: 999 },
    ]);
    assert.equal(json.build_list[0].priority, 999);
  });

  it("with matchAll replaces every matching build_conditions test entry", () => {
    const json = buildJson([
      {
        to_build: "SupportCommander",
        build_conditions: [
          [{ test_type: "A", priority: 1 }],
          [{ test_type: "B", priority: 1 }],
        ],
      },
    ]);
    applyAiMods(json, [
      {
        op: "replace",
        toBuild: "SupportCommander",
        idToMod: "priority",
        value: 0,
        matchAll: true,
      },
    ]);
    assert.equal(json.build_list[0].build_conditions[0][0].priority, 0);
    assert.equal(json.build_list[0].build_conditions[1][0].priority, 0);
  });
});

describe("applyAiMods - unset", () => {
  it("deletes a field narrowed by refId/refValue", () => {
    const json = buildJson([
      { to_build: "Mex", task_type: "AreaBuild", priority: 261 },
      { to_build: "Mex", task_type: "Something", priority: 262 },
    ]);
    applyAiMods(json, [
      {
        op: "unset",
        toBuild: "Mex",
        idToMod: "task_type",
        refId: "task_type",
        refValue: "AreaBuild",
      },
    ]);
    assert.equal("task_type" in json.build_list[0], false);
    assert.equal(json.build_list[0].priority, 261);
    assert.equal(json.build_list[1].task_type, "Something");
  });

  it("with matchAll deletes the field from every build_conditions test", () => {
    const json = buildJson([
      {
        to_build: "Bot",
        build_conditions: [
          [{ test_type: "A", boolean: true }],
          [{ test_type: "B", boolean: false }],
        ],
      },
    ]);
    applyAiMods(json, [
      {
        op: "unset",
        toBuild: "Bot",
        idToMod: "boolean",
        matchAll: true,
      },
    ]);
    assert.deepEqual(json.build_list[0].build_conditions, [
      [{ test_type: "A" }],
      [{ test_type: "B" }],
    ]);
  });
});

describe("applyAiMods - remove", () => {
  it("removes matching entries from build_conditions", () => {
    const json = buildJson([
      {
        to_build: "Bot",
        build_conditions: [[{ test_type: "AloneOnPlanet", boolean: false }]],
      },
    ]);
    applyAiMods(json, [
      {
        op: "remove",
        toBuild: "Bot",
        value: { test_type: "AloneOnPlanet", boolean: false },
      },
    ]);
    assert.deepEqual(json.build_list[0].build_conditions, [[]]);
  });
});

describe("applyAiMods - new", () => {
  it("without idToMod, pushes a new build_conditions group", () => {
    const json = buildJson([{ to_build: "Bot", build_conditions: [] }]);
    applyAiMods(json, [
      { op: "new", toBuild: "Bot", value: [{ test_type: "NewTest" }] },
    ]);
    assert.deepEqual(json.build_list[0].build_conditions, [
      [{ test_type: "NewTest" }],
    ]);
  });

  it("with idToMod, pushes into every existing build_conditions group", () => {
    const json = buildJson([
      { to_build: "Bot", build_conditions: [[{ test_type: "Existing" }]] },
    ]);
    applyAiMods(json, [
      {
        op: "new",
        toBuild: "Bot",
        idToMod: true,
        value: { test_type: "Extra" },
      },
    ]);
    assert.deepEqual(json.build_list[0].build_conditions, [
      [{ test_type: "Existing" }, { test_type: "Extra" }],
    ]);
  });
});

describe("applyAiMods - squad", () => {
  it("pushes a unit onto a platoon template", () => {
    const json = { platoon_templates: { Squad1: { units: ["Bot"] } } };
    applyAiMods(json, [{ op: "squad", toBuild: "Squad1", value: "Tank" }]);
    assert.deepEqual(json.platoon_templates.Squad1.units, ["Bot", "Tank"]);
  });

  it("is a no-op when the template does not exist", () => {
    const json = { platoon_templates: {} };
    assert.doesNotThrow(() => {
      applyAiMods(json, [{ op: "squad", toBuild: "Missing", value: "Tank" }]);
    });
  });
});

describe("applyAiMods - invalid input", () => {
  it("logs and skips an unknown op without throwing or blocking later mods", () => {
    const errorMock = mock.method(console, "error", () => {});
    const json = buildJson([{ to_build: "Bot", priority: 1 }]);
    applyAiMods(json, [
      { op: "not_a_real_op", toBuild: "Bot", idToMod: "priority", value: 5 },
      { op: "replace", toBuild: "Bot", idToMod: "priority", value: 42 },
    ]);
    assert.equal(json.build_list[0].priority, 42);
    assert.equal(errorMock.mock.callCount(), 1);
  });

  it("op: load is not handled by applyAiMods (filtered out upstream) and is reported as invalid", () => {
    const errorMock = mock.method(console, "error", () => {});
    const json = buildJson([{ to_build: "Bot", priority: 1 }]);
    applyAiMods(json, [
      { op: "load", type: "fabber", value: "some_file.json" },
    ]);
    assert.equal(json.build_list[0].priority, 1);
    assert.equal(errorMock.mock.callCount(), 1);
  });

  // The whole pass runs inside a deferred callback, so one card's bad descriptor
  // would otherwise hang the battle launch rather than costing its own effect.
  it("logs and skips a descriptor whose op throws, and still applies later mods", () => {
    const errorMock = mock.method(console, "error", () => {});
    // A null build entry throws the moment any build op reads its to_build.
    const json = {
      build_list: [null],
      platoon_templates: { Squad1: { units: [] } },
    };

    assert.doesNotThrow(() => {
      applyAiMods(json, [
        { op: "remove", toBuild: "Bot", value: 1 },
        { op: "squad", toBuild: "Squad1", value: "Tank" },
      ]);
    });

    assert.equal(errorMock.mock.callCount(), 1);
    assert.deepEqual(
      json.platoon_templates.Squad1.units,
      ["Tank"],
      "the descriptor after the throwing one still applied"
    );
  });

  it("does not throw on a new op where the build entry has no build_conditions", () => {
    const json = buildJson([{ to_build: "Bot" }]);
    assert.doesNotThrow(() => {
      applyAiMods(json, [{ op: "new", toBuild: "Bot", value: { a: 1 } }]);
    });
    assert.equal(json.build_list[0].build_conditions, undefined);
  });

  it("does not throw on a squad op where the template has no units array", () => {
    const json = { platoon_templates: { Squad1: {} } };
    assert.doesNotThrow(() => {
      applyAiMods(json, [{ op: "squad", toBuild: "Squad1", value: "Tank" }]);
    });
  });

  it("does not throw on a squad op where the file has no platoon_templates", () => {
    assert.doesNotThrow(() => {
      applyAiMods({}, [{ op: "squad", toBuild: "Squad1", value: "Tank" }]);
    });
  });
});
