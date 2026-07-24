"use strict";

// Structural test for gw_play/cards_cheats.js. The cheats are purely side-effectful
// developer tooling (they deal from the deck and mutate the live inventory), so there is
// no pure logic to assert; the win from extracting them is that the module now loads
// under the Node AMD harness and its factory wires model.cheats.* without touching any
// engine global until the cheats are actually invoked in-game. This test pins that
// contract: the module is a loadable factory that installs both cheat entry points.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const cardsCheats = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_cheats.js"
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

describe("cards_cheats factory", () => {
  it("loads as a factory function under the harness", () => {
    assert.equal(typeof cardsCheats, "function");
  });

  it("installs model.cheats.testCards and giveCard without touching the deck", () => {
    const cheats = {};
    setGlobal("model", { cheats: cheats });

    cardsCheats({
      game: {},
      galaxy: {},
      inventory: {},
      gwoSettings: {},
      playerFaction: 0,
      gwoDeal: {},
      gwoAI: {},
      GWFactions: [],
      gwoSave: function () {},
      cards: [],
      loaded: {},
      dealCardToSelectableAI: function () {},
      helpers: {},
    });

    assert.equal(typeof cheats.testCards, "function");
    assert.equal(typeof cheats.giveCard, "function");
  });
});
