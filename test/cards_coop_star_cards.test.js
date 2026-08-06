"use strict";

// The measured half of gw_play/cards_coop_star_cards.js, reached through the
// module's test-only hook. The async refresh the factory drives is exercised
// in-game; what is pinned here is when it is allowed to run at all.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const starCards = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_star_cards.js"
);

const viewer = (id, extra) =>
  Object.assign({ id, name: id, role: "viewer" }, extra);

// Defaults to the "everything is level" case so each test overrides only what
// it exercises.
function ready(overrides = {}) {
  const records = overrides.records || { alice: { techCardDealCount: 4 } };
  return starCards.viewersReadyForStarRefresh({
    viewers: overrides.viewers || [viewer("alice")],
    findRecord: (client) => records[client.id],
    getDealCount: (record) => (record && record.techCardDealCount) || 0,
    hostDealCount: "hostDealCount" in overrides ? overrides.hostDealCount : 4,
    setupBlocked: overrides.setupBlocked || false,
    turnState: overrides.turnState || "begin",
  });
}

describe("viewersReadyForStarRefresh", () => {
  it("is ready when every viewer is level with the host", () => {
    assert.equal(ready(), true);
  });

  it("is ready with no viewers at all", () => {
    assert.equal(ready({ viewers: [] }), true);
  });

  // The bug this whole gate exists for. The server asks the host for one
  // catch-up deal at a time, so a rejoining viewer with ten outstanding deals
  // would otherwise drive ten full re-deals of every selectable star.
  it("is not ready while a viewer is still behind the host's deal count", () => {
    assert.equal(
      ready({ records: { alice: { techCardDealCount: 1 } }, hostDealCount: 4 }),
      false
    );
  });

  // gwCampaignPlayerSetupBlocked goes false in this window, which is why the
  // deal-count test above and not that flag is the authoritative one.
  it("is not ready between two catch-up deals", () => {
    assert.equal(
      ready({
        records: { alice: { techCardDealCount: 2 } },
        hostDealCount: 4,
        setupBlocked: false,
      }),
      false
    );
  });

  it("is not ready while a viewer holds an unanswered offer", () => {
    assert.equal(
      ready({
        records: {
          alice: { techCardDealCount: 4, pendingTechCards: { star: 1 } },
        },
      }),
      false
    );
  });

  it("is not ready while a viewer has no record yet", () => {
    assert.equal(ready({ records: {} }), false);
  });

  it("is not ready while a viewer is still loading or picking", () => {
    for (const state of [
      { loading: true },
      { requires_loadout: true },
      { loading_status: "picking_loadout" },
      { loading_status: "picking_tech_cards" },
    ]) {
      assert.equal(
        ready({ viewers: [viewer("alice", state)] }),
        false,
        JSON.stringify(state)
      );
    }
  });

  it("is not ready mid-exploration, when an offer is already on screen", () => {
    assert.equal(ready({ turnState: "explore" }), false);
  });

  it("is not ready if any one of several viewers is behind", () => {
    assert.equal(
      ready({
        viewers: [viewer("alice"), viewer("bob")],
        records: {
          alice: { techCardDealCount: 4 },
          bob: { techCardDealCount: 3 },
        },
      }),
      false
    );
  });

  it("treats an absent host deal count as zero rather than blocking", () => {
    assert.equal(
      ready({ records: { alice: {} }, hostDealCount: undefined }),
      true
    );
  });
});

describe("starCardForRecord", () => {
  const record = {
    gwaioStarCards: { turn: 3, cards: { 12: { id: "gwc_combat_bots" } } },
  };

  // The map is an object in a JSON save, so its keys are strings while every
  // caller holds a number.
  it("finds a card by its numeric star index", () => {
    assert.deepEqual(starCards.starCardForRecord(record, 12), {
      id: "gwc_combat_bots",
    });
    assert.deepEqual(starCards.starCardForRecord(record, "12"), {
      id: "gwc_combat_bots",
    });
  });

  it("is undefined for a star with no card", () => {
    assert.equal(starCards.starCardForRecord(record, 13), undefined);
  });

  it("survives a record that has never been refreshed", () => {
    assert.equal(starCards.starCardForRecord(undefined, 12), undefined);
    assert.equal(starCards.starCardForRecord({}, 12), undefined);
    assert.equal(
      starCards.starCardForRecord({ gwaioStarCards: {} }, 12),
      undefined
    );
    assert.equal(
      starCards.starCardForRecord({ gwaioStarCards: { cards: "junk" } }, 12),
      undefined
    );
  });
});

