var getInventoryAiMods = function (inventory) {
  if (!inventory) {
    return [];
  }

  if (_.isFunction(inventory.aiMods)) {
    return inventory.aiMods();
  }

  return inventory.aiMods || [];
};

var aiInUse = function (alignment) {
  var galaxy = model.game().galaxy();
  var originSystem = galaxy.stars()[galaxy.origin()].system();
  if (originSystem.gwaio) {
    if (alignment === "subcommander" && originSystem.gwaio.aiAlly) {
      return originSystem.gwaio.aiAlly;
    }
    return originSystem.gwaio.ai;
  }
  return "Titans";
};

define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
], function (refereeAIPaths, gwoDifficulty, subcommanderTech) {
  var getDifficultySettings = function (difficultyName) {
    return _.find(gwoDifficulty.difficulties, {
      difficultyName: difficultyName,
    });
  };

  var getAIEconFloor = function (difficultyName) {
    var difficultySettings = getDifficultySettings(difficultyName);
    var econFloor = difficultySettings
      ? difficultySettings.econBase + difficultySettings.econRatePerDist
      : 1;

    return econFloor;
  };

  return {
    aiInUse: aiInUse,

    getAIPathSource: function (type) {
      var currentAiInUse = aiInUse(type);
      return refereeAIPaths.getAIPathSource(type, currentAiInUse);
    },

    getAIPathDestination: function (type, options) {
      var game = model.game();
      var ai = game.galaxy().stars()[game.currentStar()].ai();
      var inventory = game.inventory();
      var currentAiInUse = aiInUse(type);
      var settings = _.assign(
        {
          guardians: !!ai.mirrorMode,
          aiMods: getInventoryAiMods(inventory),
          smartSubcommanders: subcommanderTech.hasSmartSubcommanders(inventory),
          scopeToken:
            type === "enemy" && ai.mirrorMode ? "guardians" : undefined,
        },
        options || {}
      );

      return refereeAIPaths.getAIPathDestination(
        type,
        currentAiInUse,
        settings
      );
    },

    isCluster: function (ai) {
      var guardians = ai.mirrorMode;
      if (guardians) {
        return false;
      }
      return _.isArray(ai.faction) // was an array before v5.44.0
        ? Number.parseInt(ai.faction[0]) === 4
        : ai.faction === 4;
    },

    penchants: function () {
      var penchants = [
        { name: "", tags: "" }, // Vanilla - no changes
        { name: "!LOC:Artillery", tags: ["Artillery"] },
        {
          name: "!LOC:Fortress",
          tags: [
            "Fortress",
            "Minelayer",
            "PenchantT1Defence",
            "PenchantT2Defence",
          ],
        },
        {
          name: "!LOC:All-terrain",
          tags: [
            "AllTerrain",
            "PenchantT1Bot",
            "PenchantT2Bot",
            "PenchantT1Vehicle",
            "PenchantT2Naval",
          ],
        },
        {
          name: "!LOC:Assault",
          tags: [
            "Assault",
            "PenchantT2Air",
            "PenchantT1Bot",
            "PenchantT1Vehicle",
            "PenchantT2Vehicle",
            "PenchantT1Naval",
            "PenchantT2Naval",
          ],
        },
        {
          name: "!LOC:Boomer",
          tags: ["Boomer", "PenchantT1Bot", "PenchantT2Bot"],
        },
        {
          name: "!LOC:Heavy",
          tags: [
            "Heavy",
            "NoPercentage",
            "PenchantT2Air",
            "PenchantT1Bot",
            "PenchantT2Bot",
            "PenchantT1Vehicle",
            "PenchantT2Vehicle",
            "PenchantT1Naval",
            "PenchantT2Naval",
          ],
        },
        {
          name: "!LOC:Infernodier",
          tags: [
            "Infernodier",
            "NoPercentage",
            "PenchantT1Bot",
            "PenchantT2Bot",
            "PenchantT1Vehicle",
            "PenchantT2Vehicle",
          ],
        },
        {
          name: "!LOC:Raider",
          tags: [
            "Raider",
            "PenchantT2Air",
            "PenchantT1Bot",
            "PenchantT2Bot",
            "PenchantT1Vehicle",
            "PenchantT1Naval",
            "PenchantT2Naval",
          ],
        },
        {
          name: "!LOC:Sniper",
          tags: [
            "Sniper",
            "NoPercentage",
            "PenchantT2Air",
            "PenchantT1Bot",
            "PenchantT2Bot",
            "PenchantT1Vehicle",
            "PenchantT2Vehicle",
            "PenchantT1Naval",
            "PenchantT2Naval",
          ],
        },
        { name: "!LOC:Nuker", tags: ["Nuker"] },
        {
          name: "!LOC:Tactical",
          tags: [
            "Tactical",
            "NoPercentage",
            "PenchantT2Defence",
            "PenchantT2Air",
            "PenchantT2Bot",
            "PenchantT2Naval",
          ],
        },
        { name: "!LOC:Platoon", tags: ["Platoon", "PenchantPlatoon"] },
        { name: "!LOC:Minelayer", tags: ["Minelayer"] },
      ];
      var penchant = _.sample(penchants);

      return {
        penchants: penchant.tags,
        penchantName: penchant.name,
      };
    },

    setAIEconRate: function (aiEconRate) {
      var game = model.game();
      var galaxy = game.galaxy();
      var originSystem = galaxy.stars()[galaxy.origin()].system();
      var gwoSettings = originSystem.gwaio ? originSystem.gwaio : {};
      var difficultyName = gwoSettings.difficulty || "!LOC:Beginner";

      return Math.max(aiEconRate, getAIEconFloor(difficultyName));
    },
  };
});
