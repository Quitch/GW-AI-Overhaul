// Pure path/file helpers for the game-files referee (gw_play/referee_game_files.js, a
// base-game-shadowed file whose define() factory depends on the unshipped
// shared/gw_common and so cannot load under the Node AMD harness). Split out here as a
// plain define() over lodash/$/Promise/JSON only - no engine globals at define-time, no
// unshipped deps - so this ai_unit_map path logic stays coverage-measured and directly
// unit-tested (test/referee_game_files_ai_paths.test.js) while the referee file itself
// is coverage-excluded as untestable glue. Helpers that need the referee's collaborators
// (buildPlayerFiles: gwoAI/gwoSpecs; resolveAiUnitMapPaths/clusterArmyIndex: the cluster
// predicate) take them as explicit parameters rather than closing over injected modules.
define(function () {
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

  var clusterArmyIndex = function (ai, isClusterFn) {
    var guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (ai.faction === 4) {
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

  // Determines whether a given AI faction's ai_unit_map should be written to the
  // Cluster-specific unit map path instead of its normal per-faction path, so the
  // unit map always lands wherever that faction's ai_path-scoped build orders do.
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

  var buildPlayerFiles = function (params, gwoAI, gwoSpecs) {
    var playerAIUnitMap = params.playerAIUnitMap;
    var playerX1AIUnitMap = params.playerX1AIUnitMap;
    var playerSpecFiles = params.playerSpecFiles;
    var inventory = params.inventory;
    var titans = params.titans;

    var playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    var hostSubcommanderPath = gwoAI.getAIPathDestination("subcommander");
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
    gwoSpecs.mod(playerFiles, inventory.mods(), ".player");
    return playerFiles;
  };

  // Fetches an untagged spec file (parsed) for gwoSpecCache. Mirrors the fetch +
  // JSON.parse + error handling the base game's genUnitSpecs does internally. Touches
  // only $/Promise/JSON at call time, never the referee's injected modules.
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
    clusterArmyIndex: clusterArmyIndex,
    resolveAiUnitMapPaths: resolveAiUnitMapPaths,
    buildPlayerFiles: buildPlayerFiles,
    specFetch: specFetch,
  };
});
