"use strict";

// shared/race_trees.js: which files of a brain's merged source listing make up
// a race's own AI tree, read through one treeContext per tree. See races.md,
// "Race trees".

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const raceTrees = loadCouiModule(MOD_ROOT + "/shared/race_trees.js");

const treeFilter = (raceId, brain, sourceRoot) =>
  raceTrees.treeFilter(raceTrees.treeContext(raceId, brain, sourceRoot));
const raceLayerFilter = (raceId, brain, sourceRoot) =>
  raceTrees.raceLayerFilter(raceTrees.treeContext(raceId, brain, sourceRoot));
const stockBuildFilter = (raceId, brain, sourceRoot) =>
  raceTrees.stockBuildFilter(raceTrees.treeContext(raceId, brain, sourceRoot));

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
});

afterEach(() => {
  races.reset();
});

describe("treeFilter", () => {
  const RIVAL_RACE = {
    id: "rival",
    ai: {
      titans: {
        unitMaps: ["/pa/ai/unit_maps/rival.json"],
        sources: [
          { dir: "/pa/ai/factory_builds/", match: "rival_" },
          { dir: "/pa/ai/fabber_builds/", match: "rival/" },
        ],
      },
    },
  };

  it("under Titans layers the race mod's files over the brain's base files, dropping other races' layers and stray unit maps", () => {
    races.register(RIVAL_RACE);
    const keep = treeFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(keep("/pa/ai/ai_config.json"), true);
    // The race's own layer.
    assert.equal(keep("/pa/ai/fabber_builds/fixture/fabber_land.json"), true);
    assert.equal(keep("/pa/ai/factory_builds/fixture_air.json"), true);
    // The base layer fills the race's gaps.
    assert.equal(keep("/pa/ai/factory_builds/factory_air_builds.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/fabber_land.json"), true);
    // A near-miss of the race's own prefix falls to the base layer by design.
    assert.equal(keep("/pa/ai/factory_builds/fixtures_air.json"), true);
    // Another registered race's layer never rides along.
    assert.equal(keep("/pa/ai/factory_builds/rival_air.json"), false);
    assert.equal(keep("/pa/ai/fabber_builds/rival/fabber_land.json"), false);
    // Listed by the engine, so the tagged merged map beside it gets loaded.
    assert.equal(keep("/pa/ai/unit_maps/ai_unit_map.json"), true);
    assert.equal(keep("/pa/ai/unit_maps/ai_unit_map_x1.json"), true);
    // No other untagged map may be listed: not the race's, not a rival's,
    // not an unclaimed one.
    assert.equal(keep("/pa/ai/unit_maps/fixture.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/rival.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/other.json"), false);
    assert.equal(keep("/pa/ai/fabber_builds/fixture/notes.txt"), false);
    assert.equal(keep("/pa/ai/neural_networks/fixture/x.json"), false);
  });

  it("under Titans keeps every layer's platoon templates, since a base build file can name another race's", () => {
    races.register(
      Object.assign({}, RIVAL_RACE, {
        ai: {
          titans: {
            sources: RIVAL_RACE.ai.titans.sources.concat([
              { dir: "/pa/ai/platoon_templates/", match: "rival.json" },
            ]),
          },
        },
      })
    );
    const keep = treeFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(keep("/pa/ai/platoon_templates/rival.json"), true);
    assert.equal(keep("/pa/ai/platoon_templates/platoon_templates.json"), true);
    assert.equal(keep("/pa/ai/factory_builds/rival_air.json"), false);
  });

  // Templates are kept even under an excluded fragment, as under Titans: a
  // build file the tree keeps can name any layer's.
  it("under a brain that carries the race keeps everything but the excluded fragments, templates aside, and the race's maps", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        ai: {
          queller: {
            unitMaps: ["unit_maps/fixture.json"],
            exclude: ["/mla/", "/unit_maps/mla.json"],
          },
        },
      })
    );
    const keep = treeFilter("fixture", "Queller", "/pa/ai_queller/q_uber/");

    assert.equal(keep("/pa/ai_queller/q_uber/ai_config.json"), true);
    assert.equal(
      keep("/pa/ai_queller/q_uber/fabber_builds/fixture/land.json"),
      true
    );
    assert.equal(keep("/pa/ai_queller/q_uber/platoon_builds/land.json"), true);
    assert.equal(
      keep("/pa/ai_queller/q_uber/unit_maps/ai_unit_map.json"),
      true
    );
    assert.equal(
      keep("/pa/ai_queller/q_uber/fabber_builds/mla/land.json"),
      false
    );
    assert.equal(
      keep("/pa/ai_queller/q_uber/platoon_templates/mla/orbital.json"),
      true
    );
    assert.equal(keep("/pa/ai_queller/q_uber/unit_maps/mla.json"), false);
    assert.equal(keep("/pa/ai_queller/q_uber/unit_maps/fixture.json"), false);
  });

  it("keeps nothing for MLA, an unknown race, or a brain the race has no data for", () => {
    assert.equal(
      treeFilter("mla", "Titans", "/pa/ai/")("/pa/ai/ai_config.json"),
      false
    );
    assert.equal(
      treeFilter("nope", "Titans", "/pa/ai/")("/pa/ai/ai_config.json"),
      false
    );
    const keep = treeFilter("fixture", "Penchant", "/pa/ai_penchant/");
    assert.equal(keep("/pa/ai_penchant/ai_config.json"), true);
    assert.equal(keep("/pa/ai_penchant/unit_maps/ai_unit_map.json"), true);
    assert.equal(keep("/pa/ai_penchant/fabber_builds/x.json"), false);
    assert.equal(keep("/pa/ai_penchant/platoon_templates/x.json"), false);
  });
});

