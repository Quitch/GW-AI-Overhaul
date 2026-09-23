"use strict";

// Tests for gw_start/war_record.js.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const gwoVersion = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/version.js"
);
const warRecord = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/war_record.js"
);

function settings() {
  const values = {
    factionScaling: true,
    systemScaling: true,
    simpleSystems: false,
    largePlanets: false,
    easierStart: false,
    techCardDeck: "Expanded",
    staticTech: false,
    uniqueRaces: true,
    perPlayerRace: true,
  };
  const result = {};
  Object.keys(values).forEach((key) => {
    result[key] = () => values[key];
  });
  return result;
}

function war(overrides) {
  const stars = [
    { system: () => ({}) },
    {
      system: () => ({
        gwoBiomeMods: [
          {
            identifier: "com.example.biomes",
            displayName: "Example Biomes",
            version: "1.0",
            gwsm: true,
          },
        ],
      }),
    },
  ];
  return Object.assign(
    {
      seed: "abc",
      tier: { difficultyName: "!LOC:Gold" },
      tierData: { econBase: 1 },
      galaxySize: "!LOC:Small",
      settings: settings(),
      devMode: false,
      brains: { aiByRace: {}, ai: "Queller", aiAlly: "Titans" },
      installedRaces: ["mla"],
      treasureStar: 3,
      playerCount: 2,
      playerRace: "mla",
      raceByFaction: { 0: "mla" },
      raceInfo: { mods: [], addonMods: [] },
      perPlayerTechCards: false,
      galaxy: { stars: () => stars },
    },
    overrides
  );
}

describe("build", () => {
  it("records the war's settings", () => {
    const record = warRecord.build(war());
    assert.equal(record.version, gwoVersion);
    assert.equal(record.seed, "abc");
    assert.equal(record.difficulty, "!LOC:Gold");
    assert.equal(record.treasureStar, 3);
    assert.equal(record.coopPlayerScalingCount, 2);
    // MLA takes the war-wide brains, so it has no row.
    assert.deepEqual(record.aiByRace, {});
    assert.deepEqual(record.races, {
      player: "mla",
      byFaction: { 0: "mla" },
      unique: true,
      mods: [],
      addons: [],
      perPlayerRace: false,
    });
  });

  it("records Custom's values and a dev-mode war", () => {
    const record = warRecord.build(
      war({
        tier: { difficultyName: "!LOC:Custom", customDifficulty: true },
        devMode: true,
        perPlayerTechCards: true,
      })
    );
    assert.deepEqual(record.customDifficulty, { econBase: 1 });
    assert.equal(record.cheatsUsed, true);
    assert.equal(record.races.perPlayerRace, true);
  });
});
