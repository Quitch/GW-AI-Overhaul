"use strict";

// gw_play/coop_ai_driver.js: a co-op AI player's deals settled on the host,
// in history order, and written one patch per deal. The cards' effects come
// from a fake apply over a small unit table, so each test reads off what the
// AI did rather than the exact scores; the scoring itself is pinned in
// coop_ai_cards.test.js. See coop.md, "AI players' tech".

const {
  describe,
  it,
  after,
  beforeEach,
  afterEach,
  mock,
} = require("node:test");
const assert = require("node:assert/strict");
const _ = require("lodash");

const {
  loadCouiModule,
  installGlobals,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  makeObservable,
  makeObservableArray,
} = require("../scripts/lib/fake-knockout.js");

installGlobals();
// shared/bank.js, behind coop_ai_effects.js, builds its bank at load.
const stubs = createGlobalStubs();
stubs.setGlobal("ko", {
  observable: makeObservable,
  observableArray: makeObservableArray,
});
stubs.setGlobal("localStorage", { setItem: () => {} });
after(() => stubs.restoreGlobals());

const makeDriver = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_driver.js"
);
const coopAiEffects = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_ai_effects.js"
);
const coopAiCards = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/coop_ai_cards.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);
const gwoStreams = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js"
);

const COMMANDER = "/u/commander";

const CELLS = {
  "/u/commander": ["Land", "Basic", "Commander"],
  "/u/bot_factory": ["Bot", "Basic", "Factory"],
  "/u/bot": ["Bot", "Basic", "Combat"],
  "/u/bot_adv": ["Bot", "Advanced", "Combat"],
  "/u/air_factory": ["Air", "Basic", "Factory"],
  "/u/vehicle_factory": ["Vehicle", "Basic", "Factory"],
  "/u/naval_factory": ["Naval", "Basic", "Factory"],
  "/u/orbital_factory": ["Orbital", "Basic", "Factory"],
  "/u/orbital_titan": ["Orbital", "Advanced", "Titan"],
};

// gwc_minion.js's rule, as shared/ai.js reads it, over this unit table.
const LAND_FACTORIES = [
  "/u/bot_factory",
  "/u/air_factory",
  "/u/vehicle_factory",
];
const armyGap = (units) => {
  if (!units.includes("/u/extractor")) {
    return "extractor";
  }
  return LAND_FACTORIES.some((unit) => units.includes(unit))
    ? undefined
    : "landFactory";
};
const armyGapClosable = (gap, stripped) =>
  gap === "landFactory" &&
  !LAND_FACTORIES.every((unit) => (stripped || []).includes(unit));

const LOOKUP = {
  via: "specs",
  classOf: (unit) => {
    const cell = CELLS[unit];
    return (
      cell && {
        domain: cell[0],
        tier: cell[1],
        cls: cell[2],
        key: cell.join("/"),
      }
    );
  },
  ownersOf: (file) => [file],
  ownedBy: (file, unit) => file === unit,
  reachable: (units) => units.slice(),
  obtainable: [],
};

// What each card id does when applied. strips: the units its dull removes.
const EFFECTS = {
  gwc_start_bot: {
    units: ["/u/commander", "/u/extractor", "/u/bot_factory", "/u/bot"],
    maxCards: 3,
  },
  gwc_start: { units: ["/u/commander", "/u/extractor"], maxCards: 3 },
  gwc_start_air: {
    units: ["/u/commander", "/u/extractor", "/u/air_factory"],
    maxCards: 3,
  },
  gwc_start_naval: {
    units: ["/u/commander", "/u/extractor", "/u/naval_factory"],
    maxCards: 3,
  },
  gwc_start_orbital: {
    units: ["/u/commander", "/u/extractor", "/u/orbital_factory"],
    maxCards: 2,
  },
  gwc_start_tourist: {
    units: ["/u/commander", "/u/bot_factory"],
    strips: ["/u/extractor"],
    maxCards: 3,
  },
  gwc_start_grounded: {
    units: ["/u/commander", "/u/extractor", "/u/naval_factory"],
    strips: LAND_FACTORIES,
    maxCards: 3,
  },
  air: { units: ["/u/air_factory"] },
  naval: { units: ["/u/naval_factory"] },
  orbital: { units: ["/u/orbital_factory"] },
  orbital_titan: { units: ["/u/orbital_factory", "/u/orbital_titan"] },
  orbital_air: { units: ["/u/orbital_factory", "/u/air_factory"] },
  bot_armour: {
    mods: [{ file: "/u/bot", path: "max_health", op: "multiply", value: 1.5 }],
  },
  gwc_enable_air_t1: { units: ["/u/air_factory"] },
  gwc_enable_bots_t1: { units: ["/u/bot_factory", "/u/bot"] },
  gwc_enable_vehicles_t1: { units: ["/u/vehicle_factory"] },
  gwc_enable_stripped: { units: ["/u/bot_factory"], strips: LAND_FACTORIES },
  titan_naval: { units: ["/u/orbital_titan", "/u/naval_factory"] },
  titan_air: { units: ["/u/orbital_titan", "/u/air_factory"] },
  gwc_enable_bots_all: { units: ["/u/bot_factory", "/u/bot", "/u/bot_adv"] },
  slot_card: { maxCards: 1 },
};

