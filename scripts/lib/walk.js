"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { REPO_ROOT } = require("./amd-loader.js");

const DEFAULT_SKIP_DIRS = new Set([".git", "node_modules"]);
// The AI data trees the schema and cross-reference validators sweep. Whatever is
// there is checked, so test/ai_source_files.test.js covers existence.
const AI_DATA_DIRS = ["ai", "ai_penchant", "ai_tech"];

function walkFiles(dir, filter, skipDirs) {
  const skip = skipDirs || DEFAULT_SKIP_DIRS;
  const results = [];

  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (skip.has(entry.name)) {
        continue;
      }
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (filter(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  visit(dir);
  return results;
}

function aiDataFiles() {
  return AI_DATA_DIRS.map((d) => path.join(REPO_ROOT, "pa", d)).flatMap(
    (dir) =>
      fs.existsSync(dir) ? walkFiles(dir, (name) => name.endsWith(".json")) : []
  );
}

module.exports = { aiDataFiles: aiDataFiles, walkFiles: walkFiles };
