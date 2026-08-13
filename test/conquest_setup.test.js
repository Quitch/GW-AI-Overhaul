"use strict";

// Unit tests for gw_start/conquest_setup.js, the measured half of Galactic
// Conquest war generation.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const conquestSetup = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/conquest_setup.js"
);

function star(ai) {
  return { ai: () => ai };
}

describe("guardiansCandidates", () => {
  it("offers only unowned stars that are not the origin", () => {
    const stars = [star(null), star({ team: 0 }), star(null), star(null)];
    assert.deepEqual(conquestSetup.guardiansCandidates(stars, 0), [2, 3]);
  });

  it("returns nothing when every star is owned or the origin", () => {
    const stars = [star(null), star({ team: 0 })];
    assert.deepEqual(conquestSetup.guardiansCandidates(stars, 0), []);
  });
});

describe("buildGuardiansAi", () => {
  it("carries the field set the War sweep assigns", () => {
    const ai = conquestSetup.buildGuardiansAi(2.5, 3);
    assert.deepEqual(ai, {
      icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png",
      boss: true,
      mirrorMode: true,
      treasurePlanet: true,
      econ_rate: 2.5,
      bossCommanders: 3,
      name: "The Guardians",
      character: "!LOC:Unknown",
      color: [
        [255, 255, 255],
        [255, 192, 203],
      ],
      commander: "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json",
    });
  });

  it("builds a fresh object per call", () => {
    assert.notEqual(
      conquestSetup.buildGuardiansAi(1, 1),
      conquestSetup.buildGuardiansAi(1, 1)
    );
  });
});

describe("settings", () => {
  const params = {
    maxDist: 7,
    playerCount: 2,
    factions: [3, 0, 4],
    difficulty: {
      econBase: 1,
      econRatePerDist: 0.2,
      mandatoryMinions: 1,
      minionMod: 0.5,
      factionTechHandicap: 0.5,
      ffaChance: 10,
      alliedCommanderChance: 15,
      bossCommanders: 2,
    },
    personality: { microType: 2, personalityTags: ["Picked"] },
    gameModes: {
      landAnywhereChance: 5,
      suddenDeathChance: 6,
      bountyModeChance: 7,
      bountyModeValue: 0.5,
      eradicationModeChance: 8,
    },
  };

  it("snapshots every field the play scene needs", () => {
    const settings = conquestSetup.settings(params);
    assert.equal(settings.maxDist, 7);
    assert.equal(settings.playerCount, 2);
    assert.deepEqual(settings.factions, [3, 0, 4]);
    assert.deepEqual(settings.difficulty, params.difficulty);
    assert.deepEqual(settings.personality, params.personality);
    assert.deepEqual(settings.gameModes, params.gameModes);
  });

  it("starts the phase marker on the war-creation turn", () => {
    assert.equal(conquestSetup.settings(params).lastAiPhaseTurn, 1);
  });

  it("copies the inputs rather than sharing them", () => {
    const settings = conquestSetup.settings(params);
    settings.factions.push(99);
    settings.personality.microType = 0;
    assert.deepEqual(params.factions, [3, 0, 4]);
    assert.equal(params.personality.microType, 2);
  });

  it("is JSON-safe, so it survives the save round-trip", () => {
    const settings = conquestSetup.settings(params);
    assert.deepEqual(JSON.parse(JSON.stringify(settings)), settings);
  });
});
