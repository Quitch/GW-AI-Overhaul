"use strict";

// shared/coop_ai_cards.js: how a co-op AI player values a card by what it does
// to its inventory, and what it does with a hand. The weights are tuning, so
// these tests pin orderings and policies rather than numbers. See
// tech-cards.md, "How AI players judge a card".

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const coopAiCards = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

const COMMANDER = "commander";
const cell = (domain, tier, cls) => ({
  domain,
  tier,
  cls,
  key: domain + "/" + tier + "/" + cls,
});

// A bot army: the commander builds factories, a factory builds its domain's
// mobile units.
const CLASSES = {
  commander: cell("Land", "Basic", "Commander"),
  subCommander: cell("Land", "Basic", "Commander"),
  botFactory: cell("Bot", "Basic", "Factory"),
  airFactory: cell("Air", "Basic", "Factory"),
  vehicleFactory: cell("Vehicle", "Basic", "Factory"),
  dox: cell("Bot", "Basic", "Combat"),
  grenadier: cell("Bot", "Basic", "Combat"),
  boom: cell("Bot", "Basic", "Combat"),
  slammer: cell("Bot", "Advanced", "Combat"),
  bumblebee: cell("Air", "Basic", "Combat"),
  hornet: cell("Air", "Basic", "Combat"),
  ant: cell("Vehicle", "Basic", "Combat"),
  leveler: cell("Vehicle", "Basic", "Combat"),
  wall: cell("Land", "Basic", "Defense"),
};
const FACTORY_OF = {
  Bot: "botFactory",
  Air: "airFactory",
  Vehicle: "vehicleFactory",
};
// Files that are no unit's own, and the units that own each: every
// commander, Sub Commanders included, owns the base commander's.
const PARTS = {
  bot_ammo: ["dox", "grenadier"],
  dox_weapon: ["dox"],
  dox_other_weapon: ["dox"],
  base_commander: ["commander", "subCommander"],
};
const ownersOf = (file) => (CLASSES[file] ? [file] : PARTS[file] || []);

const lookup = {
  classOf: (unit) => CLASSES[unit],
  ownersOf,
  ownedBy: (file, unit) => ownersOf(file).includes(unit),
  reachable: (held) =>
    held.filter((unit) => {
      const c = CLASSES[unit];
      if (!c || c.cls !== "Combat") {
        return true;
      }
      return held.includes(FACTORY_OF[c.domain]);
    }),
  obtainable: [
    "botFactory",
    "airFactory",
    "dox",
    "grenadier",
    "boom",
    "slammer",
    "bumblebee",
    "wall",
  ],
};

function inventory(overrides) {
  return Object.assign(
    {
      units: [COMMANDER, "botFactory", "dox"],
      mods: [],
      aiMods: [],
      minions: [],
      maxCards: 4,
      cards: [{ id: "start" }],
    },
    overrides
  );
}

// before plus one card, with the card's own changes.
function withCard(before, changes) {
  const after = JSON.parse(JSON.stringify(before));
  after.cards = after.cards.concat({ id: changes.id || "card" });
  after.units = after.units.concat(changes.units || []);
  after.units = after.units.filter(
    (unit) => !(changes.removeUnits || []).includes(unit)
  );
  after.mods = after.mods.concat(changes.mods || []);
  after.aiMods = after.aiMods.concat(changes.aiMods || []);
  after.minions = after.minions.concat(changes.minions || []);
  after.maxCards += changes.slots || 0;
  return after;
}

const context = (overrides) =>
  Object.assign(
    { lookup, commander: COMMANDER, teamDomains: ["Bot", "Land"] },
    overrides
  );

function score(before, changes, overrides) {
  return coopAiCards.scoreCard(
    before,
    withCard(before, changes),
    context(overrides)
  );
}

describe("effectOf", () => {
  it("lists what a card changed, one for one", () => {
    const mod = { file: "dox", path: "damage", op: "multiply", value: 1.5 };
    const before = inventory({ mods: [mod] });
    const after = withCard(before, {
      units: ["grenadier"],
      removeUnits: ["dox"],
      mods: [mod],
      aiMods: [{ op: "append" }],
      minions: [{ name: "Sub" }],
      slots: 1,
    });

    assert.deepEqual(coopAiCards.effectOf(before, after), {
      addedUnits: ["grenadier"],
      removedUnits: ["dox"],
      addedMods: [mod],
      removedMods: [],
      addedAiMods: 1,
      addedMinions: 1,
      netSlots: 0,
    });
  });
});

