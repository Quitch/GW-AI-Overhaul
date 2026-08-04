define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
], function (refereeAIPaths, gwoDifficulty, subcommanderTech) {
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

  var getDifficultySettings = function (difficultyName) {
    return _.find(gwoDifficulty.difficulties, {
      difficultyName: difficultyName,
    });
  };

  var getAIEconFloor = function (difficultyName) {
    var difficultySettings = getDifficultySettings(difficultyName);
    // Not every tier carries econ fields - the Custom sentinel in
    // difficulty_levels.js holds only difficultyName + customDifficulty. A found
    // tier is therefore not enough; without this check the sum is NaN and every
    // battle of a Custom war gets NaN econ_rate and adv_eco_mod.
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

    getSubcommanderPathForViewer: function (inventory, playerTag) {
      var currentAiInUse = aiInUse("subcommander");
      var scopeToken = playerTag === ".player" ? undefined : playerTag;
      return refereeAIPaths.getAIPathDestination(
        "subcommander",
        currentAiInUse,
        {
          guardians: false,
          aiMods: getInventoryAiMods(inventory),
          smartSubcommanders: subcommanderTech.hasSmartSubcommanders(inventory),
          scopeToken: scopeToken,
        }
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

    // rng (shared/gwo_rng.js) is optional: war creation passes the AI's own seeded stream
    // so a seed reproduces its penchant, but the play-scene callers - gwc_minion.js and
    // gw_play/cards_deal_helpers.js - are outside the seeded path and pass nothing.
    penchants: function (rng) {
      var penchants = [
        // Vanilla - no changes. tags must be an array like every other entry; the
        // caller concats it onto personality_tags, and an empty string concats as
        // one empty-string tag rather than as nothing.
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

    // Kept out of aiEconRateWithFloor: that floor rises above this on the hardest
    // tiers, which would hand the player's own allies the enemy AI's eco cheat.
    subcommanderEconRate: 1,

    // Co-op games in older wars could end up with a negative eco, so a saved
    // econ_rate cannot be trusted to be valid - hence the floor rather than
    // using it directly.
    aiEconRateWithFloor: function (aiEconRate) {
      var game = model.game();
      var galaxy = game.galaxy();
      var originSystem = galaxy.stars()[galaxy.origin()].system();
      var gwoSettings = originSystem.gwaio ? originSystem.gwaio : {};
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
