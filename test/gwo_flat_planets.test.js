"use strict";

// shared/gwo_flat_planets.js: what counts as a flat planet in each form a
// system arrives in, the slab's size as the server normalises it, the sphere
// a slab is fought as without --flat-maps, and the flag read. See galaxy.md,
// "Flat planets".

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  couiToFsPath,
  loadCouiModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  enginePromise,
  installFakeJQuery,
} = require("../scripts/lib/fake-jquery.js");

const ENTRY =
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_flat_planets.js";
const flatPlanets = loadCouiModule(ENTRY);

const stubs = createGlobalStubs();

// enabled() caches its read for the page, so each flag test gets a module of
// its own.
function freshModule() {
  const fsPath = couiToFsPath(ENTRY);
  delete require.cache[require.resolve(fsPath)];
  const define = global.define;
  let exported;
  global.define = (deps, factory) => {
    exported = factory(...deps.map(loadCouiModule));
  };
  try {
    require(fsPath);
  } finally {
    global.define = define;
  }
  return exported;
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("isFlat", () => {
  it("is true only for a generator shaped flat", () => {
    assert.equal(flatPlanets.isFlat({ shape: "flat" }), true);
    assert.equal(flatPlanets.isFlat({ shape: "sphere" }), false);
    assert.equal(flatPlanets.isFlat({ radius: 500 }), false);
    assert.equal(flatPlanets.isFlat(undefined), false);
  });
});

describe("planetIsFlat", () => {
  it("reads a template planet's Shape", () => {
    assert.equal(flatPlanets.planetIsFlat({ Shape: "flat" }), true);
    assert.equal(flatPlanets.planetIsFlat({ Radius: [400, 500] }), false);
  });

  it("reads a planet's generator", () => {
    assert.equal(
      flatPlanets.planetIsFlat({ generator: { shape: "flat" } }),
      true
    );
    assert.equal(flatPlanets.planetIsFlat({ generator: { radius: 1 } }), false);
  });

  it("reads a system file's planet, before the generator is moved", () => {
    assert.equal(flatPlanets.planetIsFlat({ planet: { shape: "flat" } }), true);
    assert.equal(flatPlanets.planetIsFlat({ planet: { radius: 1 } }), false);
  });

  it("is false for no planet", () => {
    assert.equal(flatPlanets.planetIsFlat(null), false);
  });
});

describe("systemHasFlat", () => {
  it("finds a flat planet in a generated system", () => {
    const system = {
      planets: [
        { generator: { radius: 400 } },
        { generator: { shape: "flat" } },
      ],
    };
    assert.equal(flatPlanets.systemHasFlat(system), true);
  });

  it("finds a flat planet in a template system", () => {
    assert.equal(
      flatPlanets.systemHasFlat({
        Planets: [{ Radius: [1, 2] }, { Shape: "flat" }],
      }),
      true
    );
  });

  it("is false for a system of spheres, or none", () => {
    assert.equal(
      flatPlanets.systemHasFlat({ planets: [{ generator: { radius: 1 } }] }),
      false
    );
    assert.equal(flatPlanets.systemHasFlat({}), false);
    assert.equal(flatPlanets.systemHasFlat(undefined), false);
  });
});

describe("footprint", () => {
  it("keeps sides inside the server's range", () => {
    assert.deepEqual(
      flatPlanets.footprint({ shape: "flat", width: 2400, length: 1600 }),
      { width: 2400, length: 1600 }
    );
  });

  it("clamps sides to 200-20000, as sim_utils.js does", () => {
    assert.deepEqual(
      flatPlanets.footprint({ shape: "flat", width: 50, length: 30000 }),
      { width: 200, length: 20000 }
    );
  });

  it("defaults a missing side to twice the radius, or 1400", () => {
    assert.deepEqual(
      flatPlanets.footprint({ shape: "flat", radius: 500, width: "wide" }),
      { width: 1000, length: 1000 }
    );
    assert.deepEqual(flatPlanets.footprint({ shape: "flat" }), {
      width: 1400,
      length: 1400,
    });
  });
});

describe("equivalentRadius and surfaceArea", () => {
  it("give a slab the radius of a sphere of the same area", () => {
    const slab = { shape: "flat", width: 2400, length: 1600 };
    const radius = flatPlanets.equivalentRadius(slab);
    assert.equal(Math.round(radius), 553);
    assert.ok(
      Math.abs(4 * Math.PI * radius * radius - flatPlanets.surfaceArea(slab)) <
        1e-6
    );
  });

  it("give a slab its sides' product and a sphere 4πr²", () => {
    assert.equal(
      flatPlanets.surfaceArea({ shape: "flat", width: 2000, length: 1500 }),
      3000000
    );
    assert.equal(
      flatPlanets.surfaceArea({ radius: 100 }),
      4 * Math.PI * 100 * 100
    );
  });
});

describe("toSphere", () => {
  it("turns a slab into a sphere of the same area", () => {
    const planet = {
      name: "Slab",
      generator: {
        shape: "flat",
        width: 2400,
        length: 1600,
        flatSymmetry: "mirror_x",
        radius: 400,
        biome: "earth",
        metalClusters: 30,
        metalDensity: 40,
      },
    };

    assert.equal(flatPlanets.toSphere(planet), planet);
    assert.deepEqual(planet.generator, {
      radius: 553,
      biome: "earth",
      metalClusters: 30,
      metalDensity: 40,
    });
  });

  it("drops the keys that hold slab coordinates", () => {
    const planet = {
      generator: { shape: "flat", width: 2000, length: 2000 },
      metal_spots: [[0, 0, 0]],
      landing_zones: { list: [], rules: [] },
      planetCSG: [],
      source: {},
      position: [1, 2],
    };

    flatPlanets.toSphere(planet);

    assert.deepEqual(Object.keys(planet).sort(), ["generator", "position"]);
  });

  it("gives generated metal to a slab that relied on hand-placed spots", () => {
    const planet = {
      generator: {
        shape: "flat",
        width: 2000,
        length: 2000,
        metalClusters: 0,
        metalDensity: 70,
      },
      metal_spots: [[0, 0, 0]],
    };

    flatPlanets.toSphere(planet);

    assert.equal(planet.generator.metalClusters, 50);
    assert.equal(planet.generator.metalDensity, 70);
  });

  it("leaves a slab's metal alone when it had no hand-placed spots", () => {
    const planet = {
      generator: { shape: "flat", width: 2000, length: 2000, metalDensity: 0 },
    };

    flatPlanets.toSphere(planet);

    assert.equal(planet.generator.metalDensity, 0);
    assert.equal(planet.generator.metalClusters, undefined);
  });

  it("converts a system file's planet in place", () => {
    const planet = { planet: { shape: "flat", width: 2400, length: 1600 } };

    flatPlanets.toSphere(planet);

    assert.deepEqual(planet.planet, { radius: 553 });
  });

  it("leaves a sphere as it is", () => {
    const planet = { generator: { radius: 400 }, metal_spots: [[1, 1, 1]] };
    const before = JSON.stringify(planet);

    flatPlanets.toSphere(planet);

    assert.equal(JSON.stringify(planet), before);
  });
});

describe("enabled", () => {
  let errors;

  beforeEach(() => {
    installFakeJQuery(stubs);
    errors = [];
    stubs.setGlobal("console", { error: (text) => errors.push(text) });
  });

  afterEach(() => {
    mock.timers.reset();
    stubs.restoreGlobals();
  });

  const withFlag = (flatMapsEnabled) =>
    stubs.setGlobal("api", { game: { flatMapsEnabled: flatMapsEnabled } });

  it("is off, at once, on a build without the engine call", async () => {
    stubs.setGlobal("api", { game: {} });
    const module = freshModule();

    assert.equal(await module.enabled(), false);
    assert.deepEqual(errors, []);
  });

  it("is on when the engine says true", async () => {
    const engine = enginePromise();
    withFlag(() => engine);
    const module = freshModule();
    const reading = module.enabled();

    engine.resolve(true);

    assert.equal(await reading, true);
  });

  it("is off for any answer but true", async () => {
    const engine = enginePromise();
    withFlag(() => engine);
    const module = freshModule();
    const reading = module.enabled();

    engine.resolve("true");

    assert.equal(await reading, false);
    assert.deepEqual(errors, []);
  });

  it("asks the engine once per page", async () => {
    let calls = 0;
    const engine = enginePromise();
    withFlag(() => {
      calls++;
      return engine;
    });
    const module = freshModule();

    const first = module.enabled();
    engine.resolve(true);
    assert.equal(await first, true);

    assert.equal(module.enabled(), first);
    assert.equal(calls, 1);
  });

  it("is off, logged, and asked again after a failed call", async () => {
    let calls = 0;
    const engine = enginePromise();
    withFlag(() => {
      calls++;
      return engine;
    });
    const module = freshModule();

    const reading = module.enabled();
    engine.reject("no flag");
    assert.equal(await reading, false);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /flat maps flag not read.*no flag/);

    module.enabled();
    assert.equal(calls, 2);
  });

  it("is off and logged when the call throws", async () => {
    withFlag(() => {
      throw new Error("engine gone");
    });
    const module = freshModule();

    assert.equal(await module.enabled(), false);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /engine gone/);
  });

  it("is off and logged when the engine never answers", async () => {
    mock.timers.enable({ apis: ["setTimeout"] });
    withFlag(() => enginePromise());
    const module = freshModule();
    let value;
    module.enabled().then((result) => {
      value = result;
    });

    mock.timers.tick(4999);
    await flush();
    assert.equal(value, undefined);

    mock.timers.tick(1);
    await flush();
    assert.equal(value, false);
    assert.match(errors[0], /timed out after 5000ms/);
  });
});
