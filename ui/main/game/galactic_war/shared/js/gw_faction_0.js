// !LOCNS:galactic_war
define([], function () {
  return {
    name: 'Legonis Machina',
    color: [[0, 176, 255], [192, 192, 192]],
    teams: [
      {
        name: 'Kohr - Legonis Machina',
        boss: {
          name: 'Imperator Invictus',
          econ_rate: 1.5,
          personality: {
            percent_land: 0.4,
            percent_air: 0.35,
            percent_naval: 0.2,
            percent_orbital: 0.05,
            metal_drain_check: 0.54,
            energy_drain_check: 0.57,
            metal_demand_check: 0.85,
            energy_demand_check: 0.82,
            micro_type: 2,
            go_for_the_kill: true,
            neural_data_mod: 1
          },
          commander: '/pa/units/commanders/imperial_invictus/imperial_invictus.json',

        },
        bossCard: 'gwc_start_artillery',
        systemDescription: "!LOC:The goal of the Legionis Machina is simple--conquest. Invictus is the designated ruler of the galaxy, and any commanders disobeying this directive are faulty.",
        systemTemplate: {
          name: 'Kohr',
          Planets: [
            {
              name: 'Kohr Prime',
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
              Biomes: ['earth']
            },
            {
              name: 'Kohr Beta',
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
              Biomes: ['moon']
            },
            {
              name: 'Kohr Gamma',
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
              Biomes: ['gas']
            }
          ]
        }
      },
      {
        name: 'Entara - Legonis Machina',
        boss: {
          name: 'Imperator Invictus',
          econ_rate: 1.5,
          personality: {
            percent_land: 0.4,
            percent_air: 0.35,
            percent_naval: 0.2,
            percent_orbital: 0.05,
            metal_drain_check: 0.54,
            energy_drain_check: 0.57,
            metal_demand_check: 0.85,
            energy_demand_check: 0.82,
            micro_type: 2,
            go_for_the_kill: true,
            neural_data_mod: 1
          },
          commander: '/pa/units/commanders/imperial_invictus/imperial_invictus.json'
        },
        bossCard: 'gwc_start_combatcdr',
        systemDescription: "!LOC:When Invictus reactivated, his memory was more whole than most commanders. This is where his assertion of his right to rule came from. That may or may not be true, but what is true is that Invictus knows more about the origin of the commanders than he cares to tell his compatriots.",
        systemTemplate: {
          name: 'Entara - Legonis Machina',
          Planets: [
            {
              name: 'Entara  Prime',
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
              Biomes: ['earth']
            },
            {
              name: 'Entara Beta',
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
              Biomes: ['moon']
            },
            {
              name: 'Entara Gamma',
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
              Biomes: ['gas']
            }
          ]
        }
      },
      {
        name: 'Agoge - Legonis Machina',
        boss: {
          name: 'Imperator Invictus',
          econ_rate: 1.5,
          personality: {
            percent_land: 0.4,
            percent_air: 0.35,
            percent_naval: 0.2,
            percent_orbital: 0.05,
            metal_drain_check: 0.54,
            energy_drain_check: 0.57,
            metal_demand_check: 0.85,
            energy_demand_check: 0.82,
            micro_type: 2,
            go_for_the_kill: true,
            neural_data_mod: 1
          },
          commander: '/pa/units/commanders/imperial_invictus/imperial_invictus.json'
        },
        systemDescription: "!LOC:Unlike the other factions, the Legionis Machina operates as a hierarchy. Senior Legates have several Vassal Legates assigned to them, and all Legates are subjects of Invictus himself.",
        systemTemplate: {
          name: 'Agoge - Legonis Machina',
          Planets: [
            {
              name: 'Agoge Prime',
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
              Biomes: ['earth']
            },
            {
              name: 'Agoge Beta',
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
              Biomes: ['moon']
            },
            {
              name: 'Agoge Gamma',
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
              Biomes: ['gas']
            }
          ]
        }
      },
      {
        name: 'Tau Leporis - Legonis Machina',
        boss: {
          name: 'Imperator Invictus',
          econ_rate: 1.5,
          personality: {
            percent_land: 0.4,
            percent_air: 0.35,
            percent_naval: 0.2,
            percent_orbital: 0.05,
            metal_drain_check: 0.54,
            energy_drain_check: 0.57,
            metal_demand_check: 0.85,
            energy_demand_check: 0.82,
            micro_type: 2,
            go_for_the_kill: true,
            neural_data_mod: 1
          },
          commander: '/pa/units/commanders/imperial_invictus/imperial_invictus.json'
        },
        systemDescription: "!LOC:If war is a commander's natural state, then the purest expression of this is the Legionis Machina. It begs the question, though--what happens after they conquer this galaxy, if they do?",
        systemTemplate: {
          name: 'Tau Leporis - Legonis Machina',
          Planets: [
            {
              name: 'Tau Leporis Prime',
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
              Biomes: ['earth']
            },
            {
              name: 'Tau Leporis Beta',
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
              Biomes: ['moon']
            },
            {
              name: 'Tau Leporis Gamma',
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
              Biomes: ['gas']
            }
          ]
        }
      },
      {
        name: 'Poseidon\'s Wrath - Legonis Machina',
        boss: {
          name: 'Imperator Invictus',
          econ_rate: 1.5,
          personality: {
            percent_land: 0.4,
            percent_air: 0.35,
            percent_naval: 0.2,
            percent_orbital: 0.05,
            metal_drain_check: 0.54,
            energy_drain_check: 0.57,
            metal_demand_check: 0.85,
            energy_demand_check: 0.82,
            micro_type: 2,
            go_for_the_kill: true,
            neural_data_mod: 1
          },
          commander: '/pa/units/commanders/imperial_invictus/imperial_invictus.json'
        },
        systemDescription: "!LOC:The Legionis Machina can be considered a cult of personality, in that their purpose is void without Invictus. This is likely where their bitter hatred of The Synchronous comes from, as they view Metrarch as a false idol of sorts.",
        systemTemplate: {
          name: 'Poseidon\'s Wrath - Legonis Machina',
          Planets: [
            {
              name: 'Poseidon\'s Wrath Prime',
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
              Biomes: ['earth']
            },
            {
              name: 'Poseidon\'s Wrath Beta',
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
              Biomes: ['moon']
            },
            {
              name: 'Poseidon\'s Wrath Gamma',
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
              Biomes: ['gas']
            }
          ]
        }
      }
    ], // teams
    minions: [
      {
        // All Tanks
        name: 'Legate Able',
        econ_rate: 1,
        personality: {
          percent_vehicle: 1,
          percent_bot: 0,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1.35,
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
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Awarded several commendations for vigilance, Ancilius has decommissioned many commanders, factories, and metal planets suspected to be infected by the 'Synchronous Virus.'",
        commander: '/pa/units/commanders/imperial_able/imperial_able.json'
      },
      {
        // All Bots
        name: 'Legate AceAI',
        econ_rate: 1,
        personality: {
          percent_vehicle: 0,
          percent_bot: 1,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1.35,
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
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Attius is renowned within the Legion for having the most efficient factories and sturdiest nanolathes. Believing the key to victory is good construction, he spends many cycles obsessing over simulations and prototypes of new fabrication and production line algorithms.",
        commander: '/pa/units/commanders/imperial_aceal/imperial_aceal.json'
      },
      {
        // Uber
        name: 'Legate Alpha',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.85,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1,
          adv_eco_mod_alone: 0,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 0,
          factory_build_delay_max: 0,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 1,
          fabber_to_factory_ratio_advanced: 2,
          fabber_alone_on_planet_mod: 3,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 3,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 1,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Brutus was actually once a member of The Foundation. When exposed to old progenitor records of great conquerors, he became convinced that Enlightenment lied in the great conquest that Commander Invictus pursued. When swearing allegiance Brutus brought with him valuable Foundation intelligence and the old records that have helped shape the cultural identity of the Legion we know today.",
        commander: '/pa/units/commanders/imperial_alpha/imperial_alpha.json'
      },
      {
        // Platinum
        name: 'Legate Aryst0krat',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.77,
          metal_demand_check: 0.85,
          energy_demand_check: 0.92,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1.15,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1,
          adv_eco_mod_alone: 0,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 0,
          factory_build_delay_max: 0,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 1,
          fabber_to_factory_ratio_advanced: 2,
          fabber_alone_on_planet_mod: 3,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 2,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 2,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Many commanders in the Legion considered Bassus inefficient at best and defective at worst for his insistence on outfitting himself with armor five times thicker than other commanders at the cost of mobility. Their opinion changed when Bassus was recovered while drifting through space--the sole survivor of a pivotal battle that ended in a moon colliding with his base.",
        commander: '/pa/units/commanders/imperial_aryst0krat/imperial_aryst0krat.json'
      },
      {
        // Gold
        name: 'Legate Chronoblip',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.77,
          metal_demand_check: 0.85,
          energy_demand_check: 0.92,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1.3,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1,
          adv_eco_mod_alone: 0,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 0,
          factory_build_delay_max: 0,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 0.5,
          fabber_to_factory_ratio_advanced: 1,
          fabber_alone_on_planet_mod: 3,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 3,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 2,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Cassius is a firm practitioner of the ‘lead from the front’ mentality. This often results in he himself leading many daring charges, and intense melee conflicts with woefully unprepared enemy commanders.",
        commander: '/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json'
      },
      {
        // Silver
        name: 'Legate Mjon',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.77,
          metal_demand_check: 0.95,
          energy_demand_check: 0.92,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1.45,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1,
          adv_eco_mod_alone: 0,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 0,
          factory_build_delay_max: 0,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 2,
          fabber_to_factory_ratio_advanced: 1,
          fabber_alone_on_planet_mod: 1,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 4,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:The Legionis Machina tends to follow strict directives in how forces are organized are deployed. This makes innovation among the Legates uncommon. Maximus is an anomaly in his numerous failed prototypes for wheeled transport platform that would supposedly enable him to move across battlefields with swiftness and grace.",
        commander: '/pa/units/commanders/imperial_mjon/imperial_mjon.json'
      },
      {
        // Low Tech
        name: 'Legate Delta',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 3,
          adv_eco_mod_alone: 3,
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
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Domitius insists on being referred to as King Domitius, regardless of his actual rank. This has resulted in many reportings and personal reprimands from Invictus himself. Regardless, the reign of King Domitius continues.",
        commander: '/pa/units/commanders/imperial_delta/imperial_delta.json'
      },
      {
        // Tech
        name: 'Legate Enzomatrix',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 0.5,
          adv_eco_mod_alone: 0,
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
          min_basic_fabbers: 4,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 1,
          max_advanced_fabbers: 100
        },
        description: "!LOC:A close advisor to Invictus, Flavius often provides counsel on matters regarding autonomy among the Legate. While some older members of the Legion distrust such progressivism, rates of recruitment from other factions has increased noticeably.",
        commander: '/pa/units/commanders/imperial_enzomatrix/imperial_enzomatrix.json'
      },
      {
        // Cautious
        name: 'Legate Fiveleafclover',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 0.5,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1.35,
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
          min_basic_fabbers: 4,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 2,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Galba is one of the Legates in charge of maintaining colonies on suitable remote systems. These systems are valuable for a number of purposes from macro-scale resource extraction and processing to research and development.",
        commander: '/pa/units/commanders/imperial_fiveleafclover/imperial_fiveleafclover.json'
      },
      {
        // Aggressive
        name: 'Legate Gamma',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 2,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1.35,
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
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Hosidius is one of the most accomplished admirals the Legion has to offer. That being said, he near-refuses to operate any war effort on land. This has made deploying him effectively rather difficult.",
        commander: '/pa/units/commanders/imperial_gamma/imperial_gamma.json'
      },
      {
        // Rush
        name: 'Legate Gnugfur',
        econ_rate: 1,
        personality: {
          percent_bot: 1,
          percent_vehicle: 0,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 2,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 3,
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
          max_basic_fabbers: 100,
          min_advanced_fabbers: 1,
          max_advanced_fabbers: 100
        },
        description: "!LOC:A recently awakened commander, Junius has taken to war with a zeal that is normally reserved for older commanders that have had more time to develop personal identities. As such, he has been deployed primarily against The Synchronous, with the assumption that his fierce independence will make him naturally resistant to the 'Synchronous Virus.'",
        commander: '/pa/units/commanders/imperial_gnugfur/imperial_gnugfur.json'
      },
      {
        // Turtle
        name: 'Legate Invictus',
        econ_rate: 1,
        personality: {
          percent_land: 1,
          percent_air: 0,
          percent_naval: 0,
          percent_orbital: 0,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 0.25,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1,
          adv_eco_mod_alone: 0.85,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 0,
          factory_build_delay_max: 0,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 5,
          fabber_to_factory_ratio_advanced: 5,
          fabber_alone_on_planet_mod: 2,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 4,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 2,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Livius is one of the oldest activated commanders in the Legionis Machina, and possibly the galaxy for that matter. Despite the disrepair his form exists in, he wields a significant amount of power in the court of Commander Invictus. This has lead to rumors that Livius found and reactivated Invictus, rather than the common belief that Invictus was the first commander to awaken.",
        commander: '/pa/units/commanders/imperial_invictus/imperial_invictus.json'
      },
      {
        // Original
        name: 'Legate Kapowaz',
        econ_rate: 1,
        personality: {
          percent_land: 0.55,
          percent_air: 0.35,
          percent_naval: 0.05,
          percent_orbital: 0.05,
          metal_drain_check: 0.75,
          energy_drain_check: 0.85,
          metal_demand_check: 0.75,
          energy_demand_check: 0.85,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
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
          fabber_alone_on_planet_mod: 2,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 2,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:Retreat is an offense punishable by deactivation within the Legionis Machina. While this law is understood, the truth of the matter is that a commander is too valuable a strategic resource to squander in such a way. So it was that Mallius was pardoned for his crime of retreat.",
        commander: '/pa/units/commanders/imperial_kapowaz/imperial_kapowaz.json'
      },
      {
        // Absurd
        name: 'Legate JT100010117',
        econ_rate: 1,
        personality: {
          percent_land: 0.7,
          percent_air: 0.2,
          percent_naval: 0.05,
          percent_orbital: 0.05,
          metal_drain_check: 0.54,
          energy_drain_check: 0.65,
          metal_demand_check: 0.71,
          energy_demand_check: 0.8,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
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
          fabber_alone_on_planet_mod: 2,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 2,
          max_basic_fabbers: 100,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 100
        },
        description: "!LOC:The Legionis Machina tends to follow strict directives in how forces are organized are deployed. This makes innovation among the Legates uncommon. Maximus is an anomaly in his numerous failed prototypes for wheeled transport platform that would supposedly enable him to move across battlefields with swiftness and grace.",
        commander: '/pa/units/commanders/imperial_jt100010117/imperial_jt100010117.json'
      },
      {
        // Relentless
        name: 'Legate Kevin4001',
        econ_rate: 1,
        personality: {
          percent_land: 0.7,
          percent_air: 0.2,
          percent_naval: 0.05,
          percent_orbital: 0.05,
          metal_drain_check: 0.44,
          energy_drain_check: 0.55,
          metal_demand_check: 0.61,
          energy_demand_check: 0.7,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1.2,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1.2,
          adv_eco_mod_alone: 0.95,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 0,
          factory_build_delay_max: 0,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 1.0,
          fabber_to_factory_ratio_advanced: 1.0,
          fabber_alone_on_planet_mod: 2.0,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 2,
          max_basic_fabbers: 10,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 30
        },
        description: "!LOC:Commanders outside of The Synchronous tend to diverge further and further from their core programming with age. This can manifest in many ways. In the case of Nero, it has manifested as a concerningly fervent interest in fire and its many forms and applications.",
        commander: '/pa/units/commanders/imperial_kevin4001/imperial_kevin4001.json'
      },
      {
        // Hard
        name: 'Legate Mostlikely',
        econ_rate: 1,
        personality: {
          percent_land: 0.7,
          percent_air: 0.2,
          percent_naval: 0.05,
          percent_orbital: 0.05,
          metal_drain_check: 0.34,
          energy_drain_check: 0.45,
          metal_demand_check: 0.51,
          energy_demand_check: 0.6,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 1.5,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 1.1,
          adv_eco_mod_alone: 1.0,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 1,
          factory_build_delay_max: 3,
          unable_to_expand_delay: 0,
          enable_commander_danger_responses: false,
          per_expansion_delay: 0,
          fabber_to_factory_ratio_basic: 1.0,
          fabber_to_factory_ratio_advanced: 1.0,
          fabber_alone_on_planet_mod: 2.0,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 0.5,
          min_basic_fabbers: 2,
          max_basic_fabbers: 6,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 20
        },
        description: "!LOC:Octavius has made a habit of broadcasting a sequence of tones to his whole army in battle, along with usual command and directive data. He claims that this constant audio input has increased combat effectiveness by 15.83222%",
        commander: '/pa/units/commanders/imperial_mostlikely/imperial_mostlikely.json'
      },
      {
        // Normal
        name: 'Legate Nagasher',
        econ_rate: 1,
        personality: {
          percent_land: 0.7,
          percent_air: 0.2,
          percent_naval: 0.05,
          percent_orbital: 0.05,
          metal_drain_check: 0.14,
          energy_drain_check: 0.25,
          metal_demand_check: 0.21,
          energy_demand_check: 0.3,
          micro_type: 0,
          go_for_the_kill: false,
          neural_data_mod: 2.0,
          personality_tags:
            [
              "GWAlly",
              "SlowerExpansion"
            ],
          adv_eco_mod: 3.0,
          adv_eco_mod_alone: 3.0,
          priority_scout_metal_spots: false,
          factory_build_delay_min: 15,
          factory_build_delay_max: 30,
          unable_to_expand_delay: 60,
          enable_commander_danger_responses: false,
          per_expansion_delay: 120,
          fabber_to_factory_ratio_basic: 5.0,
          fabber_to_factory_ratio_advanced: 1.0,
          fabber_alone_on_planet_mod: 1.0,
          basic_to_advanced_factory_ratio: 0,
          factory_alone_on_planet_mod: 1.0,
          min_basic_fabbers: 5,
          max_basic_fabbers: 15,
          min_advanced_fabbers: 3,
          max_advanced_fabbers: 20
        },
        description: "!LOC:Pompey was desynchronized after a bold strike by the Legionis Machina cut off the Synchronous infrastructure that supported his sector. Since then he has worked hard to earn the trust of his fellow Legates, but declines to share the fact that his command systems still experience heavy interference when in synchronous territory.",
        commander: '/pa/units/commanders/imperial_nagasher/imperial_nagasher.json'
      }
    ], // minions
  };
});