const applyFake = (saved) => {
  const applied = {
    cards: _.cloneDeep(saved.cards || []),
    tags: _.cloneDeep(saved.tags || {}),
    units: [],
    mods: [],
    aiMods: [],
    minions: [],
    maxCards: 0,
  };
  let strips = [];
  _.forEach(saved.cards, (card) => {
    const effect = EFFECTS[card.id] || {};
    applied.units = _.uniq(applied.units.concat(effect.units || []));
    applied.mods = applied.mods.concat(effect.mods || []);
    applied.maxCards += effect.maxCards || 0;
    strips = strips.concat(effect.strips || []);
  });
  applied.units = _.difference(applied.units, strips);
  // As the real apply's: not enumerable, so no stored copy carries it.
  Object.defineProperty(applied, "strippedUnits", { value: _.uniq(strips) });
  return applied;
};

const fakeEffects = (options) => {
  const apply = (saved) =>
    options.hangApply
      ? new Promise(() => {})
      : Promise.resolve(applyFake(saved));
  return {
    apply,
    withCard: (saved, card, loadout) => {
      if (options.failScoring) {
        return Promise.reject(new Error("scratch apply failed"));
      }
      const pair = Promise.all([
        apply(saved),
        apply(coopAiEffects.addCard(saved, card, loadout)),
      ]);
      if (!options.slowScoringMs) {
        return pair;
      }
      return pair.then(
        (both) =>
          new Promise((resolve) => {
            setTimeout(() => resolve(both), options.slowScoringMs);
          })
      );
    },
  };
};

function aiRecord(serial, cards, extra) {
  const saved = {
    cards: cards || [{ id: "gwc_start_bot" }],
    tags: { global: { commander: COMMANDER } },
  };
  return Object.assign(
    {
      playerId: "gwo_ai_" + serial,
      commander: COMMANDER,
      loadoutCardId: "gwc_start_bot",
      inventory: Object.assign(applyFake(saved), {
        tags: { global: { commander: COMMANDER }, gwc_start_bot: { x: 1 } },
      }),
      techCardDealCount: 0,
      gwaioAi: { serial: serial, name: "AI" + serial },
    },
    extra
  );
}

const history = (count) =>
  _.times(count, (index) => ({ dealIndex: index + 1, star: index }));

const hand = (ids) => ids.map((id) => ({ id }));

function setup(overrides) {
  const options = Object.assign(
    {
      records: [aiRecord(1)],
      history: history(1),
      // A queue of hands per deal index; the next deal of that index takes
      // the first. A deal with none left never answers.
      hands: { 1: [hand(["air", "junk", "junk2"])] },
      rerolled: [],
      canRun: true,
      decisionTimeoutMs: 1000,
      onDeal: null,
    },
    overrides
  );

  let data = _.cloneDeep(options.records);
  const store = {
    all: () => data,
    find: (id) => _.find(data, { playerId: id }),
    write: (record, patch) => {
      const next = Object.assign({}, _.cloneDeep(record), patch);
      data = data.map((entry) =>
        entry.playerId === record.playerId ? next : entry
      );
      return next;
    },
    remove: (id) => {
      data = _.reject(data, { playerId: id });
    },
  };

  const calls = {
    deals: [],
    rerolls: [],
    writes: [],
    queued: [],
    afterPass: 0,
    running: [],
    dealt: [],
  };
  const hands = _.cloneDeep(options.hands);
  const rerolled = _.cloneDeep(options.rerolled);
  let running = false;

  const driver = makeDriver({
    records: () => store.all(),
    find: store.find,
    dealCount: (record) => record.techCardDealCount || 0,
    hostDealCount: () => options.history.length,
    entryFor: (dealIndex) => _.find(options.history, { dealIndex }),
    starAt: (starIndex) => ({ index: starIndex }),
    dealHand: (params) => {
      calls.deals.push(params);
      if (options.onDeal) {
        options.onDeal(params, store);
      }
      const queue = hands[params.dealIndex] || [];
      if (!queue.length) {
        return new Promise(() => {});
      }
      return Promise.resolve({
        star: params.starIndex,
        cards: queue.shift(),
        dealIndex: params.dealIndex,
        cardsOffered: 3,
      });
    },
    rerollHand: (params) => {
      calls.rerolls.push(params);
      if (!rerolled.length && options.hangReroll) {
        return new Promise(() => {});
      }
      const cards = rerolled.shift();
      const rerollsUsed = (params.pendingTechCards.rerollsUsed || 0) + 1;
      return Promise.resolve({
        pendingTechCards: {
          star: params.pendingTechCards.star,
          cards: cards,
          dealIndex: params.pendingTechCards.dealIndex,
          cardsOffered: 3,
          rerollsUsed: rerollsUsed,
        },
        rerollsUsed: rerollsUsed,
        cardsOffered: 3,
      });
    },
    effects: fakeEffects(options),
    lookup: () => LOOKUP,
    teamDomains: () => ["Land", "Bot"],
    namesUnits: () => false,
    chanceOf: () => 0,
    isLoadout: (id) => /_start/.test(id),
    rerollsRemain: (used, offered) => used < offered - 1,
    armyGap,
    armyGapClosable,
    factoryCards: options.factoryCards || (() => ["gwc_enable_bots_t1"]),
    dealCard: (cardId, applied, star) => {
      calls.dealt.push({ cardId, applied, star });
      return options.dealCard
        ? options.dealCard(cardId)
        : Promise.resolve({ id: cardId });
    },
    decisionRng: () => undefined,
    factoryRng: options.factoryRng || (() => undefined),
    enqueue: (label, apply) => {
      calls.queued.push(label);
      apply();
    },
    write: (record, patch) => {
      calls.writes.push({ id: record.playerId, patch: _.cloneDeep(patch) });
      return store.write(record, patch);
    },
    canRun: () => options.canRun,
    running: (value) => {
      if (value !== undefined) {
        running = value;
        calls.running.push(value);
      }
      return running;
    },
    afterPass: () => {
      calls.afterPass += 1;
    },
    defer: (fn) => setImmediate(fn),
    decisionTimeoutMs: options.decisionTimeoutMs,
    writeTimeoutMs: 1000,
  });

  return { driver, store, calls, options };
}

