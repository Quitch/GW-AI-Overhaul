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

describe("installedRaces with add-ons", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");
  const ADDON_MOD = {
    identifier: "com.example.fixture-addon",
    displayName: "Fixture Add-on",
    version: "1.0.0",
  };

  it("reports the add-ons whose server mod is active and their mods, apart from the races", async () => {
    races.registerAddon(FIXTURE_ADDON);
    window.GwServerMods = {
      manifest: fakeManifest({
        active: [
          FIXTURE_MOD,
          ADDON_MOD,
          { identifier: "com.example.other", version: "1" },
        ],
      }),
    };

    const info = await raceMods.installedRaces();

    assert.deepEqual(
      info.addons.map((addon) => addon.id),
      ["fixture_addon"]
    );
    assert.deepEqual(info.addonMods, [ADDON_MOD]);
    assert.deepEqual(_.pluck(info.mods, "identifier"), [
      "com.example.fixture-server",
    ]);
  });

  it("reports no add-ons when none is active, and none without GW Server Mods", async () => {
    races.registerAddon(FIXTURE_ADDON);
    window.GwServerMods = { manifest: fakeManifest({ active: [FIXTURE_MOD] }) };

    const info = await raceMods.installedRaces();
    assert.deepEqual(info.addons, []);
    assert.deepEqual(info.addonMods, []);

    delete window.GwServerMods;
    const none = await raceMods.installedRaces();
    assert.deepEqual(none.addons, []);
    assert.deepEqual(none.addonMods, []);
  });
});

describe("registerAll", () => {
  const { FIXTURE_ADDON } = require("../scripts/lib/race-fixture.js");

  it("adopts the descriptors a mod pushed onto model.gwoRaces and model.gwoAddons", () => {
    stubs.setGlobal("model", {
      gwoRaces: [Object.assign({}, FIXTURE_RACE, { id: "pushed" })],
      gwoAddons: [FIXTURE_ADDON],
    });

    const registered = raceMods.registerAll();

    assert.deepEqual(_.pluck(registered, "id"), ["pushed"]);
    assert.ok(races.byId("pushed"));
    assert.ok(races.addonById("fixture_addon"));
    assert.deepEqual(model.gwoAddons, [FIXTURE_ADDON]);
  });

  it("seeds both lists when a mod pushed nothing, and survives a bad add-on", () => {
    stubs.setGlobal("model", { gwoAddons: [{}] });
    const previous = console.error;
    const errors = [];
    console.error = (message) => errors.push(message);

    try {
      raceMods.registerAll();
    } finally {
      console.error = previous;
    }

    assert.deepEqual(model.gwoRaces, []);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /add-on not registered/);
  });
});
