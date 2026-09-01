"use strict";

// shared/decks.js: the tech card deck registry - built-ins, third-party
// registration, composition through `include`, and the fallback a war save
// naming a gone deck gets. See tech-cards.md, "Third-party decks".

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const decks = loadCouiModule(MOD_ROOT + "/shared/decks.js");
const deckIds = loadCouiModule(MOD_ROOT + "/shared/deck_ids.js");

afterEach(() => {
  decks.reset();
});

describe("the built-in decks", () => {
  it("lists Basic then Expanded, with their persisted canonical ids", () => {
    assert.deepEqual(
      decks.all().map((deck) => deck.id),
      ["Basic", "Expanded"]
    );
  });

  it("deals only the basic cards for Basic", () => {
    const result = decks.cardsFor("Basic");
    assert.deepEqual(result, deckIds.basic);
  });

  it("deals the basic cards then the expanded cards for Expanded", () => {
    const result = decks.cardsFor("Expanded");
    assert.deepEqual(result, deckIds.basic.concat(deckIds.expanded));
  });

  it("looks a deck up case-insensitively and untrimmed", () => {
    assert.equal(decks.byId(" basic "), decks.byId("Basic"));
    assert.deepEqual(decks.cardsFor("EXPANDED"), decks.cardsFor("Expanded"));
  });

  it("deals Expanded for an absent deck (non-GWO and pre-v5.36 saves), without warning", () => {
    const warnMock = mock.method(console, "warn", () => {});
    assert.deepEqual(decks.cardsFor(undefined), decks.cardsFor("Expanded"));
    assert.deepEqual(decks.cardsFor(""), decks.cardsFor("Expanded"));
    assert.equal(warnMock.mock.callCount(), 0);
  });

  it("falls back to Expanded with one warning for an unknown deck (mod uninstalled)", () => {
    const warnMock = mock.method(console, "warn", () => {});
    assert.deepEqual(decks.cardsFor("gone-mod"), decks.cardsFor("Expanded"));
    assert.equal(warnMock.mock.callCount(), 1);
    assert.match(warnMock.mock.calls[0].arguments[0], /gone-mod/);
  });
});

