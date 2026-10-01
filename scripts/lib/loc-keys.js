"use strict";

// Every key GWO's ui/ tree asks the game to translate, with where and how it
// is used. The i18n:* scripts and validate:translations all read the tree
// through this one walk, so the catalog, the missing lists and the validator
// agree on what a key is. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");
const espree = require("espree");

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
const CONTROL_TAG = /<(option|input)\b/gi;
const OPTION_END = /<\/?(?:option|optgroup|select|datalist)\b/gi;
const ATTRIBUTE = /([^\s=]+)(?:\s*=\s*(["'])([\s\S]*?)\2)?/g;
const LETTER = /\p{L}/u;
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
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10);
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
  const back = statementStart(source, start);
  const to = statementEnd(source, end, back.outward);
  return source.slice(back.from, to);
}

// Backwards from `start` to the statement's opening: past balanced brackets,
// counting the unbalanced openers (`outward`) the forward scan must close.
function statementStart(source, start) {
  let depth = 0;
  let outward = 0;
  let from = start;
  while (from > 0) {
    const ch = source[from - 1];
    const quoted = inString(source, from - 1);
    if (!quoted && (ch === ")" || ch === "]")) {
      depth += 1;
    } else if (!quoted && (ch === "(" || ch === "[")) {
      if (depth === 0) {
        outward += 1;
      } else {
        depth -= 1;
      }
    } else if (!quoted && depth === 0 && ";{},".includes(ch)) {
      break;
    }
    from -= 1;
  }
  const opener = /\b(\w+)\s*:\s*function\s*\([^)]*\)\s*\{\s*$/.exec(
    source.slice(Math.max(0, from - 120), from)
  );
  if (opener) {
    from -= opener[0].length;
  }
  return { from: from, outward: outward };
}

// Forwards from `end` to the statement's close: past balanced brackets and
// the `outward` openers still to close, stopping after the `;` or `,`.
function statementEnd(source, end, outward) {
  let depth = 0;
  let open = outward;
  let to = end;
  while (to < source.length) {
    const ch = source[to];
    if (ch === "(" || ch === "[" || ch === "{") {
      depth += 1;
    } else if (ch === ")" || ch === "]" || ch === "}") {
      if (depth === 0 && open === 0) {
        break;
      }
      if (depth === 0) {
        open -= 1;
      } else {
        depth -= 1;
      }
    } else if (depth === 0 && open === 0 && (ch === ";" || ch === ",")) {
      to += 1;
      break;
    }
    to += 1;
  }
  return to;
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
  const openEnd = tagEnd(source, open);
  if (!tag || openEnd >= source.length) {
    return source.slice(open, index + 100);
  }
  const close = source.indexOf("</" + tag[1] + ">", openEnd);
  const nextOpen = source.indexOf("<" + tag[1], openEnd);
  if (close >= 0 && (nextOpen < 0 || close < nextOpen)) {
    return source.slice(open, close + tag[1].length + 3);
  }
  return source.slice(open, openEnd + 1);
}

function fileFacts(file, source) {
  const rel = relative(file);
  const base = path.basename(file, path.extname(file));
  const facts = { file: rel, base: base };
  if (rel.includes("/galactic_war/cards/")) {
    facts.card = base;
  }
  // An add-on descriptor has the same shape as a race's: its name and its
  // unit names take the race roles.
  if (rel.includes("/race/") || rel.includes("/addon/")) {
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

const CARD_PROPERTIES = {
  summarize: "card-name",
  name: "card-name",
  describe: "card-description",
  description: "card-description",
};

// Map<offset, ancestors>: each string literal by where it starts, with the
// nodes around it, innermost first.
function stringLiterals(source) {
  const ast = espree.parse(source, {
    ecmaVersion: "latest",
    sourceType: "script",
    range: true,
  });
  const literals = new Map();
  const stack = [];
  const visit = (node) => {
    if (node.type === "Literal" && typeof node.value === "string") {
      literals.set(node.range[0], stack.slice().reverse());
    }
    stack.push(node);
    for (const key of espree.VisitorKeys[node.type]) {
      for (const child of [node[key]].flat()) {
        if (child) {
          visit(child);
        }
      }
    }
    stack.pop();
  };
  visit(ast);
  return literals;
}

function calleeName(node) {
  if (node.type !== "CallExpression") {
    return undefined;
  }
  const callee = node.callee;
  if (callee.type === "MemberExpression" && !callee.computed) {
    return callee.property.name;
  }
  return callee.type === "Identifier" ? callee.name : undefined;
}

function propertyKey(node) {
  if (node.type !== "Property" || node.computed) {
    return undefined;
  }
  return node.key.type === "Identifier" ? node.key.name : node.key.value;
}

// A card literal's role, from the property it is the value of. A card's spec
// mods carry a unit's own display_name and description, not the card's: the
// innermost call around the literal is mods() or a …Mods() helper.
function cardRole(ancestors) {
  if (!ancestors) {
    return "loc-call";
  }
  const call = ancestors.find((node) => node.type === "CallExpression");
  if (call && /^mods$|Mods$/.test(calleeName(call) || "")) {
    return "loc-call";
  }
  if (
    ancestors.some(
      (node) =>
        propertyKey(node) === "hint" || calleeName(node) === "lockedHint"
    )
  ) {
    return "card-hint";
  }
  for (const node of ancestors) {
    const key = propertyKey(node);
    if (Object.hasOwn(CARD_PROPERTIES, key)) {
      return CARD_PROPERTIES[key];
    }
  }
  return "loc-call";
}

// A race file's literal: a unit name inside its unitNames block, else the
// race's own name; undefined when neither.
function raceRole(facts, window, index) {
  if (
    facts.unitNamesStart !== undefined &&
    index > facts.unitNamesStart &&
    index < facts.unitNamesEnd
  ) {
    return "race-unit-name";
  }
  return /\bname:\s*$/.test(window) ? "race-name" : undefined;
}

function jsRole(facts, source, index, cardLiterals) {
  if (cardLiterals) {
    return cardRole(cardLiterals.get(index));
  }
  const window = source.slice(Math.max(0, index - ROLE_WINDOW), index);
  if (facts.faction !== undefined && /character:\s*$/.test(window)) {
    return "faction-character";
  }
  const race = facts.race && raceRole(facts, window, index);
  if (race) {
    return race;
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

function scanLiterals(map, facts, source, isHtml, options) {
  const cardLiterals =
    facts.card && path.extname(facts.file) === ".js"
      ? stringLiterals(source)
      : undefined;
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
      : jsRole(facts, source, start, cardLiterals);
    if (!options.keepExcluded && EXCLUDED_ROLES.includes(role)) {
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

// Repeated until stable: one pass over `<<b>i>` leaves a new `<i>` behind.
function withoutTags(text) {
  let stripped = text;
  let previous;
  do {
    previous = stripped;
    stripped = stripped.replace(/<[^<>]*>/g, "");
  } while (stripped !== previous);
  return stripped;
}

function scanTags(map, facts, html) {
  const source = withoutComments(html);
  LOC_TAG.lastIndex = 0;
  let match;
  while ((match = LOC_TAG.exec(source)) !== null) {
    const id = /\bdata-loc-id\s*=\s*"([^"]*)"/.exec(match[1]);
    const key = (id ? id[1] : decodeEntities(withoutTags(match[2]))).trim();
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

// The `>` that closes the open tag scanned from `from`; a quoted attribute
// value may hold a `>` of its own.
function tagEnd(source, from) {
  let quote = null;
  for (let at = from; at < source.length; at += 1) {
    const ch = source[at];
    if (quote) {
      quote = ch === quote ? null : quote;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === ">") {
      return at;
    }
  }
  return source.length;
}

// An open tag's attributes by lower-cased name, values decoded and a bare
// attribute reading "". The first of a repeated name wins, as in the browser.
// Prettier quotes every value in GWO's HTML.
function attributes(text) {
  const attrs = {};
  ATTRIBUTE.lastIndex = 0;
  let match;
  while ((match = ATTRIBUTE.exec(text)) !== null) {
    const name = match[1].toLowerCase();
    if (!Object.hasOwn(attrs, name)) {
      attrs[name] = decodeEntities(match[3] || "");
    }
  }
  return attrs;
}

// An <option>'s text runs to the next tag that ends it, closing or not.
function optionText(source, from) {
  OPTION_END.lastIndex = from;
  const end = OPTION_END.exec(source);
  return decodeEntities(
    withoutTags(source.slice(from, end ? end.index : source.length))
  );
}

// What locTree looks up for the control, as [role, text] pairs, skipping what
// it skips.
function controlTexts(source, from, tag, attrs) {
  if (tag.toLowerCase() === "option") {
    return Object.hasOwn(attrs, "data-noloc")
      ? []
      : [["html-control", optionText(source, from)]];
  }
  const texts = [];
  // locTree skips a button when attr("noloc") is truthy, and a bare noloc
  // reads "".
  if ((attrs.type || "").toLowerCase() === "button" && !attrs.noloc) {
    texts.push(["html-control", attrs.value || ""]);
  }
  // A placeholder is skipped by data-noloc, as an option is.
  if (
    Object.hasOwn(attrs, "placeholder") &&
    !Object.hasOwn(attrs, "data-noloc")
  ) {
    texts.push(["placeholder", attrs.placeholder]);
  }
  return texts;
}

// Stock locTree also looks up an <option>'s text, an input[type=button]'s
// value, and an input[placeholder]'s value, as they stand. See
// docs/translations.md, "Tooling".
function scanControls(map, facts, html) {
  const source = withoutComments(html);
  CONTROL_TAG.lastIndex = 0;
  let match;
  while ((match = CONTROL_TAG.exec(source)) !== null) {
    const end = tagEnd(source, CONTROL_TAG.lastIndex);
    const attrs = attributes(source.slice(CONTROL_TAG.lastIndex, end));
    const texts = controlTexts(source, end + 1, match[1], attrs);
    CONTROL_TAG.lastIndex = end;
    for (const [role, text] of texts) {
      addControl(map, facts, source, match.index, role, text.trim());
    }
  }
}

function addControl(map, facts, source, index, role, key) {
  if (!LETTER.test(key)) {
    return;
  }
  const snippet = squash(htmlElement(source, index + 1));
  addSite(map, key, {
    file: facts.file,
    line: lineAt(source, index),
    role: role,
    snippet: snippet,
    context: contextFor(facts, key, snippet),
  });
}

// Card names and descriptions of the same card, so a translator sees the
// pair together; the site's own key is left out.
function addSiblings(map) {
  const byCard = cardKeys(map);
  for (const [key, entry] of map) {
    for (const site of entry.sites) {
      const card = site.context.card && byCard.get(site.context.card);
      if (card) {
        noteSiblings(site, card, key);
      }
    }
  }
}

// Map<card, { names, descriptions }>: each card's name and description keys.
function cardKeys(map) {
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
      const list = {
        "card-name": card.names,
        "card-description": card.descriptions,
      }[site.role];
      if (list && !list.includes(key)) {
        list.push(key);
      }
    }
  }
  return byCard;
}

function noteSiblings(site, card, key) {
  const names = card.names.filter((name) => name !== key);
  const descriptions = card.descriptions.filter((text) => text !== key);
  if (names.length) {
    site.context.cardNames = names;
  }
  if (descriptions.length) {
    site.context.cardDescriptions = descriptions;
  }
}

function sourceFiles() {
  return walkFiles(UI_ROOT, (name) =>
    SOURCE_EXTENSIONS.includes(path.extname(name))
  )
    .filter((file) => !file.startsWith(TRANSLATIONS_DIR + path.sep))
    .sort(codeUnitCompare);
}

// Map<key, { sites: [{ file, line, role, snippet, context }] }>, sites in
// file-then-line order. `options.keepExcluded` keeps the EXCLUDED_ROLES
// sites, and the keys seen only there.
function extractKeys(options) {
  return extractFrom(
    sourceFiles().map((file) => ({
      file: file,
      source: fs.readFileSync(file, "utf8"),
    })),
    options
  );
}

// extractKeys over `sources`: [{ file, source }], each `file` absolute.
function extractFrom(sources, options) {
  const map = new Map();
  for (const { file, source } of sources) {
    const facts = fileFacts(file, source);
    const isHtml = path.extname(file) === ".html";
    scanLiterals(map, facts, source, isHtml, options || {});
    if (isHtml) {
      scanTags(map, facts, source);
      scanControls(map, facts, source);
    }
  }
  for (const entry of map.values()) {
    entry.sites.sort(
      (a, b) => codeUnitCompare(a.file, b.file) || a.line - b.line
    );
  }
  addSiblings(map);
  return map;
}

// UTF-16 code unit order: the same on every machine, unlike localeCompare.
function codeUnitCompare(a, b) {
  if (a < b) {
    return -1;
  }
  return a > b ? 1 : 0;
}

function sortedKeys(iterable) {
  return Array.from(iterable).sort(codeUnitCompare);
}

module.exports = {
  CATALOG_LOCALE,
  codeUnitCompare,
  EXCLUDED_ROLES,
  MOD_ID,
  PA_LOCALES,
  SHIPPED_LOCALES,
  TRANSLATIONS_DIR,
  extractFrom,
  extractKeys,
  sortedKeys,
};
