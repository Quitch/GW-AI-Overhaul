"use strict";

// shared/race_ai_mods.js: a card's AI mods aimed at a race AI's own keys,
// over the fixture race's cells. See ai-pipeline.md, "Race trees".

const { describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { MOD_ROOT, loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { fixtureRaceKeys } = require("../scripts/lib/race-fixture.js");

const raceAiMods = loadCouiModule(MOD_ROOT + "/shared/race_ai_mods.js");
const unitCells = loadCouiModule(MOD_ROOT + "/shared/unit_cells.js");
const gwoUnit = loadCouiModule(MOD_ROOT + "/shared/units.js");

const FX_BETA = "/pa/units/commanders/fx_beta/fx_beta.json";
const FX_OTHER = "/pa/units/land/fx_other/fx_other.json";

function tableFor(options = {}) {
  return raceAiMods.table(fixtureRaceKeys(options));
}

const aimed = (options) => raceAiMods.aim(tableFor(options), options.remade);

const replace = (toBuild, value) => ({
  type: "fabber",
  op: "replace",
  toBuild,
  idToMod: "priority",
  value,
});

describe("race_ai_mods targets", () => {
  const targetsOf = (key, options = {}) =>
    aimed(options)
      .mods([replace(key, 1)])
      .map((mod) => mod.toBuild);

  it("gives a re-pointed key the race keys naming only its stand-ins", () => {
    assert.deepEqual(targetsOf("BasicVehicleFactory"), [
      "FixtureFactory",
      "AnyFixtureFactory",
    ]);
    assert.deepEqual(targetsOf("Tank"), ["FixtureTank"]);
  });

  it("gives a class key the race keys whose units all stand in for its members", () => {
    assert.deepEqual(targetsOf("Commander"), ["FixtureCommander"]);
    assert.deepEqual(targetsOf("AnyBasicFactory"), [
      "FixtureFactory",
      "AnyFixtureFactory",
    ]);
  });

  it("keeps a key the army's map keeps, one the stock maps lack, and a race key, as written", () => {
    assert.deepEqual(targetsOf("Dox"), ["Dox"]);
    assert.deepEqual(targetsOf("ThirdPartyKey"), ["ThirdPartyKey"]);
    assert.deepEqual(targetsOf("FixtureTank"), ["FixtureTank"]);
  });

  it("gives a unit the inventory's cards remake nothing, unless the army's map keeps its key", () => {
    const remade = { [gwoUnit.vehicleFactory]: true, [gwoUnit.dox]: true };

    assert.deepEqual(targetsOf("BasicVehicleFactory", { remade }), []);
    assert.deepEqual(targetsOf("Dox", { remade }), ["Dox"]);
  });

  it("follows the race's engine key over the stand-ins", () => {
    assert.deepEqual(targetsOf("Tank", { engineKeys: { Tank: FX_OTHER } }), [
      "FixtureOther",
    ]);
  });
});

describe("race_ai_mods guard", () => {
  const appendBuilder = (toBuild, builder) => ({
    type: "fabber",
    op: "append",
    toBuild,
    idToMod: "builders",
    value: builder,
    matchAll: true,
  });

  it("lands a builder only on the targets every one of its units can build", () => {
    assert.deepEqual(
      aimed({}).mods([
        appendBuilder("BasicVehicleFactory", "Commander"),
        appendBuilder("Tank", "Commander"),
      ]),
      [
        appendBuilder("FixtureFactory", "FixtureCommander"),
        appendBuilder("AnyFixtureFactory", "FixtureCommander"),
      ]
    );
  });

  it("drops a builder with a unit that has no build list, or covering no unit", () => {
    assert.deepEqual(
      aimed({ specs: { [FX_BETA]: { buildable_types: undefined } } }).mods([
        appendBuilder("BasicVehicleFactory", "Commander"),
      ]),
      []
    );
    assert.deepEqual(aimed({}).mods([appendBuilder("Tank", "NoSuchKey")]), []);
  });

  it("gives an array of builders back as an array, and a lone builder as a string", () => {
    const mod = appendBuilder("Tank", ["BasicVehicleFactory"]);

    assert.deepEqual(aimed({}).mods([mod]), [
      appendBuilder("FixtureTank", ["FixtureFactory", "AnyFixtureFactory"]),
    ]);
  });
});

describe("race_ai_mods passes", () => {
  it("lands a change once per target, however many stock keys reach it", () => {
    const mods = [
      replace("BasicVehicleFactory", 5),
      replace("AnyBasicFactory", 5),
    ];

    assert.deepEqual(aimed({}).mods(mods), [
      replace("FixtureFactory", 5),
      replace("AnyFixtureFactory", 5),
    ]);
  });

  it("stacks a second copy of the same card", () => {
    const card = [
      replace("BasicVehicleFactory", 5),
      replace("AnyBasicFactory", 5),
    ];

    assert.equal(aimed({}).mods(card.concat(card)).length, 4);
  });
});

describe("race_ai_mods descriptors kept as written", () => {
  it("keeps refId and refValue, which name one stock item", () => {
    const mod = Object.assign(replace("Tank", 3), {
      refId: "builders",
      refValue: ["BasicVehicleFactory"],
    });

    assert.deepEqual(aimed({}).mods([mod]), [
      Object.assign({}, mod, { toBuild: "FixtureTank" }),
    ]);
  });

  it("keeps platoon and template descriptors, loads, and a descriptor without toBuild", () => {
    const mods = [
      { type: "platoon", op: "replace", toBuild: "Tank", value: 1 },
      { type: "template", op: "squad", toBuild: "Tank", value: {} },
      { type: "fabber", op: "load", value: "card.json" },
      { type: "fabber", op: "new", value: [] },
    ];

    assert.deepEqual(aimed({}).mods(mods), mods);
  });

  it("aims silence's builders and exceptions without the guard, and drops one left with no builder", () => {
    const silence = (builders, except) => ({
      type: "factory",
      op: "silence",
      value: { builders, except },
    });

    assert.deepEqual(
      aimed({}).mods([
        silence(["BasicVehicleFactory", "Dox"], ["Tank", "Unknown"]),
      ]),
      [
        silence(
          ["FixtureFactory", "AnyFixtureFactory", "Dox"],
          ["FixtureTank", "Unknown"]
        ),
      ]
    );
    assert.deepEqual(
      aimed({ remade: { [gwoUnit.vehicleFactory]: true } }).mods([
        silence(["BasicVehicleFactory"], []),
      ]),
      []
    );
  });
});

describe("race_ai_mods loadFile", () => {
  const conditions = () => [
    [{ test_type: "CanFindPlaceToBuild", string0: "BasicVehicleFactory" }],
  ];

  it("copies each item once per target with the builders that can build it, and drops one left with none", () => {
    const json = {
      other: true,
      build_list: [
        {
          name: "factory",
          to_build: "BasicVehicleFactory",
          builders: ["Commander", "Dox"],
          build_conditions: conditions(),
        },
        { name: "tank", to_build: "Tank", builders: ["Commander"] },
      ],
    };

    const out = aimed({}).loadFile(json);

    assert.deepEqual(out, {
      other: true,
      build_list: [
        {
          name: "factory",
          to_build: "FixtureFactory",
          builders: ["FixtureCommander"],
          build_conditions: conditions(),
        },
        {
          name: "factory",
          to_build: "AnyFixtureFactory",
          builders: ["FixtureCommander"],
          build_conditions: conditions(),
        },
      ],
    });
    assert.notEqual(
      out.build_list[0].build_conditions,
      out.build_list[1].build_conditions
    );
    assert.equal(json.build_list[0].to_build, "BasicVehicleFactory");
  });

  it("keeps a GiveUp's aimed builders, unguarded, and drops one with none left", () => {
    const giveUp = (builders) => ({
      name: "give up",
      builders,
      task_type: "GiveUp",
    });

    assert.deepEqual(
      aimed({ remade: { [gwoUnit.vehicleFactory]: true } }).loadFile({
        build_list: [
          giveUp(["Commander", "Unknown"]),
          giveUp(["BasicVehicleFactory"]),
        ],
      }),
      { build_list: [giveUp(["FixtureCommander", "Unknown"])] }
    );
  });

  it("gives a file with no build_list back as written", () => {
    const templates = { platoon_templates: { Raid: { units: [] } } };

    assert.equal(aimed({}).loadFile(templates), templates);
  });
});

describe("race_ai_mods table", () => {
  it("is built once and shared by each inventory's aim", () => {
    const standInsFor = mock.method(unitCells, "standInsFor");
    try {
      const table = tableFor();
      const plain = raceAiMods.aim(table, {});
      const remaking = raceAiMods.aim(table, {
        [gwoUnit.vehicleFactory]: true,
      });

      assert.equal(plain.mods([replace("BasicVehicleFactory", 1)]).length, 2);
      assert.equal(
        remaking.mods([replace("BasicVehicleFactory", 1)]).length,
        0
      );
      assert.equal(standInsFor.mock.callCount(), 1);
    } finally {
      standInsFor.mock.restore();
    }
  });

  it("finds a load's file by its type, and none for a type without a directory", () => {
    assert.equal(
      raceAiMods.loadPath({ type: "factory", value: "card.json" }),
      "/pa/ai_tech/factory_builds/card.json"
    );
    assert.equal(
      raceAiMods.loadPath({ type: "platoon", value: "card.json" }),
      "/pa/ai_tech/platoon_builds/card.json"
    );
    assert.equal(
      raceAiMods.loadPath({ type: "template", value: "card.json" }),
      "/pa/ai_tech/platoon_templates/card.json"
    );
    assert.equal(raceAiMods.loadPath({ type: "bogus", value: "x" }), undefined);
  });
});
