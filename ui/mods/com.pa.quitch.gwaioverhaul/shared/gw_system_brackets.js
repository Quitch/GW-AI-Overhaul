// Groups a pool of real star systems into army-count brackets, so Galactic War
// can scale system size with distance from the origin.
//
// Shared Systems for Galactic War reads gw_galaxy.js's `players` as a surface-area
// window and never looks at spawn points, so size stops tracking how many
// commanders a map was built for. These brackets restore that from the landing
// zones. A measured sibling of the shadowed gw_galaxy.js - see testing.md.
define(() => {
  // What system_editor.js's customLandingZones defaults an absent or zero rule bound to.
  const MIN_ARMIES = 2;
  const MAX_ARMIES = 32;

  // Community map packs ship string-typed bounds ({"min": "2"}), which the game coerces.
  const ruleBound = (value, fallback) => {
    const bound = Number(value);
    return bound || fallback;
  };

  // Each zone's [min, max]. landing_zones is either {list, rules} or a bare
  // [[x, y, z], ...], the latter only from map packs and My Systems.
  const zoneArmyRanges = (system) => {
    const planets = (system && system.planets) || [];
    const zones = [];

    for (const planet of planets) {
      const landing = planet.landing_zones;
      if (!landing) {
        continue;
      }
      const bare = Array.isArray(landing);
      const list = (bare ? landing : landing.list) || [];
      const rules = (bare ? [] : landing.rules) || [];
      for (let z = 0; z < list.length; z++) {
        const rule = rules[z] || {};
        zones.push([
          ruleBound(rule.min, MIN_ARMIES),
          ruleBound(rule.max, MAX_ARMIES),
        ]);
      }
    }

    return zones;
  };

  // n armies fit only when n zones accept n, so this is already zone-bounded.
  const capacityRange = (zones) => {
    let first = 0;
    let last = 0;

    for (let n = 1; n <= MAX_ARMIES; n++) {
      let active = 0;
      for (const zone of zones) {
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

  const declaredRange = (system) => {
    const declared = system && system.players;
    if (!declared || declared.length !== 2) {
      return null;
    }
    const min = Number(declared[0]);
    const max = Number(declared[1]);
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      return null;
    }
    // new_game.js floors the displayed count at 2 the same way.
    return [Math.max(MIN_ARMIES, min), Math.max(MIN_ARMIES, max)];
  };

  // Every pooled system has been through UberUtility.fixupPlanetConfig, which
  // renames planet.planet to planet.generator. Both forms are read, so this also
  // works against default_systems.json straight off disk.
  const generatedArmies = (system) => {
    const planets = (system && system.planets) || [];
    let total = 0;

    for (const planet of planets) {
      const generator = planet.generator || planet.planet;
      if (generator && generator.numArmies) {
        total += generator.numArmies;
      }
    }

    return total;
  };

  const armyRange = (system) => {
    const zones = zoneArmyRanges(system);
    const declared = declaredRange(system);

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
    const generated = generatedArmies(system);
    return generated ? [MIN_ARMIES, Math.max(MIN_ARMIES, generated)] : null;
  };

  // Pool order decides which system lands on which star, and Shared Systems
  // builds its pool in download-completion order. Sort, or the seed stops
  // reproducing a galaxy.
  const poolOrder = (system) => {
    const planets = (system && system.planets) || [];
    return [
      (system && system.name) || "",
      planets.length,
      _.map(planets, (planet) => (planet && planet.name) || "").join(","),
    ].join("|");
  };

  const bracketsFrom = (systems) => {
    const pool = _.sortBy(systems || [], poolOrder);
    const byRange = {};
    const brackets = [];

    for (const system of pool) {
      const range = armyRange(system);
      if (!range) {
        console.warn(
          `gwoSystemBrackets: no army count could be derived for '${(system && system.name) || "unnamed system"}', dropping it from the galaxy pool`,
        );
        continue;
      }
      const key = `${range[0]}:${range[1]}`;
      if (!byRange[key]) {
        byRange[key] = { min: range[0], max: range[1], systems: [] };
        brackets.push(byRange[key]);
      }
      byRange[key].systems.push(system);
    }

    const span = (bracket) => bracket.max - bracket.min;
    brackets.sort(
      (a, b) => a.min - b.min || span(a) - span(b) || a.max - b.max,
    );

    // star.distance() is 0 at the origin, but no derived range starts below 2.
    if (brackets.length) {
      brackets[0].min = 0;
    }

    return brackets;
  };

  const highestMax = (brackets) => {
    let highest = 0;
    for (const bracket of brackets) {
      if (bracket.max > highest) {
        highest = bracket.max;
      }
    }
    return highest;
  };

  const candidatesFor = (brackets, armies) => {
    const list = brackets || [];
    if (!list.length) {
      return [];
    }

    const wanted = Math.min(armies, highestMax(list));
    let systems = [];
    let i;

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
    let nearest = null;
    for (i = 0; i < list.length; i++) {
      if (list[i].max >= wanted && (!nearest || list[i].max < nearest.max)) {
        nearest = list[i];
      }
    }
    return nearest ? nearest.systems.slice() : [];
  };

  // What gw_galaxy.js dereferences the moment a star is given a system.
  const usableSystem = (system) =>
    !!(
      system &&
      system.planets &&
      system.planets.length &&
      system.planets[0].generator
    );

  // The pool holds live references - My Systems is a bound IndexedDB row - so
  // withoutBrokenSystems' in-place backfill has to go on the copy instead.
  const copyOf = (system) => {
    const copy = JSON.parse(JSON.stringify(system));
    let started = false;

    for (const planet of copy.planets) {
      if (planet.starting_planet) {
        started = true;
      }
    }
    if (!started) {
      copy.planets[0].starting_planet = true;
    }

    return copy;
  };

  // Hands each star the smallest unplaced system that fits. `random` is consumed
  // only while ordering - take() must stay deterministic.
  const selectorFor = (brackets, random) => {
    const list = brackets || [];
    const highest = highestMax(list);
    const ordered = [];
    let reused = 0;

    for (const bracket of list) {
      for (const system of bracket.systems) {
        ordered.push({
          system,
          min: bracket.min,
          max: bracket.max,
          shuffle: random(),
          taken: false,
        });
      }
    }
    ordered.sort((a, b) => a.max - b.max || a.shuffle - b.shuffle);

    // Walks in `max` order, so the first out-of-range entry that fits is the
    // closest above - the gap fill candidatesFor describes.
    const eligible = (wanted) => {
      const inRange = [];
      const gap = [];
      let gapMax = 0;

      for (const entry of ordered) {
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

    const take = (armies) => {
      const entries = eligible(Math.min(armies, highest));
      const placed = [];

      // `entry` is the live `ordered` element, so setting taken here is what
      // stops a system being placed twice.
      for (const entry of entries) {
        if (!usableSystem(entry.system)) {
          continue;
        }
        if (!entry.taken) {
          entry.taken = true;
          return copyOf(entry.system);
        }
        placed.push(entry);
      }

      // A pool smaller than the galaxy: reuse in order rather than leave a star empty.
      if (!placed.length) {
        return null;
      }
      return copyOf(placed[reused++ % placed.length].system);
    };

    return {
      take,
    };
  };

  return {
    armyRange,
    bracketsFrom,
    candidatesFor,
    selectorFor,
  };
});
