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

  var playerIsCluster = gwoAI.isCluster({
    faction: inventory.getTag("global", "playerFaction"),
  });
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

// Test-only hook: `module` does not exist in the game's Chromium UI runtime, so this
// branch never executes in-game. shared/gw_common (aliased GW below) is a base-game
// module GWO does not ship, so amd-loader's dependency resolution throws
// NotShippedError before this file's define() factory would ever run under Node - a
// module.exports placed inside the factory (like referee_config.js's) would never be
// reached. These path helpers are hoisted above define() and take their collaborators
// (gwoAI, gwoSpecs) as explicit parameters instead of closing over the factory's
// injected modules, so Node can reach them via requireShippedModule() without
// shared/gw_common. See test/referee_game_files_ai_paths.test.js. The else branch
// below is the real, unmodified game-runtime path - `module` is always undefined there.
// eslint-disable-next-line no-undef
if (typeof module !== "undefined" && module.exports) {
  // eslint-disable-next-line no-undef
  module.exports = {
    getAIUnitMapPath: getAIUnitMapPath,
    getAIUnitMapDestinationPath: getAIUnitMapDestinationPath,
    clusterArmyIndex: clusterArmyIndex,
    resolveAiUnitMapPaths: resolveAiUnitMapPaths,
    buildPlayerFiles: buildPlayerFiles,
  };
} else {
  define([
    "shared/gw_common",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
    "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  ], function (GW, gwoAI, gwoSpecs, refereeCoop) {
    var guardianMods = function (game, hostMods) {
      // Viewers only have their own distinct inventory to fold in when per-player
      // tech is enabled. Under shared control (the default, and solo play) every
      // connected player draws from the host's inventory, already included below.
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
      var aiUnitMapTitansDestinationPath =
        params.aiUnitMapTitansDestinationPath;
      var clusterUnitMapPath = params.clusterUnitMapPath;
      var clusterUnitMapTitansPath = params.clusterUnitMapTitansPath;
      var titans = params.titans;
      var game = params.game;
      var inventory = params.inventory;
      var aiFactionDeferred = params.aiFactionDeferred;

      var enemyAIUnitMap = GW.specs.genAIUnitMap(
        aiUnitMap,
        aiTag[currentCount]
      );
      var enemyX1AIUnitMap = GW.specs.genAIUnitMap(
        aiX1UnitMap,
        aiTag[currentCount]
      );

      return GW.specs
        .genUnitSpecs(aiSpecs, aiTag[currentCount])
        .then(function (aiSpecFiles) {
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

          if (ai.inventory) {
            var aiInventory =
              currentCount === 0
                ? ai.inventory
                : ai.foes[currentCount - 1].inventory;
            var guardians = ai.mirrorMode;
            if (guardians) {
              aiInventory = aiInventory.concat(
                guardianMods(game, inventory.mods())
              );
            }
            gwoSpecs.mod(aiFiles, aiInventory, aiTag[currentCount]);
          }
          aiFactionDeferred.resolve(aiFiles);
        });
    };

    // Files not assigned by default that we wish to mod - global for modder compatibility
    model.gwoSpecs = _.isArray(model.gwoSpecs) ? model.gwoSpecs : [];
    model.gwoSpecs = model.gwoSpecs.concat(gwoSpecs.additionalSpecs);

    return function () {
      var self = this;

      // Game file generation cannot use previously mounted files.  That would be bad.
      var done = $.Deferred();

      // community mods will hook unmountAllMemoryFiles to remount client mods
      api.file.unmountAllMemoryFiles().always(function () {
        var titans = api.content.usingTitans();

        var game = self.game();
        var ai = game.galaxy().stars()[game.currentStar()].ai();
        var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
        var aiTag = [];
        var aiFactions = [];
        _.times(aiFactionCount, function (n) {
          var aiNewTag = ".ai" + n;
          aiTag.push(aiNewTag);
          aiFactions.push($.Deferred());
        });

        var playerFileGen = $.Deferred();
        var filesToProcess = [playerFileGen];

        var enemyAI = gwoAI.aiInUse("enemy");
        var aiUnitMapSourcePath = getAIUnitMapPath(false, enemyAI);
        var aiUnitMapTitansSourcePath = getAIUnitMapPath(true, enemyAI);
        var enemyDestinationPath = gwoAI.getAIPathDestination("enemy");
        var aiUnitMapDestinationPath = getAIUnitMapDestinationPath(
          false,
          enemyDestinationPath
        );
        var aiUnitMapTitansDestinationPath = getAIUnitMapDestinationPath(
          true,
          enemyDestinationPath
        );

        var unitsLoad = $.get("spec://pa/units/unit_list.json");
        var aiMapLoad = $.get("spec:/" + aiUnitMapSourcePath);
        var aiX1MapLoad = titans
          ? $.get("spec:/" + aiUnitMapTitansSourcePath)
          : {};
        $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
          function (unitsGet, aiMapGet, aiX1MapGet) {
            var inventory = game.inventory();

            var units = parse(unitsGet[0]).units;
            var aiUnitMap = parse(aiMapGet[0]);
            var aiX1UnitMap = parse(aiX1MapGet[0]);
            var clusterUnitMapPath =
              "/pa/ai_cluster/unit_maps/ai_unit_map.json";
            var clusterUnitMapTitansPath =
              "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
            _.times(aiFactionCount, function (n) {
              var aiSpecs = units.concat(model.gwoSpecs);

              buildAiFactionFiles({
                currentCount: n,
                ai: ai,
                aiTag: aiTag,
                aiUnitMap: aiUnitMap,
                aiX1UnitMap: aiX1UnitMap,
                aiSpecs: aiSpecs,
                aiUnitMapDestinationPath: aiUnitMapDestinationPath,
                aiUnitMapTitansDestinationPath: aiUnitMapTitansDestinationPath,
                clusterUnitMapPath: clusterUnitMapPath,
                clusterUnitMapTitansPath: clusterUnitMapTitansPath,
                titans: titans,
                game: game,
                inventory: inventory,
                aiFactionDeferred: aiFactions[n],
              });
            });

            var playerTag = ".player";

            var playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, playerTag);
            var playerX1AIUnitMap = titans
              ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag)
              : {};
            var additionalPlayerSpecs = _.isUndefined(ai.ally)
              ? model.gwoSpecs
              : model.gwoSpecs.concat(ai.ally.commander);
            var playerSpecs = inventory.units().concat(additionalPlayerSpecs);

            GW.specs
              .genUnitSpecs(playerSpecs, playerTag)
              .then(function (playerSpecFiles) {
                playerFileGen.resolve(
                  buildPlayerFiles(
                    {
                      playerAIUnitMap: playerAIUnitMap,
                      playerX1AIUnitMap: playerX1AIUnitMap,
                      playerSpecFiles: playerSpecFiles,
                      inventory: inventory,
                      titans: titans,
                    },
                    gwoAI,
                    gwoSpecs
                  )
                );
              });
          }
        );

        _.times(aiFactionCount, function (n) {
          filesToProcess.push(aiFactions[n]);
        });

        $.when.apply($, filesToProcess).always(function () {
          self.files(_.assign.apply(_, arguments));
          done.resolve();
        });
      });
      return done.promise();
    };
  });
}
