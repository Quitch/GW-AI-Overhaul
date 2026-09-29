"use strict";

// gw_play/cards_win.js installs model.win: a viewer's choice goes to the host;
// the host's win applies the card, re-deals the AI stars' cards, saves, and
// only then opens the exit gate. A loadout won at a treasure planet is banked
// and wins no card.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  createGlobalStubs,
  trackActive,
} = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_win.js"
);
const realHelpers = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards_deal_helpers.js"
);

const DEFAULT_SOUND = "/VO/Computer/gw/board_tech_acquired";

// A card as stock's CardViewModel shows it once its module has loaded.
function view(id, found) {
  return {
    id: () => id,
    audio: () => (found ? { found } : undefined),
  };
}

function setup(overrides = {}) {
  const options = Object.assign(
    {
      viewer: false,
      coopChoice: false,
      replaying: false,
      shown: [view("gwc_damage_air", "/VO/air_found")],
      actionCards: [view("gwc_combat_bots", "/VO/bots_found")],
      failSubmit: false,
      didWin: true,
      gameOver: false,
      turnState: "end",
    },
    overrides
  );
  const events = [];
  const record = (name) =>
    function () {
      events.push([name].concat(Array.prototype.slice.call(arguments)));
    };

  // jQuery 2.1.4's own Deferred: a gate opens inside resolve(), before the
  // sound that follows it.
  const stubs = createGlobalStubs();
  const $ = installFakeJQuery(stubs, { sync: true });
  const resolved = (value) => $.Deferred().resolve(value).promise();
  const rejected = (reason) => $.Deferred().reject(reason).promise();
  stubs.setGlobal("api", {
    audio: { playSound: record("playSound") },
    tally: {
      incStatInt: (name) => {
        events.push(["incStatInt", name]);
        return resolved();
      },
    },
  });
  stubs.setGlobal("console", { error: record("error") });

  const exitGate = makeObservable();
  exitGate.subscribe((gate) => {
    events.push(["exitGate"]);
    gate.done(() => events.push(["exitGate resolved"]));
  });
  const model = {
    canUseCoopTechChoice: () => options.coopChoice,
    isCampaignViewer: () => options.viewer,
    gwCampaignReplayingAction: options.replaying,
    currentSystemCardList: () => options.shown,
    currentSystemActionCardList: () => options.actionCards,
    submitCoopTechCardChoice: (index) => {
      events.push(["submit", index]);
      return options.failSubmit ? rejected("offer closed") : resolved();
    },
    sendCampaignAction: record("sendCampaignAction"),
    exitGate,
    syncViewerStarsFromGame: record("syncViewerStarsFromGame"),
    maybePlayCaptureSound: record("maybePlayCaptureSound"),
    gameOver: () => options.gameOver,
  };
  stubs.setGlobal("model", model);

  const game = {
    currentStar: () => 5,
    turnState: () => options.turnState,
    winTurn: (index) => {
      events.push(["winTurn", index]);
      return resolved(options.didWin);
    },
  };
  makeFactory({
    game,
    helpers: realHelpers,
    treasureUnlocks: { bankOwnLoadout: record("bankOwnLoadout") },
    dealCardToSelectableAI: (win, turnState) => {
      events.push(["dealCardToSelectableAI", win, turnState]);
      return resolved();
    },
    gwoSave: (saved, withStars) => {
      events.push(["save", saved === game, withStars]);
      return resolved();
    },
  });

  return { events, model, restore: () => stubs.restoreGlobals() };
}

const { build } = trackActive(setup);

const VIEWER = { viewer: true, coopChoice: true };

