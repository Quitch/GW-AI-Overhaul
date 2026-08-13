"use strict";

// The surface third-party card mods build against, pinned in one place.
//
// The sibling New-GW-Cards template (Quitch/New-GW-Cards) ships this API in its
// README and card templates, so a rename here breaks every mod written from it -
// silently, because a card that reads a helper GWO no longer exports just gets
// undefined. Every gap this file guards against was a real regression: a global
// stopped being read, a bank stopped being consulted, an argument was added to
// deal(). None of them failed loudly, so none of them were caught.
//
// Changing anything asserted here means updating New-GW-Cards in step. See
// CLAUDE.md, "The third-party card mod API".

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { loadCouiModule, REPO_ROOT } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const MOD_ROOT = "ui/mods/com.pa.quitch.gwaioverhaul";

const gwoCard = loadCouiModule("coui://" + MOD_ROOT + "/shared/cards.js");
const gwoUnit = loadCouiModule("coui://" + MOD_ROOT + "/shared/units.js");
const gwoGroup = loadCouiModule(
  "coui://" + MOD_ROOT + "/shared/unit_groups.js"
);
const gwoDeal = loadCouiModule("coui://" + MOD_ROOT + "/shared/deal.js");
const helpers = loadCouiModule(
  "coui://" + MOD_ROOT + "/gw_play/cards_deal_helpers.js"
);

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

