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

const COMMANDER = "/u/commander";

const CELLS = {
  "/u/commander": ["Land", "Basic", "Commander"],
  "/u/bot_factory": ["Bot", "Basic", "Factory"],
  "/u/bot": ["Bot", "Basic", "Combat"],
  "/u/air_factory": ["Air", "Basic", "Factory"],
  "/u/naval_factory": ["Naval", "Basic", "Factory"],
  "/u/orbital_factory": ["Orbital", "Basic", "Factory"],
};

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

// What each card id does when applied.
const EFFECTS = {
  gwc_start_bot: {
    units: ["/u/commander", "/u/bot_factory", "/u/bot"],
    maxCards: 3,
  },
  gwc_start: { units: ["/u/commander"], maxCards: 3 },
  gwc_start_air: {
    units: ["/u/commander", "/u/air_factory"],
    maxCards: 3,
  },
  gwc_start_naval: {
    units: ["/u/commander", "/u/naval_factory"],
    maxCards: 3,
  },
  air: { units: ["/u/air_factory"] },
  naval: { units: ["/u/naval_factory"] },
  orbital: { units: ["/u/orbital_factory"] },
  bot_armour: {
    mods: [{ file: "/u/bot", path: "max_health", op: "multiply", value: 1.5 }],
  },
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
  _.forEach(saved.cards, (card) => {
    const effect = EFFECTS[card.id] || {};
    applied.units = _.uniq(applied.units.concat(effect.units || []));
    applied.mods = applied.mods.concat(effect.mods || []);
    applied.maxCards += effect.maxCards || 0;
  });
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
    withoutCard: (saved, index) =>
      Promise.all([
        apply(coopAiEffects.removeCard(saved, index)),
        apply(saved),
      ]),
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
    decisionRng: () => undefined,
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

// The memo each scoreCard call is given, in call order.
async function memosOf(action) {
  const memos = [];
  const scoreCard = coopAiCards.scoreCard;
  const spy = mock.method(
    coopAiCards,
    "scoreCard",
    (before, after, context) => {
      memos.push(context.memo);
      return scoreCard(before, after, context);
    }
  );
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
    const memos = await memosOf(() =>
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
      })
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

  it("takes the loadout that opens the domain its team lacks", async () => {
    const run = setup();
    const chosen = await run.driver.chooseStartingLoadout({
      name: "AI1",
      candidates: ["gwc_start_air", "gwc_start_naval"],
      build,
      baseline: {
        cards: [{ id: "gwc_start" }],
        tags: { global: { commander: COMMANDER } },
      },
      commander: COMMANDER,
      teamDomains: ["Land", "Air"],
    });

    assert.equal(chosen.loadoutCardId, "gwc_start_naval");
    assert.deepEqual(_.pluck(chosen.inventory.cards, "id"), [
      "gwc_start_naval",
    ]);
    assert.ok(
      lines.some((line) =>
        /^\[GW COOP AI\] AI1 loadout via=specs candidates: gwc_start_air=.*gwc_start_naval=.* -> chose gwc_start_naval$/.test(
          line
        )
      ),
      JSON.stringify(lines)
    );
  });

  it("skips a loadout that cannot be built", async () => {
    const run = setup();
    const chosen = await run.driver.chooseStartingLoadout({
      name: "AI1",
      candidates: ["broken", "gwc_start_bot"],
      build: (id) =>
        id === "broken" ? Promise.reject(new Error("no card")) : build(id),
      baseline: { cards: [{ id: "gwc_start" }], tags: {} },
      commander: COMMANDER,
      teamDomains: [],
    });

    assert.equal(chosen.loadoutCardId, "gwc_start_bot");
    assert.ok(lines.some((line) => /loadout broken not built/.test(line)));
  });

  it("fails when no loadout can be built", async () => {
    const run = setup();
    await assert.rejects(
      run.driver.chooseStartingLoadout({
        name: "AI1",
        candidates: ["broken"],
        build: () => Promise.reject(new Error("no card")),
        baseline: { cards: [{ id: "gwc_start" }], tags: {} },
        commander: COMMANDER,
        teamDomains: [],
      }),
      /no starting loadout/
    );
  });
});