describe("model.win on a viewer choosing its own tech", () => {
  it("sends the choice to the host and plays the card's sound", async () => {
    const run = build(VIEWER);

    await run.model.win(0);

    assert.deepEqual(run.events, [
      ["submit", 0],
      ["playSound", "/VO/air_found"],
    ]);
  });

  it("plays the stock sound for a card with none", async () => {
    const run = build(
      Object.assign({ shown: [view("gwc_damage_air")] }, VIEWER)
    );

    await run.model.win(0);

    assert.deepEqual(run.events, [
      ["submit", 0],
      ["playSound", DEFAULT_SOUND],
    ]);
  });

  it("banks a loadout itself and takes no card", async () => {
    const run = build(
      Object.assign({ shown: [view("gwc_start_orbital")] }, VIEWER)
    );

    await run.model.win(0);

    assert.deepEqual(run.events, [
      ["bankOwnLoadout", { id: "gwc_start_orbital" }],
      ["submit", -1],
      ["playSound", DEFAULT_SOUND],
    ]);
  });

  it("logs a choice the host refuses, and fails", async () => {
    const run = build(Object.assign({ failSubmit: true }, VIEWER));

    await assert.rejects(
      () => Promise.resolve(run.model.win(0)),
      (reason) => reason === "offer closed"
    );

    assert.deepEqual(run.events, [
      ["submit", 0],
      ["error", "[GW COOP] failed to acquire co-op tech choice: offer closed"],
    ]);
  });

  it("does nothing with no offer to choose from", () => {
    const run = build({ viewer: true });

    assert.equal(run.model.win(0), undefined);
    assert.deepEqual(run.events, []);
  });
});

describe("model.win on the host", () => {
  it("applies the card, re-deals the AI stars, saves, then opens the gate and plays the sound", async () => {
    const run = build();

    await run.model.win(0);

    assert.deepEqual(run.events, [
      ["sendCampaignAction", "win_choice", { selected_card_index: 0 }],
      ["exitGate"],
      ["winTurn", 0],
      ["maybePlayCaptureSound"],
      ["dealCardToSelectableAI", true, "end"],
      ["save", true, true],
      ["exitGate resolved"],
      ["playSound", "/VO/bots_found"],
    ]);
  });

  it("takes nothing and plays nothing for -1", async () => {
    const run = build({ actionCards: [] });

    await run.model.win(-1);

    assert.deepEqual(
      run.events.map((event) => event[0]),
      [
        "sendCampaignAction",
        "exitGate",
        "winTurn",
        "maybePlayCaptureSound",
        "dealCardToSelectableAI",
        "save",
        "exitGate resolved",
      ]
    );
    assert.deepEqual(run.events[2], ["winTurn", -1]);
  });

  it("plays the stock sound for a card with none", async () => {
    const run = build({ actionCards: [view("gwc_combat_bots")] });

    await run.model.win(0);

    assert.deepEqual(run.events.at(-1), ["playSound", DEFAULT_SOUND]);
  });

  it("banks a won loadout and wins no card", async () => {
    const run = build({ actionCards: [view("tgw_start_tank")] });

    await run.model.win(0);

    assert.deepEqual(run.events.slice(1, 4), [
      ["exitGate"],
      ["bankOwnLoadout", { id: "tgw_start_tank" }],
      ["winTurn", -1],
    ]);
  });

  it("refuses a choice it has no card data for", () => {
    const run = build({ actionCards: null });

    assert.equal(run.model.win(1), undefined);

    assert.deepEqual(run.events, [
      ["sendCampaignAction", "win_choice", { selected_card_index: 1 }],
      [
        "error",
        "[GW COOP] Cannot apply win choice without current system card data.",
      ],
    ]);
  });

  it("counts the war's victory before it opens the gate, and plays no sound", async () => {
    const run = build({ gameOver: true });

    await run.model.win(0);

    assert.deepEqual(run.events.slice(-2), [
      ["incStatInt", "gw_war_victory"],
      ["exitGate resolved"],
    ]);
  });

  it("logs a win the game refuses, fails, and leaves the gate shut", async () => {
    const run = build({ didWin: false });

    await assert.rejects(
      () => Promise.resolve(run.model.win(0)),
      (reason) => reason === "Failed winning turn"
    );

    assert.deepEqual(run.events.slice(1), [
      ["exitGate"],
      ["winTurn", 0],
      ["error", "Failed winning turn at star 5"],
    ]);
  });

  it("replays the host's win on a viewer, and syncs its stars", async () => {
    const run = build({ viewer: true, replaying: true });

    await run.model.win(0);

    assert.deepEqual(
      run.events.map((event) => event[0]),
      [
        "exitGate",
        "winTurn",
        "syncViewerStarsFromGame",
        "maybePlayCaptureSound",
        "dealCardToSelectableAI",
        "save",
        "exitGate resolved",
        "playSound",
      ]
    );
    assert.deepEqual(run.events[2], ["syncViewerStarsFromGame", "win_applied"]);
  });
});
