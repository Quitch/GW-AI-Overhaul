"use strict";

// Unit tests for the pure target-collection helper of gw_play/cards_coop_deal.js. The
// factory it returns installs model.dealCoopPlayerPendingTechCards and drives an async
// jQuery-deferred deal, so that part is exercised in-game; the viewer validation loop is
// reached here through the module's dead-in-production `typeof module` hook, via
// requireShippedModule.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const coopDeal = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_deal.js"
);

// Builds a collectPendingTechTargets call, defaulting the injected lookups to the
// "everything is fine" case so each test overrides only what it exercises.
function collect(overrides) {
  const records = overrides.records || {};
  return coopDeal.collectPendingTechTargets({
    viewers: overrides.viewers,
    dealOptions: overrides.dealOptions || {},
    startLoadoutCards: overrides.startLoadoutCards || [],
    findRecord: overrides.findRecord || ((query) => records[query.id]),
    getDealCount: overrides.getDealCount || (() => 0),
    hasUnlockedStartCard: overrides.hasUnlockedStartCard || (() => false),
  });
}

const viewer = (id) => ({ id, name: id, role: "viewer" });
const readyRecord = { inventory: { cards: [] } };

describe("collectPendingTechTargets", () => {
  it("collects a target for a ready viewer with no start loadouts", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
    });
    assert.equal(result.validationError, undefined);
    assert.equal(result.targets.length, 1);
    assert.equal(result.targets[0].client.id, "alice");
    assert.equal(result.targets[0].record, readyRecord);
    assert.equal(result.targets[0].startLoadoutCard, undefined);
  });

  it("errors when a viewer has no inventory record at all", () => {
    const result = collect({ viewers: [viewer("alice")], records: {} });
    assert.match(result.validationError, /Missing inventory data/);
    assert.deepEqual(result.targets, []);
  });

  it("errors when the record has no saved inventory", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: {} },
    });
    assert.match(result.validationError, /Missing saved inventory/);
  });

  it("errors when the viewer already holds pending tech cards", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: { inventory: {}, pendingTechCards: { cards: [] } } },
    });
    assert.match(result.validationError, /already has pending tech cards/);
  });

  it("short-circuits: a later valid viewer is not collected after an error", () => {
    const result = collect({
      viewers: [viewer("missing"), viewer("bob")],
      records: { bob: readyRecord },
    });
    assert.match(result.validationError, /Missing inventory data/);
    assert.deepEqual(result.targets, []);
  });

  it("skips (without error) a viewer whose deal count has caught up to dealIndex", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
      dealOptions: { dealIndex: 2 },
      getDealCount: () => 2,
    });
    assert.equal(result.validationError, undefined);
    assert.deepEqual(result.targets, []);
  });

  it("still collects a viewer whose deal count is behind dealIndex", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
      dealOptions: { dealIndex: 2 },
      getDealCount: () => 1,
    });
    assert.equal(result.targets.length, 1);
  });

  it("assigns the first still-locked start loadout when loadouts are on offer", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: { inventory: {}, unlockedStartCardIds: ["x"] } },
      startLoadoutCards: [{ id: "gwaio_start_x" }, { id: "gwaio_start_y" }],
      // "x" already unlocked, "y" not - so the locked "y" is chosen.
      hasUnlockedStartCard: (record, card) => card.id === "gwaio_start_x",
    });
    assert.deepEqual(result.targets[0].startLoadoutCard, {
      id: "gwaio_start_y",
    });
  });

  it("leaves startLoadoutCard undefined when every offered loadout is unlocked", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: { inventory: {}, unlockedStartCardIds: ["x"] } },
      startLoadoutCards: [{ id: "gwaio_start_x" }],
      hasUnlockedStartCard: () => true,
    });
    assert.equal(result.targets.length, 1);
    assert.equal(result.targets[0].startLoadoutCard, undefined);
  });
});
