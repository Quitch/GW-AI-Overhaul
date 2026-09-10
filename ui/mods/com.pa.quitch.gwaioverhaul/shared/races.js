// The race registry: what a unit faction is to Galactic War, and the pure
// arithmetic every race-aware caller routes through. No engine globals, no
// model - see races.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races_shipped.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/addons_shipped.js",
], function (unitCells, shipped, shippedAddons) {
  var MLA_ID = "mla";
  var TITANS = "Titans";

  // Which unit factions each AI brain has build orders for. Titans reads the
  // race mod's own files; Queller ships Legion beside MLA; Penchant is MLA only.
  var BRAINS = {
    Titans: "*",
    Queller: [MLA_ID, "legion"],
    Penchant: [MLA_ID],
  };

  var VANILLA_BIT = "Custom58";
  var VANILLA_UNIT_TYPE = "UNITTYPE_" + VANILLA_BIT;
  // The hue MLA's commander preview art ships in (blue team paint).
  var MLA_ART_HUE = 210;

  var registry = {};
  var order = [];
  // Add-ons: server mods that add units to races that exist rather than
  // being one. A separate registry; nothing here is ever MLA. See races.md,
  // "Add-ons".
  var addonRegistry = {};
  var addonOrder = [];
  // Capability-cell indexes by race id, built by race_cells.js once the specs
  // are read. See unit_cells.js.
  var cellsById = {};

  var normalizeId = function (id) {
    return _.isString(id) ? id.trim().toLowerCase() : "";
  };

  // `unitNames` names units by the keys of `units` and is compiled to
  // path -> name.
  var compileNames = function (units, unitNames) {
    var byPath = {};

    _.forEach(unitNames || {}, function (name, key) {
      if (!_.isUndefined(units[key])) {
        byPath[units[key]] = name;
      }
    });

    return byPath;
  };

  // `units` is the race's own table (race key -> race path), for cards
  // written for the race alone.
  var compile = function (descriptor) {
    var units = descriptor.units || {};

    return _.assign({}, descriptor, {
      id: normalizeId(descriptor.id),
      serverMods: _.map(descriptor.serverMods || [], normalizeId),
      commanders: descriptor.commanders || [],
      ai: descriptor.ai || {},
      units: units,
      unitNames: compileNames(units, descriptor.unitNames),
    });
  };

  // `layers` is { [raceId]: { [brainKey]: { unitMaps, sources } } }: the AI
  // files the add-on ships for each race, which join that race's layer.
  var compileAddon = function (descriptor) {
    var units = descriptor.units || {};

    return _.assign({}, descriptor, {
      id: normalizeId(descriptor.id),
      serverMods: _.map(descriptor.serverMods || [], normalizeId),
      layers: descriptor.layers || {},
      units: units,
      unitNames: compileNames(units, descriptor.unitNames),
    });
  };

  var MLA = compile({
    id: MLA_ID,
    name: "!LOC:MLA",
    serverMods: [],
    unitTypeBit: VANILLA_BIT,
    commanderTypes: {
      unitType: VANILLA_UNIT_TYPE,
      buildable: "CmdBuild & Custom58",
    },
    commanders: [],
    ai: {},
    units: {},
  });

  var register = function (descriptor) {
    var id = normalizeId(descriptor && descriptor.id);

    if (!id || id === MLA_ID) {
      throw new Error("gwoRaces: a race needs an id other than mla");
    }

    if (!registry[id]) {
      order.push(id);
    }

    registry[id] = compile(descriptor);

    return registry[id];
  };

  var byId = function (id) {
    var wanted = normalizeId(id);

    if (!wanted || wanted === MLA_ID) {
      return MLA;
    }

    return registry[wanted];
  };

  var all = function () {
    return [MLA].concat(
      _.map(order, function (id) {
        return registry[id];
      })
    );
  };

  var isMla = function (id) {
    var wanted = normalizeId(id);

    return !wanted || wanted === MLA_ID || !registry[wanted];
  };

  var hasServerMod = function (active, descriptor) {
    return _.some(descriptor.serverMods, function (identifier) {
      return _.contains(active, identifier);
    });
  };

  // The races whose server mod is active: any of the identifiers a race
  // lists, matched exactly. MLA is always present.
  var detect = function (activeIdentifiers) {
    var active = _.map(activeIdentifiers || [], normalizeId);

    return _.filter(all(), function (race) {
      return race.id === MLA_ID || hasServerMod(active, race);
    });
  };

  var registerAddon = function (descriptor) {
    var id = normalizeId(descriptor && descriptor.id);

    if (!id) {
      throw new Error("gwoRaces: an add-on needs an id");
    }

    if (!addonRegistry[id]) {
      addonOrder.push(id);
    }

    addonRegistry[id] = compileAddon(descriptor);

    return addonRegistry[id];
  };

  var addonById = function (id) {
    return addonRegistry[normalizeId(id)];
  };

  var addons = function () {
    return _.map(addonOrder, function (id) {
      return addonRegistry[id];
    });
  };

  var detectAddons = function (activeIdentifiers) {
    var active = _.map(activeIdentifiers || [], normalizeId);

    return _.filter(addons(), function (addon) {
      return hasServerMod(active, addon);
    });
  };

  // The faction bits a unit may carry and still belong to something: vanilla's
  // and every registered race's. A unit under any other Custom bit is
  // exclusive - built only by whatever's buildable_types names it. See
  // races.md, "Add-ons".
  var knownBits = function () {
    return _.uniq(
      [VANILLA_BIT].concat(_.filter(_.pluck(all(), "unitTypeBit"), _.isString))
    );
  };

  // Every add-on unit, as { path: true }: MLA's add-on index is these and
  // nothing else.
  var addonUnitPaths = function () {
    var paths = {};

    _.forEach(addons(), function (addon) {
      _.forEach(addon.units, function (path) {
        paths[path] = true;
      });
    });

    return paths;
  };

  var hasName = function (descriptor, path) {
    return (
      !!descriptor &&
      Object.prototype.hasOwnProperty.call(descriptor.unitNames, path)
    );
  };

  // A unit's display name: the race's, else any add-on's, else undefined for
  // the caller's own table.
  var unitName = function (raceId, path) {
    var race = byId(raceId);

    if (hasName(race, path)) {
      return race.unitNames[path];
    }

    var addon = _.find(addons(), function (candidate) {
      return hasName(candidate, path);
    });

    return addon ? addon.unitNames[path] : undefined;
  };

  var supportedBy = function (brain, raceId) {
    var supported = BRAINS[brain];

    if (isMla(raceId)) {
      return true;
    }

    return (
      supported === "*" || _.contains(supported || [], normalizeId(raceId))
    );
  };

  // The brain an army of this race actually runs: the war's, or Titans when
  // the war's has no build orders for the race. See races.md.
  var brainFor = function (brain, raceId) {
    return supportedBy(brain, raceId) ? brain : TITANS;
  };

  // The brains that support every race listed - the war picker's options.
  var brainsFor = function (raceIds) {
    return _.filter(_.keys(BRAINS), function (brain) {
      return _.every(raceIds || [], function (raceId) {
        return supportedBy(brain, raceId);
      });
    });
  };

  var setCells = function (raceId, index) {
    cellsById[normalizeId(raceId)] = index;
  };

  var cellsOf = function (raceId) {
    return cellsById[normalizeId(raceId)];
  };

  // A card is worth offering when the race owns something in a cell it names.
  // Until the race's cells are built, everything is offered rather than
  // nothing. See races.md.
  var cardUsable = function (raceId, cardUnits) {
    if (isMla(raceId) || _.isEmpty(cardUnits)) {
      return true;
    }

    var index = cellsOf(raceId);

    return (
      !index ||
      !index.race.units.length ||
      unitCells.cardUsable(cardUnits, index.vanilla, index.race)
    );
  };

  // An AI descriptor carries `race`; an inventory carries the global tag,
  // through getTag on the live GWInventory or as plain `tags` once serialised
  // into a co-op record.
  var raceOf = function (source) {
    if (!source) {
      return MLA_ID;
    }

    var id = source.race;

    if (_.isUndefined(id) && _.isFunction(source.getTag)) {
      id = source.getTag("global", "playerRace");
    }

    if (_.isUndefined(id) && _.isPlainObject(source.tags)) {
      id = source.tags.global && source.tags.global.playerRace;
    }

    return isMla(id) ? MLA_ID : normalizeId(id);
  };

  // A race's own build tree sits beside the brain's, never inside it:
  // /pa/ai/ -> /pa/ai_race_legion/, /pa/ai_queller/q_uber/ ->
  // /pa/ai_queller_race_legion/q_uber/. See ai-paths.md.
  var aiRoot = function (raceId, basePath) {
    if (isMla(raceId)) {
      return basePath;
    }

    return basePath.replace(
      /^(\/pa\/[^/]+)(\/|$)/,
      function (match, root, sep) {
        return root + "_race_" + normalizeId(raceId) + sep;
      }
    );
  };

  // A vanilla unit a race army keeps (the Colonel): the race's unit-type bit
  // in place of the vanilla one, so the race's builders may build it.
  var unitRetagMods = function (raceId, unitPath) {
    var race = byId(raceId);

    if (!race || race.id === MLA_ID || !race.commanderTypes) {
      return [];
    }

    return [
      {
        file: unitPath,
        path: "unit_types",
        op: "pull",
        value: [VANILLA_UNIT_TYPE],
      },
      {
        file: unitPath,
        path: "unit_types",
        op: "push",
        value: [race.commanderTypes.unitType],
      },
    ];
  };

  // A vanilla commander fielded by a race: the retag plus the race's build
  // list. See races.md.
  var commanderRetagMods = function (raceId, commanderPath) {
    var mods = unitRetagMods(raceId, commanderPath);

    if (!mods.length) {
      return mods;
    }

    return mods.concat([
      {
        file: commanderPath,
        path: "buildable_types",
        op: "replace",
        value: byId(raceId).commanderTypes.buildable,
      },
    ]);
  };

  var matchesSource = function (filePath, source) {
    return (
      _.startsWith(filePath, source.dir) &&
      _.startsWith(filePath.slice(source.dir.length), source.match || "")
    );
  };

  var brainKeyOf = function (brain) {
    return _.isString(brain) ? brain.toLowerCase() : "";
  };

  // Every layer a brain's merged source listing carries beside the base
  // files, by race id: each race's own `ai` block plus what every add-on
  // ships for that race under the brain, MLA's included. An add-on layer for
  // a race id nothing registered still appears - its files are not base
  // files either way. See races.md, "Add-ons".
  var layersFor = function (brainKey) {
    var layers = {};
    var add = function (raceId, config) {
      var layer = layers[raceId] || { unitMaps: [], sources: [] };

      layers[raceId] = {
        unitMaps: layer.unitMaps.concat((config && config.unitMaps) || []),
        sources: layer.sources.concat((config && config.sources) || []),
      };
    };

    _.forEach(all(), function (race) {
      add(race.id, race.ai && race.ai[brainKey]);
    });
    _.forEach(addons(), function (addon) {
      _.forEach(addon.layers, function (brains, raceId) {
        add(normalizeId(raceId), brains && brains[brainKey]);
      });
    });

    return layers;
  };

  var layerClaims = function (layer, filePath) {
    return (
      _.contains(layer.unitMaps, filePath) ||
      _.some(layer.sources, function (source) {
        return matchesSource(filePath, source);
      })
    );
  };

  // The parsed `ai` block a brain's tree filters read for a race, plus the
  // path constants they share.
  var treeConfig = function (raceId, brain, sourceRoot) {
    var race = byId(raceId);
    var brainKey = brainKeyOf(brain);
    var config = (race && race.ai && race.ai[brainKey]) || {};

    return {
      race: race,
      brainKey: brainKey,
      sources: config.sources || [],
      exclude: config.exclude || [],
      aiConfig: sourceRoot + "ai_config.json",
      mapsDir: sourceRoot + "unit_maps/",
      // The engine lists unit_maps/ and loads each file it finds plus the
      // army's tag, so the tagged merged map is only read when its untagged
      // namesake is there to be listed. The brain's own map files fill that
      // role.
      baseMaps: [
        sourceRoot + "unit_maps/ai_unit_map.json",
        sourceRoot + "unit_maps/ai_unit_map_x1.json",
      ],
    };
  };

  // Which files of a brain's source tree make up the race's own tree. See
  // races.md, "Race trees".
  var treeFilter = function (raceId, brain, sourceRoot) {
    var c = treeConfig(raceId, brain, sourceRoot);
    var layers = layersFor(c.brainKey);
    // The race's own layer is its `ai` block plus its add-ons'; every other
    // layer, MLA's add-ons included, is subtracted from the base. A file two
    // layers claim (Second Wave's aux map) is the race's when its own does.
    var own = (c.race && layers[c.race.id]) || { unitMaps: [], sources: [] };
    var otherSources = _.flatten(
      _.map(_.omit(layers, c.race ? c.race.id : ""), "sources")
    );

    var isUnitMap = function (filePath) {
      return _.some(own.unitMaps, function (map) {
        return filePath === map || _.endsWith(filePath, "/" + map);
      });
    };

    return function (filePath) {
      if (!c.race || c.race.id === MLA_ID || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (filePath === c.aiConfig || _.contains(c.baseMaps, filePath)) {
        return true;
      }

      if (isUnitMap(filePath) || _.includes(filePath, "/neural_networks/")) {
        return false;
      }

      if (own.sources.length) {
        if (
          _.some(own.sources, function (source) {
            return matchesSource(filePath, source);
          })
        ) {
          return true;
        }

        // No untagged stray may reach unit_maps/ - the engine would load it
        // with the army's tag appended.
        if (_.startsWith(filePath, c.mapsDir)) {
          return false;
        }

        // The base layer: whatever no other layer claims.
        return !_.some(otherSources, function (source) {
          return matchesSource(filePath, source);
        });
      }

      if (!c.exclude.length) {
        return false;
      }

      return !_.some(c.exclude, function (fragment) {
        return _.includes(filePath, fragment);
      });
    };
  };

  // Whether the race mod itself put this file in the tree - the base layer
  // does not count. The referee warns when nothing matches: no race files in
  // the merged listing means the race's server mod is not mounted.
  var raceLayerFilter = function (raceId, brain, sourceRoot) {
    var c = treeConfig(raceId, brain, sourceRoot);
    var keep = treeFilter(raceId, brain, sourceRoot);

    return function (filePath) {
      if (!c.race || c.race.id === MLA_ID || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (c.sources.length) {
        return _.some(c.sources, function (source) {
          return matchesSource(filePath, source);
        });
      }

      if (!c.exclude.length) {
        return false;
      }

      // A brain that carries the race itself: the tier's own data files, not
      // the config and map boilerplate every tree keeps.
      return (
        keep(filePath) &&
        filePath !== c.aiConfig &&
        !_.contains(c.baseMaps, filePath)
      );
    };
  };

  // Every brain key any descriptor names a layer for.
  var brainKeys = function () {
    return _.uniq(
      _.flatten(
        _.map(all(), function (race) {
          return _.keys(race.ai || {});
        }).concat(
          _.map(addons(), function (addon) {
            return _.flatten(_.map(addon.layers, _.keys));
          })
        )
      )
    );
  };

  // Whether a race's layer claims this file and MLA's does not: a race mod's
  // own build files or unit map, or an add-on's files for a race, under any
  // brain, in the merged listing. An MLA tree is the brain's base files plus
  // MLA's add-on files, so referee_ai.js's sweep drops these and keeps the
  // rest - an add-on map both MLA and a race claim rides along untagged. A
  // relative unit map names a file the brain ships itself, never a race
  // mod's, and matches nothing here.
  var inAnyRaceLayer = function (filePath) {
    var mla = false;
    var other = false;

    _.forEach(brainKeys(), function (brainKey) {
      _.forEach(layersFor(brainKey), function (layer, raceId) {
        if (layerClaims(layer, filePath)) {
          if (raceId === MLA_ID) {
            mla = true;
          } else {
            other = true;
          }
        }
      });
    });

    return other && !mla;
  };

  // The race's unit map files for a brain, its add-ons' included, absolute.
  // None for MLA: an MLA army's unit_maps/ is the live listing, where an
  // add-on's map already sits untagged, so nothing is merged for it.
  var unitMapsFor = function (raceId, brain, sourceRoot) {
    var race = byId(raceId);

    if (!race || race.id === MLA_ID) {
      return [];
    }

    var layer = layersFor(brainKeyOf(brain))[race.id];

    return _.map(layer.unitMaps, function (map) {
      return _.startsWith(map, "/") ? map : sourceRoot + map;
    });
  };

  // The hue a race's commander preview art ships in, for the picker's tint.
  var commanderArtHue = function (raceId) {
    var race = byId(raceId);
    var hue = race && race.commanderArtHue;

    return _.isNumber(hue) ? hue : MLA_ART_HUE;
  };

  var isRaceCommander = function (raceId, commanderPath) {
    var race = byId(raceId);

    return (
      !!race &&
      _.some(race.commanders, function (commander) {
        return commander.spec === commanderPath;
      })
    );
  };

  // The spec mods a race army needs for its commander: none for one of the
  // race's own, the retag for a vanilla one it keeps (Pumpkin, Unicorn).
  var commanderModsFor = function (raceId, commanderPath) {
    if (
      isMla(raceId) ||
      !_.isString(commanderPath) ||
      isRaceCommander(raceId, commanderPath)
    ) {
      return [];
    }

    return commanderRetagMods(raceId, commanderPath);
  };

  var commanderFor = function (rng, raceId) {
    var race = byId(raceId);

    if (!race || !race.commanders.length) {
      return undefined;
    }

    var chosen = rng ? rng.pick(race.commanders) : _.sample(race.commanders);

    return chosen && chosen.spec;
  };

  // One race per faction. Independent draws by default; `unique` draws without
  // replacement until the pool is spent, then refills it, and `taken` (races
  // already in play) count as drawn in the first pass. See galaxy.md.
  var assign = function (rng, factionIds, pool, options) {
    var unique = !!(options && options.unique);
    var taken = _.map((options && options.taken) || [], normalizeId);
    var choices = _.filter(_.map(pool || [], normalizeId), function (id) {
      return id.length;
    });
    var result = {};
    var remaining = [];

    if (!choices.length) {
      choices = [MLA_ID];
    }

    // A refill is the whole pool, so a taken race is reused only once every
    // other race has been.
    var firstPass = _.difference(choices, taken);
    var passes = unique && firstPass.length ? [firstPass] : [];

    _.forEach(factionIds || [], function (factionId) {
      if (!unique) {
        result[factionId] = rng.pick(choices);
        return;
      }

      if (!remaining.length) {
        remaining = rng.shuffle(
          passes.length ? passes.shift() : choices.slice()
        );
      }

      result[factionId] = remaining.shift();
    });

    return result;
  };

  // Registered as this module loads, so every module that depends on it sees
  // the shipped races at once - the war panel reads them before any scene
  // script's requireGW callback has run. Third-party races arrive through
  // race_mods.js. See races.md.
  var registerShipped = function () {
    _.forEach(shipped, function (descriptor) {
      try {
        register(descriptor);
      } catch (e) {
        console.error(
          "gwoRaces: shipped race not registered: " + (e.message || e)
        );
      }
    });
    _.forEach(shippedAddons, function (descriptor) {
      try {
        registerAddon(descriptor);
      } catch (e) {
        console.error(
          "gwoRaces: shipped add-on not registered: " + (e.message || e)
        );
      }
    });
  };

  registerShipped();

  return {
    MLA_ID: MLA_ID,
    TITANS: TITANS,
    BRAINS: BRAINS,
    register: register,
    normalizeId: normalizeId,
    byId: byId,
    all: all,
    isMla: isMla,
    detect: detect,
    registerAddon: registerAddon,
    addonById: addonById,
    addons: addons,
    detectAddons: detectAddons,
    knownBits: knownBits,
    addonUnitPaths: addonUnitPaths,
    unitName: unitName,
    layersFor: layersFor,
    supportedBy: supportedBy,
    brainFor: brainFor,
    brainsFor: brainsFor,
    setCells: setCells,
    cellsOf: cellsOf,
    cardUsable: cardUsable,
    raceOf: raceOf,
    aiRoot: aiRoot,
    unitRetagMods: unitRetagMods,
    commanderRetagMods: commanderRetagMods,
    commanderModsFor: commanderModsFor,
    isRaceCommander: isRaceCommander,
    commanderArtHue: commanderArtHue,
    commanderFor: commanderFor,
    treeFilter: treeFilter,
    raceLayerFilter: raceLayerFilter,
    inAnyRaceLayer: inAnyRaceLayer,
    unitMapsFor: unitMapsFor,
    assign: assign,
    // Test-only: a registered race outlives the module, and the harness loads
    // each module once per process.
    reset: function () {
      registry = {};
      order = [];
      addonRegistry = {};
      addonOrder = [];
      cellsById = {};
    },
    registerShipped: registerShipped,
  };
});
