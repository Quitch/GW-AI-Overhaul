define(function () {
  var systemDescriptions = [
    "!LOC:Osiris has always lead a solitary existence. He was always more interested in the parts of his fellow commanders than the commanders themselves. With every battle won he would take the best pieces left of the broken adversary and integrate them into his form. Osiris is considered one of the most dangerous forces in the galaxy.",
    "!LOC:As Osiris replaced pieces of himself with those of fallen foes, he would store older parts for replacements and repairs. Eventually, Osiris acquired enough spare parts to construct an entirely new commander. This would be the birth of the first Seeker.",
    "!LOC:The Revenants are unique in that their motivations are individual rather than collective. Each Seeker follows in the example of their legendary Osiris--they seek battle to become stronger through their fallen enemies, and to create more Revenants.",
    "!LOC:Osiris holds no interest in ruling, and instead serves more as an exemplar, whether he cares to or not. Therefore, it falls to a small council of older Seekers to direct the affairs of The Revenants at large--primarily making sure that they're fighting the other factions instead of amongst themselves.",
    "!LOC:Osiris often considered the most dangerous commander in all the galaxy for the amount of annihilations he is credited with. A force of war equal to any army, high command of any faction takes his movements into consideration when deploying forces.",
  ];
  var chosenDescription = _.sample(systemDescriptions);

  var baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: [
      [204, 255, 255],
      [192, 192, 192],
    ],
    econ_rate: 1,
    personality: {
      percent_open_vehicle: 0.25,
      percent_open_bot: 0.2,
      percent_open_air: 0.05,
      percent_open_naval: 0.05,
      percent_open_orbital: 0.45,
      percent_vehicle: 0.25,
      percent_bot: 0.2,
      percent_air: 0.05,
      percent_naval: 0.05,
      percent_orbital: 0.45,
      metal_drain_check: 0.54,
      energy_drain_check: 0.65,
      metal_demand_check: 0.71,
      energy_demand_check: 0.8,
      micro_type: 0,
      go_for_the_kill: false,
      neural_data_mod: 1,
      personality_tags: ["Default", "GWAlly", "SlowerExpansion"],
      adv_eco_mod: 1.3,
      adv_eco_mod_alone: 0.85,
      priority_scout_metal_spots: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: false,
      per_expansion_delay: 0,
      fabber_to_factory_ratio_basic: 1,
      fabber_to_factory_ratio_advanced: 1,
      fabber_alone_on_planet_mod: 3,
      basic_to_advanced_factory_ratio: 0,
      factory_alone_on_planet_mod: 0.25,
      min_basic_fabbers: 2,
      max_basic_fabbers: 5,
      min_advanced_fabbers: 3,
      max_advanced_fabbers: 5,
    },
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  var commanders = [
    {
      name: "Betadyne",
      character: "!LOC:Space Invader",
      color: [
        [255, 204, 204],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0,
        percent_open_bot: 0,
        percent_open_air: 0,
        percent_open_naval: 0,
        percent_open_orbital: 1,
        percent_vehicle: 0,
        percent_bot: 0,
        percent_air: 0,
        percent_naval: 0,
        percent_orbital: 1,
      },
      commander: "/pa/units/commanders/raptor_betadyne/raptor_betadyne.json",
    },
    {
      name: "Centurion",
      character: "!LOC:Astronaut",
      color: [
        [255, 153, 153],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0,
        percent_open_bot: 0,
        percent_open_air: 0.5,
        percent_open_naval: 0,
        percent_open_orbital: 0.5,
        percent_land: 0,
        percent_air: 0.5,
        percent_naval: 0,
        percent_orbital: 0.5,
      },
      commander: "/pa/units/commanders/raptor_centurion/raptor_centurion.json",
    },
    {
      name: "Diremachine",
      character: "!LOC:Uber",
      color: [
        [255, 102, 102],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0.5,
        percent_open_bot: 0.5,
        percent_open_air: 0,
        percent_open_naval: 0,
        percent_open_orbital: 0,
        percent_bot: 0.4,
        percent_vehicle: 0.4,
        percent_air: 0.2,
        percent_naval: 0,
        percent_orbital: 0,
        energy_drain_check: 0.72,
        metal_demand_check: 0.8,
        energy_demand_check: 0.8,
        adv_eco_mod: 1,
        fabber_to_factory_ratio_advanced: 2,
        fabber_alone_on_planet_mod: 3,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/raptor_diremachine/raptor_diremachine.json",
    },
    {
      name: "Enderstryke71",
      character: "!LOC:Platinum",
      color: [
        [255, 0, 0],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0.05,
        percent_open_bot: 0.9,
        percent_open_air: 0,
        percent_open_naval: 0.05,
        percent_open_orbital: 0,
        percent_bot: 0.25,
        percent_vehicle: 0.55,
        percent_air: 0.2,
        percent_naval: 0,
        percent_orbital: 0,
        energy_drain_check: 0.77,
        metal_demand_check: 0.85,
        energy_demand_check: 0.92,
        neural_data_mod: 1.15,
        adv_eco_mod: 1,
        fabber_to_factory_ratio_advanced: 2,
        fabber_alone_on_planet_mod: 3,
        min_advanced_fabbers: 2,
      },
      commander:
        "/pa/units/commanders/raptor_enderstryke71/raptor_enderstryke71.json",
    },
    {
      name: "Iwmiked",
      character: "!LOC:Gold",
      color: [
        [204, 0, 0],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0.5,
        percent_open_bot: 0.5,
        percent_open_air: 0,
        percent_open_naval: 0,
        percent_open_orbital: 0,
        percent_vehicle: 0.5,
        percent_bot: 0.5,
        percent_air: 0,
        percent_naval: 0,
        percent_orbital: 0,
        energy_drain_check: 0.77,
        metal_demand_check: 0.85,
        energy_demand_check: 0.92,
        neural_data_mod: 1.3,
        adv_eco_mod: 1,
        fabber_alone_on_planet_mod: 3,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 2,
      },
      commander: "/pa/units/commanders/raptor_iwmiked/raptor_iwmiked.json",
    },
    {
      name: "Majuju",
      character: "!LOC:Defender",
      color: [
        [153, 0, 0],
        [192, 192, 192],
      ],
      personality: {
        metal_drain_check: 0.71,
        energy_drain_check: 0.8,
        metal_demand_check: 0.54,
        energy_demand_check: 0.65,
        adv_eco_mod: 1,
        min_basic_fabbers: 4,
      },
      commander: "/pa/units/commanders/raptor_majuju/raptor_majuju.json",
    },
    {
      name: "Nefelpitou",
      character: "!LOC:Luddite",
      color: [
        [255, 204, 153],
        [192, 192, 192],
      ],
      personality: {
        adv_eco_mod: 3,
        adv_eco_mod_alone: 3,
      },
      commander:
        "/pa/units/commanders/raptor_nefelpitou/raptor_nefelpitou.json",
    },
    {
      name: "Invictus",
      character: "!LOC:Technologist",
      color: [
        [255, 178, 102],
        [192, 192, 192],
      ],
      personality: {
        adv_eco_mod: 0.5,
        adv_eco_mod_alone: 0.5,
        fabber_to_factory_ratio_basic: 3,
        min_basic_fabbers: 4,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/imperial_invictus/imperial_invictus.json",
    },
    {
      name: "Rallus",
      character: "!LOC:Cautious",
      color: [
        [255, 153, 51],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 0.75,
        min_basic_fabbers: 4,
      },
      commander: "/pa/units/commanders/raptor_rallus/raptor_rallus.json",
    },
    {
      name: "Stickman9000",
      character: "!LOC:Aggressive",
      color: [
        [255, 128, 0],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 2,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/raptor_stickman9000/raptor_stickman9000.json",
    },
    {
      name: "Zaazzaa",
      character: "!LOC:Rush",
      color: [
        [204, 102, 0],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0,
        percent_open_bot: 1,
        percent_open_air: 0,
        percent_open_naval: 0,
        percent_open_orbital: 0,
        percent_bot: 1,
        percent_vehicle: 0,
        percent_air: 0,
        percent_naval: 0,
        percent_orbital: 0,
        neural_data_mod: 1.5,
        adv_eco_mod: 2,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/raptor_zaazzaa/raptor_zaazzaa.json",
    },
    {
      name: "Aeson",
      character: "!LOC:Turtle",
      color: [
        [255, 255, 204],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0.9,
        percent_open_bot: 0.1,
        percent_open_air: 0,
        percent_open_naval: 0,
        percent_open_orbital: 0,
        neural_data_mod: 0.5,
        adv_eco_mod: 0.5,
        adv_eco_mod_alone: 0.5,
        fabber_to_factory_ratio_basic: 3,
        fabber_to_factory_ratio_advanced: 3,
        min_basic_fabbers: 4,
        max_basic_fabbers: 10,
        max_advanced_fabbers: 10,
      },
      commander: "/pa/units/commanders/tank_aeson/tank_aeson.json",
    },
    {
      name: "Banditks",
      character: "!LOC:Original",
      color: [
        [255, 255, 153],
        [192, 192, 192],
      ],
      personality: {
        percent_open_vehicle: 0.23,
        percent_open_bot: 0.23,
        percent_open_air: 0.46,
        percent_open_naval: 0.08,
        percent_open_orbital: 0,
        percent_land: 0.3,
        percent_air: 0.3,
        percent_naval: 0.05,
        percent_orbital: 0.35,
      },
      commander: "/pa/units/commanders/tank_banditks/tank_banditks.json",
    },
    {
      name: "SPZ58624",
      character: "!LOC:Absurd",
      color: [
        [255, 255, 102],
        [192, 192, 192],
      ],
      commander: "/pa/units/commanders/raptor_spz58624/raptor_spz58624.json",
    },
    {
      name: "XOV",
      character: "!LOC:Relentless",
      color: [
        [255, 255, 0],
        [192, 192, 192],
      ],
      personality: {
        metal_drain_check: 0.44,
        energy_drain_check: 0.55,
        metal_demand_check: 0.61,
        energy_demand_check: 0.7,
        neural_data_mod: 1.2,
        adv_eco_mod: 1.2,
        adv_eco_mod_alone: 0.95,
      },
      commander: "/pa/units/commanders/raptor_xov/raptor_xov.json",
    },
    {
      name: "Reaver",
      character: "!LOC:Swarm",
      color: [
        [204, 204, 0],
        [192, 192, 192],
      ],
      personality: {
        metal_demand_check: 0.99,
        energy_demand_check: 0.99,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/tank_reaver/tank_reaver.json",
    },
    {
      name: "Sadiga",
      character: "!LOC:Economist",
      color: [
        [153, 153, 0],
        [192, 192, 192],
      ],
      personality: {
        metal_drain_check: 0.71,
        energy_drain_check: 0.8,
        metal_demand_check: 0.71,
        energy_demand_check: 0.8,
        adv_eco_mod: 1,
        min_basic_fabbers: 4,
      },
      commander: "/pa/units/commanders/tank_sadiga/tank_sadiga.json",
    },
  ];

  var minions = _.map(commanders, function (personalityModifiers) {
    return _.merge(_.cloneDeep(baselinePersonality), personalityModifiers);
  });

  return {
    name: "Revenants",
    color: [
      [236, 34, 35],
      [192, 192, 192],
    ],
    teams: [
      {
        name: "Revenants",
        boss: {
          name: "First Seeker Osiris",
          character: "!LOC:Boss",
          econ_rate: 1,
          personality: {
            percent_open_vehicle: 0.5,
            percent_open_bot: 0.5,
            percent_open_air: 0,
            percent_open_naval: 0,
            percent_open_orbital: 0,
            percent_land: 0.05,
            percent_air: 0,
            percent_naval: 0,
            percent_orbital: 0.95,
            metal_drain_check: 0.54,
            energy_drain_check: 0.57,
            metal_demand_check: 0.85,
            energy_demand_check: 0.82,
            micro_type: 2,
            go_for_the_kill: true,
            neural_data_mod: 1,
            adv_eco_mod: 1,
            adv_eco_mod_alone: 0.85,
            fabber_to_factory_ratio_basic: 2,
            fabber_to_factory_ratio_advanced: 2,
            fabber_alone_on_planet_mod: 3,
            basic_to_advanced_factory_ratio: 0,
            factory_alone_on_planet_mod: 0.5,
            min_basic_fabbers: 5,
            min_advanced_fabbers: 1,
          },
          commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
        },
        systemDescription: chosenDescription,
        systemTemplate: {
          name: "Revenants",
          Planets: [
            {
              name: "Alenquer",
              starting_planet: true,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [600, 800],
              Height: [20, 25],
              Water: [0, 10],
              Temp: [0, 100],
              MetalDensity: [100, 100],
              MetalClusters: [24, 49],
              BiomeScale: [100, 100],
              Position: [40000, 0],
              Velocity: [0, 111.803],
              Biomes: ["metal"],
            },
            {
              name: "Xianyao",
              starting_planet: true,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [225, 225],
              Height: [0, 10],
              Water: [0, 10],
              Temp: [0, 100],
              MetalDensity: [100, 100],
              MetalClusters: [100, 100],
              BiomeScale: [100, 100],
              Position: [40000, -5000],
              Velocity: [-223.6067, 111.80299],
              Biomes: ["moon"],
            },
            {
              name: "Epiphany",
              starting_planet: true,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [225, 225],
              Height: [0, 10],
              Water: [0, 10],
              Temp: [0, 100],
              MetalDensity: [100, 100],
              MetalClusters: [100, 100],
              BiomeScale: [100, 100],
              Position: [35700, 2500],
              Velocity: [112.683, 305.6186],
              Biomes: ["moon"],
            },
            {
              name: "Varthema",
              starting_planet: true,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [225, 225],
              Height: [0, 10],
              Water: [0, 10],
              Temp: [0, 100],
              MetalDensity: [100, 100],
              MetalClusters: [100, 100],
              BiomeScale: [100, 100],
              Position: [44300, 2500],
              Velocity: [112.683, -82.0126],
              Biomes: ["moon"],
            },
          ],
        },
      },
    ],
    minions: minions,
  };
});
