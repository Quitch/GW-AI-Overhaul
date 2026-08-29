"use strict";

// Unit tests for the game-files referee's ai_unit_map path logic. The tested helpers
// live in the extracted gw_play/referee_game_file_paths.js; the referee file itself
// depends on the unshipped shared/gw_common and cannot load here, so this loads the
// extracted module.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  buildGame,
  SCENARIO_AXES,
  useModel,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeGameFiles = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const gwoSpecs = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js"
);

const installModel = useModel();

const isClusterTrue = () => true;
const isClusterFalse = () => false;

describe("getAIUnitMapPath", () => {
  it("Queller source is under q_uber/, regardless of titans", () => {
    assert.equal(
      refereeGameFiles.getAIUnitMapPath(false, "Queller"),
      "/pa/ai_queller/q_uber/unit_maps/ai_unit_map.json"
    );
    assert.equal(
      refereeGameFiles.getAIUnitMapPath(true, "Queller"),
      "/pa/ai_queller/q_uber/unit_maps/ai_unit_map_x1.json"
    );
  });

  it("Penchant source is under /pa/ai_penchant/", () => {
    assert.equal(
      refereeGameFiles.getAIUnitMapPath(false, "Penchant"),
      "/pa/ai_penchant/unit_maps/ai_unit_map.json"
    );
  });

  it("Titans (default) source is under /pa/ai/", () => {
    assert.equal(
      refereeGameFiles.getAIUnitMapPath(false, "Titans"),
      "/pa/ai/unit_maps/ai_unit_map.json"
    );
  });

  it("titans=false never produces an _x1.json path", () => {
    for (const aiInUse of SCENARIO_AXES.AI_BRAINS) {
      assert.ok(
        !refereeGameFiles.getAIUnitMapPath(false, aiInUse).includes("_x1")
      );
    }
  });
});

describe("getAIUnitMapDestinationPath", () => {
  it("appends unit_maps/ai_unit_map.json to the given aiPath", () => {
    assert.equal(
      refereeGameFiles.getAIUnitMapDestinationPath(
        false,
        "/pa/ai_subcommander/"
      ),
      "/pa/ai_subcommander/unit_maps/ai_unit_map.json"
    );
  });

  it("appends the _x1 suffix when titans is true", () => {
    assert.equal(
      refereeGameFiles.getAIUnitMapDestinationPath(
        true,
        "/pa/ai_subcommander/"
      ),
      "/pa/ai_subcommander/unit_maps/ai_unit_map_x1.json"
    );
  });
});

describe("clusterArmyIndex", () => {
  it("returns -1 for guardians, even if faction is also 4", () => {
    const ai = { mirrorMode: true, faction: 4 };
    assert.equal(refereeGameFiles.clusterArmyIndex(ai, isClusterTrue), -1);
  });

  it("returns 0 when the primary AI's own faction is Cluster", () => {
    const ai = { faction: 4 };
    assert.equal(refereeGameFiles.clusterArmyIndex(ai, gwoAI.isCluster), 0);
  });

  // A war saved before v5.44.0 stores faction as ["4"]. gwoAI.isCluster has
  // always understood both forms; clusterArmyIndex used to test === 4 itself
  // and so disagreed with it, sending the unit map to the non-Cluster path
  // while setAIPath sent the build orders to /pa/ai_cluster/.
  it("returns 0 for a pre-v5.44.0 war whose faction is the legacy array", () => {
    const ai = { faction: ["4"] };
    assert.equal(refereeGameFiles.clusterArmyIndex(ai, gwoAI.isCluster), 0);
  });

  it("returns index+1 for a specific FFA foe that is Cluster (not first/last)", () => {
    const ai = {
      faction: 1,
      foes: [{ faction: 1 }, { faction: 4 }, { faction: 1 }],
    };
    const isCluster = (foe) => foe.faction === 4;
    assert.equal(refereeGameFiles.clusterArmyIndex(ai, isCluster), 2);
  });

  it("returns -1 when nothing is Cluster", () => {
    const ai = { faction: 1, foes: [{ faction: 1 }, { faction: 1 }] };
    assert.equal(refereeGameFiles.clusterArmyIndex(ai, isClusterFalse), -1);
  });
});

