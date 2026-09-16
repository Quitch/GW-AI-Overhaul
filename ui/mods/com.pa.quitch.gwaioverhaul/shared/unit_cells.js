// Capability cells: a unit's domain, tier and class read off its unit_types,
// so a race player owns the race's units in the cells the vanilla units held
// occupy, and a mod on a vanilla file lands on the race files of the same
// cell and role. Pure: no engine globals, no model. See races.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js"], (
  buildTypes,
) => {
  const PREFIX = "UNITTYPE_";
  // Faction bits, build permissions and flavour say nothing about what a unit
  // is for.
  const STRIP =
    /^(Custom\d+|FactoryBuild|CmdBuild|FabBuild|FabAdvBuild|FabOrbBuild|CombatFab\w*Build|CannonBuildable|Important|Interplanetary|NoBuild|Debug)$/;
  const COMMANDER = "Commander";
  const MAX_CHAIN = 16;

  const bare = (type) =>
    _.isString(type) && _.startsWith(type, PREFIX)
      ? type.slice(PREFIX.length)
      : type;

  const stripTypes = (types) =>
    _.filter(
      _.map(types || [], bare),
      (type) => _.isString(type) && type.length && !STRIP.test(type),
    );

  // First match wins. Orbital before Land keeps the launcher orbital; Land
  // before Naval puts the vanilla mine, tagged both, beside a race's land-only
  // one.
  const DOMAINS = [
    ["Air", ["Air"]],
    ["Orbital", ["Orbital"]],
    ["Bot", ["Bot"]],
    ["Vehicle", ["Tank", "Vehicle"]],
    ["Land", ["Land"]],
    ["Naval", ["Naval"]],
  ];
  const STRUCTURE_CLASSES = [
    ["Superweapon", ["Nuke", "ControlModule", "PlanetEngine"]],
    ["Defense", ["Defense", "Wall", "SurfaceDefense", "AirDefense"]],
    ["Factory", ["Factory"]],
    ["Metal", ["MetalProduction"]],
    ["Energy", ["EnergyProduction"]],
    ["Storage", ["Economy"]],
    ["Intel", ["Recon", "Radar", "RadarJammer"]],
    ["Teleporter", ["Teleporter"]],
  ];

  const firstMatch = (table, has, fallback) => {
    const found = _.find(table, (row) => _.some(row[1], has));
    return found ? found[0] : fallback;
  };

  const classify = (types) => {
    const tags = stripTypes(types);
    const has = (tag) => _.includes(tags, tag);
    let cls;

    if (has("Titan")) {
      cls = "Titan";
    } else if (has("Commander") || has("SupportCommander")) {
      cls = COMMANDER;
    } else if (has("Mobile")) {
      // A mobile builder without a weapon is a fabber; every other mobile,
      // the combat fabbers included, fights.
      cls = has("Construction") && !has("Offense") ? "Fabber" : "Combat";
    } else {
      cls = firstMatch(STRUCTURE_CLASSES, has, "Structure");
    }

    const domain = firstMatch(DOMAINS, has, "Land");
    const tier = has("Advanced") ? "Advanced" : "Basic";

    return {
      domain,
      tier,
      cls,
      key: `${domain}/${tier}/${cls}`,
    };
  };

  const specOf = (specs, path) =>
    specs && Object.prototype.hasOwnProperty.call(specs, path)
      ? specs[path]
      : undefined;

  // The first value of `field` up the base_spec chain: a child's array
  // replaces its base's, as the engine merges them.
  const chainValue = (path, specs, field) => {
    const seen = {};
    let current = path;

    for (let depth = 0; depth < MAX_CHAIN && _.isString(current); depth++) {
      if (seen[current]) {
        break;
      }
      seen[current] = true;
      const spec = specOf(specs, current);
      if (!spec) {
        break;
      }
      if (!_.isUndefined(spec[field])) {
        return spec[field];
      }
      current = spec.base_spec;
    }

    return undefined;
  };

  const effectiveTypes = (path, specs) => {
    const types = chainValue(path, specs, "unit_types");
    return Array.isArray(types) ? types : [];
  };

  const ammoIds = (ammoId) => {
    if (_.isString(ammoId)) {
      return [ammoId];
    }
    if (Array.isArray(ammoId)) {
      return _.filter(_.map(ammoId, "id"), _.isString);
    }
    return [];
  };

  // A unit's parts by role, over the reference fields spec_cache.forEachReference
  // walks: a tool is a weapon when it fires ammo and a build arm otherwise.
  const partsOf = (path, specs) => {
    const spec = specOf(specs, path);
    const parts = [];
    const add = (partPath, role) => {
      if (_.isString(partPath) && !_.some(parts, { path: partPath, role })) {
        parts.push({ path: partPath, role });
      }
    };

    if (!spec) {
      return parts;
    }

    _.forEach(spec.tools || [], (tool) => {
      const toolPath = tool && tool.spec_id;
      if (!_.isString(toolPath)) {
        return;
      }
      const ammo = ammoIds(chainValue(toolPath, specs, "ammo_id"));
      add(toolPath, ammo.length ? "weapon" : "buildArm");
      _.forEach(ammo, (ammoPath) => {
        add(ammoPath, "ammo");
      });
    });

    if (spec.death_weapon) {
      add(spec.death_weapon.ground_ammo_spec, "deathAmmo");
      add(spec.death_weapon.air_ammo_spec, "deathAmmo");
    }

    return parts;
  };

  const raceMember = (unitTypeBit) => {
    const wanted = PREFIX + unitTypeBit;
    return (types) => (types || []).includes(wanted);
  };

  const customBits = (types) =>
    _.filter(_.map(types || [], bare), (tag) => /^Custom\d+$/.test(tag));

  // Vanilla carries Custom58 or no faction bit at all.
  const vanillaMember = (types) =>
    !_.some(customBits(types), (tag) => tag !== "Custom58");

  // Exclusive: a faction bit nothing registered owns, and none that is
  // (Section 17's Custom17 gantry builds). Such a unit belongs to no cell and
  // is reached only through the build rule. See races.md, "Add-ons".
  const exclusiveMember = (knownBits) => (types) => {
    const bits = customBits(types);
    return (
      bits.length > 0 && !_.some(bits, (bit) => (knownBits || []).includes(bit))
    );
  };

  // `member(types, path)` says what is indexed; an optional
  // `exclusive(types)` marks units that get a cell, tags and build list but
  // sit in `exclusive` rather than `units` or `unitsByCell`, so nothing
  // counts them as the race's own and no cell grant reaches them.
  const buildIndex = (unitPaths, specs, member, exclusive) => {
    const index = {
      units: [],
      cellOf: {},
      unitsByCell: {},
      partsByUnit: {},
      partIndex: {},
      // Bare tags and buildable_types per unit, for the build rule below.
      tagsOf: {},
      buildableOf: {},
      exclusive: {},
    };

    _.forEach(_.uniq(unitPaths || []), (path) => {
      const types = effectiveTypes(path, specs);
      if (!specOf(specs, path)) {
        return;
      }
      const isExclusive = _.isFunction(exclusive) && exclusive(types);
      if (!isExclusive && !member(types, path)) {
        return;
      }
      const cell = classify(types).key;
      index.cellOf[path] = cell;
      index.tagsOf[path] = _.map(types, bare);
      const buildable = chainValue(path, specs, "buildable_types");
      if (_.isString(buildable) && buildable.length) {
        index.buildableOf[path] = buildable;
      }
      if (isExclusive) {
        index.exclusive[path] = true;
        return;
      }
      index.units.push(path);
      index.unitsByCell[cell] = index.unitsByCell[cell] || [];
      index.unitsByCell[cell].push(path);
      const parts = partsOf(path, specs);
      const dir = path.slice(0, path.lastIndexOf("/") + 1);
      index.partsByUnit[path] = parts;
      _.forEach(parts, (part) => {
        index.partIndex[part.path] = index.partIndex[part.path] || {
          role: part.role,
          cells: [],
        };
        const entry = index.partIndex[part.path];
        if (!entry.cells.includes(cell)) {
          entry.cells.push(cell);
        }
        // A part shared by units of several cells (the Dox's ammo also arms
        // an advanced vehicle) belongs to the unit whose directory holds it.
        if (_.startsWith(part.path, dir)) {
          entry.home = cell;
        }
      });
    });

    _.forEach(index.partIndex, (entry) => {
      if (entry.home) {
        entry.cells = [entry.home];
      }
      delete entry.home;
    });

    _.forEach(index.unitsByCell, (units) => {
      units.sort();
    });

    return index;
  };

  const isCommanderCell = (cell) => _.endsWith(cell || "", `/${COMMANDER}`);

  // A cell no buildable vanilla unit occupies: empty, or held only by NoBuild
  // specs (Section 17 lists a NoBuild larva alone in a cell).
  const unfilledByVanilla = (vanilla, cell) =>
    _.every(vanilla.unitsByCell[cell] || [], (unit) =>
      (vanilla.tagsOf[unit] || []).includes("NoBuild"),
    );

  // The race's units in cells no vanilla unit occupies, and its exclusive
  // units whatever their cell, that something already granted can build -
  // Bugs' research unlock tokens, made by its research factories - until
  // nothing more is reachable. `buildableOf(unit)` resolves a builder's
  // build list; the race's own table by default.
  const buildableOrphans = (granted, vanilla, race, buildableOf) => {
    const buildable = _.isFunction(buildableOf)
      ? buildableOf
      : (unit) => race.buildableOf[unit];
    const exclusive = race.exclusive || {};
    let orphans = _.filter(race.units.concat(_.keys(exclusive)), (unit) => {
      const cell = race.cellOf[unit];
      return (
        !isCommanderCell(cell) &&
        (exclusive[unit] || unfilledByVanilla(vanilla, cell)) &&
        !_.includes(granted, unit)
      );
    });
    const result = granted.slice();
    let added = true;

    while (added && orphans.length) {
      added = false;
      const builders = _.filter(result, (unit) => !!buildable(unit));
      orphans = _.filter(orphans, (orphan) => {
        const tags = race.tagsOf[orphan] || [];
        const reachable = _.some(builders, (builder) =>
          buildTypes.matches(buildable(builder), tags),
        );
        if (reachable) {
          result.push(orphan);
          added = true;
        }
        return !reachable;
      });
    }

    return result;
  };

  // What a race player fields for the vanilla units held. See races.md,
  // "Capability cells".
  const raceUnitsFor = (heldPaths, vanilla, race) => {
    const kept = [];
    const cells = [];

    _.forEach(heldPaths || [], (path) => {
      const cell = vanilla.cellOf[path];
      if (_.isUndefined(cell)) {
        if (!vanilla.partIndex[path]) {
          kept.push(path);
        }
      } else if (isCommanderCell(cell)) {
        kept.push(path);
      } else if (!cells.includes(cell)) {
        cells.push(cell);
      }
    });

    const granted = _.uniq(
      kept.concat(
        _.flatten(_.map(cells, (cell) => race.unitsByCell[cell] || [])),
      ),
    );

    return buildableOrphans(granted, vanilla, race);
  };

  // What an MLA player fields with add-ons active: everything held, plus the
  // add-on units of every cell a held vanilla unit occupies, plus what those
  // and the held vanilla builders can build. Nothing is taken away. See
  // races.md, "Add-ons".
  const addonUnitsFor = (heldPaths, vanilla, addon) => {
    const held = _.uniq(heldPaths || []);
    const cells = [];

    _.forEach(held, (path) => {
      const cell = vanilla.cellOf[path];
      if (
        !_.isUndefined(cell) &&
        !isCommanderCell(cell) &&
        !cells.includes(cell)
      ) {
        cells.push(cell);
      }
    });

    const granted = _.uniq(
      held.concat(
        _.flatten(_.map(cells, (cell) => addon.unitsByCell[cell] || [])),
      ),
    );

    return buildableOrphans(
      granted,
      vanilla,
      addon,
      (unit) => addon.buildableOf[unit] || vanilla.buildableOf[unit],
    );
  };

  // The vanilla commander-class units among those held.
  const heldCommanderUnits = (heldPaths, vanilla) =>
    _.uniq(
      _.filter(heldPaths || [], (path) =>
        isCommanderCell(vanilla.cellOf[path]),
      ),
    );

  const racePartsIn = (race, cells, role) =>
    _.uniq(
      _.flattenDeep(
        _.map(cells, (cell) =>
          _.map(race.unitsByCell[cell] || [], (unit) =>
            _.map(_.filter(race.partsByUnit[unit] || [], { role }), "path"),
          ),
        ),
      ),
    );

  const targetsFor = (file, vanilla, race) => {
    if (Object.prototype.hasOwnProperty.call(vanilla.cellOf, file)) {
      return race.unitsByCell[vanilla.cellOf[file]] || [];
    }
    const part = vanilla.partIndex[file];
    if (part) {
      return racePartsIn(race, part.cells, part.role);
    }
    return undefined;
  };

  // Spec mods re-aimed at the race by cell, once per pass. Identity mods stay
  // on their own unit. See races.md, "Capability cells".
  const IDENTITY_PATH =
    /^(unit_types|buildable_types|base_spec|tools|command_caps|si_name|model|display_name|description|transportable|transporter|attachable)(\.|$)/;

  const isIdentityMod = (mod) =>
    mod.exact === true ||
    (_.isString(mod.path) && IDENTITY_PATH.test(mod.path));

  // The files a mod list remakes: once one mod changes a unit's identity,
  // every mod on that unit in the list is part of the same conversion (the
  // Angel's commander cost, health and storage go with its new type bits).
  const remadeFiles = (mods) => {
    const files = {};
    _.forEach(mods, (mod) => {
      if (mod && _.isString(mod.file) && isIdentityMod(mod)) {
        files[mod.file] = true;
      }
    });
    return files;
  };

  const expandMods = (mods, vanilla, race, has) => {
    const passes = {};
    const out = [];
    const remade = remadeFiles(mods || []);

    _.forEach(mods || [], (mod) => {
      if (!mod || !_.isString(mod.file) || remade[mod.file]) {
        out.push(mod);
        return;
      }

      const targets = targetsFor(mod.file, vanilla, race);
      if (_.isUndefined(targets)) {
        out.push(mod);
        return;
      }

      if (_.isFunction(has) && has(mod.file)) {
        out.push(mod);
      }

      const change = [mod.path, mod.op, JSON.stringify(mod.value)].join("|");
      _.forEach(targets, (target) => {
        const key = `${target}|${change}`;
        let pass = passes[key];
        if (!pass || pass[mod.file]) {
          pass = passes[key] = {};
          out.push(Object.assign({}, mod, { file: target }));
        }
        pass[mod.file] = true;
      });
    });

    return out;
  };

  // A card is worth offering when the race owns something in a cell it names.
  const cardUsable = (cardUnits, vanilla, race) =>
    _.some(cardUnits || [], (unit) => {
      const cell = vanilla.cellOf[unit];
      return !!cell && !_.isEmpty(race.unitsByCell[cell]);
    });

  // The units a card reaches for a race player: the race's units of each cell
  // a named vanilla unit occupies. A path with no cell, or in a Commander
  // cell, is kept as raceUnitsFor keeps it. No build reach: a factory card
  // lists factories, not what they build.
  const cardUnitsFor = (cardUnits, vanilla, race) =>
    _.uniq(
      _.flatten(
        _.map(cardUnits || [], (unit) => {
          const cell = vanilla.cellOf[unit];
          if (_.isUndefined(cell) || isCommanderCell(cell)) {
            return [unit];
          }
          return race.unitsByCell[cell] || [];
        }),
      ),
    );

  // The units a card reaches for an MLA player with add-ons: the card's own
  // vanilla units and the add-on units of their cells.
  const addonCardUnitsFor = (cardUnits, vanilla, addon) =>
    _.uniq((cardUnits || []).concat(cardUnitsFor(cardUnits, vanilla, addon)));

  // A merged unit map's spec_ids the race maps did not set, re-pointed from a
  // vanilla unit to the first race unit of its cell, so a key the engine reads
  // itself resolves to something the army can own. `avoid` ({ path: true })
  // names units to pass over while the cell offers another: an add-on's,
  // which the race's own AI data does not know. Returns a copy.
  const unitMapFallback = (map, raceMaps, vanilla, race, avoid) => {
    if (!map || !map.unit_map) {
      return map;
    }
    const raceKeys = {};
    _.forEach(raceMaps || [], (raceMap) => {
      _.forEach(_.keys((raceMap && raceMap.unit_map) || {}), (key) => {
        raceKeys[key] = true;
      });
    });
    const preferred = (candidates) =>
      _.find(candidates, (unit) => !avoid || !avoid[unit]) || candidates[0];

    const unitMap = {};
    _.forEach(map.unit_map, (entry, key) => {
      const cell =
        entry && _.isString(entry.spec_id) && vanilla.cellOf[entry.spec_id];
      const stand = cell && !raceKeys[key] ? race.unitsByCell[cell] : undefined;
      unitMap[key] =
        stand && stand.length
          ? Object.assign({}, entry, { spec_id: preferred(stand) })
          : entry;
    });

    return Object.assign({}, map, { unit_map: unitMap });
  };

  return {
    COMMANDER,
    stripTypes,
    classify,
    effectiveTypes,
    partsOf,
    raceMember,
    vanillaMember,
    exclusiveMember,
    buildIndex,
    isCommanderCell,
    raceUnitsFor,
    addonUnitsFor,
    heldCommanderUnits,
    expandMods,
    cardUsable,
    cardUnitsFor,
    addonCardUnitsFor,
    unitMapFallback,
  };
});
