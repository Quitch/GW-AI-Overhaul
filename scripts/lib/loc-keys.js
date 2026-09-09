"use strict";

// Every "!LOC:" key GWO's ui/ tree asks loc() for, with where and how it is
// used. The i18n:* scripts and validate:translations all read the tree through
// this one walk, so the catalog, the missing lists and the validator agree on
// what a key is. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const { REPO_ROOT } = require("./amd-loader.js");
const { walkFiles } = require("./walk.js");

const MOD_ID = "com.pa.quitch.gwaioverhaul";
const UI_ROOT = path.join(REPO_ROOT, "ui");
const TRANSLATIONS_DIR = path.join(UI_ROOT, "mods", MOD_ID, "translations");

// The locale directories PA ships under ui/main/_i18n/locales/, minus the xx
// and xx-pad pseudo-locales. A committed constant so CI needs no PA install.
const PA_LOCALES = [
  "ar",
  "cs-CZ",
  "da",
  "de",
  "de-AT",
  "en",
  "en-US",
  "es-ES",
  "fi",
  "fr",
  "hu-HU",
  "it",
  "ja",
  "ko",
  "nl",
  "nl-BE",
  "no",
  "pl-PL",
  "pt-BR",
  "ro",
  "ru",
  "sv",
  "tr-TR",
  "uk",
  "zh-CN",
  "zh-HK",
  "zh-TW",
];

// The languages PA translates fully, which GWO ships files for, plus the
// English catalog. de-AT and nl-BE fall back to de and nl at runtime.
const SHIPPED_LOCALES = [
  "de",
  "es-ES",
  "fr",
  "it",
  "ja",
  "ko",
  "nl",
  "pl-PL",
  "ru",
  "zh-CN",
  "zh-TW",
  "en-US",
];

const CATALOG_LOCALE = "en-US";
// Race unit names are the race mod's to translate, not GWO's: a key seen only
// at these sites is left out of the catalog. See docs/translations.md.
const EXCLUDED_ROLES = ["race-unit-name"];
const SOURCE_EXTENSIONS = [".js", ".html", ".json"];
const SNIPPET_LIMIT = 300;
const ROLE_WINDOW = 600;

const LOC_LITERAL = /(["'])!LOC:((?:\\.|(?!\1).)*)\1/g;
const LOC_TAG = /<loc\b([^>]*)>([\s\S]*?)<\/loc\s*>/g;
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function relative(file) {
  return path.relative(REPO_ROOT, file).split(path.sep).join("/");
}

function unescapeLiteral(text, quote) {
  return text.replace(/\\(.)/g, (match, ch) => {
    if (ch === "n") {
      return "\n";
    }
    if (ch === "t") {
      return "\t";
    }
    if (ch === quote || ch === "\\") {
      return ch;
    }
    return match;
  });
}

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body) => {
    if (body[0] === "#") {
      const code =
        body[1] === "x" || body[1] === "X"
          ? parseInt(body.slice(2), 16)
          : parseInt(body.slice(1), 10);
      return Number.isNaN(code) ? match : String.fromCodePoint(code);
    }
    return Object.hasOwn(ENTITIES, body.toLowerCase())
      ? ENTITIES[body.toLowerCase()]
      : match;
  });
}

function lineAt(source, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (source.charCodeAt(i) === 10) {
      line += 1;
    }
  }
  return line;
}

function squash(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > SNIPPET_LIMIT
    ? flat.slice(0, SNIPPET_LIMIT - 1) + "…"
    : flat;
}

// The statement or object property the literal sits in: back to the nearest
// `;`, `{`, `}` or `,` at the literal's own bracket depth, forward likewise.
// A `{` that opens a `key: function () {` body pulls the key in too, so a
// card's `summarize: function () { return "!LOC:…" }` reads as one snippet.
function jsStatement(source, start, end) {
  let depth = 0;
  let outward = 0;
  let from = start;
  while (from > 0) {
    const ch = source[from - 1];
    if ((ch === ")" || ch === "]") && !inString(source, from - 1)) {
      depth += 1;
    } else if ((ch === "(" || ch === "[") && !inString(source, from - 1)) {
      if (depth === 0) {
        outward += 1;
      } else {
        depth -= 1;
      }
    } else if (
      depth === 0 &&
      (ch === ";" || ch === "{" || ch === "}" || ch === ",") &&
      !inString(source, from - 1)
    ) {
      break;
    }
    from -= 1;
  }
  const opener = /(\w+)\s*:\s*function\s*\([^)]*\)\s*\{\s*$/.exec(
    source.slice(Math.max(0, from - 120), from)
  );
  if (opener) {
    from -= opener[0].length;
  }
  depth = 0;
  let to = end;
  while (to < source.length) {
    const ch = source[to];
    if (ch === "(" || ch === "[" || ch === "{") {
      depth += 1;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (depth === 0 && outward === 0) {
        break;
      }
      if (depth === 0) {
        outward -= 1;
      } else {
        depth -= 1;
      }
    } else if (depth === 0 && outward === 0 && (ch === ";" || ch === ",")) {
      to += 1;
      break;
    }
    to += 1;
  }
  return source.slice(from, to);
}

