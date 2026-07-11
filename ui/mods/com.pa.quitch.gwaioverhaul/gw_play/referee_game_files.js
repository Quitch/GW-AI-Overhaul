const getAIUnitMapPath = function (titans, aiInUse) {
  const append = titans ? "_x1.json" : ".json";

  switch (aiInUse) {
    case "Queller":
      return "/pa/ai_queller/q_uber/unit_maps/ai_unit_map" + append;
    case "Penchant":
      return "/pa/ai_penchant/unit_maps/ai_unit_map" + append;
    default:
      return "/pa/ai/unit_maps/ai_unit_map" + append;
  }
};

const getAIUnitMapDestinationPath = function (titans, aiPath) {
  const append = titans ? "_x1.json" : ".json";
  return aiPath + "unit_maps/ai_unit_map" + append;
};

const guardianMods = function (game, mods) {
  const connectedClients = _.isFunction(model.gwCampaignConnectedClients)
    ? model.gwCampaignConnectedClients()
    : [];

  if (connectedClients.length) {
    var playerMods = [];
    _.forEach(connectedClients, function (client) {
      if (!client || client.role !== "viewer") {
        return;
      }

      var playerData =
        game.findCoopPlayerInventoryData &&
        game.findCoopPlayerInventoryData({
          id: client.id,
          name: client.name,
        });

      if (!playerData || !playerData.inventory) {
        return;
      }

      playerMods = playerMods.concat(playerData.inventory.mods);
    });

    return playerMods;
  }

  return mods;
};

define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/specs.js",
], function (GW, gwoUnit, gwoAI, gwoSpecs) {
  const clusterArmyIndex = function (ai) {
    const guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (ai.faction === 4) {
      return 0;
    } else if (ai.foes) {
      const index = _.findIndex(ai.foes, function (foe) {
        return gwoAI.isCluster(foe);
      });
      if (index !== -1) {
        return index + 1;
      }
    }
    return -1;
  };

  const buildAiFactionFiles = function (params) {
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

    const enemyAIUnitMap = GW.specs.genAIUnitMap(
      aiUnitMap,
      aiTag[currentCount]
    );
    const enemyX1AIUnitMap = GW.specs.genAIUnitMap(
      aiX1UnitMap,
      aiTag[currentCount]
    );

    return GW.specs
      .genUnitSpecs(aiSpecs, aiTag[currentCount])
      .then(function (aiSpecFiles) {
        var unitMapPath = aiUnitMapDestinationPath;
        var unitMapTitansPath = aiUnitMapTitansDestinationPath;
        if (clusterArmyIndex(ai) === currentCount) {
          unitMapPath = clusterUnitMapPath;
          unitMapTitansPath = clusterUnitMapTitansPath;
        }

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
        const aiFiles = _.assign({}, aiFilesClassic, aiFilesX1);

        if (ai.inventory) {
          var aiInventory =
            currentCount === 0
              ? ai.inventory
              : ai.foes[currentCount - 1].inventory;
          const guardians = ai.mirrorMode;
          if (guardians) {
            aiInventory = aiInventory.concat(
              guardianMods(game, inventory.mods)
            );
          }
          gwoSpecs.mod(aiFiles, aiInventory, aiTag[currentCount]);
        }
        aiFactionDeferred.resolve(aiFiles);
      });
  };

  const buildPlayerFiles = function (params) {
    var playerAIUnitMap = params.playerAIUnitMap;
    var playerX1AIUnitMap = params.playerX1AIUnitMap;
    var playerSpecFiles = params.playerSpecFiles;
    var inventory = params.inventory;
    var titans = params.titans;

    const playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    const hostSubcommanderPath = gwoAI.getAIPathDestination("subcommander");
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

    const playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
    gwoSpecs.mod(playerFiles, inventory.mods(), ".player");
    return playerFiles;
  };

  // global for modder compatibility
  if (!model.gwoSpecs) {
    model.gwoSpecs = [];
  }
  // files not assigned by default that we wish to mod
  model.gwoSpecs.push(
    gwoUnit.fireflyAmmo,
    gwoUnit.fireflyWeapon,
    gwoUnit.orcaTorpedo,
    gwoUnit.orcaTorpedoAmmo,
    gwoUnit.skitterAmmo,
    gwoUnit.skitterWeapon
  );

  return function () {
    const self = this;

    // Game file generation cannot use previously mounted files.  That would be bad.
    const done = $.Deferred();

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      const titans = api.content.usingTitans();

      const game = self.game();
      const ai = game.galaxy().stars()[game.currentStar()].ai();
      const aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
      const aiTag = [];
      const aiFactions = [];
      _.times(aiFactionCount, function (n) {
        const aiNewTag = ".ai" + n;
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
        enemyDestinationPath
      );
      const aiUnitMapTitansDestinationPath = getAIUnitMapDestinationPath(
        true,
        enemyDestinationPath
      );

      const unitsLoad = $.get("spec://pa/units/unit_list.json");
      const aiMapLoad = $.get("spec:/" + aiUnitMapSourcePath);
      const aiX1MapLoad = titans
        ? $.get("spec:/" + aiUnitMapTitansSourcePath)
        : {};
      $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
        function (unitsGet, aiMapGet, aiX1MapGet) {
          const inventory = game.inventory();

          const units = parse(unitsGet[0]).units;
          const aiUnitMap = parse(aiMapGet[0]);
          const aiX1UnitMap = parse(aiX1MapGet[0]);
          const clusterUnitMapPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map.json";
          const clusterUnitMapTitansPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
          _.times(aiFactionCount, function (n) {
            const aiSpecs = units.concat(model.gwoSpecs);

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

          const playerTag = ".player";

          const playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, playerTag);
          const playerX1AIUnitMap = titans
            ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag)
            : {};
          const additionalPlayerSpecs = _.isUndefined(ai.ally)
            ? model.gwoSpecs
            : model.gwoSpecs.concat(ai.ally.commander);
          const playerSpecs = inventory.units().concat(additionalPlayerSpecs);

          GW.specs
            .genUnitSpecs(playerSpecs, playerTag)
            .then(function (playerSpecFiles) {
              playerFileGen.resolve(
                buildPlayerFiles({
                  playerAIUnitMap: playerAIUnitMap,
                  playerX1AIUnitMap: playerX1AIUnitMap,
                  playerSpecFiles: playerSpecFiles,
                  inventory: inventory,
                  titans: titans,
                })
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
