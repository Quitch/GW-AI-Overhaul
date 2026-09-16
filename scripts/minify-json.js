#!/usr/bin/env node

"use strict";

var fs = require("node:fs");
var path = require("node:path");
var walkFiles = require("./lib/walk.js").walkFiles;

var targetDir = process.argv[2];

if (!targetDir) {
  console.error("Usage: node minify-json.js <directory>");
  process.exit(1);
}

targetDir = path.resolve(targetDir);

// Rewrites in place, so it must never be pointed at a directory holding JSON that
// is not ours - package.json, the lockfile, anything under .git.
var SKIP_DIRS = new Set([".git", "node_modules", "coverage"]);

function isJson(name) {
  return name.toLowerCase().endsWith(".json");
}

walkFiles(targetDir, isJson, SKIP_DIRS).forEach(function (fullPath) {
  try {
    var contents = fs.readFileSync(fullPath, "utf8");
    var parsed = JSON.parse(contents);

    fs.writeFileSync(fullPath, JSON.stringify(parsed), "utf8");

    console.log("Minified:", fullPath);
  } catch (err) {
    console.warn("Skipped (invalid JSON):", fullPath);
    console.error(err);
    // Exiting 0 here made a corrupt data file look like a clean run.
    process.exitCode = 1;
  }
});

console.log("Done.");
