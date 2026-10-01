// What a co-op AI player of a race, or of MLA with add-ons, fields, as the
// referee builds it: its held units through its race's cells, its mods landed
// on those units, the AI mods its race's tree takes, which of its units its
// commander reaches, and the units a card could still grant it. The scorer
// reads this view in place of the saved inventory's vanilla paths. Pure. See
// tech-cards.md, "A race's units".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_ai_mods.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
], function (raceAiMods, unitCells) {
  // Views kept for reuse: a hand's cards share the inventory before them.
  var MAX_CACHED = 16;

  // params: race, cells (shared/races.js cellsOf), races (shared/races.js),
  // lookup (shared/coop_ai_units.js fromSpecs), and for a race's view aim:
  // table (shared/race_ai_mods.js) and loads (the /pa/ai_tech/ files by
  // path). Without aim, the AI mods are counted as saved.
  var view = function (params) {
    var race = params.race;
    var cells = params.cells;
    var races = params.races;
    var lookup = params.lookup;
    var aim = params.aim;

    // The saved descriptors the race's tree takes: those the aim keeps, and
    // each load whose file keeps an item.
    var aimedAiMods = function (saved) {
      var aimer = raceAiMods.aim(
        aim.table,
        unitCells.remadeFiles(saved.mods || [])
      );
      return _.filter(saved.aiMods || [], function (mod) {
        if (!mod || mod.op !== "load") {
          return aimer.mods([mod]).length > 0;
        }
        var file = aim.loads[raceAiMods.loadPath(mod)];
        if (!file) {
          return false;
        }
        var aimed = aimer.loadFile(file, mod.type);
        return !_.isArray(aimed.build_list) || aimed.build_list.length > 0;
      });
    };

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
      if (aim) {
        fielded.aiMods = aimedAiMods(saved);
      }

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
