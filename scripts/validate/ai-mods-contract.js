"use strict";

// Validates every AI-mod descriptor a card's buff()/dull() passes to
// inventory.addAIMods(...) against the contract referee_ai.js's applyAiMods()
// actually implements (see gw_play/referee_ai.js's `ops` table and `managerPath()`).
// AI-mod descriptors only exist as objects built by JS at runtime (there's no static
// JSON form of them), so checking their shape means actually calling buff()/dull()
// - against a mock inventory whose only real behavior is capturing addAIMods calls;
// every other method/property is auto-stubbed (scripts/lib/auto-stub.js) so this
// doesn't need to hand-mock every inventory method every card happens to touch.
//
// Empirically confirmed against every card that currently authors AI mods:
//   - Every descriptor has `type` (fabber/factory/platoon/template - see
//     managerPath() in referee_ai.js) and `op`.
//   - op: "load" descriptors carry only `value` (a build-file filename); no `toBuild`.
//   - All other ops carry `value` and `toBuild`; append/prepend/replace also require
//     `idToMod` (referee_ai.js checks `hasOwnProperty(build, idToMod)`, so an absent
//     idToMod silently turns the mod into a no-op rather than erroring - exactly the
//     class of bug this check exists to catch).

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../lib/amd-loader.js");
const { createAutoStub } = require("../lib/auto-stub.js");

const CARDS_DIR = path.join(
  REPO_ROOT,
  "ui",
  "main",
  "game",
  "galactic_war",
  "cards"
);

const VALID_TYPES = new Set(["fabber", "factory", "platoon", "template"]);
// op -> extra fields required beyond `type` + `op` (mirrors referee_ai.js exactly).
const REQUIRED_FIELDS_BY_OP = {
  load: ["value"],
  append: ["value", "toBuild", "idToMod"],
  prepend: ["value", "toBuild", "idToMod"],
  replace: ["value", "toBuild", "idToMod"],
  remove: ["value", "toBuild"],
  new: ["value", "toBuild"],
  squad: ["value", "toBuild"],
};

function collectAiMods(card) {
  const captured = [];
  const inventory = new Proxy(
    {
      addAIMods: function (mods) {
        captured.push.apply(captured, mods || []);
        return createAutoStub();
      },
    },
    {
      get(target, prop) {
        return prop in target ? target[prop] : createAutoStub();
      },
    }
  );

  for (const method of ["buff", "dull"]) {
    if (typeof card[method] !== "function") {
      continue;
    }
    try {
      card[method](inventory);
    } catch (e) {
      throw new Error(
        method + "() threw against the mock inventory: " + e.message,
        {
          cause: e,
        }
      );
    }
  }

  return captured;
}

function checkMod(mod, index) {
  const problems = [];
  const where = "mod[" + index + "] (op=" + mod.op + ")";

  if (!Object.prototype.hasOwnProperty.call(mod, "type")) {
    problems.push(where + ": missing `type`");
  } else if (!VALID_TYPES.has(mod.type)) {
    problems.push(
      where +
        ': invalid `type` "' +
        mod.type +
        '" (expected one of: ' +
        [...VALID_TYPES].join(", ") +
        ")"
    );
  }

  const requiredFields = REQUIRED_FIELDS_BY_OP[mod.op];
  if (!requiredFields) {
    problems.push(
      where +
        ': invalid `op` "' +
        mod.op +
        '" (expected one of: ' +
        Object.keys(REQUIRED_FIELDS_BY_OP).join(", ") +
        ")"
    );
  } else {
    for (const field of requiredFields) {
      if (
        !Object.prototype.hasOwnProperty.call(mod, field) ||
        mod[field] === undefined
      ) {
        problems.push(where + ': op "' + mod.op + '" requires `' + field + "`");
      }
    }
  }

  return problems;
}

function main() {
  const files = fs
    .readdirSync(CARDS_DIR)
    .filter((f) => f.endsWith(".js"))
    .sort();

  let cardsChecked = 0;
  let modsChecked = 0;
  let excluded = 0;
  const failures = [];

  for (const file of files) {
    let card;
    try {
      card = loadCouiModule(path.join(CARDS_DIR, file));
    } catch {
      excluded++; // same shim coverage boundary as validate/cards-contract.js
      continue;
    }

    let mods;
    try {
      mods = collectAiMods(card);
    } catch (e) {
      failures.push({ file, problems: [e.message] });
      continue;
    }

    if (!mods.length) {
      continue;
    }

    cardsChecked++;
    const problems = mods.flatMap((mod, i) => checkMod(mod, i));
    modsChecked += mods.length;
    if (problems.length) {
      failures.push({ file, problems });
    }
  }

  console.log(
    "ai-mods-contract: " +
      cardsChecked +
      " cards / " +
      modsChecked +
      " AI-mod descriptors checked, " +
      excluded +
      " cards excluded (unloadable via shim), " +
      failures.length +
      " cards failed."
  );

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
