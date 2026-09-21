"use strict";

// The optional post-CEF modernisation pass: rewrites the mod-side ui/** files
// into the modern syntax lebab can prove equivalent, and leaves the shadowed
// stock files alone so their diffs against stock stay minimal. A one-shot,
// opt-in tool, not part of verify. See cef-migration.md, "The optional
// modernisation pass".
//
// Usage: node scripts/migrate/modernise.js [<root>]

const fs = require("node:fs");
const path = require("node:path");
const lebab = require("lebab");
const { walkFiles } = require("../lib/walk.js");

const TRANSFORMS = [
  "let",
  "arrow",
  "arrow-return",
  "template",
  "obj-shorthand",
];

// Shadowed stock files keep minimal diffs against stock, so they stay ES5.
// Everything else under ui/, the gwc_ cards included, is mod-side.
const ES5_SIDE = [
  "ui/main/game/galactic_war/gw_play/",
  "ui/main/game/galactic_war/shared/",
];

function isEs5Side(rel) {
  const posix = rel.split(path.sep).join("/");
  return ES5_SIDE.some((prefix) => posix.startsWith(prefix));
}

// Scene scripts share one scope, so a top-level let or const would collide
// across scripts; those declarations come back as var.
function restoreTopLevelVar(code) {
  return code.replace(/^(let|const) /gm, "var ");
}

// Returns { code, warnings }. A closure that reads `arguments` cannot become an
// arrow, and lebab already leaves it alone; the warning is noise.
function modernise(source) {
  const result = lebab.transform(source, TRANSFORMS);
  return {
    code: restoreTopLevelVar(result.code),
    warnings: result.warnings.filter(
      (warning) => !/arguments in arrow/.test(warning.msg)
    ),
  };
}

// Rewrites every mod-side ui/**/*.js under root in place. Returns the count.
function run(root) {
  const files = walkFiles(path.join(root, "ui"), (name) =>
    name.endsWith(".js")
  );
  let changed = 0;
  for (const filePath of files) {
    const rel = path.relative(root, filePath);
    if (isEs5Side(rel)) {
      continue;
    }
    const before = fs.readFileSync(filePath, "utf8");
    const { code, warnings } = modernise(before);
    for (const warning of warnings) {
      console.error(rel + ":" + warning.line + " " + warning.msg);
    }
    if (code !== before) {
      fs.writeFileSync(filePath, code);
      changed += 1;
    }
  }
  return changed;
}

function main() {
  const root = path.resolve(
    process.argv[2] || path.join(__dirname, "..", "..")
  );
  const changed = run(root);
  console.log("modernise: " + changed + " files rewritten");
}

if (require.main === module) {
  main();
}

module.exports = { modernise: modernise, isEs5Side: isEs5Side, run: run };
