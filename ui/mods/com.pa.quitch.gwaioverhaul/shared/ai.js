define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
], function (refereeAIPaths, gwoDifficulty, subcommanderTech) {
  // The host's inventory is the live GWInventory, where aiMods is an observable;
  // a co-op viewer's arrives deserialised from the war record, where it is a
  // plain array. Both reach the referee, so both shapes are read here.
  var getInventoryAiMods = function (inventory) {
    if (!inventory) {
      return [];
    }

    if (_.isFunction(inventory.aiMods)) {
      return inventory.aiMods();
    }

    return inventory.aiMods || [];
  };

  // The origin star's system carries the war's GWO settings as `gwaio` - see
  // gw_start/setup.js. A stock war has no such field.
  var originSystem = function (game) {
    var galaxy = game.galaxy();
    return galaxy.stars()[galaxy.origin()].system();
  };

  var originSettings = function (game) {
    return originSystem(game).gwaio;
  };

  var currentStarAi = function (game) {
    return game.galaxy().stars()[game.currentStar()].ai();
  };

  var aiInUse = function (alignment) {
    var gwoSettings = originSettings(model.game());
    if (gwoSettings) {
      if (alignment === "subcommander" && gwoSettings.aiAlly) {
        return gwoSettings.aiAlly;
      }
      return gwoSettings.ai;
    }
    return "Titans";
  };

  var getDifficultySettings = function (difficultyName) {
    return _.find(gwoDifficulty.difficulties, {
      difficultyName: difficultyName,
    });
  };

  var getAIEconFloor = function (difficultyName) {
    var difficultySettings = getDifficultySettings(difficultyName);
    // Finding a tier is not enough: the Custom sentinel carries no econ fields,
    // and the resulting NaN reaches every battle of that war.
    var hasEconFields =
      difficultySettings &&
      _.isNumber(difficultySettings.econBase) &&
      _.isNumber(difficultySettings.econRatePerDist);

    return hasEconFields
      ? difficultySettings.econBase + difficultySettings.econRatePerDist
      : 1;
  };

  return {
    aiInUse: aiInUse,
    currentStarAi: currentStarAi,
    getInventoryAiMods: getInventoryAiMods,
    originSettings: originSettings,
    originSystem: originSystem,

    // The advanced structures a basic fabber's upgrade card lets it build.
    advancedStructureBuilds: [
      "AdvancedAirDefense",
      "AdvancedLandDefense",
      "AdvancedNavalDefense",
      "AdvancedRadar",
      "AntiNukeSilo",
      "ControlModule",
      "LongRangeArtillery",
      "NukeSilo",
      "PlanetEngine",
      "TML",
      "UnitCannon",
    ],

    // Adds `builder` to the builders of every build named, in every list
    // that carries it. See ai-pipeline.md.
    builderAppendMods: function (type, names, builder) {
      return _.map(names, function (name) {
        return {
          type: type,
          op: "append",
          toBuild: name,
          idToMod: "builders",
          value: builder,
          matchAll: true,
        };
      });
    },

    // One spec tag per enemy faction in a battle: the star's AI, then its foes.
    aiTags: function (ai) {
      return _.times(ai.foes ? 1 + ai.foes.length : 1, function (n) {
        return ".ai" + n;
      });
    },

    getAIPathSource: function (type) {
      var inventory = model.game().inventory();
      var currentAiInUse = aiInUse(type);

      return refereeAIPaths.getAIPathSource(
        type,
        currentAiInUse,
        subcommanderTech.hasSmartSubcommanders(inventory)
      );
    },

    getAIPathDestination: function (type, options) {
      var game = model.game();
      var ai = currentStarAi(game);
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

    getSubcommanderPathForViewer: function (inventory, playerTag) {
      return refereeAIPaths.getViewerSubcommanderPath(
        aiInUse("subcommander"),
        getInventoryAiMods(inventory),
        subcommanderTech.hasSmartSubcommanders(inventory),
        playerTag
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

    // rng is optional. War creation passes the AI's own stream; the play-scene
    // callers are outside the seeded path and pass nothing.
    penchants: function (rng) {
      var penchants = [
        // Vanilla. Must be an array like every other entry - the caller concats
        // this onto personality_tags, and "" would concat as one empty tag.
        { name: "", tags: [] },
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
      var penchant = rng ? rng.pick(penchants) : _.sample(penchants);

      return {
        penchants: penchant.tags,
        penchantName: penchant.name,
      };
    },

    // Kept out of aiEconRateWithFloor, whose floor rises above this on the
    // hardest tiers - that would hand the player's allies the enemy's eco cheat.
    subcommanderEconRate: 1,

    // Older co-op wars could save a negative eco, so a saved econ_rate needs
    // the floor rather than being used directly.
    aiEconRateWithFloor: function (aiEconRate) {
      var gwoSettings = originSettings(model.game()) || {};
      var difficultyName = gwoSettings.difficulty || "!LOC:Beginner";

      return Math.max(aiEconRate, getAIEconFloor(difficultyName));
    },

    quellerCompatibleMinions: function (minions) {
      return _.filter(minions, function (minion) {
        if (minion.ai) {
          return minion.ai.personality.works_with_queller === true;
        }
        return minion.personality.works_with_queller === true;
      });
    },
  };
});
