var gwoRefereeChangesLoaded;

if (!gwoRefereeChangesLoaded) {
  gwoRefereeChangesLoaded = true;

  function gwoRefereeChanges() {
    try {
      requireGW(
        [
          "shared/gw_common",
          "pages/gw_play/gw_referee",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
        ],
        function (GW, GWReferee, gwoColour, gwoUnit) {
          var gwoReferee = function (game) {
            var self = this;

            self.game = ko.observable(game);

            self.files = ko.observable();
            self.localFiles = ko.observable();
            self.config = ko.observable();
          };

          gwoReferee.prototype.stripSystems = function () {
            var self = this;

            // remove the systems from the galaxy
            var gw = self.config().gw;
            GW.Game.saveSystems(gw);
          };

          gwoReferee.prototype.mountFiles = function () {
            var self = this;

            var deferred = $.Deferred();

            var allFiles = _.cloneDeep(self.files());
            // The player unit list needs to be the superset of units for proper UI behavior
            var unitList = "/pa/units/unit_list.json";
            var playerUnits = allFiles[unitList + ".player"];
            var aiUnits = allFiles[unitList + ".ai"];
            if (playerUnits) {
              var allUnits = _.cloneDeep(playerUnits);
              if (aiUnits && allUnits.units) {
                allUnits.units = allUnits.units.concat(aiUnits.units);
              }
              allFiles[unitList] = allUnits;
            }

            if (self.localFiles()) {
              _.assign(allFiles, self.localFiles());
            }

            var cookedFiles = _.mapValues(allFiles, function (value) {
              if (!_.isString(value)) {
                return JSON.stringify(value);
              } else {
                return value;
              }
            });

            // community mods will hook unmountAllMemoryFiles to remount client mods
            api.file.unmountAllMemoryFiles().always(function () {
              api.file.mountMemoryFiles(cookedFiles).then(function () {
                deferred.resolve();
              });
            });

            return deferred.promise();
          };

          gwoReferee.prototype.tagGame = function () {
            api.game.setUnitSpecTag(".player");
          };

          var aiInUse = function () {
            var galaxy = model.game().galaxy();
            var originSystem = galaxy.stars()[galaxy.origin()].system();
            if (originSystem.gwaio) {
              return originSystem.gwaio.ai;
            }
            return "Titans";
          };
          var aiBrain = aiInUse();

          var getAIPath = function (type) {
            var game = model.game();
            var ai = game.galaxy().stars()[game.currentStar()].ai();
            var inventory = game.inventory();
            var quellerPath = "/pa/ai_personalities/queller/";
            // the order of path assignments must match .player unit_map assignments in generateGameFiles()
            if (type === "cluster") {
              return "/pa/ai_cluster/";
            } else if (aiBrain === "Queller") {
              if (type === "all") {
                return quellerPath;
              } else if (type === "enemy") {
                return quellerPath + "q_uber/";
              } else if (
                type === "subcommander" &&
                _.some(inventory.cards(), {
                  id: "gwaio_upgrade_subcommander_tactics",
                })
              ) {
                return quellerPath + "q_gold/";
              }
              // type === "subcommander"
              return quellerPath + "q_silver/";
            } else if (
              type === "subcommander" &&
              !_.isEmpty(inventory.aiMods()) &&
              ai.mirrorMode !== true
            ) {
              return "/pa/ai_tech/";
            } else if (aiBrain === "Penchant") {
              return "/pa/ai_personalities/penchant/";
            }
            return "/pa/ai/";
          };

          var isClusterAIPresent = function (inventory, ai, subcommanders) {
            if (
              inventory.getTag("global", "playerFaction") === 4 &&
              subcommanders > 0
            ) {
              return "Player";
            } else if (ai.faction === 4) {
              return "Enemy";
            } else if (ai.foes) {
              for (var foe of ai.foes) {
                var foeIsCluster = foe.faction[0] === 4;
                if (foeIsCluster) {
                  return "Enemy";
                }
              }
            }
            return "None";
          };

          // allow for specs not assigned to units to still be processed
          var combineSpecs = function (baseSpecs, newSpecs) {
            return baseSpecs.concat(newSpecs);
          };

          var generateGameFiles = function () {
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

              var aiUnitMapPath = "/pa/ai/unit_maps/ai_unit_map.json";
              var aiUnitMapTitansPath = "/pa/ai/unit_maps/ai_unit_map_x1.json";

              if (aiBrain === "Queller") {
                aiUnitMapPath =
                  "/pa/ai_personalities/queller/q_uber/unit_maps/ai_unit_map.json";
                aiUnitMapTitansPath =
                  "/pa/ai_personalities/queller/q_uber/unit_maps/ai_unit_map_x1.json";
              } else if (aiBrain === "Penchant") {
                aiUnitMapPath =
                  "/pa/ai_personalities/penchant/unit_maps/ai_unit_map.json";
                aiUnitMapTitansPath =
                  "/pa/ai_personalities/penchant/unit_maps/ai_unit_map_x1.json";
              }

              var unitsLoad = $.get("spec://pa/units/unit_list.json");
              var aiMapLoad = $.get("spec:/" + aiUnitMapPath);
              var aiX1MapLoad = titans
                ? $.get("spec:/" + aiUnitMapTitansPath)
                : {};
              $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(function (
                unitsGet,
                aiMapGet,
                aiX1MapGet
              ) {
                /* start of gw_spec.js replacements */
                var flattenBaseSpecs = function (spec, specs, tag) {
                  if (
                    !Object.prototype.hasOwnProperty.call(spec, "base_spec")
                  ) {
                    return spec;
                  }

                  var base = specs[spec.base_spec];
                  if (!base) {
                    base = specs[spec.base_spec + tag];
                    if (!base) {
                      return spec;
                    }
                  }

                  spec = _.cloneDeep(spec);
                  delete spec.base_spec;

                  base = flattenBaseSpecs(base, specs, tag);

                  return _.merge({}, base, spec);
                };

                var modSpecs = function (specs, mods, specTag) {
                  var load = function (specId) {
                    var taggedId = specId;
                    if (
                      !Object.prototype.hasOwnProperty.call(specs, taggedId)
                    ) {
                      taggedId = specId + specTag;
                      if (
                        !Object.prototype.hasOwnProperty.call(specs, taggedId)
                      ) {
                        return null;
                      }
                    }
                    var result = specs[taggedId];
                    if (result) {
                      specs[taggedId] = result = flattenBaseSpecs(
                        result,
                        specs,
                        specTag
                      );
                    }
                    return result;
                  };
                  var ops = {
                    multiply: function (attribute, value) {
                      return !_.isUndefined(attribute)
                        ? attribute * value
                        : value;
                    },
                    add: function (attribute, value) {
                      return !_.isUndefined(attribute)
                        ? attribute + value
                        : value;
                    },
                    replace: function (attribute, value) {
                      return value;
                    },
                    merge: function (attribute, value) {
                      return _.assign({}, attribute, value);
                    },
                    push: function (attribute, value) {
                      if (!_.isArray(attribute)) {
                        attribute = _.isEmpty(attribute) ? [] : [attribute];
                      }
                      if (_.isArray(value)) {
                        attribute = attribute.concat(value);
                      } else {
                        attribute.push(value);
                      }
                      return attribute;
                    },
                    eval: function (attribute, value) {
                      return new Function("attribute", value)(attribute);
                    },
                    clone: function (attribute, value) {
                      var loaded = load(attribute);
                      if (loaded) {
                        loaded = _.cloneDeep(loaded);
                      }
                      specs[value + specTag] = loaded || attribute;
                    },
                    tag: function (attribute) {
                      // hack fix for mirrorMode due to the fact that
                      // `attribute` was retaining the previous `specTag`s
                      // and I couldn't track down why
                      var cleanAttribute = attribute.slice(
                        0,
                        attribute.lastIndexOf(".json") + 5
                      );
                      return cleanAttribute + specTag;
                    },
                    pull: function (attribute, value) {
                      if (!_.isArray(attribute)) {
                        attribute = _.isEmpty(attribute) ? [] : [attribute];
                      }
                      var args = [];
                      if (_.isArray(value)) {
                        args = [attribute].concat(value);
                      } else {
                        args = [attribute, value];
                      }
                      return _.pull.apply(this, args);
                    },
                    // New op to remove text in a string
                    wipe: function (attribute, value) {
                      if (!_.isString(attribute)) {
                        attribute = attribute.toString();
                      }
                      if (!_.isArray(value)) {
                        value = [value, ""];
                      }
                      return attribute.replace(value[0], value[1]);
                    },
                  };
                  var applyMod = function (mod) {
                    var spec = load(mod.file);
                    if (!spec) {
                      return console.warn(
                        "Warning: File not found in mod",
                        mod
                      );
                    }
                    if (!Object.prototype.hasOwnProperty.call(ops, mod.op)) {
                      return console.error("Invalid operation in mod", mod);
                    }

                    var originalPath = (mod.path || "").split(".");
                    var path = originalPath.reverse();

                    var reportError = function (error, step) {
                      console.error(
                        error,
                        spec[step],
                        "spec",
                        spec,
                        "mod",
                        mod,
                        "path",
                        originalPath.slice(0, -path.length).join(".")
                      );
                      return undefined;
                    };

                    var cookStep = function (step) {
                      if (_.isArray(spec)) {
                        if (step === "+") {
                          step = spec.length;
                          spec.push({});
                        } else {
                          step = Number(step);
                        }
                      } else if (
                        path.length &&
                        !Object.prototype.hasOwnProperty.call(spec, step)
                      ) {
                        spec[step] = {};
                      }
                      return step;
                    };

                    while (path.length > 1) {
                      var level = path.pop();
                      cookStep(level);

                      if (_.isString(spec[level])) {
                        var newSpec = load(spec[level]);
                        if (!newSpec) {
                          return reportError(
                            "Undefined mod spec encountered,",
                            level
                          );
                        }
                        spec = newSpec;
                      } else if (_.isObject(spec[level])) {
                        spec = spec[level];
                      } else {
                        return reportError(
                          "Invalid attribute encountered,",
                          level
                        );
                      }
                    }

                    if (path.length && path[0]) {
                      var leaf = cookStep(path[0]);
                      spec[leaf] = ops[mod.op](spec[leaf], mod.value);
                    } else {
                      ops[mod.op](spec, mod.value);
                    }
                  };
                  _.forEach(mods, applyMod);
                };
                /* end of gw_spec.js replacements */

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

                var clusterArmyIndex = function () {
                  if (ai.faction === 4) {
                    return 0;
                  } else if (ai.foes) {
                    var index = _.findIndex(ai.foes, { faction: [4] });
                    if (index !== -1) {
                      return index + 1;
                    }
                  }
                  return -1;
                };

                var inventory = self.game().inventory();

                var units = parse(unitsGet[0]).units;
                var aiUnitMap = parse(aiMapGet[0]);
                var aiX1UnitMap = parse(aiX1MapGet[0]);
                var clusterUnitMapPath =
                  "/pa/ai_cluster/unit_maps/ai_unit_map.json";
                var clusterUnitMapTitansPath =
                  "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
                _.times(aiFactionCount, function (n) {
                  var currentCount = n;
                  var enemyAIUnitMap = GW.specs.genAIUnitMap(
                    aiUnitMap,
                    aiTag[n]
                  );
                  var enemyX1AIUnitMap = GW.specs.genAIUnitMap(
                    aiX1UnitMap,
                    aiTag[n]
                  );
                  var aiSpecs = combineSpecs(units, model.gwoSpecs);

                  GW.specs
                    .genUnitSpecs(aiSpecs, aiTag[n])
                    .then(function (aiSpecFiles) {
                      var unitMapPath = aiUnitMapPath;
                      var unitMapTitansPath = aiUnitMapTitansPath;
                      if (clusterArmyIndex() === currentCount) {
                        unitMapPath = clusterUnitMapPath;
                        unitMapTitansPath = clusterUnitMapTitansPath;
                      }

                      var enemyAIUnitMapFile = unitMapPath + aiTag[n];
                      var enemyAIUnitMapPair = {};
                      enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
                      var enemyX1AIUnitMapFile = unitMapTitansPath + aiTag[n];
                      var enemyX1AIUnitMapPair = {};
                      enemyX1AIUnitMapPair[enemyX1AIUnitMapFile] =
                        enemyX1AIUnitMap;
                      var aiFilesClassic = _.assign(
                        enemyAIUnitMapPair,
                        aiSpecFiles
                      );
                      var aiFilesX1 = titans
                        ? _.assign(enemyX1AIUnitMapPair, aiSpecFiles)
                        : {};
                      var aiFiles = _.assign({}, aiFilesClassic, aiFilesX1);

                      if (ai.inventory) {
                        var aiInventory = [];
                        aiInventory =
                          currentCount === 0
                            ? ai.inventory
                            : ai.foes[currentCount - 1].inventory;
                        if (ai.mirrorMode === true) {
                          aiInventory = aiInventory.concat(inventory.mods());
                        }
                        modSpecs(aiFiles, aiInventory, aiTag[n]);
                      }
                      aiFactions[currentCount].resolve(aiFiles);
                    });
                });

                var playerTag = ".player";

                var playerAIUnitMap = GW.specs.genAIUnitMap(
                  aiUnitMap,
                  playerTag
                );
                var playerX1AIUnitMap = titans
                  ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag)
                  : {};
                var additionalPlayerSpecs = _.isUndefined(ai.ally)
                  ? model.gwoSpecs
                  : model.gwoSpecs.concat(ai.ally.commander);
                var playerSpecs = combineSpecs(
                  inventory.units(),
                  additionalPlayerSpecs
                );

                GW.specs
                  .genUnitSpecs(playerSpecs, playerTag)
                  .then(function (playerSpecFiles) {
                    var playerFilesClassic = {};
                    var playerFilesX1 = {};
                    var playerIsCluster =
                      inventory.getTag("global", "playerFaction") === 4;
                    // the order of unit_map assignments must match getAIPath()
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
                      aiBrain === "Queller" &&
                      _.some(inventory.cards(), {
                        id: "gwaio_upgrade_subcommander_tactics",
                      })
                    ) {
                      playerFilesClassic = _.assign(
                        {
                          "/pa/ai_personalities/queller/q_gold/unit_maps/ai_unit_map.json.player":
                            playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai_personalities/queller/q_gold/unit_maps/ai_unit_map_x1.json.player":
                                playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
                    } else if (aiBrain === "Queller") {
                      playerFilesClassic = _.assign(
                        {
                          "/pa/ai_personalities/queller/q_silver/unit_maps/ai_unit_map.json.player":
                            playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai_personalities/queller/q_silver/unit_maps/ai_unit_map_x1.json.player":
                                playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
                    } else if (
                      !_.isEmpty(inventory.aiMods()) &&
                      ai.mirrorMode !== true
                    ) {
                      playerFilesClassic = _.assign(
                        {
                          "/pa/ai_tech/unit_maps/ai_unit_map.json.player":
                            playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai_tech/unit_maps/ai_unit_map_x1.json.player":
                                playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
                    } else if (aiBrain === "Penchant") {
                      playerFilesClassic = _.assign(
                        {
                          "/pa/ai_personalities/penchant/unit_maps/ai_unit_map.json.player":
                            playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai_personalities/penchant/unit_maps/ai_unit_map_x1.json.player":
                                playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
                    } else {
                      playerFilesClassic = _.assign(
                        {
                          "/pa/ai/unit_maps/ai_unit_map.json.player":
                            playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai/unit_maps/ai_unit_map_x1.json.player":
                                playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
                    }
                    var playerFiles = _.assign(
                      {},
                      playerFilesClassic,
                      playerFilesX1
                    );
                    modSpecs(playerFiles, inventory.mods(), playerTag);
                    playerFileGen.resolve(playerFiles);
                  });
              });

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

          var addTechToAI = function (json, mods) {
            var ops = {
              // fabber/factory/platoon only
              append: function (value, toBuild, idToMod, refId, refValue) {
                // eslint-disable-next-line lodash/prefer-filter
                _.forEach(json.build_list, function (build) {
                  if (build.to_build === toBuild) {
                    if (
                      (_.isUndefined(refId) ||
                        _.isEqual(build[refId], refValue)) &&
                      build[idToMod] &&
                      _.isArray(build[idToMod])
                    ) {
                      build[idToMod] = build[idToMod].concat(value);
                    } else if (
                      (_.isUndefined(refId) ||
                        _.isEqual(build[refId], refValue)) &&
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
                // eslint-disable-next-line lodash/prefer-filter
                _.forEach(json.build_list, function (build) {
                  if (build.to_build === toBuild) {
                    if (
                      (_.isUndefined(refId) ||
                        _.isEqual(build[refId], refValue)) &&
                      build[idToMod] &&
                      _.isArray(build[idToMod])
                    ) {
                      build[idToMod] = value.concat(build[idToMod]);
                    } else if (
                      (_.isUndefined(refId) ||
                        _.isEqual(build[refId], refValue)) &&
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
                // eslint-disable-next-line lodash/prefer-filter
                _.forEach(json.build_list, function (build) {
                  if (build.to_build === toBuild) {
                    if (
                      (_.isUndefined(refId) ||
                        _.isEqual(build[refId], refValue)) &&
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
                // eslint-disable-next-line lodash/prefer-filter
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
                // eslint-disable-next-line lodash/prefer-filter
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
              ops[mod.op](
                mod.value,
                mod.toBuild,
                mod.idToMod,
                mod.refId,
                mod.refValue
              );
            });
          };

          var aiPathCreation = function (aiPath, filePath, cullLength) {
            return aiPath + filePath.slice(cullLength);
          };

          var aiToMod = function (inventory, mirrorMode, clusterPresence) {
            if (
              !_.isEmpty(inventory.aiMods()) ||
              clusterPresence === "Player"
            ) {
              if (mirrorMode) {
                return "All";
              } else {
                return "SubCommanders";
              }
            }
            return "None";
          };

          // parse AI mods and load the results into self.files()
          var generateAI = function () {
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
              numberOfAllies > 0 ? getAIPath("all") : getAIPath("enemy");
            var clusterPresence = isClusterAIPresent(
              inventory,
              ai,
              numberOfAllies
            );
            var aiToModify = aiToMod(inventory, ai.mirrorMode, clusterPresence);

            var deferred = $.Deferred();

            api.file.list(aiFilePath, true).then(function (fileList) {
              var configFiles = self.files();
              var aiFiles = [];

              var aiMods = inventory.aiMods();
              var aiTechPath = "/pa/ai_tech/";

              if (aiToModify !== "None") {
                aiMods = _.partition(aiMods, { op: "load" });

                // process ai load ops
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

              var subcommanderAIPath = getAIPath("subcommander");
              var enemyAIPath = getAIPath("enemy");
              var isQueller = aiBrain === "Queller";

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
                var clusterAIMods = _.map(
                  clusterCommanders,
                  function (commander) {
                    return {
                      type: "factory",
                      op: "replace",
                      toBuild: commander,
                      idToMod: "priority",
                      value: 0,
                    };
                  }
                );
                var clusterAIPath = getAIPath("cluster");
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
                          var quellerEnemyPath = getAIPath("enemy");
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

          var armyCommander = function (ai, name, commander) {
            var aiLandingOptions = [
              "off_player_planet",
              "on_player_planet",
              "no_restriction",
            ];
            return {
              ai: ai,
              name: name,
              commander: commander,
              landing_policy: _.sample(aiLandingOptions),
            };
          };

          var setAIPath = function (isCluster, isPlayer) {
            if (isCluster) {
              return getAIPath("cluster");
            } else if (isPlayer) {
              return getAIPath("subcommander");
            }
            return getAIPath("enemy");
          };

          var applySubcommanderTacticsTech = function (personality, cards) {
            if (_.some(cards, { id: "gwaio_upgrade_subcommander_tactics" })) {
              personality.micro_type = 2;
              personality.go_for_the_kill = true;
              personality.priority_scout_metal_spots = true;
              personality.enable_commander_danger_responses = true;
              _.pull(personality.personality_tags, "SlowerExpansion");
              personality.personality_tags.push("PreventsWaste");
            }
            return personality;
          };

          var applySubcommanderFabberTech = function (personality, cards) {
            if (_.some(cards, { id: "gwaio_upgrade_subcommander_fabber" })) {
              personality.max_basic_fabbers = Math.round(
                personality.max_basic_fabbers * 1.5
              );
              personality.max_advanced_fabbers = Math.round(
                personality.max_advanced_fabbers * 1.5
              );
            }
            return personality;
          };

          var hasSubcommanderDuplicationTech = function (cards) {
            return _.some(cards, {
              id: "gwaio_upgrade_subcommander_duplication",
            });
          };

          var setAdvEcoMod = function (aiRoot, brain) {
            if (brain !== "Queller") {
              aiRoot.personality.adv_eco_mod *= aiRoot.econ_rate;
              aiRoot.personality.adv_eco_mod_alone *= aiRoot.econ_rate;
            }
            return aiRoot;
          };

          var generateConfig = function () {
            var self = this;

            // Set up the player
            var game = self.game();
            var inventory = game.inventory();
            var playerName = ko.observable().extend({ session: "displayName" });
            var playerTag = ".player";
            var armies = [
              {
                slots: [{ name: playerName() || "Player" }],
                color: inventory.getTag("global", "playerColor"),
                econ_rate: 1,
                spec_tag: playerTag,
                alliance_group: 1,
              },
            ];

            var currentStar = game.galaxy().stars()[game.currentStar()];
            var ai = currentStar.ai();
            var alliedCommanders = _.isUndefined(ai.ally)
              ? inventory.minions()
              : inventory.minions().concat(ai.ally);
            var playerFaction = inventory.getTag("global", "playerFaction");

            _.forEach(alliedCommanders, function (subcommander, index) {
              // Avoid breaking Sub Commanders from earlier versions
              var isCluster = playerFaction === 4;
              subcommander.personality.ai_path = setAIPath(isCluster, true);

              var cards = inventory.cards();
              var subcommanderCommanders = 1;

              subcommander.personality = applySubcommanderTacticsTech(
                subcommander.personality,
                cards
              );
              subcommander.personality = applySubcommanderFabberTech(
                subcommander.personality,
                cards
              );
              if (hasSubcommanderDuplicationTech(cards)) {
                subcommanderCommanders = 2;
              }

              var slotsArraySubCommander = [];

              _.times(subcommanderCommanders, function () {
                slotsArraySubCommander.push(
                  armyCommander(true, subcommander.name, subcommander.commander)
                );
              });
              armies.push({
                slots: slotsArraySubCommander,
                color: gwoColour.pick(
                  playerFaction,
                  subcommander.color,
                  index + 1 // player has colour 0
                ),
                econ_rate: 1,
                personality: subcommander.personality,
                spec_tag: playerTag,
                alliance_group: 1,
              });
            });

            // Set up the AI
            var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
            var aiTag = [];
            _.times(aiFactionCount, function (n) {
              var aiNewTag = ".ai";
              n = n.toString();
              aiNewTag = aiNewTag + n;
              aiTag.push(aiNewTag);
            });

            // Set up AI System Owner
            ai = setAdvEcoMod(ai, aiBrain);

            // Avoid breaking enemies from earlier versions
            var aiIsCluster = ai.faction === 4 && ai.mirrorMode !== true;
            var aiPath = setAIPath(aiIsCluster, false);
            ai.personality.ai_path = aiPath;

            var slotsArrayAI = [];
            _.times(
              ai.bossCommanders ||
                ai.commanderCount ||
                // legacy GWO support
                (ai.landing_policy && ai.landing_policy.length) ||
                1,
              function () {
                slotsArrayAI.push(armyCommander(true, ai.name, ai.commander));
              }
            );
            armies.push({
              slots: slotsArrayAI,
              color: gwoColour.pick(ai.faction, ai.color, 0),
              econ_rate: ai.econ_rate,
              personality: ai.personality,
              spec_tag: aiTag[0],
              alliance_group: 2,
            });
            _.forEach(ai.minions, function (minion, index) {
              minion = setAdvEcoMod(minion, aiBrain);

              // Avoid breaking enemies from earlier versions
              minion.personality.ai_path = aiPath;

              var slotsArrayMinions = [];
              _.times(
                minion.commanderCount ||
                  // legacy GWO support
                  (minion.landing_policy && minion.landing_policy.length) ||
                  1,
                function () {
                  slotsArrayMinions.push(
                    armyCommander(true, minion.name, minion.commander)
                  );
                }
              );
              armies.push({
                slots: slotsArrayMinions,
                color: gwoColour.pick(ai.faction, minion.color, index + 1), // primary AI has colour 0
                econ_rate: minion.econ_rate,
                personality: minion.personality,
                spec_tag: aiTag[0],
                alliance_group: 2,
              });
            });

            // Set up Additional AI Factions
            _.forEach(ai.foes, function (foe, index) {
              foe = setAdvEcoMod(foe, aiBrain);

              // Avoid breaking enemies from earlier versions
              var foeIsCluster = foe.faction[0] === 4;
              foe.personality.ai_path = setAIPath(foeIsCluster, false);

              var slotsArrayFoes = [];
              _.times(
                foe.commanderCount ||
                  // legacy GWO support
                  (foe.landing_policy && foe.landing_policy.length) ||
                  1,
                function () {
                  slotsArrayFoes.push(
                    armyCommander(true, foe.name, foe.commander)
                  );
                }
              );
              armies.push({
                slots: slotsArrayFoes,
                color: gwoColour.pick(foe.faction, foe.color, 0),
                econ_rate: foe.econ_rate,
                personality: foe.personality,
                spec_tag: aiTag[index + 1], // 0 taken by primary AI
                alliance_group: index + 3, //  1 & 2 taken by player and primary AI
              });
            });

            var config = {
              files: self.files(),
              armies: armies,
              player: {
                commander: inventory.getTag("global", "commander"),
              },
              system: currentStar.system(),
              land_anywhere: ai.landAnywhere,
              bounty_mode: ai.bountyMode,
              bounty_value: ai.bountyModeValue,
              sudden_death_mode: ai.suddenDeath,
            };
            _.forEach(config.armies, function (army) {
              // eslint-disable-next-line lodash/prefer-filter
              _.forEach(army.slots, function (slot) {
                if (slot.ai) {
                  if (army.alliance_group === 1) {
                    slot.commander += playerTag;
                  } else {
                    slot.commander += aiTag[army.alliance_group - 2];
                  }
                }
              });
            });
            config.player.commander += playerTag;
            // Store the game in the config for diagnostic purposes.
            config.gw = game.save();
            self.config(config);
          };

          GWReferee.hire = function (game) {
            // call our own gw_referee implementation
            var ref = new gwoReferee(game);
            return _.bind(generateGameFiles, ref)()
              .then(_.bind(generateAI, ref))
              .then(_.bind(generateConfig, ref))
              .then(function () {
                return ref;
              });
          };
        }
      );
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwoRefereeChanges();
}
