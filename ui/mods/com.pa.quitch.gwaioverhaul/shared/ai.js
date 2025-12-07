define(function () {
  const getQuellerPath = function (type) {
    const quellerPath = "/pa/ai_queller/";
    const inventory = model.game().inventory();
    const smartSubcommanders = _.some(inventory.cards(), {
      id: "gwaio_upgrade_subcommander_tactics",
    });
    if (type === "all") {
      return quellerPath;
    } else if (type === "enemy") {
      return quellerPath + "q_uber/";
    } else if (type === "subcommander" && smartSubcommanders) {
      return quellerPath + "q_silver/";
    }
    // type === "subcommander"
    return quellerPath + "q_bronze/";
  };

  const penchantAiPath = "/pa/ai_penchant/";
  const titansAiPath = "/pa/ai/";

  return {
    aiInUse: function (alignment) {
      const galaxy = model.game().galaxy();
      const originSystem = galaxy.stars()[galaxy.origin()].system();
      if (originSystem.gwaio) {
        if (alignment === "subcommander" && originSystem.gwaio.aiAlly) {
          return originSystem.gwaio.aiAlly;
        }
        return originSystem.gwaio.ai;
      }
      return "Titans";
    },

    getAIPathSource: function (type) {
      const aiInUse = this.aiInUse(type);
      switch (aiInUse) {
        case "Penchant":
          return penchantAiPath;
        case "Queller":
          return getQuellerPath(type);
        default:
          return titansAiPath;
      }
    },

    getAIPathDestination: function (type) {
      const game = model.game();
      const ai = game.galaxy().stars()[game.currentStar()].ai();
      const guardians = ai.mirrorMode;
      const aiMods = game.inventory().aiMods();
      const aiInUse = this.aiInUse(type);
      // the order of path assignments must match .player unit_map assignments in generateGameFiles()
      if (type === "cluster") {
        return "/pa/ai_cluster/";
      } else if (aiInUse === "Queller") {
        return getQuellerPath(type);
      } else if (type === "subcommander" && !guardians && !_.isEmpty(aiMods)) {
        return "/pa/ai_subcommander/";
      } else if (aiInUse === "Penchant") {
        return penchantAiPath;
      }
      return titansAiPath;
    },

    isCluster: function (ai) {
      const guardians = ai.mirrorMode;
      if (guardians) {
        return false;
      }
      return _.isArray(ai.faction) // was an array before v5.44.0
        ? Number.parseInt(ai.faction[0]) === 4
        : ai.faction === 4;
    },

    penchants: function () {
      const penchants = [
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
      const penchant = _.sample(penchants);

      return {
        penchants: penchant.tags,
        penchantName: penchant.name,
      };
    },
  };
});
