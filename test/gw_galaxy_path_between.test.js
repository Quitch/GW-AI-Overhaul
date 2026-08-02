"use strict";

// Characterization tests for GWGalaxy.pathBetween (a fog-of-war-aware BFS over the
// galaxy's star graph). The GWGalaxy constructor lives in the measured, extracted
// shared/gw_galaxy_graph.js (ko/lodash only); gw_galaxy.js augments it with the
// base-game systems glue and is coverage-excluded. We load the graph module directly and
// drive it with a minimal ko stub plus plain fake stars - no game/Chromium runtime
// needed. These tests pin current behavior so pathBetween refactors stay
// behavior-preserving.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

// pathBetween's enclosing constructor calls ko.observable/observableArray/computed at
// construction time. A minimal stub is enough: observables are get/set closures, and a
// computed just re-evaluates its function on each read (so neighborsMap always reflects
// the current gates()). It has to be installed before the module is loaded further
// down; global._ (lodash) comes from the amd-loader.
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

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const GWGalaxy = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gw_galaxy_graph.js"
);

// `explored` is the fog-of-war reveal flag; `history` (non-empty means the player has
// previously visited) is what noFog pathing consults instead of explored.
function star(explored, visited) {
  return {
    explored: () => explored,
    history: () => (visited ? [{}] : []),
  };
}

const exploredStar = () => star(true);
const visitedButUnexploredStar = () => star(false, true);
const unknownStar = () => star(false);

function makeGalaxy(gates, stars) {
  const galaxy = new GWGalaxy();
  galaxy.gates(gates);
  galaxy.stars(stars);
  return galaxy;
}

describe("GWGalaxy.pathBetween", () => {
  it("returns the single-hop path between directly connected explored stars", () => {
    const galaxy = makeGalaxy([[0, 1]], [exploredStar(), exploredStar()]);
    assert.deepEqual(galaxy.pathBetween(0, 1, false), [0, 1]);
  });

  it("finds a multi-hop path through explored intermediates", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
      ],
      [exploredStar(), exploredStar(), exploredStar()]
    );
    assert.deepEqual(galaxy.pathBetween(0, 2, false), [0, 1, 2]);
  });

  it("returns null when no path connects the two stars", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [2, 3],
      ],
      [exploredStar(), exploredStar(), exploredStar(), exploredStar()]
    );
    assert.equal(galaxy.pathBetween(0, 2, false), null);
  });

  it("under fog, will not path through an unexplored intermediate", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
      ],
      [exploredStar(), visitedButUnexploredStar(), exploredStar()]
    );
    assert.equal(galaxy.pathBetween(0, 2, false), null);
  });

  it("with noFog, paths through a visited-but-unexplored intermediate", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
      ],
      [exploredStar(), visitedButUnexploredStar(), exploredStar()]
    );
    assert.deepEqual(galaxy.pathBetween(0, 2, true), [0, 1, 2]);
  });

  it("under fog, rejects a target reachable only via unexplored stars", () => {
    // The target-adjacency fog check blocks this hop; noFog bypasses it.
    const galaxy = makeGalaxy(
      [[0, 1]],
      [unknownStar(), visitedButUnexploredStar()]
    );
    assert.equal(galaxy.pathBetween(0, 1, false), null);
    assert.deepEqual(galaxy.pathBetween(0, 1, true), [0, 1]);
  });

  it("does not loop forever on a cyclic graph and takes the shortest hop", () => {
    const galaxy = makeGalaxy(
      [
        [0, 1],
        [1, 2],
        [2, 0],
      ],
      [exploredStar(), exploredStar(), exploredStar()]
    );
    assert.deepEqual(galaxy.pathBetween(0, 2, false), [0, 2]);
  });

  it("handles a start node with no edges (the neighborsMap `|| []` guard)", () => {
    const galaxy = makeGalaxy(
      [[1, 2]],
      [exploredStar(), exploredStar(), exploredStar()]
    );
    assert.equal(galaxy.pathBetween(0, 2, false), null);
  });

  it("returns null for a zero-length path where from === to", () => {
    // pathBetween only matches `to` as a neighbor, never as the start, so a same-node
    // query yields null (pinned as current behavior).
    const galaxy = makeGalaxy([[0, 1]], [exploredStar(), exploredStar()]);
    assert.equal(galaxy.pathBetween(0, 0, false), null);
  });
});

describe("GWGalaxy.areNeighbors", () => {
  it("reports adjacency symmetrically for gated stars and false otherwise", () => {
    const galaxy = makeGalaxy(
      [[0, 1]],
      [exploredStar(), exploredStar(), exploredStar()]
    );
    assert.equal(galaxy.areNeighbors(0, 1), true);
    assert.equal(galaxy.areNeighbors(1, 0), true);
    assert.equal(galaxy.areNeighbors(0, 2), false);
  });

  it("returns undefined for a node that has no edges at all", () => {
    // Node 2 never appears in a gate, so it is absent from neighborsMap.
    const galaxy = makeGalaxy(
      [[0, 1]],
      [exploredStar(), exploredStar(), exploredStar()]
    );
    assert.equal(galaxy.areNeighbors(2, 0), undefined);
  });
});
