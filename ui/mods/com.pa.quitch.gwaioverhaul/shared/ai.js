define({
  penchants: function () {
    var penchantTags = [
      "Vanilla",
      "Artillery",
      "Fortress",
      "AllTerrain",
      "Assault",
      "Boomer",
      "Heavy",
      "Infernodier",
      "Raider",
      "Meta",
      "Sniper",
      "Nuker",
    ];
    var penchantExclusions = [
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
    ];
    var penchantNames = [
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
    ];
    var penchantTag = _.sample(penchantTags);
    var penchantIndex = _.indexOf(penchantTags, penchantTag);
    var personalityTags = penchantExclusions[penchantIndex].concat(penchantTag);
    var penchantName = loc(penchantNames[penchantIndex]);

    return {
      penchants: personalityTags,
      penchantName: penchantName,
    };
  },
  aiInUse: function () {
    var galaxy = model.game().galaxy();
    var originSystem = galaxy.stars()[galaxy.origin()].system();
    if (originSystem.gwaio) {
      return originSystem.gwaio.ai;
    }
    return "Titans";
  },
});
