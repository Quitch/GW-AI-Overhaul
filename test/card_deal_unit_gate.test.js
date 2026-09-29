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
const { listCardFiles } = require("../scripts/lib/card-files.js");
const {
  cardIdFromFile,
  grantedUnits,
  loadAllCards,
  makeInventory,
  maxChance,
  starterUnits,
} = require("../scripts/lib/card-probe.js");

const { byFile } = loadAllCards();

const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);
const gwoGroup = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js"
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
// The sweeps below read two things per card, the units it gates on and the
// chances it reaches, and these two floors keep each from emptying unseen. A
// grantedUnits that over-reported would leave no card a unit to gate on, and
// each sweep would skip every card.
const MIN_GATED = 177;
// A gw_common stub that made every deal() return 0 fails this. It fails the
// converse sweep too, but that sweep reads only cards with a unit to gate on.
const MIN_DEALABLE = 169;

// Cards with no card_units.js entry that are neither a loadout nor listed in
// gwoCardsWithoutTooltip: an id and the reason it is out of scope, so the
// exclusion is argued rather than assumed.
const NOT_IN_A_DECK = {
  gwc_start:
    "the base card every loadout is buffed through, not a dealable card - " +
    "its deal is _.constant(false) and it is in no deck",
  gwaio_start_ceo:
    "a retired loadout, dropped from loadout_ids.js but kept on disk so a war " +
    "started on it still resumes",
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

// Unlock cards that are not offered to a starting player, and the units that
// open each. An unlock card's buff grants every unit its entry names, so it has
// none to gate on; these wait for a unit that builds what they grant. The
// probe holds no cards, so a card that grants advanced tech, their other
// route, is advanced_fabber_gates.test.js's.
const UNLOCKS_WAITING_FOR_A_BUILDER = {
  gwc_enable_defenses_t2: {
    units: gwoGroup.fabbersAdvanced,
    reason: "advanced fabricators build the advanced defences",
  },
  gwaio_enable_planetaryradar: {
    units: gwoGroup.fabbersAdvanced,
    reason: "advanced fabricators build the Planetary Radar",
  },
  gwc_enable_titans: {
    units: gwoGroup.fabbersAdvanced.concat(gwoUnit.orbitalFactory),
    reason:
      "advanced fabricators build titans, and so does the orbital " +
      "fabricator, whose route also asks for the orbital factory",
  },
};

const CARD_FILES = listCardFiles();

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
        !Object.prototype.hasOwnProperty.call(NOT_IN_A_DECK, id)
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

  it("finds a unit to gate on for most of them", () => {
    const gated = probed.filter((entry) => entry.gated.length > 0).length;
    assert.ok(gated >= MIN_GATED, gated + " cards have a unit to gate on");
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

// The sweeps skip a card with no unit to gate on: an unlock card, whose buff
// grants every unit its entry names. It exists to be offered to a player who
// owns none of them.
describe("an unlock card is offered to a player who owns none of its units", () => {
  it("offers every unlock card to a starting player", () => {
    const withheld = probed
      .filter(
        (entry) =>
          entry.gated.length === 0 &&
          entry.chanceOwningNothing === 0 &&
          !Object.prototype.hasOwnProperty.call(
            UNLOCKS_WAITING_FOR_A_BUILDER,
            entry.id
          )
      )
      .map((entry) => entry.id);

    assert.deepEqual(
      withheld,
      [],
      "these unlock cards are never offered to a player who has none of the " +
        "units they grant"
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

// Units a card gates on that do not open it held alone, and why.
const FACTORY_UPGRADE =
  "an upgrade of the factory, dealt to its owner: its entry names the units " +
  "the factory builds because they get cheaper";
const CLUSTER_SUB_COMMANDER =
  "a Cluster player fields it as a Sub Commander, which makes it no air or " +
  "bot player, so the card deals on its *NoCluster group";
const NOT_OPENED_BY_ONE_UNIT = {
  gwaio_upgrade_advancedairfactory: {
    units: gwoGroup.airAdvancedMobile,
    reason: FACTORY_UPGRADE,
  },
  gwaio_upgrade_advancedbotfactory: {
    units: gwoGroup.botsAdvancedMobile,
    reason: FACTORY_UPGRADE,
  },
  gwaio_upgrade_advancednavalfactory: {
    units: gwoGroup.navalAdvancedMobile,
    reason: FACTORY_UPGRADE,
  },
  gwaio_upgrade_advancedvehiclefactory: {
    units: gwoGroup.vehiclesAdvancedMobile,
    reason: FACTORY_UPGRADE,
  },
  gwaio_upgrade_orbitalfactory: {
    units: gwoGroup.orbitalAdvancedMobile,
    reason: FACTORY_UPGRADE,
  },
};
for (const id of [
  "gwc_combat_air",
  "gwc_cost_air",
  "gwc_damage_air",
  "gwc_health_air",
  "gwc_speed_air",
]) {
  NOT_OPENED_BY_ONE_UNIT[id] = {
    units: [gwoUnit.angel],
    reason: CLUSTER_SUB_COMMANDER,
  };
}
for (const id of [
  "gwc_combat_bots",
  "gwc_cost_bots",
  "gwc_damage_bots",
  "gwc_health_bots",
  "gwc_speed_bots",
]) {
  NOT_OPENED_BY_ONE_UNIT[id] = {
    units: [gwoUnit.colonel],
    reason: CLUSTER_SUB_COMMANDER,
  };
}

describe("a card is offered for any one of its units", () => {
  // Owning every unit a card affects satisfies a gate that reads only some of
  // them, so each unit is also held alone.
  it("is opened by each unit it gates on, held alone", () => {
    const closed = [];

    for (const entry of probed) {
      // As in the drift sweep below: only a card dealable to an owner and not
      // to a non-owner has a gate to test one unit at a time.
      if (
        entry.gated.length === 0 ||
        entry.chanceOwningEverything === 0 ||
        entry.chanceOwningNothing !== 0
      ) {
        continue;
      }

      const argued = NOT_OPENED_BY_ONE_UNIT[entry.id];
      const units = entry.gated.filter(
        (unit) =>
          !(argued && argued.units.includes(unit)) &&
          maxChance(entry.card, makeInventory([...STARTER, unit])) === 0
      );

      if (units.length) {
        closed.push(entry.id + " <- " + units.join(", "));
      }
    }

    assert.deepEqual(
      closed,
      [],
      "the card affects each of these units, yet owning one alone does not " +
        "make it dealable"
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

  // Everything that opens an unlock card is outside its set, as it grants
  // every unit it affects. So it must be exactly the units argued for it.
  it("opens an unlock card that waits only on the units argued for it", () => {
    for (const [id, argued] of Object.entries(UNLOCKS_WAITING_FOR_A_BUILDER)) {
      const entry = probed.find((candidate) => candidate.id === id);
      assert.ok(entry, id + " is not probed");

      const openers = EVERY_UNIT.filter(
        (unit) =>
          !STARTER.has(unit) &&
          maxChance(entry.card, makeInventory([...STARTER, unit])) > 0
      );

      assert.deepEqual(openers.sort(), [...argued.units].sort(), id);
    }
  });
});

// A card whose buff grants every unit its entry names has nothing in `gated`, so
// the sweeps above skip it. Boom Upgrade Tech grants the Lob and loads it with
// the player's Booms, whose tagged spec exists only while the Boom is held
// (specs.md, "Writing a spec reference"), so it deals on the Boom. Its entry
// names the Boom too, which keeps it inside the sweeps.
describe("Boom Upgrade Tech", () => {
  it("names the Boom its deal needs, so the sweeps probe it", () => {
    const entry = probed.find(
      (candidate) => candidate.id === "gwaio_upgrade_boom"
    );

    assert.ok(
      maxChance(entry.card, makeInventory([...STARTER, gwoUnit.boom])) > 0
    );
    assert.deepEqual(entry.gated, [gwoUnit.boom]);
  });
});
