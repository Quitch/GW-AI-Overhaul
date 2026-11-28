"use strict";

// Lists every entry in GWO's pa/ai/ copies that differs from the PA install's
// base copy, with the commits that changed it. Local-only: CI has no install.
// See testing.md, "The validators", and shadowing.md, "What GWO changes in the
// pa/ai/ files, and why".
//
//   npm run diff:titans-ai [-- [--json <file>] [--no-history]]

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { mediaDir } = require("./lib/pa-install.js");
const {
  historicPaths,
  baseRels,
  compareFile,
  entryHistory,
  changelogLines,
  mergeLabel,
  introducingMerge,
  formatReport,
} = require("./lib/titans-ai-diff.js");

const REPO_ROOT = path.resolve(__dirname, "..");
const AI_ROOT = path.join(REPO_ROOT, "pa", "ai");

function parseArgs(argv) {
  const options = { history: true, json: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--no-history") {
      options.history = false;
    } else if (argv[i] === "--json") {
      const file = argv[i + 1];
      if (!file || file.startsWith("--")) {
        throw new Error("--json needs a file");
      }
      options.json = file;
      i += 1;
    } else {
      throw new Error("unknown argument: " + argv[i]);
    }
  }
  return options;
}

function listCopies(dir, prefix) {
  const rels = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + entry.name;
    if (entry.isDirectory()) {
      rels.push(...listCopies(path.join(dir, entry.name), rel + "/"));
    } else if (entry.name.endsWith(".json")) {
      rels.push(rel);
    }
  }
  return rels.sort();
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function git(args) {
  return execFileSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// git's own reason, else the command that failed.
function gitReason(error) {
  const lines = String((error && error.stderr) || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    lines.find((line) => /^(fatal|error):/.test(line)) ||
    lines[0] ||
    String(error && error.message).split(/\r?\n/)[0]
  );
}

function gitOk(args) {
  try {
    git(args);
    return true;
  } catch {
    return false;
  }
}

function makeHistory() {
  // A shallow clone's oldest commit has no parent to compare against, so every
  // entry older than it would look added by that commit.
  if (git(["rev-parse", "--is-shallow-repository"]).trim() === "true") {
    throw new Error("the clone is shallow");
  }
  const shown = new Map();
  const details = new Map();
  const firstParent = new Set(
    git(["rev-list", "--first-parent", "HEAD"]).split(/\s+/)
  );
  const merges = git([
    "log",
    "--first-parent",
    "--merges",
    "--reverse",
    "--format=%H%x09%s",
    "HEAD",
  ])
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      return { sha: line.slice(0, tab), subject: line.slice(tab + 1) };
    });

  function show(ref, file) {
    const key = ref + ":" + file;
    if (!shown.has(key)) {
      let doc = null;
      try {
        doc = JSON.parse(git(["show", key]));
      } catch {
        doc = null;
      }
      shown.set(key, doc);
    }
    return shown.get(key);
  }

  function readAt(paths) {
    return (ref) => {
      for (const file of paths) {
        const doc = show(ref, file);
        if (doc) {
          return doc;
        }
      }
      return null;
    };
  }

  function via(sha) {
    if (firstParent.has(sha)) {
      return "direct";
    }
    const merge = introducingMerge(sha, merges, (commit, target) =>
      gitOk(["merge-base", "--is-ancestor", commit, target])
    );
    return merge ? mergeLabel(merge.subject) : "not on this branch";
  }

  function describe(sha) {
    if (!details.has(sha)) {
      const [date, subject] = git([
        "log",
        "-1",
        "--format=%ad%x09%s",
        "--date=short",
        sha,
      ])
        .trim()
        .split("\t");
      details.set(sha, {
        date: date,
        subject: subject,
        via: via(sha),
        changelog: changelogLines(
          git(["show", "--format=", sha, "--", "CHANGELOG.md"])
        ),
      });
    }
    return details.get(sha);
  }

  return function historyFor(rel, keys) {
    const paths = historicPaths(rel);
    const commits = git([
      "log",
      "--no-merges",
      "--reverse",
      "--format=%H",
      "HEAD",
      "--",
      ...paths,
    ])
      .split("\n")
      .filter(Boolean);
    const all = entryHistory(commits, readAt(paths));
    const out = {};
    for (const key of keys) {
      out[key] = (all.get(key) || []).map((commit) =>
        Object.assign(
          { sha: commit.sha, change: commit.change },
          describe(commit.sha)
        )
      );
    }
    return out;
  };
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    return 1;
  }
  const media = mediaDir();
  if (!fs.existsSync(media)) {
    console.error("no PA install at " + media + " (set PA_MEDIA)");
    return 1;
  }
  let historyFor;
  if (options.history) {
    try {
      historyFor = makeHistory();
    } catch (error) {
      console.error(
        "cannot read the git history (" +
          gitReason(error) +
          "); run with --no-history"
      );
      return 1;
    }
  }
  const report = { media: media, files: [] };
  for (const rel of listCopies(AI_ROOT, "")) {
    const baseRel = baseRels(rel).find((candidate) =>
      fs.existsSync(path.join(media, candidate))
    );
    const file = { rel: rel, base: baseRel };
    try {
      const gwoDoc = readJson(path.join(AI_ROOT, rel));
      if (baseRel) {
        file.comparison = compareFile(
          gwoDoc,
          readJson(path.join(media, baseRel))
        );
        if (historyFor) {
          file.history = historyFor(
            rel,
            file.comparison.diffs.map((diff) => diff.key)
          );
        }
      }
    } catch (error) {
      console.error("cannot compare pa/ai/" + rel + ": " + error.message);
      return 1;
    }
    report.files.push(file);
  }
  console.log(formatReport(report));
  if (options.json) {
    fs.writeFileSync(options.json, JSON.stringify(report, null, 2) + "\n");
  }
  return 0;
}

process.exitCode = main();
