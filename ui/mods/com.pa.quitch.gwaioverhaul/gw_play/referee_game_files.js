define([
  "shared/gw_common",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
], function (GW, gwoUnit, gwoAI) {
  const clusterArmyIndex = function (ai) {
    const guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (ai.faction === 4) {
      return 0;
    } else if (ai.foes) {
      const index = _.findIndex(ai.foes, function (foe) {
        return gwoAI.isCluster(foe);
      });
      if (index !== -1) {
        return index + 1;
      }
    }
    return -1;
  };

  const flattenBaseSpecs = function (spec, specs, tag) {
    if (!Object.prototype.hasOwnProperty.call(spec, "base_spec")) {
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

    const flattenedSpec = flattenBaseSpecs(base, specs, tag);

    if (_.isArray(spec.ammo_id) && flattenedSpec.ammo_id) {
      // avoid issues with _.merge()
      delete flattenedSpec.ammo_id;
    }

    return _.merge({}, flattenedSpec, spec);
  };

  // to support custom ops
  const modSpecs = function (specs, mods, specTag) {
    const load = function (specId) {
      var taggedId = specId;
      if (!Object.prototype.hasOwnProperty.call(specs, taggedId)) {
        taggedId = specId + specTag;
        if (!Object.prototype.hasOwnProperty.call(specs, taggedId)) {
          return;
        }
      }
      var result = specs[taggedId];
      if (result) {
        specs[taggedId] = result = flattenBaseSpecs(result, specs, specTag);
      }
      return result;
    };

    const ops = {
      multiply: function (attribute, value) {
        return _.isNumber(attribute) ? attribute * value : 0;
      },
      add: function (attribute, value) {
        return _.isNumber(attribute) || _.isString(attribute)
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
        const cleanAttribute = attribute.slice(
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
      // New op to prepend to arrays
      prepend: function prepend(attribute, value) {
        if (!_.isArray(attribute)) {
          attribute = _.isEmpty(attribute) ? [] : [attribute];
        }
        attribute.unshift(value);
        if (_.isArray(value)) {
          attribute = _.flatten(attribute);
        }
        return attribute;
      },
      multiplyOrAdd: function (attribute, value) {
        return _.isNumber(attribute) ? attribute * value : value;
      },
    };

    const applyMod = function (mod) {
      var spec = load(mod.file);
      if (!spec) {
        return console.warn("Warning: File not found in mod", mod);
      }
      if (!Object.prototype.hasOwnProperty.call(ops, mod.op)) {
        return console.error("Invalid operation in mod", mod);
      }

      const originalPath = (mod.path || "").split(".");
      const path = originalPath.reverse();

      const reportError = function (error, step) {
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
      };

      const opDefaults = {
        push: [],
        pull: [],
      };

      const cookStep = function (step, op) {
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
          spec[step] = op ? opDefaults[op] || {} : {};
        }
        return step;
      };

      while (path.length > 1) {
        var level = path.pop();
        cookStep(level);

        if (_.isString(spec[level])) {
          var newSpec = load(spec[level]);
          if (!newSpec) {
            reportError("Undefined mod spec encountered,", level);
            return;
          }
          spec = newSpec;
        } else if (_.isObject(spec[level])) {
          spec = spec[level];
        } else {
          reportError("Invalid attribute encountered,", level);
          return;
        }
      }

      if (path.length && path[0]) {
        const leaf = cookStep(path[0], mod.op);
        spec[leaf] = ops[mod.op](spec[leaf], mod.value);
      } else {
        ops[mod.op](spec, mod.value);
      }
    };
    _.forEach(mods, applyMod);
  };

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

  const getAIUnitMapPath = function (titans, aiInUse) {
    const append = titans ? "_x1.json" : ".json";

    switch (aiInUse) {
      case "Queller":
        return "/pa/ai_queller/q_uber/unit_maps/ai_unit_map" + append;
      case "Penchant":
        return "/pa/ai_penchant/unit_maps/ai_unit_map" + append;
      default:
        return "/pa/ai/unit_maps/ai_unit_map" + append;
    }
  };

  return function () {
    const self = this;

    // Game file generation cannot use previously mounted files.  That would be bad.
    const done = $.Deferred();

    // community mods will hook unmountAllMemoryFiles to remount client mods
    api.file.unmountAllMemoryFiles().always(function () {
      const titans = api.content.usingTitans();

      const game = self.game();
      const ai = game.galaxy().stars()[game.currentStar()].ai();
      const aiFactionCount = ai.foes ? 1 + ai.foes.length : 1;
      const aiTag = [];
      const aiFactions = [];
      _.times(aiFactionCount, function (n) {
        const aiNewTag = ".ai" + n;
        aiTag.push(aiNewTag);
        aiFactions.push($.Deferred());
      });

      const playerFileGen = $.Deferred();
      const filesToProcess = [playerFileGen];

      const aiInUse = gwoAI.aiInUse();
      const aiUnitMapPath = getAIUnitMapPath(false, aiInUse);
      const aiUnitMapTitansPath = getAIUnitMapPath(true, aiInUse);

      const unitsLoad = $.get("spec://pa/units/unit_list.json");
      const aiMapLoad = $.get("spec:/" + aiUnitMapPath);
      const aiX1MapLoad = titans ? $.get("spec:/" + aiUnitMapTitansPath) : {};
      $.when(unitsLoad, aiMapLoad, aiX1MapLoad).then(
        function (unitsGet, aiMapGet, aiX1MapGet) {
          const inventory = self.game().inventory();

          const units = parse(unitsGet[0]).units;
          const aiUnitMap = parse(aiMapGet[0]);
          const aiX1UnitMap = parse(aiX1MapGet[0]);
          const clusterUnitMapPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map.json";
          const clusterUnitMapTitansPath =
            "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json";
          _.times(aiFactionCount, function (n) {
            const currentCount = n;
            const enemyAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, aiTag[n]);
            const enemyX1AIUnitMap = GW.specs.genAIUnitMap(
              aiX1UnitMap,
              aiTag[n]
            );
            const aiSpecs = units.concat(model.gwoSpecs);

            GW.specs
              .genUnitSpecs(aiSpecs, aiTag[n])
              .then(function (aiSpecFiles) {
                var unitMapPath = aiUnitMapPath;
                var unitMapTitansPath = aiUnitMapTitansPath;
                if (clusterArmyIndex(ai) === currentCount) {
                  unitMapPath = clusterUnitMapPath;
                  unitMapTitansPath = clusterUnitMapTitansPath;
                }

                const enemyAIUnitMapFile = unitMapPath + aiTag[n];
                const enemyAIUnitMapPair = {};
                enemyAIUnitMapPair[enemyAIUnitMapFile] = enemyAIUnitMap;
                const enemyX1AIUnitMapFile = unitMapTitansPath + aiTag[n];
                const enemyX1AIUnitMapPair = {};
                enemyX1AIUnitMapPair[enemyX1AIUnitMapFile] = enemyX1AIUnitMap;
                const aiFilesClassic = _.assign(
                  enemyAIUnitMapPair,
                  aiSpecFiles
                );
                const aiFilesX1 = titans
                  ? _.assign(enemyX1AIUnitMapPair, aiSpecFiles)
                  : {};
                const aiFiles = _.assign({}, aiFilesClassic, aiFilesX1);

                if (ai.inventory) {
                  var aiInventory =
                    currentCount === 0
                      ? ai.inventory
                      : ai.foes[currentCount - 1].inventory;
                  const guardians = ai.mirrorMode;
                  if (guardians) {
                    aiInventory = aiInventory.concat(inventory.mods());
                  }
                  modSpecs(aiFiles, aiInventory, aiTag[n]);
                }
                aiFactions[currentCount].resolve(aiFiles);
              });
          });

          const playerTag = ".player";

          const playerAIUnitMap = GW.specs.genAIUnitMap(aiUnitMap, playerTag);
          const playerX1AIUnitMap = titans
            ? GW.specs.genAIUnitMap(aiX1UnitMap, playerTag)
            : {};
          const additionalPlayerSpecs = _.isUndefined(ai.ally)
            ? model.gwoSpecs
            : model.gwoSpecs.concat(ai.ally.commander);
          const playerSpecs = inventory.units().concat(additionalPlayerSpecs);

          GW.specs
            .genUnitSpecs(playerSpecs, playerTag)
            .then(function (playerSpecFiles) {
              var playerFilesClassic = {};
              var playerFilesX1 = {};
              const playerIsCluster =
                inventory.getTag("global", "playerFaction") === 4;
              const guardians = ai.mirrorMode;
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
                aiInUse === "Queller" &&
                _.some(inventory.cards(), {
                  id: "gwaio_upgrade_subcommander_tactics",
                })
              ) {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_queller/q_silver/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_queller/q_silver/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              } else if (aiInUse === "Queller") {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_queller/q_bronze/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_queller/q_bronze/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              } else if (!_.isEmpty(inventory.aiMods()) && !guardians) {
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
              } else if (aiInUse === "Penchant") {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai_penchant/unit_maps/ai_unit_map.json.player":
                      playerAIUnitMap,
                  },
                  playerSpecFiles
                );
                playerFilesX1 = titans
                  ? _.assign(
                      {
                        "/pa/ai_penchant/unit_maps/ai_unit_map_x1.json.player":
                          playerX1AIUnitMap,
                      },
                      playerSpecFiles
                    )
                  : {};
              } else {
                playerFilesClassic = _.assign(
                  {
                    "/pa/ai/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
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
              const playerFiles = _.assign(
                {},
                playerFilesClassic,
                playerFilesX1
              );
              modSpecs(playerFiles, inventory.mods(), playerTag);
              playerFileGen.resolve(playerFiles);
            });
        }
      );

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
});
