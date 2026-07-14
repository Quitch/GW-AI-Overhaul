define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_planets.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
], function (planets, gwoUnit, personalities) {
  var factionName = "Cluster";
  var factionColour = [
    [128, 128, 128],
    [192, 192, 192],
  ];
  var baselinePersonality = {
    name: "Baseline",
    character: "!LOC:Baseline",
    color: factionColour,
    isCluster: true,
    econ_rate: 1,
    personality: personalities.cluster,
    commander: "/pa/units/commanders/imperial_able/imperial_able.json",
  };
  var boss = {
    name: "Node",
    character: "!LOC:Boss",
    personality: personalities.clusterBoss,
    commander: "/pa/units/commanders/quad_pumpkin/quad_pumpkin.json",
  };
  var workerName = "Worker";
  var workerCommander = gwoUnit.angel;
  var securityName = "Security";
  var securityCommander = gwoUnit.colonel;
  var uber = "!LOC:Uber";
  var fabber = "!LOC:Fabber";
  var defender = "!LOC:Defender";
  var luddite = "!LOC:Luddite";
  var technologist = "!LOC:Technologist";
  var cautious = "!LOC:Cautious";
  var aggressive = "!LOC:Aggressive";
  var rush = "!LOC:Rush";
  var turtle = "!LOC:Turtle";
  var absurd = "!LOC:Absurd";
  var factory = "!LOC:Factory";
  var swarm = "!LOC:Swarm";
  var economist = "!LOC:Economist";
  var random = "!LOC:Random";
  var minions = [
    {
      name: workerName,
      character: uber,
      color: factionColour,
      personality: personalities.uber,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: fabber,
      color: factionColour,
      personality: personalities.fabber,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: defender,
      color: factionColour,
      personality: personalities.defender,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: luddite,
      color: factionColour,
      personality: personalities.luddite,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: technologist,
      color: factionColour,
      personality: personalities.technologist,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: cautious,
      color: factionColour,
      personality: personalities.cautious,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: aggressive,
      color: factionColour,
      personality: personalities.aggressive,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: rush,
      color: factionColour,
      personality: personalities.rush,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: turtle,
      color: factionColour,
      personality: personalities.turtle,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: absurd,
      color: factionColour,
      personality: personalities.absurd,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: factory,
      color: factionColour,
      personality: personalities.factory,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: swarm,
      color: factionColour,
      personality: personalities.swarm,
      commander: workerCommander,
    },
    {
      name: workerName,
      character: economist,
      color: factionColour,
      personality: personalities.economist,
      commander: workerCommander,
    },
    {
      name: securityName,
      character: uber,
      color: factionColour,
      personality: personalities.uber,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: fabber,
      color: factionColour,
      personality: personalities.fabber,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: defender,
      color: factionColour,
      personality: personalities.defender,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: luddite,
      color: factionColour,
      personality: personalities.luddite,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: technologist,
      color: factionColour,
      personality: personalities.technologist,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: cautious,
      color: factionColour,
      personality: personalities.cautious,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: aggressive,
      color: factionColour,
      personality: personalities.aggressive,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: rush,
      color: factionColour,
      personality: personalities.rush,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: turtle,
      color: factionColour,
      personality: personalities.turtle,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: absurd,
      color: factionColour,
      personality: personalities.absurd,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: factory,
      color: factionColour,
      personality: personalities.factory,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: swarm,
      color: factionColour,
      personality: personalities.swarm,
      commander: securityCommander,
    },
    {
      name: securityName,
      character: economist,
      color: factionColour,
      personality: personalities.economist,
      commander: securityCommander,
    },
  ];

  var randomWorkerPersonality = _.sample(minions).personality;
  var randomSecurityPersonality = _.sample(minions).personality;
  var randomWorkerAI = {
    name: workerName,
    character: random,
    color: factionColour,
    personality: randomWorkerPersonality,
    commander: workerCommander,
  };
  var randomSecurityAI = {
    name: securityName,
    character: random,
    color: factionColour,
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
