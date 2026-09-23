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
//   - op "unset" is the exception: it deletes `idToMod` rather than writing it,
//     so it carries `toBuild` and `idToMod` but no `value`.
//   - op "silence" matches on builders rather than `toBuild`, so it carries
//     only `value`: `{ builders, except }`, both arrays of strings.
//   - `treeOnly`, when present, is a boolean on a build-list op. It keeps the
//     descriptor off files a `load` pulled in from /pa/ai_tech/.

const { registerModuleStub } = require("../lib/amd-loader.js");
const { listCardFiles, loadCard } = require("../lib/card-files.js");
const { createAutoStub } = require("../lib/auto-stub.js");
const {
  createCapturingInventory,
  recordInto,
} = require("../lib/capturing-inventory.js");
const { reportFailures } = require("../lib/report-failures.js");
const { GW_COMMON_STUB, installCardHarness } = require("../lib/card-probe.js");

// A loadout card banks itself in buff(), into the base game's bank and GWO's.
// Only the AI mods buff() adds matter here, so both banks take the call and
// keep nothing.
// The cards that add AI mods today. A harness change that silently skipped
// cards would otherwise leave the run green while checking less.
const MIN_CARDS_CHECKED = 24;

const INERT_BANK = {
  addStartCard: () => false,
  hasStartCard: () => false,
};

const VALID_TYPES = new Set(["fabber", "factory", "platoon", "template"]);
const BUILD_LIST_TYPES = new Set(["fabber", "factory", "platoon"]);
// Mirrors referee_ai.js's own required-field checks exactly.
const REQUIRED_FIELDS_BY_OP = {
  load: ["value"],
  append: ["value", "toBuild", "idToMod"],
  prepend: ["value", "toBuild", "idToMod"],
  replace: ["value", "toBuild", "idToMod"],
  unset: ["toBuild", "idToMod"],
  remove: ["value", "toBuild"],
  new: ["value", "toBuild"],
  silence: ["value"],
  squad: ["value", "toBuild"],
};

// Which `type` each op can legally target. A mismatched pair passes the field
// shape check and is then dropped at runtime, silently for a shipped card -
// which is why it is caught here instead. `load` routes through managerPath()
// instead of the ops table, and accepts every type.
const VALID_TYPES_BY_OP = {
  load: VALID_TYPES,
  append: BUILD_LIST_TYPES,
  prepend: BUILD_LIST_TYPES,
  replace: BUILD_LIST_TYPES,
  unset: BUILD_LIST_TYPES,
  remove: BUILD_LIST_TYPES,
  new: BUILD_LIST_TYPES,
  silence: BUILD_LIST_TYPES,
  squad: new Set(["template"]),
};

// A loadout only adds its AI mods as the war's start card: the first card in
// the hand, on the first buff. Anywhere else buff() only banks it, so a loadout
// is run down that path.
function startCardAnswers() {
  return {
    lookupCard: () => 0,
    getTag: (context, name) =>
      context === "" && name === "buffCount" ? 0 : createAutoStub(),
  };
}

