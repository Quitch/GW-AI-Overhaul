"use strict";

// shared/races.js: the race registry and the pure brain, path and deal rules
// every race-aware caller routes through. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  FIXTURE_RACE,
  fixtureIndex,
  predictableRng,
} = require("../scripts/lib/race-fixture.js");

const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
});

afterEach(() => {
  races.reset();
});

describe("registry", () => {
  it("lists MLA first and normalises a race's id and server mod identifiers", () => {
    assert.deepEqual(
      races.all().map((race) => race.id),
      ["mla", "fixture"]
    );
    assert.deepEqual(races.byId("FIXTURE").serverMods, [
      "com.example.fixture-server",
      "com.example.fixture-server-dev",
    ]);
    assert.equal(races.byId(undefined), races.byId("mla"));
    assert.equal(races.byId("nope"), undefined);
  });

  it("refuses a race without an id, or one calling itself mla", () => {
    assert.throws(() => races.register({}), /needs an id/);
    assert.throws(() => races.register({ id: "MLA" }), /needs an id/);
  });

  it("re-registering an id replaces it without duplicating the listing", () => {
    races.register(Object.assign({}, FIXTURE_RACE, { name: "Again" }));

    assert.equal(races.all().length, 2);
    assert.equal(races.byId("fixture").name, "Again");
  });

  it("compiles unit names by path and keeps the race table", () => {
    races.register({
      id: "odd",
      units: { x: "/pa/units/x.json", y: "/pa/units/y.json" },
      unitNames: { x: "Ex", z: "Zed" },
    });

    assert.deepEqual(races.byId("odd").unitNames, { "/pa/units/x.json": "Ex" });
    assert.equal(races.byId("odd").units.y, "/pa/units/y.json");
  });

  it("treats an unknown id as MLA", () => {
    assert.equal(races.isMla("nope"), true);
    assert.equal(races.isMla("fixture"), false);
    assert.equal(races.isMla(""), true);
  });
});

describe("detect", () => {
  it("keeps MLA and any race with one of its server mods active, in any case", () => {
    assert.deepEqual(
      races.detect(["Com.Example.Fixture-Server-DEV"]).map((r) => r.id),
      ["mla", "fixture"]
    );
    assert.deepEqual(
      races.detect(["com.other"]).map((r) => r.id),
      ["mla"]
    );
    assert.deepEqual(
      races.detect(undefined).map((r) => r.id),
      ["mla"]
    );
  });
});

describe("brains", () => {
  it("supports MLA everywhere, Legion on Queller, and every race on Titans", () => {
    assert.equal(races.supportedBy("Penchant", "mla"), true);
    assert.equal(races.supportedBy("Penchant", "fixture"), false);
    races.register({ id: "legion" });
    assert.equal(races.supportedBy("Queller", "legion"), true);
    assert.equal(races.supportedBy("Penchant", "legion"), false);
    assert.equal(races.supportedBy("Queller", "fixture"), false);
    assert.equal(races.supportedBy("Titans", "fixture"), true);
    assert.equal(races.supportedBy("Unknown", "fixture"), false);
  });

  it("falls back to Titans for an unsupported pair", () => {
    assert.equal(races.brainFor("Penchant", "fixture"), "Titans");
    assert.equal(races.brainFor("Penchant", "mla"), "Penchant");
    races.register({ id: "legion" });
    assert.equal(races.brainFor("Queller", "legion"), "Queller");
    assert.equal(races.brainFor("Penchant", "legion"), "Titans");
  });

  it("lists the brains that support every race in play", () => {
    races.register({ id: "legion" });

    assert.deepEqual(races.brainsFor([]), ["Titans", "Queller", "Penchant"]);
    assert.deepEqual(races.brainsFor(["mla"]), [
      "Titans",
      "Queller",
      "Penchant",
    ]);
    assert.deepEqual(races.brainsFor(["mla", "legion"]), ["Titans", "Queller"]);
    assert.deepEqual(races.brainsFor(["fixture"]), ["Titans"]);
  });
});

