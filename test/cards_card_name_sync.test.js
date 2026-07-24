"use strict";

// Unit tests for the pure helpers of gw_play/cards_card_name_sync.js. The factory it
// returns registers a co-op operator handler and leans on requireGW/$/model, so it is
// exercised in-game; the dependency-light naming helpers are reached here through the
// module's dead-in-production `typeof module` export hook (the referee_ai.js pattern),
// via requireShippedModule.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const sync = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_card_name_sync.js"
);

const restores = [];
function setGlobal(name, value) {
  const had = Object.prototype.hasOwnProperty.call(global, name);
  const previous = global[name];
  global[name] = value;
  restores.push(function () {
    if (had) {
      global[name] = previous;
    } else {
      delete global[name];
    }
  });
}
afterEach(() => {
  while (restores.length) {
    restores.pop()();
  }
});

function starWithAi(ai) {
  return { ai: () => ai };
}

describe("setAiCardName", () => {
  it("stores the name on the star's ai and reports success", () => {
    const ai = {};
    assert.equal(sync.setAiCardName(starWithAi(ai), "Vanguard"), true);
    assert.equal(ai.cardName, "Vanguard");
  });

  it("fails when the star has no ai() accessor", () => {
    assert.equal(sync.setAiCardName({}, "Vanguard"), false);
    assert.equal(sync.setAiCardName(undefined, "Vanguard"), false);
  });

  it("fails when ai() resolves to nothing", () => {
    assert.equal(sync.setAiCardName(starWithAi(null), "Vanguard"), false);
  });
});

describe("isValidSyncedStarCardNamePayload", () => {
  it("accepts a numeric star index with a non-empty card id", () => {
    assert.equal(
      sync.isValidSyncedStarCardNamePayload({ star: 3, card_id: "gwc_x" }),
      true
    );
  });

  it("rejects a non-numeric or NaN star index", () => {
    assert.equal(
      sync.isValidSyncedStarCardNamePayload({ star: "3", card_id: "gwc_x" }),
      false
    );
    assert.equal(
      sync.isValidSyncedStarCardNamePayload({ star: NaN, card_id: "gwc_x" }),
      false
    );
  });

  it("rejects a missing or empty card id", () => {
    assert.equal(
      sync.isValidSyncedStarCardNamePayload({ star: 3, card_id: "" }),
      false
    );
    assert.equal(sync.isValidSyncedStarCardNamePayload({ star: 3 }), false);
  });
});

describe("applyCardNameToStarIndex", () => {
  it("names the star in both the live board and the game galaxy", () => {
    const boardAi = {};
    const gameAi = {};
    setGlobal("model", {
      galaxy: {
        systems: () => [undefined, { star: starWithAi(boardAi) }],
      },
    });
    const game = {
      galaxy: () => ({ stars: () => [undefined, starWithAi(gameAi)] }),
    };

    assert.equal(sync.applyCardNameToStarIndex(game, 1, "Vanguard"), true);
    assert.equal(boardAi.cardName, "Vanguard");
    assert.equal(gameAi.cardName, "Vanguard");
  });

  it("returns false when neither graph has the star", () => {
    setGlobal("model", { galaxy: { systems: () => [] } });
    const game = { galaxy: () => ({ stars: () => [] }) };
    assert.equal(sync.applyCardNameToStarIndex(game, 0, "Vanguard"), false);
  });

  it("still applies to the game galaxy when model.galaxy is absent", () => {
    const gameAi = {};
    setGlobal("model", {});
    const game = { galaxy: () => ({ stars: () => [starWithAi(gameAi)] }) };
    assert.equal(sync.applyCardNameToStarIndex(game, 0, "Vanguard"), true);
    assert.equal(gameAi.cardName, "Vanguard");
  });
});
