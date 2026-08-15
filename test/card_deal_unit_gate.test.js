"use strict";

// A card offered to a player who owns none of the units it affects is invisible
// waste: the dealer spends a hand slot and a system's reward on it, the tooltip
// greys out every unit it names, and nothing in-game reports it. So a card must be
// dealable only if the player can own something it affects - because the units are
// in gwc_start's guaranteed set, because deal() gates on owning them, or because
// the card's own buff() grants them, which is what the gwc_enable_* unlock cards
// do. See tech-cards.md.
//
// "The units it affects" is gw_play/card_units.js, the same list the tooltip shows.
// Guarding what the UI already claims is the point: if the entry is wrong, the
// tooltip is wrong too.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadCouiModule, REPO_ROOT } = require("../scripts/lib/amd-loader.js");
const {
  CARDS_DIR,
  cardIdFromFile,
  grantedUnits,
  loadAllCards,
  makeInventory,
  maxChance,
  starterUnits,
} = require("../scripts/lib/card-probe.js");

const { byFile, unloadable } = loadAllCards();

const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);
const gwoCardsToUnits = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/card_units.js"
);
const loadoutIds = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_ids.js"
);

// Coverage floors. Raise them when coverage genuinely rises; never lower one to
// make a run pass - the same rule cards-contract.js's MIN_CHECKED carries, for the
// same reason. A card that quietly stopped being probed is the failure this exists
// to catch.
const MIN_PROBED = 190;
// The one with no analogue in cards-contract.js, and the important one. Without it
// a broken gw_common stub that made every deal() return 0 would leave MIN_PROBED
// intact and every assertion below vacuously green.
const MIN_DEALABLE = 169;

// Cards with no card_units.js entry that are neither a loadout nor listed in
// gwoCardsWithoutTooltip. Shaped like KNOWN_UNLOADABLE: an id and the reason it is
// out of scope, so the exclusion is argued rather than assumed.
const NOT_IN_A_DECK = {
  gwc_start:
    "the base card every loadout is buffed through, not a dealable card - " +
    "its deal is _.constant(false) and it is in no deck",
};

// A card that is gated on holding another card, or on more than the units it
// affects, is legitimately undealable to a player who owns only those units.
const GATED_BEYOND_ITS_UNITS = {
  gwaio_speed_structure:
    "gated on holding gwaio_start_nomad - the mobility mods do nothing without it",
  gwaio_upgrade_leveler:
    "gated on the Unit Cannon as well as the Leveler, the card being about " +
    "making the Leveler cannon-loadable",
  gwaio_upgrade_planetaryradar:
    "gated on holding gwaio_enable_planetaryradar, the only card that grants " +
    "the Deep Space Radar",
};

// Units outside a card's affected set that legitimately make it dealable. Each is
// already explained by a comment on that card's own card_units.js entry.
const OPENED_BY_UNRELATED_UNITS = {
  gwaio_upgrade_colonel: {
    units: [gwoUnit.clusterCeoColonel],
    reason:
      "the CEO Commander's cloned Colonel is upgraded by the same card, but is " +
      "a Cluster-only copy the tooltip does not list",
  },
  gwc_damage_air: {
    units: [gwoUnit.airFabber, gwoUnit.airFabberAdvanced, gwoUnit.pelican],
    reason:
      "gated on owning any air unit, but only ammo carriers are affected - the " +
      "fabbers and the Pelican carry none",
  },
  gwc_damage_bots: {
    units: [
      gwoUnit.botFabber,
      gwoUnit.botFabberAdvanced,
      gwoUnit.stitch,
      gwoUnit.mend,
    ],
    reason: "as gwc_damage_air: the bot fabbers carry no ammo",
  },
  gwc_damage_vehicles: {
    units: [
      gwoUnit.vehicleFabber,
      gwoUnit.vehicleFabberAdvanced,
      gwoUnit.nyx,
      gwoUnit.ward,
    ],
    reason: "as gwc_damage_air: the vehicle fabbers and the Nyx carry no ammo",
  },
};

const CARD_FILES = fs
  .readdirSync(CARDS_DIR)
  .filter((file) => file.endsWith(".js"))
  .sort();

// card_tooltips.js is a self-invoking scene script that reaches for model.game()
// at load, so its list is read out of the source rather than by loading it - the
// same approach modder_api.test.js takes to the scene scripts it pins.
function cardsWithoutTooltip() {
  const source = fs.readFileSync(
    path.join(
      REPO_ROOT,
      "ui",
      "mods",
      "com.pa.quitch.gwaioverhaul",
      "gw_play",
      "card_tooltips.js"
    ),
    "utf8"
  );
  const block = /model\.gwoCardsWithoutTooltip\.push\(([\s\S]*?)\);/.exec(
    source
  );
  assert.ok(
    block,
    "could not find the model.gwoCardsWithoutTooltip.push call in card_tooltips.js"
  );
  return new Set([...block[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]));
}

const NO_TOOLTIP = cardsWithoutTooltip();
const LOADOUTS = new Set(loadoutIds.all);

const affectedById = new Map(
  gwoCardsToUnits.cards.map((entry) => [
    entry.id,
    new Set((entry.units || []).filter((unit) => typeof unit === "string")),
  ])
);

const STARTER = starterUnits(byFile, gwoUnit);

// Every unit spec the mod names. A card gating on something outside its own
// affected set is what the drift check looks for, so the candidate list has to be
// everything, not the card's own neighbourhood.
const EVERY_UNIT = [
  ...new Set(
    Object.values(gwoUnit).filter(
      (value) => typeof value === "string" && value.endsWith(".json")
    )
  ),
];

