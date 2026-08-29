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

  // Which files of a brain's source tree make up the race's own tree. Titans
  // keeps only what the race mod ships (plus the brain's ai_config.json, which
  // has no fallback); a brain that carries the race itself keeps everything but
  // what it lists under `exclude`. The race's unit maps are never copied: they
  // are merged into the army's tagged map instead. See ai-paths.md.
  var treeFilter = function (raceId, brain, sourceRoot) {
    var race = byId(raceId);
    var brainKey = _.isString(brain) ? brain.toLowerCase() : "";
    var config = (race && race.ai && race.ai[brainKey]) || {};
    var unitMaps = config.unitMaps || [];
    var sources = config.sources || [];
    var exclude = config.exclude || [];
    var aiConfig = sourceRoot + "ai_config.json";
    // The engine lists unit_maps/ and loads each file it finds plus the army's
    // tag, so the tagged merged map is only read when its untagged namesake is
    // there to be listed. The brain's own map files fill that role.
    var baseMaps = [
      sourceRoot + "unit_maps/ai_unit_map.json",
      sourceRoot + "unit_maps/ai_unit_map_x1.json",
    ];

    var isUnitMap = function (filePath) {
      return _.some(unitMaps, function (map) {
        return filePath === map || _.endsWith(filePath, "/" + map);
      });
    };

    return function (filePath) {
      if (!race || race.id === MLA_ID || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (filePath === aiConfig || _.contains(baseMaps, filePath)) {
        return true;
      }

      if (isUnitMap(filePath) || _.includes(filePath, "/neural_networks/")) {
        return false;
      }

      if (sources.length) {
        return _.some(sources, function (source) {
          return (
            _.startsWith(filePath, source.dir) &&
            _.startsWith(filePath.slice(source.dir.length), source.match || "")
          );
        });
      }

      if (!exclude.length) {
        return false;
      }

      return !_.some(exclude, function (fragment) {
        return _.includes(filePath, fragment);
      });
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
    commanderFor: commanderFor,
    treeFilter: treeFilter,
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
