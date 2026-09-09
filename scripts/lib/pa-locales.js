"use strict";

// The game's own translation tables, read from a PA install for the local-only
// i18n scripts. PA_MEDIA (or --pa <path>) names the install's media folder; CI
// has none, so nothing in `verify` may require this. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

function paMedia(argv) {
  const flag = argv.indexOf("--pa");
  const dir = flag >= 0 ? argv[flag + 1] : process.env.PA_MEDIA;
  if (!dir) {
    throw new Error(
      "set PA_MEDIA to the game's media folder or pass --pa <path>"
    );
  }
  const locales = path.join(dir, "ui", "main", "_i18n", "locales");
  if (!fs.existsSync(locales)) {
    throw new Error("no _i18n/locales under " + dir);
  }
  return { media: dir, locales: locales };
}

// The runtime fallback chain for a locale: "de-AT" -> ["de-AT", "de"].
function chain(locale) {
  const dash = locale.indexOf("-");
  return dash > 0 ? [locale, locale.slice(0, dash)] : [locale];
}

function tableFiles(localesDir, locale) {
  const dir = path.join(localesDir, locale);
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(dir, name));
}

// One flat `{ key: { message, file } }` per locale, every table merged, the
// base language filled in beneath the exact locale as i18next falls back.
function readLocale(localesDir, locale) {
  const merged = {};
  for (const lang of chain(locale).reverse()) {
    for (const file of tableFiles(localesDir, lang)) {
      const table = JSON.parse(fs.readFileSync(file, "utf8"));
      for (const key of Object.keys(table)) {
        const entry = table[key];
        if (entry && typeof entry.message === "string") {
          merged[key] = {
            message: entry.message,
            file: lang + "/" + path.basename(file),
          };
        }
      }
    }
  }
  return merged;
}

module.exports = { chain, paMedia, readLocale, tableFiles };
