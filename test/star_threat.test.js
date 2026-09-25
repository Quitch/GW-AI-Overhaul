"use strict";

// shared/star_threat.js: a star's threat, as the intelligence panel shows it
// and a co-op AI player weighs it. See coop.md, "AI pings".

const { describe, it, beforeEach, mock } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { buildGame, useModel } = require("../scripts/lib/ai-path-fixtures.js");

const starThreat = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_threat.js"
);

const installModel = useModel();
const BUFF = starThreat.BUFF_TYPES;

// A Custom tier whose economy floor, 0.5, sits under every rate below bar one.
const TIER = { econBase: 0.25, econRatePerDist: 0.25 };

describe("measure", () => {
  beforeEach(() => {
    installModel(buildGame({ customDifficulty: TIER }).game);
  });

  it("adds up the economy of the star's AI and its minions", () => {
    assert.equal(
      starThreat.measure({ econ_rate: 2, minions: [{ econ_rate: 1 }] }),
      3
    );
  });

  it("counts a shared army's commanders", () => {
    // Three commanders field (3 + 1) / 2 times the rate.
    assert.equal(starThreat.measure({ econ_rate: 1, commanderCount: 3 }), 2);
  });

  it("adds a contesting faction, and more for each commander past its first", () => {
    // The foe's own 1.5 * (3 + 1) / 2 = 3, plus 1.5 * 0.4 * 2 = 1.2.
    assert.equal(
      starThreat.measure({
        econ_rate: 1,
        foes: [{ econ_rate: 1.5, commanderCount: 3 }],
      }),
      5.2
    );
  });

  it("shares the threat with the star's ally", () => {
    assert.equal(starThreat.measure({ econ_rate: 2, ally: {} }), 1);
  });

  it("scales by each of the AI's buffs", () => {
    const threat = (buffs) =>
      starThreat.measure({ econ_rate: 10, typeOfBuffs: buffs });

    assert.equal(threat([BUFF.cost]), 13);
    assert.equal(threat([BUFF.build]), 13);
    assert.equal(threat([BUFF.damage]), 12);
    assert.equal(threat([BUFF.health]), 12);
    assert.equal(threat([BUFF.cooldown]), 12);
    assert.equal(threat([BUFF.speed]), 11);
    assert.equal(threat([BUFF.combat]), 15);
    assert.equal(threat([BUFF.commanders]), 10);
    assert.equal(threat([BUFF.cost, BUFF.combat]), 19.5);
  });

  it("triples the Guardians", () => {
    assert.equal(starThreat.measure({ econ_rate: 1, mirrorMode: true }), 3);
  });

  it("rounds to two decimal places, as the panel shows it", () => {
    // 1.2 * 1.2 * 1.1 = 1.584.
    assert.equal(
      starThreat.measure({
        econ_rate: 1,
        typeOfBuffs: [BUFF.damage, BUFF.damage, BUFF.speed],
      }),
      1.58
    );
  });

  it("floors an economy at the war's tier", () => {
    assert.equal(starThreat.measure({ econ_rate: 0.1 }), 0.5);
  });

  it("ignores, and reports, a buff type it does not know", () => {
    const warn = mock.method(console, "warn", () => {});
    try {
      assert.equal(starThreat.measure({ econ_rate: 2, typeOfBuffs: [99] }), 2);
      assert.equal(warn.mock.calls.length, 1);
      assert.match(warn.mock.calls[0].arguments[0], /Undefined buff type: 99/);
    } finally {
      warn.mock.restore();
    }
  });
});

describe("commanderEco", () => {
  beforeEach(() => {
    installModel(buildGame({ customDifficulty: TIER }).game);
  });

  it("is the floored rate, grown for a shared army", () => {
    assert.equal(starThreat.commanderEco({ econ_rate: 2 }), 2);
    assert.equal(
      starThreat.commanderEco({ econ_rate: 2, commanderCount: 2 }),
      3
    );
    assert.equal(starThreat.commanderEco({ econ_rate: 0.2 }), 0.5);
  });
});
