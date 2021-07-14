var gwaioRefereeChangesLoaded;

if (!gwaioRefereeChangesLoaded) {
  gwaioRefereeChangesLoaded = true;

  function gwaioRefereeChanges() {
    try {
      requireGW(
        [
          "shared/gw_common",
          "pages/gw_play/gw_referee",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
        ],
        function (GW, GWReferee, gwaioFunctions) {
          GWReferee.hire = function (game) {
            // call our own gw_referee implementation
            var ref = new gwaioReferee(game);
            return _.bind(generateGameFiles, ref)()
              .then(_.bind(generateAI, ref))
              .then(_.bind(generateConfig, ref))
              .then(function () {
                return ref;
              });
          };

          var gwaioReferee = function (game) {
            var self = this;

            self.game = ko.observable(game);

            self.files = ko.observable();
            self.localFiles = ko.observable();
            self.config = ko.observable();
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

              if (gwaioFunctions.aiEnabled() === "Queller") {
                var aiUnitMapPath =
                  "/pa/ai_personalities/queller/q_uber/unit_maps/ai_unit_map.json";
                var aiUnitMapTitansPath =
                  "/pa/ai_personalities/queller/q_uber/unit_maps/ai_unit_map_x1.json";
              } else if (gwaioFunctions.aiEnabled() === "Penchant") {
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
                  if (!Object.prototype.hasOwnProperty.call(spec, "base_spec"))
                    return spec;

                  var base = specs[spec.base_spec];
                  if (!base) {
                    base = specs[spec.base_spec + tag];
                    if (!base) return spec;
                  }

                  spec = _.cloneDeep(spec);
                  delete spec.base_spec;

                  base = flattenBaseSpecs(base, specs, tag);

                  return _.merge({}, base, spec);
                };

                var modSpecs = function (specs, mods, specTag) {
                  var load = function (specId) {
                    taggedId = specId;
                    if (
                      !Object.prototype.hasOwnProperty.call(specs, taggedId)
                    ) {
                      var taggedId = specId + specTag;
                      if (
                        !Object.prototype.hasOwnProperty.call(specs, taggedId)
                      )
                        return;
                    }
                    var result = specs[taggedId];
                    if (result)
                      specs[taggedId] = result = flattenBaseSpecs(
                        result,
                        specs,
                        specTag
                      );
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
                      if (!_.isArray(attribute))
                        attribute = _.isEmpty(attribute) ? [] : [attribute];
                      if (_.isArray(value)) attribute = attribute.concat(value);
                      else attribute.push(value);
                      return attribute;
                    },
                    eval: function (attribute, value) {
                      return new Function("attribute", value)(attribute);
                    },
                    clone: function (attribute, value) {
                      var loaded = load(attribute);
                      if (loaded) loaded = _.cloneDeep(loaded);
                      specs[value + specTag] = loaded || attribute;
                    },
                    tag: function (attribute) {
                      return attribute + specTag;
                    },
                    pull: function (attribute, value) {
                      if (!_.isArray(attribute))
                        attribute = _.isEmpty(attribute) ? [] : [attribute];
                      if (_.isArray(value))
                        var args = [attribute].concat(value);
                      else args = [attribute, value];

                      return _.pull.apply(this, args);
                    },
                    // New op to remove text in a string
                    wipe: function (attribute, value) {
                      if (!_.isString(attribute))
                        attribute = attribute.toString();
                      return attribute.replace(value, "");
                    },
                  };
                  var applyMod = function (mod) {
                    var spec = load(mod.file);
                    if (!spec)
                      return console.warn(
                        "Warning: File not found in mod",
                        mod
                      );
                    if (!Object.prototype.hasOwnProperty.call(ops, mod.op))
                      return console.error("Invalid operation in mod " + mod);

                    var originalPath = (mod.path || "").split(".");
                    var path = originalPath.reverse();

                    var reportError = function (error, path) {
                      console.error(
                        error,
                        spec[level],
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
                        } else step = Number(step);
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
                          return reportError("Undefined mod spec encountered,");
                        }
                        spec = newSpec;
                      } else if (_.isObject(spec[level])) spec = spec[level];
                      else return reportError("Invalid attribute encountered,");
                    }

                    if (path.length && path[0]) {
                      var leaf = cookStep(path[0]);
                      spec[leaf] = ops[mod.op](spec[leaf], mod.value);
                    } else ops[mod.op](spec, mod.value);
                  };
                  _.forEach(mods, applyMod);
                };
                /* end of gw_spec.js replacements */

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

                  GW.specs
                    .genUnitSpecs(units, aiTag[n])
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

                var playerAIUnitMap = GW.specs.genAIUnitMap(
                  aiUnitMap,
                  ".player"
                );
                var playerX1AIUnitMap = titans
                  ? GW.specs.genAIUnitMap(aiX1UnitMap, ".player")
                  : {};

                var inventory = self.game().inventory();

                GW.specs
                  .genUnitSpecs(inventory.units(), ".player")
                  .then(function (playerSpecFiles) {
                    if (gwaioFunctions.aiEnabled() === "Queller") {
                      var playerFilesClassic = _.assign(
                        {
                          "/pa/ai_personalities/queller/q_gold/unit_maps/ai_unit_map.json.player":
                            playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      var playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai_personalities/queller/q_gold/unit_maps/ai_unit_map_x1.json.player":
                                playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
                    } else if (gwaioFunctions.aiEnabled() === "Penchant") {
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
                    modSpecs(playerFiles, inventory.mods(), ".player");
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

          var generateAI = function () {
            console.log("Generating AI");
            var self = this;

            var deferred = $.Deferred();
            var deferredAIFiles = $.Deferred();

            var addTechToAI = function (json, mods) {
              console.log("Checking", json);

              var ops = {
                // fabber/factory/platoon only
                append: function (
                  json,
                  value,
                  toBuild,
                  idToMod,
                  refId,
                  refValue
                ) {
                  // eslint-disable-next-line lodash/prefer-filter
                  _.forEach(json.build_list, function (build) {
                    if (build.to_build === toBuild) {
                      console.debug("Found (append)", build.name);
                      if (
                        (_.isUndefined(refId) || build[refId] === refValue) &&
                        build[idToMod] &&
                        _.isArray(build[idToMod])
                      ) {
                        build[idToMod] = build[idToMod].concat(value);
                        console.debug("Appended", build[idToMod]);
                      } else if (
                        (_.isUndefined(refId) || build[refId] === refValue) &&
                        build[idToMod]
                      ) {
                        build[idToMod] += value;
                        console.debug("Appended", build[idToMod]);
                      } else
                        _.forEach(
                          build.build_conditions,
                          function (test_array) {
                            _.forEach(test_array, function (test) {
                              if (test[refId] === refValue) {
                                if (_.isArray(test[idToMod])) {
                                  test[idToMod] = test[idToMod].concat(value);
                                  console.debug("Appended", value);
                                } else if (test[idToMod]) {
                                  test[idToMod] += value;
                                  console.debug("Appended", value);
                                }
                              }
                            });
                          }
                        );
                    }
                  });
                },
                // fabber/factory/platoon only
                prepend: function (
                  json,
                  value,
                  toBuild,
                  idToMod,
                  refId,
                  refValue
                ) {
                  // eslint-disable-next-line lodash/prefer-filter
                  _.forEach(json.build_list, function (build) {
                    if (build.to_build === toBuild) {
                      console.debug("Found (prepend)", build.name);
                      if (
                        (_.isUndefined(refId) || build[refId] === refValue) &&
                        build[idToMod] &&
                        _.isArray(build[idToMod])
                      ) {
                        build[idToMod] = value.concat(build[idToMod]);
                        console.debug("Prepended", build[idToMod]);
                      } else if (
                        (_.isUndefined(refId) || build[refId] === refValue) &&
                        build[idToMod]
                      ) {
                        build[idToMod] = value + build[idToMod];
                        console.debug("Prepended", build[idToMod]);
                      } else
                        _.forEach(
                          build.build_conditions,
                          function (test_array) {
                            _.forEach(test_array, function (test) {
                              if (test[refId] === refValue) {
                                if (_.isArray(test[idToMod])) {
                                  test[idToMod] = value.concat(test[idToMod]);
                                  console.debug("Prepended", test[idToMod]);
                                } else if (test[idToMod]) {
                                  test[idToMod] = value + test[idToMod];
                                  console.debug("Prepended", test[idToMod]);
                                }
                              }
                            });
                          }
                        );
                    }
                  });
                },
                // fabber/factory/platoon only
                replace: function (
                  json,
                  value,
                  toBuild,
                  idToMod,
                  refId,
                  refValue
                ) {
                  // eslint-disable-next-line lodash/prefer-filter
                  _.forEach(json.build_list, function (build) {
                    if (build.to_build === toBuild) {
                      console.debug("Found (replace)", build.name);
                      if (
                        (_.isUndefined(refId) || build[refId] === refValue) &&
                        build[idToMod]
                      ) {
                        build[idToMod] = value;
                        console.debug("Replaced", build[idToMod]);
                      } else
                        _.forEach(
                          build.build_conditions,
                          function (test_array) {
                            _.forEach(test_array, function (test) {
                              if (test[refId] === refValue && test[idToMod]) {
                                test[idToMod] = value;
                                console.debug("Replaced", test[idToMod]);
                              }
                            });
                          }
                        );
                    }
                  });
                },
                // fabber/factory/platoon only
                remove: function (json, value, toBuild) {
                  // eslint-disable-next-line lodash/prefer-filter
                  _.forEach(json.build_list, function (build) {
                    if (build.to_build === toBuild) {
                      console.debug("Found (remove)", build.name);
                      _.forEach(build.build_conditions, function (test_array) {
                        _.remove(test_array, function (object) {
                          if (_.isEqual(object, value)) {
                            console.debug("Removed", object);
                            return object;
                          }
                        });
                      });
                    }
                  });
                },
                // fabber/factory/platoon only
                new: function (json, value, toBuild, idToMod) {
                  // eslint-disable-next-line lodash/prefer-filter
                  _.forEach(json.build_list, function (build) {
                    if (build.to_build === toBuild) {
                      console.debug("Found (new)", build.name);
                      if (_.isUndefined(idToMod)) {
                        build.build_conditions.push(value);
                        console.debug(
                          "New",
                          build.build_conditions[
                            build.build_conditions.length - 1
                          ]
                        );
                      } else
                        _.forEach(
                          build.build_conditions,
                          function (test_array) {
                            test_array.push(value);
                            console.debug(
                              "New",
                              test_array[test_array.length - 1]
                            );
                          }
                        );
                    }
                  });
                },
                // template only
                squad: function (json, value, toBuild) {
                  if (json.platoon_templates[toBuild]) {
                    console.debug("Found (squad)", toBuild);
                    json.platoon_templates[toBuild].units.push(value);
                    console.debug(
                      "Squad",
                      json.platoon_templates[toBuild].units[
                        json.platoon_templates[toBuild].units.length - 1
                      ]
                    );
                  }
                },
              };

              _.forEach(mods, function (mod) {
                ops[mod.op](
                  json,
                  mod.value,
                  mod.toBuild,
                  mod.idToMod,
                  mod.refId,
                  mod.refValue
                );
              });
            };

            if (gwaioFunctions.aiEnabled() === "Queller")
              var quellerEnabled = true;
            var aiTechPath = "/pa/ai_tech/";

            var parseFiles = function (aiPath, promise, aiToModify) {
              api.file.list(aiPath, true).then(function (fileList) {
                var configFiles = self.files();
                var queue = [];

                var aiMods = game.inventory().aiMods();

                console.log("AI to modify:", aiToModify);

                if (aiToModify !== "None") {
                  aiMods = _.partition(aiMods, { op: "load" });

                  // process ai load ops
                  if (aiMods[0])
                    // eslint-disable-next-line lodash/prefer-map
                    _.forEach(aiMods[0], function (aiMod) {
                      if (aiMod.type === "fabber")
                        var managerPath = "fabber_builds/";
                      else if (aiMod.type === "factory")
                        managerPath = "factory_builds/";
                      else if (aiMod.type === "platoon")
                        managerPath = "platoon_builds/";
                      else if (aiMod.type === "template")
                        managerPath = "platoon_templates/";
                      else console.error("Invalid op in", aiMod);
                      fileList.push(aiTechPath + managerPath + aiMod.value);
                      console.log(
                        "Load:",
                        aiTechPath + managerPath + aiMod.value
                      );
                    });
                }

                var allyPath = gwaioFunctions.aiPath("ally");

                _.forEach(fileList, function (filePath) {
                  console.log("Processing:", filePath);
                  if (
                    _.endsWith(filePath, ".json") &&
                    !_.includes(filePath, "/neural_networks/") &&
                    !_.endsWith(filePath, "ai_config.json")
                  ) {
                    var deferred2 = $.Deferred();

                    if (
                      quellerEnabled &&
                      inventory.minions().length > 0 &&
                      (_.startsWith(filePath, allyPath) ||
                        _.startsWith(filePath, aiTechPath))
                    )
                      var quellerSubCommander = true;

                    if (aiToModify !== "None" && !_.isEmpty(aiMods[1])) {
                      if (
                        !quellerEnabled ||
                        quellerSubCommander ||
                        aiToModify === "All"
                      ) {
                        // Only mods associated with the file's AI manager are loaded
                        if (_.includes(filePath, "/fabber_builds/"))
                          var aiBuildOps = _.filter(aiMods[1], {
                            type: "fabber",
                          });
                        else if (_.includes(filePath, "/factory_builds/"))
                          aiBuildOps = _.filter(aiMods[1], { type: "factory" });
                        else if (_.includes(filePath, "/platoon_builds/"))
                          aiBuildOps = _.filter(aiMods[1], { type: "platoon" });
                        else if (_.includes(filePath, "/platoon_templates/"))
                          aiBuildOps = _.filter(aiMods[1], {
                            type: "template",
                          });
                        else aiBuildOps = [];
                      }
                    }

                    queue.push(deferred2);

                    $.getJSON("coui:/" + filePath)
                      .then(function (json) {
                        if (aiToModify === "All") {
                          console.log("Assigning (All):", filePath);
                          if (!_.isEmpty(aiBuildOps))
                            addTechToAI(json, aiBuildOps);
                          // Put "load" files where the AI expects them to be
                          if (_.startsWith(filePath, aiTechPath)) {
                            if (quellerEnabled) {
                              // We don't know if the aiPath contains q_uber
                              var quellerEnemyPath =
                                gwaioFunctions.aiPath("enemy");
                              filePath =
                                quellerEnemyPath +
                                filePath.slice(aiTechPath.length);
                              console.log("New filepath (All):", filePath);
                              configFiles[filePath] = json;
                              if (quellerSubCommander) {
                                filePath =
                                  allyPath +
                                  filePath.slice(quellerEnemyPath.length);
                                configFiles[filePath] = json;
                                console.log("New filepath (All):", filePath);
                              }
                            } else {
                              filePath =
                                aiPath + filePath.slice(aiTechPath.length);
                              console.log("New filepath (All):", filePath);
                              configFiles[filePath] = json;
                            }
                          } else {
                            configFiles[filePath] = json;
                          }
                        } else if (aiToModify === "SubCommanders") {
                          console.log("Assigning (SC):", filePath);
                          // Setup enemy AI first
                          if (!_.startsWith(filePath, aiTechPath))
                            configFiles[filePath] = _.cloneDeep(json);
                          // Setup Sub Commanders
                          if (!_.isEmpty(aiBuildOps))
                            addTechToAI(json, aiBuildOps);
                          if (quellerSubCommander) {
                            // Put "load" files where Queller expects them to be
                            if (_.startsWith(filePath, aiTechPath)) {
                              filePath =
                                allyPath + filePath.slice(aiTechPath.length);
                            }
                          } else {
                            // TITANS Sub Commanders share an ai_path with the enemy so need a new one
                            if (_.startsWith(filePath, aiPath)) {
                              filePath =
                                aiTechPath + filePath.slice(aiPath.length);
                            }
                          }
                          console.log("New filepath (SC):", filePath);
                          configFiles[filePath] = json;
                        } else {
                          console.log("Assigning (None):", filePath);
                          configFiles[filePath] = json;
                        }
                      })
                      .always(function () {
                        console.log("Completed:", filePath);
                        deferred2.resolve();
                      });
                  }
                });

                $.when.apply($, queue).then(function () {
                  self.files.valueHasMutated();
                  console.log("Files parsed");
                  promise.resolve();
                });
              });
            };

            var game = self.game();
            var inventory = game.inventory();

            if (quellerEnabled && inventory.minions().length > 0)
              var aiFilePath = gwaioFunctions.aiPath("all");
            else {
              aiFilePath = gwaioFunctions.aiPath("enemy");
            }

            if (!_.isEmpty(inventory.aiMods())) {
              console.log("We are holding AI affecting tech");
              var ai = game.galaxy().stars()[game.currentStar()].ai();
              var subCommanders = inventory.minions();
              if (ai.mirrorMode === true) {
                console.log("Parsing files for All");
                if (!quellerEnabled) {
                  _.forEach(subCommanders, function (subCommander) {
                    // Reset ai_path in case it's set to aiTechPath
                    subCommander.personality.ai_path = aiFilePath;
                  });
                }
                parseFiles(aiFilePath, deferredAIFiles, "All");
              } else if (subCommanders.length > 0) {
                console.log("Parsing files for Sub Commanders");
                if (!quellerEnabled) {
                  _.forEach(subCommanders, function (subCommander) {
                    // TITANS Sub Commanders share an ai_path with the enemy so need a new one
                    subCommander.personality.ai_path = aiTechPath;
                  });
                }
                parseFiles(aiFilePath, deferredAIFiles, "SubCommanders");
              } else {
                console.log("Parsing files for None because no AI");
                parseFiles(aiFilePath, deferredAIFiles, "None");
              }
            } else {
              console.log("Parsing files for None because no tech");
              parseFiles(aiFilePath, deferredAIFiles, "None");
            }

            $.when(deferredAIFiles).then(function () {
              console.log("AI generated");
              deferred.resolve();
            });

            return deferred.promise();
          };

          var generateConfig = function () {
            console.log("Generating config");
            var self = this;

            // Setup the player
            var game = self.game();
            var inventory = game.inventory();
            var playerName = ko.observable().extend({ session: "displayName" });
            var armies = [
              {
                slots: [{ name: playerName() || "Player" }],
                color: inventory.getTag("global", "playerColor"),
                econ_rate: 1,
                spec_tag: ".player",
                alliance_group: 1,
              },
            ];
            var aiLandingOptions = [
              "off_player_planet",
              "on_player_planet",
              "no_restriction",
            ];
            var allyPath = gwaioFunctions.aiPath("ally");
            // eslint-disable-next-line lodash/prefer-map
            _.forEach(inventory.minions(), function (subcommander) {
              // Avoid breaking saves from earlier versions
              subcommander.personality.ai_path = allyPath;

              armies.push({
                slots: [
                  {
                    ai: true,
                    name: subcommander.name,
                    commander: subcommander.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  },
                ],
                color: subcommander.color,
                econ_rate: 1,
                personality: subcommander.personality,
                spec_tag: ".player",
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

            var enemyAIPath = gwaioFunctions.aiPath("enemy");

            // Avoid breaking saves from earlier versions
            ai.personality.ai_path = enemyAIPath;

            var slotsArray = [];
            _.times(
              ai.bossCommanders ||
                ai.commanderCount ||
                // legacy GWAIO support
                (ai.landing_policy && ai.landing_policy.length) ||
                1,
              function () {
                slotsArray.push({
                  ai: true,
                  name: ai.name,
                  commander: ai.commander,
                  landing_policy: _.sample(aiLandingOptions),
                });
              }
            );
            armies.push({
              slots: slotsArray,
              color: ai.color,
              econ_rate: ai.econ_rate,
              personality: ai.personality,
              spec_tag: aiTag[0],
              alliance_group: 2,
            });
            _.forEach(ai.minions, function (minion) {
              minion.personality.adv_eco_mod *= minion.econ_rate;
              minion.personality.adv_eco_mod_alone *= minion.econ_rate;

              // Avoid breaking saves from earlier versions
              minion.personality.ai_path = enemyAIPath;

              var slotsArrayMinions = [];
              _.times(
                minion.commanderCount ||
                  // legacy GWAIO support
                  (minion.landing_policy && minion.landing_policy.length) ||
                  1,
                function () {
                  slotsArrayMinions.push({
                    ai: true,
                    name: minion.name,
                    commander: minion.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  });
                }
              );
              armies.push({
                slots: slotsArrayMinions,
                color: minion.color,
                econ_rate: minion.econ_rate,
                personality: minion.personality,
                spec_tag: aiTag[0],
                alliance_group: 2,
              });
            });

            // Setup Additional AI Factions
            _.forEach(ai.foes, function (foe, index) {
              foe.personality.adv_eco_mod =
                foe.personality.adv_eco_mod * foe.econ_rate;
              foe.personality.adv_eco_mod_alone =
                foe.personality.adv_eco_mod_alone * foe.econ_rate;

              // Avoid breaking saves from earlier versions
              foe.personality.ai_path = enemyAIPath;

              var slotsArrayFoes = [];
              _.times(
                foe.commanderCount ||
                  // legacy GWAIO support
                  (foe.landing_policy && foe.landing_policy.length) ||
                  1,
                function () {
                  slotsArrayFoes.push({
                    ai: true,
                    name: foe.name,
                    commander: foe.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  });
                }
              );
              armies.push({
                slots: slotsArrayFoes,
                color: foe.color,
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
                  if (army.alliance_group === 1) slot.commander += ".player";
                  else slot.commander += aiTag[army.alliance_group - 2];
                }
              });
            });
            config.player.commander += ".player";
            // Store the game in the config for diagnostic purposes.
            config.gw = game.save();
            self.config(config);
          };

          gwaioReferee.prototype.stripSystems = function () {
            var self = this;

            // remove the systems from the galaxy
            var gw = self.config().gw;
            GW.Game.saveSystems(gw);
          };

          gwaioReferee.prototype.mountFiles = function () {
            var self = this;

            var deferred = $.Deferred();

            var allFiles = _.cloneDeep(self.files());
            // The player unit list needs to be the superset of units for proper UI behavior
            var playerUnits = allFiles["/pa/units/unit_list.json.player"];
            var aiUnits = allFiles["/pa/units/unit_list.json.ai"];
            if (playerUnits) {
              var allUnits = _.cloneDeep(playerUnits);
              if (aiUnits && allUnits.units) {
                allUnits.units = allUnits.units.concat(aiUnits.units);
              }
              allFiles["/pa/units/unit_list.json"] = allUnits;
            }

            if (self.localFiles()) {
              _.assign(allFiles, self.localFiles());
            }

            var cookedFiles = _.mapValues(allFiles, function (value) {
              if (!_.isString(value)) return JSON.stringify(value);
              else return value;
            });

            // community mods will hook unmountAllMemoryFiles to remount client mods
            api.file.unmountAllMemoryFiles().always(function () {
              api.file.mountMemoryFiles(cookedFiles).then(function () {
                deferred.resolve();
              });
            });

            return deferred.promise();
          };

          gwaioReferee.prototype.tagGame = function () {
            api.game.setUnitSpecTag(".player");
          };
        }
      );
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioRefereeChanges();
}
