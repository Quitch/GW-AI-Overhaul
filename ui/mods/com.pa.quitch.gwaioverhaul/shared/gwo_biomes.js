// The Galactic War local server mounts no mods, and server-script/sim_utils.js
// validatePlanet waits forever on a /pa/terrain/<biome>.json it cannot load, so
// any biome outside this list hangs every player at loading. See galaxy.md.
define(() => {
  const STOCK_BIOMES = [
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
  const FALLBACK_BIOME = "earth";

  const isStockBiome = (biome) => _.includes(STOCK_BIOMES, biome);

  // Pooled systems have been through fixupPlanetConfig; default_systems.json and
  // the server's validatePlanet still read the pre-fixup `planet` key.
  const planetBiome = (planet) => {
    const generator = (planet && (planet.generator || planet.planet)) || {};
    return generator.biome;
  };

  const systemBiomes = (system) => {
    const planets = (system && system.planets) || [];
    const biomes = [];

    for (const planet of planets) {
      const biome = String(planetBiome(planet));
      if (!_.includes(biomes, biome)) {
        biomes.push(biome);
      }
    }
    return biomes;
  };

  const unservableBiome = (system, providers) => {
    const served = providers || {};

    for (const biome of systemBiomes(system)) {
      if (!isStockBiome(biome) && !_.has(served, biome)) {
        return biome;
      }
    }
    return undefined;
  };

  // The providers a system needs, deduplicated - the value stamped on a placed
  // system as gwoBiomeMods.
  const modsFor = (system, providers) => {
    const served = providers || {};
    const mods = [];

    for (const biome of systemBiomes(system)) {
      const mod = served[biome];
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

  // api.file.zip.catalog returns [{name, crc32, size}] (observed, PA 124673);
  // a bare path list and a wrapping object are accepted in case that changes.
  const catalogEntries = (catalog) => {
    let list = catalog;

    if (list && !Array.isArray(list)) {
      list = list.files || list.entries || list.catalog || [];
    }
    return _.compact(
      _.map(list || [], (entry) => {
        const path = _.isString(entry)
          ? entry
          : entry && (entry.path || entry.name || entry.file);
        return _.isString(path) ? path.replace(/^\.?\/+/, "") : undefined;
      }),
    );
  };

  const isFile = (entry) => !_.endsWith(entry, "/");

  const underPa = (entries) =>
    _.filter(entries, (entry) => isFile(entry) && entry.slice(0, 3) === "pa/");

  const REGISTRY_FILES = ["brush_list", "feature_list", "decal_list"];

  const catalogInfo = (mod, entries) => {
    const files = underPa(entries);
    const biomes = [];

    for (const file of files) {
      const match = /^pa\/terrain\/([^/]+)\.json$/.exec(file);
      if (match && !_.includes(REGISTRY_FILES, match[1])) {
        biomes.push(match[1]);
      }
    }
    return {
      mod,
      files,
      pureText: _.every(files, (file) => _.endsWith(file, ".json")),
      biomes,
    };
  };

  // First provider wins, so pass infos in the order the mods are prioritised.
  const providersFrom = (infos) => {
    const providers = {};

    for (const info of infos || []) {
      if (!info || !info.pureText) {
        continue;
      }
      for (const biome of info.biomes) {
        if (!_.has(providers, biome)) {
          providers[biome] = info.mod;
        }
      }
    }
    return providers;
  };

  const jsonEntries = (entries) =>
    _.filter(underPa(entries), (file) => _.endsWith(file, ".json"));

  return {
    STOCK_BIOMES,
    FALLBACK_BIOME,
    isStockBiome,
    planetBiome,
    systemBiomes,
    unservableBiome,
    modsFor,
    catalogEntries,
    catalogInfo,
    providersFrom,
    jsonEntries,
  };
});