describe("resolveAiUnitMapPaths", () => {
  const normalPaths = {
    unitMapPath: "/normal/",
    unitMapTitansPath: "/normal-x1/",
  };
  const clusterPaths = {
    unitMapPath: "/cluster/",
    unitMapTitansPath: "/cluster-x1/",
  };

  it("returns the cluster path pair when clusterArmyIndex matches currentCount", () => {
    const ai = { faction: 4 };
    const resolved = refereeGameFiles.resolveAiUnitMapPaths(
      ai,
      0,
      normalPaths,
      clusterPaths,
      gwoAI.isCluster
    );
    assert.deepEqual(resolved, clusterPaths);
  });

  // The invariant the deleted ai_path_unit_map_consistency.test.js was written
  // for, in the one form that can actually fail: unit-map routing and
  // gwoAI.isCluster - which is what setAIPath routes the build orders on -
  // must agree for every faction form a saved war can hold.
  for (const faction of [4, ["4"], 1]) {
    it(`agrees with gwoAI.isCluster for faction ${JSON.stringify(faction)}`, () => {
      const ai = { faction: faction, foes: [{ faction: 1 }] };
      const resolved = refereeGameFiles.resolveAiUnitMapPaths(
        ai,
        0,
        normalPaths,
        clusterPaths,
        gwoAI.isCluster
      );
      assert.equal(resolved === clusterPaths, gwoAI.isCluster(ai));
    });
  }

  it("returns the normal path pair when clusterArmyIndex does not match currentCount", () => {
    const ai = { faction: 1 };
    const resolved = refereeGameFiles.resolveAiUnitMapPaths(
      ai,
      0,
      normalPaths,
      clusterPaths,
      isClusterFalse
    );
    assert.deepEqual(resolved, normalPaths);
  });
});

describe("buildPlayerFiles", () => {
  it("Cluster player writes ai_unit_map under /pa/ai_cluster/", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "cluster",
    });
    installModel(fixture.game);

    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: fixture.inventory,
        titans: true,
      },
      gwoAI,
      gwoSpecs
    );

    assert.ok("/pa/ai_cluster/unit_maps/ai_unit_map.json.player" in files);
    assert.ok("/pa/ai_cluster/unit_maps/ai_unit_map_x1.json.player" in files);
  });

  it("Cluster player off Titans writes no x1 unit map", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "cluster",
    });
    installModel(fixture.game);

    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: fixture.inventory,
        titans: false,
      },
      gwoAI,
      gwoSpecs
    );

    assert.ok("/pa/ai_cluster/unit_maps/ai_unit_map.json.player" in files);
    for (const key of Object.keys(files)) {
      assert.ok(!key.includes("_x1"));
    }
  });

  it("non-Cluster player on Titans writes the x1 unit map under that same path", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "notCluster",
      aiMods: [{ op: "load" }],
    });
    installModel(fixture.game);

    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: fixture.inventory,
        titans: true,
      },
      gwoAI,
      gwoSpecs
    );

    const expectedPath = gwoAI.getAIPathDestination("subcommander");
    assert.ok(expectedPath + "unit_maps/ai_unit_map.json.player" in files);
    assert.ok(expectedPath + "unit_maps/ai_unit_map_x1.json.player" in files);
  });

  it("non-Cluster player writes ai_unit_map under the subcommander destination path", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "notCluster",
      aiMods: [{ op: "load" }],
    });
    installModel(fixture.game);

    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: fixture.inventory,
        titans: false,
      },
      gwoAI,
      gwoSpecs
    );

    const expectedPath = gwoAI.getAIPathDestination("subcommander");
    assert.equal(expectedPath, "/pa/ai_subcommander/");
    assert.ok(expectedPath + "unit_maps/ai_unit_map.json.player" in files);
    for (const key of Object.keys(files)) {
      assert.ok(!key.includes("_x1"));
    }
  });
});

