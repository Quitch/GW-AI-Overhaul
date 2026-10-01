"use strict";

// Every catalog key as one Playglot import CSV: Key, English(en), the
// catalog's description as Context, then one column per shipped
// locale. A locale's cell is GWO's own entry, else the game's text for the
// key, else empty. Local-only: reads the PA install (--pa, else PA_MEDIA,
// else the default). Writes to PA's user data folder unless --out names a
// file. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const {
  CATALOG_LOCALE,
  SHIPPED_LOCALES,
  TRANSLATIONS_DIR,
} = require("../lib/loc-keys.js");
const { userDataDir } = require("../lib/pa-install.js");
const { paMedia, readLocale } = require("../lib/pa-locales.js");

const FILE_NAME = "gw-ai-overhaul-playglot.csv";

// Playglot's "Language(code)" headers; it creates each language on import.
// Playglot names Spanish and Polish without the region the game's locale has.
const LANGUAGES = {
  de: { name: "German", code: "de" },
  "es-ES": { name: "Spanish", code: "es" },
  fr: { name: "French", code: "fr" },
  it: { name: "Italian", code: "it" },
  ja: { name: "Japanese", code: "ja" },
  ko: { name: "Korean", code: "ko" },
  nl: { name: "Dutch", code: "nl" },
  "pl-PL": { name: "Polish", code: "pl" },
  ru: { name: "Russian", code: "ru" },
  "zh-CN": { name: "Simplified Chinese", code: "zh-CN" },
  "zh-TW": { name: "Traditional Chinese", code: "zh-TW" },
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readTranslations(locale) {
  const file = path.join(TRANSLATIONS_DIR, locale + ".json");
  return fs.existsSync(file) ? readJson(file) : {};
}

function header(locale) {
  if (!Object.hasOwn(LANGUAGES, locale)) {
    throw new Error("no Playglot language for " + locale);
  }
  return LANGUAGES[locale].name + "(" + LANGUAGES[locale].code + ")";
}

// Every field quoted, so commas, quotes and line breaks in a message survive.
function csvField(value) {
  return '"' + String(value).replaceAll('"', '""') + '"';
}

function toCsv(rows) {
  return rows.map((row) => row.map(csvField).join(",") + "\r\n").join("");
}

// `catalog` is en-US.json; `byLocale` maps each locale to its GWO file and
// the game's merged tables, as readLocale returns them.
function buildRows(catalog, locales, byLocale) {
  const rows = [["Key", "English(en)", "Context"].concat(locales.map(header))];
  for (const key of Object.keys(catalog)) {
    const row = [key, catalog[key].message, catalog[key].description || ""];
    for (const locale of locales) {
      const { gwo, game } = byLocale[locale];
      if (Object.hasOwn(gwo, key)) {
        row.push(gwo[key].message);
      } else if (Object.hasOwn(game, key)) {
        row.push(game[key].message);
      } else {
        row.push("");
      }
    }
    rows.push(row);
  }
  return rows;
}

function outFile(argv) {
  const at = argv.indexOf("--out");
  if (at < 0) {
    return path.join(userDataDir(), FILE_NAME);
  }
  if (!argv[at + 1] || argv[at + 1].startsWith("--")) {
    throw new Error("--out takes a file path");
  }
  return path.resolve(argv[at + 1]);
}

function main(argv) {
  const target = outFile(argv);
  const install = paMedia(argv);
  const catalogFile = path.join(TRANSLATIONS_DIR, CATALOG_LOCALE + ".json");
  if (!fs.existsSync(catalogFile)) {
    throw new Error("no catalog; run npm run i18n:catalog first");
  }
  const catalog = readJson(catalogFile);
  const locales = SHIPPED_LOCALES.filter((l) => l !== CATALOG_LOCALE);
  const byLocale = {};
  for (const locale of locales) {
    byLocale[locale] = {
      gwo: readTranslations(locale),
      game: readLocale(install.locales, locale),
    };
  }

  const rows = buildRows(catalog, locales, byLocale);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, toCsv(rows));
  console.log(
    "i18n:playglot: " +
      (rows.length - 1) +
      " keys, " +
      locales.length +
      " languages -> " +
      target
  );
  for (const locale of locales) {
    const filled = rows
      .slice(1)
      .filter((row) => row[3 + locales.indexOf(locale)] !== "").length;
    console.log(
      "  " +
        locale.padEnd(6) +
        String(filled).padStart(5) +
        " translated of " +
        (rows.length - 1)
    );
  }
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    console.error("i18n:playglot: " + e.message);
    process.exitCode = 1;
  }
}

module.exports = { buildRows, csvField, header, outFile, toCsv };
