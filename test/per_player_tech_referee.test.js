"use strict";

// The per-player tech referee's apply(), which gw_play/per_player_tech_install.js
// puts over stock's. Its I/O dependencies are stubbed; the validation
// (per_player_tech.js) and referee_coop.js are the real modules.

const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  loadCouiModule,
  registerModuleStub,
  REPO_ROOT,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { createFakeJQuery } = require("../scripts/lib/fake-jquery.js");

const MOD = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const HOST_COMMANDER =
  "/pa/units/commanders/imperial_invictus/imperial_invictus.json";
const VIEWER_COMMANDER = "/pa/units/commanders/quad_osiris/quad_osiris.json";
const SUB_COMMANDER = "/pa/units/commanders/raptor_nemicus/raptor_nemicus.json";

function makeInventory(data) {
  const tags = data.tags || {};
  return {
    race: data.race,
    units: () => data.units || [],
    removedUnits: () => [],
    mods: () => data.mods || [],
    aiMods: () => [],
    cards: () => [],
    minions: () => data.minions || [],
    getTag: (context, key) => tags[key],
  };
}

function FakeInventory() {
  // Filled by load(), as GWInventory is.
}
FakeInventory.prototype.load = function (data) {
  Object.assign(this, makeInventory(data));
};

// What each test can steer or read back.
const io = {};

function resetIo() {
  io.cells = () => Promise.resolve(undefined);
  io.unitSpecs = (specs, tag) => {
    const files = {};
    files["/pa/units/land/tank/tank.json" + tag] = {};
    return $.Deferred().resolve(files).promise();
  };
  io.pick = () => [
    [10, 20, 30],
    [40, 50, 60],
  ];
  io.retagMods = [];
  io.plans = [];
  io.modCalls = [];
}

registerModuleStub("shared/gw_common", {
  specs: {
    genAIUnitMap: (map, tag) => ({ map: map, tag: tag }),
  },
});
registerModuleStub("shared/gw_inventory", FakeInventory);
registerModuleStub(MOD + "/shared/units.js", {});
registerModuleStub(MOD + "/shared/ai.js", {
  aiInUse: () => "Titans",
  getAIPathSource: () => "/pa/ai_ally/",
  subcommanderEconRate: 1.5,
  penchantTags: () => [],
});
registerModuleStub(MOD + "/shared/referee_subcommander_tech.js", {
  hasSmartSubcommanders: () => false,
  applySubcommanderDuplicationTech: () => 1,
  applySubcommanderTacticsTech: () => undefined,
  applySubcommanderFabberTech: () => undefined,
});
registerModuleStub(MOD + "/shared/referee_ai_paths.js", {
  getViewerSubcommanderPath: (aiInUse, aiMods, smart, tag) =>
    "/pa/ai_subcommander" + tag + "/",
});
registerModuleStub(MOD + "/gw_play/specs.js", {
  mod: (files, mods, tag) => io.modCalls.push({ mods: mods, tag: tag }),
});
registerModuleStub(MOD + "/gw_play/spec_cache.js", {
  genUnitSpecs: (specs, tag) => io.unitSpecs(specs, tag),
});
registerModuleStub(MOD + "/gw_play/commander_colour.js", {
  pick: () => io.pick(),
});
registerModuleStub(MOD + "/gw_play/referee_game_file_paths.js", {
  describeError: (error) => String((error && error.message) || error),
  specPlan: (params) => {
    io.plans.push(params);
    return { specs: params.units, retagMods: io.retagMods };
  },
  armyUnitMaps: () => Promise.resolve({ classic: { c: 1 }, x1: { x: 1 } }),
  specFetch: () => undefined,
});
registerModuleStub(MOD + "/shared/races.js", {
  raceOf: (inventory) => inventory.race,
  isMla: (race) => race === "mla",
  modsFor: () => [{ file: "/pa/units/land/tank/tank.json", op: "replace" }],
});
registerModuleStub(MOD + "/gw_play/race_cells.js", {
  indexFor: () => io.cells(),
});
registerModuleStub(MOD + "/shared/unit_cells.js", {});
registerModuleStub(MOD + "/shared/ai_personality.js", {
  resolve: (minion) => ({ name: minion.name }),
});

const referee = loadCouiModule(MOD + "/gw_play/per_player_tech_referee.js");

