"use strict";

// Rewrites every engine-scheme literal in one pass, for when the CEF port's
// real scheme is known: static AMD ids, asset paths, modinfo.json, the test
// harness fixtures, and the paired constants in scripts/lib/scheme.js and
// shared/gwo_url.js. Idempotent; refuses a dirty working tree so a bad run is
// one `git restore` away from undone. See cef-migration.md.
//
// Usage: node scripts/migrate/rewrite-scheme.js --from coui:// --to cef://
//        (repeat --from/--to for a second scheme, e.g. spec://)

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { walkFiles } = require("../lib/walk.js");

const TEXT_EXTENSIONS = new Set([".js", ".html", ".css", ".json"]);

// docs/ is deliberately excluded: prose describing the migration itself should
// name the old scheme, and the docs are rewritten by hand per stage anyway.
const CATEGORIES = [
  { name: "modinfo.json", match: (rel) => rel === "modinfo.json" },
  { name: "ui", match: (rel) => rel.startsWith("ui" + path.sep) },
  { name: "scripts", match: (rel) => rel.startsWith("scripts" + path.sep) },
  { name: "test", match: (rel) => rel.startsWith("test" + path.sep) },
];

function categoryOf(rel) {
  const found = CATEGORIES.find((c) => c.match(rel));
  return found ? found.name : null;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// A replacement that contains a searched scheme would be re-rewritten on the
// next run, silently corrupting every URL. Refuse the pairing outright.
function assertPairsStayIdempotent(pairs) {
  for (const pair of pairs) {
    for (const other of pairs) {
      if (pair.to.includes(other.from)) {
        throw new Error(
          'rewrite-scheme: replacement "' +
            pair.to +
            '" contains searched scheme "' +
            other.from +
            '" - a second run would corrupt it. Pick a non-overlapping name.'
        );
      }
    }
  }
}

// Returns { files, occurrences } counts per category name.
function rewriteScheme(repoRoot, pairs) {
  assertPairsStayIdempotent(pairs);
  const counts = {};
  for (const category of CATEGORIES) {
    counts[category.name] = { files: 0, occurrences: 0 };
  }

  const candidates = walkFiles(repoRoot, (name) =>
    TEXT_EXTENSIONS.has(path.extname(name))
  );

  for (const filePath of candidates) {
    const rel = path.relative(repoRoot, filePath);
    const category = categoryOf(rel);
    if (!category) {
      continue;
    }

    const before = fs.readFileSync(filePath, "utf8");
    let after = before;
    let occurrences = 0;

    for (const pair of pairs) {
      const pattern = new RegExp(escapeRegExp(pair.from), "g");
      const hits = after.match(pattern);
      if (hits) {
        occurrences += hits.length;
        after = after.replace(pattern, pair.to);
      }
    }

    if (occurrences > 0) {
      fs.writeFileSync(filePath, after);
      counts[category].files += 1;
      counts[category].occurrences += occurrences;
    }
  }

  return counts;
}

function parseArgs(argv) {
  const pairs = [];
  for (let i = 0; i < argv.length; i += 2) {
    const flag = argv[i];
    const value = argv[i + 1];
    if ((flag !== "--from" && flag !== "--to") || value === undefined) {
      throw new Error(
        "rewrite-scheme: expected --from <scheme> --to <scheme> pairs, got: " +
          argv.join(" ")
      );
    }
    if (flag === "--from") {
      pairs.push({ from: value, to: undefined });
    } else {
      const pair = pairs[pairs.length - 1];
      if (!pair || pair.to !== undefined) {
        throw new Error("rewrite-scheme: --to without a preceding --from");
      }
      pair.to = value;
    }
  }
  if (!pairs.length || pairs.some((p) => p.to === undefined)) {
    throw new Error(
      "rewrite-scheme: every --from needs a --to. " +
        "Usage: node scripts/migrate/rewrite-scheme.js --from coui:// --to cef://"
    );
  }
  return pairs;
}

// A scratch copy without .git (the rename rehearsal) skips the check.
function assertCleanTree(repoRoot) {
  let status;
  try {
    status = execFileSync("git", ["-C", repoRoot, "status", "--porcelain"], {
      encoding: "utf8",
    });
  } catch {
    return;
  }
  if (status.trim()) {
    throw new Error(
      "rewrite-scheme: working tree is dirty - commit or stash first, " +
        "so the rewrite stays a clean, revertable diff"
    );
  }
}

function main() {
  const repoRoot = path.resolve(__dirname, "..", "..");
  let pairs;
  try {
    pairs = parseArgs(process.argv.slice(2));
    assertCleanTree(repoRoot);
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
    return;
  }

  const counts = rewriteScheme(repoRoot, pairs);
  let total = 0;
  for (const [name, count] of Object.entries(counts)) {
    total += count.occurrences;
    console.log(
      "rewrite-scheme: " +
        name +
        ": " +
        count.occurrences +
        " occurrences in " +
        count.files +
        " files"
    );
  }
  console.log("rewrite-scheme: " + total + " occurrences rewritten");
}

if (require.main === module) {
  main();
}

module.exports = { rewriteScheme: rewriteScheme, parseArgs: parseArgs };
