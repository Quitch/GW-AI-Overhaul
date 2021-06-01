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

              if (gwaioFunctions.quellerAIEnabled()) {
                var aiUnitMapPath =
                  "/pa/ai/queller/q_uber/unit_maps/ai_unit_map.json";
                var aiUnitMapTitansPath =
                  "/pa/ai/queller/q_uber/unit_maps/ai_unit_map_x1.json";
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
                var tagSpec = function (specId, tag, spec) {
                  var moreWork = [];
                  if (!_.isObject(spec)) return moreWork;
                  var applyTag = function (obj, key) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) {
                      if (_.isString(obj[key])) {
                        moreWork.push(obj[key]);
                        obj[key] = obj[key] + tag;
                      } else if (_.isArray(obj[key])) {
                        obj[key] = _.map(obj[key], function (value) {
                          moreWork.push(value);
                          return value + tag;
                        });
                      }
                    }
                  };
                  // Units
                  applyTag(spec, "base_spec");
                  if (spec.tools) {
                    _.forEach(spec.tools, function (tool) {
                      applyTag(tool, "spec_id");
                    });
                  }
                  applyTag(spec, "replaceable_units");
                  applyTag(spec, "buildable_projectiles");
                  if (
                    spec.factory &&
                    _.isString(spec.factory.initial_build_spec)
                  ) {
                    applyTag(spec.factory, "initial_build_spec");
                  }
                  // Tools
                  if (spec.ammo_id) {
                    if (_.isString(spec.ammo_id)) {
                      applyTag(spec, "ammo_id");
                    } else {
                      _.forEach(spec.ammo_id, function (ammo) {
                        applyTag(ammo, "id");
                      });
                    }
                  }
                  // Add support for death_weapon specs
                  if (spec.death_weapon) {
                    if (_.isString(spec.death_weapon.ground_ammo_spec))
                      applyTag(spec.death_weapon, "ground_ammo_spec");

                    if (_.isString(spec.death_weapon.air_ammo_spec))
                      applyTag(spec.death_weapon, "air_ammo_spec");
                  }
                  return moreWork;
                };

                // replace GW.specs.genUnitSpecs() to call our own tagSpec()
                var genUnitSpecs = function (units, tag) {
                  if (!tag) return;
                  var result = $.Deferred();
                  var results = {};
                  var work = units.slice(0);
                  var step = function () {
                    var item;
                    var pending = 0;
                    var fetch = function (item) {
                      $.ajax({
                        url: "coui:/" + item,
                        success: function (data) {
                          try {
                            data = JSON.parse(data);
                          } catch (e) {
                            /* empty */
                          }
                          var newWork = tagSpec(item, tag, data);
                          work = work.concat(newWork);
                          results[item + tag] = data;
                        },
                        error: function (request, status, error) {
                          console.log(
                            "error loading spec:",
                            item,
                            request,
                            status,
                            error
                          );
                        },
                        complete: function () {
                          --pending;
                          if (!pending) _.delay(step);
                        },
                      });
                    };
                    while (work.length) {
                      item = work.pop();
                      if (
                        Object.prototype.hasOwnProperty.call(
                          results,
                          item + tag
                        )
                      )
                        continue;
                      ++pending;
                      fetch(item);
                    }
                    if (!pending) _.delay(finish);
                  };
                  var finish = _.once(function () {
                    results["/pa/units/unit_list.json" + tag] = {
                      units: _.map(units, function (unit) {
                        return unit + tag;
                      }),
                    };
                    result.resolve(results);
                  });
                  step();
                  return result;
                };

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
                        attribute = attribute === undefined ? [] : [attribute];
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
                    // New op to allow removal of an item from an array
                    pull: function (attribute, value) {
                      if (!_.isArray(attribute))
                        attribute = attribute === undefined ? [] : [attribute];
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
                      return console.error("Invalid operation in mod", mod);

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

                  genUnitSpecs(units, aiTag[n]).then(function (aiSpecFiles) {
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
                        // Don't load mods that break the AI
                        var usablePlayerInventory = _.reject(inventory.mods(), {
                          path: "buildable_types",
                        });
                        aiInventory = aiInventory.concat(usablePlayerInventory);
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

                genUnitSpecs(inventory.units(), ".player").then(function (
                  playerSpecFiles
                ) {
                  if (gwaioFunctions.quellerAIEnabled()) {
                    var playerFilesClassic = _.assign(
                      {
                        "/pa/ai/queller/q_gold/unit_maps/ai_unit_map.json.player":
                          playerAIUnitMap,
                      },
                      playerSpecFiles
                    );
                    var playerFilesX1 = titans
                      ? _.assign(
                          {
                            "/pa/ai/queller/q_gold/unit_maps/ai_unit_map_x1.json.player":
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
            var self = this;

            var deferred = $.Deferred();

            var quellerEnabled = gwaioFunctions.quellerAIEnabled();

            if (quellerEnabled && model.game().inventory().minions().length > 0)
              var aiFilePath = "/pa/ai/queller/";
            else if (quellerEnabled) aiFilePath = "/pa/ai/queller/q_uber/";
            else aiFilePath = "/pa/ai/bugfix/";

            api.file.list(aiFilePath, true).then(function (files) {
              var configFiles = self.files();
              var queue = [];

              _.forEach(files, function (file) {
                if (_.endsWith(file, ".json")) {
                  var deferred2 = $.Deferred();

                  queue.push(deferred2);

                  $.getJSON("coui:/" + file)
                    .then(function (json) {
                      if (quellerEnabled) configFiles[file] = json;
                      else
                        configFiles["/pa/ai/" + file.slice(aiFilePath.length)] =
                          json;
                    })
                    .always(function () {
                      deferred2.resolve();
                    });
                }
              });

              $.when.apply($, queue).then(function () {
                self.files.valueHasMutated();
                deferred.resolve();
              });
            });

            return deferred.promise();
          };

          var generateConfig = function () {
            var self = this;

            // Setup the player
            var game = self.game();
            var inventory = game.inventory();
            var playerColor = inventory.getTag("global", "playerColor");
            var playerName = ko.observable().extend({ session: "displayName" });
            var armies = [
              {
                slots: [{ name: playerName() || "Player" }],
                color: playerColor,
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
            // eslint-disable-next-line lodash/prefer-map
            _.forEach(inventory.minions(), function (subcommander) {
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
            var currentSystem = game.galaxy().stars()[game.currentStar()];
            var ai = currentSystem.ai();
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
            var slotsArray = [];
            if (ai.landing_policy)
              // support for old shared armies implementation
              _.times(ai.landing_policy.length, function () {
                slotsArray.push({
                  ai: true,
                  name: ai.name,
                  commander: ai.commander,
                  landing_policy: _.sample(aiLandingOptions),
                });
              });
            else
              _.times(ai.bossCommanders || ai.commanderCount || 1, function () {
                slotsArray.push({
                  ai: true,
                  name: ai.name,
                  commander: ai.commander,
                  landing_policy: _.sample(aiLandingOptions),
                });
              });
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
              var slotsArrayMinions = [];
              if (minion.landing_policy)
                // support for old shared armies implementation
                _.times(minion.landing_policy.length, function () {
                  slotsArrayMinions.push({
                    ai: true,
                    name: minion.name,
                    commander: minion.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  });
                });
              else
                _.times(minion.commanderCount || 1, function () {
                  slotsArrayMinions.push({
                    ai: true,
                    name: minion.name,
                    commander: minion.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  });
                });
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
            var allianceGroup = 3;
            var foeCount = 1;
            _.forEach(ai.foes, function (foe) {
              var slotsArrayFoes = [];
              foe.personality.adv_eco_mod =
                foe.personality.adv_eco_mod * foe.econ_rate;
              foe.personality.adv_eco_mod_alone =
                foe.personality.adv_eco_mod_alone * foe.econ_rate;
              if (foe.landing_policy)
                // support for old shared armies implementation
                _.times(foe.landing_policy.length, function () {
                  slotsArrayFoes.push({
                    ai: true,
                    name: foe.name,
                    commander: foe.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  });
                });
              else
                _.times(foe.commanderCount || 1, function () {
                  slotsArrayFoes.push({
                    ai: true,
                    name: foe.name,
                    commander: foe.commander,
                    landing_policy: _.sample(aiLandingOptions),
                  });
                });
              armies.push({
                slots: slotsArrayFoes,
                color: foe.color,
                econ_rate: foe.econ_rate,
                personality: foe.personality,
                spec_tag: aiTag[foeCount],
                alliance_group: allianceGroup,
              });
              allianceGroup += 1;
              foeCount += 1;
            });

            var playerCommander = inventory.getTag("global", "commander");
            var system = currentSystem.system();
            var config = {
              files: self.files(),
              armies: armies,
              player: {
                commander: playerCommander,
              },
              system: system,
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
