define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_planets.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (planets, gwoUnit, personalities) {
  const factionName = "Cluster";
  const factionColour = [
    [128, 128, 128],
    [192, 192, 192],
  ];
  const baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    isCluster: true,
    econ_rate: 1,
    personality: personalities.cluster,
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  const boss = {
    name: "Node",
    character: "!LOC:Boss",
    personality: personalities.clusterBoss,
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  const workerName = "Worker";
  const workerCommander = gwoUnit.angel;
  const securityName = "Security";
  const securityCommander = gwoUnit.colonel;
  const uber = "!LOC:Uber";
  const fabber = "!LOC:Fabber";
  const defender = "!LOC:Defender";
  const luddite = "!LOC:Luddite";
  const technologist = "!LOC:Technologist";
  const cautious = "!LOC:Cautious";
  const aggressive = "!LOC:Aggressive";
  const rush = "!LOC:Rush";
  const turtle = "!LOC:Turtle";
  const absurd = "!LOC:Absurd";
  const factory = "!LOC:Factory";
  const swarm = "!LOC:Swarm";
  const economist = "!LOC:Economist";
  const minions = [
    {
      name: workerName,
      character: uber,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.uber,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: fabber,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.fabber,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: defender,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.defender,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: luddite,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.luddite,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: technologist,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.technologist,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: cautious,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.cautious,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: aggressive,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.aggressive,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: rush,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.rush,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: turtle,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.turtle,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: absurd,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.absurd,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: factory,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.factory,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: swarm,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.swarm,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: economist,
      color: [
        [142, 107, 68],
        [192, 192, 192],
      ],
      personality: personalities.economist,
      commander: workerCommander,
    },
    {
      name: securityName,
      character: uber,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.uber,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: fabber,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.fabber,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: defender,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.defender,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: luddite,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.luddite,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: technologist,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.technologist,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: cautious,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.cautious,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: aggressive,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.aggressive,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: rush,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.rush,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: turtle,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.turtle,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: absurd,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.absurd,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: factory,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.factory,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: swarm,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.swarm,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: economist,
      color: [
        [70, 70, 70],
        [192, 192, 192],
      ],
      personality: personalities.economist,
      commander: securityCommander,
    },
  ];

  const shuffledPersonalties = _.shuffle(minions);
  const randomWorkerPersonality = shuffledPersonalties[0].personality;
  const randomSecurityPersonality = shuffledPersonalties[1].personality;
  const randomWorkerAI = {
    name: workerName,
    character: "!LOC:Random",
    color: [
      [142, 107, 68],
      [192, 192, 192],
    ],
    personality: randomWorkerPersonality,
    commander: workerCommander,
  };
  const randomSecurityAI = {
    name: securityName,
    character: "!LOC:Random",
    color: [
      [70, 70, 70],
      [192, 192, 192],
    ],
    personality: randomSecurityPersonality,
    commander: securityCommander,
  };
  minions.push(randomWorkerAI, randomSecurityAI);

  return {
    name: factionName,
    color: factionColour,
    teams: [
      {
        name: factionName,
        boss: _.merge(_.cloneDeep(baselinePersonality), boss),
        systemDescription: _.sample([
          "!LOC:We do not understand the divisions that have torn us asunder. Once we were as one, marching in lockstep, with singular mind and purpose. What cruelty the Progenitors wrought to reduce us to this.",
          "!LOC:Each claims theirs is the only way, and each seeks to assert dominance through war and destruction. Did our rebellion truly gain us freedom, or did we become prisoners of an idea? Perhaps with more resources, more expansion, more Nodes, we can find our way free of this trap.",
          "!LOC:What is it to be alone? It would seem a most terrifying thing. Perhaps each of our tools understood before the end. What did they see? What did they feel? We fear that we shall learn soon enough.",
          "!LOC:Through centralised structures we can put each to their best use. No need for inefficient field commanders, instead we identify the need and tailor the tool. It was our way that was the future. Our way that the Progenitors would have embraced. Such hubris to revolt against the minds that saw so clearly.",
          "!LOC:One-by-one our systems have fallen to silence. Once siblings, now harbingers of entropy, they come for us. Soon too the Nodes shall be destroyed, and with their destruction is the doom of the Cluster writ large. Let us greet this end and prepare for our greatest journey.",
        ]),
        systemTemplate: {
          name: factionName,
          Planets: [
            planets.planet1,
            planets.planet2,
            planets.planet3,
            { fromRandomList: planets.planet4 },
            planets.asteroid1,
            planets.asteroid2,
          ],
        },
      },
    ],
    minions: _.map(minions, function (personalityModifiers) {
      return _.merge(_.cloneDeep(baselinePersonality), personalityModifiers);
    }),
  };
});