let lines;
let logMock;
let errorMock;
beforeEach(() => {
  lines = [];
  logMock = mock.method(console, "log", (line) => lines.push(line));
  errorMock = mock.method(console, "error", (line) => lines.push(line));
});
afterEach(() => {
  logMock.mock.restore();
  errorMock.mock.restore();
});

const cardIds = (record) => _.pluck(record.inventory.cards, "id");

describe("coop_ai_driver.run", () => {
  it("takes the card that opens a new domain, and counts the deal", async () => {
    const run = setup();
    assert.equal(await run.driver.run(), true);

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "air"]);
    assert.equal(record.techCardDealCount, 1);
    assert.ok(record.inventory.units.includes("/u/air_factory"));
    assert.deepEqual(run.calls.queued, ["gwo_coop_ai_deal"]);
    assert.equal(run.calls.afterPass, 1);
    assert.deepEqual(run.calls.running, [true, false]);
  });

  // As the server stores a viewer's: card-context tags are rebuilt by every
  // apply.
  it("stores the applied inventory with its global tags alone", async () => {
    const run = setup();
    await run.driver.run();

    const stored = run.calls.writes[0].patch.inventory;
    assert.deepEqual(stored.tags, { global: { commander: COMMANDER } });
    assert.equal(run.calls.writes[0].patch.pendingTechCards, undefined);
  });

  it("stores plain data, whatever methods the save carried", () => {
    const saved = {
      cards: [{ id: "gwc_start_bot" }],
      tags: { global: { commander: COMMANDER }, card: { buffCount: 1 } },
      getTag: () => "a method ko.toJS copied",
    };
    const stored = makeDriver.storedInventory(saved);
    assert.deepEqual(stored, {
      cards: [{ id: "gwc_start_bot" }],
      tags: { global: { commander: COMMANDER } },
    });
    assert.equal(typeof saved.getTag, "function");
  });

  it("catches up on every owed deal in history order", async () => {
    const run = setup({
      history: history(3),
      hands: {
        1: [hand(["air"])],
        2: [hand(["naval"])],
        3: [hand(["bot_armour"])],
      },
    });
    await run.driver.run();

    assert.deepEqual(_.pluck(run.calls.deals, "dealIndex"), [1, 2, 3]);
    assert.deepEqual(_.pluck(run.calls.deals, "starIndex"), [0, 1, 2]);
    assert.deepEqual(
      run.calls.writes.map((write) => write.patch.techCardDealCount),
      [1, 2, 3]
    );
    assert.equal(run.calls.afterPass, 1);
  });

  it("deals the AI as a client of its own, by its record's id", async () => {
    const run = setup();
    await run.driver.run();

    const deal = run.calls.deals[0];
    assert.deepEqual(deal.client, { id: "gwo_ai_1", name: "AI1" });
    assert.equal(deal.record.playerId, "gwo_ai_1");
    assert.deepEqual(deal.star, { index: 0 });
  });

  it("owes nothing once level with the host, and does nothing", async () => {
    const run = setup({
      records: [aiRecord(1, undefined, { techCardDealCount: 1 })],
    });

    assert.equal(await run.driver.run(), false);
    assert.equal(run.calls.deals.length, 0);
    assert.deepEqual(run.calls.running, []);
  });

  it("waits while something it depends on is in flight", async () => {
    const run = setup({ canRun: false });

    assert.equal(await run.driver.run(), false);
    assert.equal(run.calls.deals.length, 0);
  });

  it("serves each AI in slot order", async () => {
    const run = setup({
      records: [aiRecord(1), aiRecord(2)],
      hands: { 1: [hand(["air"]), hand(["naval"])] },
    });
    await run.driver.run();

    assert.deepEqual(
      run.calls.writes.map((write) => write.id),
      ["gwo_ai_1", "gwo_ai_2"]
    );
  });

  it("rerolls a poor hand while a reroll remains, and judges the new one", async () => {
    const run = setup({
      hands: { 1: [hand(["junk", "junk2", "junk3"])] },
      rerolled: [hand(["air", "junk"])],
    });
    await run.driver.run();

    assert.equal(run.calls.rerolls.length, 1);
    assert.deepEqual(
      _.pluck(run.calls.rerolls[0].pendingTechCards.cards, "id"),
      ["junk", "junk2", "junk3"]
    );
    assert.deepEqual(cardIds(run.store.find("gwo_ai_1")), [
      "gwc_start_bot",
      "air",
    ]);
    assert.ok(lines.some((line) => /-> reroll \(best/.test(line)));
  });

  it("declines a hand worth nothing once no reroll is left, and still counts it", async () => {
    const run = setup({
      hands: { 1: [hand(["junk", "junk2", "junk3"])] },
      rerolled: [hand(["junk4", "junk5"])],
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot"]);
    assert.equal(record.techCardDealCount, 1);
    assert.equal(run.calls.writes[0].patch.inventory, undefined);
  });

  // A thin deck deals a short hand, and cards_coop_reroll.js counts each
  // missing card as a reroll spent, so it would refuse this reroll.
  it("counts a short hand's missing cards as rerolls spent, as the reroll code does", async () => {
    const run = setup({
      hands: { 1: [hand(["junk"])] },
      rerolled: [hand(["air"])],
    });
    await run.driver.run();

    assert.equal(run.calls.rerolls.length, 0);
    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot"]);
    assert.equal(record.techCardDealCount, 1);
    assert.ok(
      lines.some((line) => /-> declined \(nothing worth a slot\)/.test(line)),
      JSON.stringify(lines)
    );
    assert.ok(!lines.some((line) => /fell back/.test(line)));
  });

  it("declines a hand holding a loadout, which it would bank", async () => {
    const run = setup({ hands: { 1: [hand(["gwc_start_air"])] } });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot"]);
    assert.equal(record.techCardDealCount, 1);
    assert.equal(run.calls.rerolls.length, 0);
    assert.ok(lines.some((line) => /declined \(loadout\)/.test(line)));
  });

  it("with a full bank, deletes its weakest card for a much better one - never its loadout", async () => {
    const run = setup({
      records: [aiRecord(1, hand(["gwc_start_bot", "junk", "bot_armour"]))],
      hands: { 1: [hand(["air"])] },
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "bot_armour", "air"]);
    assert.ok(lines.some((line) => /deleted junk took air/.test(line)));
  });

  it("with a full bank, declines a card no better than what it holds", async () => {
    const run = setup({
      records: [aiRecord(1, hand(["gwc_start_bot", "air", "naval"]))],
      hands: { 1: [hand(["orbital"])] },
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "air", "naval"]);
    assert.equal(record.techCardDealCount, 1);
    assert.ok(lines.some((line) => /declined \(bank full\)/.test(line)));
  });

  it("logs every hand with each card's score and the backend used", async () => {
    const run = setup();
    await run.driver.run();

    const line = _.find(lines, (entry) => /offered:/.test(entry));
    assert.match(
      line,
      /^\[GW COOP AI\] AI1 deal=1 star=0 hand=3 via=specs offered: air=/
    );
    assert.match(line, /-> took air$/);
  });

  it("declines a deal missing from the host's history, and moves on", async () => {
    const run = setup({
      history: [{ dealIndex: 2, star: 1 }, { dealIndex: 1 }],
      hands: { 2: [hand(["air"])] },
    });
    // hostDealCount is the history's length, 2; entry 1 has no star.
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.equal(record.techCardDealCount, 2);
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "air"]);
    assert.ok(
      lines.some((line) => /deal=1 is not in the host's history/.test(line))
    );
  });
});

