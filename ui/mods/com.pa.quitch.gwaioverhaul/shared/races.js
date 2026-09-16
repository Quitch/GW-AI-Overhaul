// The race registry: what a unit faction is to Galactic War, and the pure
// arithmetic every race-aware caller routes through. No engine globals, no
// model - see races.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races_shipped.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/addons_shipped.js",
], (unitCells, shipped, shippedAddons) => {
  const MLA_ID = "mla";
  const TITANS = "Titans";

  // Which unit factions each AI brain has build orders for. Titans reads the
  // race mod's own files; Queller ships Legion beside MLA; Penchant is MLA only.
  const BRAINS = {
    Titans: "*",
    Queller: [MLA_ID, "legion"],
    Penchant: [MLA_ID],
  };

  const VANILLA_BIT = "Custom58";
  const VANILLA_UNIT_TYPE = `UNITTYPE_${VANILLA_BIT}`;
  // The hue MLA's commander preview art ships in (blue team paint).
  const MLA_ART_HUE = 210;

  let registry = {};
  let order = [];
  // Add-ons: server mods that add units to races that exist rather than
  // being one. A separate registry; nothing here is ever MLA. See races.md,
  // "Add-ons".
  let addonRegistry = {};
  let addonOrder = [];
  // Capability-cell indexes by race id, built by race_cells.js once the specs
  // are read. See unit_cells.js.
  let cellsById = {};

  const normalizeId = (id) => (_.isString(id) ? id.trim().toLowerCase() : "");

  // `unitNames` names units by the keys of `units` and is compiled to
  // path -> name.
  const compileNames = (units, unitNames) => {
    const byPath = {};

    _.forEach(unitNames || {}, (name, key) => {
      if (!_.isUndefined(units[key])) {
        byPath[units[key]] = name;
      }
    });

    return byPath;
  };

  // `units` is the race's own table (race key -> race path), for cards
  // written for the race alone.
  const compile = (descriptor) => {
    const units = descriptor.units || {};

    return Object.assign({}, descriptor, {
      id: normalizeId(descriptor.id),
      serverMods: _.map(descriptor.serverMods || [], normalizeId),
      commanders: descriptor.commanders || [],
      ai: descriptor.ai || {},
      units,
      unitNames: compileNames(units, descriptor.unitNames),
    });
  };

  // `layers` is { [raceId]: { [brainKey]: { unitMaps, sources } } }: the AI
  // files the add-on ships for each race, which join that race's layer.
  const compileAddon = (descriptor) => {
    const units = descriptor.units || {};

    return Object.assign({}, descriptor, {
      id: normalizeId(descriptor.id),
      serverMods: _.map(descriptor.serverMods || [], normalizeId),
      layers: descriptor.layers || {},
      units,
      unitNames: compileNames(units, descriptor.unitNames),
    });
  };

  const MLA = compile({
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

  const register = (descriptor) => {
    const id = normalizeId(descriptor && descriptor.id);

    if (!id || id === MLA_ID) {
      throw new Error("gwoRaces: a race needs an id other than mla");
    }

    if (!registry[id]) {
      order.push(id);
    }

    registry[id] = compile(descriptor);

    return registry[id];
  };

  const byId = (id) => {
    const wanted = normalizeId(id);

    if (!wanted || wanted === MLA_ID) {
      return MLA;
    }

    return registry[wanted];
  };

  const all = () => [MLA].concat(_.map(order, (id) => registry[id]));

  const isMla = (id) => {
    const wanted = normalizeId(id);

    return !wanted || wanted === MLA_ID || !registry[wanted];
  };

  const hasServerMod = (active, descriptor) =>
    _.some(descriptor.serverMods, (identifier) =>
      _.includes(active, identifier),
    );

  // The races whose server mod is active: any of the identifiers a race
  // lists, matched exactly. MLA is always present.
  const detect = (activeIdentifiers) => {
    const active = _.map(activeIdentifiers || [], normalizeId);

    return _.filter(
      all(),
      (race) => race.id === MLA_ID || hasServerMod(active, race),
    );
  };

  const registerAddon = (descriptor) => {
    const id = normalizeId(descriptor && descriptor.id);

    if (!id) {
      throw new Error("gwoRaces: an add-on needs an id");
    }

    if (!addonRegistry[id]) {
      addonOrder.push(id);
    }

    addonRegistry[id] = compileAddon(descriptor);

    return addonRegistry[id];
  };

  const addonById = (id) => addonRegistry[normalizeId(id)];

  const addons = () => _.map(addonOrder, (id) => addonRegistry[id]);

  const detectAddons = (activeIdentifiers) => {
    const active = _.map(activeIdentifiers || [], normalizeId);

    return _.filter(addons(), (addon) => hasServerMod(active, addon));
  };

  // The faction bits a unit may carry and still belong to something: vanilla's
  // and every registered race's. A unit under any other Custom bit is
  // exclusive - built only by whatever's buildable_types names it. See
  // races.md, "Add-ons".
  const knownBits = () =>
    _.uniq(
      [VANILLA_BIT].concat(_.filter(_.map(all(), "unitTypeBit"), _.isString)),
    );

  // Every add-on unit, as { path: true }: MLA's add-on index is these and
  // nothing else.
  const addonUnitPaths = () => {
    const paths = {};

    _.forEach(addons(), (addon) => {
      _.forEach(addon.units, (path) => {
        paths[path] = true;
      });
    });

    return paths;
  };

  const hasName = (descriptor, path) =>
    !!descriptor &&
    Object.prototype.hasOwnProperty.call(descriptor.unitNames, path);

  // A unit's display name: the race's, else any add-on's, else undefined for
  // the caller's own table.
  const unitName = (raceId, path) => {
    const race = byId(raceId);

    if (hasName(race, path)) {
      return race.unitNames[path];
    }

    const addon = _.find(addons(), (candidate) => hasName(candidate, path));

    return addon ? addon.unitNames[path] : undefined;
  };

  const supportedBy = (brain, raceId) => {
    const supported = BRAINS[brain];

    if (isMla(raceId)) {
      return true;
    }

    return supported === "*" || (supported || []).includes(normalizeId(raceId));
  };

  // The brain an army of this race actually runs: the war's, or Titans when
  // the war's has no build orders for the race. See races.md.
  const brainFor = (brain, raceId) =>
    supportedBy(brain, raceId) ? brain : TITANS;

  // The brains that support every race listed - the war picker's options.
  const brainsFor = (raceIds) =>
    _.filter(_.keys(BRAINS), (brain) =>
      _.every(raceIds || [], (raceId) => supportedBy(brain, raceId)),
    );

  const setCells = (raceId, index) => {
    cellsById[normalizeId(raceId)] = index;
  };

  const cellsOf = (raceId) => cellsById[normalizeId(raceId)];

  // A card is worth offering when the race owns something in a cell it names.
  // Until the race's cells are built, everything is offered rather than
  // nothing. See races.md.
  const cardUsable = (raceId, cardUnits) => {
    if (isMla(raceId) || _.isEmpty(cardUnits)) {
      return true;
    }

    const index = cellsOf(raceId);

    return (
      !index ||
      !index.race.units.length ||
      unitCells.cardUsable(cardUnits, index.vanilla, index.race)
    );
  };

  // An AI descriptor carries `race`; an inventory carries the global tag,
  // through getTag on the live GWInventory or as plain `tags` once serialised
  // into a co-op record.
  const raceOf = (source) => {
    if (!source) {
      return MLA_ID;
    }

    let id = source.race;

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
  const aiRoot = (raceId, basePath) => {
    if (isMla(raceId)) {
      return basePath;
    }

    return basePath.replace(
      /^(\/pa\/[^/]+)(\/|$)/,
      (match, root, sep) => `${root}_race_${normalizeId(raceId)}${sep}`,
    );
  };

  // A vanilla unit a race army keeps (the Colonel): the race's unit-type bit
  // in place of the vanilla one, so the race's builders may build it.
  const unitRetagMods = (raceId, unitPath) => {
    const race = byId(raceId);

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
  const commanderRetagMods = (raceId, commanderPath) => {
    const mods = unitRetagMods(raceId, commanderPath);

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

  const matchesSource = (filePath, source) =>
    _.startsWith(filePath, source.dir) &&
    _.startsWith(filePath.slice(source.dir.length), source.match || "");

  const brainKeyOf = (brain) => (_.isString(brain) ? brain.toLowerCase() : "");

  // Every layer a brain's merged source listing carries beside the base
  // files, by race id: each race's own `ai` block plus what every add-on
  // ships for that race under the brain, MLA's included. An add-on layer for
  // a race id nothing registered still appears - its files are not base
  // files either way. See races.md, "Add-ons".
  const layersFor = (brainKey) => {
    const layers = {};
    const add = (raceId, config) => {
      const layer = layers[raceId] || { unitMaps: [], sources: [] };

      layers[raceId] = {
        unitMaps: layer.unitMaps.concat((config && config.unitMaps) || []),
        sources: layer.sources.concat((config && config.sources) || []),
      };
    };

    _.forEach(all(), (race) => {
      add(race.id, race.ai && race.ai[brainKey]);
    });
    _.forEach(addons(), (addon) => {
      _.forEach(addon.layers, (brains, raceId) => {
        add(normalizeId(raceId), brains && brains[brainKey]);
      });
    });

    return layers;
  };

  const layerClaims = (layer, filePath) =>
    _.includes(layer.unitMaps, filePath) ||
    _.some(layer.sources, (source) => matchesSource(filePath, source));

  // The parsed `ai` block a brain's tree filters read for a race, plus the
  // path constants they share.
  const treeConfig = (raceId, brain, sourceRoot) => {
    const race = byId(raceId);
    const brainKey = brainKeyOf(brain);
    const config = (race && race.ai && race.ai[brainKey]) || {};

    return {
      race,
      brainKey,
      sources: config.sources || [],
      exclude: config.exclude || [],
      aiConfig: `${sourceRoot}ai_config.json`,
      mapsDir: `${sourceRoot}unit_maps/`,
      // The engine lists unit_maps/ and loads each file it finds plus the
      // army's tag, so the tagged merged map is only read when its untagged
      // namesake is there to be listed. The brain's own map files fill that
      // role.
      baseMaps: [
        `${sourceRoot}unit_maps/ai_unit_map.json`,
        `${sourceRoot}unit_maps/ai_unit_map_x1.json`,
      ],
    };
  };

  // Which files of a brain's source tree make up the race's own tree. See
  // races.md, "Race trees".
  const treeFilter = (raceId, brain, sourceRoot) => {
    const c = treeConfig(raceId, brain, sourceRoot);
    const layers = layersFor(c.brainKey);
    // The race's own layer is its `ai` block plus its add-ons'; every other
    // layer, MLA's add-ons included, is subtracted from the base. A file two
    // layers claim (Second Wave's aux map) is the race's when its own does.
    const own = (c.race && layers[c.race.id]) || { unitMaps: [], sources: [] };
    const otherSources = _.flatten(
      _.map(_.omit(layers, c.race ? c.race.id : ""), "sources"),
    );

    const isUnitMap = (filePath) =>
      _.some(
        own.unitMaps,
        (map) => filePath === map || _.endsWith(filePath, `/${map}`),
      );

    return (filePath) => {
      if (!c.race || c.race.id === MLA_ID || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (filePath === c.aiConfig || _.includes(c.baseMaps, filePath)) {
        return true;
      }

      if (isUnitMap(filePath) || _.includes(filePath, "/neural_networks/")) {
        return false;
      }

      if (own.sources.length) {
        if (_.some(own.sources, (source) => matchesSource(filePath, source))) {
          return true;
        }

        // No untagged stray may reach unit_maps/ - the engine would load it
        // with the army's tag appended.
        if (_.startsWith(filePath, c.mapsDir)) {
          return false;
        }

        // The base layer: whatever no other layer claims.
        return !_.some(otherSources, (source) =>
          matchesSource(filePath, source),
        );
      }

      if (!c.exclude.length) {
        return false;
      }

      return !_.some(c.exclude, (fragment) => _.includes(filePath, fragment));
    };
  };

  // Whether the race mod itself put this file in the tree - the base layer
  // does not count. The referee warns when nothing matches: no race files in
  // the merged listing means the race's server mod is not mounted.
  const raceLayerFilter = (raceId, brain, sourceRoot) => {
    const c = treeConfig(raceId, brain, sourceRoot);
    const keep = treeFilter(raceId, brain, sourceRoot);

    return (filePath) => {
      if (!c.race || c.race.id === MLA_ID || !_.endsWith(filePath, ".json")) {
        return false;
      }

      if (c.sources.length) {
        return _.some(c.sources, (source) => matchesSource(filePath, source));
      }

      if (!c.exclude.length) {
        return false;
      }

      // A brain that carries the race itself: the tier's own data files, not
      // the config and map boilerplate every tree keeps.
      return (
        keep(filePath) &&
        filePath !== c.aiConfig &&
        !_.includes(c.baseMaps, filePath)
      );
    };
  };

  // Every brain key any descriptor names a layer for.
  const brainKeys = () =>
    _.uniq(
      _.flatten(
        _.map(all(), (race) => _.keys(race.ai || {})).concat(
          _.map(addons(), (addon) => _.flatten(_.map(addon.layers, _.keys))),
        ),
      ),
    );

  // Whether a race's layer claims this file and MLA's does not: a race mod's
  // own build files or unit map, or an add-on's files for a race, under any
  // brain, in the merged listing. An MLA tree is the brain's base files plus
  // MLA's add-on files, so referee_ai.js's sweep drops these and keeps the
  // rest - an add-on map both MLA and a race claim rides along untagged. A
  // relative unit map names a file the brain ships itself, never a race
  // mod's, and matches nothing here.
  const inAnyRaceLayer = (filePath) => {
    let mla = false;
    let other = false;

    _.forEach(brainKeys(), (brainKey) => {
      _.forEach(layersFor(brainKey), (layer, raceId) => {
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
  const unitMapsFor = (raceId, brain, sourceRoot) => {
    const race = byId(raceId);

    if (!race || race.id === MLA_ID) {
      return [];
    }

    const layer = layersFor(brainKeyOf(brain))[race.id];

    return _.map(layer.unitMaps, (map) =>
      _.startsWith(map, "/") ? map : sourceRoot + map,
    );
  };

  // The hue a race's commander preview art ships in, for the picker's tint.
  const commanderArtHue = (raceId) => {
    const race = byId(raceId);
    const hue = race && race.commanderArtHue;

    return _.isNumber(hue) ? hue : MLA_ART_HUE;
  };

  const isRaceCommander = (raceId, commanderPath) => {
    const race = byId(raceId);

    return (
      !!race &&
      _.some(race.commanders, (commander) => commander.spec === commanderPath)
    );
  };

  // The spec mods a race army needs for its commander: none for one of the
  // race's own, the retag for a vanilla one it keeps (Pumpkin, Unicorn).
  const commanderModsFor = (raceId, commanderPath) => {
    if (
      isMla(raceId) ||
      !_.isString(commanderPath) ||
      isRaceCommander(raceId, commanderPath)
    ) {
      return [];
    }

    return commanderRetagMods(raceId, commanderPath);
  };

  const commanderFor = (rng, raceId) => {
    const race = byId(raceId);

    if (!race || !race.commanders.length) {
      return undefined;
    }

    const chosen = rng ? rng.pick(race.commanders) : _.sample(race.commanders);

    return chosen && chosen.spec;
  };

  // One race per faction. Independent draws by default; `unique` draws without
  // replacement until the pool is spent, then refills it, and `taken` (races
  // already in play) count as drawn in the first pass. See galaxy.md.
  const assign = (rng, factionIds, pool, options) => {
    const unique = !!(options && options.unique);
    const taken = _.map((options && options.taken) || [], normalizeId);
    let choices = _.filter(_.map(pool || [], normalizeId), (id) => id.length);
    const result = {};
    let remaining = [];

    if (!choices.length) {
      choices = [MLA_ID];
    }

    // A refill is the whole pool, so a taken race is reused only once every
    // other race has been.
    const firstPass = _.difference(choices, taken);
    const passes = unique && firstPass.length ? [firstPass] : [];

    _.forEach(factionIds || [], (factionId) => {
      if (!unique) {
        result[factionId] = rng.pick(choices);
        return;
      }

      if (!remaining.length) {
        remaining = rng.shuffle(
          passes.length ? passes.shift() : choices.slice(),
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
  const registerShipped = () => {
    _.forEach(shipped, (descriptor) => {
      try {
        register(descriptor);
      } catch (e) {
        console.error(
          `gwoRaces: shipped race not registered: ${e.message || e}`,
        );
      }
    });
    _.forEach(shippedAddons, (descriptor) => {
      try {
        registerAddon(descriptor);
      } catch (e) {
        console.error(
          `gwoRaces: shipped add-on not registered: ${e.message || e}`,
        );
      }
    });
  };

  registerShipped();

  return {
    MLA_ID,
    TITANS,
    BRAINS,
    register,
    normalizeId,
    byId,
    all,
    isMla,
    detect,
    registerAddon,
    addonById,
    addons,
    detectAddons,
    knownBits,
    addonUnitPaths,
    unitName,
    layersFor,
    supportedBy,
    brainFor,
    brainsFor,
    setCells,
    cellsOf,
    cardUsable,
    raceOf,
    aiRoot,
    unitRetagMods,
    commanderRetagMods,
    commanderModsFor,
    isRaceCommander,
    commanderArtHue,
    commanderFor,
    treeFilter,
    raceLayerFilter,
    inAnyRaceLayer,
    unitMapsFor,
    assign,
    // Test-only: a registered race outlives the module, and the harness loads
    // each module once per process.
    reset: function () {
      registry = {};
      order = [];
      addonRegistry = {};
      addonOrder = [];
      cellsById = {};
    },
    registerShipped,
  };
});