describe("cardUsable", () => {
  it("is true for MLA, for a card naming no units, and until the race's cells are built", () => {
    assert.equal(races.cardUsable("mla", [gwoUnit.dox]), true);
    assert.equal(races.cardUsable("fixture", []), true);
    assert.equal(races.cardUsable("fixture", undefined), true);
    assert.equal(races.cellsOf("fixture"), undefined);
    assert.equal(races.cardUsable("fixture", [gwoUnit.dox]), true);
  });

  it("reads the race's cells once set: a card the race can own something of", () => {
    const index = fixtureIndex();
    races.setCells("Fixture", index);

    assert.equal(races.cellsOf("fixture"), index);
    assert.equal(races.cardUsable("fixture", [gwoUnit.dox, gwoUnit.ant]), true);
    assert.equal(races.cardUsable("fixture", [gwoUnit.dox]), false);
    assert.equal(races.cardUsable("fixture", [gwoUnit.vehicleFactory]), true);
    races.reset();
    assert.equal(races.cellsOf("fixture"), undefined);
  });
});

describe("cardUsable for race and add-on units", () => {
  const {
    FIXTURE_ADDON,
    fixtureAddonIndex,
  } = require("../scripts/lib/race-fixture.js");
  const FX_TANK = FIXTURE_RACE.units.fxTank;
  const FX_ADDON_TANK = FIXTURE_ADDON.units.fxAddonTank;
  const OTHER_TANK = "/pa/units/land/o_tank/o_tank.json";

  it("counts every non-stock path of a race or add-on table as foreign", () => {
    races.register({
      id: "other",
      unitTypeBit: "Custom9",
      units: { oTank: OTHER_TANK, sharedAmmo: gwoUnit.antAmmo },
    });
    races.registerAddon(FIXTURE_ADDON);

    const foreign = races.foreignUnitPaths();
    assert.equal(foreign[FX_TANK], true);
    assert.equal(foreign[OTHER_TANK], true);
    assert.equal(foreign[FX_ADDON_TANK], true);
    assert.equal(foreign[gwoUnit.antAmmo], undefined);
    assert.equal(foreign[gwoUnit.ant], undefined);
    assert.equal(races.namesForeignUnit([gwoUnit.ant, [FX_TANK]]), true);
    assert.equal(races.namesForeignUnit([gwoUnit.antAmmo]), false);
    assert.equal(races.cardUsable("mla", [gwoUnit.antAmmo]), true);
    races.reset();
    assert.deepEqual(races.foreignUnitPaths(), {});
  });

  it("offers a race-only card to that race alone, before and after its cells", () => {
    races.register({ id: "other", unitTypeBit: "Custom9", units: {} });

    assert.equal(races.cardUsable("fixture", [FX_TANK]), true);
    assert.equal(races.cardUsable("mla", [FX_TANK]), false);
    assert.equal(races.cardUsable("other", [FX_TANK]), false);

    races.setCells("fixture", fixtureIndex());
    assert.equal(races.cardUsable("fixture", [FX_TANK]), true);
    assert.equal(
      races.cardUsable("fixture", [FIXTURE_RACE.units.fxTankAmmo]),
      true
    );
    assert.equal(races.cardUsable("mla", [FX_TANK]), false);
  });

  it("offers a mixed card by either half, and reads a nested group", () => {
    races.setCells("fixture", fixtureIndex());

    assert.equal(races.cardUsable("mla", [FX_TANK, gwoUnit.dox]), true);
    assert.equal(races.cardUsable("fixture", [FX_TANK, gwoUnit.dox]), true);
    assert.equal(races.cardUsable("fixture", [[FX_TANK], gwoUnit.dox]), true);
    assert.equal(races.cardUsable("mla", [[[FX_TANK]]]), false);
    assert.equal(races.cardUsable("fixture", [[gwoUnit.dox]]), false);
  });

  it("offers an add-on card only once the player's index holds the unit", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);

    assert.equal(races.cardUsable("mla", [FX_ADDON_TANK]), false);
    assert.equal(races.cardUsable("fixture", [FX_ADDON_TANK]), false);

    races.setCells("mla", fixtureAddonIndex());
    races.setCells("fixture", fixtureIndex());
    assert.equal(races.fieldsUnit("mla", FX_ADDON_TANK), true);
    assert.equal(
      races.fieldsUnit("mla", FIXTURE_ADDON.units.fxExclusive),
      true
    );
    assert.equal(races.cardUsable("mla", [FX_ADDON_TANK]), true);
    assert.equal(races.cardUsable("fixture", [FX_ADDON_TANK]), false);
  });

  it("counts an exclusive unit only for a race that can build it", () => {
    const {
      FIXTURE_ADDON_SPECS,
      FIXTURE_ADDON_UNITS,
      FIXTURE_SPECS,
      FIXTURE_UNITS,
    } = require("../scripts/lib/race-fixture.js");
    const unitCells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
    const units = FIXTURE_UNITS.concat(FIXTURE_ADDON_UNITS);
    const specs = Object.assign({}, FIXTURE_SPECS, FIXTURE_ADDON_SPECS);
    const exclusive = FIXTURE_ADDON.units.fxExclusive;
    races.registerAddon(FIXTURE_ADDON);
    races.setCells("mla", fixtureAddonIndex());
    const addonPaths = races.addonUnitPaths();
    races.setCells("fixture", {
      vanilla: unitCells.buildIndex(
        units,
        specs,
        (types, path) => unitCells.vanillaMember(types) && !addonPaths[path]
      ),
      race: unitCells.buildIndex(
        units,
        specs,
        unitCells.raceMember("Custom7"),
        unitCells.exclusiveMember(races.knownBits())
      ),
    });

    assert.equal(races.cellsOf("fixture").race.exclusive[exclusive], true);
    assert.equal(races.fieldsUnit("fixture", exclusive), false);
    assert.equal(races.fieldsUnit("mla", exclusive), true);
  });
});

