"use strict";

// The translation files under ui/mods/<id>/translations/: named for a PA
// locale, shaped as PA's own tables, keys in code-point order with no
// duplicates, the en-US catalog equal to what the tree asks loc() for with no
// file:line in its notes, every other file a subset of it, and placeholders
// and style codes preserved per entry. Needs no PA install, so it runs in
// verify. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const { REPO_ROOT } = require("../lib/amd-loader.js");
const {
  CATALOG_LOCALE,
  PA_LOCALES,
  TRANSLATIONS_DIR,
  extractKeys,
  codeUnitCompare,
  sortedKeys,
} = require("../lib/loc-keys.js");
const { reportProblems } = require("../lib/report-failures.js");

const SEPARATORS = /;;|::/;
// A translator note's `file:line` reference; the line moves with the code.
const LINE_REFERENCE = /[\w-]\.(?:js|html|json|css):\d/;
// What a translation must carry over from its key, counted as a multiset.
const PRESERVED = [
  /__\w+__/g,
  /\{\d+\}/g,
  /\[\/?(?:strong|em|br)\]/g,
  /\[style=[^\]]+\]/g,
  /\[\/style\]/g,
  /<br\s*\/?>/gi,
];

function relative(file) {
  return path.relative(REPO_ROOT, file).split(path.sep).join("/");
}

// JSON.parse keeps the last of duplicate keys, so the duplicate check reads
// the file's top-level keys off the text.
// Index of the closing quote of the string literal opening at `start`.
function stringEnd(text, start) {
  let j = start + 1;
  while (j < text.length && text[j] !== '"') {
    if (text[j] === "\\") {
      j += 1;
    }
    j += 1;
  }
  return j;
}

function topLevelKeys(text) {
  const keys = [];
  let depth = 0;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      const j = stringEnd(text, i);
      const literal = text.slice(i, j + 1);
      i = j + 1;
      if (depth === 1 && /^\s*:/.test(text.slice(i))) {
        keys.push(JSON.parse(literal));
      }
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth += 1;
    } else if (ch === "}" || ch === "]") {
      depth -= 1;
    }
    i += 1;
  }
  return keys;
}

function preservedTokens(text) {
  const tokens = [];
  for (const pattern of PRESERVED) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      tokens.push(match[0].toLowerCase().replace(/\s+/g, ""));
    }
  }
  return tokens.sort(codeUnitCompare);
}

function checkEntry(problems, label, key, entry, isCatalog) {
  if (key !== key.trim()) {
    problems.push(
      label + ": key has surrounding whitespace: " + JSON.stringify(key)
    );
  }
  if (SEPARATORS.test(key)) {
    problems.push(
      label +
        ": key contains ;; or :: and can never resolve: " +
        JSON.stringify(key)
    );
  }
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    problems.push(label + ": entry is not an object: " + JSON.stringify(key));
    return;
  }
  const allowed = isCatalog ? ["message", "description"] : ["message"];
  for (const prop of Object.keys(entry)) {
    if (!allowed.includes(prop)) {
      problems.push(
        label + ": unexpected property " + prop + " on " + JSON.stringify(key)
      );
    }
  }
  if (typeof entry.message !== "string" || !entry.message.trim()) {
    problems.push(
      label + ": empty or non-string message for " + JSON.stringify(key)
    );
    return;
  }
  if (isCatalog) {
    if (entry.message !== key) {
      problems.push(
        label + ": catalog message differs from its key: " + JSON.stringify(key)
      );
    }
    if (typeof entry.description !== "string" || !entry.description.trim()) {
      problems.push(label + ": no description for " + JSON.stringify(key));
    } else if (LINE_REFERENCE.test(entry.description)) {
      problems.push(
        label +
          ": description names a line, which goes stale; name the file only: " +
          JSON.stringify(key)
      );
    }
    return;
  }
  const wanted = preservedTokens(key);
  const found = preservedTokens(entry.message);
  if (wanted.join("\u0000") !== found.join("\u0000")) {
    problems.push(
      label +
        ": placeholders or style codes differ from the key for " +
        JSON.stringify(key) +
        " (key has " +
        (wanted.join(" ") || "none") +
        ", message has " +
        (found.join(" ") || "none") +
        ")"
    );
  }
}

