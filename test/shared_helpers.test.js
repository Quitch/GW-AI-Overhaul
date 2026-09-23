"use strict";

// The small shared helpers several modules route through: shared/ids.js,
// shared/gwsm.js, referee_coop.js's client helpers, and the constants
// shared/ai.js publishes for war generation.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

const MOD = "coui://ui/mods/com.pa.quitch.gwaioverhaul/";
const ids = loadCouiModule(MOD + "shared/ids.js");
const gwsm = loadCouiModule(MOD + "shared/gwsm.js");
const refereeCoop = loadCouiModule(MOD + "shared/referee_coop.js");
const gwoAI = loadCouiModule(MOD + "shared/ai.js");
const gwoCard = loadCouiModule(MOD + "shared/cards.js");

const stubs = createGlobalStubs();
afterEach(() => stubs.restoreGlobals());

describe("ids.normalize", () => {
  it("trims and lower-cases an id", () => {
    assert.equal(ids.normalize("  Legion "), "legion");
  });

  it("is empty for anything but a string", () => {
    assert.equal(ids.normalize(undefined), "");
    assert.equal(ids.normalize(4), "");
  });
});

describe("gwsm.manifest", () => {
  it("is GW Server Mods' manifest while it offers load()", () => {
    const manifest = { load: () => {} };
    stubs.setGlobal("window", { GwServerMods: { manifest } });

    assert.equal(gwsm.manifest(), manifest);
  });

  it("is undefined without GW Server Mods, or without load()", () => {
    stubs.setGlobal("window", {});
    assert.equal(gwsm.manifest(), undefined);

    stubs.setGlobal("window", { GwServerMods: { manifest: {} } });
    assert.equal(gwsm.manifest(), undefined);
  });
});

describe("referee_coop client helpers", () => {
  it("viewersOf keeps viewer-role clients and tolerates a missing list", () => {
    const viewer = { id: "v", name: "Ada", role: "viewer" };

    assert.deepEqual(
      refereeCoop.viewersOf([{ id: "h", role: "host" }, null, viewer]),
      [viewer]
    );
    assert.deepEqual(refereeCoop.viewersOf(undefined), []);
  });
});

// War generation samples these in key order, so a new order would change the
// AI tech and eradication modes of every seed.
describe("shared/ai.js war-generation constants", () => {
  it("keeps the buff types in their sampling order", () => {
    assert.deepEqual(Object.keys(gwoAI.BUFF_TYPES), [
      "cost",
      "damage",
      "health",
      "speed",
      "build",
      "combat",
      "cooldown",
    ]);
    assert.deepEqual(Object.values(gwoAI.BUFF_TYPES), [0, 1, 2, 3, 4, 6, 7]);
  });

  it("keeps the eradication modes in their sampling order", () => {
    assert.deepEqual(gwoAI.ERADICATION_MODES, [
      "SubCommanders",
      "Factories",
      "Fabbers",
    ]);
  });

  // shared/cards.js restates the index rather than importing shared/ai.js.
  it("agrees with shared/cards.js on Cluster's faction index", () => {
    const inventory = {
      getTag: (context, name) =>
        context === "global" && name === "playerFaction"
          ? gwoAI.CLUSTER_FACTION
          : undefined,
    };
    assert.equal(gwoCard.playerIsCluster(inventory), true);
  });
});
