"use strict";

// Every .json file in the repo must parse. Cheap, and catches the class of bug that
// silently breaks the game with no error until something tries to load that exact
// file in-game (a trailing comma, an unescaped quote in a hand-edited build list, etc).

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
    "json-valid: " + files.length + " JSON files checked, " + failures.length + " invalid."
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
