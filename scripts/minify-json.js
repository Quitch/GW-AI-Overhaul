#!/usr/bin/env node

"use strict";

var fs = require("node:fs");
var path = require("node:path");

var targetDir = process.argv[2];

if (!targetDir) {
  console.error("Usage: node minify-json.js <directory>");
  process.exit(1);
}

targetDir = path.resolve(targetDir);

// Rewrites in place, so it must never be pointed at a directory holding JSON that
// is not ours - package.json, the lockfile, anything under .git.
var SKIP_DIRS = [".git", "node_modules", "coverage"];

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(function (entry) {
    var fullPath = path.join(dir, entry);
    var stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (SKIP_DIRS.indexOf(entry) === -1) {
        processDirectory(fullPath);
      }
      return;
    }

    if (path.extname(entry).toLowerCase() !== ".json") {
      return;
    }

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
}

processDirectory(targetDir);

console.log("Done.");
