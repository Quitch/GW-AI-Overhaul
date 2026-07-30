"use strict";

// Tests for gw_play/coop_colour.js, which predicts the army colour each co-op client
// will be given in the next battle. The expected values below were produced by running
// the base game's own gw_coop_referee.js apply() over a synthetic battle config and
// reading back the split armies' colours, so these assertions are a genuine
// cross-check of the mirrored palette rather than a restatement of the mod's code. If
// the base game ever changes its lobby palette these are the tests that should fail.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { loadCouiModule } = require("../scripts/lib/amd-loader.js");

const coopColour = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/coop_colour.js"
);

const SECONDARY = [192, 192, 192];
// Legonis Machina - its primary is not a member of the lobby palette.
const LEGONIS = [[0, 176, 255], SECONDARY];
// Cluster - its primary is an exact member of the lobby palette.
const CLUSTER = [[128, 128, 128], SECONDARY];

function distanceSquared(a, b) {
  return (
    (a[0] - b[0]) * (a[0] - b[0]) +
    (a[1] - b[1]) * (a[1] - b[1]) +
    (a[2] - b[2]) * (a[2] - b[2])
  );
}

describe("coop_colour.pairsForPlayers", () => {
  it("gives a solo player only the faction colour", () => {
    assert.deepEqual(coopColour.pairsForPlayers(1, LEGONIS), [LEGONIS]);
  });

  it("matches the base referee's colours for a four player war", () => {
    assert.deepEqual(coopColour.pairsForPlayers(4, LEGONIS), [
      [[0, 176, 255], SECONDARY],
      [[0, 223, 223], SECONDARY],
      [[0, 112, 223], SECONDARY],
      [[51, 151, 197], SECONDARY],
    ]);
  });

  it("keeps the host's secondary colour on every player", () => {
    const oddSecondary = [1, 2, 3];
    const pairs = coopColour.pairsForPlayers(6, [[0, 128, 128], oddSecondary]);

    assert.equal(pairs.length, 6);
    pairs.forEach((pair) => assert.deepEqual(pair[1], oddSecondary));
  });

  it("dims saturated palette colours and leaves the rest alone", () => {
    const primaries = coopColour
      .pairsForPlayers(51, LEGONIS)
      .map((pair) => pair[0]);

    // [0, 255, 255] scaled by 14/16 and rounded.
    assert.ok(
      primaries.some((primary) => primary.join() === [0, 223, 223].join())
    );
    assert.ok(
      !primaries.some((primary) => primary.join() === [0, 255, 255].join())
    );
    // [51, 151, 197] has no saturated channel, so it is used as declared.
    assert.ok(
      primaries.some((primary) => primary.join() === [51, 151, 197].join())
    );
  });

  it("orders players by increasing distance from the host's colour", () => {
    const primaries = coopColour
      .pairsForPlayers(51, LEGONIS)
      .map((pair) => pair[0]);

    for (let i = 2; i < primaries.length; i++) {
      assert.ok(
        distanceSquared(primaries[i], LEGONIS[0]) >=
          distanceSquared(primaries[i - 1], LEGONIS[0]),
        "player " + i + " is closer to the host colour than player " + (i - 1)
      );
    }
  });

  it("does not hand the host's own colour to a second player", () => {
    const primaries = coopColour
      .pairsForPlayers(50, CLUSTER)
      .map((pair) => pair[0]);
    const hostPrimaries = primaries.filter(
      (primary) => primary.join() === CLUSTER[0].join()
    );

    assert.deepEqual(primaries[0], CLUSTER[0]);
    assert.equal(hostPrimaries.length, 1);
  });

  it("returns fewer pairs than asked for once the palette runs out", () => {
    // 50 palette entries, one of which is the host's own colour and so dropped.
    assert.equal(coopColour.pairsForPlayers(99, CLUSTER).length, 50);
    assert.equal(coopColour.pairsForPlayers(99, LEGONIS).length, 51);
  });

  it("hands out copies, so a caller cannot corrupt the palette", () => {
    const first = coopColour.pairsForPlayers(2, LEGONIS);
    first[0][0][0] = 42;
    first[1][0][0] = 42;
    first[1][1][0] = 42;

    assert.deepEqual(coopColour.pairsForPlayers(2, LEGONIS), [
      [[0, 176, 255], SECONDARY],
      [[0, 223, 223], SECONDARY],
    ]);
  });
});

describe("coop_colour.clientsInPlayerOrder", () => {
  it("puts the host first and leaves everyone else in join order", () => {
    const first = { id: "1", name: "Ada", role: "viewer" };
    const host = { id: "2", name: "Grace", role: "host" };
    const last = { id: "3", name: "Alan", role: "viewer" };

    assert.deepEqual(coopColour.clientsInPlayerOrder([first, host, last]), [
      host,
      first,
      last,
    ]);
  });

  it("leaves an already host first list untouched", () => {
    const clients = [
      { id: "1", role: "host" },
      { id: "2", role: "viewer" },
      { id: "3", role: "viewer" },
    ];

    assert.deepEqual(coopColour.clientsInPlayerOrder(clients), clients);
  });

  it("tolerates a missing, empty or ragged client list", () => {
    assert.deepEqual(coopColour.clientsInPlayerOrder(undefined), []);
    assert.deepEqual(coopColour.clientsInPlayerOrder("not a list"), []);
    assert.deepEqual(coopColour.clientsInPlayerOrder([]), []);
    assert.deepEqual(coopColour.clientsInPlayerOrder([null]), [null]);
  });
});
