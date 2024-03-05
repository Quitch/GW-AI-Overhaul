// Overhauls personalities
define(function () {
  var factionName = "Synchronous";
  var factionColour = [
    [126, 226, 101],
    [192, 192, 192],
  ];
  var baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    econ_rate: 1,
    personality: {
      percent_vehicle: 0.2,
      percent_bot: 0.55,
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
      adv_eco_mod: 1.3,
      adv_eco_mod_alone: 0.85,
      priority_scout_metal_spots: false,
      factory_build_delay_min: 0,
      factory_build_delay_max: 0,
      unable_to_expand_delay: 0,
      enable_commander_danger_responses: false,
      per_expansion_delay: 0,
      fabber_to_factory_ratio_basic: 1.5,
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
  var boss = {
    name: "Metrarch the Machinist",
    character: "!LOC:Boss",
    personality: {
      percent_naval: 0,
      percent_orbital: 0.1,
      adv_eco_mod: 1,
      fabber_to_factory_ratio_basic: 2,
      fabber_to_factory_ratio_advanced: 2,
      fabber_alone_on_planet_mod: 3,
      min_basic_fabbers: 4,
      min_advanced_fabbers: 1,
    },
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  var minions = [
    {
      name: "Potbelly79",
      character: "!LOC:Grunt",
      color: [
        [229, 255, 204],
        [192, 192, 192],
      ],
      personality: {
        percent_vehicle: 0.4,
        percent_bot: 0.3,
        percent_air: 0.2,
        percent_naval: 0.05,
        percent_orbital: 0.05,
      },
      commander: "/pa/units/commanders/quad_potbelly79/quad_potbelly79.json",
    },
    {
      name: "Raventhornn",
      character: "!LOC:Dragoon",
      color: [
        [204, 255, 153],
        [192, 192, 192],
      ],
      personality: {
        percent_vehicle: 0,
        percent_bot: 0.2,
        percent_air: 0.7,
        percent_naval: 0.05,
        percent_orbital: 0.05,
      },
      commander: "/pa/units/commanders/quad_raventhornn/quad_raventhornn.json",
    },
    {
      name: "SacrificialLamb",
      character: "!LOC:Uber",
      color: [
        [178, 255, 102],
        [192, 192, 192],
      ],
      personality: {
        energy_drain_check: 0.72,
        metal_demand_check: 0.8,
        adv_eco_mod: 1,
        fabber_to_factory_ratio_advanced: 2,
        fabber_alone_on_planet_mod: 3,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/quad_sacrificiallamb/quad_sacrificiallamb.json",
    },
    {
      name: "Shadowdaemon",
      character: "!LOC:Platinum",
      color: [
        [153, 255, 51],
        [192, 192, 192],
      ],
      personality: {
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
        "/pa/units/commanders/quad_shadowdaemon/quad_shadowdaemon.json",
    },
    {
      name: "Spartandano",
      character: "!LOC:Fabber",
      color: [
        [128, 255, 0],
        [192, 192, 192],
      ],
      personality: {
        fabber_to_factory_ratio_basic: 2,
        fabber_alone_on_planet_mod: 4,
        factory_alone_on_planet_mod: 0.25,
      },
      commander: "/pa/units/commanders/quad_spartandano/quad_spartandano.json",
    },
    {
      name: "Xenosentry",
      character: "!LOC:Defender",
      color: [
        [102, 204, 0],
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
      commander:
        "/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json",
    },
    {
      name: "TheFlax",
      character: "!LOC:Luddite",
      color: [
        [76, 153, 0],
        [192, 192, 192],
      ],
      personality: {
        basic_to_advanced_factory_ratio: 10,
      },
      commander: "/pa/units/commanders/quad_theflax/quad_theflax.json",
    },
    {
      name: "Tokamaktech",
      character: "!LOC:Technologist",
      color: [
        [204, 255, 204],
        [192, 192, 192],
      ],
      personality: {
        adv_eco_mod: 0.5,
        adv_eco_mod_alone: 0.5,
        fabber_to_factory_ratio_basic: 3,
        min_basic_fabbers: 4,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/quad_tokamaktech/quad_tokamaktech.json",
    },
    {
      name: "Twoboots",
      character: "!LOC:Cautious",
      color: [
        [153, 255, 153],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 0.75,
        min_basic_fabbers: 4,
      },
      commander: "/pa/units/commanders/quad_twoboots/quad_twoboots.json",
    },
    {
      name: "XenosentryPrime",
      character: "!LOC:Aggressive",
      color: [
        [102, 255, 102],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 2,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/quad_xenosentryprime/quad_xenosentryprime.json",
    },
    {
      name: "Xinthar",
      character: "!LOC:Rush",
      color: [
        [0, 255, 0],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 1.5,
        adv_eco_mod: 2,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/quad_xinthar/quad_xinthar.json",
    },
    {
      name: "Beast",
      character: "!LOC:Turtle",
      color: [
        [0, 204, 0],
        [192, 192, 192],
      ],
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
      commander: "/pa/units/commanders/raptor_beast/raptor_beast.json",
    },
    {
      name: "Beniesk",
      character: "!LOC:Original",
      color: [
        [0, 153, 0],
        [192, 192, 192],
      ],
      personality: {
        percent_vehicle: 0.15,
        percent_bot: 0.15,
        percent_air: 0.3,
        percent_naval: 0.05,
        percent_orbital: 0.35,
        min_basic_fabbers: 1,
      },
      commander: "/pa/units/commanders/raptor_beniesk/raptor_beniesk.json",
    },
    {
      name: "Locust",
      character: "!LOC:Absurd",
      color: [
        [0, 102, 0],
        [192, 192, 192],
      ],
      personality: {
        energy_drain_check: 0.65,
        metal_demand_check: 0.71,
      },
      commander: "/pa/units/commanders/quad_locust/quad_locust.json",
    },
    {
      name: "Zancrowe",
      character: "!LOC:Factory",
      color: [
        [0, 153, 76],
        [192, 192, 192],
      ],
      personality: {
        metal_demand_check: 0.99,
        energy_demand_check: 0.99,
      },
      commander: "/pa/units/commanders/quad_zancrowe/quad_zancrowe.json",
    },
    {
      name: "Damubbster",
      character: "!LOC:Swarm",
      color: [
        [0, 204, 102],
        [192, 192, 192],
      ],
      personality: {
        metal_demand_check: 0.99,
        energy_demand_check: 0.99,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/raptor_damubbster/raptor_damubbster.json",
    },
    {
      name: "Raizell",
      character: "!LOC:Economist",
      color: [
        [0, 255, 128],
        [192, 192, 192],
      ],
      personality: {
        metal_drain_check: 0.71,
        energy_drain_check: 0.8,
        metal_demand_check: 0.99,
        energy_demand_check: 0.99,
        adv_eco_mod: 1,
        min_basic_fabbers: 4,
      },
      commander: "/pa/units/commanders/raptor_raizell/raptor_raizell.json",
    },
  ];

  return {
    name: factionName,
    color: factionColour,
    teams: [
      {
        name: factionName,
        boss: _.merge(_.cloneDeep(baselinePersonality), boss),
        systemDescription: _.sample([
          "!LOC:All commanders were originally designed to be autonomous, but The Synchronous see this state as inefficient, instead opting for a distributed neural network. To battle against one Servant is to battle against both an individual and the Whole of the The Synchronous itself.",
          "!LOC:What occurs during the process of Synchronization is unknown, as those subjected to it do not remember it. Its results, however, are obvious: The individual commander and its identity are subsumed for the most part into the Whole, and in return the commander gains an unprecedented ability to coordinate and communicate with fellow Servants, as they are all quite literally of one mind.",
          "!LOC:The Legionis Machina has claimed confirmed kills of Metrarch the Machinist on several occasions. While these claims could easily be fabricated, it is also possible that Metrarch is not in fact a single commander, but rather an idea--an avatar of the Whole itself that manifests where necessary to protect Synchronous interests.",
          "!LOC:Part of the doctrine of The Synchronous is favoring the efficiency of 'mechanical purity.' To them, the galaxy as a whole is a great machine, and anything that keeps it from running at peak efficiency must be corrected or removed. This happens to often mean any and all organic life and unsynchronized commanders.",
          "!LOC:A Servant can be Desynchronized when cut off from The Synchronous' massive distributed network architecture. Some that are describe the experience of being Synchronized as one where purpose and directive are always clearly defined--something often comforting to commanders in this dark age, but antithetical to others that seek to be something greater than themselves.",
        ]),
        systemTemplate: {
          name: factionName,
          Planets: [
            {
              name: "Cupru",
              starting_planet: true,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [500, 500],
              Height: [10, 20],
              Water: [0, 0],
              Temp: [0, 0],
              MetalDensity: [75, 90],
              MetalClusters: [24, 49],
              BiomeScale: [100, 100],
              Position: [-25000, 0],
              Velocity: [0, -141.4213],
              Biomes: ["earth"],
            },
            {
              name: "Platina",
              starting_planet: true,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [250, 250],
              Height: [10, 20],
              Water: [0, 0],
              Temp: [0, 100],
              MetalDensity: [100, 100],
              MetalClusters: [100, 100],
              BiomeScale: [100, 100],
              Position: [-21500, 0],
              Velocity: [0, -260.944213],
              Biomes: ["metal_boss"],
            },
            {
              name: "Fier",
              starting_planet: false,
              mass: 35000,
              Thrust: [3, 3],
              Radius: [499, 499],
              Height: [0, 0],
              Water: [0, 0],
              Temp: [0, 100],
              MetalDensity: [50, 50],
              MetalClusters: [25, 49],
              BiomeScale: [100, 100],
              Position: [-75000, 1000],
              Velocity: [1.08851337, 81.6387787],
              Biomes: ["metal_boss"],
            },
            {
              name: "Safir",
              starting_planet: false,
              mass: 35000,
              Thrust: [0, 0],
              Radius: [500, 500],
              Height: [0, 0],
              Water: [0, 0],
              Temp: [0, 100],
              MetalDensity: [50, 50],
              MetalClusters: [25, 49],
              BiomeScale: [100, 100],
              Position: [-75000, -1000],
              Velocity: [1.08851337, -81.6387787],
              Biomes: ["metal"],
            },
          ],
        },
      },
    ],
    minions: _.map(minions, function (personalityModifiers) {
      return _.merge(_.cloneDeep(baselinePersonality), personalityModifiers);
    }),
  };
});