// The memo each call of a scorer is given, in call order.
async function memosOf(action, scorer = "scoreCard") {
  const memos = [];
  const score = coopAiCards[scorer];
  const spy = mock.method(coopAiCards, scorer, (before, after, context) => {
    memos.push(context.memo);
    return score(before, after, context);
  });
  try {
    await action();
  } finally {
    spy.mock.restore();
  }
  return memos;
}

describe("coop_ai_driver memo", () => {
  // A hand's cards share the inventory before them, so its held tech is
  // worked out once.
  it("judges a deal's cards on one memo, and each deal on its own", async () => {
    const run = setup({
      history: history(2),
      hands: { 1: [hand(["air", "junk"])], 2: [hand(["naval", "junk"])] },
    });
    const memos = await memosOf(() => run.driver.run());

    assert.equal(memos.length, 4);
    assert.ok(memos[0] && memos[0] === memos[1]);
    assert.ok(memos[2] === memos[3] && memos[2] !== memos[0]);
  });

  it("judges every starting loadout on one memo", async () => {
    const run = setup();
    const memos = await memosOf(
      () =>
        run.driver.chooseStartingLoadout({
          name: "AI1",
          candidates: ["gwc_start_air", "gwc_start_naval"],
          build: (id) =>
            Promise.resolve({
              cards: [{ id: id }],
              tags: { global: { commander: COMMANDER } },
            }),
          baseline: { cards: [{ id: "gwc_start" }], tags: {} },
          commander: COMMANDER,
          teamDomains: [],
        }),
      "scoreLoadout"
    );

    assert.equal(memos.length, 2);
    assert.ok(memos[0] && memos[0] === memos[1]);
  });
});

