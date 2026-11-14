"use strict";

// The shipped system pools' flat systems: one per group, each a lone starting
// planet whose slab the server accepts as drawn. See galaxy.md, "Flat planets".

const path = require("node:path");
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  REPO_ROOT,
  loadCouiModule,
  registerModuleStub,
} = require("../scripts/lib/amd-loader.js");

// Stock's random planet list, which no flat system draws from.
registerModuleStub("main/game/galactic_war/shared/js/systems/planets", {
  planets: [],
});

const SYSTEMS = path.join(
  REPO_ROOT,
  "ui",
  "main",
  "game",
  "galactic_war",
  "shared",
  "js",
  "systems"
);
const flatPlanets = loadCouiModule(
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_flat_planets.js"
);
// The server's clamp on a slab's sides.
const MIN_SIDE = 200;
const MAX_SIDE = 20000;

const POOLS = {
  "titans-normal": loadCouiModule(path.join(SYSTEMS, "titans-normal.js")),
  "titans-easy": loadCouiModule(path.join(SYSTEMS, "titans-easy.js")),
};

for (const [name, groups] of Object.entries(POOLS)) {
  describe(name + " flat systems", () => {
    for (const group of groups) {
      const label = "[" + group.Players.join(", ") + "]";
      const flat = group.Systems.filter(flatPlanets.systemHasFlat);

      it(label + " holds exactly one", () => {
        assert.equal(flat.length, 1);
      });

      it(label + " is a single starting planet", () => {
        assert.equal(flat[0].Planets.length, 1);
        assert.equal(flat[0].Planets[0].starting_planet, true);
      });

      it(label + " is neither gas nor metal", () => {
        const biomes = flat[0].Planets[0].Biomes;
        assert.ok(biomes.length > 0);
        assert.ok(!biomes.includes("gas"));
        assert.ok(!biomes.includes("metal"));
      });

      it(
        label + " has sides the server takes, no further apart than 3:2",
        () => {
          const planet = flat[0].Planets[0];
          for (const range of [planet.Width, planet.Length]) {
            assert.ok(range[0] <= range[1]);
            assert.ok(range[0] >= MIN_SIDE && range[1] <= MAX_SIDE);
          }
          const widest = Math.max(planet.Width[1], planet.Length[1]);
          const narrowest = Math.min(planet.Width[0], planet.Length[0]);
          assert.ok(widest / narrowest <= 1.5, widest + " / " + narrowest);
        }
      );
    }
  });
}
