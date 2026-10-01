"use strict";

// gw_play/cards_coop_ai_tech.js: the glue behind a co-op AI player's tech. It
// reads the unit lookup the AIs judge by, hands the pings and, under per-player
// tech, the driver what they judge with, and builds a new AI's starting
// loadout. The modules it wires are stubbed here and pinned in their own
// tests; this pins the wiring. See coop.md, "AI players' tech".

const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

const MOD = "coui://ui/mods/com.pa.quitch.gwaioverhaul";

// What the stubbed modules were asked, reset by each setup.
const seen = {};
// What the stubbed modules answer, set by each setup.
const answers = {};

const plain = (value) => JSON.parse(JSON.stringify(value));
const plainSave = (inventory) => ({ savedFrom: inventory.owner });
const specMod = function () {
  // Stands in for gw_play/specs.js's op engine; only its identity matters.
};

registerModuleStub(MOD + "/gw_play/coop_ai_driver.js", function (params) {
  seen.driverParams = params;
  return {
    run: () => seen.runs.push(true),
    chooseStartingLoadout: (options) => {
      seen.chosen = options;
      return Promise.resolve("start");
    },
  };
});
registerModuleStub(
  MOD + "/gw_play/coop_ai_effects.js",
  Object.assign(
    function (options) {
      seen.effectsOptions = options;
      return { name: "effects" };
    },
    { plain, plainSave }
  )
);
registerModuleStub(MOD + "/shared/coop_ai_cards.js", {
  teamDomains: (teammates, lookup) => ({ teammates, lookup }),
});
registerModuleStub(MOD + "/shared/coop_ai_units.js", {
  fromGroups: (groups) => ({ via: "groups", groups }),
  fromSpecs: (loaded, units, mod) => ({ via: "specs", loaded, units, mod }),
});
registerModuleStub(MOD + "/shared/unit_groups.js", { units: ["unit_a"] });
registerModuleStub(MOD + "/gw_play/race_cells.js", {
  load: () => answers.specs,
  prime: (race, units) => {
    seen.primes.push([race, units]);
    return Promise.resolve(answers.cells[race]);
  },
});
registerModuleStub(MOD + "/shared/race_mods.js", {
  mountRoot: () => {
    seen.mounts += 1;
    return { always: (fn) => fn() };
  },
});
registerModuleStub(MOD + "/gw_play/coop_ai_roster.js", {
  LOADOUTS_AI_CANNOT_USE: ["gwaio_start_warp"],
  isAiRecord: (record) => !!record && !!record.gwaioAi,
  teammates: (inventories) => ({ teammates: inventories }),
  loadoutsInUse: (inventories, isLoadout) => ({ inventories, isLoadout }),
  loadoutCandidates: (options) => ({ candidates: options }),
});
registerModuleStub(MOD + "/gw_play/coop_host.js", {
  upsertRecord: (game, record, patch) => {
    seen.upserts.push([game, record, patch]);
    return "stored";
  },
});
registerModuleStub(MOD + "/gw_play/referee_coop.js", {
  // As the real predicate reads the scene; test/referee_coop.test.js pins it.
  hostingPerPlayerSession: () =>
    !!(
      globalThis.model.gwCampaignActive() &&
      globalThis.model.isCampaignHost() &&
      globalThis.model.gwCampaignPerPlayerTechCards()
    ),
  getConnectedViewerInventories: (game) => {
    seen.viewerGames.push(game);
    return [{ client: { id: "c_v1" }, inventory: { owner: "viewer" } }];
  },
});
registerModuleStub(MOD + "/shared/starting_inventory.js", {
  buildGlobalTags: (commander, playerFaction, race) => ({
    commander,
    playerFaction,
    race,
  }),
  build: (options) => {
    seen.builds.push(options);
    return { built: options.loadoutCardId, save: () => "method" };
  },
});
registerModuleStub(MOD + "/shared/loadout_ids.js", {
  starting: ["gwc_start_vehicle", "gwc_start_air"],
  lockedBase: ["gwc_start_orbital"],
  unlockable: ["gwaio_start_ceo", "gwc_start_orbital"],
});
registerModuleStub(MOD + "/gw_play/specs.js", { mod: specMod });
registerModuleStub(MOD + "/shared/coop_ai_fielded.js", {
  view: (options) => {
    seen.views.push(options);
    return { fielded: options.race };
  },
});
registerModuleStub(MOD + "/gw_play/cards_coop_ai_pings.js", (params) => {
  seen.pingsParams = params;
});
registerModuleStub(MOD + "/gw_play/referee_game_file_paths.js", {
  raceKeysFor: (params) => {
    seen.keys.push(params);
    return answers.keys(params);
  },
  loadAiTechFiles: () => answers.loads(),
  describeError: (error) => "described " + error,
});
registerModuleStub(MOD + "/shared/race_ai_mods.js", {
  table: (keys) => ({ tableOf: keys }),
});
const UNIT_CELLS = { name: "unit cells" };
registerModuleStub(MOD + "/shared/unit_cells.js", UNIT_CELLS);
registerModuleStub(MOD + "/gw_play/coop_publish.js", {
  publish: (reason) => seen.events.push(["publish", reason]),
});

