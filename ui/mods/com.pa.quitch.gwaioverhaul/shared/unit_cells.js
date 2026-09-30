// Capability cells: a unit's domain, tier, class and job read off its
// unit_types, so a race player owns the race units the vanilla units held
// stand for, and a mod on a vanilla file lands on the race files of those
// stand-ins in the same role. Pure: no engine globals, no model. See races.md.
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/build_types.js",
], function (buildTypes) {
  var PREFIX = "UNITTYPE_";
  // Faction bits, build permissions and flavour say nothing about what a unit
  // is for.
  var STRIP =
    /^(Custom\d+|FactoryBuild|CmdBuild|FabBuild|FabAdvBuild|FabOrbBuild|CombatFab\w*Build|CannonBuildable|Important|Interplanetary|NoBuild|Debug)$/;
  var COMMANDER = "Commander";
  var COMBAT = "Combat";
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

  // Whether the types say what the unit is for. The Deep Space Radar's stub
  // carries only its faction bit, which classify would put in the basic
  // fabrication tower's cell. See races.md, "Add-ons".
  var classifiable = function (types) {
    return stripTypes(types).length > 0;
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
  // A mobile combat unit's jobs, in this order. See races.md, "Jobs".
  var JOBS = [
    ["Heavy", ["Heavy"]],
    ["SelfDestruct", ["SelfDestruct"]],
    ["Fighter", ["Fighter"]],
    ["Bomber", ["Bomber"]],
    ["Gunship", ["Gunship"]],
    ["LaserPlatform", ["LaserPlatform"]],
    ["Tactical", ["Tactical"]],
    ["AirDefense", ["AirDefense"]],
    ["OrbitalDefense", ["OrbitalDefense"]],
    ["MissileDefense", ["MissileDefense"]],
    ["NukeDefense", ["NukeDefense"]],
    ["Defense", ["Defense"]],
    ["SurfaceDefense", ["SurfaceDefense"]],
    ["Shield", ["Shield"]],
    ["Artillery", ["Artillery"]],
    ["TacticalDefense", ["TacticalDefense"]],
    ["Transport", ["Transport"]],
    ["Teleporter", ["Teleporter"]],
    ["Scout", ["Scout", "Recon"]],
    ["RadarJammer", ["RadarJammer"]],
    ["Radar", ["Radar"]],
    ["Construction", ["Construction"]],
    ["Deconstruction", ["Deconstruction"]],
    ["MetalProduction", ["MetalProduction"]],
    ["EnergyProduction", ["EnergyProduction"]],
    ["Economy", ["Economy"]],
    ["Hover", ["Hover"]],
    ["WaterHover", ["WaterHover"]],
    ["Amphibious", ["Amphibious"]],
    ["Sub", ["Sub"]],
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
      return _.includes(tags, tag);
    };
    var cls;

    if (has("Titan")) {
      cls = "Titan";
    } else if (has("Commander") || has("SupportCommander")) {
      cls = COMMANDER;
    } else if (has("Mobile")) {
      // A mobile builder without a weapon is a fabber; every other mobile,
      // the combat fabbers included, fights.
      cls = has("Construction") && !has("Offense") ? "Fabber" : COMBAT;
    } else {
      cls = firstMatch(STRUCTURE_CLASSES, has, "Structure");
    }

    var domain = firstMatch(DOMAINS, has, "Land");
    var tier = has("Advanced") ? "Advanced" : "Basic";
    var jobs =
      cls === COMBAT
        ? _.pluck(
            _.filter(JOBS, function (row) {
              return _.some(row[1], has);
            }),
            0
          )
        : [];

    return {
      domain: domain,
      tier: tier,
      cls: cls,
      key: domain + "/" + tier + "/" + cls,
      jobs: jobs,
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

  // A unit's parts by role, over the reference fields spec_cache.forEachReference
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
      return _.includes(types || [], wanted);
    };
  };

  var customBits = function (types) {
    return _.filter(_.map(types || [], bare), function (tag) {
      return /^Custom\d+$/.test(tag);
    });
  };

  // Vanilla carries Custom58 or no faction bit at all.
  var vanillaMember = function (types) {
    return !_.some(customBits(types), function (tag) {
      return tag !== "Custom58";
    });
  };

  // Exclusive: a faction bit nothing registered owns, and none that is
  // (Section 17's Custom17 gantry builds). Such a unit belongs to no cell and
  // is reached only through the build rule. See races.md, "Add-ons".
  var exclusiveMember = function (knownBits) {
    return function (types) {
      var bits = customBits(types);
      return (
        bits.length > 0 &&
        !_.some(bits, function (bit) {
          return _.includes(knownBits || [], bit);
        })
      );
    };
  };

  var isCommanderCell = function (cell) {
    return _.endsWith(cell || "", "/" + COMMANDER);
  };

  var commandersOf = function (index) {
    return _.filter(index.units, function (unit) {
      return isCommanderCell(index.cellOf[unit]);
    });
  };

  // What `commanders` can build, and what that builds in turn, among the
  // units `tagsOf` holds.
  var reachFrom = function (commanders, tagsOf, buildableOf) {
    var tagsFor = function (unit) {
      return tagsOf[unit];
    };
    return buildTypes.reach(commanders, _.keys(tagsOf), buildableOf, tagsFor);
  };

  // What the index's commanders can build, and what that builds in turn.
  var buildReach = function (index) {
    return reachFrom(commandersOf(index), index.tagsOf, function (unit) {
      return index.buildableOf[unit];
    });
  };

  // `member(types, path)` says what is indexed; an optional
  // `exclusive(types)` marks units that get a cell, tags and build list but
  // sit in `exclusive` rather than `units` or `unitsByCell`, so nothing
  // counts them as the race's own and no cell grant reaches them.
  var buildIndex = function (unitPaths, specs, member, exclusive) {
    var index = {
      units: [],
      cellOf: {},
      jobsOf: {},
      unitsByCell: {},
      partsByUnit: {},
      partIndex: {},
      // Bare tags and buildable_types per unit, for the build rule below.
      tagsOf: {},
      buildableOf: {},
      exclusive: {},
      // What a commander can build: only these define jobs. See races.md,
      // "Jobs".
      fieldable: {},
    };

    _.forEach(_.uniq(unitPaths || []), function (path) {
      var types = effectiveTypes(path, specs);
      if (!specOf(specs, path)) {
        return;
      }
      var isExclusive = _.isFunction(exclusive) && exclusive(types);
      if (!isExclusive && !member(types, path)) {
        return;
      }
      var classified = classify(types);
      var cell = classified.key;
      index.cellOf[path] = cell;
      index.jobsOf[path] = classified.jobs;
      index.tagsOf[path] = _.map(types, bare);
      var buildable = chainValue(path, specs, "buildable_types");
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
      var parts = partsOf(path, specs);
      var dir = path.slice(0, path.lastIndexOf("/") + 1);
      index.partsByUnit[path] = parts;
      _.forEach(parts, function (part) {
        index.partIndex[part.path] = index.partIndex[part.path] || {
          role: part.role,
          units: [],
          home: [],
        };
        var entry = index.partIndex[part.path];
        if (!_.includes(entry.units, path)) {
          entry.units.push(path);
        }
        // A part shared by several units (the Dox's ammo also arms an
        // advanced vehicle) belongs to the unit whose directory holds it.
        if (_.startsWith(part.path, dir) && !_.includes(entry.home, path)) {
          entry.home.push(path);
        }
      });
    });

    _.forEach(index.partIndex, function (entry) {
      if (entry.home.length) {
        entry.units = entry.home;
      }
      delete entry.home;
    });

    _.forEach(index.unitsByCell, function (units) {
      units.sort();
    });

    index.fieldable = buildReach(index);

    return index;
  };

  // A cell no buildable vanilla unit occupies: empty, or held only by NoBuild
  // specs (Section 17 lists a NoBuild larva alone in a cell).
  var unfilledByVanilla = function (vanilla, cell) {
    return _.every(vanilla.unitsByCell[cell] || [], function (unit) {
      return _.includes(vanilla.tagsOf[unit], "NoBuild");
    });
  };

  // `granted` plus each candidate that something in it can build, each
  // builder by `buildable(unit)`, until nothing more is reachable.
  var addBuildable = function (granted, candidates, tagsOf, buildable) {
    var result = granted.slice();
    var pending = candidates;
    var added = true;

    while (added && pending.length) {
      added = false;
      var builders = _.filter(result, function (unit) {
        return !!buildable(unit);
      });
      pending = _.filter(pending, function (candidate) {
        var tags = tagsOf[candidate];
        var reachable = _.some(builders, function (builder) {
          return buildTypes.matches(buildable(builder), tags);
        });
        if (reachable) {
          result.push(candidate);
          added = true;
        }
        return !reachable;
      });
    }

    return result;
  };

  // The race's units in cells no vanilla unit occupies, and its exclusive
  // units whatever their cell, that something already granted can build -
  // Bugs' research unlock tokens, made by its research factories - until
  // nothing more is reachable. `buildableOf(unit)` resolves a builder's
  // build list; the race's own table by default.
  var buildableOrphans = function (granted, vanilla, race, buildableOf) {
    var buildable = _.isFunction(buildableOf)
      ? buildableOf
      : function (unit) {
          return race.buildableOf[unit];
        };
    var exclusive = race.exclusive;
    var orphans = _.filter(
      race.units.concat(_.keys(exclusive)),
      function (unit) {
        var cell = race.cellOf[unit];
        return (
          !isCommanderCell(cell) &&
          (exclusive[unit] || unfilledByVanilla(vanilla, cell)) &&
          !_.includes(granted, unit)
        );
      }
    );

    return addBuildable(granted, orphans, race.tagsOf, buildable);
  };

  // `fielded` plus each unit of `stock` that is held and that something
  // fielded can build, MLA builders included: stock units a race builds
  // although a race unit shares their cell. See races.md, "Units a race
  // builds itself".
  var buildableStockUnits = function (
    fielded,
    heldPaths,
    stock,
    vanilla,
    race
  ) {
    var candidates = _.filter(_.uniq(stock || []), function (unit) {
      return (
        _.includes(heldPaths || [], unit) &&
        !_.includes(fielded, unit) &&
        Object.prototype.hasOwnProperty.call(vanilla.tagsOf, unit)
      );
    });

    return addBuildable(fielded, candidates, vanilla.tagsOf, function (unit) {
      return race.buildableOf[unit] || vanilla.buildableOf[unit];
    });
  };

  // The deal asks once per card, so the last few index pairs are kept.
  var BUILT_CACHE_SIZE = 4;
  var builtCache = [];

  // The vanilla units the race can build, as a skirmish reaches them: what
  // its commanders build, and what that builds in turn, each builder by its
  // own list. See races.md, "Capability cells".
  var raceBuiltVanilla = function (vanilla, race) {
    var cached = _.find(
      builtCache,
      // By instance, not by the deep equality the shorthand would use.
      // eslint-disable-next-line lodash/matches-shorthand
      function (entry) {
        return entry.vanilla === vanilla && entry.race === race;
      }
    );
    if (cached) {
      return cached.built;
    }

    var reached = reachFrom(
      commandersOf(race),
      _.assign({}, vanilla.tagsOf, race.tagsOf),
      function (unit) {
        return race.buildableOf[unit] || vanilla.buildableOf[unit];
      }
    );
    var built = _.pick(reached, function (value, unit) {
      return Object.prototype.hasOwnProperty.call(vanilla.cellOf, unit);
    });

    builtCache.push({ vanilla: vanilla, race: race, built: built });
    if (builtCache.length > BUILT_CACHE_SIZE) {
      builtCache.shift();
    }
    return built;
  };

  // A lookup from a vanilla unit to the race units it stands for: every race
  // unit of its cell, except in a mobile combat cell, where a unit a
  // commander can build stands for the race units that share its job, and
  // the cell's homes also stand for those that share none. A unit that
  // stands for none but that the race can build stands for itself. See
  // races.md, "Jobs" and "Capability cells".
  var standInsFor = function (vanilla, race) {
    var plans = {};

    var jobOf = function (unit) {
      return vanilla.jobsOf[unit][0];
    };

    var planFor = function (cell) {
      if (!plans[cell]) {
        var fielded = _.filter(vanilla.unitsByCell[cell], function (unit) {
          return vanilla.fieldable[unit];
        });
        var jobs = _.compact(_.map(fielded, jobOf));
        var matchOf = {};
        _.forEach(race.unitsByCell[cell] || [], function (unit) {
          matchOf[unit] = _.find(race.jobsOf[unit], function (job) {
            return _.includes(jobs, job);
          });
        });
        var matched = _.compact(_.values(matchOf));
        var jobless = _.reject(fielded, jobOf);
        var leftover = _.reject(fielded, function (unit) {
          return _.includes(matched, jobOf(unit));
        });
        var homes = fielded;
        if (jobless.length) {
          homes = jobless;
        } else if (leftover.length) {
          homes = leftover;
        }
        plans[cell] = { matchOf: matchOf, homes: homes };
      }
      return plans[cell];
    };

    var cellStandIns = function (unit) {
      var cell = vanilla.cellOf[unit];
      var raceUnits = race.unitsByCell[cell] || [];
      if (!vanilla.fieldable[unit] || !_.endsWith(cell, "/" + COMBAT)) {
        return raceUnits;
      }
      var plan = planFor(cell);
      var job = jobOf(unit);
      var home = _.includes(plan.homes, unit);
      return _.filter(raceUnits, function (raceUnit) {
        var match = plan.matchOf[raceUnit];
        return match ? match === job : home;
      });
    };

    // A builder stands for itself only when it can build something the army
    // fields: MLA's fabrication barge builds only the mine and teleporter,
    // which Bugs field as their own.
    var selfBuilt;
    var buildsFielded = function (unit) {
      var buildable = vanilla.buildableOf[unit];
      if (!buildable) {
        return true;
      }
      if (!selfBuilt) {
        selfBuilt = _.filter(
          _.keys(raceBuiltVanilla(vanilla, race)),
          function (built) {
            return !cellStandIns(built).length;
          }
        );
      }
      var matches = function (tagsOf) {
        return function (target) {
          return (
            target !== unit && buildTypes.matches(buildable, tagsOf[target])
          );
        };
      };
      return (
        _.some(selfBuilt, matches(vanilla.tagsOf)) ||
        _.some(race.units, matches(race.tagsOf))
      );
    };

    return function (unit) {
      var standIns = cellStandIns(unit);
      return standIns.length ||
        !raceBuiltVanilla(vanilla, race)[unit] ||
        !buildsFielded(unit)
        ? standIns
        : [unit];
    };
  };

  // The race units the held vanilla units stand for, a commander-class unit
  // aside.
  var heldStandIns = function (heldPaths, vanilla, race) {
    var standIns = standInsFor(vanilla, race);

    return _(heldPaths || [])
      .uniq()
      .filter(function (path) {
        var cell = vanilla.cellOf[path];
        return !_.isUndefined(cell) && !isCommanderCell(cell);
      })
      .map(standIns)
      .flatten()
      .value();
  };

  // What a race player fields for the vanilla units held. See races.md,
  // "Capability cells".
  var raceUnitsFor = function (heldPaths, vanilla, race) {
    var kept = _.filter(heldPaths || [], function (path) {
      var cell = vanilla.cellOf[path];
      return _.isUndefined(cell)
        ? !vanilla.partIndex[path]
        : isCommanderCell(cell);
    });
    var granted = _.uniq(kept.concat(heldStandIns(heldPaths, vanilla, race)));

    return buildableOrphans(granted, vanilla, race);
  };

  // What an MLA player fields with add-ons active: everything held, plus the
  // add-on units each held vanilla unit stands for, plus what those and the
  // held vanilla builders can build. Nothing is taken away. See races.md,
  // "Add-ons".
  var addonUnitsFor = function (heldPaths, vanilla, addon) {
    var held = _.uniq(heldPaths || []);
    var granted = _.uniq(held.concat(heldStandIns(held, vanilla, addon)));

    return buildableOrphans(granted, vanilla, addon, function (unit) {
      return addon.buildableOf[unit] || vanilla.buildableOf[unit];
    });
  };

  // The vanilla commander-class units among those held.
  var heldCommanderUnits = function (heldPaths, vanilla) {
    return _.uniq(
      _.filter(heldPaths || [], function (path) {
        return isCommanderCell(vanilla.cellOf[path]);
      })
    );
  };

  // A vanilla part's targets: the parts of the same role under the stand-ins
  // of the units that mount it.
  var racePartsFor = function (part, race, standIns) {
    return _(part.units)
      .map(standIns)
      .flatten()
      .uniq()
      .map(function (unit) {
        return _.pluck(
          _.filter(race.partsByUnit[unit], { role: part.role }),
          "path"
        );
      })
      .flatten()
      .uniq()
      .value();
  };

  var targetsFor = function (file, vanilla, race, standIns) {
    if (Object.prototype.hasOwnProperty.call(vanilla.cellOf, file)) {
      return standIns(file);
    }
    var part = vanilla.partIndex[file];
    if (part) {
      return racePartsFor(part, race, standIns);
    }
    return undefined;
  };

  // Spec mods re-aimed at the race's stand-ins, once per pass. Identity mods
  // stay on their own unit. See races.md, "Capability cells".
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

  // `passThrough` ({ path: true }) names files changed as named, never
  // re-aimed: a race's own files, some of which carry no faction bit.
  var expandMods = function (mods, vanilla, race, has, passThrough) {
    var passes = {};
    var out = [];
    var remade = remadeFiles(mods || []);
    var standIns = standInsFor(vanilla, race);

    _.forEach(mods || [], function (mod) {
      if (!mod || !_.isString(mod.file) || remade[mod.file]) {
        out.push(mod);
        return;
      }

      // Kept on the file it names, and outside the passes, so no other
      // card's change can stand in for it. See tech-cards.md, "Which races a
      // card reaches".
      if (mod.stockOnly === true) {
        if (!_.isFunction(has) || has(mod.file)) {
          out.push(mod);
        }
        return;
      }

      var targets =
        passThrough && passThrough[mod.file]
          ? undefined
          : targetsFor(mod.file, vanilla, race, standIns);
      if (_.isUndefined(targets)) {
        out.push(mod);
        return;
      }

      var change = [mod.path, mod.op, JSON.stringify(mod.value)].join("|");
      // A kept original joins the passes too: a race can mount the vanilla
      // file itself (Legion's commanders fire the stock AA ammo), and that
      // file must take the change once, not once as itself and again as a
      // race part.
      var land = function (target, landed) {
        var key = target + "|" + change;
        var pass = passes[key];
        if (!pass || pass[mod.file]) {
          pass = passes[key] = {};
          out.push(landed);
        }
        pass[mod.file] = true;
      };

      var kept = _.isFunction(has) && has(mod.file);
      if (kept) {
        land(mod.file, mod);
      }
      // A unit that stands for itself takes the mod only as kept.
      _.forEach(targets, function (target) {
        if (target !== mod.file) {
          land(target, _.assign({}, mod, { file: target }));
        }
      });
    });

    return out;
  };

  // One path, a list, or groups nested in a list, in order, as a new list; a
  // whole gwoUnit race table names nothing. See races.md, "Capability cells".
  var unitPaths = function (units) {
    if (_.isString(units)) {
      return [units];
    }
    if (_.isArray(units) && _.every(units, _.isString)) {
      return units.slice();
    }
    return _([units || []])
      .flattenDeep()
      .reject(_.isPlainObject)
      .value();
  };

  var unitList = function (units) {
    return _.uniq(unitPaths(units));
  };

  // A card is worth offering when a unit it names stands for a race unit.
  var cardUsable = function (cardUnits, vanilla, race) {
    var standIns = standInsFor(vanilla, race);

    return _.some(unitList(cardUnits), function (unit) {
      return !!vanilla.cellOf[unit] && !_.isEmpty(standIns(unit));
    });
  };

  // The units a card reaches for a race player: the race units each named
  // vanilla unit stands for. A path with no cell, or in a Commander cell, is
  // kept as raceUnitsFor keeps it. No build reach: a factory card lists
  // factories, not what they build.
  var cardUnitsFor = function (cardUnits, vanilla, race) {
    var standIns = standInsFor(vanilla, race);

    return _(unitList(cardUnits))
      .map(function (unit) {
        var cell = vanilla.cellOf[unit];
        if (_.isUndefined(cell) || isCommanderCell(cell)) {
          return [unit];
        }
        return standIns(unit);
      })
      .flatten()
      .uniq()
      .value();
  };

  // The units a card reaches for an MLA player with add-ons: the card's own
  // vanilla units and the add-on units they stand for.
  var addonCardUnitsFor = function (cardUnits, vanilla, addon) {
    return _.uniq(
      unitList(cardUnits).concat(cardUnitsFor(cardUnits, vanilla, addon))
    );
  };

  // A merged unit map's spec_ids the race maps did not set, re-pointed from a
  // vanilla unit to the first race unit it stands for, so a key the engine
  // reads itself resolves to something the army can own. A unit that stands
  // for nothing keeps its entry. `avoid` ({ path: true }) names units to pass
  // over while another stand-in is offered: an add-on's, which the race's own
  // AI data does not know. Returns a copy.
  var unitMapFallback = function (map, raceMaps, vanilla, race, avoid) {
    if (!map || !map.unit_map) {
      return map;
    }
    var raceKeys = {};
    _.forEach(raceMaps || [], function (raceMap) {
      _.forEach(_.keys((raceMap && raceMap.unit_map) || {}), function (key) {
        raceKeys[key] = true;
      });
    });
    var standIns = standInsFor(vanilla, race);
    var preferred = function (candidates) {
      return (
        _.find(candidates, function (unit) {
          return !avoid || !avoid[unit];
        }) || candidates[0]
      );
    };

    var unitMap = {};
    _.forEach(map.unit_map, function (entry, key) {
      var cell =
        entry && _.isString(entry.spec_id) && vanilla.cellOf[entry.spec_id];
      var stand = cell && !raceKeys[key] ? standIns(entry.spec_id) : undefined;
      unitMap[key] =
        stand && stand.length
          ? _.assign({}, entry, { spec_id: preferred(stand) })
          : entry;
    });

    return _.assign({}, map, { unit_map: unitMap });
  };

  return {
    COMMANDER: COMMANDER,
    bare: bare,
    stripTypes: stripTypes,
    classifiable: classifiable,
    classify: classify,
    chainValue: chainValue,
    effectiveTypes: effectiveTypes,
    partsOf: partsOf,
    raceMember: raceMember,
    vanillaMember: vanillaMember,
    exclusiveMember: exclusiveMember,
    buildIndex: buildIndex,
    isCommanderCell: isCommanderCell,
    standInsFor: standInsFor,
    raceUnitsFor: raceUnitsFor,
    buildableStockUnits: buildableStockUnits,
    addonUnitsFor: addonUnitsFor,
    heldCommanderUnits: heldCommanderUnits,
    expandMods: expandMods,
    unitPaths: unitPaths,
    unitList: unitList,
    cardUsable: cardUsable,
    cardUnitsFor: cardUnitsFor,
    addonCardUnitsFor: addonCardUnitsFor,
    unitMapFallback: unitMapFallback,
  };
});
