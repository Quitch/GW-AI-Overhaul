// Whether a saved war can still load the map packs it was built with. Pure:
// it is handed what the war recorded, what its stars are stamped with, and
// what shared/gwo_biome_mods.js found installed, and returns what to block on
// and what to merely mention. No engine globals, no model, no text - the
// caller localises. The race twin is shared/race_check.js. See galaxy.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js"], (
  gwoBiomes,
) => {
  const normalizeIdentifier = (identifier) =>
    _.isString(identifier) ? identifier.trim().toLowerCase() : "";

  const project = (mod) => {
    const identifier = normalizeIdentifier(mod && mod.identifier);

    return {
      identifier,
      displayName: (mod && mod.displayName) || identifier,
      version: mod && mod.version,
    };
  };

  // The map packs a saved war actually needs: every GW Server Mods-served
  // stamp on a star's system, plus any recorded mod no stamp names - a star
  // that lost its stamp still has the biome. Identifiers are lower-cased.
  const warBiomeMods = (recorded, systems) => {
    const needed = [];
    const add = (mod) => {
      const entry = project(mod);

      if (
        entry.identifier.length &&
        !_.some(needed, { identifier: entry.identifier })
      ) {
        needed.push(entry);
      }
    };

    _.forEach(systems || [], (system) => {
      _.forEach((system && system.gwoBiomeMods) || [], (record) => {
        if (gwoBiomes.isGwsmServed(record)) {
          add(record);
        }
      });
    });
    _.forEach(recorded || [], add);

    return needed;
  };

  // { blocked, warnings }. `blocked` stops the war being fought; `warnings` are
  // said out loud and nothing more. A map pack that has merely changed version
  // warns, because a point release must not lock a player out of their war.
  const evaluate = (needed, info) => {
    const blocked = [];
    const warnings = [];

    if (!needed || !needed.length) {
      return { blocked, warnings };
    }

    // GW Server Mods is what mounts every map pack. Without it none can be
    // had, whatever is installed, so that is one thing to say about the war
    // rather than the same sentence once per mod.
    if (info && info.gwsm === false) {
      blocked.push({ reason: "gwServerMods" });
      return { blocked, warnings };
    }

    // "Cannot tell" - Community Mods absent and nothing in the IndexedDB
    // fallback - is not "not installed". Nothing is decided while it holds.
    if (!info || !info.known) {
      return { blocked, warnings };
    }

    _.forEach(needed, (mod) => {
      const active = _.find(
        info.mods || [],
        (candidate) =>
          normalizeIdentifier(candidate.identifier) === mod.identifier,
      );

      if (!active) {
        blocked.push({
          reason: "serverMod",
          identifier: mod.identifier,
          name: mod.displayName,
        });
        return;
      }

      if (active.version === mod.version) {
        return;
      }

      warnings.push({
        reason: "version",
        identifier: mod.identifier,
        name: active.displayName || mod.displayName,
        from: mod.version,
        to: active.version,
      });
    });

    return { blocked, warnings };
  };

  return {
    warBiomeMods,
    evaluate,
  };
});
