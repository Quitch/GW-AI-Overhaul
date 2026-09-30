"use strict";

// gw_play/referee_ai.js's race trees: the stock factory and fabber lists lose
// MLA's orders to the race's builders, the job's AI mods are aimed at the
// race's keys, and every other file is copied as it is. See races.md, "Race
// trees".

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { buildGame, useModel } = require("../scripts/lib/ai-path-fixtures.js");
const {
  FIXTURE_RACE,
  fixtureRaceKeys,
} = require("../scripts/lib/race-fixture.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  resolved,
} = require("../scripts/lib/fake-jquery.js");

const { writeRaceTree, raceTreeJobs } = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);
const { createTreeCache } = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_ai.js"
);
const races = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"
);
const gwoUnit = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js"
);

const installModel = useModel();

afterEach(() => races.reset());

const STOCK = "/pa/ai/fabber_builds/fabber_land_builds.json";
const OWN = "/pa/ai/fabber_builds/fixture/fabber_land.json";
const PLATOONS = "/pa/ai/platoon_builds/platoon_land_builds.json";

function treeOf(files) {
  return {
    list: () => Promise.resolve(Object.keys(files)),
    getJSON: (path) => Promise.resolve(files[path]),
  };
}

function jobFor(keys, aiMods, remade) {
  return {
    source: "/pa/ai/",
    destination: "/pa/ai_race_fixture/",
    keep: (path) => !path.startsWith("/pa/ai_tech/"),
    raceOwned: (path) => path === OWN,
    stockBuild: (path) => path === STOCK,
    aiMods: aiMods || [],
    remade: remade || {},
    keys: () => Promise.resolve(keys),
  };
}

describe("writeRaceTree", () => {
  const files = {
    [STOCK]: {
      build_list: [
        { builders: ["BasicVehicleFactory", "OrbitalFabber"], to_build: "X" },
        { builders: ["BasicVehicleFactory"], to_build: "Y" },
      ],
    },
    [OWN]: {
      build_list: [{ builders: ["BasicVehicleFactory"], to_build: "Z" }],
    },
    [PLATOONS]: { build_list: [{ to_build: "Land_Raid_Small" }] },
  };

  it("strips the stock lists by the race's re-pointed keys and copies the rest as it is", async () => {
    const out = {};

    await writeRaceTree(
      jobFor({ repointed: { BasicVehicleFactory: true } }),
      treeOf(files),
      out
    );

    assert.deepEqual(
      out["/pa/ai_race_fixture/fabber_builds/fabber_land_builds.json"],
      { build_list: [{ builders: ["OrbitalFabber"], to_build: "X" }] }
    );
    assert.equal(
      out["/pa/ai_race_fixture/fabber_builds/fixture/fabber_land.json"],
      files[OWN]
    );
    assert.equal(
      out["/pa/ai_race_fixture/platoon_builds/platoon_land_builds.json"],
      files[PLATOONS]
    );
  });

  it("copies the stock lists whole without the race's cells", async () => {
    const out = {};

    await writeRaceTree(jobFor(null), treeOf(files), out);

    assert.equal(
      out["/pa/ai_race_fixture/fabber_builds/fabber_land_builds.json"],
      files[STOCK]
    );
  });

  // jQuery 2.1.4 does not turn a throw in a .then callback into a rejection:
  // it escapes through the resolve() that ran the callback, and the chain
  // stays pending. A file read through $.getJSON is processed after the read,
  // so a stock list with a null entry once left the launch waiting.
  it("rejects, rather than hangs, when a file fails after it is read", async () => {
    const stubs = createGlobalStubs();
    const $ = installFakeJQuery(stubs, { sync: true });
    const reads = [];
    $.getJSON = () => {
      const read = $.Deferred();
      reads.push(read);
      return read.promise();
    };
    stubs.setGlobal("api", {
      file: { list: () => Promise.resolve([STOCK]) },
    });
    const warn = mock.method(console, "warn", () => {});
    try {
      const written = writeRaceTree(
        jobFor({ repointed: { BasicVehicleFactory: true } }),
        createTreeCache(),
        {}
      ).then(
        () => "resolved",
        () => "rejected"
      );
      for (let tick = 0; tick < 50 && !reads.length; tick += 1) {
        await Promise.resolve();
      }
      assert.equal(reads.length, 1, "the stock list was read");
      // The engine logs a throw from a deferred callback and carries on.
      try {
        reads[0].resolve({ build_list: [null] });
      } catch {
        // Logged by the engine, as the comment above says.
      }

      const outcome = await Promise.race([
        written,
        new Promise((resolve) => setTimeout(resolve, 100, "hung")),
      ]);

      assert.equal(outcome, "rejected");
    } finally {
      warn.mock.restore();
      stubs.restoreGlobals();
    }
  });
});

