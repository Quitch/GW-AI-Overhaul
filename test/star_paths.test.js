"use strict";

// shared/star_paths.js must return exactly the path the base game's
// GWGalaxy.pathBetween returns, null included, for every graph and fog state.

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const starPaths = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/star_paths.js"
);

// The base game's pathBetween from media/ui/main/game/galactic_war/shared/js/
// gw_galaxy.js (PA 124680), with `self` made a parameter. Its _.cloneDeep copies
// an array of star indices, so slice() is the same copy.
function stockPathBetween(self, from, to, noFog) {
  const toExplored = self.stars()[to].explored();
  const neighborsMap = self.neighborsMap();
  const checked = {};
  const worklist = [[from]];
  while (worklist.length > 0) {
    const path = worklist.shift();
    const node = path[path.length - 1];
    const nodeNeighbors = neighborsMap[node] || [];
    checked[node] = true;
    for (let neighbor = 0; neighbor < nodeNeighbors.length; ++neighbor) {
      const other = nodeNeighbors[neighbor];
      if (checked[other]) continue;
      if (other === to) {
        const previous = path[path.length - 1];
        const explored = self.stars()[previous].explored() || toExplored;
        if (!explored && !noFog) continue;
        path.push(other);
        return path;
      }
      const otherStar = self.stars()[other];
      const otherVisited = otherStar.history().length > 0;
      const valid = noFog ? otherVisited : otherStar.explored();
      if (valid) {
        const newPath = path.slice();
        newPath.push(other);
        worklist.push(newPath);
      }
    }
  }
  return null;
}

// Stock's neighborsMap: each gate lists both ends, in gate order.
function neighborsOf(gates) {
  const edges = {};
  gates.forEach((gate) => {
    edges[gate[0]] = edges[gate[0]] || [];
    edges[gate[1]] = edges[gate[1]] || [];
    edges[gate[0]].push(gate[1]);
    edges[gate[1]].push(gate[0]);
  });
  return edges;
}

function makeGalaxy(starStates, gates) {
  const stars = starStates.map((state) => ({
    explored: () => state.explored,
    history: () => (state.visited ? [{}] : []),
  }));
  const map = neighborsOf(gates);
  return { stars: () => stars, neighborsMap: () => map };
}

// A small deterministic generator, so a failure names a seed that reproduces it.
function rng(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function randomGalaxy(random) {
  const count = 2 + Math.floor(random() * 40);
  const states = [];
  for (let i = 0; i < count; i++) {
    const visited = random() < 0.5;
    states.push({
      visited,
      explored: visited ? random() < 0.8 : random() < 0.2,
    });
  }
  const gates = [];
  for (let i = 1; i < count; i++) {
    if (random() < 0.9) gates.push([Math.floor(random() * i), i]);
  }
  const extra = Math.floor(random() * count);
  for (let i = 0; i < extra; i++) {
    const a = Math.floor(random() * count);
    const b = Math.floor(random() * count);
    if (a !== b) gates.push(random() < 0.5 ? [a, b] : [b, a]);
  }
  return { count, galaxy: makeGalaxy(states, gates) };
}

describe("star_paths.pathBetween", () => {
  it("matches the base game on random galaxies, fog on and off", () => {
    let compared = 0;
    let found = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const random = rng(seed);
      const { count, galaxy } = randomGalaxy(random);
      for (let from = 0; from < count; from++) {
        for (let to = 0; to < count; to++) {
          [false, true].forEach((noFog) => {
            const expected = stockPathBetween(galaxy, from, to, noFog);
            if (expected && expected.length > 2) found++;
            assert.deepEqual(
              starPaths.pathBetween(galaxy, from, to, noFog),
              expected,
              "seed " + seed + " from " + from + " to " + to + " noFog " + noFog
            );
            compared++;
          });
        }
      }
    }
    assert.ok(compared > 100000);
    // Enough of them multi-hop routes for the search order to matter.
    assert.ok(found > 10000, "multi-hop paths found: " + found);
  });

  it("takes the last hop from an unexplored star only into an explored one, or under noFog", () => {
    const galaxy = makeGalaxy(
      [
        { visited: true, explored: false },
        { visited: false, explored: false },
        { visited: false, explored: true },
      ],
      [
        [0, 1],
        [0, 2],
      ]
    );

    assert.equal(starPaths.pathBetween(galaxy, 0, 1, false), null);
    assert.deepEqual(starPaths.pathBetween(galaxy, 0, 1, true), [0, 1]);
    assert.deepEqual(starPaths.pathBetween(galaxy, 0, 2, false), [0, 2]);
  });

  it("finds no path from a star to itself, as the base game does", () => {
    const galaxy = makeGalaxy(
      [
        { visited: true, explored: true },
        { visited: true, explored: true },
      ],
      [[0, 1]]
    );

    assert.equal(starPaths.pathBetween(galaxy, 0, 0, false), null);
  });

  it("treats a star with no gates as a dead end", () => {
    const galaxy = makeGalaxy(
      [
        { visited: true, explored: true },
        { visited: true, explored: true },
      ],
      []
    );

    assert.equal(starPaths.pathBetween(galaxy, 0, 1, true), null);
  });
});

describe("star_paths.install", () => {
  it("replaces the galaxy's own pathBetween with one bound to it", () => {
    const galaxy = makeGalaxy(
      [
        { visited: true, explored: true },
        { visited: false, explored: false },
      ],
      [[0, 1]]
    );
    galaxy.pathBetween = () => "stock";

    starPaths.install(galaxy);

    assert.deepEqual(galaxy.pathBetween(0, 1, false), [0, 1]);
  });
});
