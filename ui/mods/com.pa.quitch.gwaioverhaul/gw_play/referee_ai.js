/* eslint-disable lodash/prefer-filter */
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

  const aiPathCreation = function (aiPath, filePath, pathLength) {
    return aiPath + filePath.slice(pathLength);
  };

  const aiToMod = function (inventory, guardians, clusterPresence) {
    if (!_.isEmpty(inventory.aiMods()) || clusterPresence === "Player") {
      if (guardians) {
        return "All";
      } else {
        return "SubCommanders";
      }
    }
    return "None";
  };

  const whichAIsAreBeingModified = function () {
    const game = model.game();
    const inventory = game.inventory();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    const numberOfAllies = alliedCommanders.length;
    const guardians = ai.mirrorMode;
    const clusterPresence = whoIsCluster(inventory, ai, numberOfAllies);

    return aiToMod(inventory, guardians, clusterPresence);
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

  const addAILoadOpsFilesToFileList = function (aiFiles, modType) {
    const fileList = [];

    if (modType !== "None") {
      _.forEach(aiFiles, function (aiFile) {
        fileList.push("/pa/ai_tech/" + managerPath(aiFile.type) + aiFile.value);
      });
    }

    return fileList;
  };

  const whoIsCluster = function (inventory, ai, subcommanders) {
    const isPlayerCluster = inventory.getTag("global", "playerFaction") === 4;
    const isEnemyCluster =
      gwoAI.isCluster(ai) ||
      _.some(ai.foes, function (foe) {
        return gwoAI.isCluster(foe);
      });
    if (isPlayerCluster && subcommanders > 0) {
      return "Player";
    }
    if (isEnemyCluster) {
      return "Enemy";
    }
    return "None";
  };

  const whichAIsAreCluster = function () {
    const game = model.game();
    const inventory = game.inventory();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    const numberOfAllies = alliedCommanders.length;
    return whoIsCluster(inventory, ai, numberOfAllies);
  };

  const processFilesInDirectory = function (
    filePath,
    configFiles,
    aisToModify,
    clusterPresence
  ) {
    const filePathStarts = function (filePathFragment) {
      return _.startsWith(filePath, filePathFragment);
    };

    const filePathIncludes = function (filePathFragment) {
      return _.includes(filePath, filePathFragment);
    };

    const copyJsonToClusterAiPath = function (pathLength, clusterJson) {
      const updatedFilePath = aiPathCreation(
        gwoAI.getAIPath("cluster"),
        filePath,
        pathLength
      );
      configFiles[updatedFilePath] = clusterJson;
    };

    const aiModsInScopeOfFile = function () {
      const aiMods = _.partition(model.game().inventory().aiMods(), {
        op: "load",
      });
      const aiJsonMods = aiMods[1]; // all AI ops except load

      if (aisToModify === "None" || _.isEmpty(aiJsonMods)) {
        return;
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

      return _.filter(aiJsonMods, { type: aiManager });
    };

    const clusterAIModsInScopeOfFile = function () {
      if (!_.includes(filePath, "/factory_builds/")) {
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

    const processClusterJson = function (json, pathLength) {
      const clusterOps = clusterAIModsInScopeOfFile() || [];
      const clusterJson = _.cloneDeep(json);
      applyAiMods(clusterJson, clusterOps);
      copyJsonToClusterAiPath(pathLength, clusterJson);
    };

    // Identify the file type and which ops are applicable
    var aiJsonModsInScope = aiModsInScopeOfFile() || [];

    return $.getJSON("coui:/" + filePath).then(function (json) {
      var updatedFilePath = filePath;

      const game = model.game();
      const inventory = game.inventory();
      const currentStar = game.galaxy().stars()[game.currentStar()];
      const ai = currentStar.ai();
      const alliedCommanders = _.isUndefined(ai.ally)
        ? inventory.minions()
        : inventory.minions().concat(ai.ally);
      const numberOfAllies = alliedCommanders.length;
      const enemyAIPath = gwoAI.getAIPath("enemy");
      const subcommanderAIPath = gwoAI.getAIPath("subcommander");
      const enemyAndSubCommanderAIAreTheSame =
        gwoAI.aiInUse("enemy") === gwoAI.aiInUse("subcommander");
      const quellerSubCommander =
        gwoAI.aiInUse("subcommander") === "Queller" && numberOfAllies > 0;
      const aiTechPath = "/pa/ai_tech/";
      const isAiTechFile = filePathStarts(aiTechPath);

      switch (aisToModify) {
        case "All":
          applyAiMods(json, aiJsonModsInScope);
          if (isAiTechFile) {
            updatedFilePath = aiPathCreation(
              enemyAIPath,
              filePath,
              aiTechPath.length
            );
            configFiles[updatedFilePath] = json;
            updatedFilePath = aiPathCreation(
              subcommanderAIPath,
              filePath,
              aiTechPath.length
            );
            configFiles[updatedFilePath] = json;
          } else {
            configFiles[filePath] = json;
          }
          break;
        case "SubCommanders":
          if (enemyAndSubCommanderAIAreTheSame && filePathStarts(enemyAIPath)) {
            // Make a clean copy of the files for enemy AIs before modification of the JSON
            configFiles[filePath] = _.cloneDeep(json);
          }
          applyAiMods(json, aiJsonModsInScope);
          if (quellerSubCommander && isAiTechFile) {
            updatedFilePath = aiPathCreation(
              subcommanderAIPath,
              filePath,
              aiTechPath.length
            );
          } else if (enemyAndSubCommanderAIAreTheSame) {
            if (isAiTechFile) {
              updatedFilePath = aiPathCreation(
                subcommanderAIPath,
                filePath,
                aiTechPath.length
              );
            } else if (!filePathStarts(subcommanderAIPath)) {
              updatedFilePath = aiPathCreation(
                subcommanderAIPath,
                filePath,
                enemyAIPath.length
              );
            }
          }
          configFiles[updatedFilePath] = json;
          break;
        default: // "None"
          configFiles[filePath] = json;
      }

      if (clusterPresence === "Player") {
        processClusterJson(json, subcommanderAIPath.length);
      } else if (clusterPresence === "Enemy" && !isAiTechFile) {
        processClusterJson(json, enemyAIPath.length);
      }
    });
  };

  const processDirectories = function (
    aiPath,
    configFiles,
    aisToModify,
    clusterPresence,
    enemyAndSubCommanderAIAreTheSame,
    inventory
  ) {
    const deferred = $.Deferred();

    api.file.list(aiPath, true).then(function (fileList) {
      const isSubCommanderDirectory =
        enemyAndSubCommanderAIAreTheSame ||
        aiPath === gwoAI.getAIPath("subcommander");

      if (isSubCommanderDirectory && aisToModify !== "None") {
        const aiMods = _.partition(inventory.aiMods(), { op: "load" });
        const aiNewFiles = aiMods[0]; // AI load ops only
        fileList = fileList.concat(
          addAILoadOpsFilesToFileList(aiNewFiles, aisToModify)
        );
      }

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
          clusterPresence
        );
      });

      Promise.all(promises).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  // parse AI mods and load the results into self.files()
  return function () {
    const deferred = $.Deferred();

    const self = this;
    const configFiles = self.files();
    const inventory = self.game().inventory();
    const enemyAIPath = gwoAI.getAIPath("enemy");
    const subcommanderAIPath = gwoAI.getAIPath("subcommander");
    const enemyAndSubCommanderAIAreTheSame =
      gwoAI.aiInUse("enemy") === gwoAI.aiInUse("subcommander");
    const aiPaths = enemyAndSubCommanderAIAreTheSame
      ? [enemyAIPath]
      : [enemyAIPath, subcommanderAIPath];
    const aisToModify = whichAIsAreBeingModified();
    const clusterPresence = whichAIsAreCluster();

    var promises = _.map(aiPaths, function (aiPath) {
      return processDirectories(
        aiPath,
        configFiles,
        aisToModify,
        clusterPresence,
        enemyAndSubCommanderAIAreTheSame,
        inventory
      );
    });

    Promise.all(promises).then(function () {
      deferred.resolve();
    });

    return deferred.promise();
  };
});