describe("what a race player fields, and the mods that reach it", () => {
  const {
    FIXTURE_SPECS,
    FIXTURE_UNITS,
  } = require("../scripts/lib/race-fixture.js");
  const unitCells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
  const FX_TANK = FIXTURE_RACE.units.fxTank;
  const OTHER_TANK = "/pa/units/land/o_tank/o_tank.json";
  const STALE = "/pa/units/land/fx_gone/fx_gone.json";
  // A race file that carries no faction bit: the vanilla index holds it in
  // the Ant's cell.
  const BITLESS = "/pa/units/land/fx_bitless/fx_bitless.json";
  const mod = (file) => ({
    file,
    path: "max_health",
    op: "multiply",
    value: 2,
  });

  beforeEach(() => {
    races.reset();
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        units: Object.assign({}, FIXTURE_RACE.units, {
          fxGone: STALE,
          fxBitless: BITLESS,
        }),
      })
    );
    races.register({
      id: "other",
      unitTypeBit: "Custom9",
      units: { oTank: OTHER_TANK },
    });
  });

  const bitlessIndex = () => {
    const units = FIXTURE_UNITS.concat(BITLESS);
    const specs = Object.assign({}, FIXTURE_SPECS, {
      [BITLESS]: {
        unit_types: ["Basic", "Land", "Mobile", "Offense", "Tank"].map(
          (tag) => "UNITTYPE_" + tag
        ),
      },
    });
    return {
      vanilla: unitCells.buildIndex(units, specs, unitCells.vanillaMember),
      race: unitCells.buildIndex(units, specs, unitCells.raceMember("Custom7")),
    };
  };

  it("keeps stock paths and the race's own, and drops another race's", () => {
    const held = [gwoUnit.ant, FX_TANK, OTHER_TANK];

    assert.deepEqual(races.fieldedFor("fixture", held), [gwoUnit.ant, FX_TANK]);
    assert.deepEqual(races.fieldedFor("mla", held), [gwoUnit.ant]);

    const index = fixtureIndex();
    races.setCells("fixture", index);
    const fielded = races.fieldedFor("fixture", held.concat(STALE), index);
    assert.ok(fielded.includes(FX_TANK));
    assert.ok(fielded.includes(STALE));
    assert.equal(fielded.includes(OTHER_TANK), false);
  });

  it("drops a mod on another race's path, and keeps stock, own, and file-less mods", () => {
    const evalMod = { path: "x", op: "eval", value: "1" };
    const mods = [
      mod(gwoUnit.dox),
      mod(FX_TANK),
      mod(OTHER_TANK),
      mod(STALE),
      evalMod,
    ];

    assert.deepEqual(races.modsFor("fixture", mods), [
      mod(gwoUnit.dox),
      mod(FX_TANK),
      mod(STALE),
      evalMod,
    ]);
    assert.deepEqual(races.modsFor("mla", mods), [mod(gwoUnit.dox), evalMod]);
  });

  it("changes a race file as named once the cells are built, never re-aimed by cell", () => {
    const index = bitlessIndex();
    races.setCells("fixture", index);

    assert.equal(
      index.vanilla.cellOf[BITLESS],
      index.vanilla.cellOf[gwoUnit.ant]
    );
    assert.deepEqual(
      unitCells.expandMods([mod(BITLESS)], index.vanilla, index.race),
      [mod(FX_TANK)]
    );
    assert.deepEqual(races.modsFor("fixture", [mod(BITLESS)], index), [
      mod(BITLESS),
    ]);
    assert.deepEqual(races.modsFor("fixture", [mod(gwoUnit.ant)], index), [
      mod(FX_TANK),
    ]);
  });

  it("lists a card's units for the tooltip: fielded race units, and stock units by cell", () => {
    const index = fixtureIndex();
    races.setCells("fixture", index);

    assert.deepEqual(
      races.cardUnitsFor(
        "fixture",
        [gwoUnit.ant, [gwoUnit.dox, OTHER_TANK], FX_TANK],
        index
      ),
      [FX_TANK]
    );
    assert.deepEqual(races.cardUnitsFor("mla", [gwoUnit.ant, FX_TANK]), [
      gwoUnit.ant,
    ]);
  });
});

