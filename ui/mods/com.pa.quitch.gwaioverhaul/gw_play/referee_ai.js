define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
], function (gwoAI, refereeAIPaths, refereeCoop) {
  // fabber/factory/platoon ops. `json` is passed in (rather than closed over) so this
  // table is built once at module load instead of rebuilt on every applyAiMods call.
  var aiModOps = {
    // fabber/factory/platoon only
    append: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      _.forEach(json.build_list, function (build) {
        if (build.to_build !== toBuild) {
          return;
        }

        var validMatch =
          (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
          Object.prototype.hasOwnProperty.call(build, idToMod);

        if (validMatch && _.isArray(build[idToMod])) {
          build[idToMod] = build[idToMod].concat(value);
        } else if (validMatch) {
          build[idToMod] += value;
        } else {
          _.forEach(build.build_conditions, function (testArray) {
            _.forEach(testArray, function (test) {
              var testMatches =
                matchAll || (!_.isUndefined(refId) && test[refId] === refValue);
              if (testMatches) {
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
    prepend: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      _.forEach(json.build_list, function (build) {
        if (build.to_build !== toBuild) {
          return;
        }

        var validMatch =
          (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
          Object.prototype.hasOwnProperty.call(build, idToMod);

        if (validMatch && _.isArray(build[idToMod])) {
          value = _.isArray(value) ? value : [value];
          build[idToMod] = value.concat(build[idToMod]);
        } else if (validMatch) {
          build[idToMod] = value + build[idToMod];
        } else {
          _.forEach(build.build_conditions, function (testArray) {
            _.forEach(testArray, function (test) {
              var testMatches =
                matchAll || (!_.isUndefined(refId) && test[refId] === refValue);
              if (testMatches) {
                if (_.isArray(test[idToMod])) {
                  value = _.isArray(value) ? value : [value];
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
    replace: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      _.forEach(json.build_list, function (build) {
        if (build.to_build !== toBuild) {
          return;
        }

        var validMatch =
          (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
          Object.prototype.hasOwnProperty.call(build, idToMod);

        if (validMatch) {
          build[idToMod] = value;
        } else {
          _.forEach(build.build_conditions, function (testArray) {
            _.forEach(testArray, function (test) {
              var testMatches =
                matchAll || (!_.isUndefined(refId) && test[refId] === refValue);
              if (testMatches && test[idToMod]) {
                test[idToMod] = value;
              }
            });
          });
        }
      });
    },
    // fabber/factory/platoon only
    remove: function (json, value, toBuild) {
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
    new: function (json, value, toBuild, idToMod) {
      _.forEach(json.build_list, function (build) {
        if (build.to_build !== toBuild) {
          return;
        }

        if (idToMod) {
          _.forEach(build.build_conditions, function (testArray) {
            testArray.push(value);
          });
        } else {
          build.build_conditions.push(value);
        }
      });
    },
    // template only
    squad: function (json, value, toBuild) {
      if (json.platoon_templates[toBuild]) {
        json.platoon_templates[toBuild].units.push(value);
      }
    },
  };

  var applyAiMods = function (json, mods) {
    _.forEach(mods, function (mod) {
      if (!Object.prototype.hasOwnProperty.call(aiModOps, mod.op)) {
        console.error("Invalid AI mod operation:", mod);
        return;
      }
      aiModOps[mod.op](
        json,
        mod.value,
        mod.toBuild,
        mod.idToMod,
        mod.refId,
        mod.refValue,
        mod.matchAll
      );
    });
  };

  var getRefereeInventoryAiMods = function (inventory) {
    if (!inventory) {
      return [];
    }

    if (_.isFunction(inventory.aiMods)) {
      return inventory.aiMods();
    }

    return inventory.aiMods || [];
  };

  var getConnectedClientAiMods = function (game, connectedClients) {
    var connectedClientAiMods = [];

    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, connectedClients),
      function (viewer) {
        connectedClientAiMods = connectedClientAiMods.concat(
          getRefereeInventoryAiMods(viewer.inventory)
        );
      }
    );

    return connectedClientAiMods;
  };

  var getInventoryWithAllPlayerAiMods = function (
    inventory,
    game,
    connectedClients
  ) {
    var allPlayerAiMods = getRefereeInventoryAiMods(inventory).concat(
      getConnectedClientAiMods(game, connectedClients)
    );

    return {
      aiMods: function () {
        return allPlayerAiMods;
      },
    };
  };

  var whichAIsAreBeingModified = function (clusterPresence, inventory) {
    var game = model.game();
    var ai = game.galaxy().stars()[game.currentStar()].ai();
    var guardians = ai.mirrorMode;

    if (
      !_.isEmpty(getRefereeInventoryAiMods(inventory)) ||
      clusterPresence === "Player"
    ) {
      if (guardians) {
        return "All";
      } else {
        return "SubCommanders";
      }
    }
    return "None";
  };

  var managerPath = function (type) {
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

  var addApplicableAiLoadModsToFileList = function (
    aiPath,
    fileList,
    inventory,
    aisToModify,
    aiPaths
  ) {
    var isSubCommanderDirectory =
      aiPath === aiPaths.subCommanderSource ||
      aiPaths.enemySource === aiPaths.subCommanderSource;

    if (isSubCommanderDirectory || aisToModify === "All") {
      var aiLoadMods = _.filter(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      _.forEach(aiLoadMods, function (file) {
        fileList.push("/pa/ai_tech/" + managerPath(file.type) + file.value);
      });
    }
  };

  var processFilesInDirectory = function (filePath, context) {
    var configFiles = context.configFiles;
    var aisToModify = context.aisToModify;
    var aiPaths = context.aiPaths;
    var clusterPresence = context.clusterPresence;
    var scopeToken = context.scopeToken;
    var nonLoadAiMods = context.nonLoadAiMods;
    var forceSubCommanderScope = context.forceSubCommanderScope;

    var aiTechPath = "/pa/ai_tech/";

    var filePathStarts = function (filePathFragment) {
      return _.startsWith(filePath, filePathFragment);
    };

    var filePathIncludes = function (filePathFragment) {
      return _.includes(filePath, filePathFragment);
    };

    var whoseFileIsItAnyway = function (aiPaths) {
      var aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;

      if (aisShareAPath) {
        return "shared";
      } else if (filePathStarts(aiPaths.enemySource)) {
        return "enemy";
      }
      return "subcommander";
    };

    var aiModsInScopeOfFile = function () {
      if (!nonLoadAiMods.length) {
        return [];
      }

      var pathTypeMap = {
        "/fabber_builds/": "fabber",
        "/factory_builds/": "factory",
        "/platoon_builds/": "platoon",
        "/platoon_templates/": "template",
      };
      var aiManager =
        _(pathTypeMap)
          .keys()
          .find(function (key) {
            return filePathIncludes(key);
          }) || "";

      return _.filter(nonLoadAiMods, { type: pathTypeMap[aiManager] });
    };

    var changeFilePath = function (aiPath, pathLength) {
      return aiPath + filePath.slice(pathLength);
    };

    var clusterAIModsInScopeOfFile = function () {
      if (!filePathIncludes("/factory_builds/")) {
        return;
      }

      var clusterCommanders = ["SupportPlatform", "SupportCommander"];

      return _.map(clusterCommanders, function (commander) {
        return {
          type: "factory",
          op: "replace",
          toBuild: commander,
          idToMod: "priority",
          value: 0,
          matchAll: true,
        };
      });
    };

    // built on the assumption that the Guardians are never Cluster
    var processClusterJson = function (json, pathLength) {
      var clusterOps = clusterAIModsInScopeOfFile() || [];
      var clusterJson = _.cloneDeep(json);
      var clusterFilePath = changeFilePath(
        refereeAIPaths.getAIPathDestination(
          "cluster",
          gwoAI.aiInUse("subcommander"),
          {
            scopeToken: scopeToken,
          }
        ),
        pathLength
      );

      applyAiMods(clusterJson, clusterOps);
      configFiles[clusterFilePath] = clusterJson;
    };

    // Determines which destination file path(s) this file's contents apply to, and
    // which non-load AI mods (if any) are in scope, based on which AIs are being
    // modified and who owns the file.
    var resolveScopedFileUpdate = function (
      json,
      fileOwner,
      isSubCommanderTechFile,
      isSubCommanderDirectory
    ) {
      var updatedFilePaths = [];
      var aiJsonModsInScope = [];
      var pathLength = 0;

      if (aisToModify === "All") {
        if (isSubCommanderTechFile) {
          // File's source is not an AI path so it needs to be copied to the AIs' paths
          updatedFilePaths.push(
            changeFilePath(aiPaths.enemyDestination, aiTechPath.length),
            changeFilePath(aiPaths.subCommanderDestination, aiTechPath.length)
          );
        }
        aiJsonModsInScope = aiModsInScopeOfFile();
      } else if (aisToModify === "SubCommanders" && fileOwner !== "enemy") {
        if (fileOwner === "shared" && !forceSubCommanderScope) {
          // Make a clean copy of the files for enemy AIs before modification of the
          // JSON. Skipped during a per-viewer forced-subcommander pass
          // (forceSubCommanderScope) - that pass exists only to populate ITS OWN
          // viewer-scoped destination below. The shared plain key already got its one
          // authoritative write from the base (non-per-player-tech) pass over this
          // same source tree (pristine-preserved here when aisToModify is
          // "SubCommanders", or combined with every connected player's mods when
          // Guardians makes it "All" instead - see aisToModify's assignment above).
          // Re-running this per viewer would reset that write back to pristine,
          // discarding whatever the base pass combined there.
          configFiles[filePath] = _.cloneDeep(json);
        }

        if (isSubCommanderTechFile) {
          pathLength = aiTechPath.length;
        } else if (fileOwner === "shared") {
          pathLength = aiPaths.enemySource.length;
        } else if (isSubCommanderDirectory) {
          pathLength = aiPaths.subCommanderSource.length;
        }

        updatedFilePaths.push(
          changeFilePath(aiPaths.subCommanderDestination, pathLength)
        );
        aiJsonModsInScope = aiModsInScopeOfFile();
      }

      return { filePaths: updatedFilePaths, aiMods: aiJsonModsInScope };
    };

    // Scoped enemy destinations (such as Guardians) must include a full AI file tree
    // so ai_path lookups resolve against the same destination directory. This also
    // applies when the enemy and subcommander share a source directory (fileOwner
    // "shared", e.g. both using Penchant) - excluding only files owned exclusively
    // by the subcommander tree.
    var scopedEnemyDestinationPath = function (
      fileOwner,
      isSubCommanderTechFile
    ) {
      if (
        fileOwner === "subcommander" ||
        aiPaths.enemyDestination === aiPaths.enemySource
      ) {
        return null;
      }
      var pathLength = isSubCommanderTechFile
        ? aiTechPath.length
        : aiPaths.enemySource.length;
      return changeFilePath(aiPaths.enemyDestination, pathLength);
    };

    // Applies the in-scope AI mods and writes the resulting JSON to every resolved
    // destination path (falling back to the original path if none were resolved).
    var writeConfigFiles = function (json, filePaths, aiMods) {
      var finalFilePaths = _.isEmpty(filePaths) ? [filePath] : filePaths;

      applyAiMods(json, aiMods);
      _.forEach(finalFilePaths, function (finalFilePath) {
        configFiles[finalFilePath] = json;
      });
    };

    // Duplicates the JSON into a Cluster-specific file when a Cluster commander is
    // present. The enemy branch takes originalJson - a snapshot from before
    // writeConfigFiles applied the *subcommander's* aiMods to `json` - so an enemy
    // Cluster foe never inherits tech it doesn't have. The player branch
    // deliberately keeps using the mutated `json`: the player's own Cluster
    // ally/subcommander is supposed to receive that tech.
    var applyClusterModsIfNeeded = function (
      json,
      originalJson,
      fileOwner,
      isSubCommanderTechFile
    ) {
      if (clusterPresence === "Player" && fileOwner !== "enemy") {
        var pathLength = isSubCommanderTechFile
          ? aiTechPath.length
          : aiPaths.subCommanderSource.length;
        processClusterJson(json, pathLength);
      } else if (clusterPresence === "Enemy" && fileOwner !== "subcommander") {
        var enemyPathLength = isSubCommanderTechFile
          ? aiTechPath.length
          : aiPaths.enemySource.length;
        processClusterJson(originalJson, enemyPathLength);
      }
    };

    return $.getJSON("coui:/" + filePath).then(function (json) {
      // Only the Cluster-enemy branch of applyClusterModsIfNeeded reads a pristine
      // pre-mod snapshot; skip the deep clone entirely otherwise (the common case).
      var originalJson =
        clusterPresence === "Enemy" ? _.cloneDeep(json) : undefined;
      var fileOwner = whoseFileIsItAnyway(aiPaths);
      var isSubCommanderDirectory = filePathStarts(aiPaths.subCommanderSource);
      var isSubCommanderTechFile = filePathStarts(aiTechPath);

      var scopedUpdate = resolveScopedFileUpdate(
        json,
        fileOwner,
        isSubCommanderTechFile,
        isSubCommanderDirectory
      );

      // A per-viewer forced-subcommander pass (forceSubCommanderScope) never owns the
      // enemy's scoped destination (e.g. a Guardian's player_guardians/ tree) - the
      // base pass's single walk over aiPathsToProcess already combines every
      // connected player's mods and writes it there once. Computing/writing it again
      // per viewer would race that combined write, each viewer's pass clobbering the
      // last with only their own mods.
      var scopedEnemyPath = forceSubCommanderScope
        ? null
        : scopedEnemyDestinationPath(fileOwner, isSubCommanderTechFile);
      if (scopedEnemyPath) {
        // A shared source also serves as the subcommander/ally's own destination
        // (it reads the source path directly), so keep that path in the write
        // list alongside the Guardians' scoped copy rather than losing it to
        // writeConfigFiles' empty-filePaths fallback.
        if (_.isEmpty(scopedUpdate.filePaths) && fileOwner === "shared") {
          scopedUpdate.filePaths.push(filePath);
        }
        scopedUpdate.filePaths.push(scopedEnemyPath);
      }

      writeConfigFiles(json, scopedUpdate.filePaths, scopedUpdate.aiMods);
      applyClusterModsIfNeeded(
        json,
        originalJson,
        fileOwner,
        isSubCommanderTechFile
      );
    });
  };

  var processDirectories = function (
    aiPath,
    configFiles,
    aiPaths,
    clusterPresence,
    inventory,
    scopeToken,
    forceSubCommanderScope
  ) {
    var deferred = $.Deferred();

    api.file.list(aiPath, true).then(function (fileList) {
      var aisToModify = forceSubCommanderScope
        ? "SubCommanders"
        : whichAIsAreBeingModified(clusterPresence, inventory);
      var nonLoadAiMods = _.reject(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      addApplicableAiLoadModsToFileList(
        aiPath,
        fileList,
        inventory,
        aisToModify,
        aiPaths
      );

      var context = {
        configFiles: configFiles,
        aisToModify: aisToModify,
        aiPaths: aiPaths,
        clusterPresence: clusterPresence,
        scopeToken: scopeToken,
        nonLoadAiMods: nonLoadAiMods,
        forceSubCommanderScope: forceSubCommanderScope,
      };

      var promises = _.map(fileList, function (filePath) {
        if (
          !_.endsWith(filePath, ".json") ||
          _.includes(filePath, "/neural_networks/") // AIs fall back to /pa/ai/neural_networks/
        ) {
          return;
        }

        return processFilesInDirectory(filePath, context);
      });

      Promise.all(promises).then(function () {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  var whoIsCluster = function () {
    var game = model.game();
    var inventory = game.inventory();
    var ai = game.galaxy().stars()[game.currentStar()].ai();
    var alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    var numberOfAllies = alliedCommanders.length;
    var playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    var enemyIsCluster =
      gwoAI.isCluster(ai) ||
      _.some(ai.foes, function (foe) {
        return gwoAI.isCluster(foe);
      });

    if (playerIsCluster && numberOfAllies > 0) {
      return "Player";
    }
    if (enemyIsCluster) {
      return "Enemy";
    }
    return "None";
  };

  // Test-only hook: `module` does not exist in the game's Chromium UI runtime, so this
  // branch never executes in-game. It exposes applyAiMods (otherwise a private closure
  // variable define() never returns) so it can be unit-tested outside the game - see
  // test/applyAiMods.test.js. `module` is a Node/CommonJS test-only global, deliberately
  // absent from this file's normal (game-runtime) globals, hence the disables below.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { applyAiMods: applyAiMods };
  }

  // parse AI files, apply AI mods, and load the results into self.files()
  return function () {
    var deferred = $.Deferred();

    var self = this;
    var configFiles = self.files(); // JSON files passed to the server
    var aiPaths = {
      enemySource: gwoAI.getAIPathSource("enemy"),
      enemyDestination: gwoAI.getAIPathDestination("enemy"),
      subCommanderSource: gwoAI.getAIPathSource("subcommander"),
      subCommanderDestination: gwoAI.getAIPathDestination("subcommander"),
    };
    var aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;
    var aiPathsToProcess = aisShareAPath
      ? [aiPaths.enemySource]
      : [aiPaths.enemySource, aiPaths.subCommanderSource];
    var clusterPresence = whoIsCluster();
    var game = model.game();
    var ai = game.galaxy().stars()[game.currentStar()].ai();
    var guardians = ai.mirrorMode;
    var connectedClients = refereeCoop.getConnectedViewers();
    var playerAiModInventory = guardians
      ? getInventoryWithAllPlayerAiMods(
          game.inventory(),
          game,
          connectedClients
        )
      : game.inventory();

    var promises = _.map(aiPathsToProcess, function (aiPath) {
      return processDirectories(
        aiPath,
        configFiles,
        aiPaths,
        clusterPresence,
        playerAiModInventory,
        undefined,
        false
      );
    });

    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, connectedClients),
      function (viewer, viewerIndex) {
        var viewerInventory = viewer.inventory;
        var viewerPlayerTag = ".player" + viewerIndex;
        var viewerScopeToken = refereeAIPaths.getScopeToken(
          viewerPlayerTag,
          viewerPlayerTag
        );
        var viewerSubCommanderDestination = gwoAI.getSubcommanderPathForViewer(
          viewerInventory,
          viewerPlayerTag
        );
        var viewerAiPaths = _.assign({}, aiPaths, {
          subCommanderDestination: viewerSubCommanderDestination,
        });

        promises.push(
          processDirectories(
            aiPaths.subCommanderSource,
            configFiles,
            viewerAiPaths,
            clusterPresence,
            viewerInventory,
            viewerScopeToken,
            true
          )
        );
      }
    );

    Promise.all(promises).then(function () {
      deferred.resolve();
    });

    return deferred.promise();
  };
});
