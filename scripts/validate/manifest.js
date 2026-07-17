"use strict";

// modinfo.json's `scenes` block is the mod's real entry-point list: the game loads
// exactly the coui:// files listed there for each scene, nothing else. A renamed or
// deleted file that's still referenced here fails silently in-game (that scene just
// doesn't get the intended behavior) with no error a contributor would see locally.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("../lib/amd-loader.js");

const MODINFO_PATH = path.join(REPO_ROOT, "modinfo.json");
const REQUIRED_TOP_LEVEL_FIELDS = ["identifier", "display_name", "version", "scenes"];
const COUI_PREFIX = "coui://";

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
      failures.push("modinfo.json missing required top-level field `" + field + "`");
    }
  }

  const scenes = modinfo.scenes || {};
  let fileCount = 0;

  for (const [sceneName, files] of Object.entries(scenes)) {
    if (!Array.isArray(files)) {
      failures.push("scene `" + sceneName + "` is not an array");
      continue;
    }

    for (const entry of files) {
      fileCount++;
      if (!entry.startsWith(COUI_PREFIX)) {
        failures.push(
          "scene `" + sceneName + "` entry is not a coui:// path: " + entry
        );
        continue;
      }
      const fsPath = path.join(REPO_ROOT, entry.slice(COUI_PREFIX.length));
      if (!fs.existsSync(fsPath)) {
        failures.push(
          "scene `" +
            sceneName +
            "` references a file that does not exist: " +
            entry
        );
      }
    }
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