describe("modDirection", () => {
  const direction = (op, value, path) =>
    coopAiCards.modDirection({ op, value, path: path || "damage" });

  it("reads a multiplier's gain, and a cost's saving", () => {
    assert.equal(direction("multiply", 1.5), 0.5);
    assert.equal(direction("multiply", 0.5, "build_metal_cost"), 0.5);
    assert.equal(direction("multiply", 1.25, "build_metal_cost"), -0.25);
    assert.equal(direction("multiply", 9), 2);
  });

  it("knows an add's sign and assumes a replace helps", () => {
    assert.ok(direction("add", 100) > 0);
    assert.ok(direction("add", -1, "rate_of_fire") < 0);
    assert.ok(direction("add", -1, "reload_time") > 0);
    assert.equal(direction("add", 0), 0);
    assert.ok(direction("replace", "flame.json") > 0);
  });

  it("reads a cheaper shot as a gain", () => {
    assert.equal(direction("multiply", 0.25, "ammo_per_shot"), 0.75);
  });
});

describe("scoreCard orderings", () => {
  // A factory card is worth the held units it makes buildable.
  it("values a factory by the units it opens", () => {
    const noFactory = inventory({ units: [COMMANDER, "dox", "grenadier"] });
    const factory = score(noFactory, { units: ["botFactory"] });
    const unreachable = score(noFactory, { units: ["bumblebee"] });

    assert.ok(factory.unlock > unreachable.unlock, JSON.stringify(factory));
    assert.ok(factory.total > unreachable.total);
  });

  it("values a unit for a new domain above one more of a held cell", () => {
    const base = inventory({ units: [COMMANDER, "botFactory", "dox"] });
    const air = score(base, { units: ["airFactory", "bumblebee"] });
    const moreBots = score(base, { units: ["grenadier"] });
    assert.ok(air.total > moreBots.total);
  });

  it("values a domain no teammate fields above one they do", () => {
    const base = inventory();
    const alone = score(
      base,
      { units: ["airFactory", "bumblebee"] },
      {
        teamDomains: ["Bot", "Land"],
      }
    );
    const shared = score(
      base,
      { units: ["airFactory", "bumblebee"] },
      {
        teamDomains: ["Bot", "Land", "Air"],
      }
    );
    assert.ok(alone.total > shared.total);
  });

  // Bot damage beats air damage for a bot AI: a stat mod is worth the
  // fielded units it touches.
  it("values a stat mod by the fielded units it touches", () => {
    const base = inventory({ units: [COMMANDER, "botFactory", "dox"] });
    const bots = score(base, {
      mods: [{ file: "dox", path: "damage", op: "multiply", value: 1.5 }],
    });
    const air = score(base, {
      mods: [{ file: "bumblebee", path: "damage", op: "multiply", value: 1.5 }],
    });
    const shared = score(base, {
      mods: [{ file: "bot_ammo", path: "damage", op: "multiply", value: 1.5 }],
    });

    assert.ok(bots.mods > 0);
    assert.equal(air.mods, 0);
    assert.ok(bots.total > air.total);
    // The shared ammo is the Dox's too; the Grenadier is not held.
    assert.equal(shared.mods, bots.mods);
  });

  it("does not discount a stat the AI already buffs", () => {
    const mod = { file: "dox", path: "damage", op: "multiply", value: 1.5 };
    const fresh = score(inventory(), { mods: [mod] });
    const stacked = score(inventory({ mods: [mod] }), { mods: [mod] });
    assert.ok(stacked.mods >= fresh.mods && fresh.mods > 0);
  });

  // A unit it could get later is worth a stat mod too, though less.
  it("values a buff to fielded units above one to units it may field later", () => {
    const health = (file) => ({
      file,
      path: "max_health",
      op: "multiply",
      value: 1.5,
    });
    const fielded = score(inventory(), { mods: [health("dox")] });
    const later = score(inventory(), { mods: [health("grenadier")] });

    assert.ok(fielded.total > later.total, JSON.stringify(later));
    assert.equal(later.mods, 0);
    assert.ok(later.later > 0);
  });

  it("adds nothing later for a unit the inventory strips", () => {
    const before = inventory();
    const after = withCard(before, {
      mods: [
        { file: "grenadier", path: "max_health", op: "multiply", value: 1.5 },
      ],
    });
    after.strippedUnits = ["grenadier"];

    assert.equal(coopAiCards.scoreCard(before, after, context()).later, 0);
  });

  // A family-wide card is bounded: its later units decay within their cell,
  // counting on from the units fielded there.
  it("values each further later unit of a cell less", () => {
    const health = (...files) =>
      files.map((file) => ({
        file,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      }));
    const one = score(inventory(), { mods: health("grenadier") });
    const two = score(inventory(), { mods: health("grenadier", "boom") });
    const emptyCell = score(inventory(), { mods: health("bumblebee") });

    assert.ok(two.later > one.later && two.later < 2 * one.later);
    assert.ok(emptyCell.later > one.later);
  });

  it("counts one change written into several of a unit's files once", () => {
    const rateOfFire = (file) => ({
      file,
      path: "rate_of_fire",
      op: "multiply",
      value: 2,
    });
    const once = score(inventory(), { mods: [rateOfFire("dox_weapon")] });
    const twice = score(inventory(), {
      mods: [rateOfFire("dox_weapon"), rateOfFire("dox_other_weapon")],
    });
    assert.equal(twice.mods, once.mods);
  });

  // Held tech makes the AI build around it: the same card is worth more on
  // the domain it has buffed. Vehicles are the focus, so bots and air differ
  // in name alone.
  it("values an unlock and a stat card more on the domain its tech buffs", () => {
    const twins = inventory({
      units: [
        COMMANDER,
        "botFactory",
        "airFactory",
        "vehicleFactory",
        "dox",
        "bumblebee",
        "ant",
        "leveler",
      ],
    });
    const buffed = inventory({
      units: twins.units,
      mods: [{ file: "bot_ammo", path: "damage", op: "multiply", value: 1.5 }],
    });
    const team = { teamDomains: ["Air", "Bot", "Land", "Vehicle"] };
    const health = (file) => ({
      mods: [{ file, path: "max_health", op: "multiply", value: 1.5 }],
    });

    assert.equal(
      score(twins, { units: ["grenadier"] }, team).total,
      score(twins, { units: ["hornet"] }, team).total
    );
    assert.equal(
      score(twins, health("dox"), team).total,
      score(twins, health("bumblebee"), team).total
    );

    const botUnlock = score(buffed, { units: ["grenadier"] }, team);
    const botStat = score(buffed, health("dox"), team);
    assert.ok(
      botUnlock.total > score(buffed, { units: ["hornet"] }, team).total
    );
    assert.ok(botStat.total > score(buffed, health("bumblebee"), team).total);
    // The boost is before's on both sides, so a stat card unlocks nothing.
    assert.equal(botStat.unlock, 0);
  });

  it("values a commander buff, and counts a commander debuff against a card", () => {
    const buff = score(inventory(), {
      mods: [
        {
          file: "base_commander",
          path: "max_health",
          op: "multiply",
          value: 2,
        },
      ],
    });
    const debuff = score(inventory(), {
      mods: [
        {
          file: "base_commander",
          path: "passive_health_regen",
          op: "add",
          value: -15,
        },
      ],
    });
    assert.ok(buff.mods > 0);
    assert.ok(debuff.mods < 0);
  });

  it("counts a commander card once for each commander, Sub Commanders included", () => {
    const mod = {
      file: "base_commander",
      path: "max_health",
      op: "multiply",
      value: 2,
    };
    const alone = score(inventory(), { mods: [mod] });
    const withSubs = score(
      inventory({
        minions: [{ commander: "subCommander" }, { commander: "subCommander" }],
      }),
      { mods: [mod] }
    );
    assert.equal(withSubs.mods, 3 * alone.mods);
  });

  it("values a Sub Commander more once the commander is buffed", () => {
    const minion = { minions: [{ commander: "subCommander" }] };
    const plain = score(inventory(), minion);
    const buffed = score(
      inventory({
        mods: [
          {
            file: "base_commander",
            path: "max_health",
            op: "multiply",
            value: 2,
          },
        ],
      }),
      minion
    );
    assert.ok(buffed.minions > plain.minions && plain.minions > 0);
  });

  it("values each further Sub Commander less", () => {
    const first = score(inventory(), { minions: [{ name: "a" }] });
    const third = score(inventory({ minions: [{}, {}] }), {
      minions: [{ name: "c" }],
    });
    assert.ok(first.minions > third.minions && third.minions > 0);
  });

  it("prices a slot by how full the bank is", () => {
    const emptyBank = score(inventory({ maxCards: 8 }), {});
    const fullBank = score(inventory({ maxCards: 2 }), {});
    const slotCard = score(inventory({ maxCards: 2 }), { slots: 1 });

    assert.ok(emptyBank.slots < 0 && fullBank.slots < emptyBank.slots);
    assert.equal(slotCard.slots, 0);
  });

  it("scores a card that removes held units below nothing", () => {
    const removal = score(
      inventory({ units: [COMMANDER, "botFactory", "dox", "grenadier"] }),
      {
        removeUnits: ["grenadier"],
      }
    );
    assert.ok(removal.unlock < 0);
  });

  // A card whose effect shows only in battle keeps a floor by its own deal
  // weight; one that names units yet changed none is worth nothing.
  it("floors a card with no effect to see by its deal chance", () => {
    const battleOnly = score(inventory(), {}, { chance: 50 });
    const namesUnits = score(inventory(), {}, { namesUnits: true, chance: 50 });
    const unlikely = score(inventory(), {}, { chance: 10 });

    assert.ok(battleOnly.floor > unlikely.floor && unlikely.floor > 0);
    assert.equal(namesUnits.floor, 0);
    assert.ok(namesUnits.total < 0);
  });
});

