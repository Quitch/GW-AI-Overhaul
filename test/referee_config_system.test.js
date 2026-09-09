"use strict";

// The battle config's system is a copy of the star's: orbital bombardment and
// flooding change the planets the server is sent, never the war's own system.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeAiDescriptor,
} = require("../scripts/lib/ai-path-fixtures.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const stubs = createGlobalStubs();

before(() => {
  // The referee reads the player's name from a session observable.
  const sessionObservable = () => {
    const observable = () => undefined;
    observable.extend = () => observable;
    return observable;
  };
  stubs.setGlobal("ko", { observable: sessionObservable });
});

after(() => stubs.restoreGlobals());

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js"
);

const installModel = useModel();

function generate(cards) {
  const fixture = buildGame({ aiInUse: "Titans", difficultyName: "!LOC:Gold" });
  fixture.inventory.cards().push(...cards);
  fixture.inventory.hasCard = (id) =>
    fixture.inventory.cards().some((card) => card.id === id);
  Object.assign(fixture.ai, makeAiDescriptor({ foes: [] }));
  const system = Object.assign(fixture.star.system(), {
    name: "Test System",
    planets: [
      { name: "Earth", generator: { biome: "earth", waterHeight: 35 } },
      { name: "Moon", generator: { biome: "moon", waterHeight: 0 } },
    ],
  });
  const untouched = JSON.stringify(system);
  fixture.game.stats = () => ({ turns: () => 1 });
  fixture.game.save = () => ({});
  installModel(fixture.game, []);

  let config;
  refereeConfig.call({
    game: () => fixture.game,
    files: () => ({}),
    biomeServed: {},
    config: (value) => {
      config = value;
    },
  });
  return { config, system, untouched };
}

describe("referee_config system", () => {
  it("glasses and floods the battle's planets without touching the star's", () => {
    const { config, system, untouched } = generate([
      { id: "gwaio_enable_orbitalbombardment" },
      { id: "gwaio_enable_tsunami" },
    ]);

    assert.equal(config.system.planets[0].generator.biome, "moon");
    assert.equal(config.system.planets[0].generator.waterHeight, 50);
    assert.equal(config.system.planets[1].generator.waterHeight, 50);
    assert.equal(JSON.stringify(system), untouched);
    assert.notEqual(config.system, system);
  });

  it("sends the star's planets as they are without those cards", () => {
    const { config, system, untouched } = generate([]);

    assert.equal(config.system.planets[0].generator.biome, "earth");
    assert.equal(config.system.planets[0].generator.waterHeight, 35);
    assert.equal(JSON.stringify(system), untouched);
  });
});
