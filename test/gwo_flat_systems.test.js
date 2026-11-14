"use strict";

// gw_start/gwo_flat_systems.js: one flat system per group of the set it joins,
// each a lone starting planet whose slab the server accepts as drawn. See
// galaxy.md, "Flat planets".

const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  MOD_ROOT,
  REPO_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");

// Stock's random planet list, which GWO's titans-normal.js draws from.
registerModuleStub("main/game/galactic_war/shared/js/systems/planets", {
  planets: [],
});

const flatSystems = loadCouiModule(MOD_ROOT + "/gw_start/gwo_flat_systems.js");
const flatPlanets = loadCouiModule(MOD_ROOT + "/shared/gwo_flat_planets.js");
const titansNormal = loadCouiModule(
  path.join(
    REPO_ROOT,
    "ui/main/game/galactic_war/shared/js/systems/titans-normal.js"
  )
);
// The server's clamp on a slab's sides.
const MIN_SIDE = 200;
const MAX_SIDE = 20000;
// Stock titans-easy.js's groups, which CI cannot read: [0,2] and [3,100].
const STOCK_EASY_GROUPS = 2;

describe("gwo_flat_systems group counts", () => {
  it("has one system for each group of GWO's titans-normal.js", () => {
    assert.equal(flatSystems.titansNormal.length, titansNormal.length);
  });

  it("has one system for each group of stock titans-easy.js", () => {
    assert.equal(flatSystems.titansEasy.length, STOCK_EASY_GROUPS);
  });
});

for (const set of ["titansNormal", "titansEasy"]) {
  describe("gwo_flat_systems " + set, () => {
    flatSystems[set].forEach((system, index) => {
      const label = "group " + index;
      const planet = system.Planets[0];

      it(
        label + " is a single starting planet the converter makes flat",
        () => {
          assert.equal(system.Planets.length, 1);
          assert.equal(planet.starting_planet, true);
          assert.equal(flatPlanets.templateIsFlat(planet), true);
        }
      );

      it(label + " is neither gas nor metal", () => {
        assert.ok(planet.Biomes.length > 0);
        assert.ok(!planet.Biomes.includes("gas"));
        assert.ok(!planet.Biomes.includes("metal"));
      });

      it(label + " has sides the server takes, within 3:2", () => {
        for (const range of [planet.Width, planet.Length]) {
          assert.ok(range[0] <= range[1]);
          assert.ok(range[0] >= MIN_SIDE && range[1] <= MAX_SIDE);
        }
        const widest = Math.max(planet.Width[1], planet.Length[1]);
        const narrowest = Math.min(planet.Width[0], planet.Length[0]);
        assert.ok(widest / narrowest <= 1.5, widest + " / " + narrowest);
      });
    });
  });
}