const makeTech = loadCouiModule(MOD + "/gw_play/cards_coop_ai_tech.js");

const AI_RECORD = {
  playerId: "gwo_ai_1",
  commander: "ai_commander",
  inventory: { owner: "ai_1" },
  gwaioAi: { serial: 3, name: "Sorian" },
};
const OTHER_AI = {
  playerId: "gwo_ai_2",
  inventory: { owner: "ai_2" },
  gwaioAi: { serial: 4, name: "Kohr" },
};
const HOST_SAVED = {
  cards: [{ id: "gwc_start_vehicle" }],
  units: ["/pa/units/host.json"],
  mods: [{ op: "host" }],
  tags: { global: { commander: "global:commander" } },
};
const VIEWER_RECORD = { playerId: "uber_v1", inventory: { owner: "viewer" } };

// A deferred the test settles, as raceCells.load()'s promise.
function pending() {
  let settle;
  const promise = new Promise((resolve, reject) => {
    settle = { resolve, reject };
  });
  promise.catch(() => {});
  return Object.assign(promise, settle);
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      perPlayer: true,
      host: true,
      session: true,
      records: [AI_RECORD, OTHER_AI],
      cards: [],
      gwoCards: [],
      cardsToUnits: undefined,
      uniqueAiLoadouts: true,
      startingCards: undefined,
      newStartCards: undefined,
      aiCannotUse: undefined,
      cardsLoaded: true,
    },
    overrides
  );
  Object.assign(seen, {
    driverParams: undefined,
    pingsParams: undefined,
    effectsOptions: undefined,
    chosen: undefined,
    runs: [],
    mounts: 0,
    primes: [],
    views: [],
    keys: [],
    upserts: [],
    builds: [],
    viewerGames: [],
    decks: [],
    saves: [],
    events: [],
  });
  answers.specs = options.specs || pending();
  answers.cells = options.cells || {};
  answers.keys =
    options.keys || ((params) => Promise.resolve({ race: params.race }));
  answers.loads = options.loads || (() => Promise.resolve({ file: {} }));

  const computeds = [];
  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  const timers = installFakeLodashTimers();
  mock.timers.enable({ apis: ["setTimeout"] });
  const logs = [];
  stubs.setGlobal("console", {
    log: (text) => logs.push(["log", text]),
    error: (text) => logs.push(["error", text]),
  });
  stubs.setGlobal("ko", {
    observable: makeObservable,
    computed: (fn) => {
      computeds.push(fn);
      fn();
    },
  });

  const records = makeObservable(options.records);
  const state = { host: options.host, session: options.session, over: false };
  const model = {
    isCampaignHost: () => state.host,
    gwCampaignActive: () => state.session,
    gwCampaignPerPlayerTechCards: () => options.perPlayer,
    gwoCoopAi: {
      count: () => records().length,
      records,
      driving: makeObservable(false),
      tech: makeObservable(),
    },
    gwoCards: options.gwoCards,
    gwoCardsToUnits: options.cardsToUnits,
    gwoStartingCards: options.startingCards,
    gwoNewStartCards: options.newStartCards,
    gwoLoadoutsAiCannotUse: options.aiCannotUse,
    getCoopPlayerTechCardDealCount: () => 0,
    getHostTechCardDealEntry: () => undefined,
    enqueueGwCampaignStateApply: () => undefined,
    gameOver: () => state.over,
    refreshGwCampaignInventoryModal: () => seen.events.push(["refresh"]),
  };
  stubs.setGlobal("model", model);

  const stars = [{ index: 0 }, { index: 1 }, { index: 2 }];
  const game = {
    currentStar: () => 1,
    hostTechCardDealCount: () => 5,
    coopPlayerInventoryData: () => [VIEWER_RECORD].concat(records()),
  };
  const hostInventory = {
    owner: "host",
    cards: () => HOST_SAVED.cards,
    units: () => HOST_SAVED.units,
    mods: () => HOST_SAVED.mods,
    getTag: (context, name) => context + ":" + name,
  };
  const loadedInventories = [];
  function GWInventory() {
    this.load = (data) => {
      this.data = data;
      loadedInventories.push(this);
    };
  }
  const starCardsBusy = makeObservable(false);
  // cards.js's $.when of the deck and card_units.js.
  const cardsLoaded = [];
  const loaded = {
    name: "deck loaded",
    then: (fn) => {
      if (options.cardsLoaded) {
        fn();
      } else {
        cardsLoaded.push(fn);
      }
    },
  };
  const handle = {
    appendRecordMinions: (saved, playerKey) => ({ saved, playerKey }),
  };

  const params = {
    game,
    perPlayer: options.perPlayer,
    GW: { bank: { name: "stock bank" } },
    GWInventory,
    gwoAI: {
      armyGap: () => "armyGap",
      armyGapClosable: (gap, stripped, units) =>
        !(stripped || []).some((unit) => units.includes(unit)),
      originSettings: () => ({ uniqueAiLoadouts: options.uniqueAiLoadouts }),
      aiInUse: (type, race) => "brain:" + type + ":" + race,
      getAIPathSource: (type, race) => "/source/" + type + "/" + race + "/",
    },
    gwoDeal: {
      dealCard: (request, loaded, cards) => ({ request, loaded, cards }),
      setupGwoDeck: (cards, deck, count, promise, ids) =>
        seen.decks.push({ cards, deck, count, promise, ids }),
    },
    gwoSave: (saved, withStars) => {
      seen.events.push(["save", saved === game, withStars]);
      return undefined;
    },
    gwoStreams: {
      coopAiDecisionRng: (warRng, serial, dealIndex, rerollsUsed) => [
        "decision",
        warRng,
        serial,
        dealIndex,
        rerollsUsed,
      ],
      coopAiFactoryRng: (warRng, serial, dealIndex) => [
        "factory",
        warRng,
        serial,
        dealIndex,
      ],
      coopAiLoadoutRng: (warRng, serial) => ["loadout", warRng, serial],
      coopPlayerKey: (record) => "key_" + record.playerId,
    },
    warRng: "war",
    galaxy: { stars: () => stars },
    inventory: hostInventory,
    cards: options.cards,
    loaded,
    races: { raceOf: (saved) => saved.race, isMla: (race) => race === "mla" },
    helpers: {
      isStartLoadoutCardId: (id) => /_start_/.test(id),
      rerollsRemain: () => true,
      raceCanDeal: (races, inventory, id) => id !== "gwc_enable_bots_t1",
      raceLocksLoadout: (race, id) => [race, id],
    },
    coopDeal: { pendingHandForRecord: () => "hand" },
    coopReroll: {
      rerollHandForRecord: () => "reroll",
      computeRerollDeal: () => "reroll deal",
    },
    starCardsBusy,
    aiStarDealing: makeObservable(0),
    startCardUnlocked: (card) => card.id !== "gwc_start_orbital",
    generalCommander: Promise.resolve(handle),
  };
  makeTech(params);

  return {
    params,
    model,
    state,
    game,
    stars,
    records,
    computeds,
    timers,
    logs,
    handle,
    hostInventory,
    loadedInventories,
    starCardsBusy,
    cardsLoaded,
    driver: seen.driverParams,
    pings: seen.pingsParams,
    lookup: () => seen.pingsParams.lookup(),
    restore: () => {
      mock.timers.reset();
      timers.restore();
      stubs.restoreGlobals();
    },
  };
}