describe("teamDomains", () => {
  it("lists the domains the players field with factories, fighters and fabbers", () => {
    assert.deepEqual(
      coopAiCards.teamDomains(
        [
          { units: [COMMANDER, "botFactory", "dox"], commander: COMMANDER },
          { units: ["wall"], commander: COMMANDER },
        ],
        lookup
      ),
      ["Bot"]
    );
  });

  // A fighter nobody can build fields nothing.
  it("counts only units the player can reach", () => {
    assert.deepEqual(
      coopAiCards.teamDomains(
        [{ units: [COMMANDER, "bumblebee"], commander: COMMANDER }],
        lookup
      ),
      []
    );
  });

  it("reads a player with no units as fielding nothing", () => {
    assert.deepEqual(coopAiCards.teamDomains([{}], lookup), []);
  });
});

describe("scoreCard's deal chance", () => {
  // Finding a card's chance costs a deal() call, so it is asked for only when
  // the effect shows nothing.
  it("asks for the chance only for a card with no effect to see", () => {
    let asked = 0;
    const chance = () => {
      asked += 1;
      return 50;
    };
    const before = inventory();

    score(before, { units: ["airFactory"] }, { chance });
    assert.equal(asked, 0);

    const floored = score(before, {}, { chance });
    assert.equal(asked, 1);
    assert.equal(floored.floor, coopAiCards.WEIGHTS.floor / 2);
  });
});

