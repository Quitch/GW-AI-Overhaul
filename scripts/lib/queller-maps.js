"use strict";

const util = require("node:util");
const { codeUnitCompare } = require("./loc-keys.js");

const TIERS = ["q_bronze", "q_silver", "q_uber"];

function shadowRel(tier) {
  return "pa/ai_queller/" + tier + "/unit_maps/ai_unit_map.json";
}

function baseRels(tier) {
  const dir = "pa_ex1/ai_queller/" + tier + "/unit_maps/";
  return { map: dir + "ai_unit_map.json", mla: dir + "mla.json" };
}

function expectedShadow(base, mla) {
  const problems = [];
  const baseMap = base.unit_map || {};
  const mlaMap = mla.unit_map || {};
  for (const key of Object.keys(mla)) {
    if (key !== "unit_map") {
      problems.push("mla.json has a key besides unit_map: " + key);
    }
  }
  for (const key of Object.keys(mlaMap).sort(codeUnitCompare)) {
    if (Object.hasOwn(baseMap, key)) {
      problems.push("mla.json entry also in the base map: unit_map." + key);
    }
  }
  const expected = Object.assign({}, base, {
    unit_map: Object.assign({}, baseMap, mlaMap),
  });
  return { expected, problems };
}

function diffObjects(prefix, expected, actual) {
  const problems = [];
  const keys = new Set(Object.keys(expected).concat(Object.keys(actual)));
  for (const key of [...keys].sort(codeUnitCompare)) {
    const name = prefix + key;
    if (!Object.hasOwn(actual, key)) {
      problems.push("missing key: " + name);
    } else if (!Object.hasOwn(expected, key)) {
      problems.push("extra key: " + name);
    } else if (!util.isDeepStrictEqual(actual[key], expected[key])) {
      const both = [expected[key], actual[key]];
      if (both.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
        problems.push(...diffObjects(name + ".", expected[key], actual[key]));
      } else {
        problems.push(
          "value differs: " +
            name +
            " (expected " +
            JSON.stringify(expected[key]) +
            ", found " +
            JSON.stringify(actual[key]) +
            ")"
        );
      }
    }
  }
  return problems;
}

function checkShadow(base, mla, shadow) {
  const { expected, problems } = expectedShadow(base, mla);
  return problems.concat(diffObjects("", expected, shadow));
}

module.exports = {
  TIERS,
  shadowRel,
  baseRels,
  expectedShadow,
  diffObjects,
  checkShadow,
};
