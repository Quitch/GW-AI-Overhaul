define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
], function (gwoAI, refereeAIPaths) {
  var applyAiMods = function (json, mods) {
    var ops = {
      // fabber/factory/platoon only
      append: function (value, toBuild, idToMod, refId, refValue, matchAll) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          var validMatch =
            (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
            Object.prototype.hasOwnProperty.call(build, idToMod);

          if (validMatch && _.isArray(build[idToMod])) {
            build[idToMod] = build[idToMod].concat(value);
          } else if (validMatch) {
            build[idToMod] += value;
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              _.forEach(testArray, function (test) {
                var testMatches =
                  matchAll ||
                  (!_.isUndefined(refId) && test[refId] === refValue);
                if (testMatches) {
                  if (_.isArray(test[idToMod])) {
                    test[idToMod] = test[idToMod].concat(value);
                  } else if (test[idToMod]) {
                    test[idToMod] += value;
                  }
                }
              });
            });
          }
        });
      },
      // fabber/factory/platoon only
      prepend: function (value, toBuild, idToMod, refId, refValue, matchAll) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          var validMatch =
            (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
            Object.prototype.hasOwnProperty.call(build, idToMod);

          if (validMatch && _.isArray(build[idToMod])) {
            build[idToMod] = value.concat(build[idToMod]);
          } else if (validMatch) {
            build[idToMod] = value + build[idToMod];
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              _.forEach(testArray, function (test) {
                var testMatches =
                  matchAll ||
                  (!_.isUndefined(refId) && test[refId] === refValue);
                if (testMatches) {
                  if (_.isArray(test[idToMod])) {
                    test[idToMod] = value.concat(test[idToMod]);
                  } else if (test[idToMod]) {
                    test[idToMod] = value + test[idToMod];
                  }
                }
              });
            });
          }
        });
      },
      // fabber/factory/platoon only
      replace: function (value, toBuild, idToMod, refId, refValue, matchAll) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          var validMatch =
            (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
            Object.prototype.hasOwnProperty.call(build, idToMod);

          if (validMatch) {
            build[idToMod] = value;
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              _.forEach(testArray, function (test) {
                var testMatches =
                  matchAll ||
                  (!_.isUndefined(refId) && test[refId] === refValue);
                if (testMatches && test[idToMod]) {
                  test[idToMod] = value;
                }
              });
            });
          }
        });
      },
      // fabber/factory/platoon only
      remove: function (value, toBuild) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          _.forEach(build.build_conditions, function (testArray) {
            _.remove(testArray, function (object) {
              if (_.isEqual(object, value)) {
                return object;
              }
            });
          });
        });
      },
      // fabber/factory/platoon only
      new: function (value, toBuild, idToMod) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          if (idToMod) {
            _.forEach(build.build_conditions, function (testArray) {
              testArray.push(value);
            });
          } else {
            build.build_conditions.push(value);
          }
        });
      },
      // template only
      squad: function (value, toBuild) {
        if (json.platoon_templates[toBuild]) {
          json.platoon_templates[toBuild].units.push(value);
        }
      },
    };

    _.forEach(mods, function (mod) {
      if (!Object.prototype.hasOwnProperty.call(ops, mod.op)) {
        console.error("Invalid AI mod operation:", mod);
        return;
      }
      ops[mod.op](
        mod.value,
        mod.toBuild,
        mod.idToMod,
        mod.refId,
        mod.refValue,
        mod.matchAll
      );
    });
  };

  var getRefereeInventoryAiMods = function (inventory) {
    if (!inventory) {
      return [];
    }

    if (_.isFunction(inventory.aiMods)) {
      return inventory.aiMods();
    }

    return inventory.aiMods || [];
  };

  var getConnectedClientAiMods = function (game, connectedClients) {
    var connectedClientAiMods = [];

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

      connectedClientAiMods = connectedClientAiMods.concat(
        getRefereeInventoryAiMods(playerData.inventory)
      );
    });

    return connectedClientAiMods;
  };

  var getInventoryWithAllPlayerAiMods = function (
    inventory,
    game,
    connectedClients
  ) {
    var allPlayerAiMods = getRefereeInventoryAiMods(inventory).concat(
      getConnectedClientAiMods(game, connectedClients)
    );

    return {
      aiMods: function () {
        return allPlayerAiMods;
      },
    };
  };

  var whichAIsAreBeingModified = function (clusterPresence, inventory) {
    var game = model.game();
    var ai = game.galaxy().stars()[game.currentStar()].ai();
    var guardians = ai.mirrorMode;

    if (
      !_.isEmpty(getRefereeInventoryAiMods(inventory)) ||
      clusterPresence === "Player"
    ) {
      if (guardians) {
        return "All";
      } else {
        return "SubCommanders";
      }
    }
    return "None";
  };

  var managerPath = function (type) {
    switch (type) {
      case "fabber":
        return "fabber_builds/";
      case "factory":
        return "factory_builds/";
      case "platoon":
        return "platoon_builds/";
      case "template":
        return "platoon_templates/";
      default:
        throw new Error("Invalid AI file type: " + type);
    }
  };

  var addApplicableAiLoadModsToFileList = function (
    aiPath,
    fileList,
    inventory,
    aisToModify,
    aiPaths
  ) {
    var isSubCommanderDirectory =
      aiPath === aiPaths.subCommanderSource ||
      aiPaths.enemySource === aiPaths.subCommanderSource;

    if (isSubCommanderDirectory || aisToModify === "All") {
      var aiLoadMods = _.filter(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      _.forEach(aiLoadMods, function (file) {
        fileList.push("/pa/ai_tech/" + managerPath(file.type) + file.value);
      });
    }
  };

  var processFilesInDirectory = function (
    filePath,
    configFiles,
    aisToModify,
    aiPaths,
    clusterPresence,
    inventory,
    scopeToken
  ) {
    var filePathStarts = function (filePathFragment) {
      return _.startsWith(filePath, filePathFragment);
    };

    var filePathIncludes = function (filePathFragment) {
      return _.includes(filePath, filePathFragment);
    };

    var whoseFileIsItAnyway = function (aiPaths) {
      var aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;

      if (aisShareAPath) {
        return "shared";
      } else if (filePathStarts(aiPaths.enemySource)) {
        return "enemy";
      }
      return "subcommander";
    };

    var aiModsInScopeOfFile = function () {
      var aiMods = _.reject(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      if (!aiMods.length) {
        return [];
      }

      var pathTypeMap = {
        "/fabber_builds/": "fabber",
        "/factory_builds/": "factory",
        "/platoon_builds/": "platoon",
        "/platoon_templates/": "template",
      };
      var aiManager =
        _(pathTypeMap)
          .keys()
          .find(function (key) {
            return filePathIncludes(key);
          }) || "";

      return _.filter(aiMods, { type: pathTypeMap[aiManager] });
    };

    var changeFilePath = function (aiPath, pathLength) {
      return aiPath + filePath.slice(pathLength);
    };

    var clusterAIModsInScopeOfFile = function () {
      if (!filePathIncludes("/factory_builds/")) {
        return;
      }

      var clusterCommanders = ["SupportPlatform", "SupportCommander"];

      return _.map(clusterCommanders, function (commander) {
        return {
          type: "factory",
          op: "replace",
          toBuild: commander,
          idToMod: "priority",
          value: 0,
          matchAll: true,
        };
      });
    };

    // built on the assumption that the Guardians are never Cluster
    var processClusterJson = function (json, pathLength) {
      var clusterOps = clusterAIModsInScopeOfFile() || [];
      var clusterJson = _.cloneDeep(json);
      var clusterFilePath = changeFilePath(
        refereeAIPaths.getAIPathDestination(
          "cluster",
          gwoAI.aiInUse("subcommander"),
          {
            scopeToken: scopeToken,
          }
        ),
        pathLength
      );

      applyAiMods(clusterJson, clusterOps);
      configFiles[clusterFilePath] = clusterJson;
    };

    return $.getJSON("coui:/" + filePath).then(function (json) {
      var fileOwner = whoseFileIsItAnyway(aiPaths);
      var isSubCommanderDirectory = filePathStarts(aiPaths.subCommanderSource);
      var aiTechPath = "/pa/ai_tech/";
      var isSubCommanderTechFile = filePathStarts(aiTechPath);
      var aiJsonModsInScope = [];
      var updatedFilePaths = [];
      var pathLength = 0;

      inventory = inventory || model.game().inventory();

      // Apply AI mods to the file
      if (aisToModify === "All") {
        if (isSubCommanderTechFile) {
          // File's source is not an AI path so it needs to be copied to the AIs' paths
          updatedFilePaths.push(
            changeFilePath(aiPaths.enemyDestination, aiTechPath.length),
            changeFilePath(aiPaths.subCommanderDestination, aiTechPath.length)
          );
        }
        aiJsonModsInScope = aiModsInScopeOfFile();
      } else if (aisToModify === "SubCommanders" && fileOwner !== "enemy") {
        if (fileOwner === "shared") {
          // Make a clean copy of the files for enemy AIs before modification of the JSON
          configFiles[filePath] = _.cloneDeep(json);
        }

        if (isSubCommanderTechFile) {
          pathLength = aiTechPath.length;
        } else if (fileOwner === "shared") {
          pathLength = aiPaths.enemySource.length;
        } else if (isSubCommanderDirectory) {
          pathLength = aiPaths.subCommanderSource.length;
        }

        updatedFilePaths.push(
          changeFilePath(aiPaths.subCommanderDestination, pathLength)
        );
        aiJsonModsInScope = aiModsInScopeOfFile();
      }

      // Scoped enemy destinations (such as Guardians) must include a full AI file tree
      // so ai_path lookups resolve against the same destination directory.
      if (
        fileOwner === "enemy" &&
        aiPaths.enemyDestination !== aiPaths.enemySource
      ) {
        pathLength = aiPaths.enemySource.length;
        updatedFilePaths.push(
          changeFilePath(aiPaths.enemyDestination, pathLength)
        );
      }

      var finalFilePaths = _.isEmpty(updatedFilePaths)
        ? [filePath]
        : updatedFilePaths;

      applyAiMods(json, aiJsonModsInScope);
      _.forEach(finalFilePaths, function (finalFilePath) {
        configFiles[finalFilePath] = json;
      });

      if (clusterPresence === "Player" && fileOwner !== "enemy") {
        pathLength = isSubCommanderTechFile
          ? aiTechPath.length
          : aiPaths.subCommanderSource.length;
        processClusterJson(json, pathLength);
      } else if (clusterPresence === "Enemy" && fileOwner !== "subcommander") {
        processClusterJson(json, aiPaths.enemySource.length);
      }
    });
  };

  var processDirectories = function (
    aiPath,
    configFiles,
    aiPaths,
    clusterPresence,
    inventory,
    scopeToken,
    forceSubCommanderScope
  ) {
    var deferred = $.Deferred();

    api.file.list(aiPath, true).then(function (fileList) {
      var aisToModify = forceSubCommanderScope
        ? "SubCommanders"
        : whichAIsAreBeingModified(clusterPresence, inventory);

      addApplicableAiLoadModsToFileList(
        aiPath,
        fileList,
        inventory,
        aisToModify,
        aiPaths
      );

      var promises = _.map(fileList, function (filePath) {
        if (
          !_.endsWith(filePath, ".json") ||
          _.includes(filePath, "/neural_networks/") // AIs fall back to /pa/ai/neural_networks/
        ) {
          return;
        }

        return processFilesInDirectory(
          filePath,
          configFiles,
          aisToModify,
          aiPaths,
          clusterPresence,
          inventory,
          scopeToken
        );
      });

      Promise.all(promises).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  var whoIsCluster = function () {
    var game = model.game();
    var inventory = game.inventory();
    var ai = game.galaxy().stars()[game.currentStar()].ai();
    var alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    var numberOfAllies = alliedCommanders.length;
    var isPlayerCluster = inventory.getTag("global", "playerFaction") === 4;
    var isEnemyCluster =
      gwoAI.isCluster(ai) ||
      _.some(ai.foes, function (foe) {
        return gwoAI.isCluster(foe);
      });

    if (isPlayerCluster && numberOfAllies > 0) {
      return "Player";
    }
    if (isEnemyCluster) {
      return "Enemy";
    }
    return "None";
  };

  // parse AI files, apply AI mods, and load the results into self.files()
  return function () {
    var deferred = $.Deferred();

    var self = this;
    var configFiles = self.files(); // JSON files passed to the server
    var aiPaths = {
      enemySource: gwoAI.getAIPathSource("enemy"),
      enemyDestination: gwoAI.getAIPathDestination("enemy"),
      subCommanderSource: gwoAI.getAIPathSource("subcommander"),
      subCommanderDestination: gwoAI.getAIPathDestination("subcommander"),
    };
    var aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;
    var aiPathsToProcess = aisShareAPath
      ? [aiPaths.enemySource]
      : [aiPaths.enemySource, aiPaths.subCommanderSource];
    var clusterPresence = whoIsCluster();
    var game = model.game();
    var ai = game.galaxy().stars()[game.currentStar()].ai();
    var guardians = ai.mirrorMode;
    var connectedClients = _.isFunction(model.gwCampaignConnectedClients)
      ? model.gwCampaignConnectedClients()
      : [];
    var playerAiModInventory = guardians
      ? getInventoryWithAllPlayerAiMods(
          game.inventory(),
          game,
          connectedClients
        )
      : game.inventory();

    var promises = _.map(aiPathsToProcess, function (aiPath) {
      return processDirectories(
        aiPath,
        configFiles,
        aiPaths,
        clusterPresence,
        playerAiModInventory,
        undefined,
        false
      );
    });

    var viewerIndex = 0;

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

      var viewerInventory = playerData.inventory;
      var viewerPlayerTag = ".player" + viewerIndex;
      var viewerScopeToken = refereeAIPaths.getScopeToken(
        viewerPlayerTag,
        viewerPlayerTag
      );
      var viewerAiMods = getRefereeInventoryAiMods(viewerInventory);
      var viewerCards = _.isFunction(viewerInventory.cards)
        ? viewerInventory.cards()
        : viewerInventory.cards || [];
      var viewerSmartSubcommanders = _.some(viewerCards, {
        id: "gwaio_upgrade_subcommander_tactics",
      });
      var viewerSubCommanderDestination = refereeAIPaths.getAIPathDestination(
        "subcommander",
        gwoAI.aiInUse("subcommander"),
        {
          aiMods: viewerAiMods,
          smartSubcommanders: viewerSmartSubcommanders,
          scopeToken: viewerPlayerTag,
        }
      );
      var viewerAiPaths = _.assign({}, aiPaths, {
        subCommanderDestination: viewerSubCommanderDestination,
      });

      promises.push(
        processDirectories(
          aiPaths.subCommanderSource,
          configFiles,
          viewerAiPaths,
          clusterPresence,
          viewerInventory,
          viewerScopeToken,
          true
        )
      );

      viewerIndex += 1;
    });

    Promise.all(promises).then(function () {
      deferred.resolve();
    });

    return deferred.promise();
  };
});
