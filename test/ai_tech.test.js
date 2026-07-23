"use strict";

// Unit tests for gw_start/ai_tech.js, which builds the AI faction tech tables at
// define() time (its private multiply() helper fans a unit list out into per-path
// "multiply" stat-mod descriptors, and seven setupAITechN builders populate the
// five factions' tech slots). Loading the module runs all of that; the module only
// exports factionTechs, so we assert against that. The key thing worth pinning is
// the documented ordering contract: tech6 concatenates the already-built tech1
// (ammunition) and tech2 (armour) onto its tail, so reordering the setup calls would
// silently change the result.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const aiTech = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js"
);

// Tech slots that are populated (tech5 was removed and is intentionally left absent).
const POPULATED_SLOTS = [0, 1, 2, 3, 4, 6, 7];

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
    // The ordering contract called out in ai_tech.js: setupAITech6 runs after both
    // setupAITech1 and setupAITech2 and ends with faction[6].concat(faction[1],
    // faction[2]). Pinning the tail proves the concat order and guards a reorder.
    aiTech.factionTechs.forEach((faction) => {
      const appended = faction[1].concat(faction[2]);
      const tail = faction[6].slice(faction[6].length - appended.length);
      assert.deepEqual(tail, appended);
    });
  });
});
