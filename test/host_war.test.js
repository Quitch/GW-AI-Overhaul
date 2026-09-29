"use strict";

// gw_coop_per_player_loadout/host_war.js: what a joining viewer is told about
// the war it is joining. See coop.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  MOD_ROOT,
  loadCouiModule,
  registerModuleStub,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
// Only load() reaches GW.manifest; its test sets loadGame.
const gwCommon = { manifest: {} };
registerModuleStub("shared/gw_common", gwCommon);
const hostWar = requireShippedModule(
  MOD_ROOT + "/gw_coop_per_player_loadout/host_war.js"
);

const SECOND_RACE = Object.assign({}, FIXTURE_RACE, {
  id: "Other",
  name: "!LOC:Other",
  serverMods: ["com.example.other-server"],
  unitTypeBit: "Custom9",
  commanderTypes: {
    unitType: "UNITTYPE_Custom9",
    buildable: "CmdBuild & Custom9",
  },
});

// A war as the loadout scene reads one: an inventory with global tags and an
// origin star carrying the gwaio settings.
function makeGame(options) {
  const opts = options || {};
  const tags = { playerFaction: opts.faction };
  if (opts.race) {
    tags.playerRace = opts.race;
  }
  if (opts.colour) {
    tags.playerColor = opts.colour;
  }

  return {
    inventory: () => ({
      getTag: (namespace, key) =>
        namespace === "global" ? tags[key] : undefined,
    }),
    galaxy: () => ({
      origin: () => 0,
      stars: () => [{ system: () => ({ gwaio: opts.gwaio }) }],
    }),
  };
}

const installed = (overrides) =>
  Object.assign(
    { races: races.all(), mods: [], known: true, gwsm: true },
    overrides
  );

const stubs = createGlobalStubs();

// GW Server Mods' capability API, shaped as that mod's own
// test/capability.test.js pins it:
// hostServerMods() returns { identifier, displayName, version } rows, and an
// empty array when the host published nothing.
const stubHostServerMods = (hostServerMods) => {
  stubs.setGlobal("window", { GwServerMods: { hostServerMods } });
};

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
  races.register(SECOND_RACE);
});

afterEach(() => {
  stubs.restoreGlobals();
  races.reset();
});

describe("offeredRaces", () => {
  it("offers the races the war recorded, and MLA", () => {
    assert.deepEqual(
      hostWar
        .offeredRaces({ mods: [{ identifier: "com.example.fixture-server" }] })
        .map((race) => race.id),
      ["mla", "fixture"]
    );
  });

  it("does not offer a race this client has but the war does not carry", () => {
    // The authority is the host's war, not the viewer's own mod list: a race
    // the host is not running has no units in the battle.
    assert.deepEqual(
      hostWar
        .offeredRaces({ mods: [{ identifier: "com.example.other-server" }] })
        .map((race) => race.id),
      ["mla", "other"]
    );
  });

  it("offers MLA alone for a war with no race mods recorded", () => {
    assert.deepEqual(
      hostWar.offeredRaces(undefined).map((race) => race.id),
      ["mla"]
    );
    assert.deepEqual(
      hostWar.offeredRaces({ mods: [] }).map((race) => race.id),
      ["mla"]
    );
  });

  it("withholds a recorded race whose server mod is no longer active", () => {
    const recorded = {
      mods: [
        { identifier: "com.example.fixture-server" },
        { identifier: "com.example.other-server" },
      ],
    };

    assert.deepEqual(
      hostWar
        .offeredRaces(
          recorded,
          installed({ races: [races.byId("mla"), races.byId("fixture")] })
        )
        .map((race) => race.id),
      ["mla", "fixture"]
    );
  });

  it("withholds nothing when the installed mods cannot be read", () => {
    const recorded = { mods: [{ identifier: "com.example.fixture-server" }] };

    assert.deepEqual(
      hostWar
        .offeredRaces(recorded, installed({ known: false, races: [] }))
        .map((race) => race.id),
      ["mla", "fixture"]
    );
  });

  it("offers MLA alone without GW Server Mods, whatever the war recorded", () => {
    const recorded = { mods: [{ identifier: "com.example.fixture-server" }] };

    assert.deepEqual(
      hostWar
        .offeredRaces(
          recorded,
          installed({ races: [races.byId("mla")], gwsm: false })
        )
        .map((race) => race.id),
      ["mla"]
    );
  });
});