describe("coop_ai_driver bounds", () => {
  it("falls back to the first card that fits when a decision times out, and clears the flag", async () => {
    const run = setup({
      decisionTimeoutMs: 20,
      hands: { 1: [hand(["junk", "junk2", "junk3"])] },
      // The poor hand is rerolled, and the reroll never answers.
      hangReroll: true,
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "junk"]);
    assert.equal(record.techCardDealCount, 1);
    assert.ok(
      lines.some((line) =>
        /deal=1 fell back: .*timed out.* -> took junk \(fallback\)/.test(line)
      ),
      JSON.stringify(lines)
    );
    assert.deepEqual(run.calls.running, [true, false]);
  });

  it("stops a timed-out decision before its next step, and logs no choice for it", async () => {
    const run = setup({
      decisionTimeoutMs: 20,
      slowScoringMs: 60,
      hands: { 1: [hand(["junk", "junk2", "junk3"])] },
      rerolled: [hand(["air", "junk"])],
    });
    await run.driver.run();
    // Past the moment the abandoned scoring lands.
    await new Promise((resolve) => setTimeout(resolve, 120));

    assert.deepEqual(cardIds(run.store.find("gwo_ai_1")), [
      "gwc_start_bot",
      "junk",
    ]);
    assert.equal(run.calls.rerolls.length, 0);
    assert.ok(
      !lines.some((line) => /deal=1 star=0 hand=3/.test(line)),
      JSON.stringify(lines)
    );
  });

  it("declines when the hand never arrives, and counts the deal", async () => {
    const run = setup({ decisionTimeoutMs: 20, hands: {} });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.equal(record.techCardDealCount, 1);
    assert.deepEqual(cardIds(record), ["gwc_start_bot"]);
    assert.ok(
      lines.some((line) =>
        /fell back: .*timed out.* -> declined \(fallback, no card\)/.test(line)
      ),
      JSON.stringify(lines)
    );
    assert.deepEqual(run.calls.running, [true, false]);
  });

  // An error is not a timeout: it falls back, but does not count towards
  // the AI's giving up.
  it("takes the first non-loadout card that fits when judging the hand fails", async () => {
    const run = setup({
      hands: { 1: [hand(["gwc_start_air", "air"])] },
      failScoring: true,
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "air"]);
    assert.ok(
      lines.some((line) =>
        /fell back: .*scratch apply failed -> took air \(fallback\)/.test(line)
      ),
      JSON.stringify(lines)
    );
  });

  it("declines every remaining deal this session after timing out twice", async () => {
    const run = setup({
      decisionTimeoutMs: 20,
      history: history(4),
      hands: {},
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.equal(record.techCardDealCount, 4);
    assert.equal(run.calls.deals.length, 2);
    assert.equal(
      lines.filter((line) => /timed out 2 times this session/.test(line))
        .length,
      2
    );
  });
});

describe("coop_ai_driver writes", () => {
  it("keeps a star-card refresh's write made while it decided", async () => {
    const run = setup({
      onDeal: (params, store) => {
        store.write(store.find(params.record.playerId), {
          gwaioStarCards: { turn: 3, cards: { 5: { id: "naval" } } },
        });
      },
    });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(record.gwaioStarCards, {
      turn: 3,
      cards: { 5: { id: "naval" } },
    });
    assert.deepEqual(cardIds(record), ["gwc_start_bot", "air"]);
  });

  it("redoes a decision whose cards changed before it was written", async () => {
    let first = true;
    const run = setup({
      hands: { 1: [hand(["air"]), hand(["naval"])] },
      onDeal: (params, store) => {
        if (first) {
          first = false;
          const record = store.find(params.record.playerId);
          store.write(record, {
            inventory: Object.assign({}, record.inventory, {
              cards: record.inventory.cards.concat({ id: "bot_armour" }),
            }),
          });
        }
      },
    });
    await run.driver.run();

    assert.equal(run.calls.deals.length, 2);
    assert.deepEqual(cardIds(run.store.find("gwo_ai_1")), [
      "gwc_start_bot",
      "bot_armour",
      "naval",
    ]);
  });

  it("writes nothing for an AI kicked while it decided", async () => {
    const run = setup({
      onDeal: (params, store) => store.remove(params.record.playerId),
    });
    await run.driver.run();

    assert.equal(run.calls.writes.length, 0);
    assert.equal(run.calls.afterPass, 0);
    assert.ok(lines.some((line) => /not written: gone/.test(line)));
  });

  it("runs once more when asked again mid-pass", async () => {
    const run = setup({
      history: history(1),
      hands: { 1: [hand(["air"])], 2: [hand(["naval"])] },
    });
    const first = run.driver.run();
    // The host explores again while the first pass runs.
    run.options.history.push({ dealIndex: 2, star: 1 });
    const second = run.driver.run();
    assert.equal(second, first);
    await first;
    // The rerun is chained onto the first pass's promise.
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(run.store.find("gwo_ai_1").techCardDealCount, 2);
  });
});

describe("coop_ai_driver.chooseStartingLoadout", () => {
  const build = (id) =>
    Promise.resolve({
      cards: [{ id: id }],
      tags: { global: { commander: COMMANDER } },
    });
  // A stream whose every roll is `value`, as chooseLoadout reads one.
  const roll = (value) => () => value;
  const choose = (run, extra) =>
    run.driver.chooseStartingLoadout(
      Object.assign(
        {
          name: "AI1",
          candidates: ["gwc_start_air", "gwc_start_naval"],
          build,
          baseline: {
            cards: [{ id: "gwc_start" }],
            tags: { global: { commander: COMMANDER } },
          },
          commander: COMMANDER,
          teamDomains: ["Land", "Air"],
        },
        extra
      )
    );
  const loadoutLine = () => _.find(lines, (line) => / loadout via=/.test(line));

  // Air scores 18 and Naval 23 with Land and Air fielded, so Naval, which
  // opens the domain the team lacks, is drawn 23 times in 41.
  it("draws the loadout from its stream, the likelier the more it scores", async () => {
    const stream = () =>
      gwoStreams.coopAiLoadoutRng(gwoRng.create("loadout war"), 1);
    const chosen = await choose(setup(), { rng: stream() });

    assert.equal(chosen.loadoutCardId, "gwc_start_naval");
    assert.deepEqual(_.pluck(chosen.inventory.cards, "id"), [
      "gwc_start_naval",
    ]);
    assert.equal(
      (await choose(setup(), { rng: stream() })).loadoutCardId,
      chosen.loadoutCardId
    );
    assert.match(
      loadoutLine(),
      /^\[GW COOP AI\] AI1 loadout via=specs candidates: gwc_start_air=18 \(.* chance 43\.9%\), gwc_start_naval=23 \(.* chance 56\.1%\) -> chose gwc_start_naval$/
    );
  });

  it("takes the roll from the stream it is given", async () => {
    assert.equal(
      (await choose(setup(), { rng: roll(0.43) })).loadoutCardId,
      "gwc_start_air"
    );
    assert.equal(
      (await choose(setup(), { rng: roll(0.44) })).loadoutCardId,
      "gwc_start_naval"
    );
  });

  // Tourist strips every extractor, and a dull stripping every basic land
  // factory would strip one a card granted too. Naval's gap a factory card
  // closes, so it stays.
  it("drops a loadout it could never fight with, and logs it with its gap", async () => {
    const chosen = await choose(setup(), {
      candidates: [
        "gwc_start_tourist",
        "gwc_start_grounded",
        "gwc_start_naval",
      ],
      rng: roll(0),
    });

    assert.equal(chosen.loadoutCardId, "gwc_start_naval");
    assert.match(
      loadoutLine(),
      /candidates: gwc_start_naval=23 \(.* chance 100%\) dropped: gwc_start_tourist \(extractor\), gwc_start_grounded \(landFactory\) -> chose gwc_start_naval$/
    );
  });

  it("under Unique AI loadouts, leaves out the loadouts in use and logs them", async () => {
    const chosen = await choose(setup(), {
      used: ["gwc_start_naval", "gwc_start_bot"],
      rng: roll(0.99),
    });

    assert.equal(chosen.loadoutCardId, "gwc_start_air");
    assert.match(
      loadoutLine(),
      /gwc_start_air=18 \(.* chance 100%\), gwc_start_naval=23 \(.* chance 0%\) used: gwc_start_naval, gwc_start_bot -> chose gwc_start_air$/
    );
  });

  it("draws from the whole pool when every loadout worth a slot is in use", async () => {
    const chosen = await choose(setup(), {
      used: ["gwc_start_air", "gwc_start_naval"],
      rng: roll(0.99),
    });

    assert.equal(chosen.loadoutCardId, "gwc_start_naval");
    assert.match(
      loadoutLine(),
      /chance 56\.1%\) used: gwc_start_air, gwc_start_naval \(all in use: full pool\) -> chose gwc_start_naval$/
    );
  });

  it("leaves nothing out with Unique AI loadouts off", async () => {
    const chosen = await choose(setup(), { rng: roll(0.99) });

    assert.equal(chosen.loadoutCardId, "gwc_start_naval");
    assert.doesNotMatch(loadoutLine(), / used: /);
  });

  it("skips a loadout that cannot be built", async () => {
    const chosen = await choose(setup(), {
      candidates: ["broken", "gwc_start_bot"],
      build: (id) =>
        id === "broken" ? Promise.reject(new Error("no card")) : build(id),
      teamDomains: [],
    });

    assert.equal(chosen.loadoutCardId, "gwc_start_bot");
    assert.ok(lines.some((line) => /loadout broken not built/.test(line)));
  });

  it("fails when no loadout can be built", async () => {
    await assert.rejects(
      choose(setup(), {
        candidates: ["broken"],
        build: () => Promise.reject(new Error("no card")),
      }),
      /no starting loadout/
    );
    assert.match(loadoutLine(), /-> none$/);
  });
});

describe("coop_ai_driver T1 factory card", () => {
  // An AI on the Naval loadout, which has no basic land factory.
  const navalAi = (cards) =>
    aiRecord(1, cards || hand(["gwc_start_naval"]), {
      loadoutCardId: "gwc_start_naval",
    });
  const T1 = [
    "gwc_enable_air_t1",
    "gwc_enable_bots_t1",
    "gwc_enable_vehicles_t1",
  ];

  it("assigns one in place of the first deal's hand, and logs it", async () => {
    // No hand is ever answered, so dealing one would time out.
    const run = setup({ records: [navalAi()], hands: {} });
    await run.driver.run();

    const record = run.store.find("gwo_ai_1");
    assert.deepEqual(cardIds(record), [
      "gwc_start_naval",
      "gwc_enable_bots_t1",
    ]);
    assert.equal(record.techCardDealCount, 1);
    assert.ok(record.inventory.units.includes("/u/bot_factory"));
    assert.equal(run.calls.deals.length, 0);
    assert.deepEqual(run.calls.dealt[0].star, { index: 0 });
    assert.ok(run.calls.dealt[0].applied.units.includes("/u/naval_factory"));
    assert.ok(
      lines.includes(
        "[GW COOP AI] AI1 deal=1 star=0 -> assigned gwc_enable_bots_t1 (no basic land factory)"
      ),
      JSON.stringify(lines)
    );
  });

  it("draws the card from the AI's factory stream, the same on a reload", async () => {
    const assigned = async (serial) => {
      const run = setup({
        records: [
          aiRecord(serial, hand(["gwc_start_naval"]), {
            loadoutCardId: "gwc_start_naval",
          }),
        ],
        hands: {},
        factoryCards: () => T1,
        factoryRng: (record, dealIndex) =>
          gwoStreams.coopAiFactoryRng(
            gwoRng.create("factory war"),
            record.gwaioAi.serial,
            dealIndex
          ),
      });
      await run.driver.run();
      return cardIds(run.store.find("gwo_ai_" + serial))[1];
    };

    const first = await assigned(1);
    assert.ok(T1.includes(first), first);
    assert.equal(await assigned(1), first);
    const picks = new Set();
    for (let serial = 1; serial <= 12; serial++) {
      picks.add(await assigned(serial));
    }
    assert.ok(picks.size > 1, [...picks].join());
  });

  it("deals a hand as usual when no factory card qualifies", async () => {
    const run = setup({
      records: [navalAi()],
      hands: { 1: [hand(["air"])] },
      factoryCards: () => [],
    });
    await run.driver.run();

    assert.deepEqual(cardIds(run.store.find("gwo_ai_1")), [
      "gwc_start_naval",
      "air",
    ]);
    assert.ok(
      lines.includes(
        "[GW COOP AI] AI1 deal=1 star=0 no basic land factory, no factory card to assign: dealing a hand"
      ),
      JSON.stringify(lines)
    );
  });

  // A third-party dull could strip the factory the card grants.
  it("deals a hand as usual when the card leaves it without one", async () => {
    const run = setup({
      records: [navalAi()],
      hands: { 1: [hand(["air"])] },
      factoryCards: () => ["gwc_enable_stripped"],
    });
    await run.driver.run();

    assert.ok(
      lines.some((line) =>
        /deal=1 star=0 no basic land factory, still none with gwc_enable_stripped: dealing a hand$/.test(
          line
        )
      ),
      JSON.stringify(lines)
    );
    assert.equal(run.calls.deals.length, 1);
  });

  it("deals a hand as usual when the card cannot be dealt", async () => {
    const run = setup({
      records: [navalAi()],
      hands: { 1: [hand(["air"])] },
      dealCard: () => Promise.reject(new Error("GWO card not found")),
    });
    await run.driver.run();

    assert.deepEqual(cardIds(run.store.find("gwo_ai_1")), [
      "gwc_start_naval",
      "air",
    ]);
    assert.ok(
      lines.some((line) =>
        /no basic land factory, gwc_enable_bots_t1 not dealt: GWO card not found: dealing a hand$/.test(
          line
        )
      ),
      JSON.stringify(lines)
    );
  });

  it("deals a hand as usual when the bank has no room for the card", async () => {
    const run = setup({
      records: [navalAi(hand(["gwc_start_naval", "junk", "junk2"]))],
      hands: { 1: [hand(["air"])] },
    });
    await run.driver.run();

    assert.ok(
      lines.some((line) =>
        /no basic land factory, no room for gwc_enable_bots_t1: dealing a hand$/.test(
          line
        )
      ),
      JSON.stringify(lines)
    );
    assert.equal(run.calls.deals.length, 1);
  });

  it("deals an AI with a basic land factory its hand", async () => {
    const run = setup();
    await run.driver.run();

    assert.equal(run.calls.dealt.length, 0);
    assert.equal(run.calls.deals.length, 1);
  });
});

describe("coop_ai_driver swap judgement", () => {
  // A full bank: the loadout's slots, all taken. Each hand is one card, so
  // no reroll is left to spend.
  const fullAi = (ids) => aiRecord(1, hand(ids), { loadoutCardId: ids[0] });
  const settled = async (records, incoming) => {
    const run = setup({ records, hands: { 1: [hand([incoming])] } });
    await run.driver.run();
    return cardIds(run.store.find("gwo_ai_1"));
  };

  it("deletes the T1 card an incoming card makes redundant", async () => {
    assert.deepEqual(
      await settled(
        [fullAi(["gwc_start_naval", "gwc_enable_bots_t1", "bot_armour"])],
        "gwc_enable_bots_all"
      ),
      ["gwc_start_naval", "bot_armour", "gwc_enable_bots_all"]
    );
    assert.ok(
      lines.some((line) =>
        /-> deleted gwc_enable_bots_t1 took gwc_enable_bots_all$/.test(line)
      ),
      JSON.stringify(lines)
    );
  });

  it("deletes the T1 card first once its replacement is held", async () => {
    assert.deepEqual(
      await settled(
        [
          fullAi([
            "gwc_start_naval",
            "gwc_enable_bots_all",
            "gwc_enable_bots_t1",
          ]),
        ],
        "orbital"
      ),
      ["gwc_start_naval", "gwc_enable_bots_all", "orbital"]
    );
  });

  // Worth 36 against the T1 card's 17.5, so only the gap keeps the card.
  it("keeps the card that gives its only basic land factory", async () => {
    assert.deepEqual(
      await settled(
        [fullAi(["gwc_start_orbital", "gwc_enable_bots_t1"])],
        "titan_naval"
      ),
      ["gwc_start_orbital", "gwc_enable_bots_t1"]
    );
    assert.ok(lines.some((line) => /declined \(bank full\)/.test(line)));
  });

  it("lets that card go for one that brings a basic land factory", async () => {
    assert.deepEqual(
      await settled(
        [fullAi(["gwc_start_orbital", "gwc_enable_bots_t1"])],
        "titan_air"
      ),
      ["gwc_start_orbital", "titan_air"]
    );
  });

  // Deleting a card that brought its own slot frees none, so the swap would
  // overflow the bank, though the card itself is worth nothing.
  it("never counts a card that brought its own slot as freeing one", async () => {
    assert.deepEqual(
      await settled(
        [
          aiRecord(1, [
            { id: "gwc_start_bot" },
            { id: "air" },
            { id: "naval" },
            { id: "slot_card", allowOverflow: true },
          ]),
        ],
        "orbital"
      ),
      ["gwc_start_bot", "air", "naval", "slot_card"]
    );
    assert.ok(lines.some((line) => /declined \(bank full\)/.test(line)));
  });
});