describe("raceOf", () => {
  it("reads an AI's race, an inventory's tag, and defaults to MLA", () => {
    assert.equal(races.raceOf({ race: "Fixture" }), "fixture");
    assert.equal(races.raceOf({ race: "unregistered" }), "mla");
    assert.equal(
      races.raceOf({
        getTag: (ns, key) =>
          ns === "global" && key === "playerRace" ? "fixture" : undefined,
      }),
      "fixture"
    );
    assert.equal(races.raceOf({ getTag: () => undefined }), "mla");
    assert.equal(races.raceOf({}), "mla");
    assert.equal(races.raceOf(undefined), "mla");
  });
});

describe("aiRoot", () => {
  it("inserts the race into the first path segment and leaves MLA alone", () => {
    assert.equal(races.aiRoot("fixture", "/pa/ai/"), "/pa/ai_race_fixture/");
    assert.equal(
      races.aiRoot("fixture", "/pa/ai_queller/q_uber/"),
      "/pa/ai_queller_race_fixture/q_uber/"
    );
    assert.equal(
      races.aiRoot("fixture", "/pa/ai_penchant/player_guardians/"),
      "/pa/ai_penchant_race_fixture/player_guardians/"
    );
    assert.equal(races.aiRoot("mla", "/pa/ai/"), "/pa/ai/");
    assert.equal(races.aiRoot("fixture", "/pa/ai"), "/pa/ai_race_fixture");
  });
});

describe("commanderRetagMods", () => {
  it("swaps the vanilla unit-type bit for the race's and replaces the build list", () => {
    const unicorn = "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json";

    assert.deepEqual(races.unitRetagMods("fixture", gwoUnit.colonel), [
      {
        file: gwoUnit.colonel,
        path: "unit_types",
        op: "pull",
        value: ["UNITTYPE_Custom58"],
      },
      {
        file: gwoUnit.colonel,
        path: "unit_types",
        op: "push",
        value: ["UNITTYPE_Custom7"],
      },
    ]);
    assert.deepEqual(races.unitRetagMods("mla", gwoUnit.colonel), []);

    assert.deepEqual(races.commanderRetagMods("fixture", unicorn), [
      {
        file: unicorn,
        path: "unit_types",
        op: "pull",
        value: ["UNITTYPE_Custom58"],
      },
      {
        file: unicorn,
        path: "unit_types",
        op: "push",
        value: ["UNITTYPE_Custom7"],
      },
      {
        file: unicorn,
        path: "buildable_types",
        op: "replace",
        value: "CmdBuild & Custom7",
      },
    ]);
    assert.deepEqual(races.commanderRetagMods("mla", unicorn), []);
  });
});

describe("commanderArtHue", () => {
  it("reads the race's art hue and defaults to MLA's blue", () => {
    assert.equal(races.commanderArtHue("mla"), 210);
    assert.equal(races.commanderArtHue("fixture"), 210);
    races.register(Object.assign({}, FIXTURE_RACE, { commanderArtHue: 0 }));
    assert.equal(races.commanderArtHue("fixture"), 0);
  });
});

