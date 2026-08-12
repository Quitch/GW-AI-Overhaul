"use strict";

// Every .json in the repo must parse. Cheap, and the failure it catches is
// otherwise silent until something loads that exact file in-game.

const fs = require("node:fs");
const { REPO_ROOT } = require("../lib/amd-loader.js");
const { walkFiles } = require("../lib/walk.js");

function main() {
  const files = walkFiles(REPO_ROOT, (name) => name.endsWith(".json"));
  const failures = [];

  for (const file of files) {
    try {
      JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (e) {
      failures.push({ file, error: e.message });
    }
  }

  console.log(
    "json-valid: " +
      files.length +
      " JSON files checked, " +
      failures.length +
      " invalid.",
  );

  if (failures.length) {
    console.error("");
    for (const failure of failures) {
      console.error(failure.file + ": " + failure.error);
    }
    process.exitCode = 1;
  }
}

main();
