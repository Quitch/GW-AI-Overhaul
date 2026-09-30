"use strict";

// shared/build_types.js: PA's unit-type expression language, the ES5 twin of
// scripts/lib/build-types.js, whose own grammar cases are in
// test/cluster_subcommander_buildable.test.js. Every matches case here is run
// through both twins; reach, the build reach it gives, has no twin.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const nodeTwin = require("../scripts/lib/build-types.js");

const buildTypes = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js"
);

const CASES = [
  ["Bot & Mobile & Basic - Construction", ["Bot", "Mobile", "Basic"], true],
  [
    "Bot & Mobile & Basic - Construction",
    ["Bot", "Mobile", "Basic", "Construction"],
    false,
  ],
  ["Air | Orbital", ["Orbital"], true],
  ["Air | Orbital", ["Land"], false],
  // A & B - C | D: "-" excludes C from the first alternative only.
  ["Bot & Mobile - Construction | Air", ["Air", "Construction"], true],
  ["Bot & Mobile - Construction | Air", ["Bot", "Mobile"], true],
  [
    "Bot & Mobile - Construction | Air",
    ["Bot", "Mobile", "Construction"],
    false,
  ],
  [
    "(Custom2 & FactoryBuild & Basic & Bot & Heavy) - Mobile",
    ["Custom2", "FactoryBuild", "Basic", "Bot", "Heavy"],
    true,
  ],
  [
    "(Custom2 & FactoryBuild & Basic & Bot & Heavy) - Mobile",
    ["Custom2", "FactoryBuild", "Basic", "Bot", "Heavy", "Mobile"],
    false,
  ],
  ["CmdBuild & Custom1", ["CmdBuild", "Custom1"], true],
  [
    "Custom1 & ( Bot & Mobile & Basic & FactoryBuild )",
    ["Custom1", "Bot", "Mobile", "Basic", "FactoryBuild"],
    true,
  ],
  ["Land - (Commander | Scout)", ["Land", "Scout"], false],
  ["Land - (Commander | Scout)", ["Land", "Tank"], true],
  ["Air & (Scout | (SelfDestruct & Custom1)", ["Air", "Scout"], true],
  ["NoSuchTag", ["Bot"], false],
  ["", ["Bot"], false],
  [undefined, ["Bot"], false],
];

describe("build_types.matches", () => {
  it("evaluates |, & and - with parentheses, left to right", () => {
    for (const [expression, tags, expected] of CASES) {
      assert.equal(
        buildTypes.matches(expression, tags),
        expected,
        expression + " over " + tags.join(",")
      );
    }
  });

  it("agrees with the Node twin on every case", () => {
    for (const [expression, tags] of CASES) {
      assert.equal(
        buildTypes.matches(expression, tags),
        nodeTwin.matches(expression, tags),
        String(expression)
      );
    }
  });
});

describe("build_types.reach", () => {
  const TAGS = {
    commander: ["Commander", "Land"],
    factory: ["Factory", "Bot", "Basic"],
    dox: ["Bot", "Mobile", "Basic"],
    advancedFactory: ["Factory", "Bot", "Advanced"],
    slammer: ["Bot", "Mobile", "Advanced"],
    untagged: undefined,
  };
  const BUILDS = {
    commander: "Factory & Basic",
    factory: "(Bot & Mobile & Basic) | (Factory & Advanced)",
    advancedFactory: "Bot & Mobile & Advanced",
  };
  const tagsOf = (unit) => TAGS[unit];
  const buildableOf = (unit) => BUILDS[unit];
  const reached = (builders, candidates) =>
    Object.keys(
      buildTypes.reach(builders, candidates, buildableOf, tagsOf)
    ).sort();

  it("reaches what the builders build, and what that builds in turn", () => {
    assert.deepEqual(reached(["commander"], Object.keys(TAGS)), [
      "advancedFactory",
      "dox",
      "factory",
      "slammer",
    ]);
  });

  it("reaches only among the candidates", () => {
    assert.deepEqual(reached(["commander"], ["factory", "slammer"]), [
      "factory",
    ]);
  });

  // The commander itself is not in the result: nothing here builds it.
  it("leaves out a builder that nothing builds", () => {
    assert.deepEqual(reached(["factory"], ["factory", "dox"]), ["dox"]);
  });

  it("never reaches a candidate with no tags, nor from a builder with no list", () => {
    assert.deepEqual(reached(["commander"], ["untagged"]), []);
    assert.deepEqual(reached(["dox"], Object.keys(TAGS)), []);
  });

  it("evaluates each distinct build list once", () => {
    const asked = [];
    buildTypes.reach(
      ["factory", "factory", "commander"],
      ["dox", "slammer"],
      buildableOf,
      (unit) => {
        asked.push(unit);
        return TAGS[unit];
      }
    );
    // The factory's list asks after both, once; the commander's only after
    // the Slammer, which is not reached yet.
    assert.deepEqual(asked, ["dox", "slammer", "slammer"]);
  });
});