describe("commanderFor", () => {
  it("draws one of the race's commanders, and nothing for MLA", () => {
    assert.equal(
      races.commanderFor(predictableRng(), "fixture"),
      "/pa/units/commanders/fx_alpha/fx_alpha.json"
    );
    assert.equal(races.commanderFor(predictableRng(), "mla"), undefined);
    assert.match(
      races.commanderFor(undefined, "fixture"),
      /\/pa\/units\/commanders\/fx_(alpha|beta)\//
    );
  });
});

describe("assign", () => {
  it("draws independently by default, so repeats are allowed", () => {
    assert.deepEqual(
      races.assign(predictableRng(), [0, 1, 2], ["mla", "fixture"]),
      { 0: "mla", 1: "mla", 2: "mla" }
    );
  });

  it("draws without replacement when unique, refilling once the pool is spent", () => {
    assert.deepEqual(
      races.assign(predictableRng(), [0, 1, 2, 3, 4], ["mla", "Fixture"], {
        unique: true,
      }),
      { 0: "fixture", 1: "mla", 2: "fixture", 3: "mla", 4: "fixture" }
    );
  });

  it("falls back to MLA for an empty pool", () => {
    assert.deepEqual(races.assign(predictableRng(), [0], []), { 0: "mla" });
  });

  it("skips a taken race in the first pass, then refills with the whole pool", () => {
    assert.deepEqual(
      races.assign(predictableRng(), [0, 1, 2, 3], ["mla", "fixture"], {
        unique: true,
        taken: ["Fixture"],
      }),
      { 0: "mla", 1: "fixture", 2: "mla", 3: "fixture" }
    );
  });

  it("draws from the whole pool when every race is taken", () => {
    assert.deepEqual(
      races.assign(predictableRng(), [0, 1], ["mla"], {
        unique: true,
        taken: ["mla"],
      }),
      { 0: "mla", 1: "mla" }
    );
  });

  it("ignores taken without unique", () => {
    assert.deepEqual(
      races.assign(predictableRng(), [0], ["mla", "fixture"], {
        taken: ["mla"],
      }),
      { 0: "mla" }
    );
  });
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
    const keep = races.treeFilter("fixture", "Titans", "/pa/ai/");

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

  it("under a brain that carries the race keeps everything but the excluded fragments and the race's maps", () => {
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
    const keep = races.treeFilter(
      "fixture",
      "Queller",
      "/pa/ai_queller/q_uber/"
    );

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
    assert.equal(keep("/pa/ai_queller/q_uber/unit_maps/mla.json"), false);
    assert.equal(keep("/pa/ai_queller/q_uber/unit_maps/fixture.json"), false);
  });

  it("keeps nothing for MLA, an unknown race, or a brain the race has no data for", () => {
    assert.equal(
      races.treeFilter("mla", "Titans", "/pa/ai/")("/pa/ai/ai_config.json"),
      false
    );
    assert.equal(
      races.treeFilter("nope", "Titans", "/pa/ai/")("/pa/ai/ai_config.json"),
      false
    );
    const keep = races.treeFilter("fixture", "Penchant", "/pa/ai_penchant/");
    assert.equal(keep("/pa/ai_penchant/ai_config.json"), true);
    assert.equal(keep("/pa/ai_penchant/unit_maps/ai_unit_map.json"), true);
    assert.equal(keep("/pa/ai_penchant/fabber_builds/x.json"), false);
  });
});