function checkFile(problems, file, isCatalog) {
  const label = relative(file);
  const text = fs.readFileSync(file, "utf8");
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    problems.push(label + ": " + e.message);
    return null;
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    problems.push(label + ": must be a JSON object of entries");
    return null;
  }

  const keys = topLevelKeys(text);
  const seen = new Set();
  for (const key of keys) {
    if (seen.has(key)) {
      problems.push(label + ": duplicate key " + JSON.stringify(key));
    }
    seen.add(key);
  }
  const sorted = sortedKeys(seen);
  const inOrder = Array.from(seen);
  for (let i = 0; i < sorted.length; i += 1) {
    if (sorted[i] !== inOrder[i]) {
      problems.push(
        label +
          ": keys are not in code-point order; first out of place: " +
          JSON.stringify(inOrder[i])
      );
      break;
    }
  }

  for (const key of Object.keys(data)) {
    checkEntry(problems, label, key, data[key], isCatalog);
  }
  return data;
}

// The catalog and the tree must carry the same keys, both ways.
function checkCatalogAgainstTree(problems, catalogFile, catalogKeys) {
  const extracted = extractKeys();
  for (const key of catalogKeys) {
    if (!extracted.has(key)) {
      problems.push(
        relative(catalogFile) +
          ": stale key, no longer in the tree: " +
          JSON.stringify(key)
      );
    }
  }
  for (const key of extracted.keys()) {
    if (!catalogKeys.has(key)) {
      problems.push(
        relative(catalogFile) +
          ": key in the tree but not catalogued: " +
          JSON.stringify(key)
      );
    }
  }
}

// One translation file's entry count; every key must be catalogued when
// there is a catalog to check against.
function checkLocaleFile(problems, file, catalogKeys) {
  const data = checkFile(problems, file, false);
  if (!data) {
    return 0;
  }
  const keys = Object.keys(data);
  if (catalogKeys) {
    for (const key of keys) {
      if (!catalogKeys.has(key)) {
        problems.push(
          relative(file) + ": key not in the catalog: " + JSON.stringify(key)
        );
      }
    }
  }
  return keys.length;
}

function main() {
  const problems = [];
  if (!fs.existsSync(TRANSLATIONS_DIR)) {
    problems.push(
      relative(TRANSLATIONS_DIR) + ": missing; run npm run i18n:catalog"
    );
    reportProblems(problems);
    return;
  }

  const files = fs
    .readdirSync(TRANSLATIONS_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort();
  const catalogFile = path.join(TRANSLATIONS_DIR, CATALOG_LOCALE + ".json");
  if (!files.includes(CATALOG_LOCALE + ".json")) {
    problems.push(
      relative(catalogFile) + ": missing; run npm run i18n:catalog"
    );
  }

  const catalog = files.includes(CATALOG_LOCALE + ".json")
    ? checkFile(problems, catalogFile, true)
    : null;
  const catalogKeys = new Set(catalog ? Object.keys(catalog) : []);

  if (catalog) {
    checkCatalogAgainstTree(problems, catalogFile, catalogKeys);
  }

  let entries = 0;
  for (const name of files) {
    const locale = name.slice(0, -".json".length);
    const file = path.join(TRANSLATIONS_DIR, name);
    if (!PA_LOCALES.includes(locale)) {
      problems.push(
        relative(file) + ": " + locale + " is not a locale PA ships"
      );
    } else if (locale !== CATALOG_LOCALE) {
      entries += checkLocaleFile(problems, file, catalog && catalogKeys);
    }
  }

  console.log(
    "translations: " +
      files.length +
      " files, " +
      catalogKeys.size +
      " catalog keys, " +
      entries +
      " translated entries, " +
      problems.length +
      " problems."
  );
  reportProblems(problems);
}

main();
