define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
], (refereeAIPaths, gwoDifficulty, subcommanderTech) => {
  const getInventoryAiMods = (inventory) => {
    if (!inventory) {
      return [];
    }

    if (_.isFunction(inventory.aiMods)) {
      return inventory.aiMods();
    }

    return inventory.aiMods || [];
  };

  const aiInUse = (alignment) => {
    const galaxy = model.game().galaxy();
    const originSystem = galaxy.stars()[galaxy.origin()].system();
    if (originSystem.gwaio) {
      if (alignment === "subcommander" && originSystem.gwaio.aiAlly) {
        return originSystem.gwaio.aiAlly;
      }
      return originSystem.gwaio.ai;
    }
    return "Titans";
  };

  const getDifficultySettings = (difficultyName) =>
    _.find(gwoDifficulty.difficulties, {
      difficultyName,
    });

  const getAIEconFloor = (difficultyName) => {
    const difficultySettings = getDifficultySettings(difficultyName);
    // Finding a tier is not enough: the Custom sentinel carries no econ fields,
    // and the resulting NaN reaches every battle of that war.
    const hasEconFields =
      difficultySettings &&
      _.isNumber(difficultySettings.econBase) &&
      _.isNumber(difficultySettings.econRatePerDist);

    return hasEconFields
      ? difficultySettings.econBase + difficultySettings.econRatePerDist
      : 1;
  };

  return {
    aiInUse,

    getAIPathSource: function (type) {
      const currentAiInUse = aiInUse(type);
      return refereeAIPaths.getAIPathSource(type, currentAiInUse);
    },

    getAIPathDestination: function (type, options) {
      const game = model.game();
      const ai = game.galaxy().stars()[game.currentStar()].ai();
      const inventory = game.inventory();
      const currentAiInUse = aiInUse(type);
      const settings = _.assign(
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
      const currentAiInUse = aiInUse("subcommander");
      const scopeToken = playerTag === ".player" ? undefined : playerTag;
      return refereeAIPaths.getAIPathDestination(
        "subcommander",
        currentAiInUse,
        {
          guardians: false,
          aiMods: getInventoryAiMods(inventory),
          smartSubcommanders: subcommanderTech.hasSmartSubcommanders(inventory),
          scopeToken,
        }
      );
    },

    isCluster: function (ai) {
      const guardians = ai.mirrorMode;
      if (guardians) {
        return false;
      }
      return Array.isArray(ai.faction) // was an array before v5.44.0
        ? Number.parseInt(ai.faction[0]) === 4
        : ai.faction === 4;
    },

    // rng is optional. War creation passes the AI's own stream; the play-scene
    // callers are outside the seeded path and pass nothing.
    penchants: function (rng) {
      const penchants = [
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
      const penchant = rng ? rng.pick(penchants) : _.sample(penchants);

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
      const game = model.game();
      const galaxy = game.galaxy();
      const originSystem = galaxy.stars()[galaxy.origin()].system();
      const gwoSettings = originSystem.gwaio ? originSystem.gwaio : {};
      const difficultyName = gwoSettings.difficulty || "!LOC:Beginner";

      return Math.max(aiEconRate, getAIEconFloor(difficultyName));
    },

    quellerCompatibleMinions: function (minions) {
      return _.filter(minions, (minion) => {
        if (minion.ai) {
          return minion.ai.personality.works_with_queller === true;
        }
        return minion.personality.works_with_queller === true;
      });
    },
  };
});
