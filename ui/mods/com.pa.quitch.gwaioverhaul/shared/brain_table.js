// The per-race AI brain table: which brains a race may be given, what a row
// defaults to, and which brain an army of a race actually runs. Pure - it is
// handed the stored table and the war-wide strings (the MLA row) and answers;
// no engine globals, no model. See races.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], function (
  races
) {
  var SIDES = ["enemy", "ally", "coop"];

  var cellOptions = function (raceId) {
    return races.brainsFor([raceId]);
  };

  var pick = function (value, options) {
    return _.includes(options, value) ? value : undefined;
  };

  // A row a race starts with: the war-wide choice, coerced where the race
  // does not support it, so an existing user's brains carry over exactly. An
  // unset co-op brain follows the opponent's.
  var seedRow = function (raceId, ai, aiAlly, aiCoop) {
    return {
      enemy: races.brainFor(ai, raceId),
      ally: races.brainFor(aiAlly, raceId),
      coop: races.brainFor(aiCoop || ai, raceId),
    };
  };

  // The modal's rows, in the caller's race order: the stored cell where it is
  // still offerable, the seeded default otherwise. Stored races no longer in
  // the list follow as disabled rows, so a remembered choice stays visible.
  // coopFollows says the co-op cell has no brain of its own and follows the
  // row's opponent: MLA's with no aiCoop, a race's with no offerable coop.
  var rowsFor = function (stored, raceIds, ai, aiAlly, aiCoop) {
    var table = stored || {};
    var listed = _.map(raceIds || [], races.normalizeId);

    var rows = _.map(listed, function (id) {
      var options = cellOptions(id);
      var row = table[id];
      var seed = seedRow(id, ai, aiAlly, aiCoop);
      var cells = {
        id: id,
        stale: false,
        options: options,
        allyOptions: options,
        coopOptions: options,
        coopFollows: races.isMla(id)
          ? !aiCoop
          : !pick(row && row.coop, options),
      };

      _.forEach(SIDES, function (side) {
        cells[side] =
          pick(row && row[side], options) ||
          // A row stored before the co-op column follows its opponent, as
          // resolve does.
          (side === "coop" && pick(row && row.enemy, options)) ||
          pick(seed[side], options) ||
          races.TITANS;
      });

      return cells;
    });

    var stale = _.filter(_.keys(table).sort(), function (id) {
      return !_.includes(listed, races.normalizeId(id));
    });

    return rows.concat(
      _.map(stale, function (id) {
        var row = table[id] || {};

        var coop = row.coop || row.enemy || races.TITANS;

        return {
          id: races.normalizeId(id),
          stale: true,
          // Just the stored values: the cells render disabled, and offering
          // alternatives for a race that cannot be fielded reads as settable.
          // Each side lists its own, or a stale ally cell shows the enemy's.
          options: [row.enemy || races.TITANS],
          allyOptions: [row.ally || races.TITANS],
          coopOptions: [coop],
          enemy: row.enemy || races.TITANS,
          ally: row.ally || races.TITANS,
          coop: coop,
          coopFollows: !row.coop,
        };
      })
    );
  };

  // The war-wide string for a side, which is the MLA row. A war saved before
  // the co-op column has no aiCoop, and its co-op side is the opponent's.
  var baseFor = function (side, ai, aiAlly, aiCoop) {
    if (side === "ally") {
      return aiAlly || ai;
    }
    if (side === "coop") {
      return aiCoop || ai;
    }
    return ai;
  };

  // The effective brain for one army: its race's row, else the war-wide
  // string for that side, coerced through brainFor either way. MLA has no
  // row - the strings ARE the MLA row. A row without a co-op cell follows its
  // opponent.
  var resolve = function (stored, ai, aiAlly, side, raceId, aiCoop) {
    var id = races.normalizeId(raceId);
    var base = baseFor(side, ai, aiAlly, aiCoop);
    var value = base;

    if (!races.isMla(id)) {
      var row = stored && stored[id];
      var cell = row && row[side];
      if (side === "coop" && !cell) {
        cell = row && row.enemy;
      }
      value = cell || base;
    }

    return races.brainFor(value || races.TITANS, id);
  };

  // What the war records: one coerced row per fielded non-MLA race, so a
  // save never carries a brain the race cannot run and a co-op viewer reads
  // the same answers the host computed.
  var recordFor = function (stored, raceIds, ai, aiAlly, aiCoop) {
    var record = {};

    _.forEach(raceIds || [], function (raceId) {
      var id = races.normalizeId(raceId);

      if (races.isMla(id)) {
        return;
      }

      record[id] = {
        enemy: resolve(stored, ai, aiAlly, "enemy", id, aiCoop),
        ally: resolve(stored, ai, aiAlly, "ally", id, aiCoop),
        coop: resolve(stored, ai, aiAlly, "coop", id, aiCoop),
      };
    });

    return record;
  };

  var api = {
    SIDES: SIDES,
    cellOptions: cellOptions,
    seedRow: seedRow,
    rowsFor: rowsFor,
    resolve: resolve,
    recordFor: recordFor,
  };

  return api;
});
