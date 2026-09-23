"use strict";

// The card directory listing and the triage every card sweep applies to a card
// that fails to load. A NOT_SHIPPED failure is a base-game dependency CI cannot
// have. Anything else is a real regression, which is why callers get the reason
// back rather than a bare boolean.

const fs = require("node:fs");
const path = require("node:path");
const { REPO_ROOT, loadCouiModule } = require("./amd-loader.js");

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

// -> { card } | { skip: "notShipped" } | { error }, the error being what the
// load threw. A bare catch would also swallow syntax errors and genuine
// breakage, reporting them as skipped with the run still green.
function loadCard(file) {
  try {
    return { card: loadCouiModule(path.join(CARDS_DIR, file)) };
  } catch (e) {
    const skip = classifyLoadFailure(e);
    return skip ? { skip } : { error: e };
  }
}

module.exports = { CARDS_DIR, listCardFiles, loadCard };