describe("scoreCard's held tech", () => {
  // Every card of a hand is judged against the same inventory, whose held
  // mods can run to hundreds of files.
  it("works out the held tech once per inventory on a shared memo", () => {
    let asked = 0;
    const counting = Object.assign({}, lookup, {
      ownersOf: (file) => {
        asked += file === "bot_ammo" ? 1 : 0;
        return ownersOf(file);
      },
    });
    const before = inventory({
      mods: [{ file: "bot_ammo", path: "damage", op: "multiply", value: 1.5 }],
    });
    const judge = (overrides) => {
      const shared = context(Object.assign({ lookup: counting }, overrides));
      coopAiCards.scoreCard(
        before,
        withCard(before, { units: ["grenadier"] }),
        shared
      );
      coopAiCards.scoreCard(
        before,
        withCard(before, { units: ["airFactory"] }),
        shared
      );
    };

    judge({ memo: {} });
    assert.equal(asked, 1);
    judge({});
    assert.equal(asked, 3);
  });
});

describe("decide", () => {
  const card = (index, total, extra) =>
    Object.assign({ index, id: "card" + index, total }, extra);
  const roomy = () => true;
  const full = () => false;

  it("declines a hand holding a loadout", () => {
    const decision = coopAiCards.decide({
      scored: [card(0, 50, { loadout: true })],
      rerollsLeft: 2,
      rerollsUsed: 0,
      fullness: 0,
      roomFor: roomy,
    });
    assert.deepEqual(decision, { action: "decline", reason: "loadout" });
  });

  it("rerolls a weak hand while a reroll remains", () => {
    const decision = coopAiCards.decide({
      scored: [card(0, 1), card(1, 2)],
      rerollsLeft: 1,
      rerollsUsed: 0,
      fullness: 0,
      roomFor: roomy,
    });
    assert.equal(decision.action, "reroll");
    assert.equal(decision.best, 2);
    assert.equal(decision.threshold, coopAiCards.rerollThreshold(0, 0));
  });

  // The bar falls with each reroll spent, and rises as the bank fills.
  it("asks less of each later hand, and more of a fuller bank", () => {
    assert.ok(
      coopAiCards.rerollThreshold(0, 1) < coopAiCards.rerollThreshold(0, 0)
    );
    assert.ok(
      coopAiCards.rerollThreshold(1, 0) > coopAiCards.rerollThreshold(0, 0)
    );
  });

  it("takes the best card once the rerolls are spent", () => {
    const decision = coopAiCards.decide({
      scored: [card(0, 1), card(1, 2)],
      rerollsLeft: 0,
      rerollsUsed: 2,
      fullness: 0,
      roomFor: roomy,
    });
    assert.deepEqual(decision, { action: "take", index: 1, best: 2 });
  });

  it("declines a hand worth less than a slot", () => {
    const decision = coopAiCards.decide({
      scored: [card(0, -1), card(1, 0)],
      rerollsLeft: 0,
      rerollsUsed: 2,
      fullness: 0,
      roomFor: roomy,
    });
    assert.equal(decision.action, "decline");
  });

  it("swaps out the weakest held card for one worth clearly more", () => {
    const held = [card(1, 9), card(2, 3), card(3, 20)];
    const swap = coopAiCards.decide({
      scored: [card(0, 12)],
      rerollsLeft: 0,
      rerollsUsed: 2,
      fullness: 1,
      roomFor: full,
      held: held,
    });
    assert.deepEqual(swap, {
      action: "swap",
      index: 0,
      deleteIndex: 2,
      deleteId: "card2",
      best: 12,
    });

    const close = coopAiCards.decide({
      scored: [card(0, 4)],
      rerollsLeft: 0,
      rerollsUsed: 2,
      fullness: 1,
      roomFor: full,
      held: held,
    });
    assert.deepEqual(close, { action: "decline", reason: "bank full" });
  });

  it("breaks a tie the same way from the same stream", () => {
    const pick = () =>
      coopAiCards.decide({
        scored: [card(0, 5), card(1, 5), card(2, 5)],
        rerollsLeft: 0,
        rerollsUsed: 0,
        fullness: 0,
        roomFor: roomy,
        rng: gwoRng.create("tie"),
      }).index;
    assert.equal(pick(), pick());
  });

  it("declines an empty hand", () => {
    assert.deepEqual(coopAiCards.decide({ scored: [] }), {
      action: "decline",
      reason: "no cards",
    });
  });
});

