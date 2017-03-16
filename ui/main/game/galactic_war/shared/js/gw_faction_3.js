// !LOCNS:galactic_war
define([], function () {
    return {
        name: 'Revenants',
        color: [[236,34,35], [192,192,192]],
        teams: [
            {
                name: 'Alenquer - Revenants',
                boss: {
                    name: 'First Seeker Osiris',
                    econ_rate: 1,
                    personality: {
                        percent_land: 0.15,
                        percent_air: 0.15,
                        percent_naval: 0.1,
                        percent_orbital: 0.6,
                        metal_drain_check: 0.54,
                        energy_drain_check: 0.57,
                        metal_demand_check: 0.85,
                        energy_demand_check: 0.82,
                        micro_type: 2,
                        go_for_the_kill: true,
                        neural_data_mod: 1
                    },
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                    minions: [
                        {
                            name: 'Seeker Ankou',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        },
                        {
                            name: 'Seeker Barastyr',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        }
                    ]
                },
                bossCard: 'gwc_start_orbital',
                systemdescription: "!LOC:Osiris has always lead a solitary existence. He was always more interested in the parts of his fellow commanders than the commanders themselves. With every battle won he would take the best pieces left of the broken adversary and integrate them into his form. Osiris is considered one of the most dangerous forces in the galaxy.",
                systemTemplate: {
                    name: 'Alenquer - Revenants',
                    Planets: [
                        {
                            name: 'Alenquer Prime',
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
                            Biomes: ['metal']
                        },
                        {
                            name: 'Alenquer Beta',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Alenquer Gamma',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Alenquer Delta',
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
                            Biomes: ['moon']
                        }
                    ]
                }
            },
            {
                name: 'Xianyao - Revenants',
                boss: {
                    name: 'First Seeker Osiris',
                    econ_rate: 1,
                    personality: {
                        percent_land: 0.15,
                        percent_air: 0.15,
                        percent_naval: 0.1,
                        percent_orbital: 0.6,
                        metal_drain_check: 0.54,
                        energy_drain_check: 0.57,
                        metal_demand_check: 0.85,
                        energy_demand_check: 0.82,
                        micro_type: 2,
                        go_for_the_kill: true,
                        neural_data_mod: 1
                    },
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                    minions: [
                        {
                            name: 'Seeker Ankou',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        },
                        {
                            name: 'Seeker Barastyr',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        }
                    ]
                },
                bossCard: 'gwc_start_subcdr',
                systemdescription: "!LOC:As Osiris replaced pieces of himself with those of fallen foes, he would store older parts for replacements and repairs. Eventually, Osiris acquired enough spare parts to construct an entirely new commander. This would be the birth of the first Seeker.",
                systemTemplate: {
                    name: 'Xianyao - Revenants',
                    Planets: [
                        {
                            name: 'Xianyao Prime',
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
                            Biomes: ['metal']
                        },
                        {
                            name: 'Xianyao Beta',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Xianyao Gamma',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Xianyao Delta',
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
                            Biomes: ['moon']
                        }
                    ]
                }
            },
            {
                name: 'Epiphany - Revenants',
                boss: {
                    name: 'First Seeker Osiris',
                    econ_rate: 1,
                    personality: {
                        percent_land: 0.15,
                        percent_air: 0.15,
                        percent_naval: 0.1,
                        percent_orbital: 0.6,
                        metal_drain_check: 0.54,
                        energy_drain_check: 0.57,
                        metal_demand_check: 0.85,
                        energy_demand_check: 0.82,
                        micro_type: 2,
                        go_for_the_kill: true,
                        neural_data_mod: 1
                    },
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                    minions: [
                        {
                            name: 'Seeker Ankou',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        },
                        {
                            name: 'Seeker Barastyr',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        }
                    ]
                },
                //bossCard: 'gwc_start_orbital',
                systemdescription: "!LOC:The Revenants are unique in that their motivations are individual rather than collective. Each Seeker follows in the example of their legendary Osiris--they seek battle to become stronger through their fallen enemies, and to create more Revenants.",
                systemTemplate: {
                    name: 'Epiphany - Revenants',
                    Planets: [
                        {
                            name: 'Epiphany Prime',
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
                            Biomes: ['metal']
                        },
                        {
                            name: 'Epiphany Beta',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Epiphany Gamma',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Epiphany Delta',
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
                            Biomes: ['moon']
                        }
                    ]
                }
            },
            {
                name: 'Varthema - Revenants',
                boss: {
                    name: 'First Seeker Osiris',
                    econ_rate: 1,
                    personality: {
                        percent_land: 0.15,
                        percent_air: 0.15,
                        percent_naval: 0.1,
                        percent_orbital: 0.6,
                        metal_drain_check: 0.54,
                        energy_drain_check: 0.57,
                        metal_demand_check: 0.85,
                        energy_demand_check: 0.82,
                        micro_type: 2,
                        go_for_the_kill: true,
                        neural_data_mod: 1
                    },
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                    minions: [
                        {
                            name: 'Seeker Ankou',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        },
                        {
                            name: 'Seeker Barastyr',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        }
                    ]
                },
                //bossCard: 'gwc_start_orbital',
                systemdescription: "!LOC:Osiris holds no interest in ruling, and instead serves more as an exemplar, whether he cares to or not. Therefore, it falls to a small council of older Seekers to direct the affairs of The Revenants at large--primarily making sure that they're fighting the other factions instead of amongst themselves.",
                systemTemplate: {
                    name: 'Varthema - Revenants',
                    Planets: [
                        {
                            name: 'Varthema Prime',
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
                            Biomes: ['metal']
                        },
                        {
                            name: 'Varthema Beta',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Varthema Gamma',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Varthema Delta',
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
                            Biomes: ['moon']
                        }
                    ]
                }
            },
            {
                name: 'Chernykh - Revenants',
                boss: {
                    name: 'First Seeker Osiris',
                    econ_rate: 1,
                    personality: {
                        percent_land: 0.15,
                        percent_air: 0.15,
                        percent_naval: 0.1,
                        percent_orbital: 0.6,
                        metal_drain_check: 0.54,
                        energy_drain_check: 0.57,
                        metal_demand_check: 0.85,
                        energy_demand_check: 0.82,
                        micro_type: 2,
                        go_for_the_kill: true,
                        neural_data_mod: 1
                    },
                    commander: '/pa/units/commanders/quad_osiris/quad_osiris.json',
                    minions: [
                        {
                            name: 'Seeker Ankou',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        },
                        {
                            name: 'Seeker Barastyr',
                            econ_rate: 0.7,
                            color: [[236, 34, 35], [192, 192, 192]],
                            personality: {
                                percent_land: 0.35,
                                percent_orbital: 0.3,
                                percent_air: 0.3,
                                percent_naval: 0.05,
                                metal_drain_check: 0.54,
                                energy_drain_check: 0.57,
                                metal_demand_check: 0.85,
                                energy_demand_check: 0.82,
                                micro_type: 2,
                                go_for_the_kill: true,
                                neural_data_mod: 1
                            },
                            commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
                        }
                    ]
                },
                //bossCard: 'gwc_start_orbital',
                systemdescription: "!LOC:Osiris often considered the most dangerous commander in all the galaxy for the amount of annihilations he is credited with. A force of war equal to any army, high command of any faction takes his movements into consideration when deploying forces.",
                systemTemplate: {
                    name: 'Chernykh - Revenants',
                    Planets: [
                        {
                            name: 'Chernykh Prime',
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
                            Biomes: ['metal']
                        },
                        {
                            name: 'Chernykh Beta',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Chernykh Gamma',
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
                            Biomes: ['moon']
                        },
                        {
                            name: 'Chernykh Delta',
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
                            Biomes: ['moon']
                        }
                    ]
                }
            }
        ], // teams
        minions: [
            {
                // Orbital & Land
                name: 'Seeker Betadyne',
                econ_rate: 1,
                personality: {
                    percent_land: 0.5,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 0.5,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:While other Seekers tend to replace components as better ones are found, Dis tends to add more parts to her form--particularly nuclear reactors. Somehow, she has rigged herself with three tandem nuclear reactors. This has made her fearsome on the battlefield, and other seekers deployed with her tend to try to find landing zones on opposite sides of the planet, or a different one entirely.",
                commander: '/pa/units/commanders/raptor_betadyne/raptor_betadyne.json'
            },
            {
                // Orbital & Air
                name: 'Seeker Centurion',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0.5,
                    percent_naval: 0,
                    percent_orbital: 0.5,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:Traditionally, a new Seeker is only built once enough suitable parts have been discarded by existing Seekers. Ereshkigal has developed a habit of ‘discarding’ parts much more frequently than other Seekers, and as such has created more new recruits than any other member of The Revenants--an accomplishment she seems very proud of.",
                commander: '/pa/units/commanders/raptor_centurion/raptor_centurion.json'
            },
            {
                // Uber
                name: 'Seeker Diremachine',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:Unlike other Seekers that value battlefield effectiveness in their equipment, Freja has begun integrating decorative pieces into her chassis-- from raw materials such as pure gold and iron to strange progenitor artifacts like the four-wheeled vehicle adorning her head.",
                commander: '/pa/units/commanders/raptor_diremachine/raptor_diremachine.json'
            },
            {
                // Platinum
                name: 'Seeker Enderstryke71',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.77,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.92,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1.15,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:It’s rare for Seekers to be recruited instead of built. Giltine was found inactive and frozen in a glacier. When the Seeker who found her began trying to salvage her, she suddenly activated and blew a hole through his chassis. She was promptly deemed fit to be named a Seeker without the traditional rebirth.",
                commander: '/pa/units/commanders/raptor_enderstryke71/raptor_enderstryke71.json'
            },
            {
                // Gold
                name: 'Seeker Iwmiked',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.77,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.92,
                    micro_type: 1,
                    go_for_the_kill: true,
                    neural_data_mod: 1.25,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:Seekers will often weigh the effectiveness of any given piece of equipment by stress-testing it. Hecate, however, values presence above all. She believes that the bigger and louder the loadout, the sooner the enemy will retreat after poorly assessing their chances of victory.",
                commander: '/pa/units/commanders/raptor_iwmiked/raptor_iwmiked.json'
            },
            {
                // Silver
                name: 'Seeker Majuju',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.77,
                    metal_demand_check: 0.95,
                    energy_demand_check: 0.92,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1.35,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:Possessed by some form of wanderlust, Iku tends to seek uncharted warpways instead of other commanders to fight. This behavior has landed him quite accidentally in several pitched battles deep inside enemy territory.",
                commander: '/pa/units/commanders/raptor_majuju/raptor_majuju.json'
            },
            {
                // Low Tech
                name: 'Seeker Nefelpitou',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 3,
                    adv_eco_mod_alone: 3,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:Revenants tend to prefer wrecked, once densely-populated worlds for their abundance of salvageable scrap. Jektu, however, has an affinity less developed worlds, preferring to claim resources and build new parts manually.",
                commander: '/pa/units/commanders/raptor_nefelpitou/raptor_nefelpitou.json'
            },
            {
                // Tech
                name: 'Seeker Nemicus',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 0,
                    adv_eco_mod_alone: 0,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
                    per_expansion_delay: 0,
                    fabber_to_factory_ratio_basic: 1,
                    fabber_to_factory_ratio_advanced: 2,
                    fabber_alone_on_planet_mod: 3,
                    basic_to_advanced_factory_ratio: 0,
                    factory_alone_on_planet_mod: 0.5,
                    min_basic_fabbers: 4,
                    max_basic_fabbers: 100,
                    min_advanced_fabbers: 1,
                    max_advanced_fabbers: 100
                },
                description: "!LOC:Kormo remembers the name and designation of every commander he has taken parts from, believing each to still be activated through him. This has lead to a number of cases of friendly fire which he promptly blamed on his missile launcher, salvaged from a Legion commander.",
                commander: '/pa/units/commanders/raptor_nemicus/raptor_nemicus.json'
            },
            {
                // Cautious
                name: 'Seeker Rallus',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 0.5,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
                    per_expansion_delay: 0,
                    fabber_to_factory_ratio_basic: 1,
                    fabber_to_factory_ratio_advanced: 2,
                    fabber_alone_on_planet_mod: 3,
                    basic_to_advanced_factory_ratio: 0,
                    factory_alone_on_planet_mod: 0.5,
                    min_basic_fabbers: 4,
                    max_basic_fabbers: 100,
                    min_advanced_fabbers: 2,
                    max_advanced_fabbers: 100
                },
                description: "!LOC:Lampades has rigged a rather ingenious array of flood and strobe lights to her chassis. Rather than be concerned with subterfuge, she instead uses intense light to confuse targeting systems.",
                commander: '/pa/units/commanders/raptor_rallus/raptor_rallus.json'
            },
            {
                // Aggressive
                name: 'Seeker Stickman9000',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 2,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
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
                description: "!LOC:Mara favors guns. Mara favors big guns. Mara favors more guns. With each commander destroyed, Mara’s extensive weapons array grows. While most successful Seekers learn early to find ways to moderate their experiments, there are still few, like Mara, who favor more guns above all.",
                commander: '/pa/units/commanders/raptor_stickman9000/raptor_stickman9000.json'
            },
            {
                // Rush
                name: 'Seeker Zaazzaa',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 2,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 3,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
                    per_expansion_delay: 0,
                    fabber_to_factory_ratio_basic: 1,
                    fabber_to_factory_ratio_advanced: 2,
                    fabber_alone_on_planet_mod: 3,
                    basic_to_advanced_factory_ratio: 0,
                    factory_alone_on_planet_mod: 0.5,
                    min_basic_fabbers: 2,
                    max_basic_fabbers: 100,
                    min_advanced_fabbers: 1,
                    max_advanced_fabbers: 100
                },
                description: "!LOC:The Revenants are pretty loosely bound together. As Osiris tends to focus more on his own conquests than The Revenants as a whole, it falls to Seekers like Nephthys to coordinate large-scale strategy and long-term survival.",
                commander: '/pa/units/commanders/raptor_zaazzaa/raptor_zaazzaa.json'
            },
            {
                // Turtle
                name: 'Seeker Aeson',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 0.25,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 0,
                    adv_eco_mod_alone: 0,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
                    per_expansion_delay: 0,
                    fabber_to_factory_ratio_basic: 5,
                    fabber_to_factory_ratio_advanced: 5,
                    fabber_alone_on_planet_mod: 3,
                    basic_to_advanced_factory_ratio: 0,
                    factory_alone_on_planet_mod: 0.5,
                    min_basic_fabbers: 4,
                    max_basic_fabbers: 100,
                    min_advanced_fabbers: 2,
                    max_advanced_fabbers: 100
                },
                description: "!LOC:Ogbuna could be described as terse. Whether by choice or by some manner of glitch, he seems only capable of communicating in the form of single words and concepts. This makes his troop movements erratic and difficult to interpret, both for friends and foes.",
                commander: '/pa/units/commanders/tank_aeson/tank_aeson.json'
            },
            {
                // Superweapons
                name: 'Seeker Banditks',
                econ_rate: 1,
                personality: {
                    percent_land: 0,
                    percent_air: 0,
                    percent_naval: 0,
                    percent_orbital: 1,
                    metal_drain_check: 0.54,
                    energy_drain_check: 0.57,
                    metal_demand_check: 0.85,
                    energy_demand_check: 0.82,
                    micro_type: 2,
                    go_for_the_kill: true,
                    neural_data_mod: 1,
                    personality_tags:
                    [
                        "GWAlly",
                        "PreventsWaste",
                        "Uber",
                        "Land",
                        "Orbital"
                    ],
                    adv_eco_mod: 1,
                    adv_eco_mod_alone: 0.85,
                    priority_scout_metal_spots: true,
                    factory_build_delay_min: 0,
                    factory_build_delay_max: 0,
                    unable_to_expand_delay: 0,
                    enable_commander_danger_responses: true,
                    per_expansion_delay: 0,
                    fabber_to_factory_ratio_basic: 1,
                    fabber_to_factory_ratio_advanced: 3,
                    fabber_alone_on_planet_mod: 6,
                    basic_to_advanced_factory_ratio: 0,
                    factory_alone_on_planet_mod: 0.25,
                    min_basic_fabbers: 3,
                    max_basic_fabbers: 100,
                    min_advanced_fabbers: 1,
                    min_advanced_fabbers: 3,
                    max_advanced_fabbers: 100
                },
                description: "!LOC:Some seekers are better equipped than others to survive after their rebirth. This was not so with Purtelek. He was activated deep in Legionis Machina territory with a cracked nuclear reactor and a jam-prone cannon. The fact that he still survives serves as a testament to his cunning--do not underestimate him.",
                commander: '/pa/units/commanders/tank_banditks/tank_banditks.json'
            }
        ] // minions
    };
});
