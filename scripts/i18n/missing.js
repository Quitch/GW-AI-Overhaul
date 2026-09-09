"use strict";

// Per shipped locale, the catalog keys the game's own tables do not translate.
// Local-only: reads the PA install (PA_MEDIA or --pa). Prints counts; --out
// writes work lists to scripts/i18n/out/missing.<L>.<n>.json in --chunk sized
// pieces; --all writes every key instead, with PA's current text as `existing`,
// for reviewing shipped translations; --report lists entries in GWO's own files
// that override a PA entry. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const {
  CATALOG_LOCALE,
  SHIPPED_LOCALES,
  TRANSLATIONS_DIR,
} = require("../lib/loc-keys.js");
const { paMedia, readLocale } = require("../lib/pa-locales.js");

const OUT_DIR = path.join(__dirname, "out");
const DEFAULT_CHUNK = 100;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function catalog() {
  const file = path.join(TRANSLATIONS_DIR, CATALOG_LOCALE + ".json");
  if (!fs.existsSync(file)) {
    throw new Error("no catalog; run npm run i18n:catalog first");
  }
  return readJson(file);
}

function shippedFile(locale) {
  const file = path.join(TRANSLATIONS_DIR, locale + ".json");
  return fs.existsSync(file) ? readJson(file) : null;
}

function option(argv, name, fallback) {
  const at = argv.indexOf(name);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
}

function writeChunks(locale, entries, chunk) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const keys = Object.keys(entries);
  let written = 0;
  for (let i = 0; i < keys.length; i += chunk) {
    const piece = {};
    for (const key of keys.slice(i, i + chunk)) {
      piece[key] = entries[key];
    }
    const file = path.join(
      OUT_DIR,
      "missing." + locale + "." + (i / chunk + 1) + ".json"
    );
    fs.writeFileSync(file, JSON.stringify(piece, null, 2) + "\n");
    written += 1;
  }
  return written;
}

function main(argv) {
  const install = paMedia(argv);
  const cat = catalog();
  const keys = Object.keys(cat);
  const out = argv.includes("--out");
  const all = argv.includes("--all");
  const report = argv.includes("--report");
  const chunk = Number(option(argv, "--chunk", DEFAULT_CHUNK));
  const locales = SHIPPED_LOCALES.filter((l) => l !== CATALOG_LOCALE);

  console.log(
    "i18n:missing: " + keys.length + " catalog keys against " + install.locales
  );

  for (const locale of locales) {
    const pa = readLocale(install.locales, locale);
    const missing = keys.filter((key) => !Object.hasOwn(pa, key));
    const line =
      "  " +
      locale.padEnd(6) +
      String(missing.length).padStart(5) +
      " missing of " +
      keys.length;

    if (report) {
      reportOverrides(locale, line, pa);
    } else if (!out) {
      console.log(line);
    } else {
      writeWorkList(locale, line, pa, all ? keys : missing, {
        cat: cat,
        all: all,
        chunk: chunk,
      });
    }
  }
}

// --report: GWO's own entries that shadow one PA already ships.
function reportOverrides(locale, line, pa) {
  const shipped = shippedFile(locale) || {};
  const overrides = Object.keys(shipped).filter((key) =>
    Object.hasOwn(pa, key)
  );
  console.log(line + ", " + overrides.length + " overrides in GWO's file");
  for (const key of overrides) {
    console.log(
      "    " +
        JSON.stringify(key) +
        "\n      PA  (" +
        pa[key].file +
        "): " +
        pa[key].message +
        "\n      GWO: " +
        shipped[key].message
    );
  }
}

// --out: the work list for `keys`, chunked; --all carries PA's current text.
function writeWorkList(locale, line, pa, keys, options) {
  const entries = {};
  for (const key of keys) {
    entries[key] = { message: "", description: options.cat[key].description };
    if (options.all && Object.hasOwn(pa, key)) {
      entries[key].existing = pa[key].message;
    }
  }
  const files = writeChunks(locale, entries, options.chunk);
  console.log(
    line +
      (options.all ? ", all " + keys.length + " keys" : "") +
      " -> " +
      files +
      " file" +
      (files === 1 ? "" : "s")
  );
}

try {
  main(process.argv.slice(2));
} catch (e) {
  console.error("i18n:missing: " + e.message);
  process.exitCode = 1;
}
