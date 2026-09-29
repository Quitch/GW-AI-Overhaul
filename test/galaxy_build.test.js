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
const { installFakeJQuery } = require("../scripts/lib/fake-jquery.js");
const { makeObservable } = require("../scripts/lib/fake-knockout.js");

// Three stars with a gate between each pair, so nothing needs reconnecting.
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
  this.graph = { getEdges: () => edges };
  this.reducedGraph = {
    getConnections: () => [
      [1, 2],
      [0, 2],
      [0, 1],
    ],
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
}

function GWGalaxy() {}

registerModuleStub("shared/gw_galaxy", GWGalaxy);
registerModuleStub("shared/GalaxyBuilder", GalaxyBuilder);
registerModuleStub("shared/Delaunay", function Delaunay() {});
registerModuleStub("shared/Graph", function Graph() {});
registerModuleStub("shared/gw_star", GWStar);
["pa-easy", "pa-normal", "titans-easy", "titans-normal"].forEach((name) => {
  registerModuleStub("main/game/galactic_war/shared/js/systems/" + name, []);
});

// Shared Systems for Galactic War's loader, as chooseFor recognises it.
const sharedSystemsLoader = () => {
  throw new Error("Shared Systems failed");
};
sharedSystemsLoader.loadOptions = () => {};
registerModuleStub(
  "main/game/galactic_war/shared/js/systems/template-loader",
  sharedSystemsLoader
);

loadCouiModule(MOD_ROOT + "/gw_start/galaxy_build.js").install();

const stubs = createGlobalStubs();

afterEach(() => stubs.restoreGlobals());

describe("build", () => {
  it("rejects, rather than throws, when the system loader throws", async () => {
    installFakeJQuery(stubs);
    const galaxy = {
      radius: makeObservable(),
      stars: makeObservable([]),
      gates: makeObservable([]),
      origin: makeObservable(0),
    };

    let built;
    assert.doesNotThrow(() => {
      built = GWGalaxy.prototype.build.call(galaxy, {
        seed: 1,
        content: "PAExpansion1",
      });
    });

    await assert.rejects(built, /Shared Systems failed/);
  });
});
