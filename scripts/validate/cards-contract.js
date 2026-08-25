"use strict";

// Validates every tech card against the contract in tech-cards.md. Checks only the
// shape of what define() returns, never calling deal/buff/dull.
//
// keep/discard are on no card today, but gw_inventory.js still calls them when
// present, so one may reintroduce them.

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule } = require("../lib/amd-loader.js");
const { CARDS_DIR } = require("../lib/card-probe.js");
const { KNOWN_UNLOADABLE } = require("../lib/known-unloadable-cards.js");
const { reportFailures } = require("../lib/report-failures.js");

const REQUIRED_FIELDS = [
  "visible",
  "describe",
  "summarize",
  "icon",
  "deal",
  "buff",
  "dull",
];
const OPTIONAL_FIELDS = ["audio", "getContext", "keep", "discard"];
const KNOWN_FIELDS = new Set(REQUIRED_FIELDS.concat(OPTIONAL_FIELDS));

// Coverage floor. NOT_SHIPPED is swallowed generically below, so one broken
// dependency can demote every card requiring it from checked to excluded with CI
// still green. Raise this when coverage genuinely rises; never lower it to pass.
const MIN_CHECKED = 175;

function checkShape(file, card) {
  const problems = [];

  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(card, field)) {
      problems.push("missing required field `" + field + "`");
    } else if (typeof card[field] !== "function") {
      problems.push(
        "`" + field + "` must be a function, got " + typeof card[field]
      );
    }
  }

  for (const field of OPTIONAL_FIELDS) {
    if (
      Object.prototype.hasOwnProperty.call(card, field) &&
      typeof card[field] !== "function"
    ) {
      problems.push(
        "`" + field + "` must be a function, got " + typeof card[field]
      );
    }
  }

  for (const field of Object.keys(card)) {
    if (!KNOWN_FIELDS.has(field)) {
      problems.push(
        "unexpected field `" +
          field +
          "` - typo of a known field, or a genuinely new one that " +
          "REQUIRED_FIELDS/OPTIONAL_FIELDS in this script needs to learn about"
      );
    }
  }

  return problems;
}

// Discriminates on the reason: a bare catch also swallows syntax errors and
// genuine breakage, reporting them as excluded with the run still green. The two
// skip reasons stay distinct because the summary counts them separately.
function loadCard(file) {
  try {
    return { card: loadCouiModule(path.join(CARDS_DIR, file)) };
  } catch (e) {
    if (e.code === "NOT_SHIPPED") {
      return { skip: "notShipped" };
    }
    if (Object.prototype.hasOwnProperty.call(KNOWN_UNLOADABLE, file)) {
      return { skip: "knownUnloadable" };
    }
    return { error: "failed to load: " + e.message };
  }
}

function main() {
  const files = fs
    .readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort();

  let checked = 0;
  const skipped = { notShipped: 0, knownUnloadable: 0 };
  const failures = [];

  for (const file of files) {
    const loaded = loadCard(file);
    if (loaded.skip) {
      skipped[loaded.skip]++;
      continue;
    }
    if (loaded.error) {
      failures.push({ file, problems: [loaded.error] });
      continue;
    }

    checked++;
    const problems = checkShape(file, loaded.card);
    if (problems.length) {
      failures.push({ file, problems });
    }
  }

  console.log(
    "cards-contract: " +
      checked +
      " cards shape-checked, " +
      skipped.notShipped +
      " excluded (base-game dependency unavailable outside the game), " +
      skipped.knownUnloadable +
      " excluded (known engine coupling), " +
      failures.length +
      " failed."
  );

  if (checked < MIN_CHECKED) {
    console.error(
      "cards-contract: coverage dropped - " +
        checked +
        " cards shape-checked, expected at least " +
        MIN_CHECKED +
        ". A card that stopped loading is now silently excluded rather than checked."
    );
    process.exitCode = 1;
  }

  reportFailures(failures);
}

main();