describe("writeRaceTree, AI mods", () => {
  const LOAD = "/pa/ai_tech/fabber_builds/card.json";
  const FACTORY_LIST = "/pa/ai/factory_builds/factory_builds.json";
  const item = (toBuild, builders, priority) => ({
    to_build: toBuild,
    builders,
    priority,
  });
  const priority = (type, toBuild, value, extra) =>
    Object.assign(
      { type, op: "replace", toBuild, idToMod: "priority", value },
      extra
    );
  const files = () => ({
    [STOCK]: {
      build_list: [
        item("Tank", ["BasicVehicleFactory"], 1),
        item("Dox", ["Commander"], 1),
      ],
    },
    [OWN]: { build_list: [item("FixtureTank", ["FixtureFactory"], 1)] },
    [FACTORY_LIST]: {
      build_list: [item("FixtureTank", ["FixtureFactory"], 1)],
    },
    [LOAD]: {
      build_list: [
        item("BasicVehicleFactory", ["Commander"], 1),
        item("Tank", ["Commander"], 1),
      ],
    },
  });

  it("aims the job's mods at the race's keys on its own and stripped stock lists, by type", async () => {
    const out = {};

    await writeRaceTree(
      jobFor(fixtureRaceKeys(), [
        priority("fabber", "Tank", 9),
        priority("factory", "Dox", 7),
      ]),
      treeOf(files()),
      out
    );

    assert.deepEqual(
      out["/pa/ai_race_fixture/fabber_builds/fabber_land_builds.json"],
      { build_list: [item("Dox", ["Commander"], 1)] }
    );
    assert.deepEqual(
      out["/pa/ai_race_fixture/fabber_builds/fixture/fabber_land.json"],
      { build_list: [item("FixtureTank", ["FixtureFactory"], 9)] }
    );
    assert.deepEqual(
      out["/pa/ai_race_fixture/factory_builds/factory_builds.json"],
      { build_list: [item("FixtureTank", ["FixtureFactory"], 1)] }
    );
  });

  it("writes a load's file aimed at the destination, where only mods not tree-only land", async () => {
    const out = {};

    await writeRaceTree(
      jobFor(fixtureRaceKeys(), [
        { type: "fabber", op: "load", value: "card.json" },
        priority("fabber", "BasicVehicleFactory", 5),
        priority("fabber", "AnyBasicFactory", 6, { treeOnly: true }),
      ]),
      treeOf(files()),
      out
    );

    assert.deepEqual(out["/pa/ai_race_fixture/fabber_builds/card.json"], {
      build_list: [
        item("FixtureFactory", ["FixtureCommander"], 5),
        item("AnyFixtureFactory", ["FixtureCommander"], 5),
      ],
    });
    assert.equal(out[LOAD], undefined);
  });

  it("writes a platoon load's file as it is", async () => {
    const out = {};
    const platoons = {
      build_list: [{ name: "raid", to_build: "Land_Raid", priority: 1 }],
    };

    await writeRaceTree(
      jobFor(fixtureRaceKeys(), [
        { type: "platoon", op: "load", value: "card.json" },
      ]),
      treeOf(
        Object.assign(files(), {
          "/pa/ai_tech/platoon_builds/card.json": platoons,
        })
      ),
      out
    );

    assert.deepEqual(
      out["/pa/ai_race_fixture/platoon_builds/card.json"],
      platoons
    );
  });

  it("aims nothing at a unit the job's cards remake", async () => {
    const out = {};

    await writeRaceTree(
      jobFor(
        fixtureRaceKeys(),
        [
          { type: "fabber", op: "load", value: "card.json" },
          priority("fabber", "Tank", 9),
        ],
        { [gwoUnit.ant]: true }
      ),
      treeOf(files()),
      out
    );

    assert.deepEqual(
      out["/pa/ai_race_fixture/fabber_builds/fixture/fabber_land.json"],
      files()[OWN]
    );
    assert.deepEqual(out["/pa/ai_race_fixture/fabber_builds/card.json"], {
      build_list: [
        item("FixtureFactory", ["FixtureCommander"], 1),
        item("AnyFixtureFactory", ["FixtureCommander"], 1),
      ],
    });
  });

  it("takes no AI mods and no load without the race's cells", async () => {
    const out = {};

    await writeRaceTree(
      jobFor(null, [
        { type: "fabber", op: "load", value: "card.json" },
        priority("fabber", "Tank", 9),
      ]),
      treeOf(files()),
      out
    );

    assert.deepEqual(
      out["/pa/ai_race_fixture/fabber_builds/fixture/fabber_land.json"],
      files()[OWN]
    );
    assert.deepEqual(
      Object.keys(out).filter((path) => path.endsWith("card.json")),
      []
    );
  });

  it("skips, and logs, a load whose file is not read or has no directory", async () => {
    const out = {};
    const tree = treeOf(files());
    const getJSON = tree.getJSON;
    tree.getJSON = (path) =>
      path === LOAD ? Promise.reject(new Error("gone")) : getJSON(path);
    const errors = mock.method(console, "error", () => {});
    try {
      await writeRaceTree(
        jobFor(fixtureRaceKeys(), [
          { type: "fabber", op: "load", value: "card.json" },
          { type: "bogus", op: "load", value: "card.json" },
        ]),
        tree,
        out
      );

      assert.equal(
        out["/pa/ai_race_fixture/fabber_builds/card.json"],
        undefined
      );
      assert.equal(errors.mock.callCount(), 2);
      assert.match(errors.mock.calls[0].arguments[0], /Invalid AI file type/);
      assert.match(
        errors.mock.calls[1].arguments[0],
        /AI file of a load mod not read, skipped: \/pa\/ai_tech\/fabber_builds\/card\.json/
      );
    } finally {
      errors.mock.restore();
    }
  });
});

