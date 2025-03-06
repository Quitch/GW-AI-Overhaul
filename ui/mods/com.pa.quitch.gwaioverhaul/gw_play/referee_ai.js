/* eslint-disable lodash/prefer-filter */
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"], function (
  gwoAI
) {
  const addTechToAI = function (json, mods) {
    const ops = {
      // fabber/factory/platoon only
      append: function (value, toBuild, idToMod, refId, refValue) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build === toBuild) {
            if (
              (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
              build[idToMod] &&
              _.isArray(build[idToMod])
            ) {
              build[idToMod] = build[idToMod].concat(value);
            } else if (
              (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
              build[idToMod]
            ) {
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
          }
        });
      },
      // fabber/factory/platoon only
      prepend: function (value, toBuild, idToMod, refId, refValue) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build === toBuild) {
            if (
              (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
              build[idToMod] &&
              _.isArray(build[idToMod])
            ) {
              build[idToMod] = value.concat(build[idToMod]);
            } else if (
              (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
              build[idToMod]
            ) {
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
          }
        });
      },
      // fabber/factory/platoon only
      replace: function (value, toBuild, idToMod, refId, refValue) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build === toBuild) {
            if (
              (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
              build[idToMod]
            ) {
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
          }
        });
      },
      // fabber/factory/platoon only
      remove: function (value, toBuild) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build === toBuild) {
            _.forEach(build.build_conditions, function (testArray) {
              _.remove(testArray, function (object) {
                if (_.isEqual(object, value)) {
                  return object;
                }
              });
            });
          }
        });
      },
      // fabber/factory/platoon only
      new: function (value, toBuild, idToMod) {
        _.forEach(json.build_list, function (build) {
          if (build.to_build === toBuild) {
            if (_.isUndefined(idToMod)) {
              build.build_conditions.push(value);
            } else {
              _.forEach(build.build_conditions, function (testArray) {
                testArray.push(value);
              });
            }
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

  const aiPathCreation = function (aiPath, filePath, cullLength) {
    return aiPath + filePath.slice(cullLength);
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
        throw new Error("Invalid AI file type: " + type);
    }
  };

  const addAILoadFilesToFileList = function (
    aiFiles,
    modType,
    fileList,
    aiPath
  ) {
    if (modType === "None") {
      return;
    }

    _.forEach(aiFiles, function (aiFile) {
      fileList.push(aiPath + managerPath(aiFile.type) + aiFile.value);
    });
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

  // parse AI mods and load the results into self.files()
  return function () {
    const self = this;
    const game = self.game();
    const inventory = game.inventory();
    const currentStar = game.galaxy().stars()[game.currentStar()];
    const ai = currentStar.ai();
    const alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    const numberOfAllies = alliedCommanders.length;
    const aiFilePath =
      numberOfAllies > 0 ? gwoAI.getAIPath("all") : gwoAI.getAIPath("enemy");

    const deferred = $.Deferred();

    api.file.list(aiFilePath, true).then(function (fileList) {
      const configFiles = self.files();
      const aiFiles = [];
      const aiMods = _.partition(inventory.aiMods(), { op: "load" });
      const aiNewFiles = aiMods[0];
      const aiJsonMods = aiMods[1];
      const guardians = ai.mirrorMode;
      const clusterPresence = whoIsCluster(inventory, ai, numberOfAllies);
      const aiToModify = aiToMod(inventory, guardians, clusterPresence);
      const aiTechPath = "/pa/ai_tech/";

      addAILoadFilesToFileList(aiNewFiles, aiToModify, fileList, aiTechPath);

      const isQueller = gwoAI.aiInUse() === "Queller";
      const subcommanderAIPath = gwoAI.getAIPath("subcommander");
      const enemyAIPath = gwoAI.getAIPath("enemy");
      const clusterAIPath = gwoAI.getAIPath("cluster");
      const clusterCommanders = ["SupportPlatform", "SupportCommander"];
      const clusterAIMods = _.map(clusterCommanders, function (commander) {
        return {
          type: "factory",
          op: "replace",
          toBuild: commander,
          idToMod: "priority",
          value: 0,
        };
      });

      _.forEach(fileList, function (filePath) {
        if (
          !_.endsWith(filePath, ".json") ||
          _.includes(filePath, "/neural_networks/")
        ) {
          return;
        }

        const aiFile = $.Deferred();

        var aiBuildOps = [];
        var clusterOps = [];
        const quellerSubCommander =
          isQueller &&
          numberOfAllies > 0 &&
          (_.startsWith(filePath, subcommanderAIPath) ||
            _.startsWith(filePath, aiTechPath));

        // Only mods associated with the file's AI manager are loaded
        if (
          aiToModify !== "None" &&
          !_.isEmpty(aiJsonMods) &&
          (!isQueller || quellerSubCommander || aiToModify === "All")
        ) {
          if (_.includes(filePath, "/fabber_builds/")) {
            aiBuildOps = _.filter(aiJsonMods, {
              type: "fabber",
            });
          } else if (_.includes(filePath, "/factory_builds/")) {
            aiBuildOps = _.filter(aiJsonMods, { type: "factory" });
          } else if (_.includes(filePath, "/platoon_builds/")) {
            aiBuildOps = _.filter(aiJsonMods, { type: "platoon" });
          } else if (_.includes(filePath, "/platoon_templates/")) {
            aiBuildOps = _.filter(aiJsonMods, {
              type: "template",
            });
          }
        }
        if (
          _.includes(filePath, "/factory_builds/") &&
          clusterPresence !== "None"
        ) {
          clusterOps = clusterAIMods;
        }

        aiFiles.push(aiFile);

        $.getJSON("coui:/" + filePath)
          .then(function (json) {
            var updatedFilePath = filePath;
            const aiTechFile = _.startsWith(filePath, aiTechPath);

            if (aiToModify === "All") {
              addTechToAI(json, aiBuildOps);
              // Put "load" files where the AI expects them to be
              if (aiTechFile) {
                if (isQueller) {
                  // We don't know if the aiFilePath contains q_uber
                  const quellerEnemyPath = gwoAI.getAIPath("enemy");
                  updatedFilePath = aiPathCreation(
                    quellerEnemyPath,
                    filePath,
                    aiTechPath.length
                  );
                  configFiles[updatedFilePath] = json;
                  if (quellerSubCommander) {
                    updatedFilePath = aiPathCreation(
                      subcommanderAIPath,
                      filePath,
                      quellerEnemyPath.length
                    );
                    configFiles[updatedFilePath] = json;
                  }
                } else {
                  updatedFilePath = aiPathCreation(
                    aiFilePath,
                    filePath,
                    aiTechPath.length
                  );
                  configFiles[updatedFilePath] = json;
                }
              } else {
                configFiles[filePath] = json;
              }
            } else if (aiToModify === "SubCommanders") {
              // Make a clean copy of the files for enemy AIs
              if (_.startsWith(filePath, enemyAIPath)) {
                configFiles[filePath] = _.cloneDeep(json);
              }
              addTechToAI(json, aiBuildOps);
              if (quellerSubCommander) {
                // Put "load" files where Queller expects them to be
                if (aiTechFile) {
                  updatedFilePath = aiPathCreation(
                    subcommanderAIPath,
                    filePath,
                    aiTechPath.length
                  );
                }
              } else if (aiTechFile) {
                // Titans/Penchant Sub Commanders share an ai_path with the enemy so need a new one
                updatedFilePath =
                  aiTechPath + filePath.slice(aiFilePath.length);
              }

              configFiles[updatedFilePath] = json;
            } else {
              configFiles[filePath] = json;
            }

            if (clusterPresence !== "None") {
              var slice = aiFilePath;
              if (isQueller) {
                const quellerPaths = [
                  enemyAIPath,
                  subcommanderAIPath,
                  aiTechPath,
                ];
                slice = _.filter(quellerPaths, function (path) {
                  return _.startsWith(filePath, path);
                }).toString();
              }
              updatedFilePath = aiPathCreation(
                clusterAIPath,
                filePath,
                slice.length
              );
              const clusterJson = _.cloneDeep(json);
              addTechToAI(clusterJson, clusterOps);
              configFiles[updatedFilePath] = clusterJson;
            }
          })
          .always(function () {
            aiFile.resolve();
          });
      });

      $.when.apply($, aiFiles).then(function () {
        self.files.valueHasMutated();
        deferred.resolve();
      });
    });

    return deferred.promise();
  };
});
