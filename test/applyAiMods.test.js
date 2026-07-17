"use strict";

// Unit tests for referee_ai.js's applyAiMods, the engine that applies AI-mod
// descriptors (the same shape validated by scripts/validate/ai-mods-contract.js) to
// a build-order JSON's build_list/platoon_templates. Reached via the test-only export
// hook at the bottom of referee_ai.js's define() factory (see that file for why) -
// requireShippedModule() (not loadCouiModule()) is what surfaces it, since define()
// itself never returns applyAiMods to the game.

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
  // Unlike append (`build[idToMod].concat(value)`, array-first), prepend does
  // `value.concat(build[idToMod])` - value-first. A single new element must be given
  // as an array to get array semantics; a bare scalar dispatches to
  // String.prototype.concat instead (see the next test). No shipped card currently
  // uses op: "prepend", so this asymmetry with append has never been exercised.
  it("concatenates in front of an existing array field, given an array value", () => {
    const json = buildJson([{ to_build: "Bot", builders: ["B"] }]);
    applyAiMods(json, [
      { op: "prepend", toBuild: "Bot", idToMod: "builders", value: ["A"] },
    ]);
    assert.deepEqual(json.build_list[0].builders, ["A", "B"]);
  });

  it("with a bare scalar value, string-concatenates instead of prepending an array element", () => {
    const json = buildJson([{ to_build: "Bot", builders: ["B"] }]);
    applyAiMods(json, [
      { op: "prepend", toBuild: "Bot", idToMod: "builders", value: "A" },
    ]);
    assert.equal(json.build_list[0].builders, "AB");
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
});
