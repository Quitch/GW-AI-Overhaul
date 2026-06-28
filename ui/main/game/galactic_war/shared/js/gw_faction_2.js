// Overhauls personalities
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (personalities) {
  const factionName = "Synchronous";
  const factionColour = [
    [126, 226, 101],
    [192, 192, 192],
  ];
  const baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    econ_rate: 1,
    personality: personalities.synchronous,
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  const boss = {
    name: "Metrarch the Machinist",
    character: "!LOC:Boss",
    personality: personalities.synchronousBoss,
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  const minions = [
    {
      name: "Potbelly79",
      character: "!LOC:Grunt",
      color: factionColour,
      personality: personalities.grunt,
      commander: "/pa/units/commanders/quad_potbelly79/quad_potbelly79.json",
    },
    {
      name: "Raventhornn",
      character: "!LOC:Dragoon",
      color: factionColour,
      personality: personalities.dragoon,
      commander: "/pa/units/commanders/quad_raventhornn/quad_raventhornn.json",
    },
    {
      name: "SacrificialLamb",
      character: "!LOC:Uber",
      color: factionColour,
      personality: personalities.uber,
      commander:
        "/pa/units/commanders/quad_sacrificiallamb/quad_sacrificiallamb.json",
    },
    {
      name: "Spartandano",
      character: "!LOC:Fabber",
      color: factionColour,
      personality: personalities.fabber,
      commander: "/pa/units/commanders/quad_spartandano/quad_spartandano.json",
    },
    {
      name: "Xenosentry",
      character: "!LOC:Defender",
      color: factionColour,
      personality: personalities.defender,
      commander:
        "/pa/units/commanders/quad_spiderofmean/quad_spiderofmean.json",
    },
    {
      name: "TheFlax",
      character: "!LOC:Luddite",
      color: factionColour,
      personality: personalities.luddite,
      commander: "/pa/units/commanders/quad_theflax/quad_theflax.json",
    },
    {
      name: "Tokamaktech",
      character: "!LOC:Technologist",
      color: factionColour,
      personality: personalities.technologist,
      commander: "/pa/units/commanders/quad_tokamaktech/quad_tokamaktech.json",
    },
    {
      name: "Twoboots",
      character: "!LOC:Cautious",
      color: factionColour,
      personality: personalities.cautious,
      commander: "/pa/units/commanders/quad_twoboots/quad_twoboots.json",
    },
    {
      name: "XenosentryPrime",
      character: "!LOC:Aggressive",
      color: factionColour,
      personality: personalities.aggressive,
      commander:
        "/pa/units/commanders/quad_xenosentryprime/quad_xenosentryprime.json",
    },
    {
      name: "Xinthar",
      character: "!LOC:Rush",
      color: factionColour,
      personality: personalities.rush,
      commander: "/pa/units/commanders/quad_xinthar/quad_xinthar.json",
    },
    {
      name: "Beast",
      character: "!LOC:Turtle",
      color: factionColour,
      personality: personalities.turtle,
      commander: "/pa/units/commanders/raptor_beast/raptor_beast.json",
    },
    {
      name: "Beniesk",
      character: "!LOC:Original",
      color: factionColour,
      personality: personalities.synchronousOriginal,
      commander: "/pa/units/commanders/raptor_beniesk/raptor_beniesk.json",
    },
    {
      name: "Locust",
      character: "!LOC:Absurd",
      color: factionColour,
      personality: personalities.absurd,
      commander: "/pa/units/commanders/quad_locust/quad_locust.json",
    },
    {
      name: "Zancrowe",
      character: "!LOC:Factory",
      color: factionColour,
      personality: personalities.factory,
      commander: "/pa/units/commanders/quad_zancrowe/quad_zancrowe.json",
    },
    {
      name: "Damubbster",
      character: "!LOC:Swarm",
      color: factionColour,
      personality: personalities.swarm,
      commander:
        "/pa/units/commanders/raptor_damubbster/raptor_damubbster.json",
    },
    {
      name: "Raizell",
      character: "!LOC:Economist",
      color: factionColour,
      personality: personalities.economist,
      commander: "/pa/units/commanders/raptor_raizell/raptor_raizell.json",
    },
  ];

  const randomMinion = _.sample(minions);
  const randomAI = {
    name: "Shadowdaemon",
    character: "!LOC:Random",
    color: factionColour,
    personality: randomMinion.personality,
    commander: "/pa/units/commanders/quad_shadowdaemon/quad_shadowdaemon.json",
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
