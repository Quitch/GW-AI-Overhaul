// The measured half of gw_play/referee_game_files.js. Nothing here may touch an
// engine global at define time - see testing.md, "Coverage".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/race_ai_mods.js",
], function (gwoCard, raceAiMods) {
  var getAIUnitMapPath = function (x1, aiInUse) {
    var append = x1 ? "_x1.json" : ".json";

    switch (aiInUse) {
      case "Queller":
        return "/pa/ai_queller/q_uber/unit_maps/ai_unit_map" + append;
      case "Penchant":
        return "/pa/ai_penchant/unit_maps/ai_unit_map" + append;
      default:
        return "/pa/ai/unit_maps/ai_unit_map" + append;
    }
  };

  var getAIUnitMapDestinationPath = function (x1, aiPath) {
    var append = x1 ? "_x1.json" : ".json";
    return aiPath + "unit_maps/ai_unit_map" + append;
  };

  // The primary AI is tested through isClusterFn, as its foes already are: a
  // war saved before v5.44.0 holds faction as ["4"], which a bare === 4 misses,
  // routing the unit map away from the ai_path setAIPath assigned it.
  var clusterArmyIndex = function (ai, isClusterFn) {
    var guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (isClusterFn(ai)) {
      return 0;
    } else if (ai.foes) {
      var index = _.findIndex(ai.foes, function (foe) {
        return isClusterFn(foe);
      });
      if (index !== -1) {
        return index + 1;
      }
    }
    return -1;
  };

  // The unit map must land wherever that faction's scoped build orders do.
  var resolveAiUnitMapPaths = function (
    ai,
    currentCount,
    normalPaths,
    clusterPaths,
    isClusterFn
  ) {
    if (clusterArmyIndex(ai, isClusterFn) === currentCount) {
      return clusterPaths;
    }
    return normalPaths;
  };

  // The brain's map with each race map laid over it: a race key wins, so a
  // race that re-defines a vanilla key gets its own meaning of it.
  var mergeUnitMaps = function (baseMap, raceMaps) {
    var merged = _.assign({}, baseMap && baseMap.unit_map);

    _.forEach(raceMaps, function (raceMap) {
      _.assign(merged, raceMap && raceMap.unit_map);
    });

    return _.assign({}, baseMap, { unit_map: merged });
  };

  // A race army's map, or the merge alone without cells or for MLA. See
  // races.md, "Race trees" and "Add-ons".
  // params: base, raceMaps, cells, race, unitCells, gwoRaces.
  var raceUnitMap = function (params) {
    var merged = mergeUnitMaps(params.base, params.raceMaps);
    if (!params.cells || params.gwoRaces.isMla(params.race)) {
      return merged;
    }

    var translated = params.unitCells.unitMapFallback(
      merged,
      params.raceMaps,
      params.cells.vanilla,
      params.cells.race,
      params.gwoRaces.addonUnitPaths()
    );
    var unitMap = _.assign({}, translated.unit_map);
    var stockUnits = params.gwoRaces.stockUnitsFor(params.race);
    _.forEach(merged.unit_map, function (entry, key) {
      if (entry && _.includes(stockUnits, entry.spec_id)) {
        unitMap[key] = entry;
      }
    });
    _.forEach(params.gwoRaces.engineKeysFor(params.race), function (unit, key) {
      if (unitMap[key]) {
        unitMap[key] =
          unit === null
            ? merged.unit_map[key]
            : _.assign({}, unitMap[key], { spec_id: unit });
      }
    });

    return _.assign({}, translated, { unit_map: unitMap });
  };

  // The keys a race army's map points somewhere other than the merge did.
  var repointedKeys = function (merged, translated) {
    var keys = {};

    _.forEach(translated.unit_map, function (entry, key) {
      var before = merged.unit_map[key];
      if (entry && before && entry.spec_id !== before.spec_id) {
        keys[key] = true;
      }
    });

    return keys;
  };

  // A stock build list without MLA's orders to a race's builders: an item
  // loses every builder its race re-pointed at a race unit, and goes when none
  // is left or when it builds a re-pointed unit, which the stock builder left
  // cannot build. What stays is what a skirmish runs for the race.
  var stripStockBuilds = function (json, repointed) {
    if (!json || !_.isArray(json.build_list)) {
      return json;
    }

    var items = [];
    _.forEach(json.build_list, function (item) {
      var builders = _.reject(item.builders, function (builder) {
        return repointed[builder];
      });
      if (!builders.length || repointed[item.to_build]) {
        return;
      }
      items.push(
        builders.length === item.builders.length
          ? item
          : _.assign({}, item, { builders: builders })
      );
    });

    return _.assign({}, json, { build_list: items });
  };

  // An army's classic and Titans maps (raceUnitMap over the brain's two maps),
  // with the maps they came from: bases and raceMaps. A native Promise.
  // params: race, brain, source, cells, unitCells, gwoRaces.
  var armyUnitMaps = function (params) {
    var loads = [
      loadMap(getAIUnitMapPath(false, params.brain)),
      loadMap(getAIUnitMapPath(true, params.brain)),
    ].concat(
      _.map(
        params.gwoRaces.unitMapsFor(params.race, params.brain, params.source),
        loadMap
      )
    );

    // A jQuery promise adopted by a native one hands over its first argument
    // only, so the loads are gathered into one first.
    return Promise.resolve(
      $.when.apply($, loads).then(function () {
        return _.toArray(arguments);
      })
    ).then(function (maps) {
      var bases = maps.slice(0, 2);
      var raceMaps = maps.slice(2);
      var translate = function (base) {
        return raceUnitMap({
          base: base,
          raceMaps: raceMaps,
          cells: params.cells,
          race: params.race,
          unitCells: params.unitCells,
          gwoRaces: params.gwoRaces,
        });
      };
      return {
        classic: translate(bases[0]),
        x1: translate(bases[1]),
        bases: bases,
        raceMaps: raceMaps,
      };
    });
  };

  // What a race tree's orders are fitted by, or null without cells or a race
  // unit in them. See ai-pipeline.md, "Race trees".
  // params: race, brain, source, cells (race_cells.indexFor), unitCells,
  // gwoRaces.
  var raceKeysFor = function (params) {
    var cells = params.cells;
    if (!cells || _.isEmpty(cells.race.units)) {
      return Promise.resolve(null);
    }

    return armyUnitMaps(params).then(function (maps) {
      var repointed = {};
      var stock = {};
      _.forEach([maps.classic, maps.x1], function (translated, index) {
        var base = maps.bases[index];
        _.assign(
          repointed,
          repointedKeys(mergeUnitMaps(base, maps.raceMaps), translated)
        );
        _.assign(stock, base && base.unit_map);
      });
      return {
        repointed: repointed,
        stock: stock,
        race: mergeUnitMaps(undefined, maps.raceMaps).unit_map,
        cells: cells,
        engineKeys: params.gwoRaces.engineKeysFor(params.race),
      };
    });
  };

  // params.race is optional: without it the player is MLA. params.mods, when
  // given, is the inventory's mods already fitted to the player's race
  // (races.modsFor); otherwise the mods land as they always have.
  var buildPlayerFiles = function (params, gwoAI, gwoSpecs) {
    var playerAIUnitMap = params.playerAIUnitMap;
    var playerX1AIUnitMap = params.playerX1AIUnitMap;
    var playerSpecFiles = params.playerSpecFiles;
    var inventory = params.inventory;
    var race = params.race;
    var extraMods = params.extraMods || [];
    var mods = params.mods || inventory.mods();

    var playerIsCluster = gwoCard.playerIsCluster(inventory);
    var hostSubcommanderPath = gwoAI.getAIPathDestination("subcommander", {
      race: race,
    });
    var playerFilesClassic;
    var playerFilesX1;

    if (playerIsCluster) {
      playerFilesClassic = _.assign(
        {
          "/pa/ai_cluster/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
        },
        playerSpecFiles
      );
      playerFilesX1 = _.assign(
        {
          "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json.player":
            playerX1AIUnitMap,
        },
        playerSpecFiles
      );
    } else {
      playerFilesClassic = _.assign({}, playerSpecFiles);
      playerFilesClassic[
        hostSubcommanderPath + "unit_maps/ai_unit_map.json.player"
      ] = playerAIUnitMap;
      playerFilesX1 = {};
      playerFilesX1[
        hostSubcommanderPath + "unit_maps/ai_unit_map_x1.json.player"
      ] = playerX1AIUnitMap;
    }

    var playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
    gwoSpecs.mod(playerFiles, mods.concat(extraMods), ".player");
    return playerFiles;
  };

  // Each co-op AI's unit maps, tagged with its spec tag and written into its own
  // tree's unit_maps/, beside the untagged maps its tree copy carries. AIs
  // sharing a tree and a tag share the files. mapsFor(ai) is { classic, x1 };
  // genAIUnitMap is GW.specs.genAIUnitMap.
  var coopAiMapFiles = function (coopAis, mapsFor, genAIUnitMap) {
    var files = {};

    _.forEach(coopAis, function (coopAi) {
      var maps = mapsFor(coopAi);
      files[getAIUnitMapDestinationPath(false, coopAi.path) + coopAi.tag] =
        genAIUnitMap(maps.classic, coopAi.tag);
      files[getAIUnitMapDestinationPath(true, coopAi.path) + coopAi.tag] =
        genAIUnitMap(maps.x1, coopAi.tag);
    });

    return files;
  };

  // The units a player's specs are built for, `extra` kept whole, and the
  // retag mods its commanders need. See races.md, "Capability cells".
  // params: units, extra, cells, race, isMla, commanders, unitCells, gwoRaces.
  var specPlan = function (params) {
    var cells = params.cells;
    var gwoRaces = params.gwoRaces;
    var extra = params.extra || [];
    var specs = gwoRaces.fieldedFor(
      params.race,
      gwoRaces.ownedPaths(params.race, params.units, cells).concat(extra),
      cells
    );
    var keptVanilla =
      cells && !params.isMla
        ? _.difference(
            params.unitCells.heldCommanderUnits(
              params.units.concat(extra),
              cells.vanilla
            ),
            params.commanders
          )
        : [];

    return {
      specs: specs,
      retagMods: _.flatten(
        _.map(params.commanders, function (commander) {
          return gwoRaces.commanderModsFor(params.race, commander);
        }).concat(
          _.map(keptVanilla, function (unit) {
            return gwoRaces.unitRetagMods(params.race, unit);
          })
        )
      ),
    };
  };

  // A per-player co-op AI player's own files: its specs with its tech
  // applied, and the unit maps its Sub Commanders' tree reads. params: tag,
  // specFiles, subcommanderPath, maps ({ classic, x1 }), genAIUnitMap, mods,
  // extraMods, gwoSpecs. See coop.md, "AI players' tech".
  var buildCoopAiFiles = function (params) {
    var tag = params.tag;
    var files = _.assign({}, params.specFiles);
    files[params.subcommanderPath + "unit_maps/ai_unit_map.json" + tag] =
      params.genAIUnitMap(params.maps.classic, tag);
    files[params.subcommanderPath + "unit_maps/ai_unit_map_x1.json" + tag] =
      params.genAIUnitMap(params.maps.x1, tag);

    var mods = (params.mods || []).concat(params.extraMods || []);
    if (mods.length) {
      params.gwoSpecs.mod(files, mods, tag);
    }
    return files;
  };

  // Mirrors the fetch, parse and error handling the base game's genUnitSpecs
  // does internally.
  var specFetch = function (item) {
    return new Promise(function (resolve, reject) {
      $.ajax({
        url: "coui:/" + item,
        success: function (data) {
          try {
            data = JSON.parse(data);
          } catch (e) {
            // Mirror base behaviour: keep whatever came back if it won't parse.
          }
          resolve(data);
        },
        error: function (request, status, error) {
          reject(error);
        },
      });
    });
  };

  // The spec mods an army carries into the battle: derived from the buffs the
  // war recorded, or the descriptors a war saved before that baked in.
  var armyInventory = function (army, loadoutFor, factionIndexFn, isClusterFn) {
    if (_.isArray(army.typeOfBuffs)) {
      return loadoutFor(
        factionIndexFn(army),
        army.typeOfBuffs,
        isClusterFn(army)
      );
    }
    return army.inventory || [];
  };

  // A file map as mountMemoryFiles takes it: every file as JSON text.
  var cookFiles = function (files) {
    return _.mapValues(files, function (value) {
      return _.isString(value) ? value : JSON.stringify(value);
    });
  };

  // What a rejection carries, for a log line: an Error's stack or message, a
  // jqXHR's status, else the value itself.
  var describeError = function (error) {
    if (error && (error.stack || error.message)) {
      return error.stack || error.message;
    }
    if (error && _.isNumber(error.status)) {
      return (
        "HTTP " +
        error.status +
        (error.statusText ? " " + error.statusText : "")
      );
    }
    return String(error);
  };

  // Each unit map once per page, through spec:// like the unit list. The
  // engine serves a spec:// path's first read for the rest of the process
  // anyway, so nothing later could read a different file. A failed read is
  // dropped from the cache, so the next Fight reads the file again rather
  // than inheriting the rejection. See specs.md.
  var mapCache = {};
  var loadMap = function (path) {
    if (!mapCache[path]) {
      mapCache[path] = $.get("spec:/" + path).then(
        function (data) {
          return parse(data);
        },
        function (error) {
          delete mapCache[path];
          return $.Deferred()
            .reject(
              new Error(
                "unit map not read: " + path + " (" + describeError(error) + ")"
              )
            )
            .promise();
        }
      );
    }
    return mapCache[path];
  };

  // Every file a card's `load` can name, by path, read once per page like
  // the unit maps. An empty listing rejects, as a failed read does, and
  // either is dropped from the cache.
  var aiTechFiles;
  var loadAiTechFiles = function () {
    if (!aiTechFiles) {
      var root = raceAiMods.AI_TECH_PATH;
      aiTechFiles = Promise.resolve(api.file.list(root, true))
        .then(function (listing) {
          var paths = _.filter(listing, function (path) {
            return _.endsWith(path, ".json");
          });
          if (!paths.length) {
            throw new Error("nothing listed under " + root);
          }
          return Promise.all(
            _.map(paths, function (path) {
              return Promise.resolve($.getJSON("coui:/" + path));
            })
          ).then(function (files) {
            return _.zipObject(paths, files);
          });
        })
        .then(null, function (error) {
          aiTechFiles = undefined;
          throw error;
        });
    }
    return aiTechFiles;
  };

  return {
    cookFiles: cookFiles,
    describeError: describeError,
    loadMap: loadMap,
    loadAiTechFiles: loadAiTechFiles,
    armyInventory: armyInventory,
    getAIUnitMapPath: getAIUnitMapPath,
    getAIUnitMapDestinationPath: getAIUnitMapDestinationPath,
    mergeUnitMaps: mergeUnitMaps,
    raceUnitMap: raceUnitMap,
    repointedKeys: repointedKeys,
    stripStockBuilds: stripStockBuilds,
    armyUnitMaps: armyUnitMaps,
    raceKeysFor: raceKeysFor,
    clusterArmyIndex: clusterArmyIndex,
    resolveAiUnitMapPaths: resolveAiUnitMapPaths,
    buildPlayerFiles: buildPlayerFiles,
    coopAiMapFiles: coopAiMapFiles,
    specPlan: specPlan,
    buildCoopAiFiles: buildCoopAiFiles,
    specFetch: specFetch,
  };
});
