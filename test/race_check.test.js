"use strict";

// shared/race_check.js: whether a saved war can still field its races. A
// missing race blocks; a version change is only said out loud; an unreadable
// mod list decides nothing. See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const raceCheck = loadCouiModule(MOD_ROOT + "/shared/race_check.js");

const FIXTURE_ID = "com.example.fixture-server";

const recorded = (overrides) =>
  Object.assign(
    {
      player: "fixture",
      byFaction: { 0: "fixture", 1: "mla" },
      unique: false,
      mods: [
        { identifier: FIXTURE_ID, displayName: "Fixture", version: "1.2.0" },
      ],
    },
    overrides
  );

const installed = (overrides) =>
  Object.assign(
    {
      races: races.all(),
      mods: [
        { identifier: FIXTURE_ID, displayName: "Fixture", version: "1.2.0" },
      ],
      known: true,
      gwsm: true,
    },
    overrides
  );

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
});

afterEach(() => {
  races.reset();
});

describe("warRaces", () => {
  it("gathers the player's race, each faction's, and every star AI's", () => {
    const found = raceCheck.warRaces(
      { player: "FIXTURE", byFaction: { 0: "mla", 1: "other" } },
      [{ race: "third" }, { race: "fixture" }, {}, null]
    );

    assert.deepEqual(found, ["fixture", "other", "third"]);
  });

  it("is empty for an all-MLA war", () => {
    assert.deepEqual(
      raceCheck.warRaces({ player: "mla", byFaction: { 0: "mla" } }, [
        { race: "mla" },
        { race: "" },
      ]),
      []
    );
  });

  it("survives a war with nothing recorded", () => {
    assert.deepEqual(raceCheck.warRaces(undefined, undefined), []);
  });

  it("keeps an id no race is registered for, rather than reading it as MLA", () => {
    assert.deepEqual(raceCheck.warRaces({ player: "ghost" }, []), ["ghost"]);
  });

  it("includes the race stamped on a co-op record's inventory", () => {
    const found = raceCheck.warRaces(
      { player: "mla" },
      [],
      [{ inventory: { tags: { global: { playerRace: "fixture" } } } }]
    );

    assert.deepEqual(found, ["fixture"]);
  });

  it("merges record races with the war's own", () => {
    const found = raceCheck.warRaces(
      { player: "fixture" },
      [{ race: "other" }],
      [{ inventory: { tags: { global: { playerRace: "FIXTURE" } } } }]
    );

    assert.deepEqual(found, ["fixture", "other"]);
  });

  it("tolerates records with no race to read", () => {
    assert.deepEqual(
      raceCheck.warRaces(
        { player: "mla" },
        [],
        [
          null,
          {},
          { inventory: {} },
          { inventory: { tags: {} } },
          { inventory: { tags: { global: {} } } },
          { inventory: { tags: { global: { playerRace: 7 } } } },
        ]
      ),
      []
    );
  });

  it("passes over records stamped MLA - the shape Separate races off leaves", () => {
    assert.deepEqual(
      raceCheck.warRaces(
        { player: "mla" },
        [],
        [
          { inventory: { tags: { global: { playerRace: "mla" } } } },
          { inventory: { tags: { global: { playerRace: "MLA " } } } },
        ]
      ),
      []
    );
  });

  it("keeps a record race no race is registered for, rather than reading it as MLA", () => {
    assert.deepEqual(
      raceCheck.warRaces(undefined, undefined, [
        { inventory: { tags: { global: { playerRace: "ghost" } } } },
      ]),
      ["ghost"]
    );
  });
});

