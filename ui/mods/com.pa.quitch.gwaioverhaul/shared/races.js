// The race registry: what a unit faction is to Galactic War, and the pure
// arithmetic every race-aware caller routes through. No engine globals, no
// model - see races.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races_shipped.js",
], function (unitCells, shipped) {
  var MLA_ID = "mla";
  var TITANS = "Titans";

  // Which unit factions each AI brain has build orders for. Titans reads the
  // race mod's own files; Queller ships Legion beside MLA; Penchant is MLA only.
  var BRAINS = {
    Titans: "*",
    Queller: [MLA_ID, "legion"],
    Penchant: [MLA_ID],
  };

  var VANILLA_UNIT_TYPE = "UNITTYPE_Custom58";
  // The hue MLA's commander preview art ships in (blue team paint).
  var MLA_ART_HUE = 210;

  var registry = {};
  var order = [];
  // Capability-cell indexes by race id, built by race_cells.js once the specs
  // are read. See unit_cells.js.
  var cellsById = {};

  var normalizeId = function (id) {
    return _.isString(id) ? id.trim().toLowerCase() : "";
  };

  var normalizeIdentifier = function (identifier) {
    return _.isString(identifier) ? identifier.trim().toLowerCase() : "";
  };

  // `units` is the race's own table (race key -> race path), for cards
  // written for the race alone; `unitNames` names them by the same keys and
  // is compiled to path -> name.
  var compile = function (descriptor) {
    var units = descriptor.units || {};
    var unitNames = {};

    _.forEach(descriptor.unitNames || {}, function (name, raceKey) {
      if (!_.isUndefined(units[raceKey])) {
        unitNames[units[raceKey]] = name;
      }
    });

    return _.assign({}, descriptor, {
      id: normalizeId(descriptor.id),
      serverMods: _.map(descriptor.serverMods || [], normalizeIdentifier),
      commanders: descriptor.commanders || [],
      ai: descriptor.ai || {},
      units: units,
      unitNames: unitNames,
    });
  };

  var MLA = compile({
    id: MLA_ID,
    name: "!LOC:MLA",
    serverMods: [],
    unitTypeBit: "Custom58",
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

  // The races whose server mod is active: any one of the identifiers a race
  // lists (a mod's -dev build counts). MLA is always present.
  var detect = function (activeIdentifiers) {
    var active = _.map(activeIdentifiers || [], normalizeIdentifier);

    return _.filter(all(), function (race) {
      return (
        race.id === MLA_ID ||
        _.some(race.serverMods, function (identifier) {
          return _.contains(active, identifier);
        })
      );
    });
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

  // Every registered race's layer for a brain: what the merged source listing
  // carries beside the base files while those race mods are mounted.
  var allSourcesFor = function (brainKey) {
    return _.flatten(
      _.map(all(), function (race) {
        var config = (race.ai && race.ai[brainKey]) || {};

        return config.sources || [];
      })
    );
  };

  // The parsed `ai` block a brain's tree filters read for a race, plus the
  // path constants they share.
  var treeConfig = function (raceId, brain, sourceRoot) {
    var race = byId(raceId);
    var brainKey = _.isString(brain) ? brain.toLowerCase() : "";
    var config = (race && race.ai && race.ai[brainKey]) || {};

    return {
      race: race,
      brainKey: brainKey,
      unitMaps: config.unitMaps || [],
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

  // Which files of a brain's source tree make up the race's own tree. Titans
  // layers the race mod's `sources` files over the brain's base tree - the
  // source listing is the merged filesystem, so a race file shadowing a base
  // path already reads as the race's - minus every registered race's layer
  // and everything under unit_maps/ but the brain's own maps. A brain that
  // carries the race itself keeps everything but what it lists under
  // `exclude`. The race's unit maps are never copied: they are merged into
  // the army's tagged map instead. See ai-paths.md.
  var treeFilter = function (raceId, brain, sourceRoot) {
    var c = treeConfig(raceId, brain, sourceRoot);
    var everyRaceSources = allSourcesFor(c.brainKey);

    var isUnitMap = function (filePath) {
      return _.some(c.unitMaps, function (map) {
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

      if (c.sources.length) {
        if (
          _.some(c.sources, function (source) {
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

        // The base layer: whatever no registered race's layer claims.
        return !_.some(everyRaceSources, function (source) {
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

  // The race's unit map files for a brain, absolute.
  var unitMapsFor = function (raceId, brain, sourceRoot) {
    var race = byId(raceId);
    var brainKey = _.isString(brain) ? brain.toLowerCase() : "";
    var config = (race && race.ai && race.ai[brainKey]) || {};

    return _.map(config.unitMaps || [], function (map) {
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
  // replacement until the pool is spent, then refills it. See galaxy.md.
  var assign = function (rng, factionIds, pool, options) {
    var unique = !!(options && options.unique);
    var choices = _.filter(_.map(pool || [], normalizeId), function (id) {
      return id.length;
    });
    var result = {};
    var remaining = [];

    if (!choices.length) {
      choices = [MLA_ID];
    }

    _.forEach(factionIds || [], function (factionId) {
      if (!unique) {
        result[factionId] = rng.pick(choices);
        return;
      }

      if (!remaining.length) {
        remaining = rng.shuffle(choices.slice());
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
    unitMapsFor: unitMapsFor,
    assign: assign,
    // Test-only: a registered race outlives the module, and the harness loads
    // each module once per process.
    reset: function () {
      registry = {};
      order = [];
      cellsById = {};
    },
    registerShipped: registerShipped,
  };
});
