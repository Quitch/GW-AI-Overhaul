// Overhauls personalities
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (personalities) {
  var factionName = "Legonis Machina";
  var factionColour = [
    [0, 176, 255],
    [192, 192, 192],
  ];
  var baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    econ_rate: 1,
    personality: personalities.legonisMachina,
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  var boss = {
    name: "Imperator Invictus",
    character: "!LOC:Boss",
    personality: personalities.legonisMachinaBoss,
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  var minions = [
    {
      name: "Able",
      character: "!LOC:Armor",
      personality: personalities.armour,
      commander: "/pa/units/commanders/imperial_able/imperial_able.json",
    },
    {
      name: "AceAI",
      character: "!LOC:Roboticist",
      personality: personalities.roboticist,
      commander: "/pa/units/commanders/imperial_aceal/imperial_aceal.json",
    },
    {
      name: "Alpha",
      character: "!LOC:Uber",
      personality: personalities.uber,
      commander: "/pa/units/commanders/imperial_alpha/imperial_alpha.json",
    },
    {
      name: "Chronoblip",
      character: "!LOC:Fabber",
      personality: personalities.fabber,
      commander:
        "/pa/units/commanders/imperial_chronoblip/imperial_chronoblip.json",
    },
    {
      name: "Mjon",
      character: "!LOC:Defender",
      personality: personalities.defender,
      commander: "/pa/units/commanders/imperial_mjon/imperial_mjon.json",
    },
    {
      name: "Delta",
      character: "!LOC:Luddite",
      personality: personalities.luddite,
      commander: "/pa/units/commanders/imperial_delta/imperial_delta.json",
    },
    {
      name: "Enzomatrix",
      character: "!LOC:Technologist",
      personality: personalities.technologist,
      commander:
        "/pa/units/commanders/imperial_enzomatrix/imperial_enzomatrix.json",
    },
    {
      name: "Fiveleafclover",
      character: "!LOC:Cautious",
      personality: personalities.cautious,
      commander:
        "/pa/units/commanders/imperial_fiveleafclover/imperial_fiveleafclover.json",
    },
    {
      name: "Gamma",
      character: "!LOC:Aggressive",
      personality: personalities.aggressive,
      commander: "/pa/units/commanders/imperial_gamma/imperial_gamma.json",
    },
    {
      name: "Gnugfur",
      character: "!LOC:Rush",
      personality: personalities.rush,
      commander: "/pa/units/commanders/imperial_gnugfur/imperial_gnugfur.json",
    },
    {
      name: "Nemicus",
      character: "!LOC:Turtle",
      personality: personalities.turtle,
      commander: "/pa/units/commanders/raptor_nemicus/raptor_nemicus.json",
    },
    {
      name: "Kapowaz",
      character: "!LOC:Original",
      personality: personalities.legonisMachinaOriginal,
      commander: "/pa/units/commanders/imperial_kapowaz/imperial_kapowaz.json",
    },
    {
      name: "JT100010117",
      character: "!LOC:Absurd",
      personality: personalities.absurd,
      commander:
        "/pa/units/commanders/imperial_jt100010117/imperial_jt100010117.json",
    },
    {
      name: "Kevin4001",
      character: "!LOC:Factory",
      personality: personalities.factory,
      commander:
        "/pa/units/commanders/imperial_kevin4001/imperial_kevin4001.json",
    },
    {
      name: "Mostlikely",
      character: "!LOC:Swarm",
      personality: personalities.swarm,
      commander:
        "/pa/units/commanders/imperial_mostlikely/imperial_mostlikely.json",
    },
    {
      name: "Nagasher",
      character: "!LOC:Economist",
      personality: personalities.economist,
      commander:
        "/pa/units/commanders/imperial_nagasher/imperial_nagasher.json",
    },
  ];
  var randomPersonality = _.sample(minions).personality;
  var randomAI = {
    name: "Aryst0krat",
    character: "!LOC:Random",
    personality: randomPersonality,
    commander:
      "/pa/units/commanders/imperial_aryst0krat/imperial_aryst0krat.json",
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
          "!LOC:The goal of the Legionis Machina is simple--conquest. Invictus is the designated ruler of the galaxy, and any commanders disobeying this directive are faulty.",
          "!LOC:When Invictus reactivated, his memory was more whole than most commanders. This is where his assertion of his right to rule came from. That may or may not be true, but what is true is that Invictus knows more about the origin of the commanders than he cares to tell his compatriots.",
          "!LOC:Unlike the other factions, the Legionis Machina operates as a hierarchy. Senior Legates have several Vassal Legates assigned to them, and all Legates are subjects of Invictus himself.",
          "!LOC:If war is a commander's natural state, then the purest expression of this is the Legionis Machina. It begs the question, though--what happens after they conquer this galaxy, if they do?",
          "!LOC:The Legionis Machina can be considered a cult of personality, in that their purpose is void without Invictus. This is likely where their bitter hatred of The Synchronous comes from, as they view Metrarch as a false idol of sorts.",
        ]),
        systemTemplate: {
          name: factionName,
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
    minions: _.map(minions, function (personalityModifiers) {
      return _.merge(_.cloneDeep(baselinePersonality), personalityModifiers);
    }),
  };
});
