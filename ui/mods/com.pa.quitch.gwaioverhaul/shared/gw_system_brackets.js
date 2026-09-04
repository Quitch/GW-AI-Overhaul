// Groups a pool of real star systems into army-count brackets, so system size
// can track distance from the origin under Shared Systems for Galactic War. See
// galaxy.md, "System brackets, under Shared Systems for Galactic War".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
], function (gwoBiomes) {
  // What system_editor.js's customLandingZones defaults an absent or zero rule bound to.
  var MIN_ARMIES = 2;
  var MAX_ARMIES = 32;

  // Community map packs ship string-typed bounds ({"min": "2"}), which the game coerces.
  var ruleBound = function (value, fallback) {
    var bound = Number(value);
    return bound || fallback;
  };

  // Each zone's [min, max]. landing_zones is either {list, rules} or a bare
  // [[x, y, z], ...], the latter only from map packs and My Systems.
  var zoneArmyRanges = function (system) {
    var planets = (system && system.planets) || [];
    var zones = [];

    for (var planet of planets) {
      var landing = planet.landing_zones;
      if (!landing) {
        continue;
      }
      var bare = Array.isArray(landing);
      var list = (bare ? landing : landing.list) || [];
      var rules = (bare ? [] : landing.rules) || [];
      for (var z = 0; z < list.length; z++) {
        var rule = rules[z] || {};
        zones.push([
          ruleBound(rule.min, MIN_ARMIES),
          ruleBound(rule.max, MAX_ARMIES),
        ]);
      }
    }

    return zones;
  };

  // n armies fit only when n zones accept n, so this is already zone-bounded.
  var capacityRange = function (zones) {
    var first = 0;
    var last = 0;

    for (var n = 1; n <= MAX_ARMIES; n++) {
      var active = 0;
      for (var zone of zones) {
        if (zone[0] <= n && n <= zone[1]) {
          active++;
        }
      }
      if (active >= n) {
        first = first || n;
        last = n;
      }
    }

    return first
      ? [Math.max(MIN_ARMIES, first), Math.max(MIN_ARMIES, last)]
      : null;
  };

  var declaredRange = function (system) {
    var declared = system && system.players;
    if (!declared || declared.length !== 2) {
      return null;
    }
    var min = Number(declared[0]);
    var max = Number(declared[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    // new_game.js floors the displayed count at 2 the same way.
    return [Math.max(MIN_ARMIES, min), Math.max(MIN_ARMIES, max)];
  };

  var generatedArmies = function (system) {
    var planets = (system && system.planets) || [];
    var total = 0;

    for (var planet of planets) {
      var generator = gwoBiomes.generatorOf(planet);
      if (generator && generator.numArmies) {
        total += generator.numArmies;
      }
    }

    return total;
  };

  var armyRange = function (system) {
    var zones = zoneArmyRanges(system);
    var declared = declaredRange(system);

    if (declared) {
      // `players` counts humans, who share an army, so [2,10] over two landing
      // zones is two armies of five. GW seats one commander per spawn, making
      // the zone count the ceiling.
      if (zones.length) {
        declared[1] = Math.min(declared[1], zones.length);
        declared[0] = Math.min(declared[0], declared[1]);
      }
      return declared;
    }

    if (zones.length) {
      return capacityRange(zones);
    }

    // numArmies is the generator's symmetric start count, which says nothing
    // about hand-placed spawns, so it only stands in for a system with none.
    var generated = generatedArmies(system);
    return generated ? [MIN_ARMIES, Math.max(MIN_ARMIES, generated)] : null;
  };

  // Pool order decides which system lands on which star, and Shared Systems
  // builds its pool in download-completion order. Sort, or the seed stops
  // reproducing a galaxy.
  var poolOrder = function (system) {
    var planets = (system && system.planets) || [];
    return [
      (system && system.name) || "",
      planets.length,
      _.map(planets, function (planet) {
        return (planet && planet.name) || "";
      }).join(","),
    ].join("|");
  };

  // `providers` names the modded biomes a battle can be given; see galaxy.md.
  var bracketsFrom = function (systems, providers) {
    var pool = _.sortBy(systems || [], poolOrder);
    var byRange = {};
    var brackets = [];

    for (var system of pool) {
      var biome = gwoBiomes.unservableBiome(system, providers);
      if (biome) {
        console.warn(
          "gwoSystemBrackets: '" +
            ((system && system.name) || "unnamed system") +
            "' uses biome '" +
            biome +
            "', which the Galactic War server cannot load; dropping it from the galaxy pool"
        );
        continue;
      }
      var range = armyRange(system);
      if (!range) {
        console.warn(
          "gwoSystemBrackets: no army count could be derived for '" +
            ((system && system.name) || "unnamed system") +
            "', dropping it from the galaxy pool"
        );
        continue;
      }
      var key = range[0] + ":" + range[1];
      if (!byRange[key]) {
        byRange[key] = { min: range[0], max: range[1], systems: [] };
        brackets.push(byRange[key]);
      }
      byRange[key].systems.push(system);
    }

    var span = function (bracket) {
      return bracket.max - bracket.min;
    };
    brackets.sort(function (a, b) {
      return a.min - b.min || span(a) - span(b) || a.max - b.max;
    });

    // star.distance() is 0 at the origin, but no derived range starts below 2.
    if (brackets.length) {
      brackets[0].min = 0;
    }

    return brackets;
  };

  var highestMax = function (brackets) {
    var highest = 0;
    for (var bracket of brackets) {
      if (bracket.max > highest) {
        highest = bracket.max;
      }
    }
    return highest;
  };

  var candidatesFor = function (brackets, armies) {
    var list = brackets || [];
    if (!list.length) {
      return [];
    }

    var wanted = Math.min(armies, highestMax(list));
    var systems = [];
    var i;

    for (i = 0; i < list.length; i++) {
      if (list[i].min <= wanted && wanted <= list[i].max) {
        systems = systems.concat(list[i].systems);
      }
    }
    if (systems.length) {
      return systems;
    }

    // A gap in the cover - brackets [0,2] and [6,8], wanted 4. The clamp above
    // guarantees some bracket has max >= wanted, so this always finds one.
    var nearest = null;
    for (i = 0; i < list.length; i++) {
      if (list[i].max >= wanted && (!nearest || list[i].max < nearest.max)) {
        nearest = list[i];
      }
    }
    return nearest ? nearest.systems.slice() : [];
  };

  // What gw_galaxy.js dereferences the moment a star is given a system.
  var usableSystem = function (system) {
    return !!(
      system &&
      system.planets &&
      system.planets.length &&
      system.planets[0].generator
    );
  };

  // The pool holds live references - My Systems is a bound IndexedDB row - so
  // the starting_planet backfill goes on the copy, never on the source.
  var copyOf = function (system, providers) {
    var copy = JSON.parse(JSON.stringify(system));
    if (!_.some(copy.planets, "starting_planet")) {
      copy.planets[0].starting_planet = true;
    }

    var mods = gwoBiomes.modsFor(copy, providers);
    if (mods.length) {
      copy.gwoBiomeMods = mods;
    }

    return copy;
  };

  // Hands each star the smallest unplaced system that fits. `random` is consumed
  // only while ordering - take() must stay deterministic.
  var selectorFor = function (brackets, random, providers) {
    var list = brackets || [];
    var highest = highestMax(list);
    var ordered = [];
    var reused = 0;

    for (var bracket of list) {
      for (var system of bracket.systems) {
        ordered.push({
          system: system,
          min: bracket.min,
          max: bracket.max,
          shuffle: random(),
          taken: false,
        });
      }
    }
    ordered.sort(function (a, b) {
      return a.max - b.max || a.shuffle - b.shuffle;
    });

    // Walks in `max` order, so the first out-of-range entry that fits is the
    // closest above - the gap fill candidatesFor describes.
    var eligible = function (wanted) {
      var inRange = [];
      var gap = [];
      var gapMax = 0;

      for (var entry of ordered) {
        if (entry.min <= wanted && wanted <= entry.max) {
          inRange.push(entry);
        } else if (entry.max >= wanted) {
          gapMax = gapMax || entry.max;
          if (entry.max === gapMax) {
            gap.push(entry);
          }
        }
      }

      return inRange.length ? inRange : gap;
    };

    var take = function (armies) {
      var entries = eligible(Math.min(armies, highest));
      var placed = [];

      // `entry` is the live `ordered` element, so setting taken here is what
      // stops a system being placed twice.
      for (var entry of entries) {
        if (!usableSystem(entry.system)) {
          continue;
        }
        if (!entry.taken) {
          entry.taken = true;
          return copyOf(entry.system, providers);
        }
        placed.push(entry);
      }

      // A pool smaller than the galaxy: reuse in order rather than leave a star empty.
      if (!placed.length) {
        return null;
      }
      return copyOf(placed[reused++ % placed.length].system, providers);
    };

    return {
      take: take,
    };
  };

  return {
    armyRange: armyRange,
    bracketsFrom: bracketsFrom,
    candidatesFor: candidatesFor,
    selectorFor: selectorFor,
  };
});
