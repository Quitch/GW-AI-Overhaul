// What a co-op AI player's units are, for judging a card by what it changes:
// each unit's domain, tier and class, the units a mod's file belongs to,
// which held units its commander can reach, and the units it could get later.
// Two lookups answer the same questions: one from the unit specs, and a
// vanilla-only one from unit-group membership for when the specs are not in.
// Pure. See tech-cards.md, "How AI players judge a card".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (unitCells, buildTypes, gwoUnit) {
  var MAX_CHAIN = 16;
  var COMMANDERS = "/pa/units/commanders/";
  var BUILD_PATH = /^(unit_types|buildable_types)(\.|$)/;
  // Build lists remade by mods, kept for reuse; older ones are dropped.
  var MAX_CACHED = 64;

  var parseCell = function (key) {
    var parts = key.split("/");
    return { domain: parts[0], tier: parts[1], cls: parts[2], key: key };
  };

  var directoryOf = function (path) {
    return path.slice(0, path.lastIndexOf("/") + 1);
  };

  var memoise = function (ownersOf) {
    var cache = {};
    return function (file) {
      if (!Object.prototype.hasOwnProperty.call(cache, file)) {
        cache[file] = ownersOf(file);
      }
      return cache[file];
    };
  };

  // The units a card could grant, commanders aside.
  var obtainableOf = function (units, classOf) {
    return _.filter(_.uniq(units || []), function (unit) {
      var cell = classOf(unit);
      return !!cell && cell.cls !== unitCells.COMMANDER;
    });
  };

  // Every held unit the commander can build, directly or through what it
  // builds, until nothing more is reachable. A commander the lookup does not
  // know reaches everything: an unknown builder is no reason to value a unit
  // at a quarter.
  var reachFrom = function (held, commander, buildableOf, tagsOf) {
    if (!buildableOf(commander)) {
      return held.slice();
    }

    var reached = [commander];
    var remaining = _.without(held, commander);
    var added = true;

    while (added && remaining.length) {
      added = false;
      var builders = _.filter(reached, buildableOf);
      remaining = _.filter(remaining, function (unit) {
        var tags = tagsOf(unit);
        var reachable =
          !!tags &&
          _.some(builders, function (builder) {
            return buildTypes.matches(buildableOf(builder), tags);
          });
        if (reachable) {
          reached.push(unit);
          added = true;
        }
        return !reachable;
      });
    }

    return _.intersection(held, reached);
  };

  // loaded is race_cells.load()'s { units, specs }. obtainable is every unit
  // a card can grant, as vanilla paths. modSpecs is gw_play/specs.js's mod,
  // which applies an inventory's unit_types and buildable_types mods for
  // reach as a battle does; without it they are ignored.
  var fromSpecs = function (loaded, obtainable, modSpecs) {
    var specs = loaded.specs || {};
    var index = unitCells.buildIndex(loaded.units, specs, _.constant(true));

    var chainOf = function (path) {
      var chain = [];
      var current = path;
      for (var depth = 0; depth < MAX_CHAIN && _.isString(current); depth++) {
        if (_.includes(chain, current) || !specs[current]) {
          break;
        }
        chain.push(current);
        current = specs[current].base_spec;
      }
      return chain;
    };

    var declaring = function (unit, field) {
      return _.find(chainOf(unit), function (path) {
        return !_.isUndefined(specs[path][field]);
      });
    };

    // As the engine resolves them: a unit's tools, and its death weapon, come
    // from the nearest spec up its chain that declares them.
    var effectivePartsOf = function (unit) {
      var tools = declaring(unit, "tools");
      var death = declaring(unit, "death_weapon");
      return _.reject(tools ? unitCells.partsOf(tools, specs) : [], {
        role: "deathAmmo",
      }).concat(
        _.filter(death ? unitCells.partsOf(death, specs) : [], {
          role: "deathAmmo",
        })
      );
    };

    var ownersOfPart = {};
    _.forEach(index.units, function (unit) {
      _.forEach(effectivePartsOf(unit), function (part) {
        ownersOfPart[part.path] = (ownersOfPart[part.path] || []).concat(unit);
      });
    });

    var descendantsOf = {};
    _.forEach(index.units, function (unit) {
      _.forEach(chainOf(unit).slice(1), function (base) {
        descendantsOf[base] = (descendantsOf[base] || []).concat(unit);
      });
    });

    var withDescendants = function (units) {
      return _.uniq(
        units.concat(
          _.flatten(
            _.map(units, function (unit) {
              return descendantsOf[unit] || [];
            })
          )
        )
      );
    };

    var classOf = function (path) {
      var key = index.cellOf[path];
      return key ? parseCell(key) : undefined;
    };

    // The unit itself, the units that carry it as a part, the units that
    // inherit it as a base spec, and failing all three the units in its
    // directory. A unit brings the units that inherit it.
    var ownersOf = memoise(function (file) {
      if (index.cellOf[file]) {
        return withDescendants([file]);
      }
      var owners = _.uniq(
        (ownersOfPart[file] || []).concat(descendantsOf[file] || [])
      );
      if (owners.length) {
        return owners;
      }
      var dir = directoryOf(file);
      return withDescendants(
        _.filter(index.units, function (unit) {
          return directoryOf(unit) === dir;
        })
      );
    });

    // An inventory holds vanilla paths, and the referee moves a mod on the
    // vanilla commander to a race's, so a race commander stands in for the
    // base commander.
    var isRaceUnit = function (unit) {
      return !unitCells.vanillaMember(index.tagsOf[unit]);
    };

    var ownedBy = function (file, unit) {
      var owners = ownersOf(file);
      return (
        _.includes(owners, unit) ||
        (isRaceUnit(unit) && _.includes(owners, gwoUnit.commander))
      );
    };

    var buildModsOf = function (mods) {
      if (!_.isFunction(modSpecs)) {
        return [];
      }
      return _.filter(mods || [], function (mod) {
        return (
          !!mod &&
          _.isString(mod.path) &&
          BUILD_PATH.test(mod.path) &&
          Object.prototype.hasOwnProperty.call(specs, mod.file)
        );
      });
    };

    // The tags and build lists of the files the mods name, and of the units
    // that inherit them, as the mods leave them. specs.mod flattens a file
    // it loads and changes it in place, so it gets a copy of each.
    var remake = function (buildMods) {
      var copy = _.clone(specs);
      var files = _.uniq(_.pluck(buildMods, "file"));
      _.forEach(files, function (file) {
        copy[file] = _.cloneDeep(specs[file]);
      });
      modSpecs(copy, buildMods, "");
      var remade = { tagsOf: {}, buildableOf: {} };
      _.forEach(withDescendants(files), function (unit) {
        remade.tagsOf[unit] = _.map(
          unitCells.effectiveTypes(unit, copy),
          unitCells.bare
        );
        var buildable = unitCells.chainValue(unit, copy, "buildable_types");
        remade.buildableOf[unit] =
          _.isString(buildable) && buildable.length ? buildable : undefined;
      });
      return remade;
    };

    var remadeCache = {};
    // Keys in the order they were cached, oldest first.
    var remadeOrder = [];
    var remadeFor = function (buildMods) {
      var cacheKey = JSON.stringify(buildMods);
      if (!Object.prototype.hasOwnProperty.call(remadeCache, cacheKey)) {
        remadeCache[cacheKey] = remake(buildMods);
        remadeOrder.push(cacheKey);
        if (remadeOrder.length > MAX_CACHED) {
          delete remadeCache[remadeOrder.shift()];
        }
      }
      return remadeCache[cacheKey];
    };

    // mods: the inventory's, whose unit_types and buildable_types mods
    // change what builds what.
    var reachable = function (held, commander, mods) {
      var from = isRaceUnit(commander) ? gwoUnit.commander : commander;
      var buildMods = buildModsOf(mods);
      var remade = buildMods.length
        ? remadeFor(buildMods)
        : { tagsOf: {}, buildableOf: {} };
      var read = function (field, unit) {
        return _.has(remade[field], unit)
          ? remade[field][unit]
          : index[field][unit];
      };
      return reachFrom(
        held,
        commander,
        function (unit) {
          return read("buildableOf", unit === commander ? from : unit);
        },
        function (unit) {
          return read("tagsOf", unit);
        }
      );
    };

    return {
      via: "specs",
      classOf: classOf,
      ownersOf: ownersOf,
      ownedBy: ownedBy,
      reachable: reachable,
      obtainable: obtainableOf(obtainable, classOf),
    };
  };

  // Membership in shared/unit_groups.js, most specific group first. Vanilla
  // units only: a race's units are in no group.
  var GROUP_CELLS = [
    ["titans", "Land/Advanced/Titan"],
    ["airFactories", "Air/*/Factory"],
    ["botFactories", "Bot/*/Factory"],
    ["vehicleFactories", "Vehicle/*/Factory"],
    ["navalFactories", "Naval/*/Factory"],
    ["orbitalFactories", "Orbital/*/Factory"],
    ["airBasicCombat", "Air/Basic/Combat"],
    ["airAdvancedCombat", "Air/Advanced/Combat"],
    ["botsBasicCombat", "Bot/Basic/Combat"],
    ["botsAdvancedCombat", "Bot/Advanced/Combat"],
    ["vehiclesBasicCombat", "Vehicle/Basic/Combat"],
    ["vehiclesAdvancedCombat", "Vehicle/Advanced/Combat"],
    ["navalBasicCombat", "Naval/Basic/Combat"],
    ["navalAdvancedCombat", "Naval/Advanced/Combat"],
    ["orbitalBasicCombat", "Orbital/Basic/Combat"],
    ["orbitalAdvancedCombat", "Orbital/Advanced/Combat"],
    ["airBasicMobile", "Air/Basic/Fabber"],
    ["airAdvancedMobile", "Air/Advanced/Fabber"],
    ["botsBasicMobile", "Bot/Basic/Fabber"],
    ["botsAdvancedMobile", "Bot/Advanced/Fabber"],
    ["vehiclesBasicMobile", "Vehicle/Basic/Fabber"],
    ["vehiclesAdvancedMobile", "Vehicle/Advanced/Fabber"],
    ["navalBasicMobile", "Naval/Basic/Fabber"],
    ["navalAdvancedMobile", "Naval/Advanced/Fabber"],
    ["orbitalBasicMobile", "Orbital/Basic/Fabber"],
    ["orbitalAdvancedMobile", "Orbital/Advanced/Fabber"],
    ["structuresSuperWeapons", "Land/Advanced/Superweapon"],
    ["structuresDefencesAdvanced", "Land/Advanced/Defense"],
    ["structuresDefencesBasic", "Land/Basic/Defense"],
    ["structuresArtilleryAdvanced", "Land/Advanced/Defense"],
    ["structuresArtilleryBasic", "Land/Basic/Defense"],
    ["structuresEcoAdvanced", "Land/Advanced/Metal"],
    ["structuresEcoBasic", "Land/Basic/Metal"],
    ["structuresEcoStorage", "Land/Basic/Storage"],
    ["structuresIntelAdvanced", "Land/Advanced/Intel"],
    ["structuresIntelBasic", "Land/Basic/Intel"],
    ["teleporters", "Land/Basic/Teleporter"],
  ];

  var FACTORY_DOMAINS = {
    Air: "airFactories",
    Bot: "botFactories",
    Vehicle: "vehicleFactories",
    Naval: "navalFactories",
    Orbital: "orbitalFactories",
  };

  var fromGroups = function (groups) {
    var advancedFactories = groups.factoriesAdvanced || [];

    var classOf = function (path) {
      var row = _.find(GROUP_CELLS, function (candidate) {
        return _.includes(groups[candidate[0]] || [], path);
      });
      if (!row) {
        return undefined;
      }
      var key = row[1].replace(
        "*",
        _.includes(advancedFactories, path) ? "Advanced" : "Basic"
      );
      return parseCell(key);
    };

    var known = function (path) {
      return !!classOf(path);
    };

    var ownersOf = memoise(function (file) {
      if (known(file)) {
        return [file];
      }
      var dir = directoryOf(file);
      return _.filter(_.uniq(groups.units || []), function (unit) {
        return directoryOf(unit) === dir;
      });
    });

    // No base_spec chains here: a file of the base commander's is taken to
    // be every commander's.
    var ownedBy = function (file, unit) {
      var owners = ownersOf(file);
      return (
        _.includes(owners, unit) ||
        (_.includes(owners, gwoUnit.commander) &&
          _.startsWith(unit, COMMANDERS))
      );
    };

    // No build lists here: a mobile unit is reached while a factory of its
    // domain is held, and a structure always is.
    var reachable = function (held) {
      return _.filter(held, function (unit) {
        var cell = classOf(unit);
        if (!cell || (cell.cls !== "Combat" && cell.cls !== "Fabber")) {
          return true;
        }
        var factories = groups[FACTORY_DOMAINS[cell.domain]] || [];
        return !!_.intersection(held, factories).length;
      });
    };

    return {
      via: "groups",
      classOf: classOf,
      ownersOf: ownersOf,
      ownedBy: ownedBy,
      reachable: reachable,
      obtainable: obtainableOf(groups.units, classOf),
    };
  };

  return {
    fromSpecs: fromSpecs,
    fromGroups: fromGroups,
    reachFrom: reachFrom,
  };
});
