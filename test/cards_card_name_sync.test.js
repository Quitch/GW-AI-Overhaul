"use strict";

// Unit tests for the pure helpers of gw_play/cards_card_name_sync.js, reached
// through the module's dead-in-production `typeof module` export hook (the
// referee_ai.js pattern), via requireShippedModule.
//
// Only what the operator handler cannot reach lives here. Payload validation
// and the both-graphs and neither-graph outcomes are driven end to end in
// cards_card_name_sync_factory.test.js, whose malformed-payload loop covers
// them. What is left is the two ai() guards, which the handler's fixture never
// trips, and the absent model.galaxy branch, which its setup() always installs
// past.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const sync = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_card_name_sync.js"
);

const { setGlobal, restoreGlobals } = createGlobalStubs();
afterEach(restoreGlobals);

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

describe("applyCardNameToStarIndex", () => {
  it("still applies to the game galaxy when model.galaxy is absent", () => {
    const gameAi = {};
    setGlobal("model", {});
    const game = { galaxy: () => ({ stars: () => [starWithAi(gameAi)] }) };
    assert.equal(sync.applyCardNameToStarIndex(game, 0, "Vanguard"), true);
    assert.equal(gameAi.cardName, "Vanguard");
  });
});
