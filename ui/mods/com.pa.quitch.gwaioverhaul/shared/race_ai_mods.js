// A card's AI mods aimed at a race AI's own unit-map keys: the stock keys a
// descriptor or a load file names become the race keys of the units they
// stand for, and a builder joins a target only where it can build it. Pure.
// See ai-pipeline.md, "Race trees".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
], function (buildTypes, unitCells) {
  var hasOwn = function (object, key) {
    return !!object && Object.prototype.hasOwnProperty.call(object, key);
  };

  var memoize = function (produce) {
    var store = {};
    return function (key) {
      if (!hasOwn(store, key)) {
        store[key] = produce(key);
      }
      return store[key];
    };
  };

  var asSet = function (units) {
    var set = {};
    _.forEach(units, function (unit) {
      set[unit] = true;
    });
    return set;
  };

  var AI_TECH_PATH = "/pa/ai_tech/";

  // Where a load's file lives under AI_TECH_PATH. Undefined rather than a
  // throw: the referee's callers run inside a deferred callback, where a
  // throw is swallowed and hangs the battle launch.
  var managerPath = function (type) {
    switch (type) {
      case "fabber":
        return "fabber_builds/";
      case "factory":
        return "factory_builds/";
      case "platoon":
        return "platoon_builds/";
      case "template":
        return "platoon_templates/";
      default:
        return undefined;
    }
  };

  // A load descriptor's file, or undefined for a type with no directory.
  var loadPath = function (mod) {
    var directory = managerPath(mod.type);
    return _.isUndefined(directory)
      ? undefined
      : AI_TECH_PATH + directory + mod.value;
  };

  // The lookups every aim shares, built once per race tree or scorer view.
  // params: stock and race (unit_map objects), repointed ({ key: true }),
  // cells ({ vanilla, race }), engineKeys (shared/races.js engineKeysFor).
  var table = function (params) {
    var stock = params.stock || {};
    var raceMap = params.race || {};
    var repointed = params.repointed || {};
    var vanilla = params.cells.vanilla;
    var race = params.cells.race;
    var engineKeys = params.engineKeys || {};
    var standIns = unitCells.standInsFor(vanilla, race);
    var tagsOf = _.assign({}, vanilla.tagsOf, race.tagsOf);
    var buildableOf = function (unit) {
      return race.buildableOf[unit] || vanilla.buildableOf[unit];
    };
    var raceKeys = _.keys(raceMap);

    var entryUnits = function (entry, candidates) {
      if (entry && _.isString(entry.spec_id)) {
        return [entry.spec_id];
      }
      if (entry && _.isString(entry.unit_types)) {
        return _.filter(candidates, function (unit) {
          return buildTypes.matches(entry.unit_types, tagsOf[unit]);
        });
      }
      return [];
    };

    var raceKeyUnits = memoize(function (key) {
      return entryUnits(raceMap[key], _.keys(race.tagsOf));
    });

    var unitsOf = memoize(function (key) {
      if (hasOwn(raceMap, key)) {
        return raceKeyUnits(key);
      }
      return entryUnits(stock[key], vanilla.units);
    });

    var raceKeysWithin = function (set) {
      return _.filter(raceKeys, function (key) {
        var units = raceKeyUnits(key);
        return (
          units.length > 0 &&
          _.every(units, function (unit) {
            return set[unit] === true;
          })
        );
      });
    };

    var classTargets = memoize(function (key) {
      var members = entryUnits(stock[key], vanilla.units);
      return raceKeysWithin(asSet(_.flatten(_.map(members, standIns))));
    });

    var specTargets = memoize(function (key) {
      var engineUnit = engineKeys[key];
      return raceKeysWithin(
        _.isString(engineUnit)
          ? asSet([engineUnit])
          : asSet(standIns(stock[key].spec_id))
      );
    });

    // A stock key's race keys. A key the stock maps lack, and a spec key the
    // army's map keeps, are the race's already. A class key needs Custom58,
    // which no race unit carries.
    var targets = function (key, remade) {
      var entry = stock[key];
      if (!_.isString(key) || !entry) {
        return [key];
      }
      if (!_.isString(entry.spec_id)) {
        return _.isString(entry.unit_types) ? classTargets(key) : [key];
      }
      if (!repointed[key]) {
        return [key];
      }
      return remade[entry.spec_id] ? [] : specTargets(key);
    };

    var canBuild = memoize(function (pair) {
      var keys = JSON.parse(pair);
      var builders = unitsOf(keys[0]);
      var built = unitsOf(keys[1]);
      return (
        builders.length > 0 &&
        _.every(builders, function (builder) {
          var buildable = buildableOf(builder);
          return (
            !!buildable &&
            _.every(built, function (unit) {
              return buildTypes.matches(buildable, tagsOf[unit]);
            })
          );
        })
      );
    });

    return {
      targets: targets,
      canBuild: function (builder, target) {
        return canBuild(JSON.stringify([builder, target]));
      },
    };
  };

  var BUILDER_OPS = ["append", "prepend", "replace"];
  // Platoon builds name templates, not unit-map keys.
  var AS_WRITTEN_TYPES = ["platoon", "template"];

  // The aim for one inventory: `remade` ({ file: true }, unit_cells.js
  // remadeFiles) holds the units its own cards remake, which stay MLA's.
  var aim = function (aimTable, remade) {
    var remadeFiles = remade || {};

    var aimKeys = function (keys) {
      return _(keys || [])
        .map(function (key) {
          return aimTable.targets(key, remadeFiles);
        })
        .flatten()
        .uniq()
        .value();
    };

    var buildersFor = function (keys, target) {
      return _.filter(aimKeys(keys), function (builder) {
        return aimTable.canBuild(builder, target);
      });
    };

    var aimSilence = function (mod) {
      var value = mod.value || {};
      var builders = aimKeys(value.builders);
      return builders.length
        ? _.assign({}, mod, {
            value: _.assign({}, value, {
              builders: builders,
              except: aimKeys(value.except),
            }),
          })
        : undefined;
    };

    // Each descriptor once per target and change, as expandMods lands a spec
    // mod: a second stock key reaching the same target adds nothing, and the
    // same stock key again starts a new pass, so a second copy of a card
    // stacks.
    var mods = function (list) {
      var passes = {};
      var out = [];

      _.forEach(list, function (mod) {
        if (
          !mod ||
          mod.op === "load" ||
          _.includes(AS_WRITTEN_TYPES, mod.type)
        ) {
          out.push(mod);
          return;
        }
        if (mod.op === "silence") {
          var silenced = aimSilence(mod);
          if (silenced) {
            out.push(silenced);
          }
          return;
        }
        if (!_.isString(mod.toBuild)) {
          out.push(mod);
          return;
        }

        var builderOp =
          mod.idToMod === "builders" && _.includes(BUILDER_OPS, mod.op);
        _.forEach(aimKeys([mod.toBuild]), function (target) {
          var landed = _.assign({}, mod, { toBuild: target });
          if (builderOp) {
            var builders = buildersFor(
              _.isArray(mod.value) ? mod.value : [mod.value],
              target
            );
            if (!builders.length) {
              return;
            }
            landed.value =
              _.isArray(mod.value) || builders.length > 1
                ? builders
                : builders[0];
          }
          var key = target + "|" + JSON.stringify(_.omit(landed, "toBuild"));
          var pass = passes[key];
          if (!pass || pass[mod.toBuild]) {
            pass = passes[key] = {};
            out.push(landed);
          }
          pass[mod.toBuild] = true;
        });
      });

      return out;
    };

    // A load's file, by the load's type: each item once per target, with the
    // builders that can build it. An item with no to_build (a GiveUp) keeps
    // its aimed builders. A platoon or template load's file is as written: a
    // platoon item names a template and has no builders.
    var loadFile = function (json, type) {
      if (
        !json ||
        !_.isArray(json.build_list) ||
        _.includes(AS_WRITTEN_TYPES, type)
      ) {
        return json;
      }

      var items = [];
      _.forEach(json.build_list, function (item) {
        var builders = (item && item.builders) || [];
        if (!item || !_.isString(item.to_build)) {
          var aimed = aimKeys(builders);
          if (aimed.length) {
            items.push(_.assign(_.cloneDeep(item), { builders: aimed }));
          }
          return;
        }
        _.forEach(aimKeys([item.to_build]), function (target) {
          var guarded = buildersFor(builders, target);
          if (guarded.length) {
            items.push(
              _.assign(_.cloneDeep(item), {
                to_build: target,
                builders: guarded,
              })
            );
          }
        });
      });

      return _.assign({}, json, { build_list: items });
    };

    return { mods: mods, loadFile: loadFile };
  };

  return {
    AI_TECH_PATH: AI_TECH_PATH,
    managerPath: managerPath,
    loadPath: loadPath,
    table: table,
    aim: aim,
  };
});