const { setGlobal, restoreGlobals } = createGlobalStubs();

function observable(initial) {
  let value = initial;
  return function (next) {
    if (arguments.length) {
      value = next;
    }
    return value;
  };
}

const HOST = { id: "h", name: "Host" };
const VIEWER = { id: "v1", name: "A" };

function viewerRecord() {
  return {
    commander: VIEWER_COMMANDER + ".player0",
    inventory: {
      race: "mla",
      units: ["/pa/units/land/tank/tank.json"],
      minions: [{ name: "Sub", commander: SUB_COMMANDER }],
    },
  };
}

function setup(overrides) {
  const opts = overrides || {};
  const records = {
    v1: "record" in opts ? opts.record : viewerRecord(),
  };
  const hostInventory = makeInventory({
    tags: {
      playerColor: [
        [1, 1, 1],
        [2, 2, 2],
      ],
      playerFaction: 0,
      commander: HOST_COMMANDER,
    },
    minions: [{ name: "Host Sub" }],
  });
  const game = {
    inventory: () => hostInventory,
    findCoopPlayerInventoryData: (client) => records[client.id],
  };
  const ref = {
    config: observable({
      armies: [
        { slots: [{ name: "Host" }] },
        { slots: [{ name: "A" }] },
        { slots: [{ ai: true, name: "Enemy" }] },
      ],
      player: { commander: HOST_COMMANDER + ".player" },
    }),
    files: observable({ "/pa/host.json": {} }),
    game: () => game,
  };
  if (opts.hireClientKeys) {
    ref.hireClientKeys = opts.hireClientKeys;
  }
  const options = Object.assign(
    {
      active: true,
      perPlayerTechCards: true,
      sharedControl: false,
      connectedClients: [HOST, VIEWER],
    },
    opts.options
  );
  return { ref: ref, options: options };
}

