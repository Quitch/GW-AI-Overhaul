define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
], function (gwoAI, gwoCard, refereeAIPaths, refereeCoop, gwoRaces) {
  // The walk append, prepend and replace share. A build entry for toBuild that
  // carries idToMod (and refId/refValue, when given) is the target; otherwise
  // every test in its build_conditions that refId/refValue or matchAll selects
  // is. onBuild(build) and onTest(test) do the write.
  var forEachMatchingTarget = function (
    json,
    toBuild,
    idToMod,
    refId,
    refValue,
    matchAll,
    onBuild,
    onTest
  ) {
    _.forEach(json.build_list, function (build) {
      if (build.to_build !== toBuild) {
        return;
      }

      var validMatch =
        (_.isUndefined(refId) || _.isEqual(build[refId], refValue)) &&
        Object.prototype.hasOwnProperty.call(build, idToMod);

      if (validMatch) {
        onBuild(build);
        return;
      }

      _.forEach(build.build_conditions, function (testArray) {
        _.forEach(testArray, function (test) {
          var testMatches =
            matchAll || (!_.isUndefined(refId) && test[refId] === refValue);
          if (testMatches) {
            onTest(test);
          }
        });
      });
    });
  };

  // `json` is a parameter, not a closure capture, so this table is built once
  // at module load rather than per applyAiMods call.
  var aiModOps = {
    append: function (
      json,
      value,
      toBuild,
      idToMod,
      refId,
      refValue,
      matchAll
    ) {
      forEachMatchingTarget(
        json,
        toBuild,
        idToMod,
        refId,
        refValue,
        matchAll,
        function (build) {
          if (_.isArray(build[idToMod])) {
            build[idToMod] = build[idToMod].concat(value);
          } else {
            build[idToMod] += value;
          }
        },
        function (test) {
          if (_.isArray(test[idToMod])) {
            test[idToMod] = test[idToMod].concat(value);
          } else if (test[idToMod]) {
            test[idToMod] += value;
          }
        }
      );
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
      var arrayValue = _.isArray(value) ? value : [value];

      forEachMatchingTarget(
        json,
        toBuild,
        idToMod,
        refId,
        refValue,
        matchAll,
        function (build) {
          if (_.isArray(build[idToMod])) {
            build[idToMod] = arrayValue.concat(build[idToMod]);
          } else {
            build[idToMod] = value + build[idToMod];
          }
        },
        function (test) {
          if (_.isArray(test[idToMod])) {
            test[idToMod] = arrayValue.concat(test[idToMod]);
          } else if (test[idToMod]) {
            test[idToMod] = value + test[idToMod];
          }
        }
      );
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
      forEachMatchingTarget(
        json,
        toBuild,
        idToMod,
        refId,
        refValue,
        matchAll,
        function (build) {
          build[idToMod] = value;
        },
        function (test) {
          if (test[idToMod]) {
            test[idToMod] = value;
          }
        }
      );
    },
    // `value` is unused: this deletes the key rather than writing one.
    unset: function (json, value, toBuild, idToMod, refId, refValue, matchAll) {
      forEachMatchingTarget(
        json,
        toBuild,
        idToMod,
        refId,
        refValue,
        matchAll,
        function (build) {
          delete build[idToMod];
        },
        function (test) {
          delete test[idToMod];
        }
      );
    },
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
    new: function (json, value, toBuild, idToMod) {
      _.forEach(json.build_list, function (build) {
        if (build.to_build !== toBuild) {
          return;
        }

        if (idToMod) {
          _.forEach(build.build_conditions, function (testArray) {
            testArray.push(value);
          });
        } else if (_.isArray(build.build_conditions)) {
          build.build_conditions.push(value);
        }
      });
    },
    // template only
    squad: function (json, value, toBuild) {
      var template = json.platoon_templates && json.platoon_templates[toBuild];
      if (template && _.isArray(template.units)) {
        template.units.push(value);
      }
    },
  };

  var applyAiMods = function (json, mods) {
    _.forEach(mods, function (mod) {
      if (!Object.prototype.hasOwnProperty.call(aiModOps, mod.op)) {
        console.error("Invalid AI mod operation:", mod);
        return;
      }
      // Descriptors come from third-party cards, and this runs inside a
      // deferred callback where a throw is swallowed rather than rejected, so
      // one bad mod would hang the launch. Matches shared/specs.js.
      try {
        aiModOps[mod.op](
          json,
          mod.value,
          mod.toBuild,
          mod.idToMod,
          mod.refId,
          mod.refValue,
          mod.matchAll
        );
      } catch (e) {
        console.error("applyAiMods: op threw, skipping mod", mod, e);
      }
    });
  };

  var getRefereeInventoryAiMods = gwoAI.getInventoryAiMods;

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
    var ai = gwoAI.currentStarAi(model.game());
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
        // Undefined rather than a throw: the only caller runs inside a deferred
        // callback, where a throw is swallowed and hangs the battle launch.
        return undefined;
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
        var directory = managerPath(file.type);
        if (_.isUndefined(directory)) {
          console.error("Invalid AI file type in load mod:", file);
          return;
        }
        fileList.push("/pa/ai_tech/" + directory + file.value);
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
    var treeCache = context.treeCache;

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
      // A file a `load` pulled in from /pa/ai_tech/ is walked like any other,
      // so a card's own descriptors land on its own file unless it opts out.
      var isTechFile = filePathStarts(aiTechPath);

      return _.filter(nonLoadAiMods, function (mod) {
        return (
          mod.type === pathTypeMap[aiManager] && !(isTechFile && mod.treeOnly)
        );
      });
    };

    var changeFilePath = function (aiPath, pathLength) {
      return aiPath + filePath.slice(pathLength);
    };

    var clusterAIModsInScopeOfFile = function () {
      if (!filePathIncludes("/factory_builds/")) {
        return [];
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
      var clusterOps = clusterAIModsInScopeOfFile();
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

    var writeConfigFiles = function (json, filePaths, aiMods) {
      var finalFilePaths = _.isEmpty(filePaths) ? [filePath] : filePaths;

      applyAiMods(json, aiMods);
      _.forEach(finalFilePaths, function (finalFilePath) {
        configFiles[finalFilePath] = json;
      });
    };

    // The enemy branch takes the pre-mod originalJson so an enemy Cluster foe
    // never inherits the subcommander's tech. The player branch wants it, and
    // so uses the mutated `json`.
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

    return treeCache.getJSON(filePath).then(function (json) {
      // Only applyClusterModsIfNeeded's enemy branch reads this snapshot.
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

      // A per-viewer pass never owns the enemy's scoped destination. The base
      // pass writes it once with every connected player's mods combined;
      // recomputing it here would race that write.
      var scopedEnemyPath = forceSubCommanderScope
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
  var createTreeCache = function () {
    var listings = {};
    var files = {};
    var cached = function (store, key, produce) {
      if (!Object.prototype.hasOwnProperty.call(store, key)) {
        store[key] = produce(key);
      }
      return store[key];
    };

    return {
      list: function (aiPath) {
        return cached(listings, aiPath, function (path) {
          return api.file.list(path, true);
        });
      },
      // Callers mutate what they are handed, so the cache keeps the pristine
      // parse and hands out a copy. .then on a jQuery promise returns a new
      // promise each time, so the stored request is not consumed.
      getJSON: function (filePath) {
        return cached(files, filePath, function (path) {
          return $.getJSON("coui:/" + path);
        }).then(function (json) {
          return _.cloneDeep(json);
        });
      },
    };
  };

  // `request` carries what the whole launch shares (configFiles, aiPaths,
  // clusterPresence, treeCache) alongside the per-call inventory, scopeToken and
  // forceSubCommanderScope. Most of it is passed straight through to the
  // per-file context below.
  var processDirectories = function (aiPath, request) {
    var deferred = $.Deferred();
    var inventory = request.inventory;

    request.treeCache.list(aiPath).then(function (fileList) {
      var aisToModify = request.forceSubCommanderScope
        ? "SubCommanders"
        : whichAIsAreBeingModified(request.clusterPresence, inventory);
      var nonLoadAiMods = _.reject(getRefereeInventoryAiMods(inventory), {
        op: "load",
      });

      addApplicableAiLoadModsToFileList(
        aiPath,
        fileList,
        inventory,
        aisToModify,
        request.aiPaths
      );

      var context = {
        configFiles: request.configFiles,
        aisToModify: aisToModify,
        aiPaths: request.aiPaths,
        clusterPresence: request.clusterPresence,
        scopeToken: request.scopeToken,
        nonLoadAiMods: nonLoadAiMods,
        forceSubCommanderScope: request.forceSubCommanderScope,
        treeCache: request.treeCache,
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

  // Every race tree a battle needs: one per distinct (source, destination),
  // the race's files layered over the brain's base files, written to the
  // race's own root. AI mods are not applied to a race tree - see races.md.
  var raceTreeJobs = function (game, connectedClients) {
    var inventory = game.inventory();
    var ai = gwoAI.currentStarAi(game);
    var playerRace = gwoRaces.raceOf(inventory);
    var jobs = {};

    var add = function (type, race, destination) {
      if (gwoRaces.isMla(race)) {
        return;
      }
      var brain = gwoAI.aiInUse(type, race);
      var source = gwoAI.getAIPathSource(type, race);
      var target =
        destination || gwoAI.getAIPathDestination(type, { race: race });
      jobs[source + "|" + target] = {
        source: source,
        destination: target,
        keep: gwoRaces.treeFilter(race, brain, source),
        raceOwned: gwoRaces.raceLayerFilter(race, brain, source),
      };
    };

    add("enemy", ai.mirrorMode ? playerRace : gwoRaces.raceOf(ai));
    _.forEach(ai.foes, function (foe) {
      add("enemy", gwoRaces.raceOf(foe));
    });
    add("subcommander", playerRace);
    if (!_.isUndefined(ai.ally)) {
      add(
        "subcommander",
        _.isUndefined(ai.ally.race) ? playerRace : gwoRaces.raceOf(ai.ally)
      );
    }
    // Each viewer's own race: the host's under Separate races off, and whatever
    // they picked under it on. A viewer's destination is its own either way -
    // the race decides which brain's tree is filtered into it. See coop.md.
    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, connectedClients),
      function (viewer, viewerIndex) {
        var viewerRace = gwoRaces.raceOf(viewer.inventory);
        add(
          "subcommander",
          viewerRace,
          gwoAI.getSubcommanderPathForViewer(
            viewer.inventory,
            ".player" + viewerIndex,
            viewerRace
          )
        );
      }
    );

    return _.values(jobs);
  };

  var writeRaceTree = function (job, treeCache, configFiles) {
    return treeCache.list(job.source).then(function (fileList) {
      var kept = _.filter(fileList, job.keep);

      if (!_.some(fileList, job.raceOwned)) {
        console.warn("gwoRefereeAi: no race build orders under " + job.source);
      }

      return Promise.all(
        _.map(kept, function (filePath) {
          return treeCache.getJSON(filePath).then(function (json) {
            configFiles[job.destination + filePath.slice(job.source.length)] =
              json;
          });
        })
      );
    });
  };

  var whoIsCluster = function () {
    var game = model.game();
    var inventory = game.inventory();
    var ai = gwoAI.currentStarAi(game);
    var alliedCommanders = _.isUndefined(ai.ally)
      ? inventory.minions()
      : inventory.minions().concat(ai.ally);
    var numberOfAllies = alliedCommanders.length;
    var playerIsCluster = gwoCard.playerIsCluster(inventory);
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

  // Test-only hook - see testing.md.
  // eslint-disable-next-line no-undef
  if (typeof module !== "undefined" && module.exports) {
    // eslint-disable-next-line no-undef
    module.exports = { applyAiMods: applyAiMods, raceTreeJobs: raceTreeJobs };
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
    var ai = gwoAI.currentStarAi(game);
    var guardians = ai.mirrorMode;
    var connectedClients = refereeCoop.getConnectedViewers();
    var playerAiModInventory = guardians
      ? getInventoryWithAllPlayerAiMods(
          game.inventory(),
          game,
          connectedClients
        )
      : game.inventory();

    // Scoped to this launch, so a later battle always re-reads the tree from disk.
    var treeCache = createTreeCache();

    // Shared by every processDirectories call below; the viewer ones override
    // aiPaths, inventory and the two scope fields.
    var launch = {
      configFiles: configFiles,
      aiPaths: aiPaths,
      clusterPresence: clusterPresence,
      treeCache: treeCache,
    };

    var promises = _.map(aiPathsToProcess, function (aiPath) {
      return processDirectories(
        aiPath,
        _.assign({}, launch, {
          inventory: playerAiModInventory,
          scopeToken: undefined,
          forceSubCommanderScope: false,
        })
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

    _.forEach(raceTreeJobs(game, connectedClients), function (job) {
      promises.push(writeRaceTree(job, treeCache, configFiles));
    });

    Promise.all(promises).then(function () {
      deferred.resolve();
    });

    return deferred.promise();
  };
});
