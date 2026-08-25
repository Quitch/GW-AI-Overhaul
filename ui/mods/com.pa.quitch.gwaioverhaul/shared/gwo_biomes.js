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

  // The providers a system needs, deduplicated - the value stamped on a placed
  // system as gwoBiomeMods.
  var modsFor = function (system, providers) {
    var served = providers || {};
    var mods = [];

    for (var biome of systemBiomes(system)) {
      var mod = served[biome];
      if (
        !isStockBiome(biome) &&
        mod &&
        !_.some(mods, { identifier: mod.identifier })
      ) {
        mods.push(mod);
      }
    }
    return mods;
  };

  // api.file.zip.catalog's shape is undocumented; accept a bare path list, a list
  // of entry objects, or an object wrapping either.
  var catalogEntries = function (catalog) {
    var list = catalog;

    if (list && !_.isArray(list)) {
      list = list.files || list.entries || list.catalog || [];
    }
    return _.compact(
      _.map(list || [], function (entry) {
        var path = _.isString(entry)
          ? entry
          : entry && (entry.path || entry.name || entry.file);
        return _.isString(path) ? path.replace(/^\.?\/+/, "") : undefined;
      })
    );
  };

  var isFile = function (entry) {
    return !_.endsWith(entry, "/");
  };

  var underPa = function (entries) {
    return _.filter(entries, function (entry) {
      return isFile(entry) && entry.slice(0, 3) === "pa/";
    });
  };

  var REGISTRY_FILES = ["brush_list", "feature_list", "decal_list"];

  var catalogInfo = function (mod, entries) {
    var files = underPa(entries);
    var biomes = [];

    for (var file of files) {
      var match = /^pa\/terrain\/([^/]+)\.json$/.exec(file);
      if (match && !_.includes(REGISTRY_FILES, match[1])) {
        biomes.push(match[1]);
      }
    }
    return {
      mod: mod,
      pureText: _.every(files, function (file) {
        return _.endsWith(file, ".json");
      }),
      biomes: biomes,
    };
  };

  // First provider wins, so pass infos in the order the mods are prioritised.
  var providersFrom = function (infos) {
    var providers = {};

    for (var info of infos || []) {
      if (!info || !info.pureText) {
        continue;
      }
      for (var biome of info.biomes) {
        if (!_.has(providers, biome)) {
          providers[biome] = info.mod;
        }
      }
    }
    return providers;
  };

  var jsonEntries = function (entries) {
    return _.filter(underPa(entries), function (file) {
      return _.endsWith(file, ".json");
    });
  };

  return {
    STOCK_BIOMES: STOCK_BIOMES,
    FALLBACK_BIOME: FALLBACK_BIOME,
    isStockBiome: isStockBiome,
    planetBiome: planetBiome,
    systemBiomes: systemBiomes,
    unservableBiome: unservableBiome,
    modsFor: modsFor,
    catalogEntries: catalogEntries,
    catalogInfo: catalogInfo,
    providersFrom: providersFrom,
    jsonEntries: jsonEntries,
  };
});
