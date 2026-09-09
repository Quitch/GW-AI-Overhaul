"use strict";

// Writes translations/en-US.json, the catalog: every key the tree asks loc()
// for, with `message` equal to the key and a `description` for translators.
// Hand-edited descriptions survive a rerun; --regenerate overwrites them. Keys
// no longer in the tree are dropped and printed. See docs/translations.md.

const fs = require("node:fs");
const path = require("node:path");

const {
  CATALOG_LOCALE,
  TRANSLATIONS_DIR,
  extractKeys,
  sortedKeys,
} = require("../lib/loc-keys.js");

const CATALOG = path.join(TRANSLATIONS_DIR, CATALOG_LOCALE + ".json");

const SHOWN = [
  ["/galactic_war/cards/", "the Data Bank, card tooltips and the tech deal"],
  ["/gw_faction_", "the faction and enemy Commander panels on the galaxy map"],
  ["/gw_start/", "the war setup screen"],
  ["/gw_play/", "the galaxy map"],
  ["/gw_war_over/", "the war over screen"],
  ["/gw_coop_per_player_loadout/", "the co-op loadout screen"],
  ["/live_game_options_bar/", "the in-battle options bar"],
  ["/live_game", "in battle"],
  ["/shared_build/", "the in-battle build bar"],
  ["/start/", "the main menu"],
  ["/race/", "the race picker, the galaxy map and unit tooltips"],
  ["/faction/", "the galaxy map"],
  ["/shared/", "several Galactic War screens"],
];

const ROLE_RULES = {
  "card-name":
    "Card name; a short title. Keep the stock casing and reuse the game's own term for Tech, Commander and unit names.",
  "card-description":
    "Card text. Keep numbers, percentages, <br> and [strong] exactly; keep unit names as the game's own tables have them.",
  "card-hint":
    "Shown on a locked loadout card in the co-op loadout picker, naming the loadout the player cannot take yet. Same wording as the card name.",
  "faction-character":
    "AI personality trait shown after 'Personality:' on an enemy Commander; a short noun or adjective.",
  "race-name":
    "Race name; a proper noun. Keep untranslated in Latin, Cyrillic and Chinese locales; transliterate in ja/ko as PA's legion.json does.",
  "race-unit-name":
    "Unit display name. Proper-noun policy: keep untranslated in Latin, Cyrillic and Chinese locales; transliterate in ja/ko as PA's legion.json does.",
  "unit-name":
    "Unit display name in the Which Units? list. Use the game's own name for this unit from units.json where one exists.",
  "html-label":
    "Panel label. A trailing colon sits outside the tag; keep the stock casing of the same word elsewhere in the game (CSS down-cases shouty labels).",
  tooltip:
    "Tooltip shown on hover. A full sentence; keep the trailing full stop if the English has one.",
  placeholder: "Placeholder text inside an empty input field.",
  "loc-call":
    "Text shown as-is where the snippet places it. Keep any trailing colon, and match the casing of the stock label it sits beside.",
};

function shownIn(file) {
  for (const [needle, where] of SHOWN) {
    if (file.includes(needle)) {
      return where;
    }
  }
  return "a Galactic War screen";
}

function quote(text) {
  const flat = text.replace(/\s+/g, " ");
  return '"' + (flat.length > 120 ? flat.slice(0, 119) + "…" : flat) + '"';
}

function cardFacts(site) {
  const facts = [];
  if (site.context.card) {
    facts.push("Card " + site.context.card);
  }
  if (site.context.cardNames) {
    facts.push(
      "The card's name reads " + site.context.cardNames.map(quote).join(" / ")
    );
  }
  if (site.context.cardDescriptions && site.role !== "card-description") {
    facts.push(
      "The card's text reads " +
        site.context.cardDescriptions.map(quote).join(" / ")
    );
  }
  return facts;
}

function otherSites(count) {
  if (count <= 0) {
    return "";
  }
  return " and " + count + " other site" + (count > 1 ? "s" : "");
}

// The generated translator note: role, site, where a player sees it, the
// source snippet, the facts the site carries, and the rules for the role.
function describe(key, entry) {
  const site = entry.sites[0];
  const parts = [];
  const others = entry.sites.length - 1;

  parts.push(
    site.role + " in " + site.file + ":" + site.line + otherSites(others) + ".",
    "Shown: " + shownIn(site.file) + ".",
    "Source: `" + site.snippet + "`."
  );

  const facts = cardFacts(site);
  if (site.context.race) {
    facts.push("Race " + site.context.race);
  }
  if (site.context.faction !== undefined) {
    facts.push("Faction " + site.context.faction);
  }
  if (site.context.args) {
    facts.push("Placeholder values come from " + site.context.args);
  }
  if (/__\w+__|\{\d+\}/.test(key)) {
    facts.push("Keep every __x__ and {n} placeholder verbatim");
  }
  if (facts.length) {
    parts.push(facts.join(". ") + ".");
  }
  parts.push(ROLE_RULES[site.role] || ROLE_RULES["loc-call"]);
  return parts.join(" ");
}

function readCatalog() {
  if (!fs.existsSync(CATALOG)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(CATALOG, "utf8"));
}

function main(argv) {
  const regenerate = argv.includes("--regenerate");
  const keys = extractKeys();
  const existing = readCatalog();
  const out = {};
  let kept = 0;
  let generated = 0;

  for (const key of sortedKeys(keys.keys())) {
    const prior = existing[key];
    const description =
      !regenerate && prior && typeof prior.description === "string"
        ? prior.description
        : describe(key, keys.get(key));
    if (description === (prior && prior.description)) {
      kept += 1;
    } else {
      generated += 1;
    }
    out[key] = { message: key, description: description };
  }

  const stale = Object.keys(existing).filter((key) => !keys.has(key));

  fs.mkdirSync(TRANSLATIONS_DIR, { recursive: true });
  fs.writeFileSync(CATALOG, JSON.stringify(out, null, 2) + "\n");

  console.log(
    "i18n:catalog: " +
      Object.keys(out).length +
      " keys written to " +
      path.relative(process.cwd(), CATALOG) +
      " (" +
      kept +
      " descriptions kept, " +
      generated +
      " generated, " +
      stale.length +
      " stale dropped)."
  );
  for (const key of stale) {
    console.log("  dropped: " + key);
  }
}

main(process.argv.slice(2));
