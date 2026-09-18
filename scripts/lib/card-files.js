"use strict";

// The card directory listing and the triage every card sweep applies to a card
// that fails to load. A NOT_SHIPPED failure is a base-game dependency CI cannot
// have. Anything else is a real regression, which is why callers get the reason
// back rather than a bare boolean.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT } = require("./amd-loader.js");

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

// -> "notShipped" | undefined
function classifyLoadFailure(error) {
  if (error && error.code === "NOT_SHIPPED") {
    return "notShipped";
  }
  return undefined;
}

module.exports = { CARDS_DIR, classifyLoadFailure, listCardFiles };