describe("raceLayerFilter", () => {
  it("under Titans matches only the race mod's own files, never the base layer", () => {
    const owned = raceLayerFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(owned("/pa/ai/fabber_builds/fixture/fabber_land.json"), true);
    assert.equal(owned("/pa/ai/factory_builds/fixture_air.json"), true);
    assert.equal(owned("/pa/ai/ai_config.json"), false);
    assert.equal(owned("/pa/ai/factory_builds/factory_air_builds.json"), false);
    assert.equal(owned("/pa/ai/unit_maps/ai_unit_map.json"), false);
    assert.equal(owned("/pa/ai/fabber_builds/fixture/notes.txt"), false);
  });

  it("under a brain that carries the race matches the tier's data files, not the boilerplate every tree keeps", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        ai: {
          queller: {
            unitMaps: ["unit_maps/fixture.json"],
            exclude: ["/mla/", "/unit_maps/mla.json"],
          },
        },
      })
    );
    const owned = raceLayerFilter(
      "fixture",
      "Queller",
      "/pa/ai_queller/q_uber/"
    );

    assert.equal(owned("/pa/ai_queller/q_uber/platoon_builds/land.json"), true);
    assert.equal(owned("/pa/ai_queller/q_uber/ai_config.json"), false);
    assert.equal(
      owned("/pa/ai_queller/q_uber/unit_maps/ai_unit_map.json"),
      false
    );
    assert.equal(
      owned("/pa/ai_queller/q_uber/fabber_builds/mla/land.json"),
      false
    );
  });

  it("matches nothing for MLA, an unknown race, or a brain the race has no data for", () => {
    assert.equal(
      raceLayerFilter(
        "mla",
        "Titans",
        "/pa/ai/"
      )("/pa/ai/fabber_builds/x.json"),
      false
    );
    assert.equal(
      raceLayerFilter(
        "nope",
        "Titans",
        "/pa/ai/"
      )("/pa/ai/fabber_builds/x.json"),
      false
    );
    assert.equal(
      raceLayerFilter(
        "fixture",
        "Penchant",
        "/pa/ai_penchant/"
      )("/pa/ai_penchant/fabber_builds/x.json"),
      false
    );
  });
});

describe("raceLayerTest", () => {
  it("claims every registered race's Titans files and unit map, and nothing of the base tree", () => {
    races.register({
      id: "rival",
      ai: {
        titans: {
          unitMaps: ["/pa/ai/unit_maps/rival.json"],
          sources: [{ dir: "/pa/ai/factory_builds/", match: "rival_" }],
        },
      },
    });
    const claimed = raceTrees.raceLayerTest();

    assert.equal(claimed("/pa/ai/unit_maps/fixture.json"), true);
    assert.equal(claimed("/pa/ai/factory_builds/fixture_air.json"), true);
    assert.equal(
      claimed("/pa/ai/fabber_builds/fixture/fabber_land.json"),
      true
    );
    assert.equal(claimed("/pa/ai/unit_maps/rival.json"), true);
    assert.equal(claimed("/pa/ai/factory_builds/rival_air.json"), true);
    assert.equal(claimed("/pa/ai/ai_config.json"), false);
    assert.equal(claimed("/pa/ai/unit_maps/ai_unit_map.json"), false);
    assert.equal(
      claimed("/pa/ai/factory_builds/factory_air_builds.json"),
      false
    );
    // A near-miss of a race's prefix is a base file, as treeFilter reads it.
    assert.equal(claimed("/pa/ai/factory_builds/fixtures_air.json"), false);
  });

  it("never claims a platoon template, which an MLA tree keeps", () => {
    races.register({
      id: "rival",
      ai: {
        titans: {
          sources: [{ dir: "/pa/ai/platoon_templates/", match: "rival.json" }],
        },
      },
    });
    const claimed = raceTrees.raceLayerTest();

    assert.equal(claimed("/pa/ai/platoon_templates/rival.json"), false);
  });

  it("leaves a brain that carries the race its own files", () => {
    races.register({
      id: "carried",
      ai: {
        queller: { unitMaps: ["unit_maps/carried.json"], exclude: ["/mla/"] },
      },
    });
    const claimed = raceTrees.raceLayerTest();

    assert.equal(
      claimed("/pa/ai_queller/q_uber/unit_maps/carried.json"),
      false
    );
    assert.equal(
      claimed("/pa/ai_queller/q_uber/factory_builds/carried/x.json"),
      false
    );
  });
});

