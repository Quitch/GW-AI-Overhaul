// What a co-op AI player of a race, or of MLA with add-ons, fields, as the
// referee builds it: its held units through its race's cells, its mods landed
// on those units, which of them its commander reaches, and the units a card
// could still grant it. The scorer reads this view in place of the saved
// inventory's vanilla paths. Pure. See tech-cards.md, "A race's units".
define(function () {
  // Views kept for reuse: a hand's cards share the inventory before them.
  var MAX_CACHED = 16;

  // params: race, cells (shared/races.js cellsOf), races (shared/races.js),
  // lookup (shared/coop_ai_units.js fromSpecs).
  var view = function (params) {
    var race = params.race;
    var cells = params.cells;
    var races = params.races;
    var lookup = params.lookup;

    // As gw_play/referee_game_file_paths.js specPlan fields them.
    var fieldedUnits = function (paths) {
      return races.fieldedFor(
        race,
        races.ownedPaths(race, paths || [], cells),
        cells
      );
    };

    var fieldable = fieldedUnits(lookup.obtainable);
    var obtainable = _.filter(fieldable, function (unit) {
      var cell = lookup.classOf(unit);
      return !!cell && cell.cls !== "Commander";
    });

    var cache = [];

    // Of the saved inventory: units, mods and strippedUnits as fielded, every
    // other field as saved.
    var inventory = function (saved) {
      var hit = _.find(
        cache,
        // By instance, not by the deep equality the shorthand would use.
        // eslint-disable-next-line lodash/matches-prop-shorthand
        function (entry) {
          return entry.saved === saved;
        }
      );
      if (hit) {
        return hit.fielded;
      }

      var units = fieldedUnits(saved.units);
      var byUnit = {};
      _.forEach(units.concat(fieldable), function (unit) {
        byUnit[unit] = true;
      });
      // A vanilla file keeps its mod where a unit the army fields, or could
      // be granted, owns it: the referee's own test is the units fielded, but
      // that would move a held mod onto a unit as the card granting it is
      // scored, where the held-tech boost already counts it.
      var has = function (file) {
        return _.some(lookup.ownersOf(file), function (unit) {
          return byUnit[unit] === true;
        });
      };
      var fielded = _.assign({}, saved, {
        units: units,
        mods: races.modsFor(race, saved.mods || [], cells, has),
        strippedUnits: _.difference(
          races.cardUnitsFor(race, saved.strippedUnits || [], cells),
          units
        ),
      });

      cache.push({ saved: saved, fielded: fielded });
      if (cache.length > MAX_CACHED) {
        cache.shift();
      }
      return fielded;
    };

    // Which fielded units the commander reaches, by its own build list: a
    // commander of another race's is given this race's, as the referee
    // retags it.
    var reachable = function (units, commander, mods) {
      return lookup.reachable(
        units,
        commander,
        (mods || []).concat(races.commanderModsFor(race, commander)),
        true
      );
    };

    return {
      inventory: inventory,
      obtainable: obtainable,
      reachable: reachable,
    };
  };

  return {
    view: view,
  };
});
