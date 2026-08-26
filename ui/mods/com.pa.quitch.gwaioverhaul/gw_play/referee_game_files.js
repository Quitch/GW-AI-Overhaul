// Glue. The testable half is gw_play/referee_game_file_paths.js - see testing.md.
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
], function (GW, gwoAI, gwoSpecs, refereeCoop, gwoSpecCache, gameFilePaths) {
  var getAIUnitMapPath = gameFilePaths.getAIUnitMapPath;
  var getAIUnitMapDestinationPath = gameFilePaths.getAIUnitMapDestinationPath;
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
      }
    );
  };

  // Files not assigned by default that we wish to mod - global for modder
  // compatibility, New-GW-Cards pushes here - see tech-cards.md
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
      var ai = gwoAI.currentStarAi(game);
      var aiTag = gwoAI.aiTags(ai);
      var aiFactionCount = aiTag.length;
      var aiFactions = _.map(aiTag, function () {
        return $.Deferred();
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
          var clusterUnitMapPath = "/pa/ai_cluster/unit_maps/ai_unit_map.json";
          var clusterUnitMapTitansPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
          // Identical for every faction - build it once rather than per iteration.
          var aiSpecs = units.concat(model.gwoSpecs);
          _.times(aiFactionCount, function (n) {
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

          genUnitSpecs(playerSpecs, playerTag).then(function (playerSpecFiles) {
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
