// The measured half of gw_play/referee_game_files.js. Nothing here may touch an
// engine global at define time - see testing.md, "Coverage".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_url.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_fetch.js",
], (gwoUrl, gwoFetch) => {
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

  const clusterArmyIndex = (ai, isClusterFn) => {
    const guardians = ai.mirrorMode;
    if (guardians) {
      return -1;
    } else if (ai.faction === 4) {
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
    isClusterFn
  ) => {
    if (clusterArmyIndex(ai, isClusterFn) === currentCount) {
      return clusterPaths;
    }
    return normalPaths;
  };

  const buildPlayerFiles = (params, gwoAI, gwoSpecs) => {
    const playerAIUnitMap = params.playerAIUnitMap;
    const playerX1AIUnitMap = params.playerX1AIUnitMap;
    const playerSpecFiles = params.playerSpecFiles;
    const inventory = params.inventory;
    const titans = params.titans;

    const playerIsCluster = inventory.getTag("global", "playerFaction") === 4;
    const hostSubcommanderPath = gwoAI.getAIPathDestination("subcommander");
    let playerFilesClassic;
    let playerFilesX1;

    if (playerIsCluster) {
      playerFilesClassic = _.assign(
        {
          "/pa/ai_cluster/unit_maps/ai_unit_map.json.player": playerAIUnitMap,
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
    } else {
      playerFilesClassic = _.assign({}, playerSpecFiles);
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

    const playerFiles = _.assign({}, playerFilesClassic, playerFilesX1);
    gwoSpecs.mod(playerFiles, inventory.mods(), ".player");
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

  return {
    getAIUnitMapPath,
    getAIUnitMapDestinationPath,
    clusterArmyIndex,
    resolveAiUnitMapPaths,
    buildPlayerFiles,
    specFetch,
  };
});
