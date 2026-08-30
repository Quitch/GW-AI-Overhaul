// Glue: reads the merged unit list and every spec it reaches, and builds the
// capability-cell index for a race. The rules are in shared/unit_cells.js;
// only the fetching lives here. See races.md, "Capability cells".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
], function (specCache, unitCells, gwoRaces, gameFilePaths) {
  var deps = { fetch: gameFilePaths.specFetch };
  // Keyed by the unit list read: the list grows as race zips mount, so a read
  // from before a mount must not serve a later caller.
  var specsLoads = {};
  var indexes = {};

  var signatureOf = function (units) {
    return units.length + ":" + units.join("|").length;
  };

  // coui:, not spec: - spec: pins the first read of a path for the process,
  // and the merged list is a memory file that changes as mods mount.
  var loadUnitList = function () {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: "coui://pa/units/unit_list.json",
        cache: false,
        success: function (data) {
          resolve(_.isString(data) ? JSON.parse(data) : data);
        },
        error: function (request, status, error) {
          reject(error);
        },
      });
    });
  };

  // Every listed unit and the closure of what it references, keyed by path.
  var loadSpecs = function (units) {
    var specs = {};
    var pending = {};

    var visit = function (item) {
      if (
        !_.isString(item) ||
        Object.prototype.hasOwnProperty.call(pending, item)
      ) {
        return Promise.resolve();
      }
      pending[item] = true;
      return specCache.fetchRaw(item, deps).then(
        function (raw) {
          specs[item] = raw;
          return Promise.all(_.map(specCache.references(raw), visit));
        },
        function (error) {
          console.log("error loading spec:", item, error);
        }
      );
    };

    return Promise.all(_.map(units, visit)).then(function () {
      return specs;
    });
  };

  // `units` is optional: a caller that has already parsed the list hands it
  // over rather than reading it twice. Resolves to { units, specs }.
  var load = function (units) {
    var listLoad = units
      ? Promise.resolve(units)
      : loadUnitList().then(function (list) {
          return list.units;
        });

    return listLoad.then(function (list) {
      var key = signatureOf(list);
      if (!specsLoads[key]) {
        specsLoads[key] = loadSpecs(list).then(function (specs) {
          return { units: list, specs: specs };
        });
        specsLoads[key].then(null, function () {
          delete specsLoads[key];
        });
      }
      return specsLoads[key];
    });
  };

  // Resolves to { vanilla, race } indexes, one per race per unit list. An
  // index with no race unit in it is a list read before the race's zip was
  // mounted: it is handed back but neither kept nor published, so the deal
  // gate keeps dealing and a later read tries again.
  var indexFor = function (raceId, units) {
    var race = gwoRaces.byId(raceId);
    if (!race || gwoRaces.isMla(raceId)) {
      return Promise.resolve(undefined);
    }
    return load(units).then(function (loaded) {
      var key = race.id + "@" + signatureOf(loaded.units);
      if (!indexes[key]) {
        var index = {
          vanilla: unitCells.buildIndex(
            loaded.units,
            loaded.specs,
            unitCells.vanillaMember
          ),
          race: unitCells.buildIndex(
            loaded.units,
            loaded.specs,
            unitCells.raceMember(race.unitTypeBit)
          ),
        };
        if (!index.race.units.length) {
          console.warn(
            "gwoRaces: no " +
              race.id +
              " unit in the unit list read (" +
              loaded.units.length +
              " units) - not mounted yet?"
          );
          return index;
        }
        indexes[key] = index;
        gwoRaces.setCells(race.id, index);
      }
      return indexes[key];
    });
  };

  // Deals are synchronous, so the player's index is built ahead of the first
  // one; until it lands, races.cardUsable deals everything.
  var prime = function (raceId) {
    return indexFor(raceId).then(null, function (error) {
      console.error("gwoRaces: cells not built for " + raceId, error);
    });
  };

  return {
    load: load,
    indexFor: indexFor,
    prime: prime,
  };
});
