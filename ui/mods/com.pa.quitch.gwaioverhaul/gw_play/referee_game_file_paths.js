// The measured half of gw_play/referee_game_files.js. Nothing here may touch an
// engine global at define time - see testing.md, "Coverage".
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js"], function (
  gwoCard
) {
  var getAIUnitMapPath = function (titans, aiInUse) {
    var append = titans ? "_x1.json" : ".json";

    switch (aiInUse) {
      case "Queller":
        return "/pa/ai_queller/q_uber/unit_maps/ai_unit_map" + append;
      case "Penchant":
        return "/pa/ai_penchant/unit_maps/ai_unit_map" + append;
      default:
        return "/pa/ai/unit_maps/ai_unit_map" + append;
    }
  };

  var getAIUnitMapDestinationPath = function (titans, aiPath) {
    var append = titans ? "_x1.json" : ".json";
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
    var titans = params.titans;
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
      playerFilesX1 = titans
        ? _.assign(
            {
              "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json.player":
                playerX1AIUnitMap,
            },
            playerSpecFiles
          )
        : {};
    } else {
      playerFilesClassic = _.assign({}, playerSpecFiles);
      playerFilesClassic[
        hostSubcommanderPath + "unit_maps/ai_unit_map.json.player"
      ] = playerAIUnitMap;
      playerFilesX1 = {};
      if (titans) {
        playerFilesX1[
          hostSubcommanderPath + "unit_maps/ai_unit_map_x1.json.player"
        ] = playerX1AIUnitMap;
      }
    }

    var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
    gwoSpecs.mod(playerFiles, mods.concat(extraMods), ".player");
    return playerFiles;
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

  return {
    getAIUnitMapPath: getAIUnitMapPath,
    getAIUnitMapDestinationPath: getAIUnitMapDestinationPath,
    mergeUnitMaps: mergeUnitMaps,
    clusterArmyIndex: clusterArmyIndex,
    resolveAiUnitMapPaths: resolveAiUnitMapPaths,
    buildPlayerFiles: buildPlayerFiles,
    specFetch: specFetch,
  };
});