const { build, release } = trackActive(setup);

const settle = () => new Promise(setImmediate);

describe("the unit lookup a co-op AI player judges by", () => {
  it("reads the specs once a per-player host opens a session", async () => {
    const specs = pending();
    const run = build({ specs });
    assert.equal(seen.mounts, 1);
    assert.equal(run.lookup(), undefined);

    specs.resolve({ units: ["spec_unit"] });
    await settle();

    assert.deepEqual(run.lookup(), {
      via: "specs",
      loaded: { units: ["spec_unit"] },
      units: ["unit_a"],
      mod: specMod,
    });
    mock.timers.tick(8000);
    assert.deepEqual(run.logs, []);
  });

  it("reads them once", () => {
    const run = build();

    run.computeds[0]();

    assert.equal(seen.mounts, 1);
  });

  it("waits for an AI under shared tech", () => {
    const run = build({ perPlayer: false, records: [] });
    assert.equal(seen.mounts, 0);

    run.records([AI_RECORD]);
    run.computeds[0]();

    assert.equal(seen.mounts, 1);
  });

  it("is not read off the host or out of a session", () => {
    for (const away of [{ host: false }, { session: false }]) {
      release();
      build(away);
      assert.equal(seen.mounts, 0);
    }
  });

  it("judges by the unit groups after 8 seconds without the specs, and by the specs once they land", async () => {
    const specs = pending();
    const run = build({ specs });

    mock.timers.tick(7999);
    assert.equal(run.lookup(), undefined);
    mock.timers.tick(1);

    assert.deepEqual(run.lookup(), {
      via: "groups",
      groups: { units: ["unit_a"] },
    });
    assert.deepEqual(run.logs, [
      [
        "log",
        "[GW COOP AI] unit specs not in after 8 s: judging by unit groups until they are",
      ],
    ]);

    specs.resolve({ units: [] });
    await settle();
    assert.equal(run.lookup().via, "specs");
  });

  it("judges by the unit groups when the specs cannot be read", async () => {
    const specs = pending();
    const run = build({ specs });

    specs.reject("no specs");
    await settle();

    assert.equal(run.lookup().via, "groups");
    assert.deepEqual(run.logs, [
      ["error", "[GW COOP AI] unit specs not read: no specs"],
    ]);
    mock.timers.tick(8000);
    assert.equal(run.logs.length, 1);
  });

  it("keeps the groups it already judges by when the specs then fail", async () => {
    const specs = pending();
    const run = build({ specs });
    mock.timers.tick(8000);
    const groups = run.lookup();

    specs.reject(new Error("late failure"));
    await settle();

    assert.equal(run.lookup(), groups);
    assert.match(
      run.logs[1][1],
      /^\[GW COOP AI\] unit specs not read: Error: late failure/
    );
  });
});

