"use strict";

// Assembles the translated work lists, scripts/i18n/out/<L>.*.json, into
// translations/<L>.json: empty messages and descriptions dropped, keys sorted,
// Prettier-identical output, idempotent. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const {
  CATALOG_LOCALE,
  PA_LOCALES,
  TRANSLATIONS_DIR,
  sortedKeys,
} = require("../lib/loc-keys.js");

const OUT_DIR = path.join(__dirname, "out");
const WORK_LIST =
  /^(?:missing\.|all\.)?([A-Za-z]{2}(?:-[A-Za-z]{2})?)(?:\.\d+)?\.json$/;

function workLists() {
  if (!fs.existsSync(OUT_DIR)) {
    return new Map();
  }
  const byLocale = new Map();
  for (const name of fs.readdirSync(OUT_DIR).sort()) {
    const match = WORK_LIST.exec(name);
    if (!match || match[1] === CATALOG_LOCALE) {
      continue;
    }
    if (!byLocale.has(match[1])) {
      byLocale.set(match[1], []);
    }
    byLocale.get(match[1]).push(path.join(OUT_DIR, name));
  }
  return byLocale;
}

// The work lists' non-empty messages layered over `merged`, in place;
// returns how many were taken and how many empty ones were skipped.
function takeMessages(merged, files) {
  const counts = { taken: 0, empty: 0 };
  for (const file of files) {
    const list = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const key of Object.keys(list)) {
      const message = list[key] && list[key].message;
      if (typeof message !== "string" || !message.trim()) {
        counts.empty += 1;
        continue;
      }
      merged[key] = { message: message };
      counts.taken += 1;
    }
  }
  return counts;
}

function mergeLocale(locale, files) {
  const target = path.join(TRANSLATIONS_DIR, locale + ".json");
  const merged = fs.existsSync(target)
    ? JSON.parse(fs.readFileSync(target, "utf8"))
    : {};
  const counts = takeMessages(merged, files);
  const out = {};
  for (const key of sortedKeys(Object.keys(merged))) {
    out[key] = { message: merged[key].message };
  }
  if (!Object.keys(out).length) {
    // An untranslated work list is not a translation file.
    console.log(
      "i18n:merge: " + locale.padEnd(6) + "    0 entries, nothing written"
    );
    return;
  }
  fs.writeFileSync(target, JSON.stringify(out, null, 2) + "\n");
  console.log(
    "i18n:merge: " +
      locale.padEnd(6) +
      String(counts.taken).padStart(5) +
      " entries from " +
      files.length +
      " file" +
      (files.length === 1 ? "" : "s") +
      (counts.empty ? ", " + counts.empty + " empty skipped" : "") +
      " -> " +
      Object.keys(out).length +
      " in " +
      path.relative(process.cwd(), target)
  );
}

function main() {
  const lists = workLists();
  if (!lists.size) {
    console.log(
      "i18n:merge: nothing under " + path.relative(process.cwd(), OUT_DIR)
    );
    return;
  }
  fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true });

  for (const [locale, files] of lists) {
    if (!PA_LOCALES.includes(locale)) {
      console.error("i18n:merge: " + locale + " is not a PA locale; skipped");
      process.exitCode = 1;
      continue;
    }
    mergeLocale(locale, files);
  }
}

main();
