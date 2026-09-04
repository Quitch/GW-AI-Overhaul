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

  it("treats identifiers differing only in case as one mod", () => {
    const upper = { identifier: "uk.pa.TetcTree.server" };
    assert.deepEqual(
      biomes.modsFor(system(["oasis", "mountain"]), {
        oasis: tetctree,
        mountain: upper,
      }),
      [tetctree]
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

describe("serviceFor", () => {
  it("cooks text whether or not GW Server Mods is here", () => {
    assert.equal(biomes.serviceFor({ pureText: true }, false), "cook");
    assert.equal(biomes.serviceFor({ pureText: true }, true), "cook");
  });

  it("hands anything else to GW Server Mods, and drops it otherwise", () => {
    assert.equal(biomes.serviceFor({ pureText: false }, true), "gwsm");
    assert.equal(biomes.serviceFor({ pureText: false }, false), undefined);
    assert.equal(biomes.serviceFor({ pureText: false }), undefined);
  });
});

describe("serviceOf", () => {
  it("reads a stamp written before served existed as cooked", () => {
    assert.equal(biomes.serviceOf({ identifier: "x" }), "cook");
    assert.equal(biomes.serviceOf(undefined), "cook");
    assert.equal(biomes.isGwsmServed({ identifier: "x" }), false);
  });

  it("reads the served flag", () => {
    assert.equal(biomes.serviceOf({ served: "gwsm" }), "gwsm");
    assert.equal(biomes.isGwsmServed({ served: "gwsm" }), true);
    assert.equal(biomes.isGwsmServed({ served: "cook" }), false);
  });
});

describe("recordFrom", () => {
  it("builds the mount path from the installed-case identifier", () => {
    const record = biomes.recordFrom({
      identifier: "uk.pa.tetctree.server",
      rawIdentifier: "uk.pa.TetcTree.server",
      installedPath: "/download/x.zip",
      displayName: "Tetctree",
      version: "1.0.0",
    });
    assert.deepEqual(record, {
      identifier: "uk.pa.tetctree.server",
      rawIdentifier: "uk.pa.TetcTree.server",
      installedPath: "/download/x.zip",
      mountPath: "/server_mods/uk.pa.TetcTree.server/",
      displayName: "Tetctree",
      version: "1.0.0",
    });
  });

  it("falls back to the identifier for the raw one and the display name", () => {
    const record = biomes.recordFrom({
      identifier: "a.b",
      installedPath: "/x",
    });
    assert.equal(record.rawIdentifier, "a.b");
    assert.equal(record.mountPath, "/server_mods/a.b/");
    assert.equal(record.displayName, "a.b");
    assert.equal(record.version, undefined);
  });

  it("keeps a mount path the row already carries", () => {
    assert.equal(
      biomes.recordFrom({ identifier: "a", mountPath: "/m/" }).mountPath,
      "/m/"
    );
  });
});

describe("providersFrom", () => {
  const cooked = (mod) => Object.assign({}, mod, { served: "cook" });

  it("maps each biome to the first pure-text mod that ships it, marked cooked", () => {
    const providers = biomes.providersFrom([
      { mod: tetctree, pureText: true, biomes: ["oasis", "grass"] },
      { mod: simple, pureText: true, biomes: ["grass", "arctic"] },
    ]);
    assert.deepEqual(providers, {
      oasis: cooked(tetctree),
      grass: cooked(tetctree),
      arctic: cooked(simple),
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

  it("keeps a mod that is not pure text when GW Server Mods can serve it", () => {
    const alien = { identifier: "com.pa.alienworlds.server" };
    const providers = biomes.providersFrom(
      [
        { mod: alien, pureText: false, biomes: ["alienred"] },
        { mod: tetctree, pureText: true, biomes: ["oasis"] },
      ],
      true
    );
    assert.deepEqual(providers, {
      alienred: Object.assign({}, alien, { served: "gwsm" }),
      oasis: cooked(tetctree),
    });
  });

  it("does not write served onto the mod it was given", () => {
    const info = { mod: { identifier: "m" }, pureText: true, biomes: ["b"] };
    biomes.providersFrom([info]);
    assert.equal("served" in info.mod, false);
  });
});

describe("gwsmMods", () => {
  const alien = {
    identifier: "com.pa.alienworlds.server",
    installedPath: "/x",
    mountPath: "/server_mods/com.pa.alienworlds.server/",
    displayName: "Alien Worlds",
    version: "2.0.0",
    served: "gwsm",
  };

  it("lists each GW Server Mods-served stamp once, projected for the war record", () => {
    const stamps = [
      [alien, Object.assign({}, tetctree, { served: "cook" })],
      undefined,
      [Object.assign({}, alien, { identifier: "COM.pa.alienworlds.server" })],
    ];
    assert.deepEqual(biomes.gwsmMods(stamps), [
      {
        identifier: "com.pa.alienworlds.server",
        displayName: "Alien Worlds",
        version: "2.0.0",
      },
    ]);
  });

  it("ignores legacy stamps, and is empty with nothing stamped", () => {
    assert.deepEqual(biomes.gwsmMods([[tetctree]]), []);
    assert.deepEqual(biomes.gwsmMods([]), []);
    assert.deepEqual(biomes.gwsmMods(undefined), []);
  });

  it("names a mod with no display name by its identifier", () => {
    const bare = { identifier: "a.b", served: "gwsm" };
    assert.deepEqual(biomes.gwsmMods([[bare]]), [
      { identifier: "a.b", displayName: "a.b", version: undefined },
    ]);
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

describe("generatorOf", () => {
  it("reads the post-fixup generator, or the pre-fixup planet key", () => {
    assert.equal(biomes.generatorOf({ generator: { biome: "a" } }).biome, "a");
    assert.equal(biomes.generatorOf({ planet: { biome: "b" } }).biome, "b");
    assert.equal(biomes.generatorOf({}), undefined);
    assert.equal(biomes.generatorOf(undefined), undefined);
  });
});