describe("what a co-op AI player's cards are judged with", () => {
  it("hands the pings the lookup and the judge", () => {
    const run = build();
    const pings = run.pings;

    assert.equal(pings.galaxy, run.params.galaxy);
    assert.equal(pings.inventory, run.hostInventory);
    assert.equal(pings.starCardsBusy, run.params.starCardsBusy);
    assert.equal(pings.aiStarDealing, run.params.aiStarDealing);
    assert.equal(pings.plainSave, plainSave);
    assert.equal(pings.judge.lookup, pings.lookup);
    assert.equal(
      pings.judge.isLoadout,
      run.params.helpers.isStartLoadoutCardId
    );
    assert.deepEqual(pings.judge.effects, { name: "effects" });
  });

  it("applies cards on the stock bank, abandoning an apply after 10 seconds", () => {
    const run = build();

    assert.deepEqual(seen.effectsOptions, {
      GWInventory: run.params.GWInventory,
      stockBank: { name: "stock bank" },
      timeoutMs: 10000,
    });
  });

  it("counts the host, the connected viewers and the other AIs as the team", () => {
    const run = build();

    const domains = run.pings.judge.teamDomains("gwo_ai_1", "lookup");

    assert.deepEqual(domains, {
      teammates: {
        teammates: [HOST_SAVED, { owner: "viewer" }, { owner: "ai_2" }],
      },
      lookup: "lookup",
    });
    assert.equal(seen.viewerGames[0], run.game);
  });

  it("knows a card names units when card_units.js lists some for it", () => {
    const run = build({
      cardsToUnits: [
        { id: "named", units: ["unit"] },
        { id: "empty", units: [] },
      ],
    });
    const namesUnits = run.pings.judge.namesUnits;

    assert.equal(namesUnits("named"), true);
    assert.equal(namesUnits("empty"), false);
    assert.equal(namesUnits("absent"), false);

    release();
    const unlisted = build();
    assert.equal(unlisted.pings.judge.namesUnits("named"), false);
  });

  it("weighs a card by its own deal() on a plain copy of the applied inventory", () => {
    const dealt = [];
    const run = build({
      cards: [
        undefined,
        {
          id: "battle_card",
          getContext: (galaxy, inventory) => ({ galaxy, inventory }),
          deal: (star, context, inventory) => {
            dealt.push({ star, context, inventory });
            return { chance: 42 };
          },
        },
      ],
    });
    const applied = { units: ["u"], method: () => "dropped" };

    const chance = run.pings.judge.chanceOf(
      { id: "battle_card" },
      applied,
      run.stars[2]
    );

    assert.equal(chance, 42);
    const inventory = run.loadedInventories[0];
    assert.deepEqual(inventory.data, { units: ["u"] });
    assert.equal(dealt[0].star, run.stars[2]);
    assert.equal(dealt[0].inventory, inventory);
    assert.equal(dealt[0].context.galaxy, run.params.galaxy);
  });

  it("gives no chance to a card it cannot weigh", () => {
    const run = build({
      cards: [
        { id: "no_deal" },
        { id: "no_number", deal: () => ({ chance: "high" }) },
        { id: "nothing", deal: () => undefined },
        {
          id: "throws",
          deal: () => {
            throw new Error("bad card");
          },
        },
      ],
    });
    const chanceOf = run.pings.judge.chanceOf;

    for (const id of ["absent", "no_deal", "no_number", "nothing", "throws"]) {
      assert.equal(chanceOf({ id }, {}, run.stars[0]), 0, id);
    }
    assert.deepEqual(run.logs, [
      ["error", "[GW COOP AI] throws deal() threw: bad card"],
    ]);
  });

  it("sees what an AI of a race fields only through the specs", async () => {
    const run = build();
    const fielded = run.pings.judge.fielded;

    assert.equal(await fielded({ race: "legion" }, undefined), undefined);
    assert.equal(
      await fielded({ race: "legion" }, { via: "groups" }),
      undefined
    );
    assert.deepEqual(seen.primes, []);
  });

  it("builds one view of what a race fields for each specs lookup", async () => {
    const specs = pending();
    const cells = {
      legion: { race: { units: ["legion_unit"] } },
      bugs: { race: { units: [] } },
    };
    const run = build({ specs, cells });
    specs.resolve({ units: ["spec_unit"] });
    await settle();
    const fielded = run.pings.judge.fielded;
    const lookup = run.lookup();

    const first = await fielded({ race: "legion" }, lookup);
    const again = await fielded({ race: "legion" }, lookup);
    const newer = { via: "specs" };
    await fielded({ race: "legion" }, newer);

    assert.deepEqual(first, { fielded: "legion" });
    assert.equal(again, first);
    assert.deepEqual(seen.primes, [
      ["legion", ["spec_unit"]],
      ["legion", ["spec_unit"]],
    ]);
    assert.equal(seen.views[0].cells, cells.legion);
    assert.equal(seen.views[0].races, run.params.races);
    assert.equal(seen.views[0].lookup, lookup);
    assert.equal(seen.views[1].lookup, newer);
    assert.equal(await fielded({ race: "bugs" }, lookup), undefined);
    assert.equal(await fielded({ race: "exiles" }, lookup), undefined);
  });

  it("aims a race's view at its co-op tree's keys, on the cells the view is built on", async () => {
    const specs = pending();
    const cells = {
      legion: { race: { units: ["legion_unit"] } },
      mla: { race: { units: ["addon_unit"] } },
    };
    const run = build({ specs, cells });
    specs.resolve({ units: ["spec_unit"] });
    await settle();
    const lookup = run.lookup();

    await run.pings.judge.fielded({ race: "legion" }, lookup);
    await run.pings.judge.fielded({ race: "mla" }, lookup);

    assert.deepEqual(seen.keys, [
      {
        race: "legion",
        brain: "brain:coop:legion",
        source: "/source/coop/legion/",
        cells: cells.legion,
        unitCells: UNIT_CELLS,
        gwoRaces: run.params.races,
      },
    ]);
    assert.deepEqual(seen.views[0].aim, {
      table: { tableOf: { race: "legion" } },
      loads: { file: {} },
    });
    assert.equal(seen.views[1].aim, undefined, "an add-on view takes none");
  });

  it("counts the AI mods as saved, and says so, where the aim's inputs are not read", async () => {
    const specs = pending();
    const cells = { legion: { race: { units: ["legion_unit"] } } };
    const run = build({
      specs,
      cells,
      loads: () => Promise.reject("no listing"),
    });
    specs.resolve({ units: ["spec_unit"] });
    await settle();

    const view = await run.pings.judge.fielded(
      { race: "legion" },
      run.lookup()
    );

    assert.deepEqual(view, { fielded: "legion" });
    assert.equal(seen.views[0].aim, undefined);
    assert.deepEqual(run.logs, [
      [
        "error",
        "[GW COOP AI] legion AI mods counted as saved: described no listing",
      ],
    ]);
  });

  it("waits for the aim's inputs before it builds the view", async () => {
    const specs = pending();
    const keys = pending();
    const cells = { legion: { race: { units: ["legion_unit"] } } };
    const run = build({ specs, cells, keys: () => keys });
    specs.resolve({ units: ["spec_unit"] });
    await settle();

    const view = run.pings.judge.fielded({ race: "legion" }, run.lookup());
    await settle();
    assert.deepEqual(seen.views, []);

    keys.resolve({ race: "legion" });
    await view;
    assert.equal(seen.views.length, 1);
  });
});

