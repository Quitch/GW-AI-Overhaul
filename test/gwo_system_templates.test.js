"use strict";

// Tests for shared/gwo_system_templates.js. Two things are pinned: chooseFor's
// dispatch, since shadowing this path once broke Shared Systems' own panel; and the
// per-planet streams, drained in both resolution orders to require the same system.

const { describe, it, before, after, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { makeDeferred } = require("../scripts/lib/fake-jquery.js");

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
  // isExplicit planets are returned verbatim and reach getRandomPlanetName
  // directly. titans-normal feeds them in, so this is a live path.
  {
    Players: [5, 8],
    Systems: [
      {
        Planets: [
          { isExplicit: true, mass: 5000, generator: { biome: "earth" } },
          {
            isExplicit: true,
            name: "Prenamed",
            mass: 5000,
            generator: { biome: "moon" },
          },
        ],
      },
    ],
  },
];

// A generated planet with enough biomes that two different draws are unlikely to
// coincide. Shared by the two templates below, at the same index in each.
const SECOND_PLANET = {
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
  Biomes: ["moon", "asteroid", "earth", "desert", "lava", "tropical"],
};

// These two differ only in whether planet 0 takes the isExplicit early return,
// which draws nothing. Under a shared stream that shifted planet 1's biome.
TEMPLATES.push(
  {
    Players: [9, 10],
    Systems: [
      {
        Planets: [
          { isExplicit: true, mass: 5000, generator: { biome: "earth" } },
          SECOND_PLANET,
        ],
      },
    ],
  },
  {
    Players: [11, 12],
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
          SECOND_PLANET,
        ],
      },
    ],
  }
);

// A generated planet template, with the biome list as the only thing that varies
// so the pool entry a slot drew is identifiable from the finished planet.
const generated = (biomes, extra) =>
  Object.assign(
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
      Position: [0, 0],
      Velocity: [0, 0],
      Biomes: biomes,
    },
    extra
  );

// Pools a system draws planets from by reference. The container that tracks
// which entries are spent is keyed by the pool object itself, so two slots
// pointing at the same pool must not draw the same entry.
const RANDOM_POOL = {
  planets: [
    generated(["earth"]),
    generated(["moon"]),
    generated(["lava"]),
    generated(["ice"]),
  ],
};
const SINGLE_POOL = { planets: [generated(["tropical"])] };
const EMPTY_POOL = { planets: [] };

TEMPLATES.push(
  {
    Players: [13, 14],
    Systems: [
      {
        Planets: [
          {
            fromRandomList: RANDOM_POOL,
            isExplicit: false,
            Position: [100, 0],
          },
          {
            fromRandomList: RANDOM_POOL,
            isExplicit: false,
            Position: [200, 0],
          },
        ],
      },
    ],
  },
  {
    Players: [15, 16],
    Systems: [{ Planets: [{ fromRandomList: SINGLE_POOL }] }],
  },
  {
    Players: [17, 18],
    Systems: [
      {
        Planets: [
          { fromRandomList: EMPTY_POOL, isExplicit: false },
          generated(["desert"]),
        ],
      },
    ],
  },
  {
    // The drawn entry carries the properties, the requesting slot overrides
    // them - including into the isExplicit path, which returns verbatim.
    Players: [19, 20],
    Systems: [
      {
        Planets: [
          { fromRandomList: RANDOM_POOL, isExplicit: true, name: "Handpicked" },
        ],
      },
    ],
  },
  // Last on purpose: it is what a player count matching no template falls back to.
  {
    Players: [21, 22],
    Systems: [{ Planets: [generated(["asteroid"])] }],
  }
);

["pa-easy", "pa-normal", "titans-easy", "titans-normal"].forEach((name) => {
  registerModuleStub(
    "main/game/galactic_war/shared/js/systems/" + name,
    TEMPLATES
  );
});

// Every async resolution the module starts is parked here so a test can fire them in
// whichever order it wants.
const pending = [];

// A jQuery-shaped deferred: carries .promise(), so $.when waits for it.
function parkedDeferred(value) {
  const deferred = makeDeferred();
  pending.push(() => deferred.resolve(value));
  return deferred;
}

