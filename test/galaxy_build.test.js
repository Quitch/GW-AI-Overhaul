"use strict";

// gw_start/galaxy_build.js's build(), which gw_start/setup.js calls inside a
// jQuery .then. jQuery 2.1.4 lets a throw there escape instead of rejecting,
// so war generation waited for good: Go To War stayed disabled and the
// player never saw the report-it-with-the-seed message. Shared Systems for
// Galactic War replaces the system loader build() calls, so that call runs
// another mod's code. The base game's modules are stubbed, as CI has none.

const { describe, it, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const {
  MOD_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");
const { createGlobalStubs } = require("../scripts/lib/global-stubs.js");
const {
  installFakeJQuery,
  resolved,
} = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

// Three stars with a gate between each pair.
function GalaxyBuilder() {
  this.stars = [
    [0, 0],
    [2, 0],
    [0, 2],
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 2],
  ];
  this.reducedGraph = {
    getEdges: () => edges,
    calcDistance: (origin, visit) => {
      [0, 1, 2].forEach((star) => visit(star, star === origin ? 0 : 1));
    },
  };
}
GalaxyBuilder.prototype.build = () => {};

function GWStar() {
  this.coordinates = makeObservable();
  this.distance = makeObservable();
  this.system = makeObservable();
  this.biome = makeObservable();
}

function GWGalaxy() {}

// What buildGraph() is handed, and what it asks Graph to reduce. Graph keeps
// stock's bookkeeping: getConnections() is sparse, so a star in no edge has
// no entry at all.
let triangulation;
const reductions = [];

function Delaunay() {}
Delaunay.prototype.getEdges = () => triangulation.edges;
Delaunay.prototype.getOuterEdges = () => triangulation.hull;

function Graph(edges) {
  this.edges = [];
  this.connections = [];
  edges.forEach((edge) => this.addEdge(edge));
}
Graph.prototype.addEdge = function (edge) {
  this.edges.push(edge);
  edge.forEach((star, end) => {
    this.connections[star] = (this.connections[star] || []).concat(
      edge[1 - end]
    );
  });
};
Graph.prototype.getConnections = function () {
  return this.connections.slice(0);
};
Graph.prototype.getEdges = function () {
  return this.edges.slice(0);
};
Graph.prototype.sortEdges = () => {};
Graph.prototype.reduceConnections = function (max, seed) {
  reductions.push({ max, seed, connections: this.getConnections() });
};

registerModuleStub("shared/gw_galaxy", GWGalaxy);
registerModuleStub("shared/GalaxyBuilder", GalaxyBuilder);
registerModuleStub("shared/Delaunay", Delaunay);
registerModuleStub("shared/Graph", Graph);
registerModuleStub("shared/gw_star", GWStar);
["pa-easy", "pa-normal", "titans-easy", "titans-normal"].forEach((name) => {
  registerModuleStub("main/game/galactic_war/shared/js/systems/" + name, []);
});

// Shared Systems for Galactic War's loader, as chooseFor recognises it. Each
// test says what making it does.
const loaderCalls = [];
let makeLoader;
const sharedSystemsLoader = (...args) => {
  loaderCalls.push(args);
  return makeLoader();
};
sharedSystemsLoader.loadOptions = () => {};
registerModuleStub(
  "main/game/galactic_war/shared/js/systems/template-loader",
  sharedSystemsLoader
);

loadCouiModule(MOD_ROOT + "/gw_start/galaxy_build.js").install();
const galaxyConnect = loadCouiModule(
  MOD_ROOT + "/gw_start/gw_galaxy_connect.js"
);

const stubs = createGlobalStubs();

afterEach(() => {
  stubs.restoreGlobals();
  loaderCalls.length = 0;
});

function makeGalaxy() {
  return {
    radius: makeObservable(),
    stars: makeObservable([]),
    gates: makeObservable([]),
    origin: makeObservable(0),
  };
}

// System Scaling on, as by default, so each star asks for its distance.
function installSettings() {
  stubs.setGlobal("model", {
    gwoDifficultySettings: {
      systemScaling: () => true,
      largePlanets: () => false,
      simpleSystems: () => false,
    },
  });
}

const earthlike = {
  name: "Earthlike",
  planets: [{ generator: { biome: "earth" } }],
};

describe("build", () => {
  it("rejects, rather than throws, when the system loader throws", async () => {
    installFakeJQuery(stubs);
    makeLoader = () => {
      throw new Error("Shared Systems failed");
    };
    const galaxy = makeGalaxy();

    let built;
    assert.doesNotThrow(() => {
      built = GWGalaxy.prototype.build.call(galaxy, {
        seed: 1,
        content: "PAExpansion1",
      });
    });

    await assert.rejects(built, /Shared Systems failed/);
  });

  // Making Shared Systems' loader loads every selected source again, and
  // deselects one that fails, which rerolls the seed.
  it("places bracketed systems without making the system loader", async () => {
    installFakeJQuery(stubs);
    installSettings();
    makeLoader = () => {
      throw new Error("made the system loader");
    };
    const galaxy = makeGalaxy();

    await GWGalaxy.prototype.build.call(galaxy, {
      seed: 1,
      content: "PAExpansion1",
      gwoSystemBrackets: [{ min: 0, max: 32, systems: [earthlike] }],
    });

    assert.deepEqual(loaderCalls, []);
    assert.deepEqual(
      galaxy.stars().map((star) => star.system().name),
      ["Earthlike", "Earthlike", "Earthlike"]
    );
  });

  it("makes the system loader once when there are no brackets", async () => {
    installFakeJQuery(stubs);
    installSettings();
    makeLoader = () => ({ generate: () => resolved(earthlike) });
    const galaxy = makeGalaxy();

    await GWGalaxy.prototype.build.call(galaxy, {
      seed: 1,
      content: "PAExpansion1",
      useEasierSystemTemplate: false,
    });

    assert.deepEqual(loaderCalls, [["PAExpansion1", false]]);
    assert.deepEqual(
      galaxy.stars().map((star) => star.system()),
      [earthlike, earthlike, earthlike]
    );
  });
});

describe("buildGraph", () => {
  it("reconnects the stars the hull strip isolates before it reduces", () => {
    // A fan from star 0: stars 1 and 4 each sit in one triangle, so every
    // edge of theirs is a hull edge. Stock's Graph.isConnected() never visits
    // an isolated star 1, so reducing first would undo every removal.
    triangulation = {
      edges: [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
      hull: [
        [0, 1],
        [0, 4],
        [1, 2],
        [2, 3],
        [3, 4],
      ],
    };
    const builder = {
      stars: [
        [0, 0],
        [1, 0],
        [2, 1],
        [1, 2],
        [0, 2],
      ],
      maxConnections: 4,
      seed: "7",
    };

    GalaxyBuilder.prototype.buildGraph.call(builder);

    assert.equal(reductions.length, 1);
    assert.deepEqual(
      galaxyConnect.isolatedStars(5, reductions[0].connections),
      []
    );
    assert.deepEqual([reductions[0].max, reductions[0].seed], [4, "7"]);
  });
});
