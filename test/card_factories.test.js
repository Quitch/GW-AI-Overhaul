"use strict";

// Unit tests for shared/card_factories.js, the anti-tech and cooldown families.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const SHARED = "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/";
const factories = loadCouiModule(SHARED + "card_factories.js");
const gwoCard = loadCouiModule(SHARED + "cards.js");
const gwoGroup = loadCouiModule(SHARED + "unit_groups.js");

const CONTRACT = [
  "audio",
  "buff",
  "deal",
  "describe",
  "dull",
  "getContext",
  "icon",
  "summarize",
  "visible",
];

function inventory(units, cardIds) {
  const mods = [];
  return {
    mods,
    units: () => units || [],
    cards: () => (cardIds || []).map((id) => ({ id })),
    hasCard: (id) => (cardIds || []).includes(id),
    addMods: (list) => mods.push(...list),
  };
}

function assertContract(card, base, audio) {
  assert.deepEqual(Object.keys(card).sort(), CONTRACT);
  assert.equal(card.visible(), true);
  assert.equal(card.summarize(), base.name);
  assert.equal(card.describe(), base.description);
  assert.equal(card.icon(), base.icon);
  assert.deepEqual(card.audio(), { found: audio });
  assert.equal(card.getContext, gwoCard.getContext);
  assert.equal(card.dull(), undefined);
}

describe("antiTechCard", () => {
  const base = {
    name: "!LOC:Anti-Air Ammo Tech",
    description: "!LOC:Doubles damage to air.",
    icon: "icon.png",
    counter: "gwaio_anti_orbital",
    armour: { AT_Orbital: 0.5, AT_Air: 2 },
  };

  it("returns the full card contract", () => {
    assertContract(
      factories.antiTechCard(base),
      base,
      "/VO/Computer/gw/board_tech_available_ammunition"
    );
  });

  it("multiplies every ammo spec's armour entries in the order given", () => {
    const inv = inventory();
    factories.antiTechCard(base).buff(inv);
    assert.deepEqual(
      inv.mods,
      gwoCard.flatMapMods(gwoGroup.ammo, "multiplyOrCreate", {
        "armor_damage_map.AT_Orbital": 0.5,
        "armor_damage_map.AT_Air": 2,
      })
    );
  });

  it("deals at 40, halved by another anti card, and not against its counter", () => {
    const card = factories.antiTechCard(base);
    assert.deepEqual(card.deal({}, {}, inventory()), { chance: 40 });
    assert.deepEqual(card.deal({}, {}, inventory([], ["gwaio_anti_bots"])), {
      chance: 20,
    });
    assert.deepEqual(card.deal({}, {}, inventory([], ["gwaio_anti_orbital"])), {
      chance: 0,
    });
  });

  it("takes a function of the inventory, star and context", () => {
    const seen = [];
    const star = { name: "star" };
    const context = { totalSize: 9 };
    const inv = inventory();
    const computed = factories.antiTechCard(
      Object.assign(
        {
          chance: function () {
            seen.push(Array.from(arguments));
            return 30;
          },
        },
        base
      )
    );
    assert.equal(computed.deal(star, context, inv).chance, 30);
    assert.deepEqual(seen, [[inv, star, context]]);
  });
});

describe("cooldownCard", () => {
  const base = {
    name: "!LOC:Air Cooldown Tech",
    description: "!LOC:Halves the cooldown.",
    icon: "icon.png",
    audio: "/VO/Computer/gw/board_tech_available_air",
    factories: ["air_factory.json", "air_factory_adv.json"],
  };

  it("returns the full card contract", () => {
    assertContract(factories.cooldownCard(base), base, base.audio);
  });

  it("halves factory_cooldown_time on each factory", () => {
    const inv = inventory();
    factories.cooldownCard(base).buff(inv);
    assert.deepEqual(inv.mods, [
      {
        file: "air_factory.json",
        path: "factory_cooldown_time",
        op: "multiply",
        value: 0.5,
      },
      {
        file: "air_factory_adv.json",
        path: "factory_cooldown_time",
        op: "multiply",
        value: 0.5,
      },
    ]);
  });

  it("deals at 70 while any of the factories is held", () => {
    const card = factories.cooldownCard(base);
    assert.deepEqual(card.deal({}, {}, inventory(["air_factory_adv.json"])), {
      chance: 70,
    });
    assert.deepEqual(card.deal({}, {}, inventory(["bot_factory.json"])), {
      chance: 0,
    });
  });

  it("gates on requires in place of the factories", () => {
    const card = factories.cooldownCard(
      Object.assign({ requires: "air_factory_adv.json" }, base)
    );
    assert.equal(card.deal({}, {}, inventory(["air_factory.json"])).chance, 0);
    assert.equal(
      card.deal({}, {}, inventory(["air_factory_adv.json"])).chance,
      70
    );
  });

  it("throws on a chance that is not a function, 0 included", () => {
    for (const chance of [0, 10]) {
      const card = factories.cooldownCard(Object.assign({ chance }, base));
      assert.throws(
        () => card.deal({}, {}, inventory(["air_factory.json"])),
        TypeError
      );
    }
  });

  it("takes a function of the inventory, star and context", () => {
    const star = { distance: () => 4 };
    const context = { totalSize: 9 };
    const computed = factories.cooldownCard(
      Object.assign(
        {
          chance: (inv, system, ctx) =>
            inv.units().length + system.distance() + ctx.totalSize,
        },
        base
      )
    );
    assert.equal(
      computed.deal(star, context, inventory(["air_factory.json"])).chance,
      14
    );
  });
});
