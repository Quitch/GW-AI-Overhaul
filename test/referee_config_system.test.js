"use strict";

// The battle config's system is a copy of the star's: orbital bombardment and
// flooding change the planets the server is sent, never the war's own system.

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  useModel,
  makeAiDescriptor,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config.js"
);

const installModel = useModel();

afterEach(() => mock.restoreAll());

function generate(cards, options) {
  const opts = options || {};
  const fixture = buildGame({ aiInUse: "Titans", difficultyName: "!LOC:Gold" });
  fixture.inventory.cards().push(...cards);
  fixture.inventory.hasCard = (id) =>
    fixture.inventory.cards().some((card) => card.id === id);
  Object.assign(fixture.ai, makeAiDescriptor({ foes: [] }));
  const system = Object.assign(fixture.star.system(), {
    name: "Test System",
    planets: opts.planets || [
      { name: "Earth", generator: { biome: "earth", waterHeight: 35 } },
      { name: "Moon", generator: { biome: "moon", waterHeight: 0 } },
    ],
  });
  const untouched = JSON.stringify(system);
  fixture.game.stats = () => ({ turns: () => 1 });
  fixture.game.save = () => ({});
  installModel(fixture.game, []);
  global.model.displayName = () => "Tester";

  let config;
  refereeConfig.call({
    game: () => fixture.game,
    files: () => ({}),
    biomeServed: {},
    flatMaps: opts.flatMaps,
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

  it("names the player's army slot from the session display name", () => {
    const { config } = generate([]);
    assert.equal(config.armies[0].slots[0].name, "Tester");
  });
});

describe("referee_config flat planets", () => {
  const slab = () => [
    {
      name: "Slab",
      generator: {
        biome: "earth",
        waterHeight: 35,
        shape: "flat",
        width: 2400,
        length: 1600,
        radius: 400,
      },
      metal_spots: [[0, 0, 0]],
    },
    { name: "Moon", generator: { biome: "moon", waterHeight: 0 } },
  ];

  it("fights a flat planet as a sphere of the same area without the flag", () => {
    const warn = mock.method(console, "warn", () => {});

    const { config, system, untouched } = generate([], { planets: slab() });

    const generator = config.system.planets[0].generator;
    assert.equal(generator.radius, 553);
    assert.equal(generator.shape, undefined);
    assert.equal(generator.width, undefined);
    assert.equal(config.system.planets[0].metal_spots, undefined);
    assert.equal(warn.mock.callCount(), 1);
    assert.match(warn.mock.calls[0].arguments[0], /Test System.*--flat-maps/);
    assert.equal(JSON.stringify(system), untouched);
  });

  it("sends a flat planet as it is with the flag", () => {
    const warn = mock.method(console, "warn", () => {});

    const { config } = generate([], { planets: slab(), flatMaps: true });

    const generator = config.system.planets[0].generator;
    assert.equal(generator.shape, "flat");
    assert.equal(generator.width, 2400);
    assert.equal(generator.radius, 400);
    assert.equal(warn.mock.callCount(), 0);
  });

  it("glasses and floods the sphere it makes", () => {
    mock.method(console, "warn", () => {});

    const { config } = generate(
      [
        { id: "gwaio_enable_orbitalbombardment" },
        { id: "gwaio_enable_tsunami" },
      ],
      { planets: slab() }
    );

    const generator = config.system.planets[0].generator;
    assert.equal(generator.radius, 553);
    assert.equal(generator.biome, "moon");
    assert.equal(generator.waterHeight, 50);
  });
});
