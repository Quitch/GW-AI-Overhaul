define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"], function (
  gwoAI
) {
  const applyAiMods = function (json, mods) {
    const ops = {
      // fabber/factory/platoon only
      append: function (value, toBuild, idToMod, refId, refValue) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          const validMatch =
            (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
            build[idToMod];

          if (validMatch && _.isArray(build[idToMod])) {
            build[idToMod] = build[idToMod].concat(value);
          } else if (validMatch) {
            build[idToMod] += value;
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              _.forEach(testArray, function (test) {
                if (test[refId] === refValue) {
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
      prepend: function (value, toBuild, idToMod, refId, refValue) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          const validMatch =
            (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
            build[idToMod];

          if (validMatch && _.isArray(build[idToMod])) {
            build[idToMod] = value.concat(build[idToMod]);
          } else if (validMatch) {
            build[idToMod] = value + build[idToMod];
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              _.forEach(testArray, function (test) {
                if (test[refId] === refValue) {
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
      replace: function (value, toBuild, idToMod, refId, refValue) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build !== toBuild) {
            return;
          }

          const validMatch =
            (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
            build[idToMod];

          if (validMatch) {
            build[idToMod] = value;
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              _.forEach(testArray, function (test) {
                if (test[refId] === refValue && test[idToMod]) {
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

          if (_.isUndefined(idToMod)) {
            build.build_conditions.push(value);
          } else {
            _.forEach(build.build_conditions, function (testArray) {
              testArray.push(value);
            });
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
      ops[mod.op](mod.value, mod.toBuild, mod.idToMod, mod.refId, mod.refValue);
    });
  };

  const whoIsCluster = function () {
    const game = model.game();
    const inventory = game.inventory();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    const numberOfAllies = alliedCommanders.length;
    const isPlayerCluster = inventory.getTag("global", "playerFaction") === 4;
    const isEnemyCluster =
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

  const whichAIsAreBeingModified = function () {
    const game = model.game();
    const inventory = game.inventory();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const guardians = ai.mirrorMode;
    const clusterPresence = whoIsCluster();

    if (!_.isEmpty(inventory.aiMods()) || clusterPresence === "Player") {
      if (guardians) {
        return "All";
      } else {
        return "SubCommanders";
      }
    }
    return "None";
  };

  const processFilesInDirectory = function (
    filePath,
    configFiles,
    aisToModify
  ) {
    const filePathStarts = function (filePathFragment) {
      return _.startsWith(filePath, filePathFragment);
    };

    const filePathIncludes = function (filePathFragment) {
      return _.includes(filePath, filePathFragment);
    };

    const aiTechPath = "/pa/ai_tech/";

    const whoseFileIsItAnyway = function () {
      const aisShareAPath =
        gwoAI.getAIPathSource("enemy") ===
        gwoAI.getAIPathSource("subcommander");

      if (aisShareAPath) {
        return "shared";
      } else if (filePathStarts(gwoAI.getAIPathSource("enemy"))) {
        return "enemy";
      }
      return "subcommander";
    };

    const aiModsInScopeOfFile = function () {
      const aiMods = _.reject(model.game().inventory().aiMods(), {
        op: "load",
      });

      if (_.isEmpty(aiMods)) {
        return [];
      }

      var aiManager = "";

      if (filePathIncludes("/fabber_builds/")) {
        aiManager = "fabber";
      } else if (filePathIncludes("/factory_builds/")) {
        aiManager = "factory";
      } else if (filePathIncludes("/platoon_builds/")) {
        aiManager = "platoon";
      } else if (filePathIncludes("/platoon_templates/")) {
        aiManager = "template";
      }

      return _.filter(aiMods, { type: aiManager });
    };

    const changeFilePath = function (aiPath, pathLength) {
      return aiPath + filePath.slice(pathLength);
    };

    const clusterAIModsInScopeOfFile = function () {
      if (!filePathIncludes("/factory_builds/")) {
        return;
      }

      const clusterCommanders = ["SupportPlatform", "SupportCommander"];

      return _.map(clusterCommanders, function (commander) {
        return {
          type: "factory",
          op: "replace",
          toBuild: commander,
          idToMod: "priority",
          value: 0,
        };
      });
    };

    // built on the assumption that the Guardians are never Cluster
    const processClusterJson = function (json, pathLength) {
      const clusterOps = clusterAIModsInScopeOfFile() || [];
      const clusterJson = _.cloneDeep(json);
      const clusterFilePath = changeFilePath(
        gwoAI.getAIPathDestination("cluster"),
        pathLength
      );

      // apply AI mods to the file
      applyAiMods(clusterJson, clusterOps);
      configFiles[clusterFilePath] = clusterJson;
    };

    return $.getJSON("coui:/" + filePath).then(function (json) {
      const fileOwner = whoseFileIsItAnyway();
      const oldEnemyPath = gwoAI.getAIPathSource("enemy");
      const newEnemyPath = gwoAI.getAIPathDestination("enemy");
      const newSubCommanderPath = gwoAI.getAIPathDestination("subcommander");
      const oldSubCommanderPath = gwoAI.getAIPathSource("subcommander");
      const isSubCommanderDirectory = filePathStarts(oldSubCommanderPath);
      const isSubCommanderTechFile = filePathStarts(aiTechPath);
      var aiJsonModsInScope = [];
      var updatedFilePaths = [];
      var pathLength = 0;

      // Apply AI mods to the file

      switch (aisToModify) {
        case "All":
          if (isSubCommanderTechFile) {
            // File's source is not an AI path so it needs to be copied to the AIs' paths
            updatedFilePaths.push(
              changeFilePath(newEnemyPath, aiTechPath.length)
            );
            updatedFilePaths.push(
              changeFilePath(newSubCommanderPath, aiTechPath.length)
            );
          }
          aiJsonModsInScope = aiModsInScopeOfFile();
          break;

        case "SubCommanders":
          if (fileOwner === "enemy") {
            break;
          }

          if (fileOwner === "shared") {
            // Make a clean copy of the files for enemy AIs before modification of the JSON
            configFiles[filePath] = _.cloneDeep(json);
          }

          if (isSubCommanderTechFile) {
            pathLength = aiTechPath.length;
          } else if (fileOwner === "shared") {
            pathLength = oldEnemyPath.length;
          } else if (isSubCommanderDirectory) {
            pathLength = oldSubCommanderPath.length;
          }

          updatedFilePaths.push(
            changeFilePath(newSubCommanderPath, pathLength)
          );
          aiJsonModsInScope = aiModsInScopeOfFile();
          break;
      }

      const finalFilePaths = _.isEmpty(updatedFilePaths)
        ? [filePath]
        : updatedFilePaths;

      applyAiMods(json, aiJsonModsInScope);
      _.forEach(finalFilePaths, function (finalFilePath) {
        configFiles[finalFilePath] = json;
      });

      // Apply Cluster specific modifications

      const clusterPresence = whoIsCluster();

      if (clusterPresence === "Player" && fileOwner !== "enemy") {
        pathLength = isSubCommanderTechFile
          ? aiTechPath.length
          : oldSubCommanderPath.length;
        processClusterJson(json, pathLength);
      } else if (clusterPresence === "Enemy" && fileOwner !== "subcommander") {
        processClusterJson(json, oldEnemyPath.length);
      }
    });
  };

  const managerPath = function (type) {
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
        throw new Error("Invalid AI file type");
    }
  };

  const addApplicableAiLoadModsToFileList = function (
    aiPath,
    fileList,
    inventory,
    aisToModify
  ) {
    const enemyAIPath = gwoAI.getAIPathSource("enemy");
    const subcommanderAIPath = gwoAI.getAIPathSource("subcommander");
    const isSubCommanderDirectory =
      aiPath === subcommanderAIPath || enemyAIPath === subcommanderAIPath;

    if (isSubCommanderDirectory || aisToModify === "All") {
      const aiLoadMods = _.filter(inventory.aiMods(), { op: "load" });

      _.forEach(aiLoadMods, function (file) {
        fileList.push("/pa/ai_tech/" + managerPath(file.type) + file.value);
      });
    }
  };

  const processDirectories = function (aiPath, configFiles) {
    const deferred = $.Deferred();

    api.file.list(aiPath, true).then(function (fileList) {
      const aisToModify = whichAIsAreBeingModified();
      const inventory = model.game().inventory();

      addApplicableAiLoadModsToFileList(
        aiPath,
        fileList,
        inventory,
        aisToModify
      );

      var promises = _.map(fileList, function (filePath) {
        if (
          !_.endsWith(filePath, ".json") ||
          _.includes(filePath, "/neural_networks/") // AIs fall back to /pa/ai/neural_networks/
        ) {
          return;
        }

        return processFilesInDirectory(filePath, configFiles, aisToModify);
      });

      Promise.all(promises).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  // parse AI files, apply AI mods, and load the results into self.files()
  return function () {
    const deferred = $.Deferred();

    const self = this;
    const configFiles = self.files(); // JSON files passed to the server
    const enemyAIPath = gwoAI.getAIPathSource("enemy");
    const subcommanderAIPath = gwoAI.getAIPathSource("subcommander");
    const aisShareAPath = enemyAIPath === subcommanderAIPath;
    const aiPaths = aisShareAPath
      ? [enemyAIPath]
      : [enemyAIPath, subcommanderAIPath];

    var promises = _.map(aiPaths, function (aiPath) {
      return processDirectories(aiPath, configFiles);
    });

    Promise.all(promises).then(function () {
      deferred.resolve();
    });

    return deferred.promise();
  };
});
