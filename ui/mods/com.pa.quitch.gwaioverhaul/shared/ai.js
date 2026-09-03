define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/difficulty_levels.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_subcommander_tech.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/races.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/brain_table.js",
], function (
  refereeAIPaths,
  gwoDifficulty,
  subcommanderTech,
  races,
  brainTable
) {
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

  // The war's brain for that side and race: the race's row of the recorded
  // aiByRace table, else the war-wide string - a war saved before the table
  // existed behaves exactly as it always did. "subcommander" is the ally
  // side; every other alignment fights the player.
  var warBrain = function (alignment, race) {
    var gwoSettings = originSettings(model.game());
    if (gwoSettings) {
      return brainTable.resolve(
        gwoSettings.aiByRace,
        gwoSettings.ai,
        gwoSettings.aiAlly,
        alignment === "subcommander" ? "ally" : "enemy",
        race
      );
    }
    return "Titans";
  };

  // The war's brain for that side, or Titans for a race the war's brain has
  // no build orders for. See races.md.
  var aiInUse = function (alignment, race) {
    return races.brainFor(warBrain(alignment, race), race);
  };

  var getDifficultySettings = function (difficultyName) {
    return _.find(gwoDifficulty.difficulties, {
      difficultyName: difficultyName,
    });
  };

  var missingTiers = {};

  // The tier a war runs on: a Custom war's recorded snapshot, else the named
  // tier looked up live so a retune reaches wars in progress. undefined for a
  // Custom war saved before snapshots existed, or a name no longer shipped.
  // See galaxy.md, "Difficulty".
  var warTier = function (gwoSettings) {
    var settings = gwoSettings || {};
    if (_.isPlainObject(settings.customDifficulty)) {
      return settings.customDifficulty;
    }
    var tier = getDifficultySettings(settings.difficulty);
    if (tier && tier.customDifficulty !== true) {
      return tier;
    }
    if (!tier && settings.difficulty && !missingTiers[settings.difficulty]) {
      missingTiers[settings.difficulty] = true;
      console.warn("GWO: no difficulty tier named " + settings.difficulty);
    }
    return undefined;
  };

  // A Custom war without a snapshot resolves no tier, so its floor stays 1;
  // the field check keeps a NaN out of every battle of that war.
  var getAIEconFloor = function (tier) {
    var hasEconFields =
      tier && _.isNumber(tier.econBase) && _.isNumber(tier.econRatePerDist);

    return hasEconFields ? tier.econBase + tier.econRatePerDist : 1;
  };

  // A war saved before v5.44.0 holds faction as ["4"].
  var factionIndex = function (ai) {
    return _.isArray(ai.faction) ? Number.parseInt(ai.faction[0]) : ai.faction;
  };

  // A boss fields tier.bossCommanders per player the war was generated for,
  // derived at launch so a tier retune reaches wars in progress. An AI saved
  // with a count, or a war that resolves no tier, keeps the recorded count.
  // See galaxy.md, "Difficulty".
  var bossCommanders = function (ai, gwoSettings) {
    var settings = gwoSettings || {};
    var tier = warTier(settings);
    if (
      ai.boss === true &&
      tier &&
      _.isNumber(tier.bossCommanders) &&
      _.isNumber(settings.coopPlayerScalingCount)
    ) {
      return tier.bossCommanders * settings.coopPlayerScalingCount;
    }
    return ai.bossCommanders;
  };

  var commanderCount = function (ai) {
    return (
      bossCommanders(ai, originSettings(model.game())) ||
      ai.commanderCount ||
      // legacy GWO support
      (ai.landing_policy && ai.landing_policy.length) ||
      1
    );
  };

  var bountyValue = function (ai) {
    var tier = warTier(originSettings(model.game()));
    return tier && _.isNumber(tier.bountyModeValue)
      ? tier.bountyModeValue
      : ai.bountyModeValue;
  };

  var PENCHANTS = [
    // Vanilla. Must be an array like every other entry - the caller concats
    // this onto personality_tags, and "" would concat as one empty tag.
    { name: "", tags: [] },
    { name: "!LOC:Artillery", tags: ["Artillery"] },
    {
      name: "!LOC:Fortress",
      tags: ["Fortress", "Minelayer", "PenchantT1Defence", "PenchantT2Defence"],
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

  return {
    aiInUse: aiInUse,
    currentStarAi: currentStarAi,
    getInventoryAiMods: getInventoryAiMods,
    originSettings: originSettings,
    originSystem: originSystem,
    warTier: warTier,
    factionIndex: factionIndex,
    commanderCount: commanderCount,
    bountyValue: bountyValue,

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

    raceOf: races.raceOf,

    getAIPathSource: function (type, race) {
      var inventory = model.game().inventory();
      var currentAiInUse = aiInUse(type, race);

      return refereeAIPaths.getAIPathSource(
        type,
        currentAiInUse,
        subcommanderTech.hasSmartSubcommanders(inventory)
      );
    },

    // options.race routes the path to that race's own tree; without it the
    // path is the MLA one the AI-mod pipeline writes.
    getAIPathDestination: function (type, options) {
      var game = model.game();
      var ai = currentStarAi(game);
      var inventory = game.inventory();
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
      var currentAiInUse = aiInUse(type, settings.race);

      return refereeAIPaths.getAIPathDestination(
        type,
        currentAiInUse,
        settings
      );
    },

    getSubcommanderPathForViewer: function (inventory, playerTag, race) {
      return refereeAIPaths.getViewerSubcommanderPath(
        aiInUse("subcommander", race),
        getInventoryAiMods(inventory),
        subcommanderTech.hasSmartSubcommanders(inventory),
        playerTag,
        race
      );
    },

    isCluster: function (ai) {
      var guardians = ai.mirrorMode;
      if (guardians) {
        return false;
      }
      return factionIndex(ai) === 4;
    },

    // rng is optional. War creation passes the AI's own stream; the play-scene
    // callers are outside the seeded path and pass nothing.
    penchants: function (rng) {
      var penchant = rng ? rng.pick(PENCHANTS) : _.sample(PENCHANTS);

      return {
        penchants: penchant.tags,
        penchantName: penchant.name,
      };
    },

    // The build-file tags a recorded penchant name stands for; none for the
    // Vanilla entry or a name no longer shipped.
    penchantTags: function (penchantName) {
      var penchant = _.find(PENCHANTS, { name: penchantName });
      return penchant ? penchant.tags.slice() : [];
    },

    // Kept out of aiEconRateWithFloor, whose floor rises above this on the
    // hardest tiers - that would hand the player's allies the enemy's eco cheat.
    subcommanderEconRate: 1,

    // Older co-op wars could save a negative eco, so a saved econ_rate needs
    // the floor rather than being used directly.
    aiEconRateWithFloor: function (aiEconRate) {
      // A war with no recorded difficulty is floored as Beginner.
      var gwoSettings = _.defaults({}, originSettings(model.game()), {
        difficulty: "!LOC:Beginner",
      });

      return Math.max(aiEconRate, getAIEconFloor(warTier(gwoSettings)));
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
