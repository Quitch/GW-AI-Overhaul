"use strict";

// shared/races.js: the race registry and the pure translation, brain and
// path rules every race-aware caller routes through. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  FIXTURE_RACE,
  predictableRng,
} = require("../scripts/lib/race-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");

const FX_TANK = "/pa/units/land/fx_tank/fx_tank.json";

let warnings;
let previousWarn;

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
  warnings = [];
  previousWarn = console.warn;
  console.warn = (message) => warnings.push(String(message));
});

afterEach(() => {
  console.warn = previousWarn;
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

  it("warns about keys units.js or the table lacks and keeps the rest", () => {
    races.register({
      id: "odd",
      units: { x: "/pa/units/x.json", y: "/pa/units/y.json" },
      mla: { x: ["ant", "noSuchKey"], y: "dox", z: "boom" },
      unitNames: { x: "Ex", z: "Zed" },
    });

    assert.match(
      warnings[0],
      /odd names unit keys units.js or its table lacks: noSuchKey, z/
    );
    assert.deepEqual(races.translatePaths("odd", [gwoUnit.ant, gwoUnit.dox]), [
      "/pa/units/x.json",
      "/pa/units/y.json",
    ]);
    assert.deepEqual(races.byId("odd").unitNames, { "/pa/units/x.json": "Ex" });
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

describe("translatePaths", () => {
  it("returns MLA paths untouched", () => {
    const paths = [gwoUnit.ant, gwoUnit.dox];

    assert.equal(races.translatePaths("mla", paths), paths);
    assert.deepEqual(races.translatePaths(undefined, undefined), []);
  });

  it("maps vanilla paths, drops unmapped vanilla ones once with a warning, passes foreign ones through", () => {
    const foreign = "/pa/units/commanders/fx_alpha/fx_alpha.json";

    assert.deepEqual(
      races.translatePaths("fixture", [
        gwoUnit.ant,
        gwoUnit.dox,
        foreign,
        gwoUnit.ant,
        gwoUnit.dox,
      ]),
      [FX_TANK, foreign]
    );
    assert.deepEqual(warnings, [
      "gwoRaces: fixture has no equivalent of " + gwoUnit.dox,
    ]);
  });
});

describe("translateMods", () => {
  it("re-points a mod's file and drops mods on files the race lacks", () => {
    const mods = [
      { file: gwoUnit.antAmmo, path: "damage", op: "multiply", value: 2 },
      { file: gwoUnit.doxAmmo, path: "damage", op: "multiply", value: 2 },
      { path: "x", op: "eval", value: "1" },
    ];

    assert.deepEqual(races.translateMods("fixture", mods), [
      {
        file: "/pa/units/land/fx_tank/fx_tank_ammo.json",
        path: "damage",
        op: "multiply",
        value: 2,
      },
      { path: "x", op: "eval", value: "1" },
    ]);
    assert.equal(mods[0].file, gwoUnit.antAmmo);
    assert.equal(races.translateMods("mla", mods), mods);
  });
});

describe("translateUnitMap", () => {
  it("re-points mapped vanilla spec_ids, leaves the rest, and copies", () => {
    const map = {
      unit_map: {
        Tank: { spec_id: gwoUnit.ant },
        Bot: { spec_id: gwoUnit.dox },
        Foreign: { spec_id: "/pa/units/x/x.json" },
        Type: { unit_types: "Tank & Custom7" },
      },
    };

    const translated = races.translateUnitMap("fixture", map);

    assert.deepEqual(translated.unit_map, {
      Tank: { spec_id: FX_TANK },
      Bot: { spec_id: gwoUnit.dox },
      Foreign: { spec_id: "/pa/units/x/x.json" },
      Type: { unit_types: "Tank & Custom7" },
    });
    assert.equal(map.unit_map.Tank.spec_id, gwoUnit.ant);
    assert.equal(races.translateUnitMap("mla", map), map);
    assert.equal(races.translateUnitMap("fixture", undefined), undefined);
  });
});

describe("cardUsable", () => {
  it("is true for MLA, for a card naming no units, and for a card the race can own", () => {
    assert.equal(races.cardUsable("mla", [gwoUnit.dox]), true);
    assert.equal(races.cardUsable("fixture", []), true);
    assert.equal(races.cardUsable("fixture", undefined), true);
    assert.equal(races.cardUsable("fixture", [gwoUnit.dox, gwoUnit.ant]), true);
    assert.equal(races.cardUsable("fixture", [gwoUnit.dox]), false);
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
});

describe("treeFilter", () => {
  it("under Titans keeps the race mod's own files and the brain's ai_config.json, never its unit maps", () => {
    const keep = races.treeFilter("fixture", "Titans", "/pa/ai/");

    assert.equal(keep("/pa/ai/ai_config.json"), true);
    assert.equal(keep("/pa/ai/fabber_builds/fixture/fabber_land.json"), true);
    assert.equal(keep("/pa/ai/factory_builds/fixture_air.json"), true);
    assert.equal(keep("/pa/ai/factory_builds/fixtures_air.json"), false);
    assert.equal(keep("/pa/ai/factory_builds/factory_air_builds.json"), false);
    assert.equal(keep("/pa/ai/fabber_builds/fabber_land.json"), false);
    assert.equal(keep("/pa/ai/unit_maps/fixture.json"), false);
    // Listed by the engine, so the tagged merged map beside it gets loaded.
    assert.equal(keep("/pa/ai/unit_maps/ai_unit_map.json"), true);
    assert.equal(keep("/pa/ai/unit_maps/ai_unit_map_x1.json"), true);
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