// Whether `index` sits inside a quoted string on its line. Cheap and good
// enough for GWO's sources, which keep each literal on one line.
function inString(source, index) {
  const lineStart = source.lastIndexOf("\n", index) + 1;
  let quote = null;
  for (let i = lineStart; i < index; i += 1) {
    const ch = source[i];
    if (quote) {
      if (ch === "\\") {
        i += 1;
      } else if (ch === quote) {
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    }
  }
  return quote !== null;
}

// The element whose attribute or text holds the literal: from its opening
// `<tag` to its `</tag>`, or to the end of the open tag when it never closes.
function htmlElement(source, index) {
  let open = source.lastIndexOf("<", index);
  while (open >= 0 && source[open + 1] === "/") {
    open = source.lastIndexOf("<", open - 1);
  }
  if (open < 0) {
    return source.slice(Math.max(0, index - 100), index + 100);
  }
  const tag = /^<([a-zA-Z][\w-]*)/.exec(source.slice(open));
  const tagEnd = source.indexOf(">", index);
  if (!tag || tagEnd < 0) {
    return source.slice(open, index + 100);
  }
  const close = source.indexOf("</" + tag[1] + ">", tagEnd);
  const nextOpen = source.indexOf("<" + tag[1], tagEnd);
  if (close >= 0 && (nextOpen < 0 || close < nextOpen)) {
    return source.slice(open, close + tag[1].length + 3);
  }
  return source.slice(open, tagEnd + 1);
}

function fileFacts(file, source) {
  const rel = relative(file);
  const base = path.basename(file, path.extname(file));
  const facts = { file: rel, base: base };
  if (rel.includes("/galactic_war/cards/")) {
    facts.card = base;
  }
  if (rel.includes("/race/")) {
    const id = /\bid:\s*"([^"]+)"/.exec(source);
    facts.race = id ? id[1] : base;
    const unitNames = /\bunitNames:\s*\{/.exec(source);
    if (unitNames) {
      facts.unitNamesStart = unitNames.index;
      facts.unitNamesEnd = closingBrace(source, unitNames.index);
    }
  }
  const faction = /gw_faction_(\d+)\.js$/.exec(rel);
  if (faction) {
    facts.faction = Number(faction[1]);
  }
  if (base === "unit_names") {
    facts.unitNames = true;
  }
  return facts;
}

function closingBrace(source, from) {
  let depth = 0;
  for (let i = source.indexOf("{", from); i < source.length; i += 1) {
    if (source[i] === "{") {
      depth += 1;
    } else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return source.length;
}

const CARD_MARKERS = [
  ["summarize", "card-name"],
  ["describe", "card-description"],
  ["lockedHint(", "card-hint"],
  ["hint:", "card-hint"],
  ["name:", "card-name"],
  ["description:", "card-description"],
];

function lastIndexIn(window, marker) {
  return window.lastIndexOf(marker);
}

function jsRole(facts, source, index) {
  const window = source.slice(Math.max(0, index - ROLE_WINDOW), index);
  if (facts.card) {
    let best = null;
    for (const [marker, role] of CARD_MARKERS) {
      const at = lastIndexIn(window, marker);
      if (at >= 0 && (!best || at > best.at)) {
        best = { at: at, role: role, marker: marker };
      }
    }
    if (best && best.marker === "description:") {
      const hintAt = Math.max(
        lastIndexIn(window, "hint:"),
        lastIndexIn(window, "lockedHint(")
      );
      const otherAt = Math.max(
        lastIndexIn(window, "summarize"),
        lastIndexIn(window, "describe")
      );
      if (hintAt > otherAt) {
        return "card-hint";
      }
    }
    return best ? best.role : "loc-call";
  }
  if (facts.faction !== undefined && /character:\s*$/.test(window)) {
    return "faction-character";
  }
  if (facts.race) {
    if (
      facts.unitNamesStart !== undefined &&
      index > facts.unitNamesStart &&
      index < facts.unitNamesEnd
    ) {
      return "race-unit-name";
    }
    if (/\bname:\s*$/.test(window)) {
      return "race-name";
    }
  }
  if (facts.unitNames && /\bname:\s*$/.test(window)) {
    return "unit-name";
  }
  if (/tooltip:\s*$/.test(window)) {
    return "tooltip";
  }
  return "loc-call";
}

function htmlRole(source, index) {
  const window = source.slice(Math.max(0, index - 200), index);
  if (/tooltip:\s*$/.test(window)) {
    return "tooltip";
  }
  if (/placeholder\s*[=:]\s*$/.test(window)) {
    return "placeholder";
  }
  return "loc-call";
}

// The `vars` object bound to a __x__ placeholder: the object literal that
// follows the string as loc()'s second argument, when there is one.
function placeholderArgs(key, statement) {
  if (!/__\w+__/.test(key)) {
    return undefined;
  }
  const args = /,\s*(\{[\s\S]*?\})\s*\)/.exec(statement);
  return args ? squash(args[1]) : undefined;
}