describe("the co-op AI driver's wiring", () => {
  it("is not set up under shared tech", () => {
    const run = build({ perPlayer: false });

    assert.equal(run.driver, undefined);
    assert.equal(run.model.gwoCoopAi.tech(), undefined);
    assert.deepEqual(seen.decks, []);
  });

  it("settles the AIs' deals only as the host of a session", () => {
    const run = build();

    assert.deepEqual(run.driver.records(), [AI_RECORD, OTHER_AI]);
    run.state.host = false;
    assert.deepEqual(run.driver.records(), []);
  });

  it("finds an AI's record, and no one else's", () => {
    const run = build();

    assert.equal(run.driver.find("gwo_ai_2"), OTHER_AI);
    assert.equal(run.driver.find("uber_v1"), undefined);
  });

  it("reads the host's deals, the galaxy and the co-op hands", () => {
    const run = build();
    const driver = run.driver;

    assert.equal(driver.hostDealCount(), 5);
    assert.equal(driver.dealCount, run.model.getCoopPlayerTechCardDealCount);
    assert.equal(driver.entryFor, run.model.getHostTechCardDealEntry);
    assert.equal(driver.starAt(2), run.stars[2]);
    assert.equal(driver.dealHand, run.params.coopDeal.pendingHandForRecord);
    assert.equal(driver.rerollHand, run.params.coopReroll.rerollHandForRecord);
    assert.equal(
      driver.computeRerollDeal,
      run.params.coopReroll.computeRerollDeal
    );
    assert.equal(driver.enqueue, run.model.enqueueGwCampaignStateApply);
    assert.equal(driver.running, run.model.gwoCoopAi.driving);
  });

  it("judges with the pings' judge", () => {
    const run = build();
    const judge = run.pings.judge;

    for (const name of [
      "effects",
      "lookup",
      "fielded",
      "teamDomains",
      "namesUnits",
      "chanceOf",
      "isLoadout",
    ]) {
      assert.equal(run.driver[name], judge[name], name);
    }
    assert.equal(run.driver.rerollsRemain, run.params.helpers.rerollsRemain);
    assert.equal(run.driver.armyGap, run.params.gwoAI.armyGap);
    assert.equal(run.driver.armyGapClosable, run.params.gwoAI.armyGapClosable);
  });

  it("keys an AI's decisions and factory draws by its serial", () => {
    const run = build();

    assert.deepEqual(run.driver.decisionRng(AI_RECORD, 2, 1), [
      "decision",
      "war",
      3,
      2,
      1,
    ]);
    assert.deepEqual(run.driver.factoryRng(AI_RECORD, 2), [
      "factory",
      "war",
      3,
      2,
    ]);
  });

  it("writes an AI's record through the co-op host", () => {
    const run = build();

    assert.equal(
      run.driver.write(AI_RECORD, { techCardDealCount: 1 }),
      "stored"
    );
    assert.deepEqual(seen.upserts, [
      [run.game, AI_RECORD, { techCardDealCount: 1 }],
    ]);
  });

  it("runs only as the host, with a lookup, no star cards dealing and the war on", async () => {
    const run = build({ specs: Promise.resolve({ units: [] }) });
    await settle();

    assert.equal(run.driver.canRun(), true);
    run.starCardsBusy(true);
    assert.equal(run.driver.canRun(), false);
    run.starCardsBusy(false);
    run.state.over = true;
    assert.equal(run.driver.canRun(), false);
    run.state.over = false;
    run.state.session = false;
    assert.equal(run.driver.canRun(), false);
  });

  // factoryCards reads model.gwoCardsToUnits, which card_units.js fills.
  it("waits for the deck and card_units.js before it runs", async () => {
    const run = build({
      specs: Promise.resolve({ units: [] }),
      cardsLoaded: false,
    });
    await settle();

    assert.equal(run.driver.canRun(), false);
    run.cardsLoaded.forEach((fn) => fn());
    assert.equal(run.driver.canRun(), true);
  });

  it("has no lookup to run with before the specs or the groups are in", () => {
    const run = build();

    assert.equal(run.driver.canRun(), false);
  });

  it("refreshes the inventory view, saves, then publishes after a pass", async () => {
    const run = build();

    await run.driver.afterPass();

    assert.deepEqual(seen.events, [
      ["refresh"],
      ["save", true, false],
      ["publish", "gwo_coop_ai_deal"],
    ]);
  });

  it("starts a pass whenever anything it depends on changes", () => {
    const run = build();
    const driverComputed = run.computeds[1];
    run.timers.delayed.splice(0);

    driverComputed();
    run.timers.delayed.forEach((timer) => timer.fn());

    assert.equal(seen.runs.length, 1);
  });

  it("gives an AI with no land factory the T1 factory cards its race can use and its cards leave", () => {
    const run = build({
      gwoCards: [
        "gwc_enable_air_t1",
        "gwc_enable_bots_t1",
        "gwc_enable_vehicles_t1",
      ],
      cardsToUnits: [
        { id: "gwc_enable_vehicles_t1", units: ["vehicle_factory"] },
      ],
    });

    const offered = run.driver.factoryCards(AI_RECORD, {
      strippedUnits: ["vehicle_factory"],
    });

    assert.deepEqual(offered, ["gwc_enable_air_t1"]);
    assert.deepEqual(
      run.driver.factoryCards(AI_RECORD, { strippedUnits: [] }),
      ["gwc_enable_air_t1", "gwc_enable_vehicles_t1"]
    );
  });

  it("offers no factory card the war's deck lacks", () => {
    const run = build({ gwoCards: ["gwc_enable_vehicles_t1"] });

    assert.deepEqual(run.driver.factoryCards(AI_RECORD, {}), [
      "gwc_enable_vehicles_t1",
    ]);
  });

  it("deals a card as the dealer would, on a plain copy of the applied inventory", () => {
    const run = build({ cards: ["deck"] });

    const dealt = run.driver.dealCard(
      "gwc_enable_air_t1",
      { units: ["u"], method: () => "dropped" },
      run.stars[1]
    );

    assert.deepEqual(dealt.request, {
      id: "gwc_enable_air_t1",
      galaxy: run.params.galaxy,
      inventory: run.loadedInventories[0],
      star: run.stars[1],
    });
    assert.deepEqual(run.loadedInventories[0].data, { units: ["u"] });
    assert.equal(dealt.loaded, run.params.loaded);
    assert.equal(dealt.cards, run.params.cards);
  });
});

