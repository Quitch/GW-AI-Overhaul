"use strict";

// gw_play/coop_ai_effects.js: what a card does to a co-op AI player's
// inventory, found by applying it through the real shadowed GWInventory with
// real cards. The base-game modules GWInventory reads are stubbed; the cards
// and the bank are the shipped ones. See tech-cards.md, "How AI players judge
// a card".

const { describe, it, before, after, mock } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  installGlobals,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

installGlobals();
const stockBank = {
  addStartCard: () => true,
  hasStartCard: () => false,
};
registerModuleStub("shared/gw_common", {
  balance: {
    initialCardSlots: 4,
    numberOfSystems: [18, 24, 36, 54, 78, 108, 144, 186, 234],
  },
  bank: stockBank,
});
registerModuleStub("shared/gw_bank", stockBank);
registerModuleStub("shared/gw_game_patches", { patch: () => {} });

const stubs = createGlobalStubs();
// As knockout's own: every enumerable property, the prototype's methods
// included, with each observable read. GWInventory.save() is this, so a save
// carries GWInventory's methods, as it does in the game.
const toJS = (target) => {
  const out = {};
  for (const key in target) {
    const value = target[key];
    out[key] =
      typeof value === "function" && value.subscribe
        ? JSON.parse(JSON.stringify(value()))
        : value;
  }
  return out;
};
stubs.setGlobal("ko", {
  observable: makeObservable,
  observableArray: makeObservableArray,
  toJS: toJS,
  toJSON: (target) => JSON.stringify(toJS(target)),
});
stubs.setGlobal("localStorage", { setItem: () => {} });

// Card ids that never answer, as a card mod whose file hangs would.
const hanging = new Set();
stubs.setGlobal("requireGW", (ids, onLoad, onError) => {
  const id = String(ids[0]).replace("cards/", "");
  if (hanging.has(id)) {
    return;
  }
  let card;
  try {
    card = FIXTURE_CARDS[id] || loadCouiModule("cards/" + id);
  } catch (error) {
    onError(error);
    return;
  }
  onLoad(card);
});
after(() => stubs.restoreGlobals());

const GWInventory = loadCouiModule("shared/gw_inventory");
const makeEffects = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js"
);
const coopAiCards = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js"
);
const coopAiUnits = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_units.js"
);
const groups = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_groups.js"
);
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);
const gwoCard = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"
);

// Third-party tech cards as the New-GW-Cards template writes them: one unlocks
// the Slammer and names it nowhere else, so a co-op AI player can only judge it
// by what applying it does; the other throws, as a broken card mod's might.
const fixtureCard = (name, chance, buff) => ({
  visible: () => true,
  summarize: () => "!LOC:" + name,
  describe: () => "!LOC:Fixture.",
  icon: () => "",
  audio: () => ({ found: "/VO/Computer/gw/board_tech_available_bot" }),
  getContext: gwoCard.getContext,
  deal: () => ({ chance }),
  buff,
  dull: () => {},
});
const FIXTURE_CARDS = {
  fixture_coopai_effect: fixtureCard("Fixture Slammer Tech", 60, (inventory) =>
    inventory.addUnits([gwoUnit.slammer])
  ),
  fixture_coopai_throws: fixtureCard("Fixture Broken Tech", 50, () => {
    throw new Error("fixture buff failed");
  }),
};

const COMMANDER = "/pa/units/commanders/imperial_able/imperial_able.json";

// A bot AI's saved inventory: the Bot Commander loadout alone.
const BOT_AI = {
  cards: [{ id: "gwc_start_bot" }],
  tags: { global: { commander: COMMANDER, playerFaction: 0 } },
};

const lookup = coopAiUnits.fromGroups(groups);
const context = (overrides) =>
  Object.assign(
    { lookup, commander: COMMANDER, teamDomains: ["Land"] },
    overrides
  );

let errorMock;
before(() => {
  errorMock = mock.method(console, "error", () => {});
});
after(() => errorMock.mock.restore());

function effects(timeoutMs) {
  return makeEffects({
    GWInventory: GWInventory,
    stockBank: stockBank,
    timeoutMs: timeoutMs || 2000,
  });
}

