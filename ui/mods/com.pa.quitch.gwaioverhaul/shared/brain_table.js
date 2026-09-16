// The per-race AI brain table: which brains a race may be given, what a row
// defaults to, and which brain an army of a race actually runs. Pure - it is
// handed the stored table and the war-wide strings (the MLA row) and answers;
// no engine globals, no model. See races.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], (
  races,
) => {
  const SIDES = ["enemy", "ally"];

  // Queller's build orders read TITANS units, so classic content cannot run
  // it whatever the race - the old war-wide picker disabled it the same way.
  const cellOptions = (raceId, hasTitansContent) => {
    let options = races.brainsFor([raceId]);

    if (hasTitansContent === false) {
      options = _.without(options, "Queller");
    }

    return options;
  };

  const pick = (value, options) =>
    _.includes(options, value) ? value : undefined;

  // A row a race starts with: the war-wide choice, coerced where the race
  // does not support it, so an existing user's brains carry over exactly.
  const seedRow = (raceId, ai, aiAlly) => ({
    enemy: races.brainFor(ai, raceId),
    ally: races.brainFor(aiAlly, raceId),
  });

  // The modal's rows, in the caller's race order: the stored cell where it is
  // still offerable, the seeded default otherwise. Stored races no longer in
  // the list follow as disabled rows, so a remembered choice stays visible.
  const rowsFor = (stored, raceIds, ai, aiAlly, hasTitansContent) => {
    const table = stored || {};
    const listed = _.map(raceIds || [], races.normalizeId);

    const rows = _.map(listed, (id) => {
      const options = cellOptions(id, hasTitansContent);
      const row = table[id];
      const seed = seedRow(id, ai, aiAlly);
      const cells = { id, stale: false, options };

      _.forEach(SIDES, (side) => {
        cells[side] =
          pick(row && row[side], options) ||
          pick(seed[side], options) ||
          races.TITANS;
      });

      return cells;
    });

    const stale = _.filter(
      _.keys(table).sort(),
      (id) => !_.includes(listed, races.normalizeId(id)),
    );

    return rows.concat(
      _.map(stale, (id) => {
        const row = table[id] || {};

        return {
          id: races.normalizeId(id),
          stale: true,
          // Just the stored value: the cell renders disabled, and offering
          // alternatives for a race that cannot be fielded reads as settable.
          options: [row.enemy || races.TITANS],
          enemy: row.enemy || races.TITANS,
          ally: row.ally || races.TITANS,
        };
      }),
    );
  };

  // The effective brain for one army: its race's row, else the war-wide
  // string for that side, coerced through brainFor either way. MLA has no
  // row - the strings ARE the MLA row.
  const resolve = (stored, ai, aiAlly, side, raceId) => {
    const id = races.normalizeId(raceId);
    const base = side === "ally" ? aiAlly || ai : ai;
    let value = base;

    if (!races.isMla(id)) {
      const row = stored && stored[id];
      value = (row && row[side]) || base;
    }

    return races.brainFor(value || races.TITANS, id);
  };

  // What the war records: one coerced row per fielded non-MLA race, so a
  // save never carries a brain the race cannot run and a co-op viewer reads
  // the same answers the host computed.
  const recordFor = (stored, raceIds, ai, aiAlly) => {
    const record = {};

    _.forEach(raceIds || [], (raceId) => {
      const id = races.normalizeId(raceId);

      if (races.isMla(id)) {
        return;
      }

      record[id] = {
        enemy: resolve(stored, ai, aiAlly, "enemy", id),
        ally: resolve(stored, ai, aiAlly, "ally", id),
      };
    });

    return record;
  };

  const api = {
    SIDES,
    cellOptions,
    seedRow,
    rowsFor,
    resolve,
    recordFor,
  };

  return api;
});
