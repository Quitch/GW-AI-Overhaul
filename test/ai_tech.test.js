"use strict";

// gw_start/ai_tech.js builds the faction tech tables at define() time and exports
// only factionTechs, so these assert against that. The contract worth pinning is
// the ordering: tech6 concatenates the already-built tech1 and tech2 onto its tail.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const aiTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js"
);

// Tech slots that are populated (tech5 was removed and is intentionally left absent).
const POPULATED_SLOTS = [0, 1, 2, 3, 4, 6, 7];

describe("loadoutFor", () => {
  const CLUSTER = 4;
  const clusterSetup = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_setup.js"
  );

  it("concatenates the faction's tech for each buff, in buff order", () => {
    const table = aiTech.factionTechs[1];
    assert.deepEqual(
      aiTech.loadoutFor(1, [2, 0], false),
      table[2].concat(table[0])
    );
  });

  it("grants nothing for no buffs", () => {
    assert.deepEqual(aiTech.loadoutFor(1, [], false), []);
  });

  it("puts the Cluster commander mods before a Cluster AI's tech", () => {
    const loadout = aiTech.loadoutFor(CLUSTER, [7], true);
    const mods = clusterSetup.clusterCommanderMods;
    assert.deepEqual(loadout.slice(0, mods.length), mods);
    assert.deepEqual(
      loadout.slice(mods.length),
      aiTech.factionTechs[CLUSTER][7]
    );
  });

  it("skips the removed tech index a v5.11.0 save can carry", () => {
    assert.deepEqual(
      aiTech.loadoutFor(0, [5, 1], false),
      aiTech.factionTechs[0][1]
    );
  });

  it("never hands out the tables themselves", () => {
    const loadout = aiTech.loadoutFor(CLUSTER, [], true);
    loadout.push("marker");
    assert.ok(!clusterSetup.clusterCommanderMods.includes("marker"));
    const single = aiTech.loadoutFor(2, [3], false);
    single.push("marker");
    assert.ok(!aiTech.factionTechs[2][3].includes("marker"));
  });
});

describe("factionTechs", () => {
  it("produces a tech table for each of the five factions", () => {
    assert.equal(aiTech.factionTechs.length, 5);
  });

  it("populates every slot except the removed tech5", () => {
    aiTech.factionTechs.forEach((faction) => {
      POPULATED_SLOTS.forEach((slot) => {
        assert.ok(
          Array.isArray(faction[slot]),
          "slot " + slot + " is an array"
        );
      });
      assert.equal(faction[5], undefined);
    });
  });

  it("emits only well-formed multiply descriptors", () => {
    aiTech.factionTechs.forEach((faction) => {
      POPULATED_SLOTS.forEach((slot) => {
        faction[slot].forEach((descriptor) => {
          assert.equal(descriptor.op, "multiply");
          assert.equal(typeof descriptor.file, "string");
          assert.equal(typeof descriptor.path, "string");
          assert.equal(typeof descriptor.value, "number");
        });
      });
    });
  });

  it("fabrication tech (0) scales build_metal_cost by 0.75", () => {
    aiTech.factionTechs.forEach((faction) => {
      faction[0].forEach((descriptor) => {
        assert.equal(descriptor.path, "build_metal_cost");
        assert.equal(descriptor.value, 0.75);
      });
    });
  });

  it("combat tech (6) appends ammunition (1) then armour (2) at its tail", () => {
    // Pinning the tail proves the concat order and guards against a reorder.
    aiTech.factionTechs.forEach((faction) => {
      const appended = faction[1].concat(faction[2]);
      const tail = faction[6].slice(faction[6].length - appended.length);
      assert.deepEqual(tail, appended);
    });
  });
});
