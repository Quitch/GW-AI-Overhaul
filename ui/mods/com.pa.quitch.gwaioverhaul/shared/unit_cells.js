// Capability cells: a unit's domain, tier and class read off its unit_types,
// so a race player owns the race's units in the cells the vanilla units held
// occupy, and a mod on a vanilla file lands on the race files of the same
// cell and role. Pure: no engine globals, no model. See races.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js",
], function (buildTypes) {
  var PREFIX = "UNITTYPE_";
  // Faction bits, build permissions and flavour say nothing about what a unit
  // is for.
  var STRIP =
    /^(Custom\d+|FactoryBuild|CmdBuild|FabBuild|FabAdvBuild|FabOrbBuild|CombatFab\w*Build|CannonBuildable|Important|Interplanetary|NoBuild|Debug)$/;
  var COMMANDER = "Commander";
  var MAX_CHAIN = 16;

  var bare = function (type) {
    return _.isString(type) && _.startsWith(type, PREFIX)
      ? type.slice(PREFIX.length)
      : type;
  };

  var stripTypes = function (types) {
    return _.filter(_.map(types || [], bare), function (type) {
      return _.isString(type) && type.length && !STRIP.test(type);
    });
  };

  // First match wins. Orbital before Land keeps the launcher orbital; Land
  // before Naval puts the vanilla mine, tagged both, beside a race's land-only
  // one.
  var DOMAINS = [
    ["Air", ["Air"]],
    ["Orbital", ["Orbital"]],
    ["Bot", ["Bot"]],
    ["Vehicle", ["Tank", "Vehicle"]],
    ["Land", ["Land"]],
    ["Naval", ["Naval"]],
  ];
  var STRUCTURE_CLASSES = [
    ["Superweapon", ["Nuke", "ControlModule", "PlanetEngine"]],
    ["Defense", ["Defense", "Wall", "SurfaceDefense", "AirDefense"]],
    ["Factory", ["Factory"]],
    ["Metal", ["MetalProduction"]],
    ["Energy", ["EnergyProduction"]],
    ["Storage", ["Economy"]],
    ["Intel", ["Recon", "Radar", "RadarJammer"]],
    ["Teleporter", ["Teleporter"]],
  ];

  var firstMatch = function (table, has, fallback) {
    var found = _.find(table, function (row) {
      return _.some(row[1], has);
    });
    return found ? found[0] : fallback;
  };

  var classify = function (types) {
    var tags = stripTypes(types);
    var has = function (tag) {
      return _.contains(tags, tag);
    };
    var cls;

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

    var domain = firstMatch(DOMAINS, has, "Land");
    var tier = has("Advanced") ? "Advanced" : "Basic";

    return {
      domain: domain,
      tier: tier,
      cls: cls,
      key: domain + "/" + tier + "/" + cls,
    };
  };

  var specOf = function (specs, path) {
    return specs && Object.prototype.hasOwnProperty.call(specs, path)
      ? specs[path]
      : undefined;
  };

  // The first value of `field` up the base_spec chain: a child's array
  // replaces its base's, as the engine merges them.
  var chainValue = function (path, specs, field) {
    var seen = {};
    var current = path;

    for (var depth = 0; depth < MAX_CHAIN && _.isString(current); depth++) {
      if (seen[current]) {
        break;
      }
      seen[current] = true;
      var spec = specOf(specs, current);
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

  var effectiveTypes = function (path, specs) {
    var types = chainValue(path, specs, "unit_types");
    return _.isArray(types) ? types : [];
  };

  var ammoIds = function (ammoId) {
    if (_.isString(ammoId)) {
      return [ammoId];
    }
    if (_.isArray(ammoId)) {
      return _.filter(_.pluck(ammoId, "id"), _.isString);
    }
    return [];
  };

  // A unit's parts by role, over the reference fields spec_cache.tagSpec
  // walks: a tool is a weapon when it fires ammo and a build arm otherwise.
  var partsOf = function (path, specs) {
    var spec = specOf(specs, path);
    var parts = [];
    var add = function (partPath, role) {
      if (
        _.isString(partPath) &&
        !_.some(parts, { path: partPath, role: role })
      ) {
        parts.push({ path: partPath, role: role });
      }
    };

    if (!spec) {
      return parts;
    }

    _.forEach(spec.tools || [], function (tool) {
      var toolPath = tool && tool.spec_id;
      if (!_.isString(toolPath)) {
        return;
      }
      var ammo = ammoIds(chainValue(toolPath, specs, "ammo_id"));
      add(toolPath, ammo.length ? "weapon" : "buildArm");
      _.forEach(ammo, function (ammoPath) {
        add(ammoPath, "ammo");
      });
    });

    if (spec.death_weapon) {
      add(spec.death_weapon.ground_ammo_spec, "deathAmmo");
      add(spec.death_weapon.air_ammo_spec, "deathAmmo");
    }

    return parts;
  };

  var raceMember = function (unitTypeBit) {
    var wanted = PREFIX + unitTypeBit;
    return function (types) {
      return _.contains(types || [], wanted);
    };
  };

  // Vanilla carries Custom58 or no faction bit at all.
  var vanillaMember = function (types) {
    return !_.some(types || [], function (type) {
      var tag = bare(type);
      return /^Custom\d+$/.test(tag) && tag !== "Custom58";
    });
  };

  var buildIndex = function (unitPaths, specs, member) {
    var index = {
      units: [],
      cellOf: {},
      unitsByCell: {},
      partsByUnit: {},
      partIndex: {},
      // Bare tags and buildable_types per unit, for the build rule below.
      tagsOf: {},
      buildableOf: {},
    };

    _.forEach(_.uniq(unitPaths || []), function (path) {
      var types = effectiveTypes(path, specs);
      if (!specOf(specs, path) || !member(types)) {
        return;
      }
      var cell = classify(types).key;
      index.units.push(path);
      index.cellOf[path] = cell;
      index.tagsOf[path] = _.map(types, bare);
      var buildable = chainValue(path, specs, "buildable_types");
      if (_.isString(buildable) && buildable.length) {
        index.buildableOf[path] = buildable;
      }
      index.unitsByCell[cell] = index.unitsByCell[cell] || [];
      index.unitsByCell[cell].push(path);
      var parts = partsOf(path, specs);
      var dir = path.slice(0, path.lastIndexOf("/") + 1);
      index.partsByUnit[path] = parts;
      _.forEach(parts, function (part) {
        index.partIndex[part.path] = index.partIndex[part.path] || {
          role: part.role,
          cells: [],
        };
        var entry = index.partIndex[part.path];
        if (!_.contains(entry.cells, cell)) {
          entry.cells.push(cell);
        }
        // A part shared by units of several cells (the Dox's ammo also arms
        // an advanced vehicle) belongs to the unit whose directory holds it.
        if (_.startsWith(part.path, dir)) {
          entry.home = cell;
        }
      });
    });

    _.forEach(index.partIndex, function (entry) {
      if (entry.home) {
        entry.cells = [entry.home];
      }
      delete entry.home;
    });

    _.forEach(index.unitsByCell, function (units) {
      units.sort();
    });

    return index;
  };

  var isCommanderCell = function (cell) {
    return _.endsWith(cell || "", "/" + COMMANDER);
  };

  // The race's units in cells no vanilla unit occupies that something already
  // granted can build - Bugs' research unlock tokens, made by its research
  // factories - until nothing more is reachable.
  var buildableOrphans = function (granted, vanilla, race) {
    var orphans = _.filter(race.units, function (unit) {
      var cell = race.cellOf[unit];
      return (
        !isCommanderCell(cell) &&
        _.isEmpty(vanilla.unitsByCell[cell]) &&
        !_.contains(granted, unit)
      );
    });
    var result = granted.slice();
    var added = true;

    while (added && orphans.length) {
      added = false;
      var builders = _.filter(result, function (unit) {
        return !!race.buildableOf[unit];
      });
      orphans = _.filter(orphans, function (orphan) {
        var tags = race.tagsOf[orphan] || [];
        var reachable = _.some(builders, function (builder) {
          return buildTypes.matches(race.buildableOf[builder], tags);
        });
        if (reachable) {
          result.push(orphan);
          added = true;
        }
        return !reachable;
      });
    }

    return result;
  };

  // What a race player fields for the vanilla units held: the race's units in
  // every held cell, plus whatever is neither a vanilla unit nor a vanilla
  // part passed through (race commanders, foreign specs), plus what those can
  // build in cells vanilla never fills. A held vanilla commander-class unit is
  // kept too - a race has no stand-in for the Colonel - and the caller retags
  // it. Commander cells are never granted.
  var raceUnitsFor = function (heldPaths, vanilla, race) {
    var kept = [];
    var cells = [];

    _.forEach(heldPaths || [], function (path) {
      var cell = vanilla.cellOf[path];
      if (_.isUndefined(cell)) {
        if (!vanilla.partIndex[path]) {
          kept.push(path);
        }
      } else if (isCommanderCell(cell)) {
        kept.push(path);
      } else if (!_.contains(cells, cell)) {
        cells.push(cell);
      }
    });

    var granted = _.uniq(
      kept.concat(
        _.flatten(
          _.map(cells, function (cell) {
            return race.unitsByCell[cell] || [];
          })
        )
      )
    );

    return buildableOrphans(granted, vanilla, race);
  };

  // The vanilla commander-class units among those held.
  var heldCommanderUnits = function (heldPaths, vanilla) {
    return _.uniq(
      _.filter(heldPaths || [], function (path) {
        return isCommanderCell(vanilla.cellOf[path]);
      })
    );
  };

  var racePartsIn = function (race, cells, role) {
    return _.uniq(
      _.flattenDeep(
        _.map(cells, function (cell) {
          return _.map(race.unitsByCell[cell] || [], function (unit) {
            return _.pluck(
              _.filter(race.partsByUnit[unit] || [], { role: role }),
              "path"
            );
          });
        })
      )
    );
  };

  var targetsFor = function (file, vanilla, race) {
    if (Object.prototype.hasOwnProperty.call(vanilla.cellOf, file)) {
      return race.unitsByCell[vanilla.cellOf[file]] || [];
    }
    var part = vanilla.partIndex[file];
    if (part) {
      return racePartsIn(race, part.cells, part.role);
    }
    return undefined;
  };

  // Spec mods re-aimed at the race: one on a vanilla unit lands on every race
  // unit of its cell, one on a vanilla part on the race parts of that role in
  // the part's cell. A group card names several vanilla files of one cell
  // and must land once, not once per file: a race target gets the same
  // (path, op, value) once per pass, and a pass ends when a vanilla source
  // already seen recurs - two cards, two passes, and they stack. The original
  // stays when the army still holds its file (`has`).
  // A mod that changes what a unit is rather than how well it does it - its
  // type bits, build list, tools, orders, identity - is about that one unit
  // and never travels by cell. A descriptor may say so itself with `exact`.
  var IDENTITY_PATH =
    /^(unit_types|buildable_types|base_spec|tools|command_caps|si_name|model|display_name|description|transportable|transporter|attachable)(\.|$)/;

  var isIdentityMod = function (mod) {
    return (
      mod.exact === true ||
      (_.isString(mod.path) && IDENTITY_PATH.test(mod.path))
    );
  };

  // The files a mod list remakes: once one mod changes a unit's identity,
  // every mod on that unit in the list is part of the same conversion (the
  // Angel's commander cost, health and storage go with its new type bits).
  var remadeFiles = function (mods) {
    var files = {};
    _.forEach(mods, function (mod) {
      if (mod && _.isString(mod.file) && isIdentityMod(mod)) {
        files[mod.file] = true;
      }
    });
    return files;
  };

  var expandMods = function (mods, vanilla, race, has) {
    var passes = {};
    var out = [];
    var remade = remadeFiles(mods || []);

    _.forEach(mods || [], function (mod) {
      if (!mod || !_.isString(mod.file) || remade[mod.file]) {
        out.push(mod);
        return;
      }

      var targets = targetsFor(mod.file, vanilla, race);
      if (_.isUndefined(targets)) {
        out.push(mod);
        return;
      }

      if (_.isFunction(has) && has(mod.file)) {
        out.push(mod);
      }

      var change = [mod.path, mod.op, JSON.stringify(mod.value)].join("|");
      _.forEach(targets, function (target) {
        var key = target + "|" + change;
        var pass = passes[key];
        if (!pass || pass[mod.file]) {
          pass = passes[key] = {};
          out.push(_.assign({}, mod, { file: target }));
        }
        pass[mod.file] = true;
      });
    });

    return out;
  };

  // A card is worth offering when the race owns something in a cell it names.
  var cardUsable = function (cardUnits, vanilla, race) {
    return _.some(cardUnits || [], function (unit) {
      var cell = vanilla.cellOf[unit];
      return !!cell && !_.isEmpty(race.unitsByCell[cell]);
    });
  };

  // A merged unit map's spec_ids the race maps did not set, re-pointed from a
  // vanilla unit to the first race unit of its cell, so a key the engine reads
  // itself resolves to something the army can own. Returns a copy.
  var unitMapFallback = function (map, raceMaps, vanilla, race) {
    if (!map || !map.unit_map) {
      return map;
    }
    var raceKeys = {};
    _.forEach(raceMaps || [], function (raceMap) {
      _.forEach(_.keys((raceMap && raceMap.unit_map) || {}), function (key) {
        raceKeys[key] = true;
      });
    });

    var unitMap = {};
    _.forEach(map.unit_map, function (entry, key) {
      var cell =
        entry && _.isString(entry.spec_id) && vanilla.cellOf[entry.spec_id];
      var stand = cell && !raceKeys[key] ? race.unitsByCell[cell] : undefined;
      unitMap[key] =
        stand && stand.length
          ? _.assign({}, entry, { spec_id: stand[0] })
          : entry;
    });

    return _.assign({}, map, { unit_map: unitMap });
  };

  return {
    COMMANDER: COMMANDER,
    stripTypes: stripTypes,
    classify: classify,
    effectiveTypes: effectiveTypes,
    partsOf: partsOf,
    raceMember: raceMember,
    vanillaMember: vanillaMember,
    buildIndex: buildIndex,
    isCommanderCell: isCommanderCell,
    raceUnitsFor: raceUnitsFor,
    heldCommanderUnits: heldCommanderUnits,
    expandMods: expandMods,
    cardUsable: cardUsable,
    unitMapFallback: unitMapFallback,
  };
});
