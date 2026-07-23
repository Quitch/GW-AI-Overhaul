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

function processDirectory(dir) {
  fs.readdirSync(dir).forEach(function (entry) {
    var fullPath = path.join(dir, entry);
    var stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
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
    }
  });
}

processDirectory(targetDir);

console.log("Done.");