describe("specFetch", () => {
  // Drives specFetch with a fake $.ajax that invokes success/error synchronously, so we
  // can pin its parse-on-success, parse-fallback, and reject-on-error behaviour without
  // a real network/game runtime.
  function withAjax(handler, run) {
    const stubs = createGlobalStubs();
    stubs.setGlobal("$", { ajax: handler });
    return Promise.resolve().then(run).finally(stubs.restoreGlobals);
  }

  it("parses a JSON response body and resolves the object", () => {
    return withAjax(
      (opts) => opts.success('{ "a": 1 }'),
      () =>
        refereeGameFiles.specFetch("/pa/units/x.json").then((data) => {
          assert.deepEqual(data, { a: 1 });
        })
    );
  });

  it("resolves the raw body when it is not valid JSON (mirrors base behaviour)", () => {
    return withAjax(
      (opts) => opts.success("not json"),
      () =>
        refereeGameFiles.specFetch("/pa/units/x.json").then((data) => {
          assert.equal(data, "not json");
        })
    );
  });

  it("prefixes the request url with coui:/ and rejects on an ajax error", () => {
    let requestedUrl;
    return withAjax(
      (opts) => {
        requestedUrl = opts.url;
        opts.error({}, "error", "boom");
      },
      () =>
        refereeGameFiles.specFetch("/pa/units/x.json").then(
          () => assert.fail("expected specFetch to reject"),
          (err) => {
            assert.equal(err, "boom");
            // "coui:/" + a leading-slash spec path yields a coui:// url.
            assert.equal(requestedUrl, "coui://pa/units/x.json");
          }
        )
    );
  });
});

describe("races", () => {
  const races = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"
  );
  const gwoUnit = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
  );
  const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");
  const { afterEach, beforeEach } = require("node:test");

  beforeEach(() => races.register(FIXTURE_RACE));
  afterEach(() => races.reset());

  it("mergeUnitMaps lays each race map over the brain's, race keys winning, without touching either", () => {
    const base = {
      unit_map: { Commander: { a: 1 }, Tank: { b: 1 } },
      other: true,
    };
    const race = { unit_map: { RaceTank: { c: 1 }, Tank: { b: 2 } } };

    assert.deepEqual(refereeGameFiles.mergeUnitMaps(base, [race, undefined]), {
      unit_map: { Commander: { a: 1 }, Tank: { b: 2 }, RaceTank: { c: 1 } },
      other: true,
    });
    assert.deepEqual(base.unit_map.Tank, { b: 1 });
    assert.deepEqual(refereeGameFiles.mergeUnitMaps(undefined, []), {
      unit_map: {},
    });
  });

  it("buildPlayerFiles puts a race player's map at the race tree and translates the mods", () => {
    const fixture = buildGame({ aiInUse: "Titans", playerRace: "fixture" });
    installModel(fixture.game);
    const recorded = [];
    const specs = {
      mod: (files, mods, tag) => recorded.push({ files, mods, tag }),
    };
    const inventory = Object.assign(fixture.inventory, {
      mods: () => [
        { file: gwoUnit.ant, path: "max_health", op: "multiply", value: 2 },
        { file: gwoUnit.dox, path: "max_health", op: "multiply", value: 2 },
      ],
    });

    const files = refereeGameFiles.buildPlayerFiles(
      {
        playerAIUnitMap: { unit_map: {} },
        playerX1AIUnitMap: { unit_map: {} },
        playerSpecFiles: {},
        inventory: inventory,
        titans: true,
        race: "fixture",
        extraMods: [{ file: "x", path: "y", op: "replace", value: 1 }],
      },
      gwoAI,
      specs,
      races
    );

    assert.deepEqual(Object.keys(files), [
      "/pa/ai_race_fixture/unit_maps/ai_unit_map.json.player",
      "/pa/ai_race_fixture/unit_maps/ai_unit_map_x1.json.player",
    ]);
    assert.deepEqual(recorded[0].mods, [
      {
        file: "/pa/units/land/fx_tank/fx_tank.json",
        path: "max_health",
        op: "multiply",
        value: 2,
      },
      { file: "x", path: "y", op: "replace", value: 1 },
    ]);
    assert.equal(recorded[0].tag, ".player");
  });
});