describe("a new co-op AI player's starting tech", () => {
  it("deals every loadout the AI could start with, once each", () => {
    build({
      startingCards: [{ id: "mod_start" }, { id: "gwc_start_air" }],
      newStartCards: [{ id: "mod_locked" }, {}],
    });

    const deck = seen.decks[0];
    assert.deepEqual(deck.ids, [
      "gwc_start_vehicle",
      "gwc_start_air",
      "mod_start",
      "gwc_start_orbital",
      "gwaio_start_ceo",
      "mod_locked",
    ]);
    assert.equal(deck.count, 6);
    assert.deepEqual(deck.cards, []);
    assert.deepEqual(deck.deck, []);
  });

  it("is ready once a lookup is in", async () => {
    const specs = pending();
    const run = build({ specs });
    const tech = run.model.gwoCoopAi.tech();
    assert.equal(tech.ready(), false);

    specs.resolve({ units: [] });
    await settle();

    assert.equal(tech.ready(), true);
  });

  it("scores the loadouts the host has unlocked for the AI's race, as a viewer's are dealt", async () => {
    const run = build({ aiCannotUse: ["mod_warp"] });
    const record = {
      playerId: "gwo_ai_9",
      commander: "new_commander",
      gwaioAi: { serial: 9, name: "Able" },
    };

    const start = await run.model.gwoCoopAi
      .tech()
      .startingTech({ record, race: "legion" });

    assert.equal(start, "start");
    const chosen = seen.chosen;
    assert.equal(chosen.name, "Able");
    assert.equal(chosen.commander, "new_commander");
    assert.deepEqual(chosen.rng, ["loadout", "war", 9]);
    assert.deepEqual(chosen.baseline, {
      cards: [{ id: "gwc_start" }],
      tags: {
        global: {
          commander: "new_commander",
          playerFaction: "global:playerFaction",
          race: "legion",
        },
      },
    });
    const candidates = chosen.candidates.candidates;
    assert.deepEqual(candidates.starting, [
      "gwc_start_vehicle",
      "gwc_start_air",
    ]);
    assert.deepEqual(candidates.locked, [
      "gwc_start_orbital",
      "gwaio_start_ceo",
    ]);
    assert.equal(candidates.unlocked("gwc_start_orbital"), false);
    assert.equal(candidates.unlocked("gwaio_start_ceo"), true);
    assert.deepEqual(candidates.raceLocks("gwc_start_air"), [
      "legion",
      "gwc_start_air",
    ]);
    assert.deepEqual(candidates.aiCannotUse, ["gwaio_start_warp", "mod_warp"]);
    assert.deepEqual(chosen.teamDomains.teammates.teammates, [
      HOST_SAVED,
      { owner: "viewer" },
      { owner: "ai_1" },
      { owner: "ai_2" },
    ]);
    assert.deepEqual(chosen.used.inventories, [
      HOST_SAVED,
      { owner: "viewer" },
      { owner: "ai_1" },
      { owner: "ai_2" },
    ]);
  });

  it("builds a candidate as the loadout scene builds a viewer's, with its Sub Commanders", async () => {
    const run = build();
    const record = {
      playerId: "gwo_ai_9",
      commander: "new_commander",
      gwaioAi: { serial: 9, name: "Able" },
    };
    await run.model.gwoCoopAi.tech().startingTech({ record, race: "mla" });

    const built = await seen.chosen.build("gwc_start_air");

    assert.deepEqual(built, {
      saved: { built: "gwc_start_air" },
      playerKey: "key_gwo_ai_9",
    });
    const options = seen.builds[0];
    assert.equal(options.loadoutCardId, "gwc_start_air");
    assert.equal(options.commander, "new_commander");
    assert.equal(options.playerFaction, "global:playerFaction");
    assert.equal(options.playerRace, "mla");
    assert.equal(options.star, run.stars[1]);
    assert.equal(options.galaxy, run.params.galaxy);
    assert.equal(options.GWInventory, run.params.GWInventory);
    assert.equal(options.gwoDeal, run.params.gwoDeal);
    assert.equal(options.loaded, seen.decks[0].promise);
    assert.equal(options.loadedCards, seen.decks[0].cards);
  });

  it("does not track the loadouts in use without Unique AI loadouts", async () => {
    const run = build({ uniqueAiLoadouts: false });

    await run.model.gwoCoopAi.tech().startingTech({
      record: { playerId: "x", gwaioAi: { serial: 1, name: "X" } },
      race: "mla",
    });

    assert.equal(seen.chosen.used, undefined);
    assert.deepEqual(seen.chosen.candidates.candidates.aiCannotUse, [
      "gwaio_start_warp",
    ]);
  });
});
