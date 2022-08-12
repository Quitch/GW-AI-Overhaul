/* eslint-disable lodash/prefer-filter */
define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js"], function (
  gwoAI
) {
  var addTechToAI = function (json, mods) {
    var ops = {
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
                return null;
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

  var aiPathCreation = function (aiPath, filePath, cullLength) {
    return aiPath + filePath.slice(cullLength);
  };

  var aiToMod = function (inventory, mirrorMode, clusterPresence) {
    if (!_.isEmpty(inventory.aiMods()) || clusterPresence === "Player") {
      if (mirrorMode) {
        return "All";
      } else {
        return "SubCommanders";
      }
    }
    return "None";
  };

  var addAILoadFilesToFileList = function (
    aiMods,
    aiToModify,
    fileList,
    aiTechPath
  ) {
    if (aiToModify !== "None") {
      _.forEach(aiMods[0], function (aiMod) {
        var managerPath = "";
        if (aiMod.type === "fabber") {
          managerPath = "fabber_builds/";
        } else if (aiMod.type === "factory") {
          managerPath = "factory_builds/";
        } else if (aiMod.type === "platoon") {
          managerPath = "platoon_builds/";
        } else if (aiMod.type === "template") {
          managerPath = "platoon_templates/";
        } else {
          console.error("Invalid op in", aiMod);
        }
        fileList.push(aiTechPath + managerPath + aiMod.value);
      });
    }
  };

  var isClusterAIPresent = function (inventory, ai, subcommanders) {
    var aiIsCluster = ai.faction === 4;
    var playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    if (playerIsCluster && subcommanders > 0) {
      return "Player";
    } else if (aiIsCluster) {
      return "Enemy";
    } else if (ai.foes) {
      for (var foe of ai.foes) {
        var foeIsCluster = parseInt(foe.faction[0]) === 4; // was an array before v5.44.0
        if (foeIsCluster) {
          return "Enemy";
        }
      }
    }
    return "None";
  };

  // parse AI mods and load the results into self.files()
  return function () {
    var self = this;
    var game = self.game();
    var inventory = game.inventory();
    var currentStar = game.galaxy().stars()[game.currentStar()];
    var ai = currentStar.ai();
    var alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    var numberOfAllies = alliedCommanders.length;
    var aiFilePath =
      numberOfAllies > 0 ? gwoAI.getAIPath("all") : gwoAI.getAIPath("enemy");
    var clusterPresence = isClusterAIPresent(inventory, ai, numberOfAllies);
    var aiToModify = aiToMod(inventory, ai.mirrorMode, clusterPresence);

    var deferred = $.Deferred();

    api.file.list(aiFilePath, true).then(function (fileList) {
      var configFiles = self.files();
      var aiFiles = [];
      var aiMods = _.partition(inventory.aiMods(), { op: "load" });
      var aiTechPath = "/pa/ai_tech/";
      var subcommanderAIPath = gwoAI.getAIPath("subcommander");
      var enemyAIPath = gwoAI.getAIPath("enemy");
      var aiBrain = gwoAI.aiInUse();
      var isQueller = aiBrain === "Queller";

      addAILoadFilesToFileList(aiMods, aiToModify, fileList, aiTechPath);

      _.forEach(fileList, function (filePath) {
        if (
          !_.endsWith(filePath, ".json") ||
          _.includes(filePath, "/neural_networks/")
        ) {
          return;
        }

        var aiFile = $.Deferred();

        var aiBuildOps = [];
        var clusterOps = [];
        var clusterCommanders = [
          "SupportPlatform",
          "SupportCommander",
          "UberSupportCommander", // Queller AI
        ];
        var clusterAIMods = _.map(clusterCommanders, function (commander) {
          return {
            type: "factory",
            op: "replace",
            toBuild: commander,
            idToMod: "priority",
            value: 0,
          };
        });
        var clusterAIPath = gwoAI.getAIPath("cluster");
        var quellerSubCommander = false;
        if (
          isQueller &&
          numberOfAllies > 0 &&
          (_.startsWith(filePath, subcommanderAIPath) ||
            _.startsWith(filePath, aiTechPath))
        ) {
          quellerSubCommander = true;
        }

        // Only mods associated with the file's AI manager are loaded
        if (
          aiToModify !== "None" &&
          !_.isEmpty(aiMods[1]) &&
          (!isQueller || quellerSubCommander || aiToModify === "All")
        ) {
          if (_.includes(filePath, "/fabber_builds/")) {
            aiBuildOps = _.filter(aiMods[1], {
              type: "fabber",
            });
          } else if (_.includes(filePath, "/factory_builds/")) {
            aiBuildOps = _.filter(aiMods[1], { type: "factory" });
          } else if (_.includes(filePath, "/platoon_builds/")) {
            aiBuildOps = _.filter(aiMods[1], { type: "platoon" });
          } else if (_.includes(filePath, "/platoon_templates/")) {
            aiBuildOps = _.filter(aiMods[1], {
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

            if (aiToModify === "All") {
              addTechToAI(json, aiBuildOps);
              // Put "load" files where the AI expects them to be
              if (_.startsWith(filePath, aiTechPath)) {
                if (isQueller) {
                  // We don't know if the aiFilePath contains q_uber
                  var quellerEnemyPath = gwoAI.getAIPath("enemy");
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
                if (_.startsWith(filePath, aiTechPath)) {
                  updatedFilePath = aiPathCreation(
                    subcommanderAIPath,
                    filePath,
                    aiTechPath.length
                  );
                }
              } else {
                // Titans/Penchant Sub Commanders share an ai_path with the enemy so need a new one
                if (_.startsWith(filePath, aiFilePath)) {
                  updatedFilePath =
                    aiTechPath + filePath.slice(aiFilePath.length);
                }
              }
              configFiles[updatedFilePath] = json;
            } else {
              configFiles[filePath] = json;
            }

            if (clusterPresence !== "None") {
              var slice = aiFilePath;
              if (isQueller) {
                var quellerPaths = [
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
              var clusterJson = _.cloneDeep(json);
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
