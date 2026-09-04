"use strict";

// Unit tests for shared/loadout_selection.js: where the loadout selection lands
// after the list is rebuilt with some cards locked.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const loadoutSelection = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/loadout_selection.js"
);

describe("selectableIndex", () => {
  const cardId = (card) => card.id;
  const isLocked = (card) => !!card.locked;
  const cards = [
    { id: "a", locked: true },
    { id: "b" },
    { id: "c", locked: true },
    { id: "d" },
  ];

  it("keeps the active card when it is present and unlocked", () => {
    assert.equal(
      loadoutSelection.selectableIndex(cards, "d", cardId, isLocked),
      3
    );
  });

  it("moves to the first unlocked card when the active card is locked", () => {
    assert.equal(
      loadoutSelection.selectableIndex(cards, "c", cardId, isLocked),
      1
    );
  });

  it("moves to the first unlocked card when the active id matches nothing", () => {
    assert.equal(
      loadoutSelection.selectableIndex(cards, "missing", cardId, isLocked),
      1
    );
  });

  it("moves to the first unlocked card when there is no active id", () => {
    assert.equal(
      loadoutSelection.selectableIndex(cards, undefined, cardId, isLocked),
      1
    );
  });

  it("is -1 when every card is locked", () => {
    const allLocked = [
      { id: "a", locked: true },
      { id: "b", locked: true },
    ];
    assert.equal(
      loadoutSelection.selectableIndex(allLocked, "a", cardId, isLocked),
      -1
    );
  });

  it("is -1 for an empty or non-array list", () => {
    assert.equal(
      loadoutSelection.selectableIndex([], "a", cardId, isLocked),
      -1
    );
    assert.equal(
      loadoutSelection.selectableIndex(undefined, "a", cardId, isLocked),
      -1
    );
  });
});