describe("register", () => {
  it("keeps a standalone deck to exactly its own cards", () => {
    decks.register({
      id: "mym-nomad",
      name: "!LOC:Nomad",
      cards: ["mym_card_a", "mym_card_b"],
    });

    assert.deepEqual(decks.cardsFor("mym-nomad"), ["mym_card_a", "mym_card_b"]);
  });

  it("stores the canonical id as given, trimmed, and persists it through byId", () => {
    decks.register({ id: " MyM-Nomad ", name: "!LOC:Nomad", cards: ["c"] });

    assert.equal(decks.byId("mym-nomad").id, "MyM-Nomad");
  });

  it("composes an included built-in before the deck's own cards", () => {
    decks.register({
      id: "mym-nomad",
      name: "!LOC:Nomad",
      include: ["Basic"],
      cards: ["mym_card_a"],
    });

    assert.deepEqual(
      decks.cardsFor("mym-nomad"),
      deckIds.basic.concat(["mym_card_a"])
    );
  });

  it("cherry-picks stock card ids without naming a whole deck", () => {
    decks.register({
      id: "mym-nomad",
      name: "!LOC:Nomad",
      cards: ["gwc_minion", "gwaio_upgrade_ant", "mym_card_a"],
    });

    assert.deepEqual(decks.cardsFor("mym-nomad"), [
      "gwc_minion",
      "gwaio_upgrade_ant",
      "mym_card_a",
    ]);
  });

  // Basic is a subset of Expanded, so including both must not deal the
  // overlap twice - setupGwoDeck indexes by position and a repeat would
  // leave a hole in the deck.
  it("deduplicates the overlap when both built-ins are included", () => {
    decks.register({
      id: "mym-both",
      name: "!LOC:Both",
      include: ["Basic", "Expanded"],
    });

    const result = decks.cardsFor("mym-both");
    assert.deepEqual(result, decks.cardsFor("Expanded"));
    assert.equal(new Set(result).size, result.length);
  });

  it("deduplicates cards against an include, and cards against themselves", () => {
    decks.register({
      id: "mym-nomad",
      name: "!LOC:Nomad",
      include: ["Basic"],
      cards: ["gwc_minion", "mym_card_a", "mym_card_a"],
    });

    const result = decks.cardsFor("mym-nomad");
    assert.equal(result.filter((id) => id === "gwc_minion").length, 1);
    assert.equal(result.filter((id) => id === "mym_card_a").length, 1);
  });

  it("resolves a third-party include through that deck's own include chain", () => {
    decks.register({
      id: "mym-base",
      name: "!LOC:Base",
      include: ["Basic"],
      cards: ["mym_card_a"],
    });
    decks.register({
      id: "mym-plus",
      name: "!LOC:Plus",
      include: ["mym-base"],
      cards: ["mym_card_b"],
    });

    assert.deepEqual(
      decks.cardsFor("mym-plus"),
      deckIds.basic.concat(["mym_card_a", "mym_card_b"])
    );
  });

  // Lazy resolution: the include names an id, not a snapshot, so a last-wins
  // re-registration of the included deck is what the includer deals.
  it("resolves an include against the included deck's latest registration", () => {
    decks.register({ id: "mym-base", name: "!LOC:Base", cards: ["old_card"] });
    decks.register({
      id: "mym-plus",
      name: "!LOC:Plus",
      include: ["mym-base"],
    });
    decks.register({ id: "mym-base", name: "!LOC:Base", cards: ["new_card"] });

    assert.deepEqual(decks.cardsFor("mym-plus"), ["new_card"]);
  });

  // A cycle can only arise through re-registration: at first registration an
  // include must already exist. The visited set makes it terminate.
  it("terminates an include cycle created by re-registration", () => {
    decks.register({ id: "mym-a", name: "!LOC:A", cards: ["card_a"] });
    decks.register({
      id: "mym-b",
      name: "!LOC:B",
      include: ["mym-a"],
      cards: ["card_b"],
    });
    decks.register({
      id: "mym-a",
      name: "!LOC:A",
      include: ["mym-b"],
      cards: ["card_a"],
    });

    assert.deepEqual(decks.cardsFor("mym-a"), ["card_b", "card_a"]);
    assert.deepEqual(decks.cardsFor("mym-b"), ["card_a", "card_b"]);
  });

  it("re-registering an id replaces it without moving its listing position", () => {
    decks.register({ id: "mym-a", name: "!LOC:A", cards: ["a"] });
    decks.register({ id: "mym-b", name: "!LOC:B", cards: ["b"] });
    decks.register({ id: "MYM-A", name: "!LOC:A2", cards: ["a2"] });

    assert.deepEqual(
      decks.all().map((deck) => deck.name),
      ["!LOC:Basic", "!LOC:Galactic War Overhaul", "!LOC:A2", "!LOC:B"]
    );
  });
});

describe("validation", () => {
  it("refuses a deck without an id", () => {
    assert.throws(() => decks.register({}), /needs an id/);
    assert.throws(() => decks.register(undefined), /must be an object/);
  });

  it("refuses the built-in ids in any case", () => {
    assert.throws(
      () => decks.register({ id: "basic", name: "!LOC:X", cards: ["c"] }),
      /built-in/
    );
    assert.throws(
      () => decks.register({ id: "Expanded", name: "!LOC:X", cards: ["c"] }),
      /built-in/
    );
  });

  it("refuses a deck without a name", () => {
    assert.throws(
      () => decks.register({ id: "mym-a", cards: ["c"] }),
      /needs a name/
    );
  });

  it("refuses a non-array include or cards", () => {
    assert.throws(
      () => decks.register({ id: "mym-a", name: "!LOC:A", include: "Basic" }),
      /include must be an array/
    );
    assert.throws(
      () => decks.register({ id: "mym-a", name: "!LOC:A", cards: "c" }),
      /cards must be an array/
    );
  });

  it("refuses an include naming a deck that is not yet registered", () => {
    assert.throws(
      () =>
        decks.register({ id: "mym-a", name: "!LOC:A", include: ["mym-gone"] }),
      /unregistered deck "mym-gone"/
    );
  });

  it("refuses a deck that resolves to no cards", () => {
    assert.throws(
      () => decks.register({ id: "mym-a", name: "!LOC:A" }),
      /resolves to no cards/
    );
    assert.throws(
      () =>
        decks.register({ id: "mym-a", name: "!LOC:A", include: [], cards: [] }),
      /resolves to no cards/
    );
  });

  it("leaves the registry untouched when a registration is refused", () => {
    assert.throws(() =>
      decks.register({ id: "mym-a", name: "!LOC:A", include: ["mym-gone"] })
    );

    assert.equal(decks.byId("mym-a"), undefined);
    assert.equal(decks.all().length, 2);
  });
});
