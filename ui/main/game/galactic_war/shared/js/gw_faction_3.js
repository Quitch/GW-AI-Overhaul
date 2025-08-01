// Overhauls personalities
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (personalities) {
  const factionName = "Revenants";
  const factionColour = [
    [236, 34, 35],
    [192, 192, 192],
  ];
  const baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    econ_rate: 1,
    personality: personalities.revenants,
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  const boss = {
    name: "First Seeker Osiris",
    character: "!LOC:Boss",
    personality: personalities.revenantsBoss,
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  const minions = [
    {
      name: "Betadyne",
      character: "!LOC:Space Invader",
      color: [
        [255, 204, 204],
        [192, 192, 192],
      ],
      personality: personalities.spaceInvader,
      commander: "/pa/units/commanders/raptor_betadyne/raptor_betadyne.json",
    },
    {
      name: "Centurion",
      character: "!LOC:Astronaut",
      color: [
        [255, 153, 153],
        [192, 192, 192],
      ],
      personality: personalities.astronaut,
      commander: "/pa/units/commanders/raptor_centurion/raptor_centurion.json",
    },
    {
      name: "Diremachine",
      character: "!LOC:Uber",
      color: [
        [255, 102, 102],
        [192, 192, 192],
      ],
      personality: personalities.uber,
      commander:
        "/pa/units/commanders/raptor_diremachine/raptor_diremachine.json",
    },
    {
      name: "Iwmiked",
      character: "!LOC:Fabber",
      color: [
        [204, 0, 0],
        [192, 192, 192],
      ],
      personality: personalities.fabber,
      commander: "/pa/units/commanders/raptor_iwmiked/raptor_iwmiked.json",
    },
    {
      name: "Majuju",
      character: "!LOC:Defender",
      color: [
        [153, 0, 0],
        [192, 192, 192],
      ],
      personality: personalities.defender,
      commander: "/pa/units/commanders/raptor_majuju/raptor_majuju.json",
    },
    {
      name: "Nefelpitou",
      character: "!LOC:Luddite",
      color: [
        [255, 204, 153],
        [192, 192, 192],
      ],
      personality: personalities.luddite,
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
      personality: personalities.technologist,
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
      personality: personalities.cautious,
      commander: "/pa/units/commanders/raptor_rallus/raptor_rallus.json",
    },
    {
      name: "Stickman9000",
      character: "!LOC:Aggressive",
      color: [
        [255, 128, 0],
        [192, 192, 192],
      ],
      personality: personalities.aggressive,
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
      personality: personalities.rush,
      commander: "/pa/units/commanders/raptor_zaazzaa/raptor_zaazzaa.json",
    },
    {
      name: "Aeson",
      character: "!LOC:Turtle",
      color: [
        [255, 255, 204],
        [192, 192, 192],
      ],
      personality: personalities.turtle,
      commander: "/pa/units/commanders/tank_aeson/tank_aeson.json",
    },
    {
      name: "Banditks",
      character: "!LOC:Original",
      color: [
        [255, 255, 153],
        [192, 192, 192],
      ],
      personality: personalities.revenantsOriginal,
      commander: "/pa/units/commanders/tank_banditks/tank_banditks.json",
    },
    {
      name: "SPZ58624",
      character: "!LOC:Absurd",
      color: [
        [255, 255, 102],
        [192, 192, 192],
      ],
      personality: personalities.absurd,
      commander: "/pa/units/commanders/raptor_spz58624/raptor_spz58624.json",
    },
    {
      name: "XOV",
      character: "!LOC:Factory",
      color: [
        [255, 255, 0],
        [192, 192, 192],
      ],
      personality: personalities.factory,
      commander: "/pa/units/commanders/raptor_xov/raptor_xov.json",
    },
    {
      name: "Reaver",
      character: "!LOC:Swarm",
      color: [
        [204, 204, 0],
        [192, 192, 192],
      ],
      personality: personalities.swarm,
      commander: "/pa/units/commanders/tank_reaver/tank_reaver.json",
    },
    {
      name: "Sadiga",
      character: "!LOC:Economist",
      color: [
        [153, 153, 0],
        [192, 192, 192],
      ],
      personality: personalities.economist,
      commander: "/pa/units/commanders/tank_sadiga/tank_sadiga.json",
    },
  ];

  const randomMinion = _.sample(minions);
  const randomAI = {
    name: "Enderstryke71",
    character: "!LOC:Random",
    color: [
      [255, 0, 0],
      [192, 192, 192],
    ],
    personality: randomMinion.personality,
    commander:
      "/pa/units/commanders/raptor_enderstryke71/raptor_enderstryke71.json",
  };
  minions.push(randomAI);

  return {
    name: factionName,
    color: factionColour,
    teams: [
      {
        name: factionName,
        boss: _.merge(_.cloneDeep(baselinePersonality), boss),
        systemDescription: _.sample([
          "!LOC:Osiris has always lead a solitary existence. He was always more interested in the parts of his fellow commanders than the commanders themselves. With every battle won he would take the best pieces left of the broken adversary and integrate them into his form. Osiris is considered one of the most dangerous forces in the galaxy.",
          "!LOC:As Osiris replaced pieces of himself with those of fallen foes, he would store older parts for replacements and repairs. Eventually, Osiris acquired enough spare parts to construct an entirely new commander. This would be the birth of the first Seeker.",
          "!LOC:The Revenants are unique in that their motivations are individual rather than collective. Each Seeker follows in the example of their legendary Osiris--they seek battle to become stronger through their fallen enemies, and to create more Revenants.",
          "!LOC:Osiris holds no interest in ruling, and instead serves more as an exemplar, whether he cares to or not. Therefore, it falls to a small council of older Seekers to direct the affairs of The Revenants at large--primarily making sure that they're fighting the other factions instead of amongst themselves.",
          "!LOC:Osiris often considered the most dangerous commander in all the galaxy for the amount of annihilations he is credited with. A force of war equal to any army, high command of any faction takes his movements into consideration when deploying forces.",
        ]),
        systemTemplate: {
          name: factionName,
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
    minions: _.map(minions, function (personalityModifiers) {
      return _.merge(_.cloneDeep(baselinePersonality), personalityModifiers);
    }),
  };
});
