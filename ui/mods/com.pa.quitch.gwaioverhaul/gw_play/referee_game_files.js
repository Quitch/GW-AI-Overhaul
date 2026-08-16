// Glue. The testable half is gw_play/referee_game_file_paths.js - see testing.md.
define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/spec_cache.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
], (GW, gwoAI, gwoSpecs, refereeCoop, gwoSpecCache, gameFilePaths) => {
  const getAIUnitMapPath = gameFilePaths.getAIUnitMapPath;
  const getAIUnitMapDestinationPath = gameFilePaths.getAIUnitMapDestinationPath;
  const resolveAiUnitMapPaths = gameFilePaths.resolveAiUnitMapPaths;
  const buildPlayerFiles = gameFilePaths.buildPlayerFiles;
  const specFetch = gameFilePaths.specFetch;
  // Drop-in for GW.specs.genUnitSpecs, fetching each spec file at most once.
  const genUnitSpecs = (units, tag) =>
    gwoSpecCache.genUnitSpecs(units, tag, { fetch: specFetch });

  const guardianMods = (game, hostMods) => {
    // Without per-player tech every viewer draws from the host's inventory.
    if (!game.perPlayerTechCards()) {
      return hostMods;
    }

    let mods = hostMods;
    _.forEach(refereeCoop.getConnectedViewerInventories(game), (viewer) => {
      mods = mods.concat(viewer.inventory.mods);
    });

    return mods;
  };

  const buildAiFactionFiles = (params) => {
    const currentCount = params.currentCount;
    const ai = params.ai;
    const aiTag = params.aiTag;
    const aiUnitMap = params.aiUnitMap;
    const aiX1UnitMap = params.aiX1UnitMap;
    const aiSpecs = params.aiSpecs;
    const aiUnitMapDestinationPath = params.aiUnitMapDestinationPath;
    const aiUnitMapTitansDestinationPath =
      params.aiUnitMapTitansDestinationPath;
    const clusterUnitMapPath = params.clusterUnitMapPath;
    const clusterUnitMapTitansPath = params.clusterUnitMapTitansPath;
    const titans = params.titans;
    const game = params.game;
    const inventory = params.inventory;
    const aiFactionDeferred = params.aiFactionDeferred;

    const enemyAIUnitMap = GW.specs.genAIUnitMap(
      aiUnitMap,
      aiTag[currentCount],
    );
    const enemyX1AIUnitMap = GW.specs.genAIUnitMap(
      aiX1UnitMap,
      aiTag[currentCount],
    );

    return genUnitSpecs(aiSpecs, aiTag[currentCount]).then((aiSpecFiles) => {
      const resolvedPaths = resolveAiUnitMapPaths(
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
        gwoAI.isCluster,
      );
      const unitMapPath = resolvedPaths.unitMapPath;
      const unitMapTitansPath = resolvedPaths.unitMapTitansPath;

      const enemyAIUnitMapFile = unitMapPath + aiTag[currentCount];
      const enemyAIUnitMapPair = {};
      enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
      const enemyX1AIUnitMapFile = unitMapTitansPath + aiTag[currentCount];
      const enemyX1AIUnitMapPair = {};
      enemyX1AIUnitMapPair[enemyX1AIUnitMapFile] = enemyX1AIUnitMap;
      const aiFilesClassic = _.assign(enemyAIUnitMapPair, aiSpecFiles);
      const aiFilesX1 = titans
        ? _.assign(enemyX1AIUnitMapPair, aiSpecFiles)
        : {};
      const aiFiles = Object.assign({}, aiFilesClassic, aiFilesX1);

      if (ai.inventory) {
        let aiInventory =
          currentCount === 0
            ? ai.inventory
            : ai.foes[currentCount - 1].inventory;
        const guardians = ai.mirrorMode;
        if (guardians) {
          aiInventory = aiInventory.concat(
            guardianMods(game, inventory.mods()),
          );
        }
        gwoSpecs.mod(aiFiles, aiInventory, aiTag[currentCount]);
      }
      aiFactionDeferred.resolve(aiFiles);
    });
  };

  // Files not assigned by default that we wish to mod - global for modder
  // compatibility, New-GW-Cards pushes here - see tech-cards.md
  model.gwoSpecs = Array.isArray(model.gwoSpecs) ? model.gwoSpecs : [];
  model.gwoSpecs = model.gwoSpecs.concat(gwoSpecs.additionalSpecs);

  return function () {
    const self = this;

    // Game file generation cannot use previously mounted files.  That would be bad.
    const done = $.Deferred();

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(() => {
      const titans = api.content.usingTitans();

      const game = self.game();
      const ai = game.galaxy().stars()[game.currentStar()].ai();
      const aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
      const aiTag = [];
      const aiFactions = [];
      _.times(aiFactionCount, (n) => {
        const aiNewTag = `.ai${n}`;
        aiTag.push(aiNewTag);
        aiFactions.push($.Deferred());
      });

      const playerFileGen = $.Deferred();
      const filesToProcess = [playerFileGen];

      const enemyAI = gwoAI.aiInUse("enemy");
      const aiUnitMapSourcePath = getAIUnitMapPath(false, enemyAI);
      const aiUnitMapTitansSourcePath = getAIUnitMapPath(true, enemyAI);
      const enemyDestinationPath = gwoAI.getAIPathDestination("enemy");
      const aiUnitMapDestinationPath = getAIUnitMapDestinationPath(
        false,
        enemyDestinationPath,
      );
      const aiUnitMapTitansDestinationPath = getAIUnitMapDestinationPath(
        true,
        enemyDestinationPath,
      );

      const unitsLoad = $.get("spec://pa/units/unit_list.json");
      const aiMapLoad = $.get(`spec:/${aiUnitMapSourcePath}`);
      const aiX1MapLoad = titans
        ? $.get(`spec:/${aiUnitMapTitansSourcePath}`)
        : {};
      $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
        (unitsGet, aiMapGet, aiX1MapGet) => {
          const inventory = game.inventory();

          const units = parse(unitsGet[0]).units;
          const aiUnitMap = parse(aiMapGet[0]);
          const aiX1UnitMap = parse(aiX1MapGet[0]);
          const clusterUnitMapPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map.json";
          const clusterUnitMapTitansPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
          // Identical for every faction - build it once rather than per iteration.
          const aiSpecs = units.concat(model.gwoSpecs);
          _.times(aiFactionCount, (n) => {
            buildAiFactionFiles({
              currentCount: n,
              ai,
              aiTag,
              aiUnitMap,
              aiX1UnitMap,
              aiSpecs,
              aiUnitMapDestinationPath,
              aiUnitMapTitansDestinationPath,
              clusterUnitMapPath,
              clusterUnitMapTitansPath,
              titans,
              game,
              inventory,
              aiFactionDeferred: aiFactions[n],
            });
          });

          const playerTag = ".player";

          const playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, playerTag);
          const playerX1AIUnitMap = titans
            ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag)
            : {};
          const additionalPlayerSpecs = _.isUndefined(ai.ally)
            ? model.gwoSpecs
            : model.gwoSpecs.concat(ai.ally.commander);
          const playerSpecs = inventory.units().concat(additionalPlayerSpecs);

          genUnitSpecs(playerSpecs, playerTag).then((playerSpecFiles) => {
            playerFileGen.resolve(
              buildPlayerFiles(
                {
                  playerAIUnitMap,
                  playerX1AIUnitMap,
                  playerSpecFiles,
                  inventory,
                  titans,
                },
                gwoAI,
                gwoSpecs,
              ),
            );
          });
        },
      );

      _.times(aiFactionCount, (n) => {
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
