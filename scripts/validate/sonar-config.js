"use strict";

// `sonar-project.properties` is live config that nothing else in the repo reads,
// so it drifts silently. Two checks, both for failures that already happened:
//
//   1. Every exclusion pattern still matches a tracked file, so a rename cannot
//      leave a stale path sitting there looking intentional.
//   2. Every file the scanner indexes decodes as UTF-8, matching the declared
//      sonar.sourceEncoding.
//
// Tracked files are the right population: the scanner is SCM-aware, so what
// `git ls-files` returns is what it sees. See testing.md.

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { REPO_ROOT } = require("../lib/amd-loader.js");

const CONFIG_PATH = path.join(REPO_ROOT, "sonar-project.properties");
const PATTERN_KEYS = ["sonar.exclusions", "sonar.coverage.exclusions"];
const ENCODING_KEY = "sonar.sourceEncoding";
const EXPECTED_ENCODING = "UTF-8";

// Minimal .properties reader: strips `#`/`!` comments and joins trailing-backslash
// continuations (leading whitespace on a continued line is not part of the value).
function readProperties(text) {
  const props = {};
  const lines = text.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    let value = lines[i];
    i++;
    const trimmed = value.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) {
      continue;
    }
    while (value.endsWith("\\") && i < lines.length) {
      value = value.slice(0, -1) + lines[i].trim();
      i++;
    }
    const eq = value.indexOf("=");
    if (eq !== -1) {
      props[value.slice(0, eq).trim()] = value.slice(eq + 1).trim();
    }
  }

  return props;
}

// Sonar's WildcardPattern semantics: `**` spans directory separators, `*` and `?` stay
// within one path segment.
function patternToRegExp(pattern) {
  let source = "";

  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === "*" && pattern[i + 1] === "*") {
      if (pattern[i + 2] === "/") {
        source += "(?:[^/]*/)*";
        i += 2;
      } else {
        source += ".*";
        i += 1;
      }
    } else if (char === "*") {
      source += "[^/]*";
    } else if (char === "?") {
      source += "[^/]";
    } else {
      source += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }

  return new RegExp("^" + source + "$");
}

function splitPatterns(value) {
  return (value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function trackedFiles() {
  return execFileSync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  })
    .split("\0")
    .filter(Boolean);
}

// Checks every exclusion pattern still matches something, and returns the matchers for
// `sonar.exclusions` so main() can work out which files stay in analysis.
function checkPatterns(props, files, failures) {
  const analysisMatchers = [];
  let patternCount = 0;

  for (const key of PATTERN_KEYS) {
    for (const pattern of splitPatterns(props[key])) {
      patternCount++;
      const matcher = patternToRegExp(pattern);
      if (!files.some((file) => matcher.test(file))) {
        failures.push(
          key +
            " pattern matches no tracked file (renamed or deleted?): " +
            pattern,
        );
      }
      if (key === "sonar.exclusions") {
        analysisMatchers.push(matcher);
      }
    }
  }

  return { analysisMatchers, patternCount };
}

function checkEncoding(files, analysisMatchers, failures) {
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const analysed = files.filter(
    (file) => !analysisMatchers.some((matcher) => matcher.test(file)),
  );

  for (const file of analysed) {
    try {
      decoder.decode(fs.readFileSync(path.join(REPO_ROOT, file)));
    } catch {
      failures.push(
        "not valid " +
          EXPECTED_ENCODING +
          " but still analysed - exclude it or re-encode it: " +
          file,
      );
    }
  }

  return analysed.length;
}

function main() {
  const failures = [];
  let props;

  try {
    props = readProperties(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch (e) {
    console.error(
      "sonar-config: sonar-project.properties unreadable: " + e.message,
    );
    process.exitCode = 1;
    return;
  }

  if (props[ENCODING_KEY] !== EXPECTED_ENCODING) {
    failures.push(
      ENCODING_KEY +
        " must be " +
        EXPECTED_ENCODING +
        " (it defaults to the CI runner's platform charset otherwise), found: " +
        (props[ENCODING_KEY] || "<unset>"),
    );
  }

  const files = trackedFiles();
  const { analysisMatchers, patternCount } = checkPatterns(
    props,
    files,
    failures,
  );
  const analysedCount = checkEncoding(files, analysisMatchers, failures);

  console.log(
    "sonar-config: " +
      patternCount +
      " exclusion patterns / " +
      analysedCount +
      " analysed files checked, " +
      failures.length +
      " problems.",
  );

  if (failures.length) {
    console.error("");
    failures.forEach((f) => console.error("  - " + f));
    process.exitCode = 1;
  }
}

main();
