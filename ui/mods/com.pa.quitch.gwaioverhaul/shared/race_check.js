// Whether a saved war can still field the races it was built with, and which
// of its recorded races a client may still be offered. Pure: it is handed what
// the war recorded and what shared/race_mods.js found installed, and returns
// what to block on and what to merely mention. No engine globals, no model,
// no text - the caller localises. See races.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], (
  races,
) => {
  // The races a saved war actually fields: the player's, one per faction,
  // whatever every star's AI carries and, under Separate races, the race each
  // co-op record's inventory was stamped with, which lives nowhere else.
  // `races.raceOf` is deliberately not used - it answers MLA for a race it
  // cannot resolve, which is the very case this module exists to catch.
  const warRaces = (recorded, ais, records) => {
    const ids = [recorded && recorded.player]
      .concat(_.values((recorded && recorded.byFaction) || {}))
      .concat(_.map(ais || [], (ai) => ai && ai.race))
      .concat(
        _.map(records || [], (record) => {
          const tags = record && record.inventory && record.inventory.tags;
          return tags && tags.global && tags.global.playerRace;
        }),
      );

    return _.uniq(
      _.filter(
        _.map(ids, races.normalizeId),
        (id) => id.length && id !== races.MLA_ID,
      ),
    );
  };

  // { blocked, warnings }. `blocked` stops the war being fought; `warnings` are
  // said out loud and nothing more. A race mod that has merely changed version
  // warns, because a point release must not lock a player out of their war.
  const evaluate = (recorded, warRaceIds, info) => {
    const blocked = [];
    const warnings = [];
    const ids = _.uniq(
      _.filter(
        _.map(warRaceIds || [], races.normalizeId),
        (id) => id.length && id !== races.MLA_ID,
      ),
    );
    // "Cannot tell" - Community Mods absent and nothing in the IndexedDB
    // fallback - is not "not installed". Nothing that depends on the installed
    // list is decided while it is false. See races.md.
    const known = !!(info && info.known);
    // GW Server Mods is what mounts every race's files. Without it no race can
    // be had, whatever is installed, so that is one thing to say about the war
    // rather than the same sentence once per race - and naming a race mod
    // would send the player to look at a mod that is already on.
    const gwsm = !info || info.gwsm !== false;
    const installed = _.map((info && info.races) || [], "id");
    let wanted = [];
    const absent = [];

    _.forEach(ids, (id) => {
      const race = races.byId(id);

      // No descriptor at all: the race's client mod is gone, or the mod that
      // registered it no longer does. A registry fact, so it holds whether or
      // not the installed server mods could be listed.
      if (!race || race.id === races.MLA_ID) {
        blocked.push({ reason: "descriptor", race: id, name: id });
        return;
      }

      wanted = wanted.concat(race.serverMods);

      if (known && !installed.includes(race.id)) {
        absent.push(race);
      }
    });

    if (absent.length && !gwsm) {
      blocked.push({ reason: "gwServerMods" });
    } else {
      _.forEach(absent, (race) => {
        blocked.push({
          reason: "serverMod",
          race: race.id,
          name: race.name,
          mods: race.serverMods,
        });
      });
    }

    if (!known) {
      return { blocked, warnings };
    }

    // An add-on the war began with that is off now: its units simply stop
    // arriving, since every inventory holds vanilla paths, so this is said
    // and never blocked. A war saved before add-ons recorded none. The name
    // is the descriptor's (localised) when one still claims the identifier,
    // else what the war recorded.
    _.forEach((recorded && recorded.addons) || [], (mod) => {
      const identifier = races.normalizeId(mod && mod.identifier);
      const active = _.some(
        info.addonMods || [],
        (candidate) => races.normalizeId(candidate.identifier) === identifier,
      );
      const addon = _.find(races.addons(), (candidate) =>
        _.includes(candidate.serverMods, identifier),
      );

      if (identifier && !active) {
        warnings.push({
          reason: "addon",
          identifier,
          name: (addon && addon.name) || mod.displayName || identifier,
        });
      }
    });

    _.forEach((recorded && recorded.mods) || [], (mod) => {
      const identifier = races.normalizeId(mod && mod.identifier);

      // Recorded mods cover every race installed when the war was made, not
      // the ones it fields. Disabling a race this war never used is not news.
      if (!wanted.includes(identifier)) {
        return;
      }

      const active = _.find(
        info.mods,
        (candidate) => races.normalizeId(candidate.identifier) === identifier,
      );

      // Absent is already blocked above: a race lists one identifier, and it
      // is matched exactly.
      if (!active || active.version === mod.version) {
        return;
      }

      warnings.push({
        reason: "version",
        identifier,
        name: active.displayName || mod.displayName || identifier,
        from: mod.version,
        to: active.version,
      });
    });

    return { blocked, warnings };
  };

  // Which of the recorded races a client may still be offered: MLA always,
  // and any race whose server mod race_mods.js found active. `known` false
  // removes nothing - "cannot tell" is not "not installed". The viewer's
  // picker and the host's cell priming both route through here, so the two
  // sides cannot disagree. See races.md.
  const activeRaces = (detected, info) => {
    if (!info || !info.known) {
      return detected || [];
    }

    const active = _.map(info.races || [], "id");

    return _.filter(
      detected || [],
      (race) => race.id === races.MLA_ID || active.includes(race.id),
    );
  };

  return {
    warRaces,
    evaluate,
    activeRaces,
  };
});
