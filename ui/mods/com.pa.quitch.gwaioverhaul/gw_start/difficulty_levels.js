define({
  difficulties: [
    {
      difficultyName: "!LOC:Beginner",
      customDifficulty: false,
      goForKill: false,
      microType: 0,
      mandatoryMinions: 0,
      minionMod: 0,
      priority_scout_metal_spots: false,
      useEasierSystemTemplate: true,
      factory_build_delay_min: 0,
      factory_build_delay_max: 12,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: false,
      per_expansion_delay: 0,
      personality_tags: ["Default", "SlowerExpansion", "Tutorial", "queller"],
      econBase: 0.35,
      econRatePerDist: 0.05,
      max_basic_fabbers: 5,
      max_advanced_fabbers: 5,
      ffa_chance: 25,
      bossCommanders: 1,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.5,
      factionTechHandicap: 2,
    },
    {
      difficultyName: "!LOC:Casual",
      customDifficulty: false,
      goForKill: false,
      microType: 0,
      mandatoryMinions: 0,
      minionMod: 0,
      priority_scout_metal_spots: false,
      useEasierSystemTemplate: true,
      factory_build_delay_min: 0,
      factory_build_delay_max: 12,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: false,
      per_expansion_delay: 0,
      personality_tags: ["Default", "SlowerExpansion", "queller"],
      econBase: 0.35,
      econRatePerDist: 0.05,
      max_basic_fabbers: 6,
      max_advanced_fabbers: 6,
      ffa_chance: 25,
      bossCommanders: 1,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.5,
      factionTechHandicap: 2,
    },
    {
      difficultyName: "!LOC:Iron",
      customDifficulty: false,
      goForKill: false,
      microType: 1,
      mandatoryMinions: 0,
      minionMod: 0.16,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "SlowerExpansion", "queller"],
      econBase: 0.425,
      econRatePerDist: 0.075,
      max_basic_fabbers: 7,
      max_advanced_fabbers: 7,
      ffa_chance: 25,
      bossCommanders: 1,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.45,
      factionTechHandicap: 1.5,
      starting_location_evaluation_radius: 100,
    },
    {
      difficultyName: "!LOC:Bronze",
      customDifficulty: false,
      goForKill: true,
      microType: 2,
      mandatoryMinions: 0,
      minionMod: 0.19,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "queller"],
      econBase: 0.5,
      econRatePerDist: 0.1,
      max_basic_fabbers: 8,
      max_advanced_fabbers: 8,
      ffa_chance: 25,
      bossCommanders: 2,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.4,
      factionTechHandicap: 1,
      starting_location_evaluation_radius: 150,
    },
    {
      difficultyName: "!LOC:Silver",
      customDifficulty: false,
      goForKill: true,
      microType: 2,
      mandatoryMinions: 0,
      minionMod: 0.24,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "queller"],
      econBase: 0.6,
      econRatePerDist: 0.1,
      max_basic_fabbers: 9,
      max_advanced_fabbers: 9,
      ffa_chance: 25,
      bossCommanders: 2,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.35,
      factionTechHandicap: 0.5,
      starting_location_evaluation_radius: 200,
    },
    {
      difficultyName: "!LOC:Gold",
      customDifficulty: false,
      goForKill: true,
      microType: 2,
      mandatoryMinions: 0,
      minionMod: 0.28,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "queller"],
      econBase: 0.7,
      econRatePerDist: 0.15,
      max_basic_fabbers: 10,
      max_advanced_fabbers: 10,
      ffa_chance: 25,
      bossCommanders: 3,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.3,
      factionTechHandicap: 0,
      starting_location_evaluation_radius: 250,
    },
    {
      difficultyName: "!LOC:Platinum",
      customDifficulty: false,
      goForKill: true,
      microType: 2,
      mandatoryMinions: 0,
      minionMod: 0.39,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "PreventsWaste", "queller"],
      econBase: 1,
      econRatePerDist: 0.175,
      max_basic_fabbers: 11,
      max_advanced_fabbers: 11,
      ffa_chance: 25,
      bossCommanders: 3,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.25,
      factionTechHandicap: -0.5,
      starting_location_evaluation_radius: 300,
    },
    {
      difficultyName: "!LOC:Diamond",
      customDifficulty: false,
      goForKill: true,
      microType: 2,
      mandatoryMinions: 0,
      minionMod: 0.5,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "PreventsWaste", "queller"],
      econBase: 1.2,
      econRatePerDist: 0.2,
      max_basic_fabbers: 12,
      max_advanced_fabbers: 12,
      ffa_chance: 25,
      bossCommanders: 4,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.2,
      factionTechHandicap: -0.5,
      starting_location_evaluation_radius: 400,
    },
    {
      difficultyName: "!LOC:Uber",
      customDifficulty: false,
      goForKill: true,
      microType: 2,
      mandatoryMinions: -1,
      minionMod: 0.74,
      priority_scout_metal_spots: true,
      useEasierSystemTemplate: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: true,
      per_expansion_delay: 0,
      personality_tags: ["Default", "PreventsWaste", "queller"],
      econBase: 10,
      econRatePerDist: 0,
      max_basic_fabbers: 13,
      max_advanced_fabbers: 13,
      ffa_chance: 25,
      bossCommanders: 5,
      landAnywhereChance: 20,
      suddenDeathChance: 10,
      bountyModeChance: 25,
      bountyModeValue: 0.2,
      factionTechHandicap: -0.5,
      starting_location_evaluation_radius: 400,
    },
    {
      difficultyName: "!LOC:Custom",
      customDifficulty: true,
    },
  ],
});
