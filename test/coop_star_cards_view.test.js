"use strict";

// The measured half of gw_play/coop_star_cards_view.js. The knockout-backed name
// cache the factory builds is exercised in-game.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const view = requireShippedModule(
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
});
