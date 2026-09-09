"use strict";

// Per shipped locale, how the game's own tables render the terms GWO's text
// shares with the stock UI, so a translation agrees with the screen it sits
// on. Local-only (PA_MEDIA or --pa). Writes scripts/i18n/out/glossary.<L>.md.
// See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const { CATALOG_LOCALE, SHIPPED_LOCALES } = require("../lib/loc-keys.js");
const { chain, paMedia, tableFiles } = require("../lib/pa-locales.js");

const OUT_DIR = path.join(__dirname, "out");
const TABLES = [
  "gw-overhaul.json",
  "galactic_war.json",
  "units.json",
  "legion.json",
  "gw_start.json",
  "gw_play.json",
];
const TERMS = [
  "Commander",
  "Sub Commander",
  "Tech",
  "Galactic War",
  "Data Bank",
  "Titan",
  "Eradicate",
  "Bounty",
  "Sudden Death",
  "Land Anywhere",
  "Loadout",
  "Faction",
  "Boss",
  "Difficulty",
  "Hardcore",
  "Legion",
  "Bugs",
  "Exiles",
  "MLA",
  "Fabricator",
  "Factory",
  "Orbital",
  "Naval",
  "Vehicle",
  "Bot",
  "Air",
  "Advanced",
  "Basic",
  "Metal",
  "Energy",
  "Planet",
  "System",
  "Galaxy",
  "Card",
  "Minion",
  "Mod",
  "Win",
  "Defeat",
];
// Proper nouns PA transliterates in ja/ko and leaves alone elsewhere; their
// stock renderings are the reference for GWO's race unit names.
const UNIT_TERMS = [
  "Dox",
  "Dauntless",
  "Ant",
  "Slammer",
  "Stinger",
  "Vanguard",
  "Grenadier",
  "Bluehawk",
  "Hornet",
  "Phoenix",
  "Zeus",
  "Atlas",
  "Ares",
  "Helios",
  "Omega",
  "Orca",
  "Leviathan",
  "Kraken",
  "Anchor",
  "Avenger",
  "Artemis",
  "Astraeus",
  "Praetorian",
  "Overwatch",
  "Cyclops",
];
const MAX_EXAMPLES = 4;

function readTables(localesDir, locale) {
  const merged = {};
  for (const lang of chain(locale).reverse()) {
    for (const file of tableFiles(localesDir, lang)) {
      if (!TABLES.includes(path.basename(file))) {
        continue;
      }
      const table = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const key of Object.keys(table)) {
        if (table[key] && typeof table[key].message === "string") {
          merged[key] = table[key].message;
        }
      }
    }
  }
  return merged;
}

function escapeCell(text) {
  return text.replace(/\|/g, "\\|").replace(/\s+/g, " ");
}

function wordMatch(term) {
  return new RegExp("(^|[^A-Za-z])" + term + "(?![A-Za-z])", "i");
}

function section(title, terms, table, keys) {
  const lines = [
    "## " + title,
    "",
    "| English | Exact | Examples |",
    "| --- | --- | --- |",
  ];
  for (const term of terms) {
    const exact = Object.hasOwn(table, term) ? table[term] : "";
    const pattern = wordMatch(term);
    const examples = keys
      .filter((key) => key !== term && key.length <= 80 && pattern.test(key))
      .slice(0, MAX_EXAMPLES)
      .map((key) => escapeCell(key) + " → " + escapeCell(table[key]));
    lines.push(
      "| " +
        escapeCell(term) +
        " | " +
        escapeCell(exact) +
        " | " +
        examples.join("<br>") +
        " |"
    );
  }
  lines.push("");
  return lines;
}

function main(argv) {
  const install = paMedia(argv);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const locales = SHIPPED_LOCALES.filter((l) => l !== CATALOG_LOCALE);

  for (const locale of locales) {
    const table = readTables(install.locales, locale);
    const keys = Object.keys(table).sort((a, b) => a.length - b.length);
    const lines = [
      "# Glossary: " + locale,
      "",
      "How PA's own tables (" +
        TABLES.join(", ") +
        ") render the terms GWO shares with the stock UI. Exact is the entry for the term itself; Examples are short stock keys containing it.",
      "",
    ]
      .concat(section("Terms", TERMS, table, keys))
      .concat(section("Unit names", UNIT_TERMS, table, keys));
    const file = path.join(OUT_DIR, "glossary." + locale + ".md");
    fs.writeFileSync(file, lines.join("\n"));
    console.log("i18n:glossary: " + path.relative(process.cwd(), file));
  }
}

try {
  main(process.argv.slice(2));
} catch (e) {
  console.error("i18n:glossary: " + e.message);
  process.exitCode = 1;
}