describe("raceLayerFilter", () => {
  it("under Titans matches only the race mod's own files, never the base layer", () => {
    const owned = races.raceLayerFilter("fixture", "Titans", "/pa/ai/");

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
    const owned = races.raceLayerFilter(
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
      races.raceLayerFilter(
        "mla",
        "Titans",
        "/pa/ai/"
      )("/pa/ai/fabber_builds/x.json"),
      false
    );
    assert.equal(
      races.raceLayerFilter(
        "nope",
        "Titans",
        "/pa/ai/"
      )("/pa/ai/fabber_builds/x.json"),
      false
    );
    assert.equal(
      races.raceLayerFilter(
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
    const claimed = races.raceLayerTest();

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

  it("leaves a brain that carries the race its own files", () => {
    races.register({
      id: "carried",
      ai: {
        queller: { unitMaps: ["unit_maps/carried.json"], exclude: ["/mla/"] },
      },
    });
    const claimed = races.raceLayerTest();

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

describe("unitMapsFor", () => {
  it("resolves relative map paths against the source root and keeps absolute ones", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        ai: {
          titans: { unitMaps: ["/pa/ai/unit_maps/fixture.json"] },
          queller: { unitMaps: ["unit_maps/fixture.json"] },
        },
      })
    );

    assert.deepEqual(races.unitMapsFor("fixture", "Titans", "/pa/ai/"), [
      "/pa/ai/unit_maps/fixture.json",
    ]);
    assert.deepEqual(
      races.unitMapsFor("fixture", "Queller", "/pa/ai_queller/q_uber/"),
      ["/pa/ai_queller/q_uber/unit_maps/fixture.json"]
    );
    assert.deepEqual(
      races.unitMapsFor("fixture", "Penchant", "/pa/ai_penchant/"),
      []
    );
    assert.deepEqual(races.unitMapsFor("mla", "Titans", "/pa/ai/"), []);
  });
});

describe("add-ons", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("registers an add-on apart from the races, normalised, and detects it by server mod", () => {
    races.registerAddon(FIXTURE_ADDON);

    assert.deepEqual(
      races.addons().map((addon) => addon.id),
      ["fixture_addon"]
    );
    assert.deepEqual(
      races.all().map((race) => race.id),
      ["mla", "fixture"]
    );
    assert.deepEqual(races.addonById("FIXTURE_ADDON").serverMods, [
      "com.example.fixture-addon",
    ]);
    assert.equal(races.isMla("fixture_addon"), true);
    assert.deepEqual(
      races.detectAddons(["Com.Example.Fixture-Addon"]).map((a) => a.id),
      ["fixture_addon"]
    );
    assert.deepEqual(races.detectAddons(["com.other"]), []);
    assert.deepEqual(races.detectAddons(undefined), []);
  });

  it("refuses an add-on without an id, replaces on re-register, and is cleared by reset", () => {
    assert.throws(() => races.registerAddon({}), /needs an id/);
    races.registerAddon(FIXTURE_ADDON);
    races.registerAddon(Object.assign({}, FIXTURE_ADDON, { name: "Again" }));

    assert.equal(races.addons().length, 1);
    assert.equal(races.addonById("fixture_addon").name, "Again");
    races.reset();
    assert.deepEqual(races.addons(), []);
  });

  it("knows vanilla's bit and every race's, and every add-on unit path", () => {
    assert.deepEqual(races.knownBits(), ["Custom58", "Custom7"]);
    assert.deepEqual(races.addonUnitPaths(), {});
    races.registerAddon(FIXTURE_ADDON);

    const paths = races.addonUnitPaths();
    assert.equal(paths[FIXTURE_ADDON.units.fxGantry], true);
    assert.equal(
      Object.keys(paths).length,
      Object.keys(FIXTURE_ADDON.units).length
    );
  });

  it("names a unit from the race's table, else from an add-on's", () => {
    races.registerAddon(FIXTURE_ADDON);

    assert.equal(
      races.unitName("fixture", FIXTURE_RACE.units.fxTank),
      "Fixture Tank"
    );
    assert.equal(
      races.unitName("fixture", FIXTURE_ADDON.units.fxAddonTank),
      "Fixture Add-on Tank"
    );
    assert.equal(
      races.unitName("mla", FIXTURE_ADDON.units.fxExclusive),
      "Fixture Exclusive"
    );
    assert.equal(
      races.unitName("mla", FIXTURE_ADDON.units.fxGantry),
      undefined
    );
    assert.equal(races.unitName("nope", gwoUnit.dox), undefined);
  });

  it("registers the shipped add-ons beside the shipped races, none of them active", () => {
    races.registerShipped();

    assert.deepEqual(
      races.addons().map((addon) => addon.id),
      ["second_wave", "section17", "osmech"]
    );
    assert.deepEqual(races.activeAddons(), []);
    assert.ok(races.byId("legion"));
  });

  it("activates add-ons by normalised id in registration order, replacing the set, and reset clears it", () => {
    races.registerAddon({ id: "second" });
    races.registerAddon(FIXTURE_ADDON);

    races.activateAddons([" Fixture_Addon ", "nope"]);
    assert.deepEqual(
      races.activeAddons().map((addon) => addon.id),
      ["fixture_addon"]
    );

    races.activateAddons(["fixture_addon", "second"]);
    assert.deepEqual(
      races.activeAddons().map((addon) => addon.id),
      ["second", "fixture_addon"]
    );

    races.activateAddons(["second"]);
    assert.deepEqual(
      races.activeAddons().map((addon) => addon.id),
      ["second"]
    );

    races.activateAddons(undefined);
    assert.deepEqual(races.activeAddons(), []);

    races.activateAddons(["second"]);
    races.reset();
    races.registerAddon({ id: "second" });
    assert.deepEqual(races.activeAddons(), []);
  });
});

describe("layersFor", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("merges each race's ai block with every active add-on's layer for it, MLA and unregistered ids included", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.registerAddon({
      id: "ghost",
      layers: {
        phantom: {
          titans: {
            sources: [{ dir: "/pa/ai/platoon_builds/", match: "phantom/" }],
          },
        },
      },
    });
    races.activateAddons(["fixture_addon", "ghost"]);

    const layers = races.layersFor("titans");
    assert.deepEqual(Object.keys(layers).sort(), ["fixture", "mla", "phantom"]);
    assert.deepEqual(layers.mla, {
      unitMaps: [
        "/pa/ai/unit_maps/fixture_addon.json",
        "/pa/ai/unit_maps/fixture_addon_aux.json",
      ],
      sources: [{ dir: "/pa/ai/fabber_builds/", match: "mla/" }],
    });
    assert.deepEqual(layers.fixture.unitMaps, [
      "/pa/ai/unit_maps/fixture.json",
      "/pa/ai/unit_maps/fixture_addon_fx.json",
      "/pa/ai/unit_maps/fixture_addon_aux.json",
    ]);
    assert.equal(layers.fixture.sources.length, 3);
    assert.equal(layers.phantom.sources.length, 1);
    assert.deepEqual(races.layersFor("queller").fixture, {
      unitMaps: [],
      sources: [],
    });
  });

  it("gives an inactive add-on no layer: registered is not active", () => {
    races.registerAddon(FIXTURE_ADDON);

    const layers = races.layersFor("titans");
    assert.deepEqual(Object.keys(layers).sort(), ["fixture", "mla"]);
    assert.deepEqual(layers.mla, { unitMaps: [], sources: [] });
    assert.deepEqual(layers.fixture, {
      unitMaps: ["/pa/ai/unit_maps/fixture.json"],
      sources: FIXTURE_RACE.ai.titans.sources,
    });
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
    const keep = races.treeFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(keep("/pa/ai/factory_builds/fixture/factory_2w.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/fixture/fabber_land.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/fabber_land.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/mla/fabber_2w.json"), false);
    assert.equal(keep("/pa/ai/factory_builds/rival_air.json"), false);
    // Merged into the tagged map, never listed untagged.
    assert.equal(keep("/pa/ai/unit_maps/fixture_addon_fx.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/fixture_addon_aux.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/fixture_addon.json"), false);

    const rival = races.treeFilter("rival", "Titans", "/pa/ai/");
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
      races.treeFilter(
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
    const keep = races.treeFilter(
      "fixture",
      "Queller",
      "/pa/ai_queller/q_uber/"
    );

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
    const claimed = races.raceLayerTest();

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

describe("unitMapsFor with add-ons", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("adds the race's add-on maps after its own and gives MLA none", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons(["fixture_addon"]);

    assert.deepEqual(races.unitMapsFor("fixture", "Titans", "/pa/ai/"), [
      "/pa/ai/unit_maps/fixture.json",
      "/pa/ai/unit_maps/fixture_addon_fx.json",
      "/pa/ai/unit_maps/fixture_addon_aux.json",
    ]);
    assert.deepEqual(races.unitMapsFor("mla", "Titans", "/pa/ai/"), []);
    assert.deepEqual(races.unitMapsFor("nope", "Titans", "/pa/ai/"), []);
  });

  it("omits an inactive add-on's maps: its files are not on disk to read", () => {
    races.registerAddon(FIXTURE_ADDON);
    races.activateAddons([]);

    assert.deepEqual(races.unitMapsFor("fixture", "Titans", "/pa/ai/"), [
      "/pa/ai/unit_maps/fixture.json",
    ]);
  });
});
