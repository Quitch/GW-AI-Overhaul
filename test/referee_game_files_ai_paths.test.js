"use strict";

// Unit tests for the game-files referee's ai_unit_map path logic. The tested helpers
// live in the extracted gw_play/referee_game_file_paths.js (a plain define() over
// lodash/$/Promise only); the referee file itself depends on the unshipped
// shared/gw_common and is coverage-excluded glue, so this loads the extracted module.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
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

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

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
    for (const aiInUse of ["Titans", "Queller", "Penchant"]) {
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
    assert.equal(refereeGameFiles.clusterArmyIndex(ai, isClusterFalse), 0);
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
      isClusterFalse
    );
    assert.deepEqual(resolved, clusterPaths);
  });

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
    restoreModel = installModel(fixture.game);

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

  it("non-Cluster player writes ai_unit_map under the subcommander destination path", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      subcommanderType: "notCluster",
      aiMods: [{ op: "load" }],
    });
    restoreModel = installModel(fixture.game);

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
    // titans=false: no _x1 variant should be present anywhere.
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
    const had = Object.prototype.hasOwnProperty.call(global, "$");
    const previous = global.$;
    global.$ = { ajax: handler };
    return Promise.resolve()
      .then(run)
      .finally(() => {
        if (had) {
          global.$ = previous;
        } else {
          delete global.$;
        }
      });
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