describe("hostInstalledInfo", () => {
  it("reads the host's active mods from GW Server Mods' capability API", () => {
    stubHostServerMods(() => [
      {
        identifier: "com.example.fixture-server",
        displayName: "Fixture",
        version: "1.2.0",
      },
    ]);

    const info = hostWar.hostInstalledInfo();

    assert.equal(info.known, true);
    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla", "fixture"]
    );
  });

  it("answers cannot-tell without GW Server Mods or its API", () => {
    stubs.setGlobal("window", {});
    assert.deepEqual(hostWar.hostInstalledInfo(), { known: false });

    stubs.restoreGlobals();
    stubs.setGlobal("window", { GwServerMods: {} });
    assert.deepEqual(hostWar.hostInstalledInfo(), { known: false });
  });

  it("answers cannot-tell for the empty set a missing publish leaves", () => {
    stubHostServerMods(() => []);

    assert.deepEqual(hostWar.hostInstalledInfo(), { known: false });
  });

  it("answers cannot-tell when the API misbehaves", () => {
    stubHostServerMods(() => {
      throw new Error("denied");
    });
    assert.deepEqual(hostWar.hostInstalledInfo(), { known: false });

    stubs.restoreGlobals();
    stubHostServerMods(() => "nope");
    assert.deepEqual(hostWar.hostInstalledInfo(), { known: false });
  });
});

describe("readGame", () => {
  it("reads the faction, its colour, the race, the offer and the setting", () => {
    const info = hostWar.readGame(
      makeGame({
        faction: 2,
        colour: [
          [126, 226, 101],
          [192, 192, 192],
        ],
        race: "fixture",
        gwaio: {
          races: {
            mods: [{ identifier: "com.example.fixture-server" }],
            perPlayerRace: true,
          },
        },
      })
    );

    assert.equal(info.faction, 2);
    assert.deepEqual(info.colour, [
      [126, 226, 101],
      [192, 192, 192],
    ]);
    assert.equal(info.race, "fixture");
    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla", "fixture"]
    );
    assert.equal(info.perPlayerRace, true);
  });

  it("hands the installed info through to the offer", () => {
    const info = hostWar.readGame(
      makeGame({
        faction: 1,
        race: "fixture",
        gwaio: {
          races: {
            mods: [
              { identifier: "com.example.fixture-server" },
              { identifier: "com.example.other-server" },
            ],
            perPlayerRace: true,
          },
        },
      }),
      installed({ races: [races.byId("mla"), races.byId("fixture")] })
    );

    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla", "fixture"]
    );
  });

  it("reads a war saved before the setting existed as off", () => {
    const info = hostWar.readGame(
      makeGame({ faction: 0, race: "fixture", gwaio: { races: { mods: [] } } })
    );

    assert.equal(info.perPlayerRace, false);
  });

  it("reads a stock war, with no gwaio settings at all, as off with no races", () => {
    const info = hostWar.readGame(makeGame({ faction: 0 }));

    assert.equal(info.perPlayerRace, false);
    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla"]
    );
  });
});

// Stock's loadGame resolves with no game for an id it has not stored, and
// reading that threw inside the load's callback. jQuery lets such a throw
// escape, so the war was never answered, and the loadout scene's race picker
// and Join waited on it for good. load() caches its answer for the module,
// so this is its one test.
describe("load", () => {
  it("answers a war it cannot read as one with no races", async () => {
    const $ = installFakeJQuery(stubs, { sync: true });
    const read = $.Deferred();
    gwCommon.manifest.loadGame = () => read.promise();
    stubs.setGlobal("model", { activeGameId: () => "war-1" });
    stubs.setGlobal("window", {});
    const errors = [];
    stubs.setGlobal("console", {
      error: (text) => errors.push(text),
    });
    const loadable = loadCouiModule(
      MOD_ROOT + "/gw_coop_per_player_loadout/host_war.js"
    );

    const answered = new Promise((resolve) => {
      loadable.load().then(resolve);
    });
    // The engine logs a throw from a deferred callback and carries on.
    try {
      read.resolve();
    } catch {
      errors.push("escaped");
    }
    const outcome = await Promise.race([
      answered,
      new Promise((resolve) => setTimeout(resolve, 100, "hung")),
    ]);

    assert.notEqual(outcome, "hung");
    assert.equal(outcome.perPlayerRace, false);
    assert.deepEqual(
      outcome.races.map((race) => race.id),
      ["mla"]
    );
    assert.equal(errors.length, 1);
    assert.match(errors[0], /^Galactic War Overhaul \(GWO\): war not read: /);
  });
});
