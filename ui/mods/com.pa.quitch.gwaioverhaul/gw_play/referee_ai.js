define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
], (gwoAI, refereeAIPaths, refereeCoop, gwoUrl) => {
  // `json` is a parameter, not a closure capture, so this table is built once
  // at module load rather than per applyAiMods call.
  const aiModOps = {
    append: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      _.forEach(json.build_list, (build) => {
        if (build.to_build !== toBuild) {
          return;
        }

        const validMatch =
          (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
          Object.prototype.hasOwnProperty.call(build, idToMod);

        if (validMatch && _.isArray(build[idToMod])) {
          build[idToMod] = build[idToMod].concat(value);
        } else if (validMatch) {
          build[idToMod] += value;
        } else {
          _.forEach(build.build_conditions, (testArray) => {
            _.forEach(testArray, (test) => {
              const testMatches =
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
    prepend: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      // Separate from `value`: one descriptor can match both array and string
      // targets, so coercing the parameter in place corrupts the later ones.
      const arrayValue = _.isArray(value) ? value : [value];

      _.forEach(json.build_list, (build) => {
        if (build.to_build !== toBuild) {
          return;
        }

        const validMatch =
          (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
          Object.prototype.hasOwnProperty.call(build, idToMod);

        if (validMatch && _.isArray(build[idToMod])) {
          build[idToMod] = arrayValue.concat(build[idToMod]);
        } else if (validMatch) {
          build[idToMod] = value + build[idToMod];
        } else {
          _.forEach(build.build_conditions, (testArray) => {
            _.forEach(testArray, (test) => {
              const testMatches =
                matchAll || (!_.isUndefined(refId) && test[refId] === refValue);
              if (testMatches) {
                if (_.isArray(test[idToMod])) {
                  test[idToMod] = arrayValue.concat(test[idToMod]);
                } else if (test[idToMod]) {
                  test[idToMod] = value + test[idToMod];
                }
              }
            });
          });
        }
      });
    },
    replace: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      _.forEach(json.build_list, (build) => {
        if (build.to_build !== toBuild) {
          return;
        }

        const validMatch =
          (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
          Object.prototype.hasOwnProperty.call(build, idToMod);

        if (validMatch) {
          build[idToMod] = value;
        } else {
          _.forEach(build.build_conditions, (testArray) => {
            _.forEach(testArray, (test) => {
              const testMatches =
                matchAll || (!_.isUndefined(refId) && test[refId] === refValue);
              if (testMatches && test[idToMod]) {
                test[idToMod] = value;
              }
            });
          });
        }
      });
    },
    remove: function (json, value, toBuild) {
      _.forEach(json.build_list, (build) => {
        if (build.to_build !== toBuild) {
          return;
        }

        _.forEach(build.build_conditions, (testArray) => {
          _.remove(testArray, (object) => {
            if (_.isEqual(object, value)) {
              return object;
            }
          });
        });
      });
    },
    new: function (json, value, toBuild, idToMod) {
      _.forEach(json.build_list, (build) => {
        if (build.to_build !== toBuild) {
          return;
        }

        if (idToMod) {
          _.forEach(build.build_conditions, (testArray) => {
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

  const applyAiMods = (json, mods) => {
    _.forEach(mods, (mod) => {
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

  const getRefereeInventoryAiMods = (inventory) => {
    if (!inventory) {
      return [];
    }

    if (_.isFunction(inventory.aiMods)) {
      return inventory.aiMods();
    }

    return inventory.aiMods || [];
  };

  const getConnectedClientAiMods = (game, connectedClients) => {
    let connectedClientAiMods = [];

    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, connectedClients),
      (viewer) => {
        connectedClientAiMods = connectedClientAiMods.concat(
          getRefereeInventoryAiMods(viewer.inventory)
        );
      }
    );

    return connectedClientAiMods;
  };

  const getInventoryWithAllPlayerAiMods = (
    inventory,
    game,
    connectedClients
  ) => {
    const allPlayerAiMods = getRefereeInventoryAiMods(inventory).concat(
      getConnectedClientAiMods(game, connectedClients)
    );

    return {
      aiMods: function () {
        return allPlayerAiMods;
      },
    };
  };

  const whichAIsAreBeingModified = (clusterPresence, inventory) => {
    const game = model.game();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const guardians = ai.mirrorMode;

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

  const managerPath = (type) => {
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
        throw new Error(`Invalid AI file type: ${type}`);
    }
  };

  const addApplicableAiLoadModsToFileList = (
    aiPath,
    fileList,
    inventory,
    aisToModify,
    aiPaths
  ) => {
    const isSubCommanderDirectory =
      aiPath === aiPaths.subCommanderSource ||
      aiPaths.enemySource === aiPaths.subCommanderSource;

    if (isSubCommanderDirectory || aisToModify === "All") {
      const aiLoadMods = _.filter(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      _.forEach(aiLoadMods, (file) => {
        fileList.push(`/pa/ai_tech/${managerPath(file.type)}${file.value}`);
      });
    }
  };

  const processFilesInDirectory = (filePath, context) => {
    const configFiles = context.configFiles;
    const aisToModify = context.aisToModify;
    const aiPaths = context.aiPaths;
    const clusterPresence = context.clusterPresence;
    const scopeToken = context.scopeToken;
    const nonLoadAiMods = context.nonLoadAiMods;
    const forceSubCommanderScope = context.forceSubCommanderScope;
    const treeCache = context.treeCache;

    const aiTechPath = "/pa/ai_tech/";

    const filePathStarts = (filePathFragment) =>
      _.startsWith(filePath, filePathFragment);

    const filePathIncludes = (filePathFragment) =>
      _.includes(filePath, filePathFragment);

    const whoseFileIsItAnyway = (aiPaths) => {
      const aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;

      if (aisShareAPath) {
        return "shared";
      } else if (filePathStarts(aiPaths.enemySource)) {
        return "enemy";
      }
      return "subcommander";
    };

    const aiModsInScopeOfFile = () => {
      if (!nonLoadAiMods.length) {
        return [];
      }

      const pathTypeMap = {
        "/fabber_builds/": "fabber",
        "/factory_builds/": "factory",
        "/platoon_builds/": "platoon",
        "/platoon_templates/": "template",
      };
      const aiManager =
        _(pathTypeMap)
          .keys()
          .find((key) => filePathIncludes(key)) || "";

      return _.filter(nonLoadAiMods, { type: pathTypeMap[aiManager] });
    };

    const changeFilePath = (aiPath, pathLength) =>
      aiPath + filePath.slice(pathLength);

    const clusterAIModsInScopeOfFile = () => {
      if (!filePathIncludes("/factory_builds/")) {
        return;
      }

      const clusterCommanders = ["SupportPlatform", "SupportCommander"];

      return _.map(clusterCommanders, (commander) => ({
        type: "factory",
        op: "replace",
        toBuild: commander,
        idToMod: "priority",
        value: 0,
        matchAll: true,
      }));
    };

    // built on the assumption that the Guardians are never Cluster
    const processClusterJson = (json, pathLength) => {
      const clusterOps = clusterAIModsInScopeOfFile() || [];
      const clusterJson = _.cloneDeep(json);
      const clusterFilePath = changeFilePath(
        refereeAIPaths.getAIPathDestination(
          "cluster",
          gwoAI.aiInUse("subcommander"),
          {
            scopeToken,
          }
        ),
        pathLength
      );

      applyAiMods(clusterJson, clusterOps);
      configFiles[clusterFilePath] = clusterJson;
    };

    const resolveScopedFileUpdate = (
      json,
      fileOwner,
      isSubCommanderTechFile,
      isSubCommanderDirectory
    ) => {
      const updatedFilePaths = [];
      let aiJsonModsInScope = [];
      let pathLength = 0;

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
          // A clean copy for enemy AIs, before the JSON is modified. The base
          // pass already wrote this key authoritatively, so re-running it per
          // viewer would reset that write back to pristine.
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

    // A scoped enemy destination (Guardians) needs a full AI file tree so its
    // ai_path lookups resolve inside it. Only subcommander-owned files are excluded.
    const scopedEnemyDestinationPath = (fileOwner, isSubCommanderTechFile) => {
      if (
        fileOwner === "subcommander" ||
        aiPaths.enemyDestination === aiPaths.enemySource
      ) {
        return null;
      }
      const pathLength = isSubCommanderTechFile
        ? aiTechPath.length
        : aiPaths.enemySource.length;
      return changeFilePath(aiPaths.enemyDestination, pathLength);
    };

    const writeConfigFiles = (json, filePaths, aiMods) => {
      const finalFilePaths = _.isEmpty(filePaths) ? [filePath] : filePaths;

      applyAiMods(json, aiMods);
      _.forEach(finalFilePaths, (finalFilePath) => {
        configFiles[finalFilePath] = json;
      });
    };

    // The enemy branch takes the pre-mod originalJson so an enemy Cluster foe
    // never inherits the subcommander's tech. The player branch wants it, and
    // so uses the mutated `json`.
    const applyClusterModsIfNeeded = (
      json,
      originalJson,
      fileOwner,
      isSubCommanderTechFile
    ) => {
      if (clusterPresence === "Player" && fileOwner !== "enemy") {
        const pathLength = isSubCommanderTechFile
          ? aiTechPath.length
          : aiPaths.subCommanderSource.length;
        processClusterJson(json, pathLength);
      } else if (clusterPresence === "Enemy" && fileOwner !== "subcommander") {
        const enemyPathLength = isSubCommanderTechFile
          ? aiTechPath.length
          : aiPaths.enemySource.length;
        processClusterJson(originalJson, enemyPathLength);
      }
    };

    return treeCache.getJSON(filePath).then((json) => {
      // Only applyClusterModsIfNeeded's enemy branch reads this snapshot.
      const originalJson =
        clusterPresence === "Enemy" ? _.cloneDeep(json) : undefined;
      const fileOwner = whoseFileIsItAnyway(aiPaths);
      const isSubCommanderDirectory = filePathStarts(
        aiPaths.subCommanderSource
      );
      const isSubCommanderTechFile = filePathStarts(aiTechPath);

      const scopedUpdate = resolveScopedFileUpdate(
        json,
        fileOwner,
        isSubCommanderTechFile,
        isSubCommanderDirectory
      );

      // A per-viewer pass never owns the enemy's scoped destination. The base
      // pass writes it once with every connected player's mods combined;
      // recomputing it here would race that write.
      const scopedEnemyPath = forceSubCommanderScope
        ? null
        : scopedEnemyDestinationPath(fileOwner, isSubCommanderTechFile);
      if (scopedEnemyPath) {
        // A shared source is also the subcommander's own destination, so it must
        // stay in the write list rather than fall to writeConfigFiles' fallback.
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

  // One launch walks the same build trees once per tree and once per connected
  // viewer, so caching keeps that cost flat rather than scaling with co-op size.
  const createTreeCache = () => {
    const listings = {};
    const files = {};
    const cached = (store, key, produce) => {
      if (!Object.prototype.hasOwnProperty.call(store, key)) {
        store[key] = produce(key);
      }
      return store[key];
    };

    return {
      list: function (aiPath) {
        return cached(listings, aiPath, (path) => api.file.list(path, true));
      },
      // Callers mutate what they are handed, so the cache keeps the pristine
      // parse and hands out a copy. .then on a jQuery promise returns a new
      // promise each time, so the stored request is not consumed.
      getJSON: function (filePath) {
        return cached(files, filePath, (path) =>
          $.getJSON(gwoUrl.gameFile(path))
        ).then((json) => _.cloneDeep(json));
      },
    };
  };

  // `request` carries what the whole launch shares (configFiles, aiPaths,
  // clusterPresence, treeCache) alongside the per-call inventory, scopeToken and
  // forceSubCommanderScope. Most of it is passed straight through to the
  // per-file context below.
  const processDirectories = (aiPath, request) => {
    const deferred = $.Deferred();
    const inventory = request.inventory;

    request.treeCache.list(aiPath).then((fileList) => {
      const aisToModify = request.forceSubCommanderScope
        ? "SubCommanders"
        : whichAIsAreBeingModified(request.clusterPresence, inventory);
      const nonLoadAiMods = _.reject(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      addApplicableAiLoadModsToFileList(
        aiPath,
        fileList,
        inventory,
        aisToModify,
        request.aiPaths
      );

      const context = {
        configFiles: request.configFiles,
        aisToModify,
        aiPaths: request.aiPaths,
        clusterPresence: request.clusterPresence,
        scopeToken: request.scopeToken,
        nonLoadAiMods,
        forceSubCommanderScope: request.forceSubCommanderScope,
        treeCache: request.treeCache,
      };

      const promises = _.map(fileList, (filePath) => {
        if (
          !_.endsWith(filePath, ".json") ||
          _.includes(filePath, "/neural_networks/") // AIs fall back to /pa/ai/neural_networks/
        ) {
          return;
        }

        return processFilesInDirectory(filePath, context);
      });

      Promise.all(promises).then(() => {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  const whoIsCluster = () => {
    const game = model.game();
    const inventory = game.inventory();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    const numberOfAllies = alliedCommanders.length;
    const playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    const enemyIsCluster =
      gwoAI.isCluster(ai) || _.some(ai.foes, (foe) => gwoAI.isCluster(foe));

    if (playerIsCluster && numberOfAllies > 0) {
      return "Player";
    }
    if (enemyIsCluster) {
      return "Enemy";
    }
    return "None";
  };

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { applyAiMods };
  }

  // parse AI files, apply AI mods, and load the results into self.files()
  return function () {
    const deferred = $.Deferred();

    const self = this;
    const configFiles = self.files(); // JSON files passed to the server
    const aiPaths = {
      enemySource: gwoAI.getAIPathSource("enemy"),
      enemyDestination: gwoAI.getAIPathDestination("enemy"),
      subCommanderSource: gwoAI.getAIPathSource("subcommander"),
      subCommanderDestination: gwoAI.getAIPathDestination("subcommander"),
    };
    const aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;
    const aiPathsToProcess = aisShareAPath
      ? [aiPaths.enemySource]
      : [aiPaths.enemySource, aiPaths.subCommanderSource];
    const clusterPresence = whoIsCluster();
    const game = model.game();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const guardians = ai.mirrorMode;
    const connectedClients = refereeCoop.getConnectedViewers();
    const playerAiModInventory = guardians
      ? getInventoryWithAllPlayerAiMods(
          game.inventory(),
          game,
          connectedClients
        )
      : game.inventory();

    // Scoped to this launch, so a later battle always re-reads the tree from disk.
    const treeCache = createTreeCache();

    // Shared by every processDirectories call below; the viewer ones override
    // aiPaths, inventory and the two scope fields.
    const launch = {
      configFiles,
      aiPaths,
      clusterPresence,
      treeCache,
    };

    const promises = _.map(aiPathsToProcess, (aiPath) =>
      processDirectories(
        aiPath,
        _.assign({}, launch, {
          inventory: playerAiModInventory,
          scopeToken: undefined,
          forceSubCommanderScope: false,
        })
      )
    );

    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, connectedClients),
      (viewer, viewerIndex) => {
        const viewerInventory = viewer.inventory;
        const viewerPlayerTag = `.player${viewerIndex}`;
        const viewerScopeToken = refereeAIPaths.getScopeToken(
          viewerPlayerTag,
          viewerPlayerTag
        );
        const viewerSubCommanderDestination =
          gwoAI.getSubcommanderPathForViewer(viewerInventory, viewerPlayerTag);
        const viewerAiPaths = _.assign({}, aiPaths, {
          subCommanderDestination: viewerSubCommanderDestination,
        });

        promises.push(
          processDirectories(
            aiPaths.subCommanderSource,
            _.assign({}, launch, {
              aiPaths: viewerAiPaths,
              inventory: viewerInventory,
              scopeToken: viewerScopeToken,
              forceSubCommanderScope: true,
            })
          )
        );
      }
    );

    Promise.all(promises).then(() => {
      deferred.resolve();
    });

    return deferred.promise();
  };
});