describe("raceTreeJobs", () => {
  it("gives each race tree its stock-list filter and a keys lookup, null without the race's cells", async () => {
    races.register(FIXTURE_RACE);
    const fixture = buildGame({ aiInUse: "Titans", enemyRace: "fixture" });
    installModel(fixture.game, []);

    const jobs = raceTreeJobs(fixture.game, [], []);
    const job = jobs.find(
      (entry) => entry.destination === "/pa/ai_race_fixture/"
    );

    assert.ok(job);
    assert.equal(job.stockBuild(STOCK), true);
    assert.equal(job.stockBuild(OWN), false);
    assert.equal(await job.keys(), null);
  });
  it("reads each job's layers once, for all three of its filters", () => {
    races.register(FIXTURE_RACE);
    const fixture = buildGame({ aiInUse: "Titans", enemyRace: "fixture" });
    installModel(fixture.game, []);
    const layersFor = mock.method(races, "layersFor");
    try {
      const jobs = raceTreeJobs(fixture.game, [], []);

      assert.equal(jobs.length, 1);
      assert.equal(layersFor.mock.callCount(), 1);
    } finally {
      layersFor.mock.restore();
    }
  });
  it("looks the race's keys up from its maps once the race has cells", async () => {
    races.register(FIXTURE_RACE);
    races.setCells("fixture", { vanilla: { cellOf: {} }, race: {} });
    const fixture = buildGame({ aiInUse: "Titans", playerRace: "fixture" });
    installModel(fixture.game, []);
    const job = raceTreeJobs(fixture.game, [], []).find(
      (entry) => entry.destination === "/pa/ai_race_fixture/"
    );

    const stubs = createGlobalStubs();
    const gets = [];
    const $ = installFakeJQuery(stubs);
    $.get = (url) => {
      gets.push(url);
      return resolved(JSON.stringify({ unit_map: {} }));
    };
    stubs.setGlobal("parse", JSON.parse);
    try {
      assert.deepEqual((await job.keys()).repointed, {});
      assert.ok(gets.includes("spec://pa/ai/unit_maps/ai_unit_map.json"));
    } finally {
      stubs.restoreGlobals();
    }
  });
});
