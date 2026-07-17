"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_SKIP_DIRS = new Set([".git", "node_modules"]);

// Recursively lists files under `dir` whose name matches `filter(name)`, skipping
// .git/node_modules (and anything else in skipDirs).
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

module.exports = { walkFiles: walkFiles };