describe("pruneStarCards", () => {
  const cards = { 1: { id: "a" }, 2: { id: "b" }, 3: { id: "c" } };

  it("drops stars the player has already taken", () => {
    assert.deepEqual(
      starCards.pruneStarCards(cards, (star) => star !== 2),
      { 1: { id: "a" }, 3: { id: "c" } }
    );
  });

  it("does not mutate the map it was given", () => {
    starCards.pruneStarCards(cards, () => false);
    assert.equal(Object.keys(cards).length, 3);
  });

  it("returns an empty map for a missing or malformed field", () => {
    assert.deepEqual(
      starCards.pruneStarCards(undefined, () => true),
      {}
    );
    assert.deepEqual(
      starCards.pruneStarCards({ 1: "junk" }, () => true),
      {}
    );
  });
});

describe("buildStarCardsField", () => {
  it("layers this refresh's cards over the surviving ones", () => {
    assert.deepEqual(
      starCards.buildStarCardsField(
        { 1: { id: "old" }, 2: { id: "keep" } },
        { 1: { id: "new" } },
        7
      ),
      { turn: 7, cards: { 1: { id: "new" }, 2: { id: "keep" } } }
    );
  });

  it("does not mutate the surviving cards", () => {
    const existing = { 1: { id: "old" } };
    starCards.buildStarCardsField(existing, { 1: { id: "new" } }, 7);
    assert.deepEqual(existing, { 1: { id: "old" } });
  });
});

describe("starNeedsViewerCard", () => {
  const base = {
    canSelect: true,
    ai: {},
    treasurePlanet: false,
    staticTech: false,
    existingCard: undefined,
  };
  const needs = (overrides) =>
    starCards.starNeedsViewerCard(Object.assign({}, base, overrides));

  it("wants a card for a selectable AI star", () => {
    assert.equal(needs({}), true);
  });

  it("skips a star the player cannot reach, or that has no AI", () => {
    assert.equal(needs({ canSelect: false }), false);
    assert.equal(needs({ ai: undefined }), false);
  });

  // The treasure planet's offer is a loadout derived at exploration.
  it("skips a treasure planet", () => {
    assert.equal(needs({ treasurePlanet: true }), false);
  });

  it("re-deals every turn, unless the war froze its tech", () => {
    assert.equal(needs({ existingCard: { id: "a" } }), true);
    assert.equal(needs({ staticTech: true, existingCard: { id: "a" } }), false);
    assert.equal(needs({ staticTech: true }), true);
  });
});

describe("starRefreshKey", () => {
  const key = (overrides = {}) =>
    starCards.starRefreshKey(
      Object.assign(
        {
          turns: 3,
          hostDealCount: 4,
          players: [
            { key: "alice", dealCount: 4 },
            { key: "bob", dealCount: 4 },
          ],
        },
        overrides
      )
    );

  it("is stable for unchanged inputs, whatever order the players arrive in", () => {
    assert.equal(key(), key());
    assert.equal(
      key({
        players: [
          { key: "bob", dealCount: 4 },
          { key: "alice", dealCount: 4 },
        ],
      }),
      key()
    );
  });

  it("changes when the turn, the host, or any player moves on", () => {
    assert.notEqual(key({ turns: 4 }), key());
    assert.notEqual(key({ hostDealCount: 5 }), key());
    assert.notEqual(
      key({
        players: [
          { key: "alice", dealCount: 5 },
          { key: "bob", dealCount: 4 },
        ],
      }),
      key()
    );
  });

  it("changes when a viewer joins or leaves", () => {
    assert.notEqual(key({ players: [{ key: "alice", dealCount: 4 }] }), key());
  });
});