function collectAiMods(card, file) {
  const captured = [];
  const inventory = createCapturingInventory({
    answers: file.includes("_start_") ? startCardAnswers() : undefined,
    capture: { addAIMods: recordInto(captured) },
  });

  for (const method of ["buff", "dull"]) {
    if (typeof card[method] !== "function") {
      continue;
    }
    try {
      // params is what the card's own deal() returned at runtime; a card that
      // reads it (gwc_minion) gets a stub, since no deal() ran here.
      card[method](inventory, createAutoStub());
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

function checkType(problems, where, mod) {
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
}

function checkTreeOnly(problems, where, mod) {
  if (!Object.prototype.hasOwnProperty.call(mod, "treeOnly")) {
    return;
  }
  if (typeof mod.treeOnly !== "boolean") {
    problems.push(where + ": `treeOnly` must be a boolean");
  } else if (mod.op === "load" || mod.op === "squad") {
    problems.push(where + ': `treeOnly` is not read by op "' + mod.op + '"');
  }
}

function isStringArray(value) {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "string")
  );
}

// A malformed `silence` value matches nothing at runtime, so the card ships a
// descriptor that silently does no work.
function checkSilenceValue(problems, where, mod) {
  if (mod.op !== "silence" || mod.value === undefined) {
    return;
  }
  for (const field of ["builders", "except"]) {
    if (!mod.value || !isStringArray(mod.value[field])) {
      problems.push(
        where + ": `value." + field + "` must be an array of strings"
      );
    }
  }
}

// The checks that need a known op: its required fields, treeOnly, and the
// types it may target.
function checkOp(problems, where, mod, requiredFields) {
  for (const field of requiredFields) {
    if (
      !Object.prototype.hasOwnProperty.call(mod, field) ||
      mod[field] === undefined
    ) {
      problems.push(where + ': op "' + mod.op + '" requires `' + field + "`");
    }
  }

  checkTreeOnly(problems, where, mod);
  checkSilenceValue(problems, where, mod);

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

function checkMod(mod, index) {
  const problems = [];
  const where = "mod[" + index + "] (op=" + mod.op + ")";

  checkType(problems, where, mod);

  const requiredFields = REQUIRED_FIELDS_BY_OP[mod.op];
  if (requiredFields) {
    checkOp(problems, where, mod, requiredFields);
  } else {
    problems.push(
      where +
        ': invalid `op` "' +
        mod.op +
        '" (expected one of: ' +
        Object.keys(REQUIRED_FIELDS_BY_OP).join(", ") +
        ")"
    );
  }

  return problems;
}

// The second try/catch is separate from loadCard's on purpose: that one
// discriminates why a card would not load, this one reports a card that loaded
// but whose descriptors could not be collected.
function checkFile(file) {
  const loaded = loadCard(file);
  if (loaded.skip) {
    return { excluded: true, file };
  }
  if (loaded.error) {
    return { problems: ["failed to load: " + loaded.error.message] };
  }

  let mods;
  try {
    mods = collectAiMods(loaded.card, file);
  } catch (e) {
    return { problems: [e.message] };
  }

  if (!mods.length) {
    return {};
  }

  return {
    cardsChecked: 1,
    modsChecked: mods.length,
    problems: mods.flatMap((mod, i) => checkMod(mod, i)),
  };
}

function main() {
  // Stubs shared/gw_common, which nearly every card requires. Without it the
  // cards were skipped as excluded, nine of them AI-mod authors.
  installCardHarness();
  registerModuleStub(
    "shared/gw_common",
    Object.assign({}, GW_COMMON_STUB, { bank: INERT_BANK })
  );
  registerModuleStub(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/bank.js",
    INERT_BANK
  );
  const files = listCardFiles();

  let cardsChecked = 0;
  let modsChecked = 0;
  const excluded = [];
  const failures = [];

  for (const file of files) {
    const result = checkFile(file);
    if (result.excluded) {
      excluded.push(result.file);
    }
    cardsChecked += result.cardsChecked || 0;
    modsChecked += result.modsChecked || 0;
    if (result.problems && result.problems.length) {
      failures.push({ file, problems: result.problems });
    }
  }

  console.log(
    "ai-mods-contract: " +
      cardsChecked +
      " cards / " +
      modsChecked +
      " AI-mod descriptors checked, " +
      excluded.length +
      " cards excluded (base-game dependency unavailable outside the game), " +
      failures.length +
      " cards failed."
  );
  if (excluded.length) {
    console.log("ai-mods-contract: excluded: " + excluded.join(", "));
  }
  if (cardsChecked < MIN_CARDS_CHECKED) {
    failures.push({
      file: "ai-mods-contract",
      problems: [
        cardsChecked +
          " cards added AI mods, fewer than the " +
          MIN_CARDS_CHECKED +
          " expected: a card stopped adding them, or the harness stopped reaching it",
      ],
    });
  }

  reportFailures(failures);
}

main();
