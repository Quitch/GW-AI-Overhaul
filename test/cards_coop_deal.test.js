"use strict";

// The target-collection helper of gw_play/cards_coop_deal.js, reached through the
// module's test-only hook. The async deal the factory drives is exercised in-game.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { requireShippedModule } = require("../scripts/lib/amd-loader.js");

const coopDeal = requireShippedModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/cards_coop_deal.js",
);

// Builds a collectPendingTechTargets call, defaulting the injected lookups to the
// "everything is fine" case so each test overrides only what it exercises.
function collect(overrides) {
  const records = overrides.records || {};
  return coopDeal.collectPendingTechTargets({
    viewers: overrides.viewers,
    dealOptions: overrides.dealOptions || {},
    starIndex: overrides.starIndex,
    treasurePlanet: overrides.treasurePlanet || false,
    findRecord: overrides.findRecord || ((query) => records[query.id]),
    getDealCount: overrides.getDealCount || (() => 0),
    pickStartLoadoutCard:
      overrides.pickStartLoadoutCard || (() => ({ id: "gwaio_start_ceo" })),
    starCardForRecord: overrides.starCardForRecord || (() => undefined),
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

  // The three validation refusals and the short-circuit that follows one are
  // driven through the real async deal, error messages and all, in
  // cards_coop_deal_factory.test.js's "validation" describe.

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

  // The offer is derived per viewer, so the host's own unlocks - and whatever
  // the star was generated holding - have no say in it.
  it("asks for a loadout only at a treasure planet", () => {
    assert.equal(
      collect({
        viewers: [viewer("alice")],
        records: { alice: readyRecord },
      }).targets[0].startLoadoutCard,
      undefined,
    );
    assert.deepEqual(
      collect({
        viewers: [viewer("alice")],
        records: { alice: readyRecord },
        treasurePlanet: true,
      }).targets[0].startLoadoutCard,
      { id: "gwaio_start_ceo" },
    );
  });

  it("falls back to an ordinary deal when the viewer owns every loadout", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
      treasurePlanet: true,
      pickStartLoadoutCard: () => undefined,
      starCardForRecord: () => ({ id: "gwc_combat_bots" }),
    });
    assert.equal(result.targets.length, 1);
    assert.equal(result.targets[0].startLoadoutCard, undefined);
    assert.deepEqual(result.targets[0].preDealtCard, { id: "gwc_combat_bots" });
  });

  it("carries the viewer's own pre-dealt card for the star", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
      starIndex: 12,
      starCardForRecord: (record, starIndex) =>
        starIndex === 12 ? { id: "gwc_combat_bots" } : undefined,
    });
    assert.deepEqual(result.targets[0].preDealtCard, { id: "gwc_combat_bots" });
  });

  // A catch-up deal replays a star the viewer was absent for, so the host has
  // never refreshed a card for them there.
  it("collects a viewer with no pre-dealt card without erroring", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
      starCardForRecord: () => undefined,
    });
    assert.equal(result.validationError, undefined);
    assert.equal(result.targets[0].preDealtCard, undefined);
  });

  it("never offers a loadout and a pre-dealt card at once", () => {
    const result = collect({
      viewers: [viewer("alice")],
      records: { alice: readyRecord },
      treasurePlanet: true,
      starCardForRecord: () => ({ id: "gwc_combat_bots" }),
    });
    assert.deepEqual(result.targets[0].startLoadoutCard, {
      id: "gwaio_start_ceo",
    });
    assert.equal(result.targets[0].preDealtCard, undefined);
  });
});

describe("dealCountForHand", () => {
  // cards_coop_reroll.js reads the spent rerolls back out of the stored hand's
  // length, so concatenating the pre-dealt card must not lengthen it. The
  // counts that holds for are pinned concretely in
  // cards_coop_deal_factory.test.js; the floor below is the one input where
  // the subtraction alone would give the wrong answer.
  it("still deals a card if the offer were ever sized down to nothing", () => {
    assert.equal(coopDeal.dealCountForHand(1, 1), 1);
  });
});

describe("pendingTechDealRng", () => {
  const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
  const streams = loadCouiModule(
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/gwo_streams.js",
  );
  const war = () => streams.warRng({ seed: "coop-seed" });

  function seq(target, count = 4) {
    const rng = coopDeal.pendingTechDealRng(streams, war(), target);
    return Array.from({ length: count }, () => rng());
  }

  const target = (over) =>
    Object.assign(
      {
        record: { playerId: "uber-1" },
        client: { id: 3, name: "Bob" },
        dealIndex: 1,
      },
      over,
    );

  it("reproduces a viewer's hand for the same deal", () => {
    assert.deepEqual(seq(target()), seq(target()));
  });

  it("gives two viewers different hands from the same deal", () => {
    assert.notDeepEqual(
      seq(target()),
      seq(target({ record: { playerId: "uber-2" } })),
    );
  });

  it("gives the same viewer a different hand for a later deal", () => {
    assert.notDeepEqual(seq(target()), seq(target({ dealIndex: 2 })));
  });

  // A catch-up deal supplies no dealIndex; it must not land on deal 0's hand.
  it("keeps a missing dealIndex apart from deal zero", () => {
    assert.notDeepEqual(
      seq(target({ dealIndex: undefined })),
      seq(target({ dealIndex: 0 })),
    );
  });

  // The uberId outranks the connection, so a viewer keeps their hand across a
  // reconnect that hands them a new client id and a renamed session.
  it("ignores the client id and name when the record has a playerId", () => {
    assert.deepEqual(
      seq(target()),
      seq(target({ client: { id: 99, name: "Bob Renamed" } })),
    );
  });

  it("keeps drawing unseeded for a war saved before seeds", () => {
    assert.equal(
      coopDeal.pendingTechDealRng(streams, undefined, target()),
      undefined,
    );
  });
});
