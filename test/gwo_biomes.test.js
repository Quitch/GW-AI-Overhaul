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

const tetctree = { identifier: "uk.pa.tetctree.server", installedPath: "/x" };
const simple = { identifier: "com.pa.grandhomie.simplebiomes.server" };

describe("modsFor", () => {
  const providers = { oasis: tetctree, mountain: tetctree, grass: simple };

  it("lists each providing mod once, ignoring stock planets", () => {
    assert.deepEqual(
      biomes.modsFor(
        system(["earth", "oasis", "mountain", "grass"]),
        providers
      ),
      [tetctree, simple]
    );
  });

  it("is empty for stock or unprovided biomes", () => {
    assert.deepEqual(biomes.modsFor(system(["earth"]), providers), []);
    assert.deepEqual(biomes.modsFor(system(["arctic"]), providers), []);
    assert.deepEqual(biomes.modsFor(system(["oasis"])), []);
  });
});

describe("catalogEntries", () => {
  it("accepts a bare path list", () => {
    assert.deepEqual(biomes.catalogEntries(["pa/a.json", "/pa/b.json"]), [
      "pa/a.json",
      "pa/b.json",
    ]);
  });

  it("accepts entry objects and a wrapping object", () => {
    assert.deepEqual(
      biomes.catalogEntries({
        files: [{ path: "./pa/a.json" }, { name: "b" }],
      }),
      ["pa/a.json", "b"]
    );
  });

  it("is empty for anything else", () => {
    assert.deepEqual(biomes.catalogEntries(undefined), []);
    assert.deepEqual(biomes.catalogEntries({}), []);
    assert.deepEqual(biomes.catalogEntries([42, null]), []);
  });
});

describe("catalogInfo", () => {
  const textOnly = [
    "modinfo.json",
    "pa/",
    "pa/terrain/",
    "pa/terrain/oasis.json",
    "pa/terrain/mountain.json",
    "pa/terrain/brush_list.json",
    "pa/terrain/oasis/oasis.json",
    "pa/terrain/oasis/features/desert_rock_01.json",
    "ui/main/shared/img/planets/oasis.png",
  ];

  it("reads the biomes a text-only mod ships, skipping registries and sub-biomes", () => {
    const info = biomes.catalogInfo(tetctree, textOnly);
    assert.equal(info.mod, tetctree);
    assert.equal(info.pureText, true);
    assert.deepEqual(info.biomes, ["oasis", "mountain"]);
  });

  it("is not pure text once anything but JSON sits under pa/", () => {
    const info = biomes.catalogInfo(
      tetctree,
      textOnly.concat(["pa/terrain/oasis/fbx/rock.papa"])
    );
    assert.equal(info.pureText, false);
    assert.deepEqual(info.biomes, ["oasis", "mountain"]);
  });

  it("ignores files outside pa/ when judging text", () => {
    assert.equal(biomes.catalogInfo(tetctree, ["ui/x.png"]).pureText, true);
  });
});

describe("providersFrom", () => {
  it("maps each biome to the first pure-text mod that ships it", () => {
    const providers = biomes.providersFrom([
      { mod: tetctree, pureText: true, biomes: ["oasis", "grass"] },
      { mod: simple, pureText: true, biomes: ["grass", "arctic"] },
    ]);
    assert.deepEqual(providers, {
      oasis: tetctree,
      grass: tetctree,
      arctic: simple,
    });
  });

  it("skips mods that are not pure text, and unreadable ones", () => {
    const providers = biomes.providersFrom([
      undefined,
      { mod: tetctree, pureText: false, biomes: ["alienred"] },
    ]);
    assert.deepEqual(providers, {});
    assert.deepEqual(biomes.providersFrom(undefined), {});
  });
});

describe("jsonEntries", () => {
  it("keeps only JSON files under pa/", () => {
    assert.deepEqual(
      biomes.jsonEntries([
        "modinfo.json",
        "pa/terrain/",
        "pa/terrain/oasis.json",
        "pa/terrain/oasis/fbx/rock.papa",
        "ui/main/shared/img/planets/oasis.png",
      ]),
      ["pa/terrain/oasis.json"]
    );
  });
});
