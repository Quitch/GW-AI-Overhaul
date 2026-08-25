"use strict";

// The card directory listing and the triage every card sweep applies to a card
// that fails to load. A NOT_SHIPPED failure is a base-game dependency CI cannot
// have; a KNOWN_UNLOADABLE file is engine coupling reviewed in
// known-unloadable-cards.js. Anything else is a real regression, which is why
// callers get the reason back rather than a bare boolean.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("./amd-loader.js");
const { KNOWN_UNLOADABLE_FILES } = require("./known-unloadable-cards.js");

const CARDS_DIR = path.join(
  REPO_ROOT,
  "ui",
  "main",
  "game",
  "galactic_war",
  "cards"
);

function listCardFiles() {
  return fs
    .readdirSync(CARDS_DIR)
    .filter((file) => file.endsWith(".js"))
    .sort();
}

// -> "notShipped" | "knownUnloadable" | undefined
function classifyLoadFailure(error, file) {
  if (error && error.code === "NOT_SHIPPED") {
    return "notShipped";
  }
  if (KNOWN_UNLOADABLE_FILES.has(file)) {
    return "knownUnloadable";
  }
  return undefined;
}

module.exports = { CARDS_DIR, classifyLoadFailure, listCardFiles };
