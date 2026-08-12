"use strict";

// modinfo.json's `scenes` block is the mod's real entry-point list, and a stale
// entry fails silently in-game. See architecture.md.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../lib/amd-loader.js");
const { UI_SCHEME } = require("../lib/scheme.js");

const MODINFO_PATH = path.join(REPO_ROOT, "modinfo.json");
const REQUIRED_TOP_LEVEL_FIELDS = [
  "identifier",
  "display_name",
  "version",
  "scenes",
];

function validateScene(sceneName, files, failures) {
  if (!Array.isArray(files)) {
    failures.push("scene `" + sceneName + "` is not an array");
    return 0;
  }

  for (const entry of files) {
    if (!entry.startsWith(UI_SCHEME)) {
      failures.push(
        "scene `" +
          sceneName +
          "` entry is not a " +
          UI_SCHEME +
          " path: " +
          entry
      );
      continue;
    }
    const fsPath = path.join(REPO_ROOT, entry.slice(UI_SCHEME.length));
    if (!fs.existsSync(fsPath)) {
      failures.push(
        "scene `" +
          sceneName +
          "` references a file that does not exist: " +
          entry
      );
    }
  }

  return files.length;
}

function main() {
  const failures = [];
  let modinfo;

  try {
    modinfo = JSON.parse(fs.readFileSync(MODINFO_PATH, "utf8"));
  } catch (e) {
    console.error("manifest: modinfo.json failed to parse: " + e.message);
    process.exitCode = 1;
    return;
  }

  for (const field of REQUIRED_TOP_LEVEL_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(modinfo, field)) {
      failures.push(
        "modinfo.json missing required top-level field `" + field + "`"
      );
    }
  }

  const scenes = modinfo.scenes || {};
  let fileCount = 0;

  for (const [sceneName, files] of Object.entries(scenes)) {
    fileCount += validateScene(sceneName, files, failures);
  }

  console.log(
    "manifest: " +
      Object.keys(scenes).length +
      " scenes / " +
      fileCount +
      " files checked, " +
      failures.length +
      " problems."
  );

  if (failures.length) {
    console.error("");
    failures.forEach((f) => console.error("  - " + f));
    process.exitCode = 1;
  }
}

main();
