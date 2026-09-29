// Glue. The testable half is gw_play/referee_game_file_paths.js - see testing.md.
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/race_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/ai_tech.js",
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
  var resolveAiUnitMapPaths = gameFilePaths.resolveAiUnitMapPaths;
  var buildPlayerFiles = gameFilePaths.buildPlayerFiles;
  var specFetch = gameFilePaths.specFetch;
  var loadMap = gameFilePaths.loadMap;
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
      refereeCoop
        .getConnectedViewerInventories(game)
        .concat(refereeCoop.getCoopAiInventories(game)),
      function (player) {
        mods = mods.concat(player.inventory.mods || []);
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
        var aiFilesX1 = _.assign(enemyX1AIUnitMapPair, aiSpecFiles);
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
        // files they stand for too, and an MLA army's on the add-on files.
        // Its spec set holds every listed unit, so the originals stay as
        // well. A mod on a race file the specs lack is dropped. See races.md.
        aiInventory = gwoRaces.modsFor(
          race,
          aiInventory,
          cells,
          function (file) {
            return Object.prototype.hasOwnProperty.call(
              aiSpecFiles,
              file + aiTag[currentCount]
            );
          }
        );
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

  var PLAYER_TAG = ".player";
  var CLUSTER_UNIT_MAP = "/pa/ai_cluster/unit_maps/ai_unit_map.json";
  var CLUSTER_UNIT_MAP_X1 = "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";

  // The helpers below build each army's files from `battle`: what the hire
  // read before the unit list and the maps loaded, and what it made of them.

  // Whether `specFiles` holds `file` on `tag`.
  var hasTaggedSpec = function (specFiles, tag, file) {
    return Object.prototype.hasOwnProperty.call(specFiles, file + tag);
  };

  var mapPair = function (maps) {
    return { classic: maps[0], x1: maps[1] };
  };

  // An MLA army reads its brain's own maps, as its tree lists them.
  var mlaMaps = function (brain) {
    return Promise.all([
      loadMap(getAIUnitMapPath(false, brain)),
      loadMap(getAIUnitMapPath(true, brain)),
    ]).then(mapPair);
  };

  // One enemy army's files: its race's cells and maps, then its specs.
  var enemyArmyFiles = function (battle, n) {
    var ai = battle.ai;
    var army = battle.armyOf(n);
    var race = battle.raceOfArmy(n);
    var destination = gwoAI.getAIPathDestination("enemy", {
      race: race,
    });

    return battle.cellsFor(race).then(function (cells) {
      var maps = gwoRaces.isMla(race)
        ? { classic: battle.aiUnitMap, x1: battle.aiX1UnitMap }
        : battle.armyMaps("enemy", race, cells);

      return Promise.resolve(maps).then(function (unitMaps) {
        return buildAiFactionFiles({
          currentCount: n,
          ai: ai,
          aiTag: battle.aiTag,
          race: race,
          cells: cells,
          commanders: [army.commander].concat(
            n === 0 ? _.pluck(ai.minions || [], "commander") : []
          ),
          aiUnitMap: unitMaps.classic,
          aiX1UnitMap: unitMaps.x1,
          aiSpecs: battle.aiSpecs,
          aiUnitMapDestinationPath: getAIUnitMapDestinationPath(
            false,
            destination
          ),
          aiUnitMapTitansDestinationPath: getAIUnitMapDestinationPath(
            true,
            destination
          ),
          clusterUnitMapPath: CLUSTER_UNIT_MAP,
          clusterUnitMapTitansPath: CLUSTER_UNIT_MAP_X1,
          game: battle.game,
          inventory: battle.inventory,
          aiFactionDeferred: battle.aiFactions[n],
        });
      });
    });
  };

  // Each co-op AI reads its own brain's maps: MLA's as its tree lists them, a
  // race's merged as the player's are.
  var coopAiMaps = function (battle, coopAi) {
    if (gwoRaces.isMla(coopAi.race)) {
      return mlaMaps(coopAi.brain);
    }
    return battle
      .cellsFor(coopAi.race)
      .then(_.partial(battle.armyMaps, "coop", coopAi.race));
  };

  // The maps of `coopAi`, one of `coopAis`, from `maps` in the same order.
  var mapsOfCoopAi = function (coopAis, maps, coopAi) {
    return maps[_.indexOf(coopAis, coopAi)];
  };

  // A per-player AI's own specs and its Sub Commanders' maps, which read the
  // ally brain as the host's do.
  var ownAiFiles = function (battle, coopAi, index) {
    var saved = coopAi.inventory;
    var race = coopAi.race;
    var isMla = gwoRaces.isMla(race);
    var commanders = [
      _.get(saved, "tags.global.commander") || coopAi.commander,
    ].concat(_.pluck(saved.minions || [], "commander"));

    return battle.cellsFor(race).then(function (cells) {
      var plan = gameFilePaths.specPlan({
        units: saved.units || [],
        extra: model.gwoSpecs,
        cells: cells,
        race: race,
        isMla: isMla,
        commanders: commanders,
        unitCells: unitCells,
        gwoRaces: gwoRaces,
      });
      var maps = isMla
        ? mlaMaps(gwoAI.aiInUse("subcommander", race))
        : battle.armyMaps("subcommander", race, cells);

      return Promise.resolve(maps).then(function (unitMaps) {
        return genUnitSpecs(plan.specs, coopAi.tag).then(function (specFiles) {
          battle.ownFileGens[index].resolve(
            gameFilePaths.buildCoopAiFiles({
              tag: coopAi.tag,
              specFiles: specFiles,
              subcommanderPath: gwoAI.getSubcommanderPathForViewer(
                saved,
                coopAi.tag,
                race
              ),
              maps: unitMaps,
              genAIUnitMap: GW.specs.genAIUnitMap,
              mods: gwoRaces.modsFor(
                race,
                saved.mods || [],
                cells,
                _.partial(hasTaggedSpec, specFiles, coopAi.tag)
              ),
              extraMods: plan.retagMods,
              gwoSpecs: gwoSpecs,
            })
          );
        });
      });
    });
  };

  // The host's specs, which the star's ally and a shared-tech co-op AI field.
  var playerFiles = function (battle) {
    var playerRace = battle.playerRace;
    var inventory = battle.inventory;

    return battle.cellsFor(playerRace).then(function (cells) {
      var plan = gameFilePaths.specPlan({
        units: inventory.units(),
        extra: battle.additionalPlayerSpecs,
        cells: cells,
        race: playerRace,
        isMla: gwoRaces.isMla(playerRace),
        commanders: battle.playerCommanders,
        unitCells: unitCells,
        gwoRaces: gwoRaces,
      });
      var playerSpecs = plan.specs;
      var playerExtraMods = plan.retagMods;
      var playerMaps = gwoRaces.isMla(playerRace)
        ? mlaMaps(gwoAI.aiInUse("subcommander", playerRace))
        : battle.armyMaps("subcommander", playerRace, cells);

      return Promise.resolve(playerMaps).then(function (unitMaps) {
        return genUnitSpecs(playerSpecs, PLAYER_TAG).then(
          function (playerSpecFiles) {
            var playerMods = gwoRaces.modsFor(
              playerRace,
              inventory.mods(),
              cells,
              _.partial(hasTaggedSpec, playerSpecFiles, PLAYER_TAG)
            );
            battle.playerFileGen.resolve(
              buildPlayerFiles(
                {
                  playerAIUnitMap: GW.specs.genAIUnitMap(
                    unitMaps.classic,
                    PLAYER_TAG
                  ),
                  playerX1AIUnitMap: GW.specs.genAIUnitMap(
                    unitMaps.x1,
                    PLAYER_TAG
                  ),
                  playerSpecFiles: playerSpecFiles,
                  inventory: inventory,
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
    });
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
        var game = self.game();
        var ai = gwoAI.currentStarAi(game);
        var aiTag = gwoAI.aiTags(ai);
        var aiFactionCount = aiTag.length;
        var aiFactions = _.map(aiTag, function () {
          return $.Deferred();
        });

        var playerFileGen = $.Deferred();
        var coopAiFileGen = $.Deferred();
        var filesToProcess = [playerFileGen, coopAiFileGen];
        var coopAis = self.coopAis || [];
        // Under per-player tech each co-op AI player fields its own units on
        // its own tag, as a viewer does. See coop.md, "AI players' tech".
        var ownFileAis = _.filter(coopAis, "perPlayer");
        var ownFileGens = _.map(ownFileAis, function () {
          return $.Deferred();
        });
        filesToProcess = filesToProcess.concat(ownFileGens);

        var inventory = game.inventory();
        var playerRace = gwoRaces.raceOf(inventory);
        var enemyAI = gwoAI.aiInUse("enemy");
        var aiUnitMapSourcePath = getAIUnitMapPath(false, enemyAI);
        var aiUnitMapTitansSourcePath = getAIUnitMapPath(true, enemyAI);

        // A race army reads the brain that carries its race (or Titans) from
        // that brain's own map with the race's maps laid over it, at the race's
        // tree, translated to the race's units (gameFilePaths.raceUnitMap).
        // Guardians mirror the player, race included. See races.md.
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
            loadMap(getAIUnitMapPath(true, brain)),
          ].concat(_.map(raceMaps, loadMap));
          var merge = function (base, extra) {
            return gameFilePaths.raceUnitMap({
              base: base,
              raceMaps: extra,
              cells: cells,
              race: race,
              unitCells: unitCells,
              gwoRaces: gwoRaces,
            });
          };

          return $.when.apply($, loads).then(function () {
            var maps = _.toArray(arguments);
            var extra = maps.slice(2);
            return {
              classic: merge(maps[0], extra),
              x1: merge(maps[1], extra),
            };
          });
        };

        var unitsLoad = $.get("spec://pa/units/unit_list.json");
        var aiMapLoad = loadMap(aiUnitMapSourcePath);
        var aiX1MapLoad = loadMap(aiUnitMapTitansSourcePath);
        // Native from here on: a jQuery callback that throws hangs the launch,
        // a native one rejects, and every chain below ends in fail. A jQuery
        // promise adopted by a native one hands over its first argument only,
        // so the three loads are gathered into one first.
        var loads = $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
          function (unitsGet, aiUnitMap, aiX1UnitMap) {
            return [unitsGet, aiUnitMap, aiX1UnitMap];
          }
        );
        var buildArmyFiles = function (loaded) {
          var units = parse(loaded[0][0]).units;
          // Under shared tech a co-op AI fields the host's units, its
          // commander among them, as the star's ally does.
          var coopAiCommanders = _.pluck(
            _.filter(coopAis, { tag: PLAYER_TAG }),
            "commander"
          );
          var battle = {
            game: game,
            inventory: inventory,
            ai: ai,
            aiTag: aiTag,
            aiFactions: aiFactions,
            playerRace: playerRace,
            playerFileGen: playerFileGen,
            ownFileGens: ownFileGens,
            armyOf: armyOf,
            raceOfArmy: raceOfArmy,
            armyMaps: armyMaps,
            aiUnitMap: loaded[1],
            aiX1UnitMap: loaded[2],
            // Identical for every faction - build it once rather than per
            // iteration.
            aiSpecs: units.concat(model.gwoSpecs),
            // A race's capability cells, from the same specs genUnitSpecs
            // will fetch. MLA's are its add-on cells, and undefined while
            // no add-on is mounted. See races.md, "Add-ons".
            cellsFor: function (race) {
              return gwoRaceCells.indexFor(race, units);
            },
            additionalPlayerSpecs: (_.isUndefined(ai.ally)
              ? model.gwoSpecs
              : model.gwoSpecs.concat(ai.ally.commander)
            ).concat(coopAiCommanders),
            playerCommanders: [inventory.getTag("global", "commander")]
              .concat(_.pluck(inventory.minions(), "commander"))
              .concat(_.isUndefined(ai.ally) ? [] : [ai.ally.commander])
              .concat(coopAiCommanders),
          };

          _.times(aiFactionCount, function (n) {
            enemyArmyFiles(battle, n).then(null, fail);
          });

          Promise.all(_.map(coopAis, _.partial(coopAiMaps, battle)))
            .then(function (maps) {
              coopAiFileGen.resolve(
                gameFilePaths.coopAiMapFiles(
                  coopAis,
                  _.partial(mapsOfCoopAi, coopAis, maps),
                  GW.specs.genAIUnitMap
                )
              );
            })
            .then(null, fail);

          _.forEach(ownFileAis, function (coopAi, index) {
            ownAiFiles(battle, coopAi, index).then(null, fail);
          });

          playerFiles(battle).then(null, fail);
        };
        Promise.resolve(loads).then(buildArmyFiles).then(null, fail);

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
