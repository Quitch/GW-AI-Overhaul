"use strict";

// Tests for shared/gwo_system_templates.js, GWO's seeded replacement for the base game's
// systems/template-loader.js.
//
// Two things are pinned here. chooseFor's dispatch: Shared Systems for Galactic War
// replaces the same base path, and GWO shadowing it once left that mod's Systems panel
// as a bare header. And the per-planet streams: the values below are drawn after a biome
// fetch and a planet-name call, which resolve in an arbitrary order, so the suite drains
// them in both orders and requires the same system out.
//
// The four systems/* template modules are base-game and unshipped, so they are stubbed;
// $, api and parse are engine globals the module reaches for at call time.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const TEMPLATES = [
  {
    Players: [0, 4],
    Systems: [
      {
        Planets: [
          {
            mass: 5000,
            Thrust: [0, 0],
            Radius: [500, 900],
            Height: [5, 25],
            Water: [0, 50],
            Temp: [0, 100],
            MetalDensity: [20, 70],
            MetalClusters: [10, 49],
            BiomeScale: [50, 100],
            Position: [0, 0],
            Velocity: [0, 0],
            Biomes: ["earth", "desert", "moon", "lava"],
            starting_planet: true,
          },
          {
            mass: 4000,
            Thrust: [0, 0],
            Radius: [300, 600],
            Height: [0, 15],
            Water: [0, 0],
            Temp: [0, 50],
            MetalDensity: [10, 40],
            MetalClusters: [5, 20],
            BiomeScale: [50, 100],
            Position: [1000, 0],
            Velocity: [0, 10],
            Biomes: ["moon", "asteroid"],
          },
        ],
      },
    ],
  },
];

["pa-easy", "pa-normal", "titans-easy", "titans-normal"].forEach((name) => {
  registerModuleStub(
    "main/game/galactic_war/shared/js/systems/" + name,
    TEMPLATES
  );
});

// Every async resolution the module starts is parked here so a test can fire them in
// whichever order it wants.
const pending = [];

function parked(value) {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  pending.push(() => resolve(value));
  return promise;
}

const stubs = createGlobalStubs();

before(() => {
  stubs.setGlobal("$", {
    get: () => parked(JSON.stringify({ radius_range: [100, 1300] })),
    when: (...args) => ({
      then: (fn) => Promise.all(args).then((values) => fn(...values)),
    }),
  });
  stubs.setGlobal("parse", JSON.parse);
  stubs.setGlobal("api", {
    game: { getRandomPlanetName: () => parked("PlanetName") },
  });
});

after(() => stubs.restoreGlobals());

const templates = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_system_templates.js"
);

// Drains `pending` repeatedly, since each round can queue more, until the system settles.
async function generate(loader, config, options) {
  const reverse = (options || {}).reverse;
  pending.length = 0;
  const system = loader.generate(config);
  for (let round = 0; round < 8; round++) {
    const batch = pending.splice(0);
    if (reverse) {
      batch.reverse();
    }
    batch.forEach((fire) => fire());
    await new Promise((r) => setImmediate(r));
  }
  return system;
}

function shape(system) {
  return JSON.stringify({ name: system.name, planets: system.planets });
}

describe("gwo_system_templates chooseFor", () => {
  // Shared Systems for Galactic War marks its template-loader with loadOptions. Taking
  // it over is what broke that mod's Systems panel when GWO shadowed the base path.
  it("defers to a base loader that carries loadOptions", () => {
    const sharedSystems = () => ({ generate: () => "from-shared-systems" });
    sharedSystems.loadOptions = () => {};
    const chosen = templates.chooseFor(sharedSystems, "PAExpansion1", false);
    assert.equal(chosen.generate(), "from-shared-systems");
  });

  it("uses GWO's seeded loader when the base loader is stock", () => {
    const stock = () => ({ generate: () => "from-stock" });
    const chosen = templates.chooseFor(stock, "PAExpansion1", false);
    assert.notEqual(chosen.generate, stock().generate);
  });

  it("uses GWO's seeded loader when there is no base loader at all", () => {
    assert.ok(templates.chooseFor(undefined, "PAExpansion1", false).generate);
  });
});

describe("gwo_system_templates generate", () => {
  const loader = () => templates.chooseFor(undefined, "PAExpansion1", false);

  it("reproduces the same system for the same seed", async () => {
    const first = await generate(loader(), { players: 2, seed: "gwo-test-1" });
    const second = await generate(loader(), { players: 2, seed: "gwo-test-1" });
    assert.equal(shape(first), shape(second));
  });

  // The reason each planet gets its own stream: these values are drawn inside
  // $.when(biomeGet, nameGet).then(...), which fires in completion order.
  it("is unaffected by the order the biome and name fetches resolve in", async () => {
    const forwards = await generate(loader(), {
      players: 2,
      seed: "gwo-test-1",
    });
    const backwards = await generate(
      loader(),
      { players: 2, seed: "gwo-test-1" },
      { reverse: true }
    );
    assert.equal(shape(forwards), shape(backwards));
  });

  it("produces a different system for a different seed", async () => {
    const first = await generate(loader(), { players: 2, seed: "gwo-test-1" });
    const second = await generate(loader(), { players: 2, seed: "gwo-test-2" });
    assert.notEqual(shape(first), shape(second));
  });

  it("names the system and fills in every planet's generator", async () => {
    const system = await generate(loader(), { players: 2, seed: "shape" });
    assert.equal(typeof system.name, "string");
    assert.equal(system.planets.length, 2);
    system.planets.forEach((planet, index) => {
      const generator = planet.generator;
      assert.ok(
        TEMPLATES[0].Systems[0].Planets[index].Biomes.includes(generator.biome)
      );
      assert.ok(generator.radius > 0);
      assert.equal(typeof generator.temperature, "number");
      assert.equal(generator.index, index);
    });
  });
});
