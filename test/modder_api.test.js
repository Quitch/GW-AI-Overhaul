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
// docs/tech-cards.md, "Third-party card mods", and the public-API bullet under
// "Architecture" in CLAUDE.md.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  loadCouiModule,
  registerModuleStub,
  REPO_ROOT,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const MOD_ROOT = "ui/mods/com.pa.quitch.gwaioverhaul";

const gwoCard = loadCouiModule("coui://" + MOD_ROOT + "/shared/cards.js");
const gwoUnit = loadCouiModule("coui://" + MOD_ROOT + "/shared/units.js");
const gwoGroup = loadCouiModule(
  "coui://" + MOD_ROOT + "/shared/unit_groups.js"
);
const gwoDeal = loadCouiModule("coui://" + MOD_ROOT + "/shared/deal.js");
const gwoDecks = loadCouiModule("coui://" + MOD_ROOT + "/shared/decks.js");
const gwoDeckMods = loadCouiModule(
  "coui://" + MOD_ROOT + "/shared/deck_mods.js"
);
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
  ["gwoRaces", MOD_ROOT + "/shared/race_mods.js"],
  ["gwoRaces", MOD_ROOT + "/gw_play/races.js"],
  ["gwoDecks", MOD_ROOT + "/shared/deck_mods.js"],
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
  // loader has to.
  it("gwoStarCardsWhichBreakAllies is read from the mod's own array", () => {
    assert.match(
      source(MOD_ROOT + "/gw_start/setup.js"),
      /_\.isArray\(\s*model\.gwoStarCardsWhichBreakAllies\s*\)/
    );
  });
});

// The battle-preparation screen other mods report into. GW Server Mods calls
// stage() by name, so the shape is pinned here as well as in its own test.
describe("the launch progress API keeps its shape", () => {
  it("launch_progress_state.js exposes begin, stage and end", () => {
    const observable = (value) => () => value;
    const progress = loadCouiModule(
      "coui://" + MOD_ROOT + "/gw_play/launch_progress_state.js"
    )({
      visible: observable(false),
      title: observable(""),
      message: observable(""),
      steps: observable([]),
      labels: { title: "", message: "" },
    });
    for (const name of ["begin", "stage", "end"]) {
      assert.equal(typeof progress[name], "function", name);
    }
    for (const name of ["visible", "title", "message", "steps"]) {
      assert.equal(typeof progress[name], "function", name);
    }
  });

  it("launch_progress.js seeds the observables before the module arrives", () => {
    assert.match(
      source(MOD_ROOT + "/gw_play/launch_progress.js"),
      /model\.gwoLaunchProgress = \{\s*visible: ko\.observable/
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

// A loadout is not a tech card: it never reaches model.gwoCards, so the deck a
// scene deals it from has to come from loadouts.allCards instead. When the co-op
// loadout scene built its deck from setupGwoCards, a mod's loadout was offered in
// the picker and then rejected on Join, and the base game only logged it.
describe("a mod's loadouts reach the list scenes deal from", () => {
  it("allCards keeps ids a mod pushed onto the loadout globals", () => {
    setGlobal("model", {
      gwoStartingCards: [{ id: "mym_start_unlocked" }],
      gwoNewStartCards: [{ id: "mym_start_locked" }],
    });
    // loadouts.js only consults the banks inside startCards(), which this test
    // never calls, so they are stubbed rather than stood up with a fake
    // knockout and localStorage.
    registerModuleStub("shared/gw_common", { bank: {} });
    registerModuleStub("coui://" + MOD_ROOT + "/shared/bank.js", {});

    const loadouts = loadCouiModule(
      "coui://" + MOD_ROOT + "/shared/loadouts.js"
    );
    const ids = loadouts.allCards.map((cardData) => cardData.id);

    assert.ok(
      ids.includes("mym_start_unlocked"),
      "the mod's loadout is undealable"
    );
    assert.ok(
      ids.includes("mym_start_locked"),
      "the mod's loadout is undealable"
    );
    assert.ok(ids.includes("gwc_start_air"), "GWO's own are still dealt");
  });

  it("the co-op loadout scene deals from allCards, not the tech deck", () => {
    const scene = source(
      MOD_ROOT + "/gw_coop_per_player_loadout/gwo_loadouts.js"
    );

    assert.match(scene, /loadouts\.allCards/);
    assert.doesNotMatch(scene, /setupGwoCards/);
  });
});

describe("a mod's decks reach the picker's deal", () => {
  afterEach(() => {
    gwoDecks.reset();
    gwoDeckMods.reset();
  });

  // The two globals are independent registrations, so a deck mod and a card
  // mod need no knowledge of each other's load order: setupGwoCards adopts
  // both, whichever scene script pushed first.
  it("setupGwoCards deals a model.gwoDecks deck and keeps model.gwoCards pushes", () => {
    setGlobal("model", {
      gwoCards: ["mym_damage_bots"],
      gwoDecks: [
        { id: "mym-nomad", name: "!LOC:Nomad", cards: ["mym_card_a"] },
      ],
    });

    const deck = gwoDeal.setupGwoCards({ techCardDeck: "mym-nomad" });

    assert.ok(deck.includes("mym_card_a"), "the deck's card is undealable");
    assert.ok(
      deck.includes("mym_damage_bots"),
      "another mod's gwoCards push must reach a third-party deck too"
    );
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
  "flatMapMods",
  "floodsPlanets",
  "getAllConnectedPlayerCards",
  "getContext",
  "hasAllUnits",
  "hasT2Access",
  "hasUnit",
  "loadout",
  "loadoutIcon",
  "lockedHint",
  "missingAllUnits",
  "missingUnit",
  "mods",
  "navalWeight",
  "eachPath",
  "observerPaths",
  "playerIsCluster",
  "startCard",
  "subcommanderWeight",
  "travelledFar",
  "travelledModerate",
  "travelledShort",
  "uniqueValue",
  "upgradeCard",
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

  for (const name of ["navigation", "damage", "energyWeapon"]) {
    it(`gwoCard.paths.${name} is a list of spec paths`, () => {
      assert.ok(Array.isArray(gwoCard.paths[name]));
      assert.ok(gwoCard.paths[name].length > 0);
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
  "commanderPrimaryWeapons",
  "deathAmmo",
  "factoriesAdvanced",
  "landFactoriesBasic",
  "navalMobile",
  "nomadStructuresLarge",
  "nomadStructuresMedium",
  "nomadStructuresOrbital",
  "nomadStructuresSmall",
  "structuresDefencesAdvanced",
  "vehiclesAdvancedCombat",
  "vehiclesBasicCombat",
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

  it("keeps the plural vehicle combat keys equal to the singular ones", () => {
    assert.deepEqual(gwoGroup.vehiclesBasicCombat, gwoGroup.vehicleBasicCombat);
    assert.deepEqual(
      gwoGroup.vehiclesAdvancedCombat,
      gwoGroup.vehicleAdvancedCombat
    );
  });

  it("lists the Commander's primary weapons as its weapons less the AA", () => {
    assert.deepEqual(
      gwoGroup.commanderPrimaryWeapons,
      gwoGroup.commanderWeapons.filter((w) => w !== gwoUnit.commanderAA)
    );
  });
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
