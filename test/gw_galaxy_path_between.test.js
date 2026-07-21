"use strict";

// Characterization tests for GWGalaxy.pathBetween (a fog-of-war-aware BFS over the
// galaxy's star graph), reached via gw_galaxy.js's test-only module.exports hook. The
// file's define() depends on base-game modules GWO doesn't ship, so we pull the
// constructor through requireShippedModule() and drive it with a minimal ko stub plus
// plain fake stars - no game/Chromium runtime needed. These tests pin current behavior
// so the S3776 complexity refactor of pathBetween can be proven behavior-preserving.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// pathBetween's enclosing constructor calls ko.observable/observableArray/computed at
// construction time. A minimal stub is enough: observables are get/set closures, and a
// computed just re-evaluates its function on each read (so neighborsMap always reflects
// the current gates()). global._ (lodash) is installed by the amd-loader below.
global.ko = {
  observable: makeObservable,
  observableArray: makeObservable,
  computed: (fn) => fn,
};

function makeObservable(initial) {
  let value = initial;
  return function () {
    if (arguments.length) {
      value = arguments[0];
      return;
    }
    return value;
  };
}

const { requireShippedModule } = require("../scripts/lib/amd-loader.js");
const { GWGalaxy } = requireShippedModule(
  "coui://ui/main/game/galactic_war/shared/js/gw_galaxy.js"
);

// A fake star: `explored` is the fog-of-war reveal flag; `history` (non-empty means the
// player has previously visited) is what noFog pathing consults instead of explored.
function star(explored, visited) {
  return {
    explored: () => explored,
    history: () => (visited ? [{}] : []),
  };
}

function makeGalaxy(gates, stars) {
  const galaxy = new GWGalaxy();
  galaxy.gates(gates);
  galaxy.stars(stars);
  return galaxy;
}

describe("GWGalaxy.pathBetween", () => {
  it("returns the single-hop path between directly connected explored stars", () => {
    const galaxy = makeGalaxy([[0, 1]], [star(true), star(true)]);
    assert.deepEqual(galaxy.pathBetween(0, 1, false), [0, 1]);
  });

  it("finds a multi-hop path through explored intermediates", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
      ],
      [star(true), star(true), star(true)]
    );
    assert.deepEqual(galaxy.pathBetween(0, 2, false), [0, 1, 2]);
  });

  it("returns null when no path connects the two stars", () => {
    // Two disconnected components: 0-1 and 2-3.
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [2, 3],
      ],
      [star(true), star(true), star(true), star(true)]
    );
    assert.equal(galaxy.pathBetween(0, 2, false), null);
  });

  it("under fog, will not path through an unexplored intermediate", () => {
    // Star 1 is visited (history) but not explored: fog pathing rejects it, noFog uses it.
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
      ],
      [star(true), star(false, true), star(true)]
    );
    assert.equal(galaxy.pathBetween(0, 2, false), null);
  });

  it("with noFog, paths through a visited-but-unexplored intermediate", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
      ],
      [star(true), star(false, true), star(true)]
    );
    assert.deepEqual(galaxy.pathBetween(0, 2, true), [0, 1, 2]);
  });

  it("under fog, rejects a target reachable only via unexplored stars", () => {
    // Neither the source nor the target is explored: the target-adjacency fog check
    // blocks the hop under fog, but noFog allows it.
    const galaxy = makeGalaxy([[0, 1]], [star(false), star(false, true)]);
    assert.equal(galaxy.pathBetween(0, 1, false), null);
    assert.deepEqual(galaxy.pathBetween(0, 1, true), [0, 1]);
  });

  it("does not loop forever on a cyclic graph and takes the shortest hop", () => {
    // Triangle 0-1-2-0: 2 is a direct neighbor of 0, so the BFS returns [0, 2].
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
      [star(true), star(true), star(true)]
    );
    assert.deepEqual(galaxy.pathBetween(0, 2, false), [0, 2]);
  });

  it("handles a start node with no edges (the neighborsMap `|| []` guard)", () => {
    // Node 0 has no gates at all; the graph elsewhere connects 1-2.
    const galaxy = makeGalaxy([[1, 2]], [star(true), star(true), star(true)]);
    assert.equal(galaxy.pathBetween(0, 2, false), null);
  });

  it("returns null for a zero-length path where from === to", () => {
    // pathBetween only matches `to` as a neighbor, never as the start, so a same-node
    // query yields null (pinned as current behavior).
    const galaxy = makeGalaxy([[0, 1]], [star(true), star(true)]);
    assert.equal(galaxy.pathBetween(0, 0, false), null);
  });
});
