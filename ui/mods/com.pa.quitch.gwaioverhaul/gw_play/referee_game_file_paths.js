// The measured half of gw_play/referee_game_files.js. Nothing here may touch an
// engine global at define time - see testing.md, "Coverage".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/cards.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_fetch.js",
], (gwoCard, gwoUrl, gwoFetch) => {
  const getAIUnitMapPath = (titans, aiInUse) => {
    const append = titans ? "_x1.json" : ".json";

    switch (aiInUse) {
      case "Queller":
        return `/pa/ai_queller/q_uber/unit_maps/ai_unit_map${append}`;
      case "Penchant":
        return `/pa/ai_penchant/unit_maps/ai_unit_map${append}`;
      default:
        return `/pa/ai/unit_maps/ai_unit_map${append}`;
    }
  };

  const getAIUnitMapDestinationPath = (titans, aiPath) => {
    const append = titans ? "_x1.json" : ".json";
    return `${aiPath}unit_maps/ai_unit_map${append}`;
  };

  // The primary AI is tested through isClusterFn, as its foes already are: a
  // war saved before v5.44.0 holds faction as ["4"], which a bare === 4 misses,
  // routing the unit map away from the ai_path setAIPath assigned it.
  const clusterArmyIndex = (ai, isClusterFn) => {
    const guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (isClusterFn(ai)) {
      return 0;
    } else if (ai.foes) {
      const index = _.findIndex(ai.foes, (foe) => isClusterFn(foe));
      if (index !== -1) {
        return index + 1;
      }
    }
    return -1;
  };

  // The unit map must land wherever that faction's scoped build orders do.
  const resolveAiUnitMapPaths = (
    ai,
    currentCount,
    normalPaths,
    clusterPaths,
    isClusterFn,
  ) => {
    if (clusterArmyIndex(ai, isClusterFn) === currentCount) {
      return clusterPaths;
    }
    return normalPaths;
  };

  // The brain's map with each race map laid over it: a race key wins, so a
  // race that re-defines a vanilla key gets its own meaning of it.
  const mergeUnitMaps = (baseMap, raceMaps) => {
    const merged = Object.assign({}, baseMap && baseMap.unit_map);

    _.forEach(raceMaps, (raceMap) => {
      _.assign(merged, raceMap && raceMap.unit_map);
    });

    return Object.assign({}, baseMap, { unit_map: merged });
  };

  // params.race is optional: without it the player is MLA. params.mods, when
  // given, is the inventory's mods already expanded onto the race's files
  // (unit_cells.expandMods); otherwise the mods land as they always have.
  const buildPlayerFiles = (params, gwoAI, gwoSpecs) => {
    const playerAIUnitMap = params.playerAIUnitMap;
    const playerX1AIUnitMap = params.playerX1AIUnitMap;
    const playerSpecFiles = params.playerSpecFiles;
    const inventory = params.inventory;
    const titans = params.titans;
    const race = params.race;
    const extraMods = params.extraMods || [];
    const mods = params.mods || inventory.mods();

    const playerIsCluster = gwoCard.playerIsCluster(inventory);
    const hostSubcommanderPath = gwoAI.getAIPathDestination("subcommander", {
      race,
    });
    let playerFilesClassic;
    let playerFilesX1;

    if (playerIsCluster) {
      playerFilesClassic = _.assign(
        {
          "/pa/ai_cluster/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
        },
        playerSpecFiles,
      );
      playerFilesX1 = titans
        ? _.assign(
            {
              "/pa/ai_cluster/unit_maps/ai_unit_map_x1.json.player":
                playerX1AIUnitMap,
            },
            playerSpecFiles,
          )
        : {};
    } else {
      playerFilesClassic = Object.assign({}, playerSpecFiles);
      playerFilesClassic[
        `${hostSubcommanderPath}unit_maps/ai_unit_map.json.player`
      ] = playerAIUnitMap;
      playerFilesX1 = {};
      if (titans) {
        playerFilesX1[
          `${hostSubcommanderPath}unit_maps/ai_unit_map_x1.json.player`
        ] = playerX1AIUnitMap;
      }
    }

    const playerFiles = Object.assign({}, playerFilesClassic, playerFilesX1);
    gwoSpecs.mod(playerFiles, mods.concat(extraMods), ".player");
    return playerFiles;
  };

  // Mirrors the parse and error handling the base game's genUnitSpecs does
  // internally.
  const specFetch = (item) =>
    gwoFetch.text(gwoUrl.gameFile(item)).then((data) => {
      try {
        return JSON.parse(data);
      } catch (e) {
        // Mirror base behaviour: keep whatever came back if it won't parse.
        return data;
      }
    });

  // The spec mods an army carries into the battle: derived from the buffs the
  // war recorded, or the descriptors a war saved before that baked in.
  const armyInventory = (army, loadoutFor, factionIndexFn, isClusterFn) => {
    if (Array.isArray(army.typeOfBuffs)) {
      return loadoutFor(
        factionIndexFn(army),
        army.typeOfBuffs,
        isClusterFn(army),
      );
    }
    return army.inventory || [];
  };

  // Each unit map once per page, through spec:// like the unit list. The
  // engine serves a spec:// path's first read for the rest of the process
  // anyway, so nothing later could read a different file. See specs.md.
  const mapCache = {};
  const loadMap = (path) => {
    if (!mapCache[path]) {
      mapCache[path] = $.get(gwoUrl.specFile(path)).then((data) => parse(data));
    }
    return mapCache[path];
  };

  return {
    loadMap,
    armyInventory,
    getAIUnitMapPath,
    getAIUnitMapDestinationPath,
    mergeUnitMaps,
    clusterArmyIndex,
    resolveAiUnitMapPaths,
    buildPlayerFiles,
    specFetch,
  };
});
