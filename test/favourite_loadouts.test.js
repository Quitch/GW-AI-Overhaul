"use strict";

// Unit tests for shared/favourite_loadouts.js, the pure logic extracted out of
// setup.js/favourites.js's ko/model glue: id lookup, toggling a persisted id
// list, and stably reordering loadout cards so favourites lead the list while
// everything else keeps its existing relative order.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const favouriteLoadouts = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/favourite_loadouts.js"
);

describe("isFavourite", () => {
  it("is true when the id is present in the list", () => {
    assert.equal(favouriteLoadouts.isFavourite(["a", "b"], "b"), true);
  });

  it("is false when the id is absent", () => {
    assert.equal(favouriteLoadouts.isFavourite(["a", "b"], "c"), false);
  });

  it("is false for a falsy id even if it somehow matched", () => {
    assert.equal(favouriteLoadouts.isFavourite([undefined], undefined), false);
  });

  it("treats a non-array ids value as empty", () => {
    assert.equal(favouriteLoadouts.isFavourite(undefined, "a"), false);
  });
});

describe("toggleId", () => {
  it("adds an absent id", () => {
    assert.deepEqual(favouriteLoadouts.toggleId(["a"], "b"), ["a", "b"]);
  });

  it("removes a present id", () => {
    assert.deepEqual(favouriteLoadouts.toggleId(["a", "b"], "b"), ["a"]);
  });

  it("does not mutate the input array", () => {
    const ids = ["a"];
    favouriteLoadouts.toggleId(ids, "b");
    assert.deepEqual(ids, ["a"]);
  });
});

describe("sortCardsByFavourite", () => {
  const getId = (card) => card.id;

  it("moves favourites to the front", () => {
    const cards = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const sorted = favouriteLoadouts.sortCardsByFavourite(cards, ["c"], getId);
    assert.deepEqual(sorted.map(getId), ["c", "a", "b"]);
  });

  it("is stable: relative order is preserved within each group", () => {
    const cards = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
      { id: "d" },
      { id: "e" },
    ];
    const sorted = favouriteLoadouts.sortCardsByFavourite(
      cards,
      ["c", "a"],
      getId
    );
    assert.deepEqual(sorted.map(getId), ["a", "c", "b", "d", "e"]);
  });

  it("never treats a card with a falsy id as a favourite, even if its id string matches", () => {
    const lockedCard = {}; // getId returns undefined, mirroring a locked card
    const cards = [{ id: "a" }, lockedCard];
    const sorted = favouriteLoadouts.sortCardsByFavourite(
      cards,
      [undefined],
      getId
    );
    assert.deepEqual(sorted, [{ id: "a" }, lockedCard]);
  });

  it("is a no-op reorder when there are no favourites", () => {
    const cards = [{ id: "a" }, { id: "b" }];
    const sorted = favouriteLoadouts.sortCardsByFavourite(cards, [], getId);
    assert.deepEqual(sorted.map(getId), ["a", "b"]);
  });
});
