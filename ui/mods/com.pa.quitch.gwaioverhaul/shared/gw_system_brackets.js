// Groups a pool of real star systems into army-count brackets so Galactic War can scale
// system size with distance from the origin.
//
// Shared Systems for Galactic War replaces the star system templates with real .pas
// systems and reinterprets gw_galaxy.js's `players` as a surface-area window
// (players*0.5 < surface_area < players*4), which never looks at spawn points - so a
// compact map built for eight commanders reads as an early-game system and a sprawling
// duel map reads as a late-game one. These brackets replace that with what the system's
// own landing zones say it can seat.
//
// The quantity is *armies*, not humans. Map makers routinely use `players` to count
// humans, and humans share an army, so a system declaring players [2,10] on two landing
// zones is two armies of five. GW fights army-versus-army with one commander per spawn,
// so the landing zone count is the ceiling and a larger `players` describes team sizes
// GW never uses.
//
// This is the measured sibling of the base-game-shadowed gw_galaxy.js (see
// CONTRIBUTING.md's "Node test reach for base-game-shadowed modules"): pure arithmetic
// over plain objects, unit-tested by test/gw_system_brackets.test.js, while the builder
// glue that calls it stays in the coverage-excluded shadowed file.
define(function () {
  // The base game's own landing-zone reader (system_editor.js's customLandingZones)
  // defaults an absent or zero rule bound to exactly these, so a range derived here
  // matches the spawns the game will actually honour.
  var MIN_ARMIES = 2;
  var MAX_ARMIES = 32;

  // Community map packs ship string-typed rule bounds ({"min": "2"}). In-game the
  // comparison coerces them, so read them as numbers rather than trusting the type.
  var ruleBound = function (value, fallback) {
    var bound = Number(value);
    return bound ? bound : fallback;
  };

  // Each zone as [min, max]: the army counts at which that spawn is used. landing_zones
  // is either {list, rules} or a bare [[x, y, z], ...]; only map packs and My Systems
  // use the bare form, so it is the branch stock data never exercises.
  var landingZones = function (system) {
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

  // How many armies the zones can seat: n works only when at least n zones accept n.
  // The result is inherently bounded by the zone count, so it needs no further cap.
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
  // the original, and every pooled system has been through it. The raw form is kept as a
  // fallback so this module can be run against default_systems.json straight off disk.
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
    var zones = landingZones(system);
    var declared = declaredRange(system);

    if (declared) {
      if (zones.length) {
        declared[1] = Math.min(declared[1], zones.length);
        declared[0] = Math.min(declared[0], declared[1]);
      }
      return declared;
    }

    if (zones.length) {
      return capacityRange(zones);
    }

    // Only reachable when no planet has a custom zone list at all: numArmies is the
    // generator's own symmetric start count, and mixing it with hand-placed zones
    // measurably worsened the derived range.
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

    brackets.sort(function (a, b) {
      return a.min - b.min || a.max - a.min - (b.max - b.min) || a.max - b.max;
    });

    // star.distance() is 0 at the origin, but no derived range starts below 2, so
    // without this the nearest stars would have nothing to draw from.
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

    // A gap in the cover - brackets [0,2] and [6,8] with wanted 4. The clamp above
    // guarantees some bracket has max >= wanted, so this always finds one.
    var nearest = null;
    for (i = 0; i < list.length; i++) {
      if (list[i].max >= wanted && (!nearest || list[i].max < nearest.max)) {
        nearest = list[i];
      }
    }
    return nearest ? nearest.systems.slice() : [];
  };

  var usableSystem = function (system) {
    return !!(
      system &&
      system.planets &&
      system.planets.length &&
      system.planets[0].generator
    );
  };

  // The pool holds live references - My Systems is a bound IndexedDB row - so the
  // starting_planet backfill wondible's withoutBrokenSystems does in place has to go on
  // the copy instead.
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

  // Orders the pool once and hands each star the smallest system that still fits,
  // without repeating one already placed. `random` is consumed only here, at
  // construction; take() must stay deterministic or a seed would stop reproducing a
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
    // star is the closest fit above it - the gap fill for covers like [0,2] and [6,8]
    // asked for 4.
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

      // Every eligible system is already on the map: a pool smaller than the galaxy.
      // Reuse in order rather than leaving the star with nothing.
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
