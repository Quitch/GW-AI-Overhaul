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

    assert.equal(result.blocked.length, 1);
    assert.equal(result.blocked[0].reason, "gwServerMods");
    assert.equal(result.blocked[0].name, "!LOC:Fixture");
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
