// Glue. The testable half is gw_play/referee_game_file_paths.js - see testing.md.
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/ai_tech.js",
], function (
  GW,
  gwoAI,
  gwoSpecs,
  refereeCoop,
  gwoSpecCache,
  gameFilePaths,
  gwoRaces,
  gwoRaceCells,
  unitCells,
  gwoTech
) {
  var getAIUnitMapPath = gameFilePaths.getAIUnitMapPath;
  var getAIUnitMapDestinationPath = gameFilePaths.getAIUnitMapDestinationPath;
  var mergeUnitMaps = gameFilePaths.mergeUnitMaps;
  var resolveAiUnitMapPaths = gameFilePaths.resolveAiUnitMapPaths;
  var buildPlayerFiles = gameFilePaths.buildPlayerFiles;
  var specFetch = gameFilePaths.specFetch;
  // Drop-in for GW.specs.genUnitSpecs, fetching each spec file at most once.
  var genUnitSpecs = function (units, tag) {
    return gwoSpecCache.genUnitSpecs(units, tag, { fetch: specFetch });
  };

  var guardianMods = function (game, hostMods) {
    // Without per-player tech every viewer draws from the host's inventory.
    if (!game.perPlayerTechCards()) {
      return hostMods;
    }

    var mods = hostMods;
    _.forEach(
      refereeCoop.getConnectedViewerInventories(game),
      function (viewer) {
        mods = mods.concat(viewer.inventory.mods);
      }
    );

    return mods;
  };

  var buildAiFactionFiles = function (params) {
    var currentCount = params.currentCount;
    var ai = params.ai;
    var aiTag = params.aiTag;
    var aiUnitMap = params.aiUnitMap;
    var aiX1UnitMap = params.aiX1UnitMap;
    var aiSpecs = params.aiSpecs;
    var aiUnitMapDestinationPath = params.aiUnitMapDestinationPath;
    var aiUnitMapTitansDestinationPath = params.aiUnitMapTitansDestinationPath;
    var clusterUnitMapPath = params.clusterUnitMapPath;
    var clusterUnitMapTitansPath = params.clusterUnitMapTitansPath;
    var titans = params.titans;
    var game = params.game;
    var inventory = params.inventory;
    var aiFactionDeferred = params.aiFactionDeferred;

    var race = params.race;
    var cells = params.cells;
    var commanders = params.commanders || [];

    var enemyAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, aiTag[currentCount]);
    var enemyX1AIUnitMap = GW.specs.genAIUnitMap(
      aiX1UnitMap,
      aiTag[currentCount]
    );

    return genUnitSpecs(aiSpecs, aiTag[currentCount]).then(
      function (aiSpecFiles) {
        var resolvedPaths = resolveAiUnitMapPaths(
          ai,
          currentCount,
          {
            unitMapPath: aiUnitMapDestinationPath,
            unitMapTitansPath: aiUnitMapTitansDestinationPath,
          },
          {
            unitMapPath: clusterUnitMapPath,
            unitMapTitansPath: clusterUnitMapTitansPath,
          },
          gwoAI.isCluster
        );
        var unitMapPath = resolvedPaths.unitMapPath;
        var unitMapTitansPath = resolvedPaths.unitMapTitansPath;

        var enemyAIUnitMapFile = unitMapPath + aiTag[currentCount];
        var enemyAIUnitMapPair = {};
        enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
        var enemyX1AIUnitMapFile = unitMapTitansPath + aiTag[currentCount];
        var enemyX1AIUnitMapPair = {};
        enemyX1AIUnitMapPair[enemyX1AIUnitMapFile] = enemyX1AIUnitMap;
        var aiFilesClassic = _.assign(enemyAIUnitMapPair, aiSpecFiles);
        var aiFilesX1 = titans
          ? _.assign(enemyX1AIUnitMapPair, aiSpecFiles)
          : {};
        var aiFiles = _.assign({}, aiFilesClassic, aiFilesX1);

        var aiInventory = gameFilePaths.armyInventory(
          currentCount === 0 ? ai : ai.foes[currentCount - 1],
          gwoTech.loadoutFor,
          gwoAI.factionIndex,
          gwoAI.isCluster
        );
        var guardians = ai.mirrorMode;
        if (guardians) {
          aiInventory = aiInventory.concat(
            guardianMods(game, inventory.mods())
          );
        }
        // The AI's tech names vanilla files; a race army's land on the race
        // files of the same cell too. Its spec set holds every listed unit,
        // so the originals stay as well. See races.md.
        if (cells) {
          aiInventory = unitCells.expandMods(
            aiInventory,
            cells.vanilla,
            cells.race,
            function (file) {
              return Object.prototype.hasOwnProperty.call(
                aiSpecFiles,
                file + aiTag[currentCount]
              );
            }
          );
        }
        _.forEach(commanders, function (commander) {
          aiInventory = aiInventory.concat(
            gwoRaces.commanderModsFor(race, commander)
          );
        });
        if (aiInventory.length) {
          gwoSpecs.mod(aiFiles, aiInventory, aiTag[currentCount]);
        }
        aiFactionDeferred.resolve(aiFiles);
      }
    );
  };

  // Files not assigned by default that we wish to mod - global for modder
  // compatibility, New-GW-Cards pushes here - see tech-cards.md
  model.gwoSpecs = _.isArray(model.gwoSpecs) ? model.gwoSpecs : [];
  model.gwoSpecs = model.gwoSpecs.concat(gwoSpecs.additionalSpecs);

  return function () {
    var self = this;

    // The previous battle's cooked specs are still mounted; read as the base,
    // they would be modded a second time.
    var done = $.Deferred();
    // A throw inside a deferred callback is a hang, not a rejection (see
    // constraints.md), so every path below that can fail rejects here instead.
    var fail = function (error) {
      done.reject(error);
    };

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      try {
        self.stage("!LOC:Processing tech cards");
        var titans = api.content.usingTitans();

        var game = self.game();
        var ai = gwoAI.currentStarAi(game);
        var aiTag = gwoAI.aiTags(ai);
        var aiFactionCount = aiTag.length;
        var aiFactions = _.map(aiTag, function () {
          return $.Deferred();
        });

        var playerFileGen = $.Deferred();
        var filesToProcess = [playerFileGen];

        var inventory = game.inventory();
        var playerRace = gwoRaces.raceOf(inventory);
        var enemyAI = gwoAI.aiInUse("enemy");
        var aiUnitMapSourcePath = getAIUnitMapPath(false, enemyAI);
        var aiUnitMapTitansSourcePath = getAIUnitMapPath(true, enemyAI);

        // Each map file once per launch, through spec:// like the unit list.
        var mapCache = {};
        var loadMap = function (path) {
          if (!mapCache[path]) {
            mapCache[path] = $.get("spec:/" + path).then(function (data) {
              return parse(data);
            });
          }
          return mapCache[path];
        };

        // A race army reads the brain that carries its race (or Titans) from
        // that brain's own map with the race's maps laid over it, at the race's
        // tree; a vanilla spec_id the race maps left falls back to a race unit
        // of its cell. Guardians mirror the player, race included. See races.md.
        var armyOf = function (n) {
          return n === 0 ? ai : ai.foes[n - 1];
        };
        var raceOfArmy = function (n) {
          return ai.mirrorMode ? playerRace : gwoRaces.raceOf(armyOf(n));
        };
        var armyMaps = function (type, race, cells) {
          var brain = gwoAI.aiInUse(type, race);
          var source = gwoAI.getAIPathSource(type, race);
          var raceMaps = gwoRaces.unitMapsFor(race, brain, source);
          var loads = [
            loadMap(getAIUnitMapPath(false, brain)),
            titans ? loadMap(getAIUnitMapPath(true, brain)) : null,
          ].concat(_.map(raceMaps, loadMap));
          var merge = function (base, extra) {
            var merged = mergeUnitMaps(base, extra);
            return cells
              ? unitCells.unitMapFallback(
                  merged,
                  extra,
                  cells.vanilla,
                  cells.race
                )
              : merged;
          };

          return $.when.apply($, loads).then(function () {
            var maps = _.toArray(arguments);
            var extra = maps.slice(2);
            return {
              classic: merge(maps[0], extra),
              x1: titans ? merge(maps[1], extra) : {},
            };
          });
        };

        var unitsLoad = $.get("spec://pa/units/unit_list.json");
        var aiMapLoad = loadMap(aiUnitMapSourcePath);
        var aiX1MapLoad = titans ? loadMap(aiUnitMapTitansSourcePath) : {};
        // Native from here on: a jQuery callback that throws hangs the launch,
        // a native one rejects, and every chain below ends in fail. A jQuery
        // promise adopted by a native one hands over its first argument only,
        // so the three loads are gathered into one first.
        var loads = $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
          function (unitsGet, aiUnitMap, aiX1UnitMap) {
            return [unitsGet, aiUnitMap, aiX1UnitMap];
          }
        );
        Promise.resolve(loads)
          .then(function (loaded) {
            var units = parse(loaded[0][0]).units;
            var aiUnitMap = loaded[1];
            var aiX1UnitMap = loaded[2];
            var clusterUnitMapPath =
              "/pa/ai_cluster/unit_maps/ai_unit_map.json";
            var clusterUnitMapTitansPath =
              "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
            // Identical for every faction - build it once rather than per iteration.
            var aiSpecs = units.concat(model.gwoSpecs);
            // A race's capability cells, from the same specs genUnitSpecs will
            // fetch.
            var cellsFor = function (race) {
              return gwoRaces.isMla(race)
                ? Promise.resolve(undefined)
                : gwoRaceCells.indexFor(race, units);
            };
            _.times(aiFactionCount, function (n) {
              var army = armyOf(n);
              var race = raceOfArmy(n);
              var destination = gwoAI.getAIPathDestination("enemy", {
                race: race,
              });

              cellsFor(race)
                .then(function (cells) {
                  var maps = gwoRaces.isMla(race)
                    ? { classic: aiUnitMap, x1: aiX1UnitMap }
                    : armyMaps("enemy", race, cells);

                  return Promise.resolve(maps).then(function (unitMaps) {
                    return buildAiFactionFiles({
                      currentCount: n,
                      ai: ai,
                      aiTag: aiTag,
                      race: race,
                      cells: cells,
                      commanders: [army.commander].concat(
                        n === 0 ? _.pluck(ai.minions || [], "commander") : []
                      ),
                      aiUnitMap: unitMaps.classic,
                      aiX1UnitMap: unitMaps.x1,
                      aiSpecs: aiSpecs,
                      aiUnitMapDestinationPath: getAIUnitMapDestinationPath(
                        false,
                        destination
                      ),
                      aiUnitMapTitansDestinationPath:
                        getAIUnitMapDestinationPath(true, destination),
                      clusterUnitMapPath: clusterUnitMapPath,
                      clusterUnitMapTitansPath: clusterUnitMapTitansPath,
                      titans: titans,
                      game: game,
                      inventory: inventory,
                      aiFactionDeferred: aiFactions[n],
                    });
                  });
                })
                .then(null, fail);
            });

            var playerTag = ".player";
            var additionalPlayerSpecs = _.isUndefined(ai.ally)
              ? model.gwoSpecs
              : model.gwoSpecs.concat(ai.ally.commander);
            var held = inventory.units().concat(additionalPlayerSpecs);
            var playerCommanders = [inventory.getTag("global", "commander")]
              .concat(_.pluck(inventory.minions(), "commander"))
              .concat(_.isUndefined(ai.ally) ? [] : [ai.ally.commander]);

            cellsFor(playerRace)
              .then(function (cells) {
                // A race player fields the race's units of the cells the
                // vanilla ones held occupy; a kept vanilla unit (the Colonel)
                // is retagged so the race can build it. See races.md.
                var playerSpecs = cells
                  ? unitCells.raceUnitsFor(held, cells.vanilla, cells.race)
                  : held;
                var keptVanilla = cells
                  ? _.difference(
                      unitCells.heldCommanderUnits(held, cells.vanilla),
                      playerCommanders
                    )
                  : [];
                var playerExtraMods = _.flatten(
                  _.map(playerCommanders, function (commander) {
                    return gwoRaces.commanderModsFor(playerRace, commander);
                  }).concat(
                    _.map(keptVanilla, function (unit) {
                      return gwoRaces.unitRetagMods(playerRace, unit);
                    })
                  )
                );
                // MLA keeps the enemy brain's map for the player, as it always has.
                var playerMaps = gwoRaces.isMla(playerRace)
                  ? { classic: aiUnitMap, x1: aiX1UnitMap }
                  : armyMaps("subcommander", playerRace, cells);

                return Promise.resolve(playerMaps).then(function (unitMaps) {
                  return genUnitSpecs(playerSpecs, playerTag).then(
                    function (playerSpecFiles) {
                      var has = function (file) {
                        return Object.prototype.hasOwnProperty.call(
                          playerSpecFiles,
                          file + playerTag
                        );
                      };
                      var playerMods = cells
                        ? unitCells.expandMods(
                            inventory.mods(),
                            cells.vanilla,
                            cells.race,
                            has
                          )
                        : inventory.mods();
                      playerFileGen.resolve(
                        buildPlayerFiles(
                          {
                            playerAIUnitMap: GW.specs.genAIUnitMap(
                              unitMaps.classic,
                              playerTag
                            ),
                            playerX1AIUnitMap: titans
                              ? GW.specs.genAIUnitMap(unitMaps.x1, playerTag)
                              : {},
                            playerSpecFiles: playerSpecFiles,
                            inventory: inventory,
                            titans: titans,
                            race: playerRace,
                            mods: playerMods,
                            extraMods: playerExtraMods,
                          },
                          gwoAI,
                          gwoSpecs
                        )
                      );
                    }
                  );
                });
              })
              .then(null, fail);
          })
          .then(null, fail);

        _.times(aiFactionCount, function (n) {
          filesToProcess.push(aiFactions[n]);
        });

        $.when.apply($, filesToProcess).then(function () {
          self.files(_.assign.apply(_, arguments));
          done.resolve();
        }, fail);
      } catch (error) {
        fail(error);
      }
    });
    return done.promise();
  };
});
