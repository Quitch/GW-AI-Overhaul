// What a co-op AI player's units are, for judging a card by what it changes:
// each unit's domain, tier and class, the units a mod's file belongs to, and
// which held units its commander can reach. Two lookups answer the same three
// questions: one from the unit specs, and a vanilla-only one from unit-group
// membership for when the specs are not in. Pure. See tech-cards.md, "How AI
// players judge a card".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js",
], function (unitCells, buildTypes) {
  var MAX_CHAIN = 16;

  var parseCell = function (key) {
    var parts = key.split("/");
    return { domain: parts[0], tier: parts[1], cls: parts[2], key: key };
  };

  var directoryOf = function (path) {
    return path.slice(0, path.lastIndexOf("/") + 1);
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

  // loaded is race_cells.load()'s { units, specs }.
  var fromSpecs = function (loaded) {
    var specs = loaded.specs || {};
    var index = unitCells.buildIndex(loaded.units, specs, _.constant(true));
    var ownersOfPart = {};

    _.forEach(index.partsByUnit, function (parts, unit) {
      _.forEach(parts, function (part) {
        ownersOfPart[part.path] = (ownersOfPart[part.path] || []).concat(unit);
      });
    });

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

    var descendantsOf = {};
    _.forEach(index.units, function (unit) {
      _.forEach(chainOf(unit).slice(1), function (base) {
        descendantsOf[base] = (descendantsOf[base] || []).concat(unit);
      });
    });

    var classOf = function (path) {
      var key = index.cellOf[path];
      return key ? parseCell(key) : undefined;
    };

    // The unit itself, the units that carry it as a part, the units that
    // inherit it as a base spec, and failing all three the units in its
    // directory.
    var ownersOf = function (file) {
      if (index.cellOf[file]) {
        return [file];
      }
      var owners = _.uniq(
        (ownersOfPart[file] || []).concat(descendantsOf[file] || [])
      );
      if (owners.length) {
        return owners;
      }
      var dir = directoryOf(file);
      return _.filter(index.units, function (unit) {
        return directoryOf(unit) === dir;
      });
    };

    var reachable = function (held, commander) {
      return reachFrom(
        held,
        commander,
        function (unit) {
          return index.buildableOf[unit];
        },
        function (unit) {
          return index.tagsOf[unit];
        }
      );
    };

    return {
      via: "specs",
      classOf: classOf,
      ownersOf: ownersOf,
      reachable: reachable,
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

    var ownersOf = function (file) {
      if (known(file)) {
        return [file];
      }
      var dir = directoryOf(file);
      return _.filter(_.uniq(groups.units || []), function (unit) {
        return directoryOf(unit) === dir;
      });
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
      reachable: reachable,
    };
  };

  return {
    fromSpecs: fromSpecs,
    fromGroups: fromGroups,
    reachFrom: reachFrom,
  };
});
