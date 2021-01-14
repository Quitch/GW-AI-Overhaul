var gwaioSystemChangesLoaded;

if (!gwaioSystemChangesLoaded) {
  gwaioSystemChangesLoaded = true;

  function gwaioSystemChanges() {
    try {
      $(".all-planets").replaceWith(
        loadHtml(
          "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/planets.html"
        )
      );

      if (!model.game().isTutorial()) {
        requireGW(["shared/gw_factions"], function (GWFactions) {
          _.forEach(model.galaxy.systems(), function (system) {
            ko.computed(function () {
              var ai = system.star.ai();
              if (!ai) return;
              else if (ai.treasurePlanet === true)
                normalizedColor = [255, 255, 255];
              else {
                var faction = GWFactions[ai.faction];
                // Ensures we assign faction colour, not minion colour, to each system
                var normalizedColor = _.map(faction.color[0], function (c) {
                  return c / 255;
                });
              }
              system.ownerColor(normalizedColor.concat(3));
              // Dependencies. These will cause the base code that updates color to rerun, so we have to run under the same conditions, and pray we run later than that code.
              system.connected();
              model.cheats.noFog();
              system.star.hasCard();
            });
          });
        });

        /* extractor() change start */
        function createBitmap(params) {
          if (!params.url) throw "No URL specified";
          if (!params.size) throw "No size specified";

          var result = new createjs.Bitmap(params.url);
          result.x = 0;
          result.y = 0;
          result.regX = params.size[0] / 2;
          result.regY = params.size[1] / 2;

          var scale = params.scale;
          if (scale !== undefined) {
            result.scaleX = scale;
            result.scaleY = scale;
          }

          var color = params.color;
          result.color = ko.observable();
          if (color) {
            if (params.noCache) throw "noCache incompatible with color";
            result.color(color);
            var updateFilters = function () {
              var color = result.color();
              result.filters = [];
              if (color)
                result.filters.push(
                  new createjs.ColorFilter(
                    color[0],
                    color[1],
                    color[2],
                    color.length >= 4 ? color[3] : 1
                  )
                );
            };
            updateFilters();
            result.color.subscribe(function () {
              updateFilters();
              result.updateCache();
            });
          }

          if (params.alpha !== undefined) result.alpha = params.alpha;

          if (!params.noCache) {
            // Note: Extra pixel compensates for bad filtering on the edges
            result.cache(-1, -1, params.size[0] + 2, params.size[1] + 2);
            $(result.image).load(function () {
              result.updateCache();
            });
          }
          return result;
        }

        function sortContainer(container) {
          container.sortChildren(function (a, b) {
            if (a.z === undefined) {
              if (b.z === undefined) return 0;
              return -1;
            } else if (b.z === undefined) {
              return 1;
            }
            return a.z - b.z;
          });
        }

        function SelectionViewModel(config) {
          var self = this;

          var galaxy = config.galaxy;
          var hover = !!config.hover;
          var iconUrl = config.iconUrl;
          var color = config.color;

          if (!iconUrl) {
            if (hover)
              iconUrl = "coui://ui/main/game/galactic_war/shared/img/hover.png";
            else
              iconUrl =
                "coui://ui/main/game/galactic_war/shared/img/selection.png";
          }

          if (!color) {
            if (hover) color = [0.5, 0.9, 1];
            else color = [0, 0.8, 1];
          }

          self.visible = ko.observable(true);
          self.star = ko.observable(-1);
          self.system = ko.pureComputed(function () {
            return self.star() >= 0 ? galaxy.systems()[self.star()] : undefined;
          });

          var extractor = function (field) {
            return ko.pureComputed(function () {
              var system = self.system();
              if (system) {
                var ai = system.star.ai();
                return loc(system[field]() || (ai && ai[field]) || ""); // GWAIO - use system information before AI information
              } else {
                return "";
              }
            });
          };

          self.name = extractor("name");
          self.html = extractor("html");
          self.description = extractor("description");

          self.scale = new createjs.Container();
          self.scale.scaleY = 0.5;
          self.scale.z = -1;
          self.icon = createBitmap({
            url: iconUrl,
            size: [240, 240],
            color: color,
          });
          self.scale.addChild(self.icon);

          ko.computed(function () {
            var system = self.system();
            var visible = !!system && self.visible();
            if (hover && visible)
              visible = system.mouseOver() !== system.mouseOut();
            self.icon.visible = visible;
            if (self.icon.visible) {
              var container = system.systemDisplay;
              container.addChild(self.scale);
              sortContainer(container);
            } else {
              if (self.scale.parent) self.scale.parent.removeChild(self.scale);
            }
          });

          if (!hover) {
            self.icon.addEventListener("tick", function () {
              self.icon.rotation = (_.now() * 0.02) % 360;
            });

            self.system.subscribe(
              function (oldSystem) {
                if (oldSystem) oldSystem.selected(false);
              },
              null,
              "beforeChange"
            );
            self.system.subscribe(function () {
              var newSystem = self.system();
              if (newSystem) newSystem.selected(true);
            });
          }
        }

        model.selection = new SelectionViewModel({
          galaxy: model.galaxy,
          hover: false,
        });
        model.selection.star(model.game().currentStar());

        model.hoverSystem = new SelectionViewModel({
          galaxy: model.galaxy,
          hover: true,
        });

        model.canMove = ko.computed(function () {
          if (model.player.moving()) return false;

          var game = model.game();
          var galaxy = game.galaxy();
          var from = game.currentStar();
          var to = model.selection.star();

          if (to < 0 || to > galaxy.stars().length) return false;

          if (!model.canSelectOrMovePrefix()) return false;

          if (from === to) return false;

          return galaxy.pathBetween(from, to, model.cheats.noFog());
        });

        model.displayMove = ko.pureComputed(function () {
          return model.canMove();
        });

        model.displayFight = ko.pureComputed(function () {
          return (
            model.canFight() &&
            !model.allowLoad() &&
            model.selection.star() === model.game().currentStar()
          );
        });
        /* extractor() change end */

        requireGW(
          ["shared/gw_common", "pages/gw_play/gw_referee"],
          function (GW, GWReferee) {
            GWReferee.hire = function (game) {
              // call our own gw_referee implementation
              var ref = new gwaioReferee(game);
              return _.bind(generateGameFiles, ref)()
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
                var galaxy = game.galaxy();
                var battleGround = galaxy.stars()[game.currentStar()];
                var ai = battleGround.ai();

                var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
                var aiTag = [];
                var aiFactions = [];

                _.times(aiFactionCount, function (n) {
                  var aiNewTag = ".ai";
                  n = n.toString();
                  aiNewTag = aiNewTag.concat(n);
                  aiTag.push(aiNewTag);
                  aiFactions.push($.Deferred());
                });

                var playerFileGen = $.Deferred();
                var filesToProcess = [playerFileGen];

                var unitsLoad = $.get("spec://pa/units/unit_list.json");
                var aiMapLoad = $.get(
                  "spec://pa/ai/unit_maps/ai_unit_map.json"
                );
                var aiX1MapLoad = titans
                  ? $.get("spec://pa/ai/unit_maps/ai_unit_map_x1.json")
                  : {};
                $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(function (
                  unitsGet,
                  aiMapGet,
                  aiX1MapGet
                ) {
                  /* Replace part of gw_spec.js to setup ops.remove() */
                  var flattenBaseSpecs = function (spec, specs, tag) {
                    if (
                      !Object.prototype.hasOwnProperty.call(spec, "base_spec")
                    )
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
                      replace: function (_, value) {
                        return value;
                      },
                      merge: function (attribute, value) {
                        return _.extend({}, attribute, value);
                      },
                      push: function (attribute, value) {
                        if (!_.isArray(attribute))
                          attribute =
                            attribute === undefined ? [] : [attribute];
                        if (_.isArray(value))
                          attribute = attribute.concat(value);
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
                      remove: function (attribute, value) {
                        return _.filter(attribute, function (entry) {
                          return entry !== value;
                        });
                      },
                    };
                    var applyMod = function (mod) {
                      var spec = load(mod.file);
                      if (!spec)
                        return api.debug.log(
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
                            return reportError(
                              "Undefined mod spec encountered,"
                            );
                          }
                          spec = newSpec;
                        } else if (_.isObject(spec[level])) spec = spec[level];
                        else
                          return reportError("Invalid attribute encountered,");
                      }

                      if (path.length && path[0]) {
                        var leaf = cookStep(path[0]);
                        spec[leaf] = ops[mod.op](spec[leaf], mod.value);
                      } else ops[mod.op](spec, mod.value);
                    };
                    _.forEach(mods, applyMod);
                  };
                  /* end of gw_spec.js replacement */

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
                        var enemyAIUnitMapFile = "/pa/ai/unit_maps/ai_unit_map.json".concat(
                          aiTag[n]
                        );
                        var enemyAIUnitMapPair = {};
                        enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
                        var enemyX1AIUnitMapFile = "/pa/ai/unit_maps/ai_unit_map_x1.json".concat(
                          aiTag[n]
                        );
                        var enemyX1AIUnitMapPair = {};
                        enemyX1AIUnitMapPair[
                          enemyX1AIUnitMapFile
                        ] = enemyX1AIUnitMap;
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
                            var usablePlayerInventory = _.reject(
                              inventory.mods(),
                              {
                                path: "buildable_types",
                              }
                            );
                            aiInventory = aiInventory.concat(
                              usablePlayerInventory
                            );
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
                      var playerFilesClassic = _.assign(
                        {
                          "/pa/ai/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
                        },
                        playerSpecFiles
                      );
                      var playerFilesX1 = titans
                        ? _.assign(
                            {
                              "/pa/ai/unit_maps/ai_unit_map_x1.json.player": playerX1AIUnitMap,
                            },
                            playerSpecFiles
                          )
                        : {};
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

            // The commanders changed from an object notation to a string.  In order to
            // process old save games properly, we need to patch up the commander spec
            // before sending to the server.
            var fixupCommander = function (commander) {
              if (_.isObject(commander) && _.isString(commander.UnitSpec))
                return commander.UnitSpec;
              return commander;
            };

            var generateConfig = function () {
              var self = this;

              var game = self.game();
              var galaxy = game.galaxy();
              var battleGround = galaxy.stars()[game.currentStar()];
              var system = battleGround.system();
              var ai = battleGround.ai();
              var inventory = game.inventory();
              var playerColor = inventory.getTag("global", "playerColor");
              var playerCommander = inventory.getTag("global", "commander");
              var armies = [];
              var slotsArray = [];
              var aiLandingOptions = [
                "off_player_planet",
                "on_player_planet",
                "no_restriction",
              ];
              var playerName = ko
                .observable()
                .extend({ session: "displayName" });

              // Setup the player
              armies.push({
                slots: [{ name: playerName() || "Player" }],
                color: playerColor,
                econ_rate: 1,
                spec_tag: ".player",
                alliance_group: 1,
              });
              // eslint-disable-next-line lodash/prefer-map
              _.forEach(inventory.minions(), function (subcommander) {
                armies.push({
                  slots: [
                    {
                      ai: true,
                      name: subcommander.name,
                      commander: fixupCommander(subcommander.commander),
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
              var aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
              var aiTag = [];
              _.times(aiFactionCount, function (n) {
                var aiNewTag = ".ai";
                n = n.toString();
                aiNewTag = aiNewTag.concat(n);
                aiTag.push(aiNewTag);
              });
              // Setup System Faction
              ai.personality.adv_eco_mod =
                ai.personality.adv_eco_mod * ai.econ_rate;
              ai.personality.adv_eco_mod_alone =
                ai.personality.adv_eco_mod_alone * ai.econ_rate;
              if (ai.landing_policy)
                // support for old shared armies implementation
                _.times(ai.landing_policy.length, function () {
                  slotsArray.push({
                    ai: true,
                    name: ai.name,
                    commander: fixupCommander(ai.commander),
                    landing_policy: _.sample(aiLandingOptions),
                  });
                });
              else
                _.times(
                  ai.bossCommanders || ai.commanderCount || 1,
                  function () {
                    slotsArray.push({
                      ai: true,
                      name: ai.name,
                      commander: fixupCommander(ai.commander),
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
                var slotsArrayMinions = [];
                minion.personality.adv_eco_mod =
                  minion.personality.adv_eco_mod * minion.econ_rate;
                minion.personality.adv_eco_mod_alone =
                  minion.personality.adv_eco_mod_alone * minion.econ_rate;
                if (minion.landing_policy)
                  // support for old shared armies implementation
                  _.times(minion.landing_policy.length, function () {
                    slotsArrayMinions.push({
                      ai: true,
                      name: minion.name,
                      commander: fixupCommander(minion.commander),
                      landing_policy: _.sample(aiLandingOptions),
                    });
                  });
                else
                  _.times(minion.commanderCount || 1, function () {
                    slotsArrayMinions.push({
                      ai: true,
                      name: minion.name,
                      commander: fixupCommander(minion.commander),
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

              // Setup Additional Factions
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
                      commander: fixupCommander(foe.commander),
                      landing_policy: _.sample(aiLandingOptions),
                    });
                  });
                else
                  _.times(foe.commanderCount || 1, function () {
                    slotsArrayFoes.push({
                      ai: true,
                      name: foe.name,
                      commander: fixupCommander(foe.commander),
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

              var config = {
                files: self.files(),
                armies: armies,
                player: {
                  commander: fixupCommander(playerCommander),
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
                _.extend(allFiles, self.localFiles());
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
      }
    } catch (e) {
      console.error(e);
      console.error(JSON.stringify(e));
    }
  }
  gwaioSystemChanges();
}
