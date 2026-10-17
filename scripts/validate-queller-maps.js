"use strict";

// Checks GWO's three Queller unit-map shadows against the PA install.
// Local-only: CI has no install. See testing.md, "The validators".

const fs = require("node:fs");
const path = require("node:path");
const { mediaDir } = require("./lib/pa-install.js");
const {
  TIERS,
  shadowRel,
  baseRels,
  checkShadow,
  diffObjects,
} = require("./lib/queller-maps.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const MEDIA = mediaDir();
const READ_TIER = "q_uber";

function readJson(root, rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function report(label, problems, success) {
  if (problems.length) {
    console.error(label + ":");
    for (const problem of problems) {
      console.error("  " + problem);
    }
    return false;
  }
  console.log(label + ": " + success);
  return true;
}

function main() {
  const missing = TIERS.flatMap((tier) => Object.values(baseRels(tier))).filter(
    (rel) => !fs.existsSync(path.join(MEDIA, rel))
  );
  if (missing.length) {
    console.error(
      "PA install not found at " +
        MEDIA +
        " (set PA_MEDIA). Missing: " +
        missing.join(", ")
    );
    process.exitCode = 1;
    return;
  }

  let ok = true;
  const shadows = {};
  for (const tier of TIERS) {
    const rels = baseRels(tier);
    shadows[tier] = readJson(REPO_ROOT, shadowRel(tier));
    const problems = checkShadow(
      readJson(MEDIA, rels.map),
      readJson(MEDIA, rels.mla),
      shadows[tier]
    );
    ok =
      report(
        shadowRel(tier) + " against " + rels.map + " + " + rels.mla,
        problems,
        Object.keys(shadows[tier].unit_map || {}).length +
          " entries match the merge exactly"
      ) && ok;
  }

  for (const tier of TIERS.filter((name) => name !== READ_TIER)) {
    ok =
      report(
        shadowRel(tier) + " against " + shadowRel(READ_TIER),
        diffObjects("", shadows[READ_TIER], shadows[tier]),
        "identical"
      ) && ok;
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

main();
