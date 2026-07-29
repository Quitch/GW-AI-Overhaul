"use strict";

// Structurally validates every Galactic War tech card against the fixed contract
// documented in this repo's CLAUDE.md: each card must export a well-known set of
// functions. Loads every card through the AMD shim (scripts/lib/amd-loader.js) and
// checks the shape of what define() returns - it does not call deal/buff/dull/etc,
// so it catches "wrong export shape" bugs (typos, missing/renamed fields, wrong
// type), not runtime logic bugs.
//
// Empirically tallied across all 237 cards - 175 of which load and are shape-checked
// here, 61 excluded as NOT_SHIPPED and 1 as KNOWN_UNLOADABLE (see amd-loader.js's
// NOT_SHIPPED note for why not all of them can load here). Cards get added over time,
// so treat these numbers as a snapshot: the run prints the live tally, and that - not
// this comment - is the source of truth. MIN_CHECKED below is the enforced floor.
//   - visible/describe/summarize/icon/deal/buff/dull: function, on every loadable card.
//   - audio/getContext: function, on every loadable card except gwaio_enable_bot_aa.js
//     (explicitly kept for save-compatibility with GWO v5.9.0 and earlier).
// No card carries keep/discard any more; both were dropped in the minion and card-slot
// redesigns. gw_inventory.js still calls them when present, so a card is free to
// reintroduce one - but they are not part of the shape this check expects to see.

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../lib/amd-loader.js");

const CARDS_DIR = path.join(
  REPO_ROOT,
  "ui",
  "main",
  "game",
  "galactic_war",
  "cards"
);

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

// Cards this file's contract check is known not to cover, and why. NOT_SHIPPED
// failures (a card transitively needs a base-game module GWO doesn't ship, so this
// repo/CI - with no access to the Steam install - can't resolve it) don't need an
// entry here; the loader already identifies those precisely and they're tolerated
// generically below. Only non-NOT_SHIPPED failures need a reviewed, named entry -
// anything else that fails to load is treated as a real regression.
// Floor on how many cards this check actually covers. NOT_SHIPPED is swallowed
// generically above, so a mod-shipped dependency breaking demotes every card that
// requires it from "checked" to "excluded" with CI still green - coverage can shrink
// silently and has (178 -> 175). Raise this when the checked count genuinely rises;
// never lower it to make a run pass.
const MIN_CHECKED = 175;

const KNOWN_UNLOADABLE = {
  "gwc_minion.js":
    "transitively depends on shared/gw_factions.js, which calls " +
    "api.content.usingTitans() directly at define-time (real engine coupling, " +
    "not just a missing file)",
};

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

function main() {
  const files = fs
    .readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort();

  let checked = 0;
  let notShipped = 0;
  let knownUnloadable = 0;
  const failures = [];

  for (const file of files) {
    const fsPath = path.join(CARDS_DIR, file);
    let card;
    try {
      card = loadCouiModule(fsPath);
    } catch (e) {
      if (e.code === "NOT_SHIPPED") {
        notShipped++;
        continue;
      }
      if (Object.prototype.hasOwnProperty.call(KNOWN_UNLOADABLE, file)) {
        knownUnloadable++;
        continue;
      }
      failures.push({
        file,
        problems: ["failed to load: " + e.message],
      });
      continue;
    }

    checked++;
    const problems = checkShape(file, card);
    if (problems.length) {
      failures.push({ file, problems });
    }
  }

  console.log(
    "cards-contract: " +
      checked +
      " cards shape-checked, " +
      notShipped +
      " excluded (base-game dependency unavailable outside the game), " +
      knownUnloadable +
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

  if (failures.length) {
    console.error("");
    for (const failure of failures) {
      console.error(failure.file + ":");
      for (const problem of failure.problems) {
        console.error("  - " + problem);
      }
    }
    process.exitCode = 1;
  }
}

main();
