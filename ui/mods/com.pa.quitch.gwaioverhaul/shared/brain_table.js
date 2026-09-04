// The per-race AI brain table: which brains a race may be given, what a row
// defaults to, and which brain an army of a race actually runs. Pure - it is
// handed the stored table and the war-wide strings (the MLA row) and answers;
// no engine globals, no model. See races.md.
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js"], function (
  races
) {
  var SIDES = ["enemy", "ally"];

  // Queller's build orders read TITANS units, so classic content cannot run
  // it whatever the race - the old war-wide picker disabled it the same way.
  var cellOptions = function (raceId, hasTitansContent) {
    var options = races.brainsFor([raceId]);

    if (hasTitansContent === false) {
      options = _.without(options, "Queller");
    }

    return options;
  };

  var pick = function (value, options) {
    return _.contains(options, value) ? value : undefined;
  };

  // A row a race starts with: the war-wide choice, coerced where the race
  // does not support it, so an existing user's brains carry over exactly.
  var seedRow = function (raceId, ai, aiAlly) {
    return {
      enemy: races.brainFor(ai, raceId),
      ally: races.brainFor(aiAlly, raceId),
    };
  };

  // The modal's rows, in the caller's race order: the stored cell where it is
  // still offerable, the seeded default otherwise. Stored races no longer in
  // the list follow as disabled rows, so a remembered choice stays visible.
  var rowsFor = function (stored, raceIds, ai, aiAlly, hasTitansContent) {
    var table = stored || {};
    var listed = _.map(raceIds || [], races.normalizeId);

    var rows = _.map(listed, function (id) {
      var options = cellOptions(id, hasTitansContent);
      var row = table[id];
      var seed = seedRow(id, ai, aiAlly);
      var cells = { id: id, stale: false, options: options };

      _.forEach(SIDES, function (side) {
        cells[side] =
          pick(row && row[side], options) ||
          pick(seed[side], options) ||
          races.TITANS;
      });

      return cells;
    });

    var stale = _.filter(_.keys(table).sort(), function (id) {
      return !_.contains(listed, races.normalizeId(id));
    });

    return rows.concat(
      _.map(stale, function (id) {
        var row = table[id] || {};

        return {
          id: races.normalizeId(id),
          stale: true,
          // Just the stored value: the cell renders disabled, and offering
          // alternatives for a race that cannot be fielded reads as settable.
          options: [row.enemy || races.TITANS],
          enemy: row.enemy || races.TITANS,
          ally: row.ally || races.TITANS,
        };
      })
    );
  };

  // The effective brain for one army: its race's row, else the war-wide
  // string for that side, coerced through brainFor either way. MLA has no
  // row - the strings ARE the MLA row.
  var resolve = function (stored, ai, aiAlly, side, raceId) {
    var id = races.normalizeId(raceId);
    var base = side === "ally" ? aiAlly || ai : ai;
    var value = base;

    if (!races.isMla(id)) {
      var row = stored && stored[id];
      value = (row && row[side]) || base;
    }

    return races.brainFor(value || races.TITANS, id);
  };

  // What the war records: one coerced row per fielded non-MLA race, so a
  // save never carries a brain the race cannot run and a co-op viewer reads
  // the same answers the host computed.
  var recordFor = function (stored, raceIds, ai, aiAlly) {
    var record = {};

    _.forEach(raceIds || [], function (raceId) {
      var id = races.normalizeId(raceId);

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
