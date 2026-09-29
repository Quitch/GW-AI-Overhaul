"use strict";

// Runs a shipped scene script, a self-invoking file with no define(), against
// the globals the test has stubbed, for glue the AMD harness cannot load. It
// runs in this context, so it reads exactly what global-stubs.js set. See
// testing.md, "Scene scripts".

const fs = require("node:fs");
const vm = require("node:vm");
const { couiToFsPath, installGlobals } = require("./amd-loader.js");

function runSceneScript(entry) {
  installGlobals();
  const fsPath = couiToFsPath(entry);
  if (!fsPath || !fs.existsSync(fsPath)) {
    throw new Error("scene-script: no shipped file at " + entry);
  }
  vm.runInThisContext(fs.readFileSync(fsPath, "utf8"), { filename: fsPath });
}

module.exports = { runSceneScript };