// A bare engine promise: no .promise(), so $.when must NOT wait for it. This is what
// api.game.getRandomPlanetName() hands back in the real client.
function parkedEnginePromise(value) {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  pending.push(() => resolve(value));
  return promise;
}

// A jQuery-style promise: .then(fn) spreads the resolved values into fn, and .promise()
// marks it as something $.when will wait for.
function jqPromise(valuesPromise) {
  const self = {
    values: valuesPromise,
    then: (fn) => jqPromise(valuesPromise.then((vals) => [fn(...vals)])),
    promise: () => self,
  };
  return self;
}

// jQuery 2's $.when, not Promise.all: it waits only for arguments exposing
// .promise(), and passes anything else through as itself. A Promise.all-shaped fake
// here once let a real bug through. See constraints.md.
function fakeWhen(...args) {
  const boxed = args.map((arg) => {
    if (arg && arg.values) {
      return arg.values.then((vals) => ({ value: vals[0] }));
    }
    if (arg && typeof arg.promise === "function") {
      return Promise.resolve(arg).then((value) => ({ value }));
    }
    return Promise.resolve({ value: arg });
  });
  return jqPromise(Promise.all(boxed).then((bs) => bs.map((b) => b.value)));
}

const stubs = createGlobalStubs();

before(() => {
  const $ = function () {};
  $.Deferred = makeDeferred;
  $.get = () => parkedDeferred(JSON.stringify({ radius_range: [100, 1300] }));
  $.when = fakeWhen;
  $.when.apply = (ctx, list) => fakeWhen(...list);
  stubs.setGlobal("$", $);
  stubs.setGlobal("parse", JSON.parse);
  stubs.setGlobal("api", {
    game: { getRandomPlanetName: () => parkedEnginePromise("PlanetName") },
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

afterEach(() => {
  mock.restoreAll();
});

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

  // Regression: this branch once returned getRandomPlanetName() directly, and
  // $.when passed the unresolved promise through as the planet.
  it("returns real planets, not promises, for isExplicit templates", async () => {
    const system = await generate(loader(), { players: 6, seed: "explicit" });
    assert.equal(system.planets.length, 2);
    system.planets.forEach((planet) => {
      assert.equal(typeof planet.promise, "undefined", "planet is a promise");
      assert.ok(planet.generator, "planet has no generator");
      assert.equal(typeof planet.name, "string");
    });
    assert.equal(system.planets[1].name, "Prenamed");
  });

  // The one hole that produced a plausible-looking unseeded war in silence.
  it("warns when a caller supplies no seed, and not when the seed is 0", async () => {
    const warnMock = mock.method(console, "warn", () => {});
    await generate(loader(), { players: 2 });
    assert.equal(warnMock.mock.callCount(), 1);
    assert.match(warnMock.mock.calls[0].arguments[0], /no seed/);

    warnMock.mock.resetCalls();
    await generate(loader(), { players: 2, seed: 0 });
    assert.equal(warnMock.mock.callCount(), 0);
  });

  // Each planet draws from its own stream, so a planet's biome cannot depend on
  // how many planets before it took the isExplicit return - which draws nothing.
  // Swept over several seeds: with one shared stream a given seed still agrees
  // about one time in six, so a single comparison proves nothing.
  it("gives a planet the same biome whatever precedes it in the template", async () => {
    for (const seed of ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"]) {
      const afterExplicit = await generate(loader(), { players: 9, seed });
      const afterGenerated = await generate(loader(), { players: 11, seed });
      assert.equal(
        afterExplicit.planets[1].generator.biome,
        afterGenerated.planets[1].generator.biome,
        `seed ${seed}`
      );
    }
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

// A system template can point a planet slot at a shared list and let the
// generator draw from it. This is stock logic GWO carries verbatim, seeded; the
// tests below pin what it actually does, which in two places is not what its
// stock comments claim.
describe("gwo_system_templates fromRandomList", () => {
  const loader = () => templates.chooseFor(undefined, "PAExpansion1", false);

  const biomes = (system) =>
    system.planets.map((planet) => planet.generator.biome);

  it("gives two slots drawing on one list different planets", async () => {
    // Every entry has a biome of its own, so equal biomes would mean both slots
    // drew the same template - what usedIndexes exists to prevent.
    for (const seed of ["r1", "r2", "r3", "r4", "r5", "r6"]) {
      const system = await generate(loader(), { players: 13, seed });
      assert.equal(system.planets.length, 2);
      const drawn = biomes(system);
      assert.notEqual(drawn[0], drawn[1], `seed ${seed} drew ${drawn}`);
    }
  });

  it("lets the requesting slot override what it drew", async () => {
    const system = await generate(loader(), { players: 13, seed: "override" });
    assert.deepEqual(
      system.planets.map((planet) => planet.position),
      [
        [100, 0],
        [200, 0],
      ]
    );
  });

  // The draw nulls fromRandomList before cloning so the whole pool is not
  // copied into every planet, then puts it back. A slot that lost it would draw
  // nothing at all on the next war.
  it("leaves the template able to draw again", async () => {
    const slot = TEMPLATES.find((entry) => entry.Players[0] === 13).Systems[0]
      .Planets[0];

    await generate(loader(), { players: 13, seed: "restore-1" });
    assert.equal(slot.fromRandomList, RANDOM_POOL);

    const again = await generate(loader(), { players: 13, seed: "restore-1" });
    assert.equal(again.planets.length, 2);
  });

  it("reproduces the same draw for the same seed", async () => {
    const first = await generate(loader(), { players: 13, seed: "same" });
    const second = await generate(loader(), { players: 13, seed: "same" });
    assert.equal(shape(first), shape(second));
  });

  it("draws the only entry when the list holds one", async () => {
    const system = await generate(loader(), { players: 15, seed: "single" });
    assert.deepEqual(biomes(system), ["tropical"]);
  });

  // The slot cannot be fulfilled, so it is dropped rather than becoming a null
  // planet in the finished system.
  it("drops a slot whose list is empty, keeping the rest of the system", async () => {
    const system = await generate(loader(), { players: 17, seed: "empty" });
    assert.deepEqual(biomes(system), ["desert"]);
  });

  // Extending happens before the isExplicit check, so a slot can draw a
  // template and still be returned verbatim under its own name.
  it("returns a drawn planet verbatim when the slot is explicit", async () => {
    const system = await generate(loader(), { players: 19, seed: "explicit" });
    assert.equal(system.planets.length, 1);
    assert.equal(system.planets[0].name, "Handpicked");
    assert.equal(system.planets[0].isExplicit, true);
    // Verbatim: the drawn template's own fields, not a generated planet.
    assert.deepEqual(system.planets[0].Radius, [300, 600]);
  });

  // Stock's inert _.where filter, kept on purpose. See galaxy.md, "Copies, not
  // shadows".
  it("does not in fact filter the list by isExplicit", async () => {
    const system = await generate(loader(), { players: 19, seed: "explicit" });
    // The pool holds no isExplicit entry, yet the explicit slot still drew one.
    assert.ok(RANDOM_POOL.planets.every((planet) => !planet.isExplicit));
    assert.equal(system.planets.length, 1);
  });
});

describe("gwo_system_templates template selection", () => {
  const loader = () => templates.chooseFor(undefined, "PAExpansion1", false);

  // A galaxy can ask for more players than any template covers, and a war with
  // no system at all is worse than one from the largest template available.
  it("falls back to the last template for an uncovered player count", async () => {
    const system = await generate(loader(), { players: 999, seed: "fallback" });
    assert.equal(system.planets.length, 1);
    assert.equal(system.planets[0].generator.biome, "asteroid");
  });

  it("uses a system handed to it directly, over any template", async () => {
    const system = await generate(loader(), {
      players: 2,
      seed: "explicit-system",
      name: "Hand Built",
      template: { Planets: [generated(["ice"])] },
    });

    assert.equal(system.name, "Hand Built");
    assert.equal(system.planets.length, 1);
    assert.equal(system.planets[0].generator.biome, "ice");
    // A named system carries no Players range: that comes from a template.
    assert.equal(system.players, undefined);
  });

  it("names an unnamed system it was handed directly", async () => {
    const system = await generate(loader(), {
      players: 2,
      seed: "unnamed-system",
      template: { Planets: [generated(["ice"])] },
    });
    assert.match(system.name, /^PA-\d+$/);
  });
});
