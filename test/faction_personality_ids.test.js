"use strict";

// The five shipped factions record a personalityId on every boss and minion,
// and shared/ai_personality.js rebuilds the same personality from it - the one
// place the faction files' merge and the resolver's could drift apart.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const gwoPersonality = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_personality.js"
);
const factionSeed = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_seed.js"
);
const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

const FACTIONS = [0, 1, 2, 3].map((index) =>
  loadCouiModule(
    "coui://ui/main/game/galactic_war/shared/js/gw_faction_" + index + ".js"
  )
);
FACTIONS.push(
  loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_faction.js"
  )
);

describe("shipped faction personality ids", () => {
  FACTIONS.forEach((faction, index) => {
    describe(faction.name, () => {
      const records = faction.minions.concat([faction.teams[0].boss]);

      it("gives every minion and the boss an id", () => {
        records.forEach((record) => {
          assert.equal(
            typeof record.personalityId,
            "string",
            record.name + " " + record.character
          );
        });
      });

      it("rebuilds each personality from its id", () => {
        records.forEach((record) => {
          assert.deepEqual(
            gwoPersonality.base(record.personalityId, index),
            record.personality,
            record.name + " " + record.character
          );
        });
      });
    });
  });

  it("keeps every id valid after a war reseeds the Random commanders", () => {
    factionSeed.reseed(FACTIONS, gwoRng.create("ids"));
    FACTIONS.forEach((faction, index) => {
      faction.minions.forEach((record) => {
        assert.equal(typeof record.personalityId, "string", record.name);
        assert.deepEqual(
          gwoPersonality.base(record.personalityId, index),
          record.personality,
          faction.name + " " + record.name + " " + record.character
        );
      });
    });
  });

  it("resolves nothing for an unknown id or faction", () => {
    assert.equal(gwoPersonality.base("nobody", 0), undefined);
    assert.equal(gwoPersonality.base("armour", 9), undefined);
  });

  it("hands out a fresh object each time", () => {
    const first = gwoPersonality.base("armour", 0);
    const second = gwoPersonality.base("armour", 0);
    assert.deepEqual(first, second);
    assert.notEqual(first, second);
    first.percent_vehicle = -1;
    assert.notEqual(gwoPersonality.base("armour", 0).percent_vehicle, -1);
  });
});
