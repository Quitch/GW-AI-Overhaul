"use strict";

// gw_play/coop_star_cards_view.js: the viewer-side read model for the per-player
// pre-dealt star cards the host writes. The record readers come through the
// module's test-only hook; the factory's name cache is driven against a minimal
// ko.observable and requireGW below.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const view = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_star_cards_view.js"
);

const makeFactory = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_star_cards_view.js"
);

describe("starCardIdForRecord", () => {
  const record = {
    gwaioStarCards: { turn: 3, cards: { 12: { id: "gwc_combat_bots" } } },
  };

  it("reads the id of this viewer's card for the star", () => {
    assert.equal(view.starCardIdForRecord(record, 12), "gwc_combat_bots");
  });

  // A viewer who has just joined, or a star not refreshed for them yet, shows
  // nothing rather than falling back to the host's card.
  it("is undefined for a star this viewer has no card on", () => {
    assert.equal(view.starCardIdForRecord(record, 13), undefined);
    assert.equal(view.starCardIdForRecord({}, 12), undefined);
    assert.equal(view.starCardIdForRecord(undefined, 12), undefined);
  });

  it("is undefined for a card stored without an id", () => {
    assert.equal(
      view.starCardIdForRecord(
        { gwaioStarCards: { cards: { 12: { unique: 0.4 } } } },
        12
      ),
      undefined
    );
  });
});

describe("shouldUseViewerStarCard", () => {
  it("is true only for a viewer playing with per-player tech", () => {
    assert.equal(view.shouldUseViewerStarCard(true, true), true);
    assert.equal(view.shouldUseViewerStarCard(true, false), false);
    assert.equal(view.shouldUseViewerStarCard(false, true), false);
    assert.equal(view.shouldUseViewerStarCard(false, false), false);
  });

  it("is reachable from the factory too, for bindings holding one", () => {
    assert.equal(makeFactory.shouldUseViewerStarCard(true, true), true);
  });
});

// Just enough knockout for the name cache: a writable observable, with no
// dependency tracking - the factory only reads and replaces the whole map.
function observable(initial) {
  let value = initial;
  return function (next) {
    if (arguments.length) {
      value = next;
    }
    return value;
  };
}

function setup(overrides = {}) {
  const options = Object.assign(
    { record: undefined, cards: {}, autoResolve: true },
    overrides
  );
  const calls = { requested: [] };
  const waiting = [];

  const stubs = createGlobalStubs();
  stubs.setGlobal("ko", { observable });
  stubs.setGlobal("model", {
    currentCoopPlayerInventoryData: () => options.record,
  });
  stubs.setGlobal("requireGW", (ids, done) => {
    const cardId = ids[0].slice("cards/".length);
    calls.requested.push(cardId);
    const deliver = () => done(options.cards[cardId]);
    if (options.autoResolve) {
      deliver();
    } else {
      waiting.push(deliver);
    }
  });

  return {
    viewModel: makeFactory(),
    calls,
    options,
    // Fires the requireGW callbacks a test deliberately held back.
    deliver: () => waiting.splice(0).forEach((fire) => fire()),
    restore: () => stubs.restoreGlobals(),
  };
}

let active;

afterEach(() => {
  if (active) {
    active.restore();
    active = undefined;
  }
});

function build(overrides) {
  active = setup(overrides);
  return active;
}

describe("coop star cards view model - cardIdForStar", () => {
  it("reads this viewer's own card off the live inventory record", () => {
    const { viewModel } = build({
      record: { gwaioStarCards: { cards: { 5: { id: "gwc_combat_bots" } } } },
    });

    assert.equal(viewModel.cardIdForStar(5), "gwc_combat_bots");
    assert.equal(viewModel.cardIdForStar(6), undefined);
  });

  // A viewer whose record has not arrived yet shows nothing rather than
  // throwing into the galaxy map's bindings.
  it("is undefined before this viewer has an inventory record", () => {
    const { viewModel } = build();
    assert.equal(viewModel.cardIdForStar(5), undefined);
  });
});

describe("coop star cards view model - cardName", () => {
  it("has no name for an id that is not one", () => {
    const { viewModel, calls } = build();
    assert.equal(viewModel.cardName(""), "");
    assert.equal(viewModel.cardName(undefined), "");
    assert.equal(viewModel.cardName(42), "");
    assert.deepEqual(calls.requested, []);
  });

  // The card module loads asynchronously, so the first read always misses;
  // writing the cache is what re-evaluates the computed that missed.
  it("returns nothing on the first read, then the summary once loaded", () => {
    const { viewModel } = build({
      cards: { gwc_combat_bots: { summarize: () => "Combat Bots" } },
      autoResolve: false,
    });

    assert.equal(viewModel.cardName("gwc_combat_bots"), "");
    active.deliver();
    assert.equal(viewModel.cardName("gwc_combat_bots"), "Combat Bots");
  });

  it("asks for each card once, however often it is read", () => {
    const { viewModel, calls } = build({
      cards: { gwc_combat_bots: { summarize: () => "Combat Bots" } },
      autoResolve: false,
    });

    viewModel.cardName("gwc_combat_bots");
    viewModel.cardName("gwc_combat_bots");
    active.deliver();
    viewModel.cardName("gwc_combat_bots");

    assert.deepEqual(calls.requested, ["gwc_combat_bots"]);
  });

  // A card that never resolves would otherwise be re-requested on every frame
  // the galaxy map redraws.
  it("caches an empty name for a card with no summary of its own", () => {
    const { viewModel, calls } = build({ cards: { gwc_mystery: {} } });

    assert.equal(viewModel.cardName("gwc_mystery"), "");
    assert.equal(viewModel.cardName("gwc_mystery"), "");

    assert.deepEqual(calls.requested, ["gwc_mystery"]);
  });

  it("caches an empty name for a card that failed to load", () => {
    const { viewModel, calls } = build({ cards: {} });

    viewModel.cardName("gwc_missing");
    viewModel.cardName("gwc_missing");

    assert.deepEqual(calls.requested, ["gwc_missing"]);
  });

  it("keeps the names of every card it has been asked for", () => {
    const { viewModel } = build({
      cards: {
        gwc_combat_bots: { summarize: () => "Combat Bots" },
        gwc_orbital: { summarize: () => "Orbital" },
      },
    });

    viewModel.cardName("gwc_combat_bots");
    viewModel.cardName("gwc_orbital");

    assert.equal(viewModel.cardName("gwc_combat_bots"), "Combat Bots");
    assert.equal(viewModel.cardName("gwc_orbital"), "Orbital");
  });
});