describe("coop_ai_effects", () => {
  it("applies the AI's saved inventory through the real cards", async () => {
    const applied = await effects().apply(BOT_AI);

    assert.ok(applied.units.includes(gwoUnit.botFactory));
    assert.ok(applied.units.includes(gwoUnit.dox));
    assert.ok(applied.units.includes(COMMANDER));
    assert.equal(applied.maxCards, 5);
  });

  it("serves one apply per distinct inventory", () => {
    const run = effects();
    assert.equal(
      run.apply(BOT_AI),
      run.apply(JSON.parse(JSON.stringify(BOT_AI)))
    );
  });

  // A long war judges thousands of inventories; only the latest are kept.
  it("keeps only the latest applies", async () => {
    const run = effects();
    const variant = (n) => ({
      cards: BOT_AI.cards,
      tags: { global: Object.assign({ n: n }, BOT_AI.tags.global) },
    });

    const first = run.apply(variant(0));
    let last;
    for (let n = 1; n <= makeEffects.MAX_CACHED; n++) {
      last = run.apply(variant(n));
    }
    await last;

    assert.equal(run.apply(variant(makeEffects.MAX_CACHED)), last);
    assert.notEqual(run.apply(variant(0)), first);
  });

  // The AI fields bots, so a bot damage card is worth more to it than an air
  // one, whose units it cannot build.
  it("values bot damage above air damage for a bot AI", async () => {
    const run = effects();
    const [before, bots] = await run.withCard(BOT_AI, {
      id: "gwc_damage_bots",
    });
    const [, air] = await run.withCard(BOT_AI, { id: "gwc_damage_air" });

    const botScore = coopAiCards.scoreCard(before, bots, context());
    const airScore = coopAiCards.scoreCard(before, air, context());
    assert.ok(botScore.mods > 0, JSON.stringify(botScore));
    assert.equal(airScore.mods, 0);
    assert.ok(botScore.total > airScore.total);
  });

  it("judges a third-party card by its effect alone", async () => {
    const [before, after] = await effects().withCard(BOT_AI, {
      id: "fixture_coopai_effect",
    });

    assert.ok(after.units.includes(gwoUnit.slammer));
    assert.ok(coopAiCards.scoreCard(before, after, context()).unlock > 0);
  });

  // GWInventory catches a card's throw and finishes the apply, so a broken
  // card mod shows no effect and keeps only the floor its deal weight earns.
  it("completes an apply whose card throws, and floors the card", async () => {
    const [before, after] = await effects().withCard(BOT_AI, {
      id: "fixture_coopai_throws",
    });
    const score = coopAiCards.scoreCard(before, after, context({ chance: 50 }));

    assert.deepEqual(after.units.sort(), before.units.sort());
    assert.equal(score.unlock, 0);
    assert.ok(score.floor > 0);
  });

  it("gives up on an apply that never finishes, and frees the banks", async () => {
    hanging.add("fixture_hangs");
    const run = effects(50);
    await assert.rejects(
      run.apply({ cards: [{ id: "fixture_hangs" }], tags: {} }),
      /timed out/
    );
    // The hold is gone, and the next apply runs.
    assert.equal(stockBank.addStartCard({ id: "x" }), true);
    const applied = await run.apply(BOT_AI);
    assert.ok(applied.units.length > 0);
  });

  // A save copies GWInventory's methods; an applied inventory must not look
  // like a GWInventory to raceOf or teammates.
  it("hands back plain data, with no GWInventory methods on it", async () => {
    const applied = await effects().apply(BOT_AI);
    const functions = Object.keys(applied).filter(
      (key) => typeof applied[key] === "function"
    );
    assert.deepEqual(functions, []);
    assert.equal(
      typeof GWInventory.prototype.getTag,
      "function",
      "the fixture's GWInventory has methods to leak"
    );
  });

  it("runs one apply at a time", async () => {
    const run = effects();
    const order = [];
    const first = run.apply(BOT_AI).then(() => order.push("bot"));
    const second = run
      .apply({
        cards: [{ id: "gwc_start_air" }],
        tags: BOT_AI.tags,
      })
      .then(() => order.push("air"));
    await Promise.all([first, second]);
    assert.deepEqual(order, ["bot", "air"]);
  });

  it("values a held card by what the inventory loses without it", async () => {
    const saved = {
      cards: [{ id: "gwc_start_bot" }, { id: "gwc_damage_bots" }],
      tags: BOT_AI.tags,
    };
    const [without, withIt] = await effects().withoutCard(saved, 1);
    assert.equal(without.cards.length, 1);
    assert.ok(coopAiCards.scoreCard(without, withIt, context()).mods > 0);
  });

  it("puts a loadout first and a tech card last", () => {
    assert.deepEqual(
      makeEffects.addCard({ cards: [{ id: "a" }] }, { id: "l" }, true).cards,
      [{ id: "l" }, { id: "a" }]
    );
    assert.deepEqual(
      makeEffects.addCard({ cards: [{ id: "a" }] }, { id: "b" }).cards,
      [{ id: "a" }, { id: "b" }]
    );
    assert.deepEqual(
      makeEffects.removeCard({ cards: [{ id: "a" }, { id: "b" }] }, 0).cards,
      [{ id: "b" }]
    );
  });
});