describe("stockBuildFilter", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("under Titans picks the base layer's factory and fabber lists, not the race's own layer, its add-ons', or other files", () => {
    races.register({
      id: "rival",
      ai: {
        titans: {
          sources: [{ dir: "/pa/ai/factory_builds/", match: "rival_" }],
        },
      },
    });
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const stock = stockBuildFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(stock("/pa/ai/fabber_builds/fabber_land_builds.json"), true);
    assert.equal(stock("/pa/ai/factory_builds/factory_air_builds.json"), true);
    assert.equal(stock("/pa/ai/fabber_builds/fixture/fabber_land.json"), false);
    assert.equal(stock("/pa/ai/factory_builds/fixture_air.json"), false);
    assert.equal(stock("/pa/ai/factory_builds/fixture/factory_2w.json"), false);
    assert.equal(stock("/pa/ai/factory_builds/rival_air.json"), false);
    assert.equal(
      stock("/pa/ai/platoon_builds/platoon_land_builds.json"),
      false
    );
    assert.equal(stock("/pa/ai/ai_config.json"), false);
  });

  it("picks nothing for MLA or under a brain that carries the race", () => {
    assert.equal(
      stockBuildFilter(
        "mla",
        "Titans",
        "/pa/ai/"
      )("/pa/ai/fabber_builds/fabber_land_builds.json"),
      false
    );
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        ai: {
          queller: { unitMaps: ["unit_maps/fixture.json"], exclude: ["/mla/"] },
        },
      })
    );
    assert.equal(
      stockBuildFilter(
        "fixture",
        "Queller",
        "/pa/ai_queller/q_uber/"
      )("/pa/ai_queller/q_uber/fabber_builds/land.json"),
      false
    );
  });
});

describe("treeFilter with add-ons", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("keeps the race's add-on layer, drops MLA's and other races', and never copies an add-on map", () => {
    races.register({
      id: "rival",
      ai: {
        titans: {
          unitMaps: ["/pa/ai/unit_maps/rival.json"],
          sources: [{ dir: "/pa/ai/factory_builds/", match: "rival_" }],
        },
      },
    });
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const keep = treeFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(keep("/pa/ai/factory_builds/fixture/factory_2w.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/fixture/fabber_land.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/fabber_land.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/mla/fabber_2w.json"), false);
    assert.equal(keep("/pa/ai/factory_builds/rival_air.json"), false);
    // Merged into the tagged map, never listed untagged.
    assert.equal(keep("/pa/ai/unit_maps/fixture_addon_fx.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/fixture_addon_aux.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/fixture_addon.json"), false);

    const rival = treeFilter("rival", "Titans", "/pa/ai/");
    assert.equal(rival("/pa/ai/factory_builds/fixture/factory_2w.json"), false);
    assert.equal(rival("/pa/ai/fabber_builds/mla/fabber_2w.json"), false);
    assert.equal(rival("/pa/ai/factory_builds/rival_air.json"), true);
  });

  it("keeps a file the race's own layer and another layer both claim", () => {
    races.registerAddon({
      id: "shared",
      layers: {
        mla: {
          titans: {
            sources: [{ dir: "/pa/ai/factory_builds/", match: "shared/" }],
          },
        },
        fixture: {
          titans: {
            sources: [{ dir: "/pa/ai/factory_builds/", match: "shared/" }],
          },
        },
      },
    });
    races.activateAddons(["shared"]);

    assert.equal(
      treeFilter(
        "fixture",
        "Titans",
        "/pa/ai/"
      )("/pa/ai/factory_builds/shared/x.json"),
      true
    );
  });

  it("leaves a brain that carries the race on its exclude branch, add-ons or not", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        ai: {
          queller: {
            unitMaps: ["unit_maps/fixture.json"],
            exclude: ["/mla/", "/unit_maps/mla.json"],
          },
        },
      })
    );
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const keep = treeFilter("fixture", "Queller", "/pa/ai_queller/q_uber/");

    assert.equal(keep("/pa/ai_queller/q_uber/platoon_builds/land.json"), true);
    assert.equal(
      keep("/pa/ai_queller/q_uber/fabber_builds/mla/land.json"),
      false
    );
  });
});

