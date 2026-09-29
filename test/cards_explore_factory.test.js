"use strict";

// gw_play/cards_explore.js installs model.explore: the hand at the current
// star, dealt from GWO's deck with the star's pre-dealt card last, and the deal
// the co-op players are owed a hand for.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  makeDeferred,
  rejected,
  resolved,
} = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");
const {
  installFakeLodashTimers,
} = require("../scripts/lib/fake-lodash-timers.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_explore.js"
);
const realHelpers = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js"
);

const TREASURE_STAR = 6;
const LOADOUT = { id: "gwc_start_orbital" };

function setup(overrides = {}) {
  const options = Object.assign(
    {
      viewer: false,
      replaying: false,
      setupBlocked: false,
      aiDeciding: false,
      gameExplores: true,
      currentStar: 2,
      preDealt: [{ id: "pre_dealt" }],
      cardsOffered: 3,
      rerollsUsed: 0,
      dealt: [{ id: "dealt_a" }, { id: "dealt_b" }],
      holdDeal: undefined,
      treasureLoadout: LOADOUT,
      unlocked: true,
      shownLoadout: false,
      failCoopDeal: false,
    },
    overrides
  );
  const calls = {
    explores: 0,
    actions: [],
    sounds: [],
    deals: [],
    treasurePicks: [],
    records: [],
    coopDeals: [],
    saves: [],
    wins: [],
    logs: [],
  };

  const turnState = makeObservable("begin");
  const star = {
    cardList: makeObservable(options.preDealt.slice()),
    hasCard: () => true,
  };
  const game = {
    explore: () => {
      calls.explores += 1;
      if (options.gameExplores) {
        turnState("explore");
      }
      return options.gameExplores;
    },
    currentStar: () => options.currentStar,
    galaxy: () => ({
      stars: () => {
        const stars = [];
        stars[options.currentStar] = star;
        return stars;
      },
    }),
    stats: () => ({ turns: () => 5 }),
    turnState,
    recordHostTechCardDeal: (starIndex, dealOptions) => {
      calls.records.push([starIndex, dealOptions]);
      return { dealIndex: calls.records.length };
    },
  };
  const scanning = makeObservable(false);
  const offerRerolls = makeObservable(true);

  const stubs = createGlobalStubs();
  installFakeJQuery(stubs);
  const timers = installFakeLodashTimers();
  stubs.setGlobal("api", {
    audio: { playSound: (sound) => calls.sounds.push(sound) },
  });
  stubs.setGlobal("console", {
    log: (text) => calls.logs.push(["log", text]),
    warn: (text) => calls.logs.push(["warn", text]),
    error: (text) => calls.logs.push(["error", text]),
  });
  const model = {
    isCampaignViewer: () => options.viewer,
    gwCampaignReplayingAction: options.replaying,
    gwCampaignPlayerSetupBlocked: () => options.setupBlocked,
    sendCampaignAction: (name, payload) => calls.actions.push([name, payload]),
    scanning,
    gwoRerollsUsed: () => options.rerollsUsed,
    gwoOfferRerolls: offerRerolls,
    currentSystemCardList: () => [{ isLoadout: () => options.shownLoadout }],
    dealCoopPlayerPendingTechCards: (starIndex, dealtStar, dealOptions) => {
      calls.coopDeals.push([starIndex, dealtStar, dealOptions]);
      return options.failCoopDeal ? rejected("no server") : resolved(["sent"]);
    },
    win: (index) => calls.wins.push(index),
  };
  stubs.setGlobal("model", model);

  const inventory = { owner: "host" };
  makeFactory({
    game,
    inventory,
    helpers: Object.assign({}, realHelpers, {
      cardsOfferedCount: (offer, offeredTo) => {
        calls.offeredTo = [offer, offeredTo];
        return options.cardsOffered;
      },
    }),
    numCardsToOffer: 3,
    chooseCards: (request) => {
      calls.deals.push(request);
      return options.holdDeal
        ? options.holdDeal.promise()
        : resolved(options.dealt.slice());
    },
    coopAiDeciding: () => options.aiDeciding,
    startCardUnlocked: (card) => {
      calls.unlockChecks = (calls.unlockChecks || []).concat(card.id);
      return options.unlocked;
    },
    gwoTreasure: {
      isTreasureStar: (settings, index) => settings.treasureStar === index,
      pickTreasureLoadout: (pick) => {
        calls.treasurePicks.push(pick);
        return options.treasureLoadout;
      },
    },
    gwoSettings: { treasureStar: TREASURE_STAR },
    gwoRaces: { raceOf: (of) => (of === inventory ? "legion" : "unknown") },
    gwoStreams: {
      exploreDealRng: (warRng, starIndex, turns, rerolls) => ({
        warRng,
        starIndex,
        turns,
        rerolls,
      }),
      treasureLoadoutRng: (warRng, playerKey, starIndex) => ({
        warRng,
        playerKey,
        starIndex,
      }),
    },
    warRng: "war",
    gwoSave: (saved, withStars) => {
      calls.saves.push([saved === game, withStars]);
      return resolved();
    },
  });

  return {
    calls,
    game,
    star,
    scanning,
    offerRerolls,
    timers,
    inventory,
    model,
    options,
    restore: () => {
      timers.restore();
      stubs.restoreGlobals();
    },
  };
}

