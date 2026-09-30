define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_coop.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/referee_game_file_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/unit_cells.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_trees.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_ai_mods.js",
], function (
  gwoAI,
  gwoCard,
  refereeAIPaths,
  refereeCoop,
  gwoRaces,
  gameFilePaths,
  unitCells,
  raceTrees,
  raceAiMods
) {
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
            return _.isEqual(object, value);
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
    // value: { builders: [...], except: [...] }. Zeroes every build whose
    // builders all sit in value.builders, bar the to_builds in value.except.
    silence: function (json, value) {
      _.forEach(json.build_list, function (build) {
        var inScope =
          _.isArray(build.builders) &&
          build.builders.length &&
          _.every(build.builders, function (builder) {
            return _.includes(value.builders, builder);
          });
        if (inScope && !_.includes(value.except, build.to_build)) {
          build.priority = 0;
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
        console.error("Invalid AI mod operation: " + JSON.stringify(mod));
        return;
      }
      // Descriptors come from third-party cards, and this runs inside a
      // deferred callback where a throw is swallowed rather than rejected, so
      // one bad mod would hang the launch. Matches gw_play/specs.js.
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
        console.error(
          "applyAiMods: op threw, skipping mod " +
            JSON.stringify(mod) +
            ": " +
            ((e && e.stack) || e)
        );
      }
    });
  };

  var getRefereeInventoryAiMods = gwoAI.getInventoryAiMods;

  // As getInventoryAiMods reads aiMods: an observable on the host's, an array
  // on a record's.
  var getRefereeInventoryMods = function (inventory) {
    if (_.isFunction(inventory.mods)) {
      return inventory.mods();
    }

    return inventory.mods || [];
  };

  // Every other player's inventory: the connected viewers' and, under
  // per-player tech, the co-op AI players'.
  var getConnectedClientInventories = function (game, connectedClients) {
    return _.pluck(
      refereeCoop
        .getConnectedViewerInventories(game, connectedClients)
        .concat(refereeCoop.getCoopAiInventories(game)),
      "inventory"
    );
  };

  var getConnectedClientAiMods = function (game, connectedClients) {
    var connectedClientAiMods = [];

    _.forEach(
      getConnectedClientInventories(game, connectedClients),
      function (inventory) {
        connectedClientAiMods = connectedClientAiMods.concat(
          getRefereeInventoryAiMods(inventory)
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

  var aiTechPath = raceAiMods.AI_TECH_PATH;

  var loadModFilePath = function (mod) {
    var filePath = raceAiMods.loadPath(mod);
    if (_.isUndefined(filePath)) {
      console.error("Invalid AI file type in load mod: " + JSON.stringify(mod));
    }
    return filePath;
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
        var filePath = loadModFilePath(file);
        if (filePath) {
          fileList.push(filePath);
        }
      });
    }
  };

  var pathTypeMap = {
    "/fabber_builds/": "fabber",
    "/factory_builds/": "factory",
    "/platoon_builds/": "platoon",
    "/platoon_templates/": "template",
  };

  var isLoadFile = function (filePath) {
    return _.startsWith(filePath, aiTechPath);
  };

  var fileOwner = function (filePath, aiPaths) {
    var aisShareAPath = aiPaths.enemySource === aiPaths.subCommanderSource;

    if (aisShareAPath) {
      return "shared";
    } else if (_.startsWith(filePath, aiPaths.enemySource)) {
      return "enemy";
    }
    return "subcommander";
  };

  var classifyFile = function (filePath, aiPaths) {
    return {
      path: filePath,
      owner: fileOwner(filePath, aiPaths),
      isLoadFile: isLoadFile(filePath),
      inSubCommanderSource: _.startsWith(filePath, aiPaths.subCommanderSource),
    };
  };

  var aiModsInScopeOfFile = function (file, context) {
    if (!context.nonLoadAiMods.length) {
      return [];
    }

    var aiManager =
      _(pathTypeMap)
        .keys()
        .find(function (key) {
          return _.includes(file.path, key);
        }) || "";

    // A file a `load` pulled in from /pa/ai_tech/ is walked like any other,
    // so a card's own descriptors land on its own file unless it opts out.
    return _.filter(context.nonLoadAiMods, function (mod) {
      return (
        mod.type === pathTypeMap[aiManager] &&
        !(file.isLoadFile && mod.treeOnly)
      );
    });
  };

  var rebaseFilePath = function (filePath, destination, sourceLength) {
    return destination + filePath.slice(sourceLength);
  };

  var subCommanderSourceLength = function (file, aiPaths) {
    var sourceLength = 0;

    if (file.isLoadFile) {
      sourceLength = aiTechPath.length;
    } else if (file.owner === "shared") {
      sourceLength = aiPaths.enemySource.length;
    } else if (file.inSubCommanderSource) {
      sourceLength = aiPaths.subCommanderSource.length;
    }

    return sourceLength;
  };

  // A scoped enemy destination (Guardians) needs a full AI file tree so its
  // ai_path lookups resolve inside it. Only subcommander-owned files are excluded.
  var scopedEnemyDestinationPath = function (file, aiPaths) {
    if (
      file.owner === "subcommander" ||
      aiPaths.enemyDestination === aiPaths.enemySource
    ) {
      return null;
    }
    var sourceLength = file.isLoadFile
      ? aiTechPath.length
      : aiPaths.enemySource.length;
    return rebaseFilePath(file.path, aiPaths.enemyDestination, sourceLength);
  };

  var resolveWrites = function (file, context) {
    var aiPaths = context.aiPaths;
    var writes = { cleanCopy: false, filePaths: [], aiMods: [] };

    if (context.aisToModify === "All") {
      if (file.isLoadFile) {
        // File's source is not an AI path so it needs to be copied to the AIs' paths
        writes.filePaths.push(
          rebaseFilePath(
            file.path,
            aiPaths.enemyDestination,
            aiTechPath.length
          ),
          rebaseFilePath(
            file.path,
            aiPaths.subCommanderDestination,
            aiTechPath.length
          )
        );
      }
      writes.aiMods = aiModsInScopeOfFile(file, context);
    } else if (
      context.aisToModify === "SubCommanders" &&
      file.owner !== "enemy"
    ) {
      // A clean copy for enemy AIs, before the JSON is modified. The base
      // pass already wrote this key authoritatively, so re-running it per
      // viewer would reset that write back to pristine. A load file has
      // none: no enemy reads /pa/ai_tech/.
      writes.cleanCopy =
        file.owner === "shared" &&
        !context.forceSubCommanderScope &&
        !file.isLoadFile;
      writes.filePaths.push(
        rebaseFilePath(
          file.path,
          aiPaths.subCommanderDestination,
          subCommanderSourceLength(file, aiPaths)
        )
      );
      writes.aiMods = aiModsInScopeOfFile(file, context);
    }

    // A per-viewer pass never owns the enemy's scoped destination. The base
    // pass writes it once with every connected player's mods combined;
    // recomputing it here would race that write.
    var scopedEnemyPath = context.forceSubCommanderScope
      ? null
      : scopedEnemyDestinationPath(file, aiPaths);
    if (scopedEnemyPath) {
      // A shared source is also the subcommander's own destination, so it must
      // stay in the write list rather than fall to writeConfigFiles' fallback.
      if (_.isEmpty(writes.filePaths) && file.owner === "shared") {
        writes.filePaths.push(file.path);
      }
      writes.filePaths.push(scopedEnemyPath);
    }

    return writes;
  };

  var writeConfigFiles = function (file, context, json, writes) {
    var finalFilePaths = _.isEmpty(writes.filePaths)
      ? [file.path]
      : writes.filePaths;

    if (writes.cleanCopy) {
      context.configFiles[file.path] = _.cloneDeep(json);
    }
    applyAiMods(json, writes.aiMods);
    _.forEach(finalFilePaths, function (finalFilePath) {
      context.configFiles[finalFilePath] = json;
    });
  };

  var clusterOpsForFile = function (filePath) {
    if (!_.includes(filePath, "/factory_builds/")) {
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

  // Relies on the Guardians never being Cluster. See ai-paths.md,
  // "Invariants".
  var writeClusterFile = function (file, context, json, sourceLength) {
    var clusterOps = clusterOpsForFile(file.path);
    var clusterJson = _.cloneDeep(json);
    var clusterFilePath = rebaseFilePath(
      file.path,
      refereeAIPaths.getAIPathDestination(
        "cluster",
        gwoAI.aiInUse("subcommander")
      ),
      sourceLength
    );

    applyAiMods(clusterJson, clusterOps);
    context.configFiles[clusterFilePath] = clusterJson;
  };

  // The enemy branch takes the pre-mod originalJson so an enemy Cluster foe
  // never inherits the subcommander's tech, and skips a /pa/ai_tech/ file
  // outright, since that is the player's tech by definition. The player
  // branch wants it, and so uses the mutated `json`.
  var writeClusterCopy = function (file, context, json, originalJson) {
    var aiPaths = context.aiPaths;

    if (context.clusterPresence === "Player" && file.owner !== "enemy") {
      var sourceLength = file.isLoadFile
        ? aiTechPath.length
        : aiPaths.subCommanderSource.length;
      writeClusterFile(file, context, json, sourceLength);
    } else if (
      context.clusterPresence === "Enemy" &&
      file.owner !== "subcommander" &&
      !file.isLoadFile
    ) {
      writeClusterFile(file, context, originalJson, aiPaths.enemySource.length);
    }
  };

  var writeFileCopies = function (filePath, context, json) {
    // Only writeClusterCopy's enemy branch reads this snapshot.
    var originalJson =
      context.clusterPresence === "Enemy" ? _.cloneDeep(json) : undefined;
    var file = classifyFile(filePath, context.aiPaths);
    var writes = resolveWrites(file, context);

    writeConfigFiles(file, context, json, writes);
    writeClusterCopy(file, context, json, originalJson);
  };

  // Nothing checks a third-party card's load target, so an unreadable one is
  // skipped rather than failing the battle. A failure after the read rejects.
  var skipUnreadableLoadFile = function (filePath, error) {
    if (!isLoadFile(filePath)) {
      throw error;
    }
    console.error(
      "AI file of a load mod not read, skipped: " +
        filePath +
        " (" +
        gameFilePaths.describeError(error) +
        ")"
    );
  };

  var processFile = function (filePath, context) {
    return context.treeCache.getJSON(filePath).then(
      function (json) {
        writeFileCopies(filePath, context, json);
      },
      function (error) {
        skipUnreadableLoadFile(filePath, error);
      }
    );
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

    // Callers mutate what they are handed, so the cache keeps the pristine
    // result and hands out a copy. Each request is held as a native promise:
    // the engine's never settles a .then() given no error callback when the
    // call fails, and jQuery's lets a callback's throw escape. See
    // ai-pipeline.md, "The tree cache".
    return {
      list: function (aiPath) {
        return cached(listings, aiPath, function (path) {
          return Promise.resolve(api.file.list(path, true));
        }).then(function (fileList) {
          return fileList.slice();
        });
      },
      getJSON: function (filePath) {
        return cached(files, filePath, function (path) {
          return Promise.resolve($.getJSON("coui:/" + path));
        }).then(function (json) {
          return _.cloneDeep(json);
        });
      },
    };
  };

  // `request` carries what the whole launch shares (configFiles, aiPaths,
  // clusterPresence, treeCache) alongside the per-call inventory and
  // forceSubCommanderScope. Most of it is passed straight through to the
  // per-file context below.
  var processDirectories = function (aiPath, request) {
    var deferred = $.Deferred();
    var inventory = request.inventory;
    // The listing and every file reject through `fail`. Nothing reads the
    // promise the listing's callback returns, so that callback catches its own.
    var fail = function (error) {
      deferred.reject(error);
    };

    var processList = function (fileList) {
      try {
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
          nonLoadAiMods: nonLoadAiMods,
          forceSubCommanderScope: request.forceSubCommanderScope,
          treeCache: request.treeCache,
        };

        var inRaceLayer = raceTrees.raceLayerTest();
        var promises = _.map(fileList, function (filePath) {
          if (
            !_.endsWith(filePath, ".json") ||
            _.includes(filePath, "/neural_networks/") || // AIs fall back to /pa/ai/neural_networks/
            inRaceLayer(filePath) // a race's files belong to its own tree - see races.md
          ) {
            return;
          }

          return processFile(filePath, context);
        });

        Promise.all(promises).then(function () {
          deferred.resolve();
        }, fail);
      } catch (error) {
        fail(error);
      }
    };

    request.treeCache.list(aiPath).then(processList, fail);

    return deferred.promise();
  };

  // Every race tree a battle needs: one per distinct (source, destination),
  // the race's files layered over the brain's base files, written to the
  // race's own root. Each takes the AI mods of the inventories whose mods the
  // MLA tree in its place would take. See races.md, "Race trees".
  var raceTreeJobs = function (game, connectedClients, coopAis) {
    var inventory = game.inventory();
    var ai = gwoAI.currentStarAi(game);
    var playerRace = gwoRaces.raceOf(inventory);
    var guardians = ai.mirrorMode;
    var everyPlayer = [inventory].concat(
      getConnectedClientInventories(game, connectedClients)
    );
    var jobs = {};

    // modInventories: whose AI mods the tree takes.
    var add = function (
      type,
      race,
      destination,
      sourceInventory,
      modInventories
    ) {
      if (gwoRaces.isMla(race)) {
        return;
      }
      var brain = gwoAI.aiInUse(type, race);
      var source = gwoAI.getAIPathSource(type, race, sourceInventory);
      var target =
        destination || gwoAI.getAIPathDestination(type, { race: race });
      var tree = raceTrees.treeContext(race, brain, source);
      var inventories = modInventories || [];
      jobs[source + "|" + target] = {
        source: source,
        destination: target,
        keep: raceTrees.treeFilter(tree),
        raceOwned: raceTrees.raceLayerFilter(tree),
        stockBuild: raceTrees.stockBuildFilter(tree),
        aiMods: _.flatten(_.map(inventories, getRefereeInventoryAiMods)),
        remade: unitCells.remadeFiles(
          _.flatten(_.map(inventories, getRefereeInventoryMods))
        ),
        keys: function () {
          return gameFilePaths.raceKeysFor({
            race: race,
            brain: brain,
            source: source,
            unitCells: unitCells,
            gwoRaces: gwoRaces,
          });
        },
      };
    };

    var enemyMods = guardians ? everyPlayer : [];
    var hostSubCommanderMods = guardians ? everyPlayer : [inventory];
    add(
      "enemy",
      guardians ? playerRace : gwoRaces.raceOf(ai),
      undefined,
      undefined,
      enemyMods
    );
    _.forEach(ai.foes, function (foe) {
      add("enemy", gwoRaces.raceOf(foe), undefined, undefined, enemyMods);
    });
    add("subcommander", playerRace, undefined, undefined, hostSubCommanderMods);
    if (!_.isUndefined(ai.ally)) {
      add(
        "subcommander",
        _.isUndefined(ai.ally.race) ? playerRace : gwoRaces.raceOf(ai.ally),
        undefined,
        undefined,
        hostSubCommanderMods
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
          ),
          viewer.inventory,
          [viewer.inventory]
        );
      }
    );
    // A race co-op AI player's own tree, on its co-op brain, and under
    // per-player tech its Sub Commanders' as a viewer's. See coop.md.
    _.forEach(coopAis, function (coopAi) {
      add("coop", coopAi.race, coopAi.path, coopAi.inventory, [
        coopAi.inventory,
      ]);
      if (coopAi.perPlayer) {
        add(
          "subcommander",
          coopAi.race,
          gwoAI.getSubcommanderPathForViewer(
            coopAi.inventory,
            coopAi.tag,
            coopAi.race
          ),
          coopAi.inventory,
          [coopAi.inventory]
        );
      }
    });

    return _.values(jobs);
  };

  // An MLA co-op AI player's tree: the source copied to its own scoped path
  // with its AI mods, as a viewer's Sub Commanders' is. Nothing else is
  // written: the scope is its isolation, so no Cluster routing either. AIs
  // sharing a tree share one walk. Under per-player tech its Sub Commanders
  // get a tree of their own too, exactly as a viewer's do.
  var coopAiTreeRequests = function (coopAis, launch) {
    var requests = {};

    _.forEach(coopAis, function (coopAi) {
      if (coopAi.perPlayer) {
        var source = gwoAI.getAIPathSource(
          "subcommander",
          undefined,
          coopAi.inventory
        );
        var destination = gwoAI.getSubcommanderPathForViewer(
          coopAi.inventory,
          coopAi.tag
        );
        requests[destination] = {
          source: source,
          request: _.assign({}, launch, {
            aiPaths: _.assign({}, launch.aiPaths, {
              subCommanderSource: source,
              subCommanderDestination: destination,
            }),
            clusterPresence: "None",
            inventory: coopAi.inventory,
            forceSubCommanderScope: true,
          }),
        };
      }

      if (!gwoRaces.isMla(coopAi.race) || requests[coopAi.path]) {
        return;
      }
      requests[coopAi.path] = {
        source: coopAi.source,
        request: _.assign({}, launch, {
          aiPaths: _.assign({}, launch.aiPaths, {
            subCommanderSource: coopAi.source,
            subCommanderDestination: coopAi.path,
          }),
          clusterPresence: "None",
          inventory: coopAi.inventory,
          forceSubCommanderScope: true,
        }),
      };
    });

    return _.values(requests);
  };

  // The stock factory and fabber lists lose MLA's orders to the race's
  // builders, by the keys the race's army maps re-point, and the job's AI
  // mods are aimed at the race's keys. Without the race's cells neither is
  // done. See races.md, "Race trees".
  var writeRaceTree = function (job, treeCache, configFiles) {
    return Promise.all([treeCache.list(job.source), job.keys()]).then(
      function (loaded) {
        var fileList = loaded[0];
        var keys = loaded[1];
        var kept = _.filter(fileList, job.keep);
        var aimer =
          keys && !_.isEmpty(job.aiMods)
            ? raceAiMods.aim(raceAiMods.table(keys), job.remade)
            : undefined;
        var context = {
          nonLoadAiMods: aimer
            ? aimer.mods(_.reject(job.aiMods, { op: "load" }))
            : [],
        };
        var write = function (filePath, json, destinationPath) {
          applyAiMods(
            json,
            aiModsInScopeOfFile(
              { path: filePath, isLoadFile: isLoadFile(filePath) },
              context
            )
          );
          configFiles[destinationPath] = json;
        };

        if (!_.some(fileList, job.raceOwned)) {
          console.warn(
            "gwoRefereeAi: no race build orders under " + job.source
          );
        }

        var treeFiles = _.map(kept, function (filePath) {
          return treeCache.getJSON(filePath).then(function (json) {
            write(
              filePath,
              keys && job.stockBuild(filePath)
                ? gameFilePaths.stripStockBuilds(json, keys.repointed)
                : json,
              job.destination + filePath.slice(job.source.length)
            );
          });
        });
        var loadFiles = aimer
          ? _.map(_.filter(job.aiMods, { op: "load" }), function (mod) {
              var filePath = loadModFilePath(mod);
              if (!filePath) {
                return undefined;
              }
              return treeCache.getJSON(filePath).then(
                function (json) {
                  write(
                    filePath,
                    aimer.loadFile(json),
                    job.destination + filePath.slice(aiTechPath.length)
                  );
                },
                function (error) {
                  skipUnreadableLoadFile(filePath, error);
                }
              );
            })
          : [];

        return Promise.all(treeFiles.concat(loadFiles));
      }
    );
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
    module.exports = {
      applyAiMods: applyAiMods,
      raceTreeJobs: raceTreeJobs,
      coopAiTreeRequests: coopAiTreeRequests,
      writeRaceTree: writeRaceTree,
    };
  }

  // parse AI files, apply AI mods, and load the results into self.files()
  var generate = function () {
    var deferred = $.Deferred();
    var fail = function (error) {
      deferred.reject(error);
    };

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
    var connectedClients = refereeCoop.getConnectedClients();
    var playerAiModInventory = guardians
      ? getInventoryWithAllPlayerAiMods(
          game.inventory(),
          game,
          connectedClients
        )
      : game.inventory();

    // The hire hands the launch's cache in, so a co-op host's second hire
    // reads no tree file twice; a run without one gets its own.
    var treeCache = self.treeCache || createTreeCache();

    // Shared by every processDirectories call below; the viewer ones override
    // aiPaths, inventory, clusterPresence and forceSubCommanderScope.
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
          forceSubCommanderScope: false,
        })
      );
    });

    _.forEach(
      refereeCoop.getConnectedViewerInventories(game, connectedClients),
      function (viewer, viewerIndex) {
        var viewerInventory = viewer.inventory;
        var viewerPlayerTag = ".player" + viewerIndex;
        // Read from the viewer's own tier, which its destination is built
        // from too: the host's Sub Commander Tactics is not the viewer's.
        var viewerSubCommanderSource = gwoAI.getAIPathSource(
          "subcommander",
          undefined,
          viewerInventory
        );
        var viewerSubCommanderDestination = gwoAI.getSubcommanderPathForViewer(
          viewerInventory,
          viewerPlayerTag
        );
        var viewerAiPaths = _.assign({}, aiPaths, {
          subCommanderSource: viewerSubCommanderSource,
          subCommanderDestination: viewerSubCommanderDestination,
        });

        promises.push(
          processDirectories(
            viewerSubCommanderSource,
            _.assign({}, launch, {
              aiPaths: viewerAiPaths,
              clusterPresence: "None",
              inventory: viewerInventory,
              forceSubCommanderScope: true,
            })
          )
        );
      }
    );

    var coopAis = self.coopAis || [];
    _.forEach(coopAiTreeRequests(coopAis, launch), function (tree) {
      promises.push(processDirectories(tree.source, tree.request));
    });

    _.forEach(raceTreeJobs(game, connectedClients, coopAis), function (job) {
      promises.push(writeRaceTree(job, treeCache, configFiles));
    });

    Promise.all(promises).then(function () {
      deferred.resolve();
    }, fail);

    return deferred.promise();
  };

  generate.createTreeCache = createTreeCache;

  return generate;
});
