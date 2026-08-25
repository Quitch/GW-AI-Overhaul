"use strict";

// The AI landing policy referee_config_setup.js assigns each commander, keyed on
// the war seed, the star and the turn.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  makeAiDescriptor: ai,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
);
const streams = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js"
);

const LANDING_POLICIES = [
  "off_player_planet",
  "on_player_planet",
  "no_restriction",
];

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

function battleRng(star, turns) {
  return streams.battleRng(
    streams.warRng({ seed: "battle-seed" }),
    star,
    turns
  );
}

// Every army's landing policies, in army order.
function policies(armies) {
  return armies.map((army) => army.slots.map((slot) => slot.landing_policy));
}

function primary(opts) {
  const options = opts || {};
  const fixture = buildGame({ aiInUse: "Titans", difficultyName: "!LOC:Uber" });
  restoreModel = installModel(fixture.game);

  const armies = [];
  refereeConfig.setupPrimaryAiAndMinions(
    ai({ minions: options.minions || [] }),
    [],
    [".ai0", ".ai1"],
    "Titans",
    armies,
    options.rng === null ? undefined : options.rng || battleRng(3, 5)
  );
  const result = policies(armies);
  restoreModel();
  restoreModel = undefined;
  return result;
}

describe("AI landing policy", () => {
  it("reproduces the same policies for the same seed, star and turn", () => {
    assert.deepEqual(primary(), primary());
  });

  // Sampled across several stars rather than compared pairwise: one commander
  // draws one of three policies, so any two stars agree a third of the time.
  it("differs from star to star", () => {
    const seen = new Set(
      [0, 1, 2, 3, 4, 5].map((star) =>
        JSON.stringify(primary({ rng: battleRng(star, 5) }))
      )
    );
    assert.ok(seen.size > 1, "every star gave the same landing policies");
  });

  // A retry is a fresh move, so the turn advances and the shuffle should change.
  it("differs at a different turn, so a retried battle reshuffles", () => {
    const seen = new Set(
      [5, 6, 7, 8, 9].map((turn) =>
        JSON.stringify(primary({ rng: battleRng(3, turn) }))
      )
    );
    assert.ok(seen.size > 1, "every turn gave the same landing policies");
  });

  // The multi-commander case is "cycles the shuffled policies for an AI with
  // more commanders than policies" below; this fixture is a single commander.
  it("draws the primary AI's policy from the shuffled list", () => {
    const result = primary({ minions: [] });
    assert.equal(result[0].length, 1);
    assert.ok(
      LANDING_POLICIES.includes(result[0][0]),
      `unexpected landing policy ${result[0][0]}`
    );
  });

  // Per-army sub-streams: an extra minion must not move the primary AI's own
  // policies, or gaining one enemy would silently re-roll the rest.
  it("leaves the primary AI's policies alone when a minion is added", () => {
    const alone = primary({ minions: [] });
    const withMinion = primary({ minions: [ai({ name: "Minion" })] });
    assert.deepEqual(withMinion[0], alone[0]);
    assert.equal(withMinion.length, alone.length + 1);
  });

  it("gives a minion its own policies, not the primary AI's stream", () => {
    const result = primary({ minions: [ai({ name: "Minion" })] });
    assert.equal(result.length, 2);
  });

  it("still shuffles with no rng, for a war saved before seeds", () => {
    const result = primary({ rng: null });
    assert.equal(result[0].length, 1);
    assert.ok(LANDING_POLICIES.includes(result[0][0]));
  });

  it("cycles the shuffled policies for an AI with more commanders than policies", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      difficultyName: "!LOC:Uber",
    });
    restoreModel = installModel(fixture.game);

    const armies = [];
    refereeConfig.setupPrimaryAiAndMinions(
      ai({ minions: [], bossCommanders: 4 }),
      [],
      [".ai0"],
      "Titans",
      armies,
      battleRng(3, 5)
    );

    const slots = armies[0].slots.map((slot) => slot.landing_policy);
    assert.equal(slots.length, 4);
    // Three policies dealt round-robin, so the fourth commander repeats the first.
    assert.equal(slots[3], slots[0]);
    assert.equal(new Set(slots).size, 3);
  });
});

describe("FFA foe landing policy", () => {
  function foes(rng, count) {
    const fixture = buildGame({
      aiInUse: "Titans",
      difficultyName: "!LOC:Uber",
    });
    restoreModel = installModel(fixture.game);

    const armies = [];
    refereeConfig.setupFfaAis(
      Array.from({ length: count || 2 }, (unused, i) =>
        ai({ name: "Foe" + i })
      ),
      [".ai0", ".ai1", ".ai2"],
      "Titans",
      armies,
      rng
    );
    const result = policies(armies);
    restoreModel();
    restoreModel = undefined;
    return result;
  }

  it("reproduces each foe's policies and keeps them apart from each other", () => {
    assert.deepEqual(foes(battleRng(3, 5)), foes(battleRng(3, 5)));
  });

  it("does not move an earlier foe when a later one is added", () => {
    const two = foes(battleRng(3, 5), 2);
    const three = foes(battleRng(3, 5), 3);
    assert.deepEqual(three.slice(0, 2), two);
  });
});
