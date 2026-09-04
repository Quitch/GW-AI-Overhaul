// The Galactic War local server mounts no mods on its own, and
// server-script/sim_utils.js validatePlanet waits forever on a
// /pa/terrain/<biome>.json it cannot load, so any biome outside this list
// hangs every player at loading unless a mod carries it in. See galaxy.md.
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
  // Who carries a provider into the battle. COOK: GWO mounts the zip itself and
  // cooks its JSON into the config files, so a disabled mod only costs the
  // planet its biome (earth instead). GWSM: GW Server Mods mounts the zip for
  // the local server, the only way a .papa gets there, so the war depends on
  // the mod and cannot be fought without it. See galaxy.md.
  var SERVICE = { COOK: "cook", GWSM: "gwsm" };

  var isStockBiome = function (biome) {
    return _.includes(STOCK_BIOMES, biome);
  };

  // Pooled systems have been through fixupPlanetConfig, which renames
  // planet.planet to planet.generator; default_systems.json and the server's
  // validatePlanet still read the pre-fixup `planet` key.
  var generatorOf = function (planet) {
    return planet && (planet.generator || planet.planet);
  };

  var planetBiome = function (planet) {
    return (generatorOf(planet) || {}).biome;
  };

  var systemBiomes = function (system) {
    return _.uniq(
      _.map((system && system.planets) || [], function (planet) {
        return String(planetBiome(planet));
      })
    );
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

  var normalizeIdentifier = function (identifier) {
    return _.isString(identifier) ? identifier.trim().toLowerCase() : "";
  };

  var sameMod = function (a, b) {
    return (
      normalizeIdentifier(a.identifier) === normalizeIdentifier(b.identifier)
    );
  };

  // The providers a system needs, deduplicated - the value stamped on a placed
  // system as gwoBiomeMods. GW Server Mods lower-cases identifiers and
  // Community Mods does not, so the same mod is matched across case.
  var modsFor = function (system, providers) {
    var served = providers || {};
    var mods = [];

    for (var biome of systemBiomes(system)) {
      var mod = served[biome];
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
  // row. GW Server Mods lower-cases `identifier` and keeps the installed case
  // as `rawIdentifier`; Community Mods mounts under the installed case and
  // spec:/ reads are path-sensitive, so the mount path is built from the raw
  // one.
  var recordFrom = function (mod) {
    var raw = mod.rawIdentifier || mod.identifier;

    return {
      identifier: mod.identifier,
      rawIdentifier: raw,
      installedPath: mod.installedPath,
      mountPath: mod.mountPath || "/server_mods/" + raw + "/",
      displayName: mod.displayName || mod.identifier,
      version: mod.version,
    };
  };

  // api.file.zip.catalog returns [{name, crc32, size}] (observed, PA 124673);
  // a bare path list and a wrapping object are accepted in case that changes.
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
      return isFile(entry) && _.startsWith(entry, "pa/");
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
      files: files,
      pureText: _.every(files, function (file) {
        return _.endsWith(file, ".json");
      }),
      biomes: biomes,
    };
  };

  // The one rule: text is always cooked, anything else needs GW Server Mods
  // (`gwsm`) to carry it, and without that it is no provider at all.
  var serviceFor = function (info, gwsm) {
    if (info.pureText) {
      return SERVICE.COOK;
    }
    return gwsm ? SERVICE.GWSM : undefined;
  };

  // A stamp written before `served` existed was always cooked.
  var serviceOf = function (record) {
    return (record && record.served) || SERVICE.COOK;
  };

  var isGwsmServed = function (record) {
    return serviceOf(record) === SERVICE.GWSM;
  };

  // First provider wins, so pass infos in the order the mods are prioritised.
  // The record stored is the mod plus `served`, which the stamp then carries.
  var providersFrom = function (infos, gwsm) {
    var providers = {};

    for (var info of infos || []) {
      var served = info && serviceFor(info, gwsm);
      if (!served) {
        continue;
      }
      var record = _.assign({}, info.mod, { served: served });
      for (var biome of info.biomes) {
        if (!_.has(providers, biome)) {
          providers[biome] = record;
        }
      }
    }
    return providers;
  };

  // The mods a war depends on: every GW Server Mods-served stamp across the
  // given stamp lists, once each, in the shape gwaio.races.mods uses.
  var gwsmMods = function (stampLists) {
    var mods = [];

    _.forEach(stampLists || [], function (stamps) {
      _.forEach(stamps || [], function (record) {
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

  var jsonEntries = function (entries) {
    return _.filter(underPa(entries), function (file) {
      return _.endsWith(file, ".json");
    });
  };

  return {
    STOCK_BIOMES: STOCK_BIOMES,
    FALLBACK_BIOME: FALLBACK_BIOME,
    SERVICE: SERVICE,
    isStockBiome: isStockBiome,
    generatorOf: generatorOf,
    planetBiome: planetBiome,
    systemBiomes: systemBiomes,
    unservableBiome: unservableBiome,
    modsFor: modsFor,
    recordFrom: recordFrom,
    catalogEntries: catalogEntries,
    catalogInfo: catalogInfo,
    serviceFor: serviceFor,
    serviceOf: serviceOf,
    isGwsmServed: isGwsmServed,
    providersFrom: providersFrom,
    gwsmMods: gwsmMods,
    jsonEntries: jsonEntries,
  };
});
