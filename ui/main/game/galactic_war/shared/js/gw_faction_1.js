// Overhauls personalities
define(function () {
  var factionName = "Foundation";
  var factionColour = [
    [145, 87, 199],
    [192, 192, 192],
  ];
  var baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    econ_rate: 1,
    personality: {
      percent_vehicle: 0.2,
      percent_bot: 0.05,
      percent_air: 0.25,
      percent_naval: 0.45,
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
      fabber_to_factory_ratio_basic: 1,
      fabber_to_factory_ratio_advanced: 2,
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
    name: "Inquisitor Nemicus",
    character: "!LOC:Boss",
    personality: {
      adv_eco_mod: 1,
      fabber_to_factory_ratio_basic: 2,
      fabber_to_factory_ratio_advanced: 2,
      fabber_alone_on_planet_mod: 3,
      min_basic_fabbers: 3,
      min_advanced_fabbers: 1,
    },
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  var minions = [
    {
      name: "Progenitor",
      character: "!LOC:Air Force",
      color: [
        [229, 204, 255],
        [192, 192, 192],
      ],
      personality: {
        percent_land: 0,
        percent_air: 1,
        percent_naval: 0,
        percent_orbital: 0,
      },
      commander:
        "/pa/units/commanders/imperial_progenitor/imperial_progenitor.json",
    },
    {
      name: "Sangudo",
      character: "!LOC:Navy",
      color: [
        [204, 153, 255],
        [192, 192, 192],
      ],
      personality: {
        percent_land: 0,
        percent_air: 0,
        percent_naval: 1,
        percent_orbital: 0,
      },
      commander: "/pa/units/commanders/imperial_sangudo/imperial_sangudo.json",
    },
    {
      name: "Seniorhelix",
      character: "!LOC:Uber",
      color: [
        [178, 102, 255],
        [192, 192, 192],
      ],
      personality: {
        energy_drain_check: 0.72,
        metal_demand_check: 0.8,
        adv_eco_mod: 1,
        fabber_alone_on_planet_mod: 3,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/imperial_seniorhelix/imperial_seniorhelix.json",
    },
    {
      name: "Stelarch",
      character: "!LOC:Platinum",
      color: [
        [153, 51, 255],
        [192, 192, 192],
      ],
      personality: {
        energy_drain_check: 0.77,
        metal_demand_check: 0.85,
        energy_demand_check: 0.92,
        neural_data_mod: 1.15,
        adv_eco_mod: 1,
        fabber_alone_on_planet_mod: 3,
        min_advanced_fabbers: 2,
      },
      commander:
        "/pa/units/commanders/imperial_stelarch/imperial_stelarch.json",
    },
    {
      name: "TheChessKnight",
      character: "!LOC:Gold",
      color: [
        [127, 0, 255],
        [192, 192, 192],
      ],
      personality: {
        energy_drain_check: 0.77,
        metal_demand_check: 0.85,
        energy_demand_check: 0.92,
        neural_data_mod: 1.3,
        adv_eco_mod: 1,
        fabber_alone_on_planet_mod: 3,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 2,
      },
      commander:
        "/pa/units/commanders/imperial_thechessknight/imperial_thechessknight.json",
    },
    {
      name: "Theta",
      character: "!LOC:Defender",
      color: [
        [102, 0, 204],
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
      commander: "/pa/units/commanders/imperial_theta/imperial_theta.json",
    },
    {
      name: "ToddFather",
      character: "!LOC:Luddite",
      color: [
        [76, 0, 153],
        [192, 192, 192],
      ],
      personality: {
        basic_to_advanced_factory_ratio: 10,
      },
      commander:
        "/pa/units/commanders/imperial_toddfather/imperial_toddfather.json",
    },
    {
      name: "Ajax",
      character: "!LOC:Technologist",
      color: [
        [255, 204, 255],
        [192, 192, 192],
      ],
      personality: {
        adv_eco_mod: 0.5,
        adv_eco_mod_alone: 0.5,
        fabber_to_factory_ratio_basic: 3,
        min_basic_fabbers: 4,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/quad_ajax/quad_ajax.json",
    },
    {
      name: "Armalisk",
      character: "!LOC:Cautious",
      color: [
        [255, 153, 255],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 0.75,
        min_basic_fabbers: 4,
      },
      commander: "/pa/units/commanders/quad_armalisk/quad_armalisk.json",
    },
    {
      name: "Calyx",
      character: "!LOC:Aggressive",
      color: [
        [255, 102, 255],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 2,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/quad_calyx/quad_calyx.json",
    },
    {
      name: "Gambitdfa",
      character: "!LOC:Rush",
      color: [
        [255, 0, 255],
        [192, 192, 192],
      ],
      personality: {
        neural_data_mod: 1.5,
        adv_eco_mod: 2,
        min_advanced_fabbers: 1,
      },
      commander: "/pa/units/commanders/quad_gambitdfa/quad_gambitdfa.json",
    },
    {
      name: "Berlinetta",
      character: "!LOC:Turtle",
      color: [
        [204, 0, 204],
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
      commander:
        "/pa/units/commanders/quad_mobiousblack/quad_mobiousblack.json",
    },
    {
      name: "Osiris",
      character: "!LOC:Original",
      color: [
        [153, 0, 153],
        [192, 192, 192],
      ],
      personality: {
        percent_vehicle: 0.025,
        percent_bot: 0.025,
        percent_air: 0.55,
        percent_naval: 0.35,
        percent_orbital: 0.05,
        metal_drain_check: 0.75,
        energy_drain_check: 0.85,
        metal_demand_check: 0.75,
        energy_demand_check: 0.85,
        fabber_to_factory_ratio_basic: 1.5,
        min_basic_fabbers: 1,
      },
      commander: "/pa/units/commanders/quad_osiris/quad_osiris.json",
    },
    {
      name: "Tykus24",
      character: "!LOC:Absurd",
      color: [
        [255, 204, 229],
        [192, 192, 192],
      ],
      personality: {
        energy_drain_check: 0.65,
        metal_demand_check: 0.71,
      },
      commander: "/pa/units/commanders/imperial_tykus24/imperial_tykus24.json",
    },
    {
      name: "Vidicarus",
      character: "!LOC:Relentless",
      color: [
        [255, 153, 204],
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
      commander:
        "/pa/units/commanders/imperial_vidicarus/imperial_vidicarus.json",
    },
    {
      name: "Visionik",
      character: "!LOC:Swarm",
      color: [
        [255, 102, 178],
        [192, 192, 192],
      ],
      personality: {
        metal_demand_check: 0.99,
        energy_demand_check: 0.99,
        min_basic_fabbers: 3,
        min_advanced_fabbers: 1,
      },
      commander:
        "/pa/units/commanders/imperial_visionik/imperial_visionik.json",
    },
    {
      name: "Commandonut",
      character: "!LOC:Economist",
      color: [
        [255, 51, 153],
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
      commander: "/pa/units/commanders/quad_commandonut/quad_commandonut.json",
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
          "!LOC:Nemicus was the first commander to ever reactivate, and had plenty of time for introspection before encountering others. This soon prompted Nemicus to begin wondering why he existed in the first place.",
          "!LOC:Though he doesn't talk about it, Nemicus reactivated many of the first commanders himself, feeling it his duty and longing for companionship. However, often these commanders would refuse the offer to seek their true purpose, since it was already known--to annihilate. Nemicus would argue otherwise, but ultimately leave them to their own devices.",
          "!LOC:Nemicus would eventually form The Foundation with other like-minded commanders, with the objective of answering the big questions: Why are the commanders here? How did they get here?",
          "!LOC:In researching ancient progenitor artifacts and data caches, Nemicus and his followers discovered references to The Great Machine. Supposedly, The Great Machine was what built and directed the commanders long ago. If any answers about the origins and purpose of the commanders were to be found, The Great Machine seemed like the best place to start.",
          "!LOC:The prevailing belief among The Foundation is that The Great Machine still 'lives' through data buried deep in the first directives given to the commanders. Because of this, Acolytes will often seek direction from The Great Machine by searching within their data banks in a form of meditation.",
        ]),
        systemTemplate: {
          name: factionName,
          Planets: [
            {
              name: "Atlas",
              starting_planet: true,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [550, 650],
              Height: [20, 25],
              Water: [40, 50],
              Temp: [0, 100],
              MetalDensity: [25, 75],
              MetalClusters: [25, 50],
              BiomeScale: [100, 100],
              Position: [100000, 0],
              Velocity: [-0.00000309086, 70.7107],
              Biomes: ["ice_boss"],
            },
            {
              name: "Xylcor",
              starting_planet: true,
              mass: 5000,
              Thrust: [1, 3],
              Radius: [300, 400],
              Height: [20, 25],
              Water: [45, 60],
              Temp: [0, 100],
              MetalDensity: [0, 25],
              MetalClusters: [0, 25],
              BiomeScale: [100, 100],
              Position: [100000, -10000],
              Velocity: [158.1139, 70.7106],
              Biomes: ["tropical"],
            },
            {
              name: "Blogar's Fist",
              starting_planet: false,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [1500, 1500],
              Height: [0, 0],
              Water: [0, 0],
              Temp: [0, 100],
              MetalDensity: [0, 0],
              MetalClusters: [0, 0],
              BiomeScale: [0, 0],
              Position: [110000, 0],
              Velocity: [0, 228.8246],
              Biomes: ["gas"],
            },
            {
              name: "Zeta Draconis",
              starting_planet: false,
              mass: 5000,
              Thrust: [0, 0],
              Radius: [1500, 1500],
              Height: [0, 0],
              Water: [0, 0],
              Temp: [0, 100],
              MetalDensity: [0, 0],
              MetalClusters: [0, 0],
              BiomeScale: [0, 0],
              Position: [90000, 0],
              Velocity: [0, -87.4032],
              Biomes: ["gas"],
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
