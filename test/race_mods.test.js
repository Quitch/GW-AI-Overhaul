"use strict";

// shared/race_mods.js: the engine glue that answers which races are usable.
// The `known` flag is the part a resume check leans on - "cannot tell" must
// never read as "not installed". See races.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
const raceMods = loadCouiModule(MOD_ROOT + "/shared/race_mods.js");

const stubs = createGlobalStubs();

const FIXTURE_MOD = {
  identifier: "com.example.fixture-server",
  displayName: "Fixture Expansion",
  version: "1.2.0",
};

// GW Server Mods' manifest, reduced to what race_mods.js calls.
function fakeManifest(overrides) {
  const opts = overrides || {};
  return {
    load: () => Promise.resolve(true),
    listed: () => (opts.listed === undefined ? true : opts.listed),
    activeServerMods: () => opts.active || [],
  };
}

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
  installFakeJQuery(stubs);
  stubs.setGlobal("window", {});
});

afterEach(() => {
  stubs.restoreGlobals();
  races.reset();
});

describe("installedRaces", () => {
  it("reports the race, its mod's name and version, and a knowable answer", async () => {
    window.GwServerMods = { manifest: fakeManifest({ active: [FIXTURE_MOD] }) };

    const info = await raceMods.installedRaces();

    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla", "fixture"]
    );
    assert.deepEqual(info.mods, [
      {
        identifier: "com.example.fixture-server",
        displayName: "Fixture Expansion",
        version: "1.2.0",
      },
    ]);
    assert.equal(info.known, true);
    assert.equal(info.gwsm, true);
  });

  it("names a mod by its identifier when it ships no display name", async () => {
    window.GwServerMods = {
      manifest: fakeManifest({
        active: [{ identifier: "com.example.fixture-server", version: "1" }],
      }),
    };

    const info = await raceMods.installedRaces();

    assert.equal(info.mods[0].displayName, "com.example.fixture-server");
  });

  it("keeps only the mods a race claims", async () => {
    window.GwServerMods = {
      manifest: fakeManifest({
        active: [
          FIXTURE_MOD,
          { identifier: "com.example.other", version: "1" },
        ],
      }),
    };

    const info = await raceMods.installedRaces();

    assert.deepEqual(_.pluck(info.mods, "identifier"), [
      "com.example.fixture-server",
    ]);
  });

  it("says the answer is not knowable when nothing could be listed", async () => {
    window.GwServerMods = { manifest: fakeManifest({ listed: false }) };

    const info = await raceMods.installedRaces();

    assert.equal(info.known, false);
    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla"]
    );
  });

  it("treats GW Server Mods being absent as a knowable none", async () => {
    const info = await raceMods.installedRaces();

    assert.equal(info.known, true);
    assert.equal(info.gwsm, false);
    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla"]
    );
    assert.deepEqual(info.mods, []);
  });
});