describe("raceLayerTest with add-ons", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("claims an add-on's race files and maps, not MLA's, and not a map MLA claims too", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const claimed = raceTrees.raceLayerTest();

    assert.equal(
      claimed("/pa/ai/factory_builds/fixture/factory_2w.json"),
      true
    );
    assert.equal(claimed("/pa/ai/unit_maps/fixture_addon_fx.json"), true);
    assert.equal(claimed("/pa/ai/unit_maps/fixture.json"), true);
    assert.equal(claimed("/pa/ai/fabber_builds/mla/fabber_2w.json"), false);
    assert.equal(claimed("/pa/ai/unit_maps/fixture_addon.json"), false);
    assert.equal(claimed("/pa/ai/unit_maps/fixture_addon_aux.json"), false);
    assert.equal(claimed("/pa/ai/fabber_builds/fabber_land.json"), false);
  });
});

describe("treeContext", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");
  const ADDON_FILE = "/pa/ai/factory_builds/fixture/factory_2w.json";
  const MOD_FILE = "/pa/ai/fabber_builds/fixture/fabber_land.json";
  const BASE_FILE = "/pa/ai/fabber_builds/fabber_land_builds.json";

  it("holds the race's layer, its add-ons' included, apart from the race mod's own sources", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const context = raceTrees.treeContext("fixture", "Titans", "/pa/ai/");

    assert.equal(context.isRace, true);
    assert.deepEqual(context.ownLayer, races.layersFor("titans").fixture);
    assert.deepEqual(context.modSources, FIXTURE_RACE.ai.titans.sources);
    assert.deepEqual(context.otherSources, [
      { dir: "/pa/ai/fabber_builds/", match: "mla/" },
    ]);
  });

  it("is no race tree for MLA or an unknown race", () => {
    for (const raceId of ["mla", "nope", undefined]) {
      const context = raceTrees.treeContext(raceId, "Titans", "/pa/ai/");
      assert.equal(context.isRace, false, String(raceId));
    }
    assert.deepEqual(
      raceTrees.treeContext("nope", "Titans", "/pa/ai/").ownLayer,
      { unitMaps: [], sources: [] }
    );
  });

  it("gives an add-on's files for the race to the race's tree but not to its race mod", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const context = raceTrees.treeContext("fixture", "Titans", "/pa/ai/");
    const filters = [
      raceTrees.treeFilter(context),
      raceTrees.raceLayerFilter(context),
      raceTrees.stockBuildFilter(context),
    ];
    const verdicts = (file) => filters.map((filter) => filter(file));

    assert.deepEqual(verdicts(ADDON_FILE), [true, false, false]);
    assert.deepEqual(verdicts(MOD_FILE), [true, true, false]);
    assert.deepEqual(verdicts(BASE_FILE), [true, false, true]);
  });

  it("layers an add-on's files over the base for a race that ships none of its own", () => {
    races.register({ id: "bare" });
    races.registerAddon({
      id: "bare_addon",
      layers: {
        bare: {
          titans: {
            sources: [{ dir: "/pa/ai/factory_builds/", match: "bare/" }],
          },
        },
      },
    });
    races.activateAddons(["bare_addon"]);
    const context = raceTrees.treeContext("bare", "Titans", "/pa/ai/");
    const keep = raceTrees.treeFilter(context);

    assert.deepEqual(context.modSources, []);
    assert.equal(keep("/pa/ai/factory_builds/bare/x.json"), true);
    assert.equal(keep(BASE_FILE), true);
    assert.equal(keep(MOD_FILE), false);
    assert.equal(
      raceTrees.raceLayerFilter(context)("/pa/ai/factory_builds/bare/x.json"),
      false
    );
  });

  it("picks no stock list for MLA, even with an MLA add-on layer active", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const context = raceTrees.treeContext("mla", "Titans", "/pa/ai/");

    assert.equal(context.ownLayer.sources.length, 1);
    assert.equal(raceTrees.stockBuildFilter(context)(BASE_FILE), false);
  });

  it("is read once: its filters keep the layers that were active when it was made", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);
    const context = raceTrees.treeContext("fixture", "Titans", "/pa/ai/");
    races.activateAddons([]);

    assert.equal(raceTrees.stockBuildFilter(context)(ADDON_FILE), false);
    assert.equal(
      stockBuildFilter("fixture", "Titans", "/pa/ai/")(ADDON_FILE),
      true
    );
  });
});