function source(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

// Each modder-facing global, and the file that reads it. Several live in scene
// scripts that cannot be loaded under Node - they are not AMD modules and touch
// the engine at top level - so those are checked structurally instead. The guard
// is the contract: GWO must adopt whatever a mod already put there rather than
// assigning over it.
const GLOBALS = [
  ["gwoCards", MOD_ROOT + "/shared/deal.js"],
  ["gwoCardsToUnits", MOD_ROOT + "/gw_play/card_tooltips.js"],
  ["gwoCardsWithoutTooltip", MOD_ROOT + "/gw_play/card_tooltips.js"],
  ["gwoCardsGrantingAdvancedTech", MOD_ROOT + "/gw_play/cards.js"],
  ["gwoNewStartCards", MOD_ROOT + "/shared/loadouts.js"],
  ["gwoStartingCards", MOD_ROOT + "/shared/loadouts.js"],
  ["gwoSpecs", MOD_ROOT + "/gw_play/referee_game_files.js"],
  [
    "gwoSpecs",
    "ui/main/game/galactic_war/gw_play/gw_per_player_tech_referee.js",
  ],
  ["gwoLoadoutBanks", MOD_ROOT + "/shared/loadout_banks.js"],
];

describe("the modder globals are adopted, not overwritten", () => {
  for (const [name, file] of GLOBALS) {
    it(`${name} is guarded in ${path.basename(file)}`, () => {
      // Whitespace-tolerant: Prettier wraps the longer names across lines.
      const guard = new RegExp("_\\.isArray\\(\\s*model\\." + name + "\\s*\\)");
      assert.match(
        source(file),
        guard,
        `${file} must keep its _.isArray guard on model.${name} - a bare ` +
          "assignment would discard whatever a mod registered before GWO ran"
      );
    });
  }

  // gwoStarCardsWhichBreakAllies is read rather than seeded, so it has no
  // assignment guard - GWO never creates this one, which is why New-GW-Cards'
  // loader has to. setup.js hands the global to startCardBreaksAllies, whose
  // behaviour test lives with ai_scaling.
  it("gwoStarCardsWhichBreakAllies is read from the mod's own array", () => {
    assert.match(
      source(MOD_ROOT + "/gw_start/setup.js"),
      /startCardBreaksAllies\(\s*[\s\S]*?model\.gwoStarCardsWhichBreakAllies/
    );
    const scaling = loadCouiModule(
      "coui://" + MOD_ROOT + "/shared/ai_scaling.js"
    );
    assert.equal(
      scaling.startCardBreaksAllies("mod_card", ["mod_card"]),
      true,
      "a modder-registered loadout id must reach the ally-compatibility check"
    );
  });
});

describe("a mod's tech cards reach the deck", () => {
  it("setupGwoCards keeps ids a mod pushed onto model.gwoCards", () => {
    setGlobal("model", { gwoCards: ["mym_damage_bots"] });

    const deck = gwoDeal.setupGwoCards();

    assert.ok(deck.includes("mym_damage_bots"), "the mod's card is undealable");
    assert.ok(deck.includes("gwc_damage_bots"), "GWO's own are still dealt");
  });

  it("setupGwoCards copes with the global being absent", () => {
    setGlobal("model", {});

    assert.ok(gwoDeal.setupGwoCards().length > 0);
  });
});

describe("a mod's cards can grant advanced tech", () => {
  it("hasT2Access honours ids a mod added", () => {
    setGlobal("model", {
      gwoCardsGrantingAdvancedTech: ["mym_enable_bots_all"],
    });
    const inventory = { cards: () => [{ id: "mym_enable_bots_all" }] };

    assert.equal(gwoCard.hasT2Access(inventory), true);
  });
});

// Named individually rather than by diffing the whole export, so adding a helper
// stays free while removing or renaming one fails.
const CARD_HELPERS = [
  "anyPlayerHasCard",
  "antiTechDeal",
  "applyDulls",
  "commanderWeight",
  "conditionalDeal",
  "farForSize",
  "getAllConnectedPlayerCards",
  "getContext",
  "hasAllUnits",
  "hasT2Access",
  "hasUnit",
  "loadoutIcon",
  "missingAllUnits",
  "missingUnit",
  "mods",
  "navalWeight",
  "startCard",
  "subcommanderWeight",
  "travelledFar",
  "travelledModerate",
  "travelledShort",
  "uniqueValue",
  "upgradeDeal",
  "withSlot",
];

describe("shared/cards.js publishes the documented helpers", () => {
  for (const name of CARD_HELPERS) {
    it(`gwoCard.${name} is a function`, () => {
      assert.equal(
        typeof gwoCard[name],
        "function",
        `New-GW-Cards documents gwoCard.${name}`
      );
    });
  }
});

// The key names are the published half. A path may be re-pointed whenever the
// base game moves a file, but renaming a key breaks every card naming it.
const UNIT_IDS = [
  "antAmmo",
  "antWeapon",
  "aresStomp",
  "aresStompAmmo",
  "boom",
  "botFactoryAdvanced",
  "dox",
  "doxWeapon",
];

const GROUP_IDS = [
  "botsBasicMobile",
  "factoriesAdvanced",
  "navalMobile",
  "structuresDefencesAdvanced",
];

describe("the unit and group ids cards are written against", () => {
  for (const name of UNIT_IDS) {
    it(`gwoUnit.${name} resolves to a spec path`, () => {
      assert.equal(typeof gwoUnit[name], "string");
      assert.ok(gwoUnit[name].endsWith(".json"));
    });
  }

  for (const name of GROUP_IDS) {
    it(`gwoGroup.${name} resolves to a list of units`, () => {
      assert.ok(Array.isArray(gwoGroup[name]));
      assert.ok(gwoGroup[name].length > 0);
    });
  }
});

describe("the deal signature", () => {
  it("hands a card the star, context, inventory and rng", async () => {
    setGlobal("$", createFakeJQuery());
    const seen = {};
    const inventory = { cards: () => [] };
    const rng = { pick: (list) => list[0] };
    const card = {
      id: "c",
      getContext: (galaxy) => ({ totalSize: galaxy.size }),
      deal: (star, context, cardInventory, cardRng) => {
        seen.star = star;
        seen.context = context;
        seen.inventory = cardInventory;
        seen.rng = cardRng;
        return { chance: 1 };
      },
    };

    await gwoDeal.dealCard(
      {
        id: "c",
        star: { name: "a star" },
        galaxy: { size: 9 },
        inventory: inventory,
        rng: rng,
      },
      { then: (callback) => callback() },
      [card]
    );

    assert.deepEqual(seen.star, { name: "a star" });
    assert.deepEqual(seen.context, { totalSize: 9 });
    assert.equal(seen.inventory, inventory, "must be the passed inventory");
    assert.equal(seen.rng, rng);
  });

  it("copies a deal's params onto the dealt card", async () => {
    setGlobal("$", createFakeJQuery());

    const product = await gwoDeal.dealCard(
      { id: "c" },
      { then: (callback) => callback() },
      [
        {
          id: "c",
          deal: () => ({ chance: 1, params: { allowOverflow: true } }),
        },
      ]
    );

    assert.equal(product.allowOverflow, true);
  });
});

describe("loadout id prefixes", () => {
  // New-GW-Cards tells authors to use a mod-specific prefix containing _start_
  // and never beginning gwc_start. Both halves of that rule live here.
  it("treats any id containing _start_ as a loadout", () => {
    assert.equal(helpers.isStartLoadoutCardId("mym_start_one"), true);
    assert.equal(helpers.isStartLoadoutCardId("gwaio_start_ceo"), true);
    assert.equal(helpers.isStartLoadoutCardId("gwc_start_bot"), true);
    assert.equal(helpers.isStartLoadoutCardId("mym_damage_bots"), false);
  });

  it("reserves the gwc_start prefix for the base game", () => {
    const treasure = loadCouiModule(
      "coui://" + MOD_ROOT + "/gw_play/treasure_loadouts.js"
    );

    assert.equal(treasure.isBaseLoadoutCardId("gwc_start_bot"), true);
    assert.equal(treasure.isBaseLoadoutCardId("mym_start_one"), false);
  });
});