describe("evaluate", () => {
  it("passes a war whose race is still installed", () => {
    const result = raceCheck.evaluate(recorded(), ["fixture"], installed());

    assert.deepEqual(result, { blocked: [], warnings: [] });
  });

  it("blocks a race whose server mod is no longer active", () => {
    const result = raceCheck.evaluate(
      recorded(),
      ["fixture"],
      installed({ races: [races.byId("mla")], mods: [] })
    );

    assert.deepEqual(result.warnings, []);
    assert.equal(result.blocked.length, 1);
    assert.equal(result.blocked[0].reason, "serverMod");
    assert.equal(result.blocked[0].race, "fixture");
    assert.equal(result.blocked[0].name, "!LOC:Fixture");
    assert.deepEqual(result.blocked[0].mods, [
      FIXTURE_ID,
      "com.example.fixture-server-dev",
    ]);
  });

  it("blames GW Server Mods when it is the piece that is gone", () => {
    const result = raceCheck.evaluate(
      recorded(),
      ["fixture"],
      installed({ races: [races.byId("mla")], mods: [], gwsm: false })
    );

    assert.deepEqual(result.blocked, [{ reason: "gwServerMods" }]);
  });

  it("says GW Server Mods once, however many races the war fields", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        id: "second",
        name: "!LOC:Second",
        serverMods: ["com.example.second-server"],
      })
    );

    const result = raceCheck.evaluate(
      recorded(),
      ["fixture", "second"],
      installed({ races: [races.byId("mla")], mods: [], gwsm: false })
    );

    assert.deepEqual(result.blocked, [{ reason: "gwServerMods" }]);
  });

  it("names each race when GW Server Mods is there but the mods are not", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        id: "second",
        name: "!LOC:Second",
        serverMods: ["com.example.second-server"],
      })
    );

    const result = raceCheck.evaluate(
      recorded(),
      ["fixture", "second"],
      installed({ races: [races.byId("mla")], mods: [] })
    );

    assert.deepEqual(_.pluck(result.blocked, "name"), [
      "!LOC:Fixture",
      "!LOC:Second",
    ]);
    assert.deepEqual(_.uniq(_.pluck(result.blocked, "reason")), ["serverMod"]);
  });

  it("blocks a race with no descriptor at all, whatever the mod list says", () => {
    const result = raceCheck.evaluate(recorded(), ["ghost"], installed());

    assert.equal(result.blocked.length, 1);
    assert.equal(result.blocked[0].reason, "descriptor");
    assert.equal(result.blocked[0].race, "ghost");
  });

  it("still blocks a missing descriptor when the mod list cannot be read", () => {
    const result = raceCheck.evaluate(
      recorded(),
      ["ghost"],
      installed({ known: false, races: [], mods: [] })
    );

    assert.equal(result.blocked.length, 1);
    assert.equal(result.blocked[0].reason, "descriptor");
  });

  it("decides nothing about server mods when the mod list cannot be read", () => {
    const result = raceCheck.evaluate(
      recorded({ mods: [{ identifier: FIXTURE_ID, version: "0.9.0" }] }),
      ["fixture"],
      installed({ known: false, races: [], mods: [] })
    );

    assert.deepEqual(result, { blocked: [], warnings: [] });
  });

  it("warns about a version change without blocking", () => {
    const result = raceCheck.evaluate(
      recorded(),
      ["fixture"],
      installed({
        mods: [
          { identifier: FIXTURE_ID, displayName: "Fixture", version: "1.3.0" },
        ],
      })
    );

    assert.deepEqual(result.blocked, []);
    assert.deepEqual(result.warnings, [
      {
        reason: "version",
        identifier: FIXTURE_ID,
        name: "Fixture",
        from: "1.2.0",
        to: "1.3.0",
      },
    ]);
  });

  it("ignores a recorded mod for a race the war never fields", () => {
    const result = raceCheck.evaluate(
      recorded({ player: "mla", byFaction: { 0: "mla" } }),
      [],
      installed({ races: [races.byId("mla")], mods: [] })
    );

    assert.deepEqual(result, { blocked: [], warnings: [] });
  });

  it("says nothing when the race answers to another of its identifiers", () => {
    const result = raceCheck.evaluate(
      recorded(),
      ["fixture"],
      installed({
        mods: [
          {
            identifier: "com.example.fixture-server-dev",
            displayName: "Fixture (dev)",
            version: "1.9.0",
          },
        ],
      })
    );

    assert.deepEqual(result, { blocked: [], warnings: [] });
  });

  it("reports each missing race once, however many times the war names it", () => {
    const result = raceCheck.evaluate(
      recorded(),
      ["fixture", "FIXTURE", "fixture"],
      installed({ races: [races.byId("mla")], mods: [] })
    );

    assert.equal(result.blocked.length, 1);
  });

  it("has nothing to say about an all-MLA war", () => {
    assert.deepEqual(raceCheck.evaluate(undefined, ["mla"], installed()), {
      blocked: [],
      warnings: [],
    });
  });
});

describe("activeRaces", () => {
  const ids = (list) => list.map((race) => race.id);

  it("keeps only the races whose server mod is active, and MLA", () => {
    races.register(
      Object.assign({}, FIXTURE_RACE, {
        id: "second",
        name: "!LOC:Second",
        serverMods: ["com.example.second-server"],
      })
    );

    const kept = raceCheck.activeRaces(
      races.all(),
      installed({ races: [races.byId("mla"), races.byId("fixture")] })
    );

    assert.deepEqual(ids(kept), ["mla", "fixture"]);
  });

  it("removes nothing when the mod list cannot be read", () => {
    const kept = raceCheck.activeRaces(
      races.all(),
      installed({ known: false, races: [], mods: [] })
    );

    assert.deepEqual(ids(kept), ids(races.all()));
  });

  it("removes nothing with no installed info at all", () => {
    assert.deepEqual(ids(raceCheck.activeRaces(races.all())), [
      "mla",
      "fixture",
    ]);
    assert.deepEqual(raceCheck.activeRaces(undefined, installed()), []);
  });

  it("keeps MLA even when the active list is empty", () => {
    const kept = raceCheck.activeRaces(
      races.all(),
      installed({ races: [], mods: [], gwsm: false })
    );

    assert.deepEqual(ids(kept), ["mla"]);
  });

  it("tolerates a malformed active list", () => {
    const kept = raceCheck.activeRaces(
      races.all(),
      installed({ races: [null, { id: "fixture" }] })
    );

    assert.deepEqual(ids(kept), ["mla", "fixture"]);
  });
});
