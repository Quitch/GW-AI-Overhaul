"use strict";

// gw_play/referee_ai.js's race trees: the stock factory and fabber lists lose
// MLA's orders to the race's builders, and every other file is copied as it
// is. See races.md, "Race trees".

const { describe, it, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { buildGame, useModel } = require("../scripts/lib/ai-path-fixtures.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");
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

function jobFor(repointed) {
  return {
    source: "/pa/ai/",
    destination: "/pa/ai_race_fixture/",
    keep: () => true,
    raceOwned: (path) => path === OWN,
    stockBuild: (path) => path === STOCK,
    repointed: () => Promise.resolve(repointed),
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
      jobFor({ BasicVehicleFactory: true }),
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
        jobFor({ BasicVehicleFactory: true }),
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

describe("raceTreeJobs", () => {
  it("gives each race tree its stock-list filter and a re-pointed key lookup, null without the race's cells", async () => {
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
    assert.equal(await job.repointed(), null);
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
  it("looks the race's re-pointed keys up from its maps once the race has cells", async () => {
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
      assert.deepEqual(await job.repointed(), {});
      assert.ok(gets.includes("spec://pa/ai/unit_maps/ai_unit_map.json"));
    } finally {
      stubs.restoreGlobals();
    }
  });
});
