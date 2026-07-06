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

const guardianMods = function (game, mods) {
  const perPlayerLoadouts =
    game.coopPlayerInventoryData && _.isFunction(game.coopPlayerInventoryData);

  if (perPlayerLoadouts) {
    var playerMods = [];
    _.forEach(game.coopPlayerInventoryData(), function (playerData) {
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
      const aiUnitMapPath = getAIUnitMapPath(false, enemyAI);
      const aiUnitMapTitansPath = getAIUnitMapPath(true, enemyAI);

      const unitsLoad = $.get("spec://pa/units/unit_list.json");
      const aiMapLoad = $.get("spec:/" + aiUnitMapPath);
      const aiX1MapLoad = titans ? $.get("spec:/" + aiUnitMapTitansPath) : {};
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
            const currentCount = n;
            const enemyAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, aiTag[n]);
            const enemyX1AIUnitMap = GW.specs.genAIUnitMap(
              aiX1UnitMap,
              aiTag[n]
            );
            const aiSpecs = units.concat(model.gwoSpecs);

            GW.specs
              .genUnitSpecs(aiSpecs, aiTag[n])
              .then(function (aiSpecFiles) {
                var unitMapPath = aiUnitMapPath;
                var unitMapTitansPath = aiUnitMapTitansPath;
                if (clusterArmyIndex(ai) === currentCount) {
                  unitMapPath = clusterUnitMapPath;
                  unitMapTitansPath = clusterUnitMapTitansPath;
                }

                const enemyAIUnitMapFile = unitMapPath + aiTag[n];
                const enemyAIUnitMapPair = {};
                enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
                const enemyX1AIUnitMapFile = unitMapTitansPath + aiTag[n];
                const enemyX1AIUnitMapPair = {};
                enemyX1AIUnitMapPair[enemyX1AIUnitMapFile] = enemyX1AIUnitMap;
                const aiFilesClassic = _.assign(
                  enemyAIUnitMapPair,
                  aiSpecFiles
                );
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
                  gwoSpecs.mod(aiFiles, aiInventory, aiTag[n]);
                }
                aiFactions[currentCount].resolve(aiFiles);
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
              var playerFilesClassic = _.assign(
                {
                  "/pa/ai/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
                },
                playerSpecFiles
              );
              var playerFilesX1 = titans
                ? _.assign(
                    {
                      "/pa/ai/unit_maps/ai_unit_map_x1.json.player":
                        playerX1AIUnitMap,
                    },
                    playerSpecFiles
                  )
                : {};
              const playerIsCluster =
                inventory.getTag("global", "playerFaction") === 4;
              const guardians = ai.mirrorMode;
              const subcommanderAI = gwoAI.aiInUse("subcommander");
              // the order of unit_map assignments must match getAIPathDestination()
              if (playerIsCluster) {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_cluster/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
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
              } else if (
                subcommanderAI === "Queller" &&
                _.some(inventory.cards(), {
                  id: "gwaio_upgrade_subcommander_tactics",
                })
              ) {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_queller/q_silver/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_queller/q_silver/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              } else if (subcommanderAI === "Queller") {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_queller/q_bronze/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_queller/q_bronze/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              } else if (!_.isEmpty(inventory.aiMods()) && !guardians) {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_subcommander/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_subcommander/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              } else if (subcommanderAI === "Penchant") {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_penchant/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_penchant/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              }
              const playerFiles = _.assign(
                {},
                playerFilesClassic,
                playerFilesX1
              );
              gwoSpecs.mod(playerFiles, inventory.mods(), playerTag);
              playerFileGen.resolve(playerFiles);
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
