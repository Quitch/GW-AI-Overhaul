// The measured half of gw_play/referee_game_files.js. Nothing here may touch an
// engine global at define time - see testing.md, "Coverage".
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  var getAIUnitMapPath = function (x1, aiInUse) {
    var append = x1 ? "_x1.json" : ".json";

    switch (aiInUse) {
      case "Queller":
        return "/pa/ai_queller/q_uber/unit_maps/ai_unit_map" + append;
      case "Penchant":
        return "/pa/ai_penchant/unit_maps/ai_unit_map" + append;
      default:
        return "/pa/ai/unit_maps/ai_unit_map" + append;
    }
  };

  var getAIUnitMapDestinationPath = function (x1, aiPath) {
    var append = x1 ? "_x1.json" : ".json";
    return aiPath + "unit_maps/ai_unit_map" + append;
  };

  // The primary AI is tested through isClusterFn, as its foes already are: a
  // war saved before v5.44.0 holds faction as ["4"], which a bare === 4 misses,
  // routing the unit map away from the ai_path setAIPath assigned it.
  var clusterArmyIndex = function (ai, isClusterFn) {
    var guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (isClusterFn(ai)) {
      return 0;
    } else if (ai.foes) {
      var index = _.findIndex(ai.foes, function (foe) {
        return isClusterFn(foe);
      });
      if (index !== -1) {
        return index + 1;
      }
    }
    return -1;
  };

  // The unit map must land wherever that faction's scoped build orders do.
  var resolveAiUnitMapPaths = function (
    ai,
    currentCount,
    normalPaths,
    clusterPaths,
    isClusterFn
  ) {
    if (clusterArmyIndex(ai, isClusterFn) === currentCount) {
      return clusterPaths;
    }
    return normalPaths;
  };

  // The brain's map with each race map laid over it: a race key wins, so a
  // race that re-defines a vanilla key gets its own meaning of it.
  var mergeUnitMaps = function (baseMap, raceMaps) {
    var merged = _.assign({}, baseMap && baseMap.unit_map);

    _.forEach(raceMaps, function (raceMap) {
      _.assign(merged, raceMap && raceMap.unit_map);
    });

    return _.assign({}, baseMap, { unit_map: merged });
  };

  // params.race is optional: without it the player is MLA. params.mods, when
  // given, is the inventory's mods already expanded onto the race's files
  // (unit_cells.expandMods); otherwise the mods land as they always have.
  var buildPlayerFiles = function (params, gwoAI, gwoSpecs) {
    var playerAIUnitMap = params.playerAIUnitMap;
    var playerX1AIUnitMap = params.playerX1AIUnitMap;
    var playerSpecFiles = params.playerSpecFiles;
    var inventory = params.inventory;
    var race = params.race;
    var extraMods = params.extraMods || [];
    var mods = params.mods || inventory.mods();

    var playerIsCluster = gwoCard.playerIsCluster(inventory);
    var hostSubcommanderPath = gwoAI.getAIPathDestination("subcommander", {
      race: race,
    });
    var playerFilesClassic;
    var playerFilesX1;

    if (playerIsCluster) {
      playerFilesClassic = _.assign(
        {
          "/pa/ai_cluster/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
        },
        playerSpecFiles
      );
      playerFilesX1 = _.assign(
        {
          "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json.player":
            playerX1AIUnitMap,
        },
        playerSpecFiles
      );
    } else {
      playerFilesClassic = _.assign({}, playerSpecFiles);
      playerFilesClassic[
        hostSubcommanderPath + "unit_maps/ai_unit_map.json.player"
      ] = playerAIUnitMap;
      playerFilesX1 = {};
      playerFilesX1[
        hostSubcommanderPath + "unit_maps/ai_unit_map_x1.json.player"
      ] = playerX1AIUnitMap;
    }

    var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
    gwoSpecs.mod(playerFiles, mods.concat(extraMods), ".player");
    return playerFiles;
  };

  // Each co-op AI's unit maps, tagged with its spec tag and written into its own
  // tree's unit_maps/, beside the untagged maps its tree copy carries. AIs
  // sharing a tree and a tag share the files. mapsFor(ai) is { classic, x1 };
  // genAIUnitMap is GW.specs.genAIUnitMap.
  var coopAiMapFiles = function (coopAis, mapsFor, genAIUnitMap) {
    var files = {};

    _.forEach(coopAis, function (coopAi) {
      var maps = mapsFor(coopAi);
      files[getAIUnitMapDestinationPath(false, coopAi.path) + coopAi.tag] =
        genAIUnitMap(maps.classic, coopAi.tag);
      files[getAIUnitMapDestinationPath(true, coopAi.path) + coopAi.tag] =
        genAIUnitMap(maps.x1, coopAi.tag);
    });

    return files;
  };

  // The units a player's specs are built for, and the retag mods its
  // commanders need. A race player fields the race's units of the cells the
  // vanilla ones held occupy, and a kept vanilla unit (the Colonel) is
  // retagged so the race can build it; an MLA player keeps everything held and
  // gains the add-on units of those cells. params: held, cells, race, isMla,
  // commanders, unitCells, gwoRaces. See races.md.
  var specPlan = function (params) {
    var cells = params.cells;
    var unitCells = params.unitCells;
    var gwoRaces = params.gwoRaces;
    var specs = params.held;
    if (cells) {
      specs = (params.isMla ? unitCells.addonUnitsFor : unitCells.raceUnitsFor)(
        params.held,
        cells.vanilla,
        cells.race
      );
    }
    var keptVanilla =
      cells && !params.isMla
        ? _.difference(
            unitCells.heldCommanderUnits(params.held, cells.vanilla),
            params.commanders
          )
        : [];

    return {
      specs: specs,
      retagMods: _.flatten(
        _.map(params.commanders, function (commander) {
          return gwoRaces.commanderModsFor(params.race, commander);
        }).concat(
          _.map(keptVanilla, function (unit) {
            return gwoRaces.unitRetagMods(params.race, unit);
          })
        )
      ),
    };
  };

  // A per-player co-op AI player's own files: its specs with its tech
  // applied, and the unit maps its Sub Commanders' tree reads. params: tag,
  // specFiles, subcommanderPath, maps ({ classic, x1 }), genAIUnitMap, mods,
  // extraMods, gwoSpecs. See coop.md, "AI players' tech".
  var buildCoopAiFiles = function (params) {
    var tag = params.tag;
    var files = _.assign({}, params.specFiles);
    files[params.subcommanderPath + "unit_maps/ai_unit_map.json" + tag] =
      params.genAIUnitMap(params.maps.classic, tag);
    files[params.subcommanderPath + "unit_maps/ai_unit_map_x1.json" + tag] =
      params.genAIUnitMap(params.maps.x1, tag);

    var mods = (params.mods || []).concat(params.extraMods || []);
    if (mods.length) {
      params.gwoSpecs.mod(files, mods, tag);
    }
    return files;
  };

  // Mirrors the fetch, parse and error handling the base game's genUnitSpecs
  // does internally.
  var specFetch = function (item) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: "coui:/" + item,
        success: function (data) {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // Mirror base behaviour: keep whatever came back if it won't parse.
          }
          resolve(data);
        },
        error: function (request, status, error) {
          reject(error);
        },
      });
    });
  };

  // The spec mods an army carries into the battle: derived from the buffs the
  // war recorded, or the descriptors a war saved before that baked in.
  var armyInventory = function (army, loadoutFor, factionIndexFn, isClusterFn) {
    if (_.isArray(army.typeOfBuffs)) {
      return loadoutFor(
        factionIndexFn(army),
        army.typeOfBuffs,
        isClusterFn(army)
      );
    }
    return army.inventory || [];
  };

  // A file map as mountMemoryFiles takes it: every file as JSON text.
  var cookFiles = function (files) {
    return _.mapValues(files, function (value) {
      return _.isString(value) ? value : JSON.stringify(value);
    });
  };

  // What a rejection carries, for a log line: an Error's stack or message, a
  // jqXHR's status, else the value itself.
  var describeError = function (error) {
    if (error && (error.stack || error.message)) {
      return error.stack || error.message;
    }
    if (error && _.isNumber(error.status)) {
      return (
        "HTTP " +
        error.status +
        (error.statusText ? " " + error.statusText : "")
      );
    }
    return String(error);
  };

  // Each unit map once per page, through spec:// like the unit list. The
  // engine serves a spec:// path's first read for the rest of the process
  // anyway, so nothing later could read a different file. A failed read is
  // dropped from the cache, so the next Fight reads the file again rather
  // than inheriting the rejection. See specs.md.
  var mapCache = {};
  var loadMap = function (path) {
    if (!mapCache[path]) {
      mapCache[path] = $.get("spec:/" + path).then(
        function (data) {
          return parse(data);
        },
        function (error) {
          delete mapCache[path];
          return $.Deferred()
            .reject(
              new Error(
                "unit map not read: " + path + " (" + describeError(error) + ")"
              )
            )
            .promise();
        }
      );
    }
    return mapCache[path];
  };

  return {
    cookFiles: cookFiles,
    describeError: describeError,
    loadMap: loadMap,
    armyInventory: armyInventory,
    getAIUnitMapPath: getAIUnitMapPath,
    getAIUnitMapDestinationPath: getAIUnitMapDestinationPath,
    mergeUnitMaps: mergeUnitMaps,
    clusterArmyIndex: clusterArmyIndex,
    resolveAiUnitMapPaths: resolveAiUnitMapPaths,
    buildPlayerFiles: buildPlayerFiles,
    coopAiMapFiles: coopAiMapFiles,
    specPlan: specPlan,
    buildCoopAiFiles: buildCoopAiFiles,
    specFetch: specFetch,
  };
});