describe("describeHand / describeLoadouts", () => {
  const parts = {
    unlock: 4,
    mods: 1.5,
    later: 0.3,
    minions: 0,
    aiMods: 0.5,
    slots: -0.5,
    floor: 0,
  };
  const scored = [
    Object.assign({ index: 0, id: "gwc_a", total: 5 }, parts),
    Object.assign({ index: 1, id: "gwc_b", total: 2 }, parts),
  ];

  it("formats one line per hand, every card and the action", () => {
    const line = coopAiCards.describeHand({
      name: "Sorian",
      deal: 3,
      star: 7,
      via: "specs",
      scored: scored,
      decision: { action: "take", index: 0 },
    });
    assert.equal(
      line,
      "[GW COOP AI] Sorian deal=3 star=7 hand=2 via=specs offered: " +
        "gwc_a=5 (unlock 4 mods 1.5 later 0.3 minions 0 aiMods 0.5 slots -0.5 floor 0), " +
        "gwc_b=2 (unlock 4 mods 1.5 later 0.3 minions 0 aiMods 0.5 slots -0.5 floor 0) -> took gwc_a"
    );
  });

  it("names each action", () => {
    const action = (decision) =>
      coopAiCards
        .describeHand({
          name: "S",
          deal: 1,
          star: 1,
          via: "groups",
          scored: scored,
          decision: decision,
        })
        .split(" -> ")[1];

    assert.equal(
      action({ action: "reroll", best: 2, threshold: 4 }),
      "reroll (best 2 < threshold 4)"
    );
    assert.equal(
      action({ action: "swap", index: 1, deleteId: "gwc_old" }),
      "deleted gwc_old took gwc_b"
    );
    assert.equal(
      action({ action: "decline", reason: "bank full" }),
      "declined (bank full)"
    );
  });

  it("formats the starting loadout's candidates", () => {
    assert.equal(
      coopAiCards.describeLoadouts({
        name: "Sorian",
        via: "specs",
        scored: scored,
        chosen: "gwc_a",
      }),
      "[GW COOP AI] Sorian loadout via=specs candidates: " +
        "gwc_a=5 (unlock 4 mods 1.5 later 0.3 minions 0 aiMods 0.5 slots -0.5 floor 0), " +
        "gwc_b=2 (unlock 4 mods 1.5 later 0.3 minions 0 aiMods 0.5 slots -0.5 floor 0) -> chose gwc_a"
    );
  });
});