function contextFor(facts, key, snippet) {
  const context = {};
  if (facts.card) {
    context.card = facts.card;
  }
  if (facts.race) {
    context.race = facts.race;
  }
  if (facts.faction !== undefined) {
    context.faction = facts.faction;
  }
  const args = placeholderArgs(key, snippet);
  if (args) {
    context.args = args;
  }
  return context;
}

function addSite(map, key, site) {
  if (!map.has(key)) {
    map.set(key, { sites: [] });
  }
  map.get(key).sites.push(site);
}

function scanLiterals(map, facts, source, isHtml) {
  LOC_LITERAL.lastIndex = 0;
  let match;
  while ((match = LOC_LITERAL.exec(source)) !== null) {
    const key = unescapeLiteral(match[2], match[1]).trim();
    if (!key) {
      continue;
    }
    const start = match.index;
    const end = start + match[0].length;
    const role = isHtml
      ? htmlRole(source, start)
      : jsRole(facts, source, start);
    if (EXCLUDED_ROLES.includes(role)) {
      continue;
    }
    const snippet = squash(
      isHtml ? htmlElement(source, start) : jsStatement(source, start, end)
    );
    addSite(map, key, {
      file: facts.file,
      line: lineAt(source, start),
      role: role,
      snippet: snippet,
      context: contextFor(facts, key, snippet),
    });
  }
}

// Comments are blanked with newlines kept, so a `<loc>` mentioned in prose is
// not read as a tag and line numbers stay the file's own.
function withoutComments(source) {
  return source.replace(HTML_COMMENT, (comment) =>
    comment.replace(/[^\n]/g, " ")
  );
}

function scanTags(map, facts, html) {
  const source = withoutComments(html);
  LOC_TAG.lastIndex = 0;
  let match;
  while ((match = LOC_TAG.exec(source)) !== null) {
    const id = /\bdata-loc-id\s*=\s*"([^"]*)"/.exec(match[1]);
    const key = (
      id ? id[1] : decodeEntities(match[2].replace(/<[^>]*>/g, ""))
    ).trim();
    if (!key) {
      continue;
    }
    addSite(map, key, {
      file: facts.file,
      line: lineAt(source, match.index),
      role: "html-label",
      snippet: squash(htmlElement(source, match.index + 1)),
      context: contextFor(facts, key, match[0]),
    });
  }
}

// Card names and descriptions of the same card, so a translator sees the
// pair together; the site's own key is left out.
function addSiblings(map) {
  const byCard = new Map();
  for (const [key, entry] of map) {
    for (const site of entry.sites) {
      if (!site.context.card) {
        continue;
      }
      if (!byCard.has(site.context.card)) {
        byCard.set(site.context.card, { names: [], descriptions: [] });
      }
      const card = byCard.get(site.context.card);
      if (site.role === "card-name" && !card.names.includes(key)) {
        card.names.push(key);
      }
      if (
        site.role === "card-description" &&
        !card.descriptions.includes(key)
      ) {
        card.descriptions.push(key);
      }
    }
  }
  for (const [key, entry] of map) {
    for (const site of entry.sites) {
      const card = site.context.card && byCard.get(site.context.card);
      if (!card) {
        continue;
      }
      const names = card.names.filter((name) => name !== key);
      const descriptions = card.descriptions.filter((text) => text !== key);
      if (names.length) {
        site.context.cardNames = names;
      }
      if (descriptions.length) {
        site.context.cardDescriptions = descriptions;
      }
    }
  }
}

function sourceFiles() {
  return walkFiles(UI_ROOT, (name) =>
    SOURCE_EXTENSIONS.includes(path.extname(name))
  )
    .filter((file) => !file.startsWith(TRANSLATIONS_DIR + path.sep))
    .sort();
}

// Map<key, { sites: [{ file, line, role, snippet, context }] }>, sites in
// file-then-line order.
function extractKeys() {
  const map = new Map();
  for (const file of sourceFiles()) {
    const source = fs.readFileSync(file, "utf8");
    const facts = fileFacts(file, source);
    const isHtml = path.extname(file) === ".html";
    scanLiterals(map, facts, source, isHtml);
    if (isHtml) {
      scanTags(map, facts, source);
    }
  }
  for (const entry of map.values()) {
    entry.sites.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
  }
  addSiblings(map);
  return map;
}

function sortedKeys(iterable) {
  return Array.from(iterable).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

module.exports = {
  CATALOG_LOCALE,
  MOD_ID,
  PA_LOCALES,
  SHIPPED_LOCALES,
  TRANSLATIONS_DIR,
  extractKeys,
  sortedKeys,
};
