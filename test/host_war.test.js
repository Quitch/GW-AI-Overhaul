"use strict";

// gw_coop_per_player_loadout/host_war.js: what a joining viewer is told about
// the war it is joining. See coop.md.

const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  loadCouiModule,
  registerModuleStub,
  requireShippedModule,
} = require("../scripts/lib/amd-loader.js");
const { FIXTURE_RACE } = require("../scripts/lib/race-fixture.js");

const MOD_ROOT = "coui://ui/mods/com.pa.quitch.gwaioverhaul";
const races = loadCouiModule(MOD_ROOT + "/shared/races.js");
// Only load() reaches GW.manifest, and load() is the engine half. See testing.md.
registerModuleStub("shared/gw_common", { manifest: {} });
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

beforeEach(() => {
  races.reset();
  races.register(FIXTURE_RACE);
  races.register(SECOND_RACE);
});

afterEach(() => {
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
});

describe("readGame", () => {
  it("reads the faction, the race, the offer and the setting", () => {
    const info = hostWar.readGame(
      makeGame({
        faction: 2,
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
    assert.equal(info.race, "fixture");
    assert.deepEqual(
      info.races.map((race) => race.id),
      ["mla", "fixture"]
    );
    assert.equal(info.perPlayerRace, true);
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

  it("survives a game that did not hydrate", () => {
    const info = hostWar.readGame({});

    assert.equal(info.faction, undefined);
    assert.equal(info.perPlayerRace, false);
  });
});
