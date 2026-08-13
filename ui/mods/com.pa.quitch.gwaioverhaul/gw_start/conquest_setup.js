// The measured half of Galactic Conquest war generation: Guardians placement
// and the gwaio.conquest snapshot. The setup.js branch supplies engine values.
define([], function () {
  return {
    // In Conquest every AI star is a boss star, so the stock sweep's "first
    // non-boss AI star" rule finds nothing and the Guardians need their own
    // placement: any star no faction spawned on, except the player's origin.
    guardiansCandidates: function (stars, originIndex) {
      var candidates = [];
      _.forEach(stars, function (star, starIndex) {
        if (!star.ai() && starIndex !== originIndex) {
          candidates.push(starIndex);
        }
      });
      return candidates;
    },

    // The Guardians' one identity for both modes: the War sweep assigns this
    // over a converted worker, Conquest starts from it directly.
    buildGuardiansAi: function (econRate, bossCommanders) {
      return {
        icon: "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/guardians.png",
        boss: true, // otherwise it won't display its icon
        mirrorMode: true,
        treasurePlanet: true,
        econ_rate: econRate,
        bossCommanders: bossCommanders,
        name: "The Guardians",
        character: "!LOC:Unknown",
        color: [
          [255, 255, 255],
          [255, 192, 203],
        ],
        commander: "/pa/units/commanders/raptor_unicorn/raptor_unicorn.json",
      };
    },

    treasureDescription:
      "!LOC:This is a treasure planet, hiding a loadout you have yet to unlock. But beware the guardians! Armed with whatever technology bonuses you bring with you to this planet; they will stop at nothing to defend its secrets.",

    // Everything the gw_play turn engine needs that only the lobby knows:
    // the effective difficulty numbers (Custom has no tier to re-derive them
    // from) and the raw personality values applyPersonality consumes.
    settings: function (params) {
      return {
        maxDist: params.maxDist,
        playerCount: params.playerCount,
        lastAiPhaseTurn: 1,
        factions: params.factions.slice(),
        difficulty: {
          econBase: params.difficulty.econBase,
          econRatePerDist: params.difficulty.econRatePerDist,
          mandatoryMinions: params.difficulty.mandatoryMinions,
          minionMod: params.difficulty.minionMod,
          factionTechHandicap: params.difficulty.factionTechHandicap,
          ffaChance: params.difficulty.ffaChance,
          alliedCommanderChance: params.difficulty.alliedCommanderChance,
          bossCommanders: params.difficulty.bossCommanders,
        },
        personality: _.assign({}, params.personality),
        gameModes: {
          landAnywhereChance: params.gameModes.landAnywhereChance,
          suddenDeathChance: params.gameModes.suddenDeathChance,
          bountyModeChance: params.gameModes.bountyModeChance,
          bountyModeValue: params.gameModes.bountyModeValue,
          eradicationModeChance: params.gameModes.eradicationModeChance,
        },
      };
    },
  };
});
