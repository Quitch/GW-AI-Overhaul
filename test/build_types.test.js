"use strict";

// shared/build_types.js: PA's unit-type expression language, the ES5 twin of
// scripts/lib/build-types.js. The grammar cases mirror
// test/cluster_subcommander_buildable.test.js.

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
