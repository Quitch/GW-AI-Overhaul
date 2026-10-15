"use strict";

// shared/star_paths.js must return exactly the path the base game's
// GWGalaxy.pathBetween returns, null included, for every graph and fog state.

const fs = require("node:fs");
const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { loadCouiModule } = require("../scripts/lib/amd-loader.js");
const { mediaDir } = require("../scripts/lib/pa-install.js");
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

// The installed game's own pathBetween, read from its gw_galaxy.js, so a PA
// patch that changes it fails here rather than going unnoticed. Null without
// the install, as in CI.
function installedPathBetween() {
  const file = path.join(
    mediaDir(),
    "ui/main/game/galactic_war/shared/js/gw_galaxy.js"
  );
  if (!fs.existsSync(file)) return null;
  const text = fs.readFileSync(file, "utf8");
  // Stock also keeps an older search, commented out, above this one.
  const match = /^ *self\.pathBetween = function/m.exec(text);
  assert.ok(match, "no pathBetween in " + file);
  const start = match.index;
  const open = text.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (; end < text.length; end++) {
    if (text[end] === "{") depth++;
    if (text[end] === "}" && --depth === 0) break;
  }
  const source = text.slice(text.indexOf("function", start), end + 1);
  const bind = new Function("self", "_", "return " + source + ";");
  return (galaxy, from, to, noFog) =>
    bind(galaxy, require("lodash"))(from, to, noFog);
}

describe("star_paths.pathBetween against the installed game", () => {
  it("matches the base game's own search on random galaxies", (t) => {
    const installed = installedPathBetween();
    if (!installed) {
      t.skip("no PA install at " + mediaDir());
      return;
    }
    for (let seed = 1; seed <= 100; seed++) {
      const { count, galaxy } = randomGalaxy(rng(seed));
      for (let from = 0; from < count; from++) {
        for (let to = 0; to < count; to++) {
          [false, true].forEach((noFog) => {
            assert.deepEqual(
              starPaths.pathBetween(galaxy, from, to, noFog),
              installed(galaxy, from, to, noFog),
              "seed " + seed + " from " + from + " to " + to + " noFog " + noFog
            );
          });
        }
      }
    }
  });
});

describe("star_paths.pathsFrom", () => {
  it("answers every star as pathBetween does, from one search", () => {
    let compared = 0;
    let missing = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const random = rng(seed);
      const { count, galaxy } = randomGalaxy(random);
      for (let from = 0; from < count; from++) {
        [false, true].forEach((noFog) => {
          const paths = starPaths.pathsFrom(galaxy, from, noFog);
          for (let to = 0; to < count; to++) {
            const expected = stockPathBetween(galaxy, from, to, noFog);
            if (expected === null) missing++;
            assert.deepEqual(
              paths(to),
              expected,
              "seed " + seed + " from " + from + " to " + to + " noFog " + noFog
            );
            compared++;
          }
        });
      }
    }
    assert.ok(compared > 100000);
    assert.ok(missing > 10000, "unreachable stars: " + missing);
  });

  it("hands out a fresh path each time", () => {
    const galaxy = makeGalaxy(
      [
        { visited: true, explored: true },
        { visited: true, explored: true },
      ],
      [[0, 1]]
    );
    const paths = starPaths.pathsFrom(galaxy, 0, false);

    paths(1).push(9);

    assert.deepEqual(paths(1), [0, 1]);
  });
});

describe("star_paths.selectable", () => {
  // Stars 0-1-2 in a line, all explored; the player is on 1.
  function makeModel(options) {
    const galaxy = makeGalaxy(
      [
        { visited: true, explored: true },
        { visited: true, explored: true },
        { visited: false, explored: false },
      ],
      [
        [0, 1],
        [1, 2],
      ]
    );
    return {
      game: () => ({ currentStar: () => 1, galaxy: () => galaxy }),
      cheats: { noFog: () => options.noFog },
      canSelectOrMovePrefix: () => options.prefix,
    };
  }

  it("selects the current star, and paths to the rest", () => {
    const canSelect = starPaths.selectable(
      makeModel({ prefix: true, noFog: false })
    );

    assert.equal(canSelect(1), true);
    assert.deepEqual(canSelect(0), [1, 0]);
    assert.deepEqual(canSelect(2), [1, 2]);
  });

  it("selects only the current star while the explore collapse holds", () => {
    const canSelect = starPaths.selectable(
      makeModel({ prefix: false, noFog: false })
    );

    assert.equal(canSelect(1), true);
    assert.equal(canSelect(0), false);
    assert.equal(canSelect(2), false);
  });

  it("ignores the collapse under noFog", () => {
    const canSelect = starPaths.selectable(
      makeModel({ prefix: false, noFog: true })
    );

    assert.deepEqual(canSelect(0), [1, 0]);
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
