define({
  aiInUse: function () {
    const galaxy = model.game().galaxy();
    const originSystem = galaxy.stars()[galaxy.origin()].system();
    if (originSystem.gwaio) {
      return originSystem.gwaio.ai;
    }
    return "Titans";
  },

  getAIPath: function (type) {
    const game = model.game();
    const ai = game.galaxy().stars()[game.currentStar()].ai();
    const guardians = ai.mirrorMode;
    const inventory = game.inventory();
    const smartSubcommanders = _.some(inventory.cards(), {
      id: "gwaio_upgrade_subcommander_tactics",
    });
    const aiBrain = this.aiInUse();
    const quellerPath = "/pa/ai_queller/";
    // the order of path assignments must match .player unit_map assignments in generateGameFiles()
    if (type === "cluster") {
      return "/pa/ai_cluster/";
    } else if (aiBrain === "Queller") {
      if (type === "all") {
        return quellerPath;
      } else if (type === "enemy") {
        return quellerPath + "q_uber/";
      } else if (type === "subcommander" && smartSubcommanders) {
        return quellerPath + "q_gold/";
      }
      // type === "subcommander"
      return quellerPath + "q_silver/";
    } else if (
      type === "subcommander" &&
      !_.isEmpty(inventory.aiMods()) &&
      !guardians
    ) {
      return "/pa/ai_tech/";
    } else if (aiBrain === "Penchant") {
      return "/pa/ai_penchant/";
    }
    return "/pa/ai/";
  },

  isCluster: function (ai) {
    const guardians = ai.mirrorMode;
    if (guardians) {
      return false;
    }
    return _.isArray(ai.faction) // was an array before v5.44.0
      ? parseInt(ai.faction[0]) === 4
      : ai.faction === 4;
  },

  penchants: function () {
    const penchantTags = [
      "Vanilla",
      "Artillery",
      ["Fortress", "Minelayer"], // Fortress
      "AllTerrain",
      "Assault",
      "Boomer",
      "Heavy",
      "Infernodier",
      "Raider",
      "Meta",
      "Sniper",
      "Nuker",
      "Tactical",
      "Platoon",
      "Minelayer",
    ];
    const penchantExclusions = [
      [], // Vanilla
      [], // Artillery
      ["PenchantT1Defence", "PenchantT2Defence"], // Fortress
      [
        // AllTerrain
        "PenchantT1Bot",
        "PenchantT2Bot",
        "PenchantT1Vehicle",
        "PenchantT2Naval",
      ],
      [
        // Assault
        "PenchantT2Air",
        "PenchantT1Bot",
        "PenchantT1Vehicle",
        "PenchantT2Vehicle",
        "PenchantT1Naval",
        "PenchantT2Naval",
      ],
      ["PenchantT1Bot", "PenchantT2Bot"], // Boomer
      [
        // Heavy
        "NoPercentage",
        "PenchantT2Air",
        "PenchantT1Bot",
        "PenchantT2Bot",
        "PenchantT1Vehicle",
        "PenchantT2Vehicle",
        "PenchantT1Naval",
        "PenchantT2Naval",
      ],
      [
        // Infernodier
        "NoPercentage",
        "PenchantT1Bot",
        "PenchantT2Bot",
        "PenchantT1Vehicle",
        "PenchantT2Vehicle",
      ],
      [
        // Raider
        "PenchantT2Air",
        "PenchantT1Bot",
        "PenchantT2Bot",
        "PenchantT1Vehicle",
        "PenchantT1Naval",
        "PenchantT2Naval",
      ],
      [
        // Meta
        "NoPercentage",
        "PenchantT2Air",
        "PenchantT1Bot",
        "PenchantT1Vehicle",
        "PenchantT2Vehicle",
        "PenchantT1Naval",
        "PenchantT2Naval",
      ],
      [
        // Sniper
        "NoPercentage",
        "PenchantT2Air",
        "PenchantT1Bot",
        "PenchantT2Bot",
        "PenchantT1Vehicle",
        "PenchantT2Vehicle",
        "PenchantT1Naval",
        "PenchantT2Naval",
      ],
      [], // Nuker
      [
        // Tactical
        "NoPercentage",
        "PenchantT2Defence",
        "PenchantT2Air",
        "PenchantT2Bot",
        "PenchantT2Naval",
      ],
      ["PenchantPlatoon"], // Platoon
      [], // Minelayer
    ];
    const penchantNames = [
      "", // Vanilla - no modifications
      "!LOC:Artillery",
      "!LOC:Fortress",
      "!LOC:All-terrain",
      "!LOC:Assault",
      "!LOC:Boomer",
      "!LOC:Heavy",
      "!LOC:Infernodier",
      "!LOC:Raider",
      "!LOC:Meta",
      "!LOC:Sniper",
      "!LOC:Nuker",
      "!LOC:Tactical",
      "!LOC:Platoon",
      "!LOC:Minelayer",
    ];
    const penchantTag = _.sample(penchantTags);
    const penchantIndex = _.indexOf(penchantTags, penchantTag);
    const personalityTags =
      penchantExclusions[penchantIndex].concat(penchantTag);
    const penchantName = loc(penchantNames[penchantIndex]);

    return {
      penchants: personalityTags,
      penchantName: penchantName,
    };
  },
});
