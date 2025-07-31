// Overhauls personalities
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (personalities) {
  const factionName = "Foundation";
  const factionColour = [
    [145, 87, 199],
    [192, 192, 192],
  ];
  const baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    econ_rate: 1,
    personality: personalities.foundation,
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  const boss = {
    name: "Inquisitor Nemicus",
    character: "!LOC:Boss",
    personality: personalities.foundationBoss,
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  const minions = [
    {
      name: "Progenitor",
      character: "!LOC:Air Force",
      color: [
        [229, 204, 255],
        [192, 192, 192],
      ],
      personality: personalities.airForce,
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
      personality: personalities.navy,
      commander: "/pa/units/commanders/imperial_sangudo/imperial_sangudo.json",
    },
    {
      name: "Seniorhelix",
      character: "!LOC:Uber",
      color: [
        [178, 102, 255],
        [192, 192, 192],
      ],
      personality: personalities.uber,
      commander:
        "/pa/units/commanders/imperial_seniorhelix/imperial_seniorhelix.json",
    },
    {
      name: "TheChessKnight",
      character: "!LOC:Fabber",
      color: [
        [127, 0, 255],
        [192, 192, 192],
      ],
      personality: personalities.fabber,
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
      personality: personalities.defender,
      commander: "/pa/units/commanders/imperial_theta/imperial_theta.json",
    },
    {
      name: "ToddFather",
      character: "!LOC:Luddite",
      color: [
        [76, 0, 153],
        [192, 192, 192],
      ],
      personality: personalities.luddite,
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
      personality: personalities.technologist,
      commander: "/pa/units/commanders/quad_ajax/quad_ajax.json",
    },
    {
      name: "Armalisk",
      character: "!LOC:Cautious",
      color: [
        [255, 153, 255],
        [192, 192, 192],
      ],
      personality: personalities.cautious,
      commander: "/pa/units/commanders/quad_armalisk/quad_armalisk.json",
    },
    {
      name: "Calyx",
      character: "!LOC:Aggressive",
      color: [
        [255, 102, 255],
        [192, 192, 192],
      ],
      personality: personalities.aggressive,
      commander: "/pa/units/commanders/quad_calyx/quad_calyx.json",
    },
    {
      name: "Gambitdfa",
      character: "!LOC:Rush",
      color: [
        [255, 0, 255],
        [192, 192, 192],
      ],
      personality: personalities.rush,
      commander: "/pa/units/commanders/quad_gambitdfa/quad_gambitdfa.json",
    },
    {
      name: "Berlinetta",
      character: "!LOC:Turtle",
      color: [
        [204, 0, 204],
        [192, 192, 192],
      ],
      personality: personalities.turtle,
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
      personality: personalities.foundationOriginal,
      commander: "/pa/units/commanders/quad_osiris/quad_osiris.json",
    },
    {
      name: "Tykus24",
      character: "!LOC:Absurd",
      color: [
        [255, 204, 229],
        [192, 192, 192],
      ],
      personality: personalities.absurd,
      commander: "/pa/units/commanders/imperial_tykus24/imperial_tykus24.json",
    },
    {
      name: "Vidicarus",
      character: "!LOC:Factory",
      color: [
        [255, 153, 204],
        [192, 192, 192],
      ],
      personality: personalities.factory,
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
      personality: personalities.swarm,
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
      personality: personalities.economist,
      commander: "/pa/units/commanders/quad_commandonut/quad_commandonut.json",
    },
  ];

  const randomMinion = _.sample(minions);
  const randomAI = {
    name: "Stelarch",
    character: "!LOC:Random",
    color: [
      [153, 51, 255],
      [192, 192, 192],
    ],
    personality: randomMinion.personality,
    commander: "/pa/units/commanders/imperial_stelarch/imperial_stelarch.json",
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
