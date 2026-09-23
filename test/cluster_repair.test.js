"use strict";

// gw_play/cluster_repair.js: the Custom58 repair gw_play/bugfixes.js applies to
// every Cluster AI in a war saved before 5.52.2.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const clusterRepair = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cluster_repair.js"
);

const SECURITY =
  "/pa/units/land/bot_support_commander/bot_support_commander.json";
const WORKER = "/pa/units/air/support_platform/support_platform.json";

// The baked mods a pre-5.52.2 Cluster AI carries, before the repair.
const bakedInventory = () => [
  { file: SECURITY, path: "unit_types", op: "replace", value: ["UNITTYPE_A"] },
  { file: WORKER, path: "buildable_types", op: "replace", value: "Air" },
  { file: WORKER, path: "buildable_types", op: "replace", value: "Land" },
  { file: "/pa/units/other.json", path: "buildable_types", value: "Naval" },
];

const star = (ai) => ({ ai: () => ai });

describe("repairStars", () => {
  // The repair used to set the war-wide "fixed" flag after the first Cluster
  // AI, so the loop skipped every Cluster star after it.
  it("repairs every Cluster AI in the galaxy, not only the first", () => {
    const first = { isCluster: true, inventory: bakedInventory() };
    const second = { isCluster: true, inventory: bakedInventory() };

    clusterRepair.repairStars([star(first), star(undefined), star(second)]);

    for (const ai of [first, second]) {
      assert.deepEqual(ai.inventory[0].value, [
        "UNITTYPE_A",
        "UNITTYPE_Custom58",
      ]);
      assert.equal(ai.inventory[1].value, "Air & Custom58");
      assert.equal(ai.inventory[2].value, "Land & Custom58");
      assert.equal(ai.inventory[3].value, "Naval", "other units are untouched");
    }
  });

  it("fixes the Security Commander once and the Worker twice", () => {
    const inventory = bakedInventory().concat([
      { file: SECURITY, path: "buildable_types", value: "Extra" },
      { file: WORKER, path: "buildable_types", value: "Third" },
    ]);

    clusterRepair.repairStars([star({ isCluster: true, inventory })]);

    assert.equal(inventory[4].value, "Extra");
    assert.equal(inventory[5].value, "Third");
  });

  it("leaves AIs that are not Cluster alone", () => {
    const inventory = bakedInventory();

    clusterRepair.repairStars([star({ isCluster: false, inventory })]);

    assert.deepEqual(inventory, bakedInventory());
  });

  // A war that records typeOfBuffs builds its spec mods at launch from the
  // live Cluster mods, so there is no baked inventory to repair.
  it("skips a Cluster AI with no baked inventory", () => {
    const ai = { isCluster: true, typeOfBuffs: [0, 1] };

    assert.doesNotThrow(() => clusterRepair.repairStars([star(ai)]));
    assert.equal(ai.inventory, undefined);
  });
});
