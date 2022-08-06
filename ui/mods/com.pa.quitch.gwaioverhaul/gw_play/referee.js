var gwoRefereeChangesLoaded;

if (!gwoRefereeChangesLoaded) {
  gwoRefereeChangesLoaded = true;

  function gwoRefereeChanges() {
    try {
      requireGW(
        [
          "shared/gw_common",
          "pages/gw_play/gw_referee",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_files.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/commander_colour.js",
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
        ],
        function (GW, GWReferee, gwoGenerateGameFiles, gwoColour, gwoAI) {
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

          var addAILoadFilesToFileList = function (
            aiMods,
            aiToModify,
            fileList,
            aiTechPath
          ) {
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
          };

          var getAIPath = function (type) {
            var game = model.game();
            var ai = game.galaxy().stars()[game.currentStar()].ai();
            var inventory = game.inventory();
            var aiBrain = gwoAI.aiInUse();
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
            var aiIsCluster = ai.faction === 4;
            if (
              inventory.getTag("global", "playerFaction") === 4 &&
              subcommanders > 0
            ) {
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
              var subcommanderAIPath = getAIPath("subcommander");
              var enemyAIPath = getAIPath("enemy");
              var aiBrain = gwoAI.aiInUse();
              var isQueller = aiBrain === "Queller";

              addAILoadFilesToFileList(
                aiMods,
                aiToModify,
                fileList,
                aiTechPath
              );

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

          var aiCommander = function (
            name,
            commander,
            landingOptions,
            commanderNumber
          ) {
            if (commanderNumber > landingOptions.length - 1) {
              commanderNumber -= landingOptions.length;
            }
            return {
              ai: true,
              name: name,
              commander: commander,
              landing_policy: landingOptions[commanderNumber],
            };
          };

          var setupAIArmy = function (ai, index, specTag, alliance) {
            var slotsArray = [];
            var aiLandingOptions = _.shuffle([
              "off_player_planet",
              "on_player_planet",
              "no_restriction",
            ]);
            _.times(
              ai.bossCommanders ||
                ai.commanderCount ||
                // legacy GWO support
                (ai.landing_policy && ai.landing_policy.length) ||
                1,
              function (count) {
                slotsArray.push(
                  aiCommander(ai.name, ai.commander, aiLandingOptions, count)
                );
              }
            );
            return {
              slots: slotsArray,
              color: gwoColour.pick(ai.faction, ai.color, index),
              econ_rate: ai.econ_rate,
              personality: ai.personality,
              spec_tag: specTag,
              alliance_group: alliance,
            };
          };

          var generateConfig = function () {
            var self = this;

            // Set up the player
            var game = self.game();
            var inventory = game.inventory();
            var cards = inventory.cards();
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
            var isCluster = playerFaction === 4;

            _.forEach(alliedCommanders, function (ally, index) {
              // Avoid breaking Sub Commanders from earlier versions
              ally.personality.ai_path = setAIPath(isCluster, true);

              ally.personality = applySubcommanderTacticsTech(
                ally.personality,
                cards
              );
              ally.personality = applySubcommanderFabberTech(
                ally.personality,
                cards
              );
              if (hasSubcommanderDuplicationTech(cards)) {
                ally.commanderCount = 2;
              }
              ally.faction = playerFaction;
              var allyIndex = index + 1;
              var subcommanderArmy = setupAIArmy(ally, allyIndex, playerTag, 1);
              armies.push(subcommanderArmy);
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
            var aiBrain = gwoAI.aiInUse();

            // Set up AI System Owner
            ai = setAdvEcoMod(ai, aiBrain);

            // Avoid breaking enemies from earlier versions
            var aiIsCluster = ai.faction === 4 && ai.mirrorMode !== true;
            var aiPath = setAIPath(aiIsCluster, false);
            ai.personality.ai_path = aiPath;

            var aiArmy = setupAIArmy(ai, 0, aiTag[0], 2);
            armies.push(aiArmy);

            _.forEach(ai.minions, function (minion, index) {
              minion = setAdvEcoMod(minion, aiBrain);

              // Avoid breaking enemies from earlier versions
              minion.personality.ai_path = aiPath;

              minion.faction = ai.faction;
              var minionIndex = index + 1; // primary AI has colour 0
              aiArmy = setupAIArmy(minion, minionIndex, aiTag[0], 2);
              armies.push(aiArmy);
            });

            // Set up Additional AI Factions
            _.forEach(ai.foes, function (foe, index) {
              foe = setAdvEcoMod(foe, aiBrain);

              // Avoid breaking enemies from earlier versions
              var foeIsCluster = parseInt(foe.faction[0]) === 4; // was an array before v5.44.0
              foe.personality.ai_path = setAIPath(foeIsCluster, false);

              var foeTag = index + 1; // 0 taken by primary AI
              var foeAlliance = index + 3; //  1 & 2 taken by player and primary AI
              aiArmy = setupAIArmy(foe, 0, aiTag[foeTag], foeAlliance);
              armies.push(aiArmy);
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
            return _.bind(gwoGenerateGameFiles, ref)()
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