const STARTER_ONLY = makeInventory([...STARTER]);

// Everything a card can be asked about, resolved once: what it affects, what it
// grants itself, and the balance of the two - the units it must therefore gate on.
const probed = [];
for (const file of CARD_FILES) {
  const id = cardIdFromFile(file);
  const card = byFile.get(file);
  const affected = affectedById.get(id);
  if (!card || !affected) {
    continue;
  }

  const granted = grantedUnits(card, gwoUnit);
  const gated = [...affected].filter((unit) => !granted.has(unit));
  const owningEverything = makeInventory([
    ...new Set([...STARTER, ...affected]),
  ]);

  probed.push({
    id,
    affected,
    gated,
    chanceOwningEverything: maxChance(card, owningEverything),
    chanceOwningNothing: maxChance(card, STARTER_ONLY),
    card,
  });
}

describe("every shipped card is accounted for", () => {
  it("classifies each card as probed, a loadout, tooltip-less or argued", () => {
    const unclassified = CARD_FILES.filter((file) => {
      const id = cardIdFromFile(file);
      return (
        !affectedById.has(id) &&
        !LOADOUTS.has(id) &&
        !NO_TOOLTIP.has(id) &&
        !Object.prototype.hasOwnProperty.call(NOT_IN_A_DECK, id) &&
        !unloadable.includes(file)
      );
    });
    assert.deepEqual(
      unclassified,
      [],
      "a new card with no card_units.js entry is invisible to this guard - give " +
        "it one, or argue it into NOT_IN_A_DECK"
    );
  });

  it("finds the tooltip-less list it partitions on", () => {
    // A Prettier reflow of that push() call is the likeliest way this guard rots:
    // the regex would match nothing, the bucket would empty, and cards would
    // quietly move into NOT_IN_A_DECK's residual instead of failing.
    assert.ok(NO_TOOLTIP.size >= 20, NO_TOOLTIP.size + " ids parsed");
  });

  it("has a shipped card behind all but the base game's own entries", () => {
    // card_tooltips.js only console.warns on an id it cannot resolve, so a typo in
    // card_units.js silently drops that card's tooltip in-game. These eight are
    // base-game cards GWO does not override, each marked "not used" in the file.
    const shipped = new Set(CARD_FILES.map(cardIdFromFile));
    const orphans = [...affectedById.keys()].filter((id) => !shipped.has(id));
    assert.deepEqual(orphans, [
      "gwc_enable_air_t2",
      "gwc_enable_bots_t2",
      "gwc_enable_orbital_t1",
      "gwc_enable_orbital_t2",
      "gwc_enable_sea_t1",
      "gwc_enable_sea_t2",
      "gwc_enable_super_weapons",
      "gwc_enable_vehicles_t2",
    ]);
  });
});

describe("the sweep is live", () => {
  it("probes every card that declares the units it affects", () => {
    assert.ok(probed.length >= MIN_PROBED, probed.length + " cards probed");
  });

  it("reaches a real chance for most of them", () => {
    const dealable = probed.filter(
      (entry) => entry.chanceOwningEverything > 0
    ).length;
    assert.ok(dealable >= MIN_DEALABLE, dealable + " cards reached a chance");
  });
});

describe("no card is offered to a player who owns none of its units", () => {
  it("gates every card whose units the player is not given at the start", () => {
    const offered = probed
      .filter(
        (entry) =>
          entry.gated.length > 0 &&
          !entry.gated.some((unit) => STARTER.has(unit)) &&
          entry.chanceOwningNothing > 0
      )
      .map((entry) => entry.id + " (chance " + entry.chanceOwningNothing + ")");

    assert.deepEqual(
      offered,
      [],
      "these cards affect nothing a starting player owns, yet can still be dealt"
    );
  });
});

describe("a card is offered once its units are owned", () => {
  // The converse, and what catches a gate that tests the wrong unit: a card that
  // stays at zero for a player who owns everything it affects can only be reading
  // something it does not affect.
  it("has no gate that its own units cannot satisfy", () => {
    const unreachable = probed
      .filter(
        (entry) =>
          entry.gated.length > 0 &&
          entry.chanceOwningEverything === 0 &&
          !Object.prototype.hasOwnProperty.call(
            GATED_BEYOND_ITS_UNITS,
            entry.id
          )
      )
      .map((entry) => entry.id);

    assert.deepEqual(
      unreachable,
      [],
      "these cards are never offered even to a player owning every unit they " +
        "affect - the gate is reading a different unit"
    );
  });
});

describe("no unit outside a card's affected set makes it dealable", () => {
  it("gates on the units it affects and no others", () => {
    const drifted = [];

    for (const entry of probed) {
      // Only meaningful for a card that is genuinely unit-gated: it must be
      // dealable to an owner and not to a non-owner before "what else opens it"
      // is a question worth asking.
      if (
        entry.gated.length === 0 ||
        entry.chanceOwningEverything === 0 ||
        entry.chanceOwningNothing !== 0
      ) {
        continue;
      }

      const allowed = OPENED_BY_UNRELATED_UNITS[entry.id];
      const openers = EVERY_UNIT.filter((unit) => {
        if (entry.affected.has(unit) || STARTER.has(unit)) {
          return false;
        }
        if (allowed && allowed.units.includes(unit)) {
          return false;
        }
        return maxChance(entry.card, makeInventory([...STARTER, unit])) > 0;
      });

      if (openers.length) {
        drifted.push(entry.id + " <- " + openers.join(", "));
      }
    }

    assert.deepEqual(
      drifted,
      [],
      "owning these units makes the card dealable, but the card does not affect them"
    );
  });
});
