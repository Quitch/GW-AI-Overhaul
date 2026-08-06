"use strict";

// Validates every AI-mod descriptor a card's buff()/dull() passes to addAIMods
// against what referee_ai.js's applyAiMods implements. Descriptors exist only as
// runtime objects, so checking them means calling buff()/dull() for real.
//
// The contract, confirmed against every card that authors AI mods:
//   - Every descriptor has `type` and `op`.
//   - op "load" carries only `value`, a build-file filename.
//   - Every other op carries `value` and `toBuild`; append/prepend/replace also
//     need `idToMod`, whose absence silently makes the mod a no-op.

const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../lib/amd-loader.js");
const { createAutoStub } = require("../lib/auto-stub.js");
const { KNOWN_UNLOADABLE } = require("../lib/known-unloadable-cards.js");

const CARDS_DIR = path.join(
  REPO_ROOT,
  "ui",
  "main",
  "game",
  "galactic_war",
  "cards"
);

const VALID_TYPES = new Set(["fabber", "factory", "platoon", "template"]);
const BUILD_LIST_TYPES = new Set(["fabber", "factory", "platoon"]);
// Mirrors referee_ai.js's own required-field checks exactly.
const REQUIRED_FIELDS_BY_OP = {
  load: ["value"],
  append: ["value", "toBuild", "idToMod"],
  prepend: ["value", "toBuild", "idToMod"],
  replace: ["value", "toBuild", "idToMod"],
  remove: ["value", "toBuild"],
  new: ["value", "toBuild"],
  squad: ["value", "toBuild"],
};

// Which `type` each op can legally target. A mismatched pair passes the field
// shape check and then throws at runtime. `load` routes through managerPath()
// instead of the ops table, and accepts every type.
const VALID_TYPES_BY_OP = {
  load: VALID_TYPES,
  append: BUILD_LIST_TYPES,
  prepend: BUILD_LIST_TYPES,
  replace: BUILD_LIST_TYPES,
  remove: BUILD_LIST_TYPES,
  new: BUILD_LIST_TYPES,
  squad: new Set(["template"]),
};

function collectAiMods(card) {
  const captured = [];
  const inventory = new Proxy(
    {
      addAIMods: function (mods) {
        // addAIMods concats, so it takes a bare descriptor as readily as an
        // array. push.apply on a non-array captures nothing.
        if (Array.isArray(mods)) {
          captured.push.apply(captured, mods);
        } else if (mods) {
          captured.push(mods);
        }
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

    const allowedTypes = VALID_TYPES_BY_OP[mod.op];
    if (VALID_TYPES.has(mod.type) && !allowedTypes.has(mod.type)) {
      problems.push(
        where +
          ': op "' +
          mod.op +
          '" cannot target type "' +
          mod.type +
          '" (expected one of: ' +
          [...allowedTypes].join(", ") +
          ")"
      );
    }
  }

  return problems;
}

// Discriminates on the reason: a bare catch also swallows syntax errors and
// genuine breakage, reporting them as "excluded" with the run still green.
function loadCard(file) {
  try {
    return { card: loadCouiModule(path.join(CARDS_DIR, file)) };
  } catch (e) {
    if (
      e.code === "NOT_SHIPPED" ||
      Object.prototype.hasOwnProperty.call(KNOWN_UNLOADABLE, file)
    ) {
      return { excluded: true };
    }
    return { error: "failed to load: " + e.message };
  }
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
    const loaded = loadCard(file);
    if (loaded.excluded) {
      excluded++;
      continue;
    }
    if (loaded.error) {
      failures.push({ file, problems: [loaded.error] });
      continue;
    }
    const card = loaded.card;

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
