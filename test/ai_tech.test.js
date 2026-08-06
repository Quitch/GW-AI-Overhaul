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
