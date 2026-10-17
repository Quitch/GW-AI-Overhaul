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
  checkEqual,
} = require("./lib/queller-maps.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const MEDIA = mediaDir();
const READ_TIER = "q_uber";

function readJson(root, rel) {
  const file = path.join(root, rel);
  try {
    return { json: JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (error) {
    return { error: "cannot read " + file + ": " + error.message };
  }
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

function loadAll() {
  const files = {};
  const errors = [];
  for (const tier of TIERS) {
    const rels = Object.assign({ shadow: shadowRel(tier) }, baseRels(tier));
    files[tier] = {};
    for (const [kind, rel] of Object.entries(rels)) {
      const read = readJson(kind === "shadow" ? REPO_ROOT : MEDIA, rel);
      if (read.error) {
        errors.push(read.error);
      }
      files[tier][kind] = { rel, json: read.json };
    }
  }
  return { files, errors };
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

  const { files, errors } = loadAll();
  if (errors.length) {
    for (const error of errors) {
      console.error(error);
    }
    process.exitCode = 1;
    return;
  }

  let ok = true;
  for (const tier of TIERS) {
    const { shadow, map, mla } = files[tier];
    ok =
      report(
        shadow.rel + " against " + map.rel + " + " + mla.rel,
        checkShadow(map.json, mla.json, shadow.json, {
          base: map.rel,
          mla: mla.rel,
          shadow: shadow.rel,
        }),
        Object.keys((shadow.json && shadow.json.unit_map) || {}).length +
          " entries match the merge exactly"
      ) && ok;
  }

  const read = files[READ_TIER];
  for (const tier of TIERS.filter((name) => name !== READ_TIER)) {
    for (const kind of ["shadow", "map", "x1"]) {
      const file = files[tier][kind];
      ok =
        report(
          file.rel + " against " + read[kind].rel,
          checkEqual(read[kind].rel, read[kind].json, file.rel, file.json),
          "identical"
        ) && ok;
    }
  }

  if (!ok) {
    process.exitCode = 1;
  }
}

main();
