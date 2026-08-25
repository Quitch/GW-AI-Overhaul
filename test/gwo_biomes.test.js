"use strict";

// shared/gwo_biomes.js, which knows which biomes the Galactic War local server
// can load. See galaxy.md.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const biomes = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js"
);

function system(names) {
  return {
    name: "sys",
    planets: names.map((biome) => ({ generator: { biome: biome } })),
  };
}

describe("isStockBiome", () => {
  it("accepts every stock biome and the fallback", () => {
    for (const biome of biomes.STOCK_BIOMES) {
      assert.equal(biomes.isStockBiome(biome), true, biome);
    }
    assert.equal(biomes.isStockBiome(biomes.FALLBACK_BIOME), true);
  });

  it("rejects modded, missing and differently-cased names", () => {
    assert.equal(biomes.isStockBiome("oasis"), false);
    assert.equal(biomes.isStockBiome(undefined), false);
    assert.equal(biomes.isStockBiome(""), false);
    assert.equal(biomes.isStockBiome("Earth"), false);
  });
});

describe("planetBiome", () => {
  it("reads generator.biome", () => {
    assert.equal(biomes.planetBiome({ generator: { biome: "lava" } }), "lava");
  });

  it("falls back to the pre-fixupPlanetConfig planet key", () => {
    assert.equal(biomes.planetBiome({ planet: { biome: "moon" } }), "moon");
  });

  it("is undefined for a planet with neither, or no planet", () => {
    assert.equal(biomes.planetBiome({}), undefined);
    assert.equal(biomes.planetBiome(undefined), undefined);
  });
});

describe("systemBiomes", () => {
  it("lists each biome once", () => {
    assert.deepEqual(biomes.systemBiomes(system(["earth", "moon", "earth"])), [
      "earth",
      "moon",
    ]);
  });

  it("reports a planet with no biome as the string it would be loaded by", () => {
    assert.deepEqual(biomes.systemBiomes({ planets: [{ generator: {} }] }), [
      "undefined",
    ]);
  });

  it("is empty for a malformed system", () => {
    assert.deepEqual(biomes.systemBiomes({}), []);
    assert.deepEqual(biomes.systemBiomes(undefined), []);
    assert.deepEqual(biomes.systemBiomes({ planets: [] }), []);
  });
});

describe("unservableBiome", () => {
  it("is undefined when every planet is stock", () => {
    assert.equal(
      biomes.unservableBiome(system(["earth", "moon", "gas"])),
      undefined
    );
  });

  it("names a modded biome on any planet", () => {
    assert.equal(biomes.unservableBiome(system(["earth", "oasis"])), "oasis");
  });

  it("names a planet with no biome at all", () => {
    assert.equal(
      biomes.unservableBiome({ planets: [{ generator: {} }] }),
      "undefined"
    );
  });

  it("accepts a modded biome that a provider serves", () => {
    const providers = { oasis: { identifier: "uk.pa.tetctree.server" } };
    assert.equal(
      biomes.unservableBiome(system(["oasis"]), providers),
      undefined
    );
    assert.equal(
      biomes.unservableBiome(system(["oasis", "arctic"]), providers),
      "arctic"
    );
  });

  it("is undefined for a malformed system", () => {
    assert.equal(biomes.unservableBiome({}), undefined);
    assert.equal(biomes.unservableBiome(undefined), undefined);
  });
});
