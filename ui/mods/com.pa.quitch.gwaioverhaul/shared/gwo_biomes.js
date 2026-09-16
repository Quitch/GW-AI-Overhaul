// The Galactic War local server mounts no mods on its own, and
// server-script/sim_utils.js validatePlanet waits forever on a
// /pa/terrain/<biome>.json it cannot load, so any biome outside this list
// hangs every player at loading unless a mod carries it in. See galaxy.md.
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
  // Who carries a provider into the battle: GWO cooks its JSON into the config
  // files, or GW Server Mods mounts the zip for the local server. See
  // galaxy.md, "Biome mods in a GW battle".
  const SERVICE = { COOK: "cook", GWSM: "gwsm" };

  const isStockBiome = (biome) => _.includes(STOCK_BIOMES, biome);

  // Pooled systems have been through fixupPlanetConfig, which renames
  // planet.planet to planet.generator; default_systems.json and the server's
  // validatePlanet still read the pre-fixup `planet` key.
  const generatorOf = (planet) => planet && (planet.generator || planet.planet);

  const planetBiome = (planet) => (generatorOf(planet) || {}).biome;

  const systemBiomes = (system) =>
    _.uniq(
      _.map((system && system.planets) || [], (planet) =>
        String(planetBiome(planet)),
      ),
    );

  const unservableBiome = (system, providers) => {
    const served = providers || {};

    for (const biome of systemBiomes(system)) {
      if (!isStockBiome(biome) && !_.has(served, biome)) {
        return biome;
      }
    }
    return undefined;
  };

  const normalizeIdentifier = (identifier) =>
    _.isString(identifier) ? identifier.trim().toLowerCase() : "";

  const sameMod = (a, b) =>
    normalizeIdentifier(a.identifier) === normalizeIdentifier(b.identifier);

  // The providers a system needs, deduplicated - the value stamped on a placed
  // system as gwoBiomeMods. GW Server Mods lower-cases identifiers and
  // Community Mods does not, so the same mod is matched across case.
  const modsFor = (system, providers) => {
    const served = providers || {};
    const mods = [];

    for (const biome of systemBiomes(system)) {
      const mod = served[biome];
      if (
        !isStockBiome(biome) &&
        mod &&
        !_.some(mods, _.partial(sameMod, mod))
      ) {
        mods.push(mod);
      }
    }
    return mods;
  };

  // A provider record from a manifest row (GW Server Mods) or a Community Mods
  // row. The mount path is built from `rawIdentifier`, the installed case,
  // not the lower-cased `identifier`. See galaxy.md, "Biome mods in a GW
  // battle".
  const recordFrom = (mod) => {
    const raw = mod.rawIdentifier || mod.identifier;

    return {
      identifier: mod.identifier,
      rawIdentifier: raw,
      installedPath: mod.installedPath,
      mountPath: mod.mountPath || `/server_mods/${raw}/`,
      displayName: mod.displayName || mod.identifier,
      version: mod.version,
    };
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
    _.filter(entries, (entry) => isFile(entry) && _.startsWith(entry, "pa/"));

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

  // The one rule: text is always cooked, anything else needs GW Server Mods
  // (`gwsm`) to carry it, and without that it is no provider at all.
  const serviceFor = (info, gwsm) => {
    if (info.pureText) {
      return SERVICE.COOK;
    }
    return gwsm ? SERVICE.GWSM : undefined;
  };

  // A stamp written before `served` existed was always cooked.
  const serviceOf = (record) => (record && record.served) || SERVICE.COOK;

  const isGwsmServed = (record) => serviceOf(record) === SERVICE.GWSM;

  // First provider wins, so pass infos in the order the mods are prioritised.
  // The record stored is the mod plus `served`, which the stamp then carries.
  const providersFrom = (infos, gwsm) => {
    const providers = {};

    for (const info of infos || []) {
      const served = info && serviceFor(info, gwsm);
      if (!served) {
        continue;
      }
      const record = Object.assign({}, info.mod, { served });
      for (const biome of info.biomes) {
        if (!_.has(providers, biome)) {
          providers[biome] = record;
        }
      }
    }
    return providers;
  };

  // The mods a war depends on: every GW Server Mods-served stamp across the
  // given stamp lists, once each, in the shape gwaio.races.mods uses.
  const gwsmMods = (stampLists) => {
    const mods = [];

    _.forEach(stampLists || [], (stamps) => {
      _.forEach(stamps || [], (record) => {
        if (isGwsmServed(record) && !_.some(mods, _.partial(sameMod, record))) {
          mods.push({
            identifier: record.identifier,
            displayName: record.displayName || record.identifier,
            version: record.version,
          });
        }
      });
    });
    return mods;
  };

  const jsonEntries = (entries) =>
    _.filter(underPa(entries), (file) => _.endsWith(file, ".json"));

  return {
    STOCK_BIOMES,
    FALLBACK_BIOME,
    SERVICE,
    isStockBiome,
    generatorOf,
    planetBiome,
    systemBiomes,
    unservableBiome,
    modsFor,
    recordFrom,
    catalogEntries,
    catalogInfo,
    serviceFor,
    serviceOf,
    isGwsmServed,
    providersFrom,
    gwsmMods,
    jsonEntries,
  };
});
