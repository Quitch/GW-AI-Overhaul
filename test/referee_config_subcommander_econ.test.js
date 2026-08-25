"use strict";

// Unit tests for the econ_rate gw_play/referee_config_setup.js gives a subcommander.
// The player's subcommanders and a star's ai.ally both reach it through
// setupAlliedCommanders, which must fix the rate rather than apply the enemy AI's
// difficulty floor.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const {
  buildGame,
  installModel,
  makeAiDescriptor: makeDescriptor,
} = require("../scripts/lib/ai-path-fixtures.js");

const refereeConfig = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_config_setup.js"
);
const gwoAI = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"
);
const gwoDifficulty = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js"
);

let restoreModel;

afterEach(() => {
  if (restoreModel) {
    restoreModel();
    restoreModel = undefined;
  }
});

function makeAiDescriptor(overrides) {
  return makeDescriptor(
    Object.assign({ econ_rate: gwoAI.subcommanderEconRate }, overrides)
  );
}

function setUpSubcommander(difficultyName, descriptor) {
  const fixture = buildGame({ aiInUse: "Titans", difficultyName });
  restoreModel = installModel(fixture.game);

  const armies = [];
  refereeConfig.setupAlliedCommanders(
    [descriptor || makeAiDescriptor()],
    [],
    armies,
    fixture.inventory,
    ".player"
  );
  return armies[0];
}

describe("subcommander econ_rate", () => {
  it("is the subcommander rate on every difficulty tier", () => {
    for (const difficulty of gwoDifficulty.difficulties) {
      const army = setUpSubcommander(difficulty.difficultyName);
      assert.equal(
        army.econ_rate,
        gwoAI.subcommanderEconRate,
        difficulty.difficultyName
      );
      restoreModel();
      restoreModel = undefined;
    }
  });

  // The values a legacy war, or the negative co-op eco aiEconRateWithFloor exists
  // for, can leave on a saved subcommander.
  it("ignores whatever econ_rate the saved subcommander carries", () => {
    const high = setUpSubcommander(
      "!LOC:Beginner",
      makeAiDescriptor({ econ_rate: 7 })
    );
    const negative = setUpSubcommander(
      "!LOC:Beginner",
      makeAiDescriptor({ econ_rate: -3 })
    );
    const missing = setUpSubcommander(
      "!LOC:Beginner",
      makeAiDescriptor({ econ_rate: undefined })
    );

    assert.equal(high.econ_rate, gwoAI.subcommanderEconRate);
    assert.equal(negative.econ_rate, gwoAI.subcommanderEconRate);
    assert.equal(missing.econ_rate, gwoAI.subcommanderEconRate);
  });

  // referee_config.js gives the star's ai.ally a startPosition past the player's
  // subcommanders, so it arrives here on the other branch of firstPosition.
  it("covers a star's ai.ally, whatever its startPosition", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      difficultyName: "!LOC:Uber",
    });
    restoreModel = installModel(fixture.game);

    const armies = [];
    refereeConfig.setupAlliedCommanders(
      [makeAiDescriptor()],
      [],
      armies,
      fixture.inventory,
      ".player",
      3
    );
    assert.equal(armies[0].econ_rate, gwoAI.subcommanderEconRate);
  });

  it("does not disturb the enemy AI's floored rate", () => {
    const fixture = buildGame({
      aiInUse: "Titans",
      difficultyName: "!LOC:Uber",
      enemyType: "neither",
    });
    restoreModel = installModel(fixture.game);

    const ai = makeAiDescriptor({ minions: [makeAiDescriptor()] });
    const armies = [];
    refereeConfig.setupPrimaryAiAndMinions(ai, [], [".ai0"], "Titans", armies);

    const flooredRate = gwoAI.aiEconRateWithFloor(gwoAI.subcommanderEconRate);
    assert.ok(
      flooredRate > gwoAI.subcommanderEconRate,
      "Uber's econ floor must exceed the subcommander rate for this to test anything"
    );
    assert.equal(armies[0].econ_rate, flooredRate);
    assert.equal(armies[1].econ_rate, flooredRate);
  });
});