describe("the per-player tech referee's apply", () => {
  let errors;
  let warnings;

  beforeEach(() => {
    setGlobal("$", createFakeJQuery());
    setGlobal("model", { gwoSpecs: ["/pa/units/extra/extra.json"] });
    resetIo();
    errors = mock.method(console, "error", () => undefined);
    warnings = mock.method(console, "warn", () => undefined);
  });

  afterEach(() => {
    mock.restoreAll();
    restoreGlobals();
  });

  it("tags each army and adds the viewer's own specs and Sub Commander", () => {
    const { ref, options } = setup();

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, true);
      const config = ref.config();
      assert.equal(config.per_player_tech_ready, true);
      assert.deepEqual(config.per_player_tech_tags, [".player", ".player0"]);
      assert.equal(config.armies[0].spec_tag, ".player");
      assert.equal(config.armies[0].commander, HOST_COMMANDER + ".player");
      assert.equal(config.armies[1].spec_tag, ".player0");
      assert.equal(config.armies[1].commander, VIEWER_COMMANDER + ".player0");
      assert.equal(
        config.armies[1].player_config.commander,
        VIEWER_COMMANDER + ".player0"
      );

      const sub = config.armies[3];
      assert.equal(config.armies.length, 4);
      assert.equal(sub.spec_tag, ".player0");
      assert.equal(sub.slots[0].commander, SUB_COMMANDER + ".player0");
      assert.equal(sub.econ_rate, 1.5);
      assert.equal(sub.personality.ai_path, "/pa/ai_subcommander.player0/");

      const files = ref.files();
      assert.ok(files["/pa/host.json"], "the host's files are kept");
      assert.ok(files["/pa/units/land/tank/tank.json.player0"]);
      assert.deepEqual(
        files["/pa/ai_subcommander.player0/unit_maps/ai_unit_map.json.player0"],
        { map: { c: 1 }, tag: ".player0" }
      );
      assert.equal(config.files, files);
      assert.equal(errors.mock.callCount(), 0);
    });
  });

  it("builds the viewer's specs with the modders' extra specs", () => {
    const { ref, options } = setup();

    return referee.apply(ref, options).then(() => {
      assert.equal(io.plans.length, 1);
      assert.deepEqual(io.plans[0].extra, ["/pa/units/extra/extra.json"]);
      assert.equal(io.plans[0].isMla, true);
      assert.deepEqual(io.plans[0].commanders, [undefined, SUB_COMMANDER]);
    });
  });

  it("runs the retag mods in a pass of their own", () => {
    io.retagMods = [{ file: "/pa/units/commanders/x.json", op: "tag" }];
    const { ref, options } = setup();

    return referee.apply(ref, options).then(() => {
      assert.equal(io.modCalls.length, 2);
      assert.equal(io.modCalls[1].mods, io.retagMods);
      assert.equal(io.modCalls[1].tag, ".player0");
    });
  });

  it("makes one mod pass without retag mods", () => {
    const { ref, options } = setup();

    return referee.apply(ref, options).then(() => {
      assert.equal(io.modCalls.length, 1);
    });
  });

  it("resolves true without stamping the config outside per-player tech", () => {
    const { ref, options } = setup({ options: { perPlayerTechCards: false } });

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, true);
      assert.equal(ref.config().per_player_tech_ready, undefined);
      assert.equal(warnings.mock.callCount(), 1);
    });
  });

  it("stamps the config false on an invalid launch", () => {
    const { ref, options } = setup({ options: { sharedControl: true } });

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, false);
      assert.equal(ref.config().per_player_tech_ready, false);
    });
  });

  it("fails a viewer with no inventory record", () => {
    const { ref, options } = setup({ record: undefined });

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, false);
      assert.equal(ref.config().per_player_tech_ready, false);
      assert.match(errors.mock.calls[0].arguments[0], /Missing co-op player/);
    });
  });

  it("fails a viewer whose record has no commander", () => {
    const record = viewerRecord();
    delete record.commander;
    const { ref, options } = setup({ record: record });

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, false);
      assert.match(errors.mock.calls[0].arguments[0], /Invalid co-op player/);
    });
  });

  it("fails a launch whose viewers differ from the hire's", () => {
    const { ref, options } = setup({ hireClientKeys: ["v2::B"] });

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, false);
      assert.equal(ref.config().per_player_tech_ready, false);
      assert.match(errors.mock.calls[0].arguments[0], /differ from the/);
      assert.equal(io.plans.length, 0, "no viewer specs are built");
    });
  });

  it("launches when the viewers match the hire's", () => {
    const { ref, options } = setup({ hireClientKeys: ["v1::A"] });

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, true);
    });
  });

  it("continues without cells that fail to build", () => {
    io.cells = () => Promise.reject(new Error("no cells"));
    const { ref, options } = setup();

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, true);
      assert.equal(io.plans[0].cells, undefined);
      assert.match(errors.mock.calls[0].arguments[0], /cells not built/);
    });
  });

  it("resolves false, not rejects, when a viewer's specs fail", () => {
    io.unitSpecs = () =>
      $.Deferred().reject(new Error("read failed")).promise();
    const { ref, options } = setup();

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, false);
      assert.equal(ref.config().per_player_tech_ready, false);
      const logged = errors.mock.calls.map((call) => call.arguments[0]);
      assert.ok(logged.some((line) => /viewer specs failed/.test(line)));
      assert.ok(logged.some((line) => /viewer specs not generated/.test(line)));
    });
  });

  it("resolves false when building the armies throws", () => {
    io.pick = () => {
      throw new Error("no colour");
    };
    const { ref, options } = setup();

    return referee.apply(ref, options).then((ok) => {
      assert.equal(ok, false);
      assert.equal(ref.config().per_player_tech_ready, false);
      assert.match(errors.mock.calls[0].arguments[0], /no colour/);
    });
  });
});

// The scene script is not an AMD module, so its wiring is pinned by source.
describe("the per-player tech referee's install", () => {
  const script =
    "ui/mods/com.pa.quitch.gwaioverhaul/gw_play/per_player_tech_install.js";

  it("is a gw_play scene script", () => {
    const modinfo = JSON.parse(
      fs.readFileSync(path.join(REPO_ROOT, "modinfo.json"), "utf8")
    );
    assert.ok(modinfo.scenes.gw_play.includes("coui://" + script));
  });

  it("puts GWO's apply on stock's module, with an errback", () => {
    const source = fs.readFileSync(path.join(REPO_ROOT, script), "utf8");
    assert.match(source, /"pages\/gw_play\/gw_per_player_tech_referee"/);
    assert.match(source, /gw_play\/per_player_tech_referee\.js"/);
    assert.match(source, /stockReferee\.apply = gwoReferee\.apply;/);
    assert.match(source, /function \(err\) \{/);
  });
});