const { build, release } = trackActive(setup);

// Runs what model.explore left on lodash's clock.
const runDelayed = (run) => {
  const delayed = run.timers.delayed.splice(0);
  delayed.forEach((timer) => timer.fn());
  return delayed.map((timer) => timer.wait);
};

describe("model.explore", () => {
  it("does nothing on a viewer unless it replays the host's", () => {
    const run = build({ viewer: true });

    assert.equal(run.model.explore(), undefined);
    assert.equal(run.calls.explores, 0);
  });

  it("waits while a player sets up or an AI player settles its deals", () => {
    for (const blocked of [{ setupBlocked: true }, { aiDeciding: true }]) {
      release();
      const run = build(blocked);
      assert.equal(run.model.explore(), undefined);
      assert.equal(run.calls.explores, 0);
    }
  });

  it("goes ahead for a host reroll however the war is held", async () => {
    const run = build({ setupBlocked: true, aiDeciding: true });

    await run.model.explore(true);

    assert.equal(run.calls.explores, 1);
  });

  it("replays a host's explore while an AI player settles, not while a player sets up", async () => {
    const deciding = build({ replaying: true, aiDeciding: true });
    await deciding.model.explore();
    assert.equal(deciding.calls.explores, 1);

    release();
    const settingUp = build({ replaying: true, setupBlocked: true });
    assert.equal(settingUp.model.explore(), undefined);
    assert.equal(settingUp.calls.explores, 0);
  });

  it("does nothing more when the game refuses to explore", () => {
    const run = build({ gameExplores: false });

    assert.equal(run.model.explore(), undefined);
    assert.deepEqual(run.calls.actions, []);
    assert.equal(run.scanning(), false);
  });

  it("deals the offer less spent rerolls and the pre-dealt card, which goes last", async () => {
    const run = build({ cardsOffered: 4, rerollsUsed: 1 });

    const explored = run.model.explore();
    assert.equal(run.scanning(), true);
    await explored;

    assert.deepEqual(run.calls.offeredTo, [3, run.inventory]);
    const request = run.calls.deals[0];
    assert.equal(request.count, 2);
    assert.equal(request.star, run.star);
    assert.deepEqual(request.systemCards, [{ id: "pre_dealt" }]);
    assert.deepEqual(request.rng, {
      warRng: "war",
      starIndex: 2,
      turns: 5,
      rerolls: 1,
    });
    assert.equal(request.inventory, undefined);
    assert.deepEqual(run.star.cardList(), [
      { id: "dealt_a" },
      { id: "dealt_b" },
      { id: "pre_dealt" },
    ]);
    assert.deepEqual(run.calls.sounds, ["/VO/Computer/gw/board_exploring"]);
    assert.deepEqual(run.calls.actions, [
      ["explore", { star: 2 }],
      [
        "sync_star_cards",
        {
          star: 2,
          cards: [{ id: "dealt_a" }, { id: "dealt_b" }, { id: "pre_dealt" }],
        },
      ],
    ]);
  });

  it("records the deal the co-op players are owed, deals it, then saves", async () => {
    const run = build();

    await run.model.explore();

    assert.deepEqual(run.calls.records, [[2, { startLoadoutCards: [] }]]);
    assert.deepEqual(run.calls.coopDeals, [
      [2, run.star, { dealIndex: 1, startLoadoutCards: [] }],
    ]);
    assert.deepEqual(run.calls.saves, [[true, false]]);
  });

  it("stops the scan two seconds after the deal, without waiting for it", async () => {
    const run = build();

    await run.model.explore();
    assert.equal(run.scanning(), true);

    assert.deepEqual(runDelayed(run), [2000]);
    assert.equal(run.scanning(), false);
  });

  it("records nothing for a host reroll", async () => {
    const run = build();

    await run.model.explore(true);

    assert.deepEqual(run.calls.records, []);
    assert.deepEqual(run.calls.coopDeals, []);
    assert.deepEqual(run.calls.saves, [[true, false]]);
  });

  it("offers the treasure planet's loadout alone, drawn from the host's unlocks", async () => {
    const run = build({ currentStar: TREASURE_STAR, dealt: [] });

    await run.model.explore();

    const pick = run.calls.treasurePicks[0];
    assert.equal(pick.race, "legion");
    assert.deepEqual(pick.rng, {
      warRng: "war",
      playerKey: undefined,
      starIndex: TREASURE_STAR,
    });
    assert.equal(pick.isUnlocked({ id: "x" }), true);
    assert.deepEqual(run.star.cardList(), [LOADOUT]);
    assert.equal(run.calls.deals[0].count, 2);
    assert.deepEqual(run.calls.records, [
      [TREASURE_STAR, { startLoadoutCards: [LOADOUT] }],
    ]);
  });

  it("keeps a locked loadout apart from the hand, and still records it", async () => {
    const run = build({ currentStar: TREASURE_STAR, unlocked: false });

    await run.model.explore();

    assert.deepEqual(run.star.cardList(), [LOADOUT]);
    assert.deepEqual(run.calls.unlockChecks, [LOADOUT.id]);
    assert.deepEqual(run.calls.coopDeals[0][2], {
      dealIndex: 1,
      startLoadoutCards: [LOADOUT],
    });
  });

  it("deals a full hand at a treasure planet with no loadout left to offer", async () => {
    const run = build({
      currentStar: TREASURE_STAR,
      treasureLoadout: undefined,
    });

    await run.model.explore();

    assert.equal(run.calls.deals[0].count, 3);
    assert.deepEqual(run.calls.deals[0].systemCards, []);
  });

  it("checks a pre-dealt card's unlock only when it is a loadout", async () => {
    const run = build();

    await run.model.explore();

    assert.equal(run.calls.unlockChecks, undefined);
  });

  it("replays a host's explore without announcing it or drawing a loadout", async () => {
    const run = build({
      viewer: true,
      replaying: true,
      currentStar: TREASURE_STAR,
    });

    await run.model.explore();

    assert.deepEqual(run.calls.actions, []);
    assert.deepEqual(run.calls.treasurePicks, []);
    assert.equal(run.calls.explores, 1);
  });

  it("drops a deal that lands after the exploration ended, and says so", async () => {
    const hold = makeDeferred();
    const run = build({ holdDeal: hold });

    const explored = run.model.explore();
    run.game.turnState("end");
    hold.resolve([{ id: "late" }]);
    await explored;

    assert.deepEqual(run.calls.records, []);
    assert.deepEqual(run.calls.logs, [
      ["log", "[GW COOP] discarded a stale explore deal star=2 turnState=end"],
    ]);
  });

  it("closes the rerolls when the offer shown is a loadout", async () => {
    const run = build({ shownLoadout: true });

    await run.model.explore();

    assert.equal(run.offerRerolls(), false);
  });

  it("ends an exploration that dealt nothing two seconds later", async () => {
    const run = build({ preDealt: [], dealt: [] });

    await run.model.explore();
    assert.deepEqual(run.calls.records, []);
    assert.deepEqual(run.calls.logs, [
      [
        "warn",
        "GWO: no tech card could be dealt at star 2; ending the exploration with nothing",
      ],
    ]);

    assert.deepEqual(runDelayed(run), [2000, 2000]);
    assert.deepEqual(run.calls.wins, [-1]);
  });

  it("stops the scan and fails when the co-op players' deal fails", async () => {
    const run = build({ failCoopDeal: true });

    await assert.rejects(
      () => Promise.resolve(run.model.explore()),
      (reason) => reason === "no server"
    );

    assert.equal(run.scanning(), false);
    assert.deepEqual(run.calls.saves, []);
    assert.deepEqual(run.calls.logs, [
      [
        "error",
        "[GW COOP] failed to deal co-op player pending tech cards: no server",
      ],
    ]);
  });
});
