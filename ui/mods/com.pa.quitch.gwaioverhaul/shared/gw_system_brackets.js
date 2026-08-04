// Groups a pool of real star systems into army-count brackets so Galactic War can scale
// system size with distance from the origin.
//
// Shared Systems for Galactic War swaps the star system templates for real .pas systems
// and reads gw_galaxy.js's `players` as a surface-area window
// (players*0.5 < surface_area < players*4), which never looks at spawn points - so size
// stops tracking how many commanders a map was built for. These brackets restore that
// from the landing zones themselves.
//
// This is the measured sibling of the base-game-shadowed gw_galaxy.js (see
// CONTRIBUTING.md's "Node test reach for base-game-shadowed modules"): pure arithmetic
// over plain objects, unit-tested by test/gw_system_brackets.test.js, while the builder
// glue that calls it stays in the coverage-excluded shadowed file.
define(function () {
  // What system_editor.js's customLandingZones defaults an absent or zero rule bound to.
  var MIN_ARMIES = 2;
  var MAX_ARMIES = 32;

  // Community map packs ship string-typed bounds ({"min": "2"}), which the game coerces.
  var ruleBound = function (value, fallback) {
    var bound = Number(value);
    return bound ? bound : fallback;
  };

  // Each zone's [min, max]: the army counts at which the game uses that spawn.
  // landing_zones is either {list, rules} or a bare [[x, y, z], ...] - only map packs
  // and My Systems produce the bare form, so stock data never exercises it.
  var zoneArmyRanges = function (system) {
    var planets = (system && system.planets) || [];
    var zones = [];

    for (var p = 0; p < planets.length; p++) {
      var landing = planets[p].landing_zones;
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

  // n armies fit only when at least n zones accept n, so the result is already bounded
  // by the zone count and needs no further cap.
  var capacityRange = function (zones) {
    var first = 0;
    var last = 0;

    for (var n = 1; n <= MAX_ARMIES; n++) {
      var active = 0;
      for (var z = 0; z < zones.length; z++) {
        if (zones[z][0] <= n && n <= zones[z][1]) {
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
    if (!isFinite(min) || !isFinite(max)) {
      return null;
    }
    // new_game.js floors the displayed count at 2 the same way.
    return [Math.max(MIN_ARMIES, min), Math.max(MIN_ARMIES, max)];
  };

  // UberUtility.fixupPlanetConfig renames planet.planet to planet.generator and deletes
  // the original, and every pooled system has been through it. The raw form still reads,
  // so this runs against default_systems.json straight off disk.
  var generatedArmies = function (system) {
    var planets = (system && system.planets) || [];
    var total = 0;

    for (var p = 0; p < planets.length; p++) {
      var generator = planets[p].generator || planets[p].planet;
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
      // `players` counts humans and humans share an army, so a declared [2,10] on two
      // landing zones is two armies of five. GW seats one commander per spawn, so the
      // zone count is the ceiling and the minimum follows it down rather than inverting.
      if (zones.length) {
        declared[1] = Math.min(declared[1], zones.length);
        declared[0] = Math.min(declared[0], declared[1]);
      }
      return declared;
    }

    if (zones.length) {
      return capacityRange(zones);
    }

    // numArmies is the generator's symmetric start count, which says nothing about
    // hand-placed spawns - so it stands in only for a system that has none.
    var generated = generatedArmies(system);
    return generated ? [MIN_ARMIES, Math.max(MIN_ARMIES, generated)] : null;
  };

  var bracketsFrom = function (systems) {
    var pool = systems || [];
    var byRange = {};
    var brackets = [];

    for (var i = 0; i < pool.length; i++) {
      var range = armyRange(pool[i]);
      if (!range) {
        console.warn(
          "gwoSystemBrackets: no army count could be derived for '" +
            ((pool[i] && pool[i].name) || "unnamed system") +
            "', dropping it from the galaxy pool"
        );
        continue;
      }
      var key = range[0] + ":" + range[1];
      if (!byRange[key]) {
        byRange[key] = { min: range[0], max: range[1], systems: [] };
        brackets.push(byRange[key]);
      }
      byRange[key].systems.push(pool[i]);
    }

    var span = function (bracket) {
      return bracket.max - bracket.min;
    };
    brackets.sort(function (a, b) {
      return a.min - b.min || span(a) - span(b) || a.max - b.max;
    });

    // star.distance() is 0 at the origin but no derived range starts below 2, so without
    // this the nearest stars would have nothing to draw from.
    if (brackets.length) {
      brackets[0].min = 0;
    }

    return brackets;
  };

  var highestMax = function (brackets) {
    var highest = 0;
    for (var i = 0; i < brackets.length; i++) {
      if (brackets[i].max > highest) {
        highest = brackets[i].max;
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

  // The pool holds live references - My Systems is a bound IndexedDB row - so the
  // starting_planet backfill wondible's withoutBrokenSystems does in place goes on the
  // copy instead.
  var copyOf = function (system) {
    var copy = JSON.parse(JSON.stringify(system));
    var started = false;

    for (var i = 0; i < copy.planets.length; i++) {
      if (copy.planets[i].starting_planet) {
        started = true;
      }
    }
    if (!started) {
      copy.planets[0].starting_planet = true;
    }

    return copy;
  };

  // Hands each star the smallest unplaced system that still fits. `random` is consumed
  // only while ordering; take() must stay deterministic or a seed stops reproducing a
  // galaxy.
  var selectorFor = function (brackets, random) {
    var list = brackets || [];
    var highest = highestMax(list);
    var ordered = [];
    var reused = 0;
    var i;

    for (i = 0; i < list.length; i++) {
      for (var s = 0; s < list[i].systems.length; s++) {
        ordered.push({
          system: list[i].systems[s],
          min: list[i].min,
          max: list[i].max,
          shuffle: random(),
          taken: false,
        });
      }
    }
    ordered.sort(function (a, b) {
      return a.max - b.max || a.shuffle - b.shuffle;
    });

    // Walks in `max` order, so the first out-of-range entry that could still hold the
    // star is the closest fit above it - the gap fill candidatesFor describes.
    var eligible = function (wanted) {
      var inRange = [];
      var gap = [];
      var gapMax = 0;

      for (var e = 0; e < ordered.length; e++) {
        var entry = ordered[e];
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

      for (var e = 0; e < entries.length; e++) {
        if (!usableSystem(entries[e].system)) {
          continue;
        }
        if (!entries[e].taken) {
          entries[e].taken = true;
          return copyOf(entries[e].system);
        }
        placed.push(entries[e]);
      }

      // A pool smaller than the galaxy: reuse in order rather than leave a star empty.
      if (!placed.length) {
        return null;
      }
      return copyOf(placed[reused++ % placed.length].system);
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
