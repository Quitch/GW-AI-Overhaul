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
                systemdescription: "!LOC:MOD ENABLED The goal of the Legionis Machina is simple--conquest. Invictus is the designated ruler of the galaxy, and any commanders disobeying this directive are faulty.",
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
                systemdescription: "!LOC:MOD ENABLED When Invictus reactivated, his memory was more whole than most commanders. This is where his assertion of his right to rule came from. That may or may not be true, but what is true is that Invictus knows more about the origin of the commanders than he cares to tell his compatriots.",
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
                systemdescription: "!LOC:MOD ENABLED Unlike the other factions, the Legionis Machina operates as a hierarchy. Senior Legates have several Vassal Legates assigned to them, and all Legates are subjects of Invictus himself.",
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
                systemdescription: "!LOC:MOD ENABLED If war is a commander's natural state, then the purest expression of this is the Legionis Machina. It begs the question, though--what happens after they conquer this galaxy, if they do?",
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
                systemdescription: "!LOC:MOD ENABLED The Legionis Machina can be considered a cult of personality, in that their purpose is void without Invictus. This is likely where their bitter hatred of The Synchronous comes from, as they view Metrarch as a false idol of sorts.",
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
                name: 'Legate Ancilius',
                econ_rate: 1.0,
                personality: {
                    percent_land: 1,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Awarded several commendations for vigilance, Ancilius has decommissioned many commanders, factories, and metal planets suspected to be infected by the 'Synchronous Virus.'",
                commander: '/pa/units/commanders/imperial_delta/imperial_delta.json'
            },
            {
                name: 'Legate Attius',
                econ_rate: 1.0,
                personality: {
                    percent_land: 0.9,
                    percent_air: 0.05,
                    percent_naval: 0,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Attius is renowned within the Legion for having the most efficient factories and sturdiest nanolathes. Believing the key to victory is good construction, he spends many cycles obsessing over simulations and prototypes of new fabrication and production line algorithms.",
                commander: '/pa/units/commanders/quad_xinthar/quad_xinthar.json'
            },
            {
                name: 'Legate Brutus',
                econ_rate: 1.0,
                personality: {
                    percent_land: 0.8,
                    percent_air: 0.1,
                    percent_naval: 0.05,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Brutus was actually once a member of The Foundation. When exposed to old progenitor records of great conquerors, he became convinced that Enlightenment lied in the great conquest that Commander Invictus pursued. When swearing allegiance Brutus brought with him valuable Foundation intelligence and the old records that have helped shape the cultural identity of the Legion we know today.",
                commander: '/pa/units/commanders/raptor_rallus/raptor_rallus.json'
            },
            {
                name: 'Legate Bassus',
                econ_rate: 1.0,
                personality: {
                    percent_land: 0.7,
                    percent_air: 0.2,
                    percent_naval: 0.05,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Many commanders in the Legion considered Bassus inefficient at best and defective at worst for his insistence on outfitting himself with armor five times thicker than other commanders at the cost of mobility. Their opinion changed when Bassus was recovered while drifting through space--the sole survivor of a pivotal battle that ended in a moon colliding with his base.",
                commander: '/pa/units/commanders/quad_ajax/quad_ajax.json'
            },
            {
                name: 'Legate Cassius',
                econ_rate: 1.0,
                personality: {
                    percent_land: 0.6,
                    percent_air: 0.4,
                    percent_naval: 0.05,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Cassius is a firm practitioner of the ‘lead from the front’ mentality. This often results in he himself leading many daring charges, and intense melee conflicts with woefully unprepared enemy commanders.",
                commander: '/pa/units/commanders/imperial_sangudo/imperial_sangudo.json'
            },
            {
                name: 'Legate Domitius',
                econ_rate: 1.0,
                personality: {
                    percent_land: 0.55,
                    percent_air: 0.35,
                    percent_naval: 0.05,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Domitius insists on being referred to as King Domitius, regardless of his actual rank. This has resulted in many reportings and personal reprimands from Invictus himself. Regardless, the reign of King Domitius continues.",
                commander: '/pa/units/commanders/imperial_aryst0krat/imperial_aryst0krat.json'
            },
            {
                name: 'Legate Flavius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 1,
                    percent_bot: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED A close advisor to Invictus, Flavius often provides counsel on matters regarding autonomy among the Legate. While some older members of the Legion distrust such progressivism, rates of recruitment from other factions has increased noticeably.",
                commander: '/pa/units/commanders/imperial_delta/imperial_delta.json'
            },
            {
                name: 'Legate Galba',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.9,
                    percent_bot: 0.1,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Galba is one of the Legates in charge of maintaining colonies on suitable remote systems. These systems are valuable for a number of purposes from macro-scale resource extraction and processing to research and development.",
                commander: '/pa/units/commanders/quad_tokamaktech/quad_tokamaktech.json'
            },
            {
                name: 'Legate Hosidius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.8,
                    percent_bot: 0.2,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Hosidius is one of the most accomplished admirals the Legion has to offer. That being said, he near-refuses to operate any war effort on land. This has made deploying him effectively rather difficult.",
                commander: '/pa/units/commanders/imperial_stelarch/imperial_stelarch.json'
            },
            {
                name: 'Legate Junius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.7,
                    percent_bot: 0.3,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED A recently awakened commander, Junius has taken to war with a zeal that is normally reserved for older commanders that have had more time to develop personal identities. As such, he has been deployed primarily against The Synchronous, with the assumption that his fierce independence will make him naturally resistant to the 'Synchronous Virus.'",
                commander: '/pa/units/commanders/imperial_sangudo/imperial_sangudo.json'
            },
            {
                name: 'Legate Livius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.6,
                    percent_bot: 0.4,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Livius is one of the oldest activated commanders in the Legionis Machina, and possibly the galaxy for that matter. Despite the disrepair his form exists in, he wields a significant amount of power in the court of Commander Invictus. This has lead to rumors that Livius found and reactivated Invictus, rather than the common belief that Invictus was the first commander to awaken.",
                commander: '/pa/units/commanders/imperial_theta/imperial_theta.json'
            },
            {
                name: 'Legate Mallius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.5,
                    percent_bot: 0.5,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Retreat is an offense punishable by deactivation within the Legionis Machina. While this law is understood, the truth of the matter is that a commander is too valuable a strategic resource to squander in such a way. So it was that Mallius was pardoned for his crime of retreat.",
                commander: '/pa/units/commanders/imperial_theta/imperial_theta.json'
            },
            {
                name: 'Legate Maximus',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.4,
                    percent_bot: 0.6,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED The Legionis Machina tends to follow strict directives in how forces are organized are deployed. This makes innovation among the Legates uncommon. Maximus is an anomaly in his numerous failed prototypes for wheeled transport platform that would supposedly enable him to move across battlefields with swiftness and grace.",
                commander: '/pa/units/commanders/raptor_betadyne/raptor_betadyne.json'
            },
            {
                name: 'Legate Nero',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.3,
                    percent_bot: 0.7,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Commanders outside of The Synchronous tend to diverge further and further from their core programming with age. This can manifest in many ways. In the case of Nero, it has manifested as a concerningly fervent interest in fire and its many forms and applications.",
                commander: '/pa/units/commanders/raptor_diremachine/raptor_diremachine.json'
            },
            {
                name: 'Legate Octavius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.2,
                    percent_bot: 0.8,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Octavius has made a habit of broadcasting a sequence of tones to his whole army in battle, along with usual command and directive data. He claims that this constant audio input has increased combat effectiveness by 15.83222%",
                commander: '/pa/units/commanders/imperial_theta/imperial_theta.json'
            },
            {
                name: 'Legate Pompey',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.1,
                    percent_bot: 0.9,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Pompey was desynchronized after a bold strike by the Legionis Machina cut off the Synchronous infrastructure that supported his sector. Since then he has worked hard to earn the trust of his fellow Legates, but declines to share the fact that his command systems still experience heavy interference when in synchronous territory.",
                commander: '/pa/units/commanders/quad_theflax/quad_theflax.json'
            },
            {
                name: 'Legate Quintus',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0,
                    percent_bot: 1,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED While commanders can collate and process a staggering amount of data at once to make decisions, only so much of that data can be deemed relevant. Quintus does so by breaking everything possible down into numbers to be put into a complicated formula. Quintus does not accept percentage-based outcomes, only a certain true or false.",
                commander: '/pa/units/commanders/quad_spartandano/quad_spartandano.json'
            },
            {
                name: 'Legate Rutilius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.9,
                    percent_bot: 0,
                    percent_air: 0.1,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Rutilius holds the honored responsibility of assessing newly-activated commanders for recruitment. All new recruits must demonstrate above all else a suitable capacity for warfare and the ability to adhere to a chain of command. Those that fail this test are promptly deactivated. Rutilius has yet to turn down a new recruit.",
                commander: '/pa/units/commanders/imperial_theta/imperial_theta.json'
            },
            {
                name: 'Legate Servilius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.8,
                    percent_bot: 0,
                    percent_air: 0.2,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Having served an extended tour deep in Revenant-held space, Servilius has come to view himself as a civilizing force. He often precedes his attacks with lengthy speeches about the importance of “order, unity of purpose, and above all cleanliness.” He has yet to take a prisoner.",
                commander: '/pa/units/commanders/imperial_aceal/imperial_aceal.json'
            },
            {
                name: 'Legate Silva',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.7,
                    percent_bot: 0,
                    percent_air: 0.3,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED When the Synchronous salient was finally turned back near the end of the Outbreak Wars, this quick-thinking messenger bore the news back to Invictus, stealing glory from the commanders who did the fighting and securing himself a role as chief envoy for the Imperator. Though he participates in front-line combat, he gladly offloads the dirtiest work to his more expendable compatriots.",
                commander: '/pa/units/commanders/imperial_enzomatrix/imperial_enzomatrix.json'
            },
            {
                name: 'Legate Terentius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0,
                    percent_bot: 0.7,
                    percent_air: 0.3,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Shipwrecked and badly damaged after his transport was ambushed in Revenant space, Terentius survived by cobbling together a working body from the remains of his co-legates. Accepted by the Revenant as one of their own, Terentius then led his unsuspecting new partners to a trap set by the Legionis. Among the Revenant, his treachery is legend.",
                commander: '/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json'
            },
            {
                name: 'Legate Titus',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0,
                    percent_bot: 0.8,
                    percent_air: 0.2,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED A former commander for the Foundation, Titus harbors a deep hatred for the members of what he calls “a cult of nostalgists and dreamers.” To compensate for his previous role among the effete Foundation elites, Titus fights with an unusual brutality, especially against Foundation armies.",
                commander: '/pa/units/commanders/quad_twoboots/quad_twoboots.json'
            },
            {
                name: 'Legate Urcinius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0,
                    percent_bot: 0.9,
                    percent_air: 0.1,
                    percent_naval: 0,
                    percent_orbital: 0,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Urcinius’ simple, uncomplicated logic framework translates to a calm stoicism before battle and an unusual decisiveness in the heat of combat. He rarely speaks, and this silence is often mistaken for depth. He prizes shiny things.",
                commander: '/pa/units/commanders/imperial_toddfather/imperial_toddfather.json'
            },
            {
                name: 'Legate Valerius',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.45,
                    percent_bot: 0.1,
                    percent_air: 0.35,
                    percent_naval: 0.05,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED Known for his natural charisma, Valerius fought alongside Invictus during the First War of Founding. He is correctly suspected of having designs on the throne, and is therefore given impossible assignments in the most distant reaches of the galaxy. Over the course of countless difficult campaigns, he has earned the unwavering devotion of his armies.",
                commander: '/pa/units/commanders/imperial_aryst0krat/imperial_aryst0krat.json'
            },
            {
                name: 'Legate Valens',
                econ_rate: 1.0,
                personality: {
                    percent_vehicle: 0.1,
                    percent_bot: 0.45,
                    percent_air: 0.35,
                    percent_naval: 0.05,
                    percent_orbital: 0.05,
                    metal_drain_check: 0.6,
                    energy_drain_check: 0.7,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tag: 'GWAlly'
                },
                description: "!LOC:MOD ENABLED A warrior/artist, Valens memorializes his foes by incorporating their remains into life-sized sculptures that depict them doing valorous deeds. Valens’ co-commanders find the practice morbid, as do his adversaries. He also dabbles in terrible poetry.",
                commander: '/pa/units/commanders/quad_mobiousblack/quad_mobiousblack.json'
            }
        ], // minions
    };
});
