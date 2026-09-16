// Glue: reads the merged unit list and every spec it reaches, and builds the
// capability-cell index for a race. The rules are in shared/unit_cells.js;
// only the fetching lives here. See races.md, "Capability cells".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
], (specCache, unitCells, gwoRaces, gameFilePaths) => {
  const deps = { fetch: gameFilePaths.specFetch };
  // Keyed by the unit list read: the list grows as race zips mount, so a read
  // from before a mount must not serve a later caller.
  const specsLoads = {};
  const indexes = {};

  const signatureOf = (units) => `${units.length}:${units.join("|").length}`;

  // coui:, not spec: - spec: pins the first read of a path for the process,
  // and the merged list is a memory file that changes as mods mount.
  const loadUnitList = () =>
    new Promise((resolve, reject) => {
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

  // Every listed unit and the closure of what it references, keyed by path.
  const loadSpecs = (units) => {
    const specs = {};
    const pending = {};

    const visit = (item) => {
      if (
        !_.isString(item) ||
        Object.prototype.hasOwnProperty.call(pending, item)
      ) {
        return Promise.resolve();
      }
      pending[item] = true;
      return specCache.fetchRaw(item, deps).then(
        (raw) => {
          specs[item] = raw;
          return Promise.all(_.map(specCache.references(raw), visit));
        },
        (error) => {
          console.log("error loading spec:", item, error);
        },
      );
    };

    return Promise.all(_.map(units, visit)).then(() => specs);
  };

  // `units` is optional: a caller that has already parsed the list hands it
  // over rather than reading it twice. Resolves to { units, specs }.
  const load = (units) => {
    const listLoad = units
      ? Promise.resolve(units)
      : loadUnitList().then((list) => list.units);

    return listLoad.then((list) => {
      const key = signatureOf(list);
      if (!specsLoads[key]) {
        specsLoads[key] = loadSpecs(list).then((specs) => ({
          units: list,
          specs,
        }));
        specsLoads[key].then(null, () => {
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
  //
  // The `vanilla` half is the base game's units alone: an add-on's
  // vanilla-typed units are kept out of it, or they would fill the cells its
  // gantries and towers sit in and no builder could ever reach those. For
  // MLA the `race` half is the add-on index: exactly those add-on units. No
  // add-on registered means no crawl, and a list with no add-on unit in it
  // (none mounted - the usual case) resolves undefined without a word. See
  // races.md, "Add-ons".
  const indexFor = (raceId, units) => {
    const race = gwoRaces.byId(raceId);
    const isMla = gwoRaces.isMla(raceId);
    const addonPaths = gwoRaces.addonUnitPaths();
    if (!race || (isMla && _.isEmpty(addonPaths))) {
      return Promise.resolve(undefined);
    }
    return load(units).then((loaded) => {
      const key = `${race.id}@${signatureOf(loaded.units)}`;
      if (!indexes[key]) {
        const isAddon = (path) => !!addonPaths[path];
        const member = isMla
          ? (types, path) => unitCells.vanillaMember(types) && isAddon(path)
          : unitCells.raceMember(race.unitTypeBit);
        const index = {
          vanilla: unitCells.buildIndex(
            loaded.units,
            loaded.specs,
            (types, path) => unitCells.vanillaMember(types) && !isAddon(path),
          ),
          race: unitCells.buildIndex(
            loaded.units,
            loaded.specs,
            member,
            unitCells.exclusiveMember(gwoRaces.knownBits()),
          ),
        };
        if (!index.race.units.length) {
          if (isMla) {
            return undefined;
          }
          console.warn(
            `gwoRaces: no ${race.id} unit in the unit list read (${loaded.units.length} units) - not mounted yet?`,
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
  // one; until it lands, races.cardUsable deals everything. `units` is passed
  // when several races are primed together, so they share one list read - see
  // gw_play/races.js.
  const prime = (raceId, units) =>
    indexFor(raceId, units).then(null, (error) => {
      console.error(`gwoRaces: cells not built for ${raceId}`, error);
    });

  return {
    load,
    indexFor,
    prime,
  };
});
