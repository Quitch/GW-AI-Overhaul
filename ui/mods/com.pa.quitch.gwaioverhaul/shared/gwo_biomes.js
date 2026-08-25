// The Galactic War local server mounts no mods, and server-script/sim_utils.js
// validatePlanet waits forever on a /pa/terrain/<biome>.json it cannot load, so
// any biome outside this list hangs every player at loading. See galaxy.md.
define(function () {
  var STOCK_BIOMES = [
    "1v1test",
    "asteroid",
    "black",
    "csg_debug",
    "desert",
    "earth",
    "gas",
    "ice_boss",
    "lava",
    "metal",
    "metal_boss",
    "moon",
    "sandbox",
    "sun",
    "tropical",
  ];
  var FALLBACK_BIOME = "earth";

  var isStockBiome = function (biome) {
    return _.includes(STOCK_BIOMES, biome);
  };

  // Pooled systems have been through fixupPlanetConfig; default_systems.json and
  // the server's validatePlanet still read the pre-fixup `planet` key.
  var planetBiome = function (planet) {
    var generator = (planet && (planet.generator || planet.planet)) || {};
    return generator.biome;
  };

  var systemBiomes = function (system) {
    var planets = (system && system.planets) || [];
    var biomes = [];

    for (var planet of planets) {
      var biome = String(planetBiome(planet));
      if (!_.includes(biomes, biome)) {
        biomes.push(biome);
      }
    }
    return biomes;
  };

  var unservableBiome = function (system, providers) {
    var served = providers || {};

    for (var biome of systemBiomes(system)) {
      if (!isStockBiome(biome) && !_.has(served, biome)) {
        return biome;
      }
    }
    return undefined;
  };

  return {
    STOCK_BIOMES: STOCK_BIOMES,
    FALLBACK_BIOME: FALLBACK_BIOME,
    isStockBiome: isStockBiome,
    planetBiome: planetBiome,
    systemBiomes: systemBiomes,
    unservableBiome: unservableBiome,
  };
});
