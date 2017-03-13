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
                    econ_rate: 1.0,
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
                systemdescription: "!LOC:MOD ENABLED Osiris has always lead a solitary existence. He was always more interested in the parts of his fellow commanders than the commanders themselves. With every battle won he would take the best pieces left of the broken adversary and integrate them into his form. Osiris is considered one of the most dangerous forces in the galaxy.",
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
                    econ_rate: 1.0,
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
                systemdescription: "!LOC:MOD ENABLED As Osiris replaced pieces of himself with those of fallen foes, he would store older parts for replacements and repairs. Eventually, Osiris acquired enough spare parts to construct an entirely new commander. This would be the birth of the first Seeker.",
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
                    econ_rate: 1.0,
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
                systemdescription: "!LOC:MOD ENABLED The Revenants are unique in that their motivations are individual rather than collective. Each Seeker follows in the example of their legendary Osiris--they seek battle to become stronger through their fallen enemies, and to create more Revenants.",
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
                    econ_rate: 1.0,
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
                systemdescription: "!LOC:MOD ENABLED Osiris holds no interest in ruling, and instead serves more as an exemplar, whether he cares to or not. Therefore, it falls to a small council of older Seekers to direct the affairs of The Revenants at large--primarily making sure that they're fighting the other factions instead of amongst themselves.",
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
                    econ_rate: 1.0,
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
                systemdescription: "!LOC:MOD ENABLED Osiris often considered the most dangerous commander in all the galaxy for the amount of annihilations he is credited with. A force of war equal to any army, high command of any faction takes his movements into consideration when deploying forces.",
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
                name: 'Seeker Dis',
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
                description: "!LOC:MOD ENABLED While other Seekers tend to replace components as better ones are found, Dis tends to add more parts to her form--particularly nuclear reactors. Somehow, she has rigged herself with three tandem nuclear reactors. This has made her fearsome on the battlefield, and other seekers deployed with her tend to try to find landing zones on opposite sides of the planet, or a different one entirely.",
                commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
            },
            {
                name: 'Seeker Ereshkigal',
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
                description: "!LOC:MOD ENABLED Traditionally, a new Seeker is only built once enough suitable parts have been discarded by existing Seekers. Ereshkigal has developed a habit of ‘discarding’ parts much more frequently than other Seekers, and as such has created more new recruits than any other member of The Revenants--an accomplishment she seems very proud of.",
                commander: '/pa/units/commanders/quad_armalisk/quad_armalisk.json'
            },
            {
                name: 'Seeker Freja',
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
                description: "!LOC:MOD ENABLED Unlike other Seekers that value battlefield effectiveness in their equipment, Freja has begun integrating decorative pieces into her chassis-- from raw materials such as pure gold and iron to strange progenitor artifacts like the four-wheeled vehicle adorning her head.",
                commander: '/pa/units/commanders/quad_mobiousblack/quad_mobiousblack.json'
            },
            {
                name: 'Seeker Giltine',
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
                description: "!LOC:MOD ENABLED It’s rare for Seekers to be recruited instead of built. Giltine was found inactive and frozen in a glacier. When the Seeker who found her began trying to salvage her, she suddenly activated and blew a hole through his chassis. She was promptly deemed fit to be named a Seeker without the traditional rebirth.",
                commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
            },
            {
                name: 'Seeker Hecate',
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
                description: "!LOC:MOD ENABLED Seekers will often weigh the effectiveness of any given piece of equipment by stress-testing it. Hecate, however, values presence above all. She believes that the bigger and louder the loadout, the sooner the enemy will retreat after poorly assessing their chances of victory.",
                commander: '/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json'
            },
            {
                name: 'Seeker Iku',
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
                description: "!LOC:MOD ENABLED Possessed by some form of wanderlust, Iku tends to seek uncharted warpways instead of other commanders to fight. This behavior has landed him quite accidentally in several pitched battles deep inside enemy territory.",
                commander: '/pa/units/commanders/imperial_stelarch/imperial_stelarch.json'
            },
            {
                name: 'Seeker Jektu',
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
                description: "!LOC:MOD ENABLED Revenants tend to prefer wrecked, once densely-populated worlds for their abundance of salvageable scrap. Jektu, however, has an affinity less developed worlds, preferring to claim resources and build new parts manually.",
                commander: '/pa/units/commanders/raptor_betadyne/raptor_betadyne.json'
            },
            {
                name: 'Seeker Kormo',
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
                description: "!LOC:MOD ENABLED Kormo remembers the name and designation of every commander he has taken parts from, believing each to still be activated through him. This has lead to a number of cases of friendly fire which he promptly blamed on his missile launcher, salvaged from a Legion commander.",
                commander: '/pa/units/commanders/quad_spartandano/quad_spartandano.json'
            },
            {
                name: 'Seeker Lampades',
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
                description: "!LOC:MOD ENABLED Lampades has rigged a rather ingenious array of flood and strobe lights to her chassis. Rather than be concerned with subterfuge, she instead uses intense light to confuse targeting systems.",
                commander: '/pa/units/commanders/quad_potbelly79/quad_potbelly79.json'
            },
            {
                name: 'Seeker Mara',
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
                description: "!LOC:MOD ENABLED Mara favors guns. Mara favors big guns. Mara favors more guns. With each commander destroyed, Mara’s extensive weapons array grows. While most successful Seekers learn early to find ways to moderate their experiments, there are still few, like Mara, who favor more guns above all.",
                commander: '/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json'
            },
            {
                name: 'Seeker Nephthys',
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
                description: "!LOC:MOD ENABLED The Revenants are pretty loosely bound together. As Osiris tends to focus more on his own conquests than The Revenants as a whole, it falls to Seekers like Nephthys to coordinate large-scale strategy and long-term survival.",
                commander: '/pa/units/commanders/quad_armalisk/quad_armalisk.json'
            },
            {
                name: 'Seeker Ogbuna',
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
                description: "!LOC:MOD ENABLED Ogbuna could be described as terse. Whether by choice or by some manner of glitch, he seems only capable of communicating in the form of single words and concepts. This makes his troop movements erratic and difficult to interpret, both for friends and foes.",
                commander: '/pa/units/commanders/quad_xenosentryprime/quad_xenosentryprime.json'
            },
            {
                name: 'Seeker Purtelek',
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
                description: "!LOC:MOD ENABLED Some seekers are better equipped than others to survive after their rebirth. This was not so with Purtelek. He was activated deep in Legionis Machina territory with a cracked nuclear reactor and a jam-prone cannon. The fact that he still survives serves as a testament to his cunning--do not underestimate him.",
                commander: '/pa/units/commanders/raptor_diremachine/raptor_diremachine.json'
            },
            {
                name: 'Seeker Qamm',
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
                description: "!LOC:MOD ENABLED A former member of the Foundation, Qamm is no longer content to merely catalog his archaeological discoveries. He prefers to “become history” by integrating Progenitor technology into his own body. He thinks of himself as a living museum, and will talk at length about the historical significance of each of his components to any listener unlucky enough to be stuck with him in an enclosed space.",
                commander: '/pa/units/commanders/quad_tokamaktech/quad_tokamaktech.json'
            },
            {
                name: 'Seeker Rul-Mot',
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
                description: "!LOC:MOD ENABLED A berzerker who has returned from battles with less than ten percent of his original body remaining, Rul-Mot has no discernible instinct for self-preservation. He is unpopular among field units, but his impressive combat record cannot be denied.",
                commander: '/pa/units/commanders/imperial_sangudo/imperial_sangudo.json'
            },
            {
                name: 'Seeker Shingon',
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
                description: "!LOC:MOD ENABLED Shingon is especially picky about what kinds of parts he harvests from fallen adversaries, prizing 'authenticity' above all other attributes. He is especially obsessed with original parts that predate the modern era. 'The new stuff is just too blocky,' he explains.",
                commander: '/pa/units/commanders/quad_tokamaktech/quad_tokamaktech.json'
            },
            {
                name: 'Seeker Thanatos',
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
                description: "!LOC:MOD ENABLED Thanatos salvaged and assimilated a Synchronous network module in an attempt to predict the movement of Synchronous units on the battlefield. After a brief exposure to the thoughts of the collective, she tore the module from her cortex and swore everlasting vengeance on the Synchronous. She refuses to share any details about what she learned.",
                commander: '/pa/units/commanders/quad_shadowdaemon/quad_shadowdaemon.json'
            },
            {
                name: 'Seeker Unigami',
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
                description: "!LOC:MOD ENABLED Unigami salvaged and incorporated Progenitor-era memory chips into her cortex, causing her to occasionally use gibberish words like “poodle” and “celery.” On the battlefield, she is sometimes courted by Foundation commanders who believe she contains important knowledge about the Progenitors. She quickly destroys these commanders.",
                commander: '/pa/units/commanders/imperial_gnugfur/imperial_gnugfur.json'
            },
            {
                name: 'Seeker Vespor',
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
                description: "!LOC:MOD ENABLED Constructed by Ereshkigal from parts she harvested from herself, Vespor has developed a quasi-religious reverence for her 'mother.' Due to the importance she places on the 'sacred' parts used to construct her, she refuses to replace any part of herself. She is very careful to avoid damage on the battlefield.",
                commander: '/pa/units/commanders/quad_twoboots/quad_twoboots.json'
            },
            {
                name: 'Seeker Wultok',
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
                description: "!LOC:MOD ENABLED Governed entirely by aesthetic concerns, Wultok has amassed an unwieldy but beautiful array of salvaged armor that somehow still leaves many of his most vulnerable areas open to attack. When questioned about the wisdom of this practice, Wultok declares that one must suffer for fashion. He tisks audibly when faced with an ugly adversary.",
                commander: '/pa/units/commanders/quad_mobiousblack/quad_mobiousblack.json'
            },
            {
                name: 'Seeker Xul-Kutu',
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
                description: "!LOC:MOD ENABLED While most Revenant commanders build a successor from salvaged battlefield wreckage, Xul-Kutu has chosen to construct a quadrupedal pet, instead. She loves the creature too much to take it with her to battle, so she usually leaves it at a fellow commander’s hangar, where it makes a terrible mess.",
                commander: '/pa/units/commanders/quad_armalisk/quad_armalisk.json'
            },
            {
                name: 'Seeker Yama',
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
                description: "!LOC:MOD ENABLED Yama’s gallant battlefield exploits are legendary among Revenant commanders. Unfortunately, this commander’s name is Gor-Gata, and his only accomplishment is to have been standing next to Yama when a reactor overload blew the storied commander apart. Gor-Gata donned Yama’s mostly-intact remains and has posed as Yama ever since. He enjoys the adulation, but resents having to live up to his namesake’s brave reputation.",
                commander: '/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json'
            },
            {
                name: 'Seeker Zontuk',
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
                description: "!LOC:MOD ENABLED Zontuk was assembled from the collected parts of three Legionis Machina commanders whose natural pomposity has in Zontuk been multiplied tenfold. He is convinced of his superiority to all other beings, a belief made all the more unbearable by his unmatched record of battlefield success. If pressed, most Revenant commanders will admit that they want to see Zontuk go down, hard.",
                commander: '/pa/units/commanders/imperial_delta/imperial_delta.json'
            }
        ] // minions
    };
});
