"use strict";

// shared/deck_mods.js: the engine glue that adopts model.gwoDecks. The adopt
// guard is the modder contract - a mod's scene script pushes before GWO's
// requireGW callbacks run, so assigning over the array would discard its
// registration. See tech-cards.md, "Third-party decks".

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const decks = loadCouiModule(MOD_ROOT + "/shared/decks.js");
const deckMods = loadCouiModule(MOD_ROOT + "/shared/deck_mods.js");

const { setGlobal, restoreGlobals } = createGlobalStubs();

beforeEach(() => {
  decks.reset();
  deckMods.reset();
});

afterEach(() => {
  restoreGlobals();
  decks.reset();
  deckMods.reset();
});

const NOMAD = { id: "mym-nomad", name: "!LOC:Nomad", cards: ["mym_card_a"] };

describe("registerAll", () => {
  it("registers what a mod pushed onto model.gwoDecks", () => {
    setGlobal("model", { gwoDecks: [NOMAD] });

    deckMods.registerAll();

    assert.equal(decks.byId("mym-nomad").name, "!LOC:Nomad");
  });

  it("adopts the array rather than assigning over it", () => {
    const pushed = [NOMAD];
    setGlobal("model", { gwoDecks: pushed });

    deckMods.registerAll();

    assert.equal(model.gwoDecks, pushed);
  });

  it("treats an absent or non-array global as empty", () => {
    setGlobal("model", {});
    deckMods.registerAll();
    assert.deepEqual(model.gwoDecks, []);

    model.gwoDecks = "not-an-array";
    deckMods.registerAll();
    assert.deepEqual(model.gwoDecks, []);
  });

  it("skips a bad descriptor with an error and still registers the good ones", () => {
    const errorMock = mock.method(console, "error", () => {});
    setGlobal("model", {
      gwoDecks: [{ id: "mym-broken", name: "!LOC:Broken" }, NOMAD],
    });

    deckMods.registerAll();

    assert.equal(decks.byId("mym-broken"), undefined);
    assert.equal(decks.byId("mym-nomad").name, "!LOC:Nomad");
    assert.equal(errorMock.mock.callCount(), 1);
    assert.match(errorMock.mock.calls[0].arguments[0], /not registered/);
  });

  it("warns when two descriptors claim the same id, and the later wins", () => {
    const warnMock = mock.method(console, "warn", () => {});
    setGlobal("model", {
      gwoDecks: [
        NOMAD,
        { id: "mym-nomad", name: "!LOC:Nomad 2", cards: ["mym_card_b"] },
      ],
    });

    deckMods.registerAll();

    assert.equal(warnMock.mock.callCount(), 1);
    assert.match(warnMock.mock.calls[0].arguments[0], /registered twice/);
    assert.equal(decks.byId("mym-nomad").name, "!LOC:Nomad 2");
  });

  // Several consumers call registerAll in one scene (the deal, the picker,
  // the war panel), so a second pass must be a no-op.
  it("handles each pushed descriptor once across repeated calls", () => {
    const warnMock = mock.method(console, "warn", () => {});
    setGlobal("model", { gwoDecks: [NOMAD] });

    deckMods.registerAll();
    deckMods.registerAll();

    assert.equal(warnMock.mock.callCount(), 0);
    assert.equal(decks.all().length, 3);
  });

  it("picks up a descriptor pushed between calls", () => {
    setGlobal("model", { gwoDecks: [NOMAD] });
    deckMods.registerAll();

    model.gwoDecks.push({
      id: "mym-late",
      name: "!LOC:Late",
      cards: ["mym_card_b"],
    });
    deckMods.registerAll();

    assert.equal(decks.byId("mym-late").name, "!LOC:Late");
  });
});
