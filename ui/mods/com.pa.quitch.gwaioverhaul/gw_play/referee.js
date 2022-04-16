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

          var findAIPath = function (type) {
            var game = model.game();
            var ai = game.galaxy().stars()[game.currentStar()].ai();
            var inventory = game.inventory();
            var quellerPath = "/pa/ai_personalities/queller/";
            // the order of path assignments must match .player unit_map assignments in generateGameFiles()
            if (aiBrain === "Queller") {
              if (type === "all") {
                return quellerPath;
              } else if (type === "enemy") {
                return quellerPath + "q_uber/";
              } else if (type === "subcommander") {
                return quellerPath + "q_gold/";
              }
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

              var aiUnitMapPath = "";
              var aiUnitMapTitansPath = "";

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
              } else {
                aiUnitMapPath = "/pa/ai/unit_maps/ai_unit_map.json";
                aiUnitMapTitansPath = "/pa/ai/unit_maps/ai_unit_map_x1.json";
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
                      return attribute !== undefined
                        ? attribute * value
                        : value;
                    },
                    add: function (attribute, value) {
                      return attribute !== undefined
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
                      return attribute + specTag;
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

                // allow for specs not assigned to units to still be processed
                var combineSpecs = function (baseSpecs, newSpecs) {
                  return baseSpecs.concat(newSpecs);
                };

                // global for modder compatibility
                if (!model.gwoSpecs) {
                  model.gwoSpecs = [];
                }
                // files not assigned by default that we wish to mod
                model.gwoSpecs.push(
                  gwoUnit.fireflyAmmo,
                  gwoUnit.orcaTorpedo,
                  gwoUnit.orcaTorpedoAmmo,
                  gwoUnit.skitterAmmo
                );

                var inventory = self.game().inventory();

                var units = parse(unitsGet[0]).units;
                var aiUnitMap = parse(aiMapGet[0]);
                var aiX1UnitMap = parse(aiX1MapGet[0]);
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
                      var enemyAIUnitMapFile = aiUnitMapPath + aiTag[n];
                      var enemyAIUnitMapPair = {};
                      enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
                      var enemyX1AIUnitMapFile = aiUnitMapTitansPath + aiTag[n];
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
                var playerSpecs = combineSpecs(
                  inventory.units(),
                  model.gwoSpecs
                );

                GW.specs
                  .genUnitSpecs(playerSpecs, playerTag)
                  .then(function (playerSpecFiles) {
                    var playerFilesClassic = {};
                    var playerFilesX1 = {};
                    // the order of unit_map assignments must match findAIPath()
                    if (aiBrain === "Queller") {
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

          // parse AI mods and load the results into self.files()
          var generateAI = function () {
            var self = this;

            var deferred = $.Deferred();
            var deferredAIFiles = $.Deferred();

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

            var isQueller = aiBrain === "Queller";
            var aiTechPath = "/pa/ai_tech/";
            var game = self.game();
            var inventory = game.inventory();

            var parseFiles = function (aiPath, promise, aiToModify) {
              api.file.list(aiPath, true).then(function (fileList) {
                var configFiles = self.files();
                var queue = [];

                var aiMods = game.inventory().aiMods();

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

                var subcommanderAIPath = findAIPath("subcommander");

                _.forEach(fileList, function (filePath) {
                  if (
                    _.endsWith(filePath, ".json") &&
                    !_.includes(filePath, "/neural_networks/") &&
                    !_.endsWith(filePath, "ai_config.json")
                  ) {
                    var deferred2 = $.Deferred();

                    var aiBuildOps = [];
                    var quellerSubCommander = false;
                    if (
                      isQueller &&
                      inventory.minions().length > 0 &&
                      (_.startsWith(filePath, subcommanderAIPath) ||
                        _.startsWith(filePath, aiTechPath))
                    ) {
                      quellerSubCommander = true;
                    }

                    if (
                      aiToModify !== "None" &&
                      !_.isEmpty(aiMods[1]) &&
                      (!isQueller ||
                        quellerSubCommander ||
                        aiToModify === "All")
                    ) {
                      // Only mods associated with the file's AI manager are loaded
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

                    queue.push(deferred2);

                    $.getJSON("coui:/" + filePath)
                      .then(function (json) {
                        if (aiToModify === "All") {
                          if (!_.isEmpty(aiBuildOps)) {
                            addTechToAI(json, aiBuildOps);
                          }
                          // Put "load" files where the AI expects them to be
                          if (_.startsWith(filePath, aiTechPath)) {
                            if (isQueller) {
                              // We don't know if the aiPath contains q_uber
                              var quellerEnemyPath = findAIPath("enemy");
                              filePath =
                                quellerEnemyPath +
                                filePath.slice(aiTechPath.length);
                              configFiles[filePath] = json;
                              if (quellerSubCommander) {
                                filePath =
                                  subcommanderAIPath +
                                  filePath.slice(quellerEnemyPath.length);
                                configFiles[filePath] = json;
                              }
                            } else {
                              filePath =
                                aiPath + filePath.slice(aiTechPath.length);
                              configFiles[filePath] = json;
                            }
                          } else {
                            configFiles[filePath] = json;
                          }
                        } else if (aiToModify === "SubCommanders") {
                          // Setup enemy AI first
                          if (!_.startsWith(filePath, aiTechPath)) {
                            configFiles[filePath] = _.cloneDeep(json);
                          }
                          // Setup Sub Commanders
                          if (!_.isEmpty(aiBuildOps)) {
                            addTechToAI(json, aiBuildOps);
                          }
                          if (quellerSubCommander) {
                            // Put "load" files where Queller expects them to be
                            if (_.startsWith(filePath, aiTechPath)) {
                              filePath =
                                subcommanderAIPath +
                                filePath.slice(aiTechPath.length);
                            }
                          } else {
                            // Titans/Penchant Sub Commanders share an ai_path with the enemy so need a new one
                            if (_.startsWith(filePath, aiPath)) {
                              filePath =
                                aiTechPath + filePath.slice(aiPath.length);
                            }
                          }
                          configFiles[filePath] = json;
                        } else {
                          configFiles[filePath] = json;
                        }
                      })
                      .always(function () {
                        deferred2.resolve();
                      });
                  }
                });

                $.when.apply($, queue).then(function () {
                  self.files.valueHasMutated();
                  promise.resolve();
                });
              });
            };

            var subcommanders = inventory.minions();
            var ai = game.galaxy().stars()[game.currentStar()].ai();
            var aiFilePath = "";
            if (subcommanders.length > 0) {
              aiFilePath = findAIPath("all");
            } else {
              aiFilePath = findAIPath("enemy");
            }

            if (_.isEmpty(inventory.aiMods())) {
              parseFiles(aiFilePath, deferredAIFiles, "None");
            } else if (ai.mirrorMode === true) {
              parseFiles(aiFilePath, deferredAIFiles, "All");
            } else if (subcommanders.length > 0) {
              parseFiles(aiFilePath, deferredAIFiles, "SubCommanders");
            } else {
              parseFiles(aiFilePath, deferredAIFiles, "None");
            }

            $.when(deferredAIFiles).then(function () {
              deferred.resolve();
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

          var generateConfig = function () {
            var self = this;

            // Setup the player
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
            var subcommanderAIPath = findAIPath("subcommander");

            _.forEach(inventory.minions(), function (subcommander, index) {
              // Avoid breaking Sub Commanders from earlier versions
              subcommander.personality.ai_path = subcommanderAIPath;

              var cards = inventory.cards();

              // Sub Commander Tactics Tech
              if (_.some(cards, { id: "gwaio_upgrade_subcommander_tactics" })) {
                subcommander.personality.micro_type = 2;
                subcommander.personality.go_for_the_kill = true;
                subcommander.personality.priority_scout_metal_spots = true;
                subcommander.personality.enable_commander_danger_responses = true;
                _.pull(
                  subcommander.personality.personality_tags,
                  "SlowerExpansion"
                );
              }

              // Sub Commander Fabber Tech
              if (_.some(cards, { id: "gwaio_upgrade_subcommander_fabber" })) {
                subcommander.personality.max_basic_fabbers = Math.round(
                  subcommander.personality.max_basic_fabbers * 1.5
                );
                subcommander.personality.max_advanced_fabbers = Math.round(
                  subcommander.personality.max_advanced_fabbers * 1.5
                );
              }

              // Sub Commander Duplication Tech
              var subcommanderCommanders = _.some(cards, {
                id: "gwaio_upgrade_subcommander_duplication",
              })
                ? 2
                : 1;

              var slotsArraySubCommander = [];

              _.times(subcommanderCommanders, function () {
                slotsArraySubCommander.push(
                  armyCommander(true, subcommander.name, subcommander.commander)
                );
              });
              armies.push({
                slots: slotsArraySubCommander,
                color: gwoColour.pick(
                  inventory.getTag("global", "playerFaction"),
                  subcommander.color + 1,
                  index + 1 // player has colour 0
                ),
                econ_rate: 1,
                personality: subcommander.personality,
                spec_tag: playerTag,
                alliance_group: 1,
              });
            });

            // Setup the AI
            var currentStar = game.galaxy().stars()[game.currentStar()];
            var ai = currentStar.ai();
            var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
            var aiTag = [];
            _.times(aiFactionCount, function (n) {
              var aiNewTag = ".ai";
              n = n.toString();
              aiNewTag = aiNewTag + n;
              aiTag.push(aiNewTag);
            });

            // Setup AI System Owner
            ai.personality.adv_eco_mod *= ai.econ_rate;
            ai.personality.adv_eco_mod_alone *= ai.econ_rate;

            var enemyAIPath = findAIPath("enemy");

            // Avoid breaking enemies from earlier versions
            ai.personality.ai_path = enemyAIPath;

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
              // Avoid AI teching too early/late due to eco modifiers
              minion.personality.adv_eco_mod *= minion.econ_rate;
              minion.personality.adv_eco_mod_alone *= minion.econ_rate;

              // Avoid breaking enemies from earlier versions
              minion.personality.ai_path = enemyAIPath;

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

            // Setup Additional AI Factions
            _.forEach(ai.foes, function (foe, index) {
              // Avoid AI teching too early/late due to eco modifiers
              foe.personality.adv_eco_mod *= foe.econ_rate;
              foe.personality.adv_eco_mod_alone *= foe.econ_rate;

              // Avoid breaking enemies from earlier versions
              foe.personality.ai_path = enemyAIPath;

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
