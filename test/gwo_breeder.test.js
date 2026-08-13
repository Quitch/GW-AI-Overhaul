"use strict";

// Tests for gw_start/gwo_breeder.js, which places each AI faction's spawn star and
// spreads the factions outward. shared/Graph is unshipped, so a stand-in is
// registered; only addEdge and calcDistance are needed.

const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");

const {
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");

function Graph(edges) {
  this.connections = [];
  (edges || []).forEach((edge) => {
    const [a, b] = edge;
    this.connections[a] = this.connections[a] || [];
    this.connections[b] = this.connections[b] || [];
    this.connections[a].push(b);
    this.connections[b].push(a);
  });
}

// Breadth-first from one or more roots, calling back with (node, distance) - the same
// contract stock's Graph.calcDistance has.
Graph.prototype.calcDistance = function (nodes, callback) {
  const roots = typeof nodes === "number" ? [nodes] : nodes;
  const distances = [];
  roots.forEach((n) => {
    distances[n] = 0;
    callback(n, 0);
  });
  const work = roots.slice();
  while (work.length) {
    const node = work.shift();
    (this.connections[node] || []).forEach((next) => {
      if (distances[next] !== undefined) {
        return;
      }
      distances[next] = distances[node] + 1;
      callback(next, distances[next]);
      work.push(next);
    });
  }
};

registerModuleStub("shared/Graph", Graph);

const gwoRng = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js"
);

const stubs = createGlobalStubs();

before(() => {
  // Stock relies on jQuery firing these already-resolved callbacks inline. See
  // galaxy.md on why the workers stream stays ordered.
  const $ = function () {};
  $.when = function (...args) {
    const settled = args.map((a) =>
      a && a.__value !== undefined ? a.__value : a
    );
    return {
      __value: settled.length === 1 ? settled[0] : settled,
      then: function (fn) {
        const out = fn(...settled);
        return out && out.then
          ? out
          : { __value: out, then: (g) => $.when(g(out)) };
      },
    };
  };
  $.when.apply = (ctx, list) => $.when(...list);
  stubs.setGlobal("$", $);
});

after(() => stubs.restoreGlobals());

const gwoBreeder = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/gwo_breeder.js"
);

// A line of `count` stars, 0 - 1 - 2 - ... so distances are unambiguous.
function chain(count) {
  const gates = [];
  for (let i = 0; i + 1 < count; i++) {
    gates.push([i, i + 1]);
  }
  const stars = Array.from({ length: count }, () => {
    let ai = null;
    const star = {
      ai: (v) => (v === undefined ? ai : (ai = v)),
      cardList: () => ({ push: () => {} }),
      distance: () => 0,
      system: () => ({ planets: [] }),
    };
    return star;
  });
  return {
    stars: () => stars,
    gates: () => gates,
    origin: () => 0,
  };
}

function populate(galaxy, rng, teamCount) {
  const teams = Array.from({ length: teamCount }, (_, i) => ({ color: i }));
  const spawned = [];
  gwoBreeder.populate({
    galaxy: galaxy,
    teams: teams,
    neutralStars: 1,
    orderedSpawn: false,
    rng: rng,
    spawn: function () {},
    canSpread: () => true,
    spread: function () {},
    boss: function (star, ai) {
      spawned.push({ team: ai.team, star: galaxy.stars().indexOf(star) });
    },
  });
  return spawned.sort((a, b) => a.team - b.team);
}

describe("gwo_breeder populate", () => {
  it("places the same factions on the same stars for one seed", () => {
    const a = populate(chain(12), gwoRng.create("breeder-1"), 3);
    const b = populate(chain(12), gwoRng.create("breeder-1"), 3);
    assert.deepEqual(a, b);
    assert.equal(a.length, 3);
  });

  it("places them differently for a different seed", () => {
    const runs = new Set();
    for (let i = 0; i < 12; i++) {
      runs.add(
        JSON.stringify(populate(chain(12), gwoRng.create("seed-" + i), 3))
      );
    }
    assert.ok(runs.size > 1, "every seed produced the same placement");
  });

  it("never spawns two factions on one star, nor on the origin", () => {
    for (let i = 0; i < 12; i++) {
      const placed = populate(chain(12), gwoRng.create("distinct-" + i), 3);
      const stars = placed.map((p) => p.star);
      assert.equal(new Set(stars).size, stars.length, "duplicate spawn star");
      assert.ok(!stars.includes(0), "spawned on the origin");
    }
  });

  // Matching stock without an rng is the whole reason the fallback is kept.
  it("still runs with no rng, drawing from lodash", () => {
    const placed = populate(chain(12), undefined, 3);
    assert.equal(placed.length, 3);
  });

  // The contract Conquest generation rests on: refusing every spread must
  // still terminate, leave exactly the spawn stars owned, and boss-mark them.
  it("leaves only boss-marked spawn stars when canSpread always refuses", () => {
    const galaxy = chain(12);
    const bossed = [];
    gwoBreeder.populate({
      galaxy: galaxy,
      teams: [{ color: 0 }, { color: 1 }, { color: 2 }],
      neutralStars: 1,
      orderedSpawn: false,
      rng: gwoRng.create("conquest-1"),
      spawn: function () {},
      canSpread: () => false,
      spread: function () {
        assert.fail("spread must never be reached");
      },
      boss: function (star, ai) {
        bossed.push(galaxy.stars().indexOf(star));
        assert.equal(ai.boss, true);
      },
    });
    const owned = galaxy
      .stars()
      .map((star, i) => (star.ai() ? i : undefined))
      .filter((i) => i !== undefined);
    assert.deepEqual(owned.sort(), bossed.sort());
    assert.equal(owned.length, 3);
  });
});
