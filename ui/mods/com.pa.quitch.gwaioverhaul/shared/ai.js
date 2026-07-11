var getInventoryAiMods = function (inventory) {
  if (!inventory) {
    return [];
  }

  if (_.isFunction(inventory.aiMods)) {
    return inventory.aiMods();
  }

  return inventory.aiMods || [];
};

var hasSmartSubcommanders = function (inventory) {
  return _.some(inventory.cards(), {
    id: "gwaio_upgrade_subcommander_tactics",
  });
};

define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/referee_ai_paths.js",
], function (refereeAIPaths) {
  return {
    aiInUse: function (alignment) {
      var galaxy = model.game().galaxy();
      var originSystem = galaxy.stars()[galaxy.origin()].system();
      if (originSystem.gwaio) {
        if (alignment === "subcommander" && originSystem.gwaio.aiAlly) {
          return originSystem.gwaio.aiAlly;
        }
        return originSystem.gwaio.ai;
      }
      return "Titans";
    },

    getAIPathSource: function (type) {
      var aiInUse = this.aiInUse(type);
      return refereeAIPaths.getAIPathSource(type, aiInUse);
    },

    getAIPathDestination: function (type, options) {
      var game = model.game();
      var ai = game.galaxy().stars()[game.currentStar()].ai();
      var inventory = game.inventory();
      var aiInUse = this.aiInUse(type);
      var settings = _.assign(
        {
          guardians: !!ai.mirrorMode,
          aiMods: getInventoryAiMods(inventory),
          smartSubcommanders: hasSmartSubcommanders(inventory),
          scopeToken:
            type === "enemy" && ai.mirrorMode ? "guardians" : undefined,
        },
        options || {}
      );

      return refereeAIPaths.getAIPathDestination(type, aiInUse, settings);
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
  };
});
