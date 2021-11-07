// Legonis Machina
define(function () {
  var baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: [
      [204, 255, 255],
      [192, 192, 192],
    ],
    econ_rate: 1,
    personality: {
      percent_vehicle: 0.55,
      percent_bot: 0.2,
      percent_air: 0.15,
      percent_naval: 0.05,
      percent_orbital: 0.05,
      metal_drain_check: 0.54,
      energy_drain_check: 0.65,
      metal_demand_check: 0.71,
      energy_demand_check: 0.8,
      micro_type: 0,
      go_for_the_kill: false,
      neural_data_mod: 1,
      personality_tags: ["Default", "GWAlly", "SlowerExpansion", "queller"],
      adv_eco_mod: 1,
      adv_eco_mod_alone: 0.85,
      priority_scout_metal_spots: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: false,
      per_expansion_delay: 0,
      fabber_to_factory_ratio_basic: 1,
      fabber_to_factory_ratio_advanced: 1,
      fabber_alone_on_planet_mod: 2,
      basic_to_advanced_factory_ratio: 0,
      factory_alone_on_planet_mod: 0.5,
      min_basic_fabbers: 2,
      max_basic_fabbers: 4,
      min_advanced_fabbers: 3,
      max_advanced_fabbers: 3,
    },
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };

  return {
    name: "Legonis Machina",
    color: [
      [0, 176, 255],
      [192, 192, 192],
    ],
    teams: [
      {
        name: "Legonis Machina",
        boss: {
          name: "Imperator Invictus",
          character: "!LOC:Boss",
          econ_rate: 1,
          personality: {
            percent_vehicle: 0.55,
            percent_bot: 0.2,
            percent_air: 0.15,
            percent_naval: 0,
            percent_orbital: 0.1,
            metal_drain_check: 0.54,
            energy_drain_check: 0.65,
            metal_demand_check: 0.71,
            energy_demand_check: 0.8,
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
        systemDescription: _.sample([
          "!LOC:The goal of the Legionis Machina is simple--conquest. Invictus is the designated ruler of the galaxy, and any commanders disobeying this directive are faulty.",
          "!LOC:When Invictus reactivated, his memory was more whole than most commanders. This is where his assertion of his right to rule came from. That may or may not be true, but what is true is that Invictus knows more about the origin of the commanders than he cares to tell his compatriots.",
          "!LOC:Unlike the other factions, the Legionis Machina operates as a hierarchy. Senior Legates have several Vassal Legates assigned to them, and all Legates are subjects of Invictus himself.",
          "!LOC:If war is a commander's natural state, then the purest expression of this is the Legionis Machina. It begs the question, though--what happens after they conquer this galaxy, if they do?",
          "!LOC:The Legionis Machina can be considered a cult of personality, in that their purpose is void without Invictus. This is likely where their bitter hatred of The Synchronous comes from, as they view Metrarch as a false idol of sorts.",
        ]),
        systemTemplate: {
          name: "Legonis Machina",
          Planets: [
            {
              name: "Kohr",
              starting_planet: true,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [700, 700],
              Height: [20, 25],
              Water: [40, 50],
              Temp: [0, 100],
              MetalDensity: [50, 70],
              MetalClusters: [25, 49],
              BiomeScale: [100, 100],
              Position: [-47500, 0],
              Velocity: [0, -294.3776],
              Biomes: ["earth"],
            },
            {
              name: "Entara",
              starting_planet: true,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [700, 700],
              Height: [5, 15],
              Water: [0, 0],
              Temp: [0, 0],
              MetalDensity: [50, 70],
              MetalClusters: [25, 49],
              BiomeScale: [100, 100],
              Position: [-32500, 0],
              Velocity: [0, -70.7708],
              Biomes: ["moon"],
            },
            {
              name: "Agoge",
              starting_planet: false,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [1500, 1500],
              Height: [0, 0],
              Water: [0, 0],
              Temp: [0, 100],
              MetalDensity: [0, 0],
              MetalClusters: [0, 0],
              BiomeScale: [0, 0],
              Position: [-40000, 0],
              Velocity: [0, -111.8034],
              Biomes: ["gas"],
            },
          ],
        },
      },
    ],
    minion_colors: [
      [
        [204, 255, 255],
        [192, 192, 192],
      ],
      [
        [153, 255, 255],
        [192, 192, 192],
      ],
      [
        [102, 255, 255],
        [192, 192, 192],
      ],
      [
        [0, 255, 255],
        [192, 192, 192],
      ],
      [
        [0, 204, 204],
        [192, 192, 192],
      ],
      [
        [0, 153, 153],
        [192, 192, 192],
      ],
      [
        [153, 204, 255],
        [192, 192, 192],
      ],
      [
        [102, 178, 255],
        [192, 192, 192],
      ],
      [
        [51, 153, 255],
        [192, 192, 192],
      ],
      [
        [0, 128, 255],
        [192, 192, 192],
      ],
      [
        [0, 102, 204],
        [192, 192, 192],
      ],
      [
        [0, 76, 153],
        [192, 192, 192],
      ],
      [
        [0, 0, 153],
        [192, 192, 192],
      ],
      [
        [0, 0, 204],
        [192, 192, 192],
      ],
      [
        [0, 0, 225],
        [192, 192, 192],
      ],
      [
        [51, 51, 255],
        [192, 192, 192],
      ],
      [
        [204, 229, 255],
        [192, 192, 192],
      ],
    ],
    minions: _.map(
      [
        {
          name: "Able",
          character: "!LOC:Armor",
          personality: {
            percent_vehicle: 1,
            percent_bot: 0,
            percent_air: 0,
            percent_naval: 0,
            percent_orbital: 0,
          },
          commander: "/pa/units/commanders/imperial_able/imperial_able.json",
        },
        {
          name: "AceAI",
          character: "!LOC:Roboticist",
          personality: {
            percent_vehicle: 0,
            percent_bot: 1,
            percent_naval: 0,
            percent_orbital: 0,
          },
          commander: "/pa/units/commanders/imperial_aceal/imperial_aceal.json",
        },
        {
          name: "Alpha",
          character: "!LOC:Uber",
          personality: {
            energy_drain_check: 0.72,
            metal_demand_check: 0.8,
            fabber_to_factory_ratio_advanced: 2,
            fabber_alone_on_planet_mod: 3,
            min_basic_fabbers: 3,
            min_advanced_fabbers: 1,
          },
          commander: "/pa/units/commanders/imperial_alpha/imperial_alpha.json",
        },
        {
          name: "Aryst0krat",
          character: "!LOC:Platinum",
          personality: {
            energy_drain_check: 0.77,
            metal_demand_check: 0.85,
            energy_demand_check: 0.92,
            neural_data_mod: 1.15,
            fabber_to_factory_ratio_advanced: 2,
            fabber_alone_on_planet_mod: 3,
            min_advanced_fabbers: 2,
          },
          commander:
            "/pa/units/commanders/imperial_aryst0krat/imperial_aryst0krat.json",
        },
        {
          name: "Chronoblip",
          character: "!LOC:Gold",
          personality: {
            energy_drain_check: 0.77,
            metal_demand_check: 0.85,
            energy_demand_check: 0.92,
            neural_data_mod: 1.3,
            fabber_alone_on_planet_mod: 3,
            min_basic_fabbers: 3,
            min_advanced_fabbers: 2,
          },
          commander:
            "/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json",
        },
        {
          name: "Mjon",
          character: "!LOC:Defender",
          econ_rate: 1,
          personality: {
            metal_drain_check: 0.71,
            energy_drain_check: 0.8,
            metal_demand_check: 0.54,
            energy_demand_check: 0.65,
            min_basic_fabbers: 4,
          },
          commander: "/pa/units/commanders/imperial_mjon/imperial_mjon.json",
        },
        {
          name: "Delta",
          character: "!LOC:Luddite",
          personality: {
            basic_to_advanced_factory_ratio: 10,
          },
          commander: "/pa/units/commanders/imperial_delta/imperial_delta.json",
        },
        {
          name: "Enzomatrix",
          character: "!LOC:Technologist",
          personality: {
            adv_eco_mod: 0.5,
            adv_eco_mod_alone: 0.5,
            fabber_to_factory_ratio_basic: 3,
            min_basic_fabbers: 4,
            min_advanced_fabbers: 1,
          },
          commander:
            "/pa/units/commanders/imperial_enzomatrix/imperial_enzomatrix.json",
        },
        {
          name: "Fiveleafclover",
          character: "!LOC:Cautious",
          personality: {
            neural_data_mod: 0.75,
            min_basic_fabbers: 4,
          },
          commander:
            "/pa/units/commanders/imperial_fiveleafclover/imperial_fiveleafclover.json",
        },
        {
          name: "Gamma",
          character: "!LOC:Aggressive",
          personality: {
            neural_data_mod: 2,
            min_advanced_fabbers: 1,
          },
          commander: "/pa/units/commanders/imperial_gamma/imperial_gamma.json",
        },
        {
          name: "Gnugfur",
          character: "!LOC:Rush",
          econ_rate: 1,
          personality: {
            neural_data_mod: 1.5,
            adv_eco_mod: 2,
            min_advanced_fabbers: 1,
          },
          commander:
            "/pa/units/commanders/imperial_gnugfur/imperial_gnugfur.json",
        },
        {
          name: "Nemicus",
          character: "!LOC:Turtle",
          personality: {
            neural_data_mod: 0.5,
            adv_eco_mod: 0.5,
            adv_eco_mod_alone: 0.5,
            fabber_to_factory_ratio_basic: 3,
            fabber_to_factory_ratio_advanced: 3,
            min_basic_fabbers: 4,
            max_basic_fabbers: 8,
            max_advanced_fabbers: 6,
          },
          commander: "/pa/units/commanders/raptor_nemicus/raptor_nemicus.json",
        },
        {
          name: "Kapowaz",
          character: "!LOC:Original",
          personality: {
            percent_vehicle: 0.275,
            percent_bot: 0.275,
            percent_air: 0.35,
            percent_naval: 0.05,
            percent_orbital: 0.05,
            metal_drain_check: 0.75,
            energy_drain_check: 0.85,
            metal_demand_check: 0.75,
            energy_demand_check: 0.85,
            fabber_to_factory_ratio_basic: 1.5,
            min_basic_fabbers: 1,
          },
          commander:
            "/pa/units/commanders/imperial_kapowaz/imperial_kapowaz.json",
        },
        {
          name: "JT100010117",
          character: "!LOC:Absurd",
          personality: {
            energy_drain_check: 0.65,
            metal_demand_check: 0.71,
            adv_eco_mod: 1.3,
          },
          commander:
            "/pa/units/commanders/imperial_jt100010117/imperial_jt100010117.json",
        },
        {
          name: "Kevin4001",
          character: "!LOC:Relentless",
          personality: {
            metal_drain_check: 0.44,
            energy_drain_check: 0.55,
            metal_demand_check: 0.61,
            energy_demand_check: 0.7,
            neural_data_mod: 1.2,
            adv_eco_mod: 1.2,
            adv_eco_mod_alone: 0.95,
          },
          commander:
            "/pa/units/commanders/imperial_kevin4001/imperial_kevin4001.json",
        },
        {
          name: "Mostlikely",
          character: "!LOC:Swarm",
          personality: {
            metal_demand_check: 0.99,
            energy_demand_check: 0.99,
            min_basic_fabbers: 3,
            min_advanced_fabbers: 1,
          },
          commander:
            "/pa/units/commanders/imperial_mostlikely/imperial_mostlikely.json",
        },
        {
          name: "Nagasher",
          character: "!LOC:Economist",
          personality: {
            metal_drain_check: 0.71,
            energy_drain_check: 0.8,
            metal_demand_check: 0.99,
            energy_demand_check: 0.99,
            min_basic_fabbers: 4,
          },
          commander:
            "/pa/units/commanders/imperial_nagasher/imperial_nagasher.json",
        },
      ],
      function (personalityModifiers) {
        return _.merge(_.cloneDeep(baselinePersonality), personalityModifiers);
      }
    ),
  };
});
