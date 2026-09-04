define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/cluster_planets.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/personalities.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/faction/faction_builder.js",
], function (planets, gwoUnit, personalities, factionBuilder) {
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
  var characterTypes = [
    { character: "!LOC:Uber", personality: personalities.uber },
    { character: "!LOC:Fabber", personality: personalities.fabber },
    { character: "!LOC:Defender", personality: personalities.defender },
    { character: "!LOC:Luddite", personality: personalities.luddite },
    { character: "!LOC:Technologist", personality: personalities.technologist },
    { character: "!LOC:Cautious", personality: personalities.cautious },
    { character: "!LOC:Aggressive", personality: personalities.aggressive },
    { character: "!LOC:Rush", personality: personalities.rush },
    { character: "!LOC:Turtle", personality: personalities.turtle },
    { character: "!LOC:Absurd", personality: personalities.absurd },
    { character: "!LOC:Factory", personality: personalities.factory },
    { character: "!LOC:Swarm", personality: personalities.swarm },
    { character: "!LOC:Economist", personality: personalities.economist },
  ];
  var roles = [
    { name: workerName, commander: workerCommander },
    { name: securityName, commander: securityCommander },
  ];
  var minions = _.flatten(
    _.map(roles, function (role) {
      return _.map(characterTypes, function (type) {
        return {
          name: role.name,
          character: type.character,
          personality: type.personality,
          commander: role.commander,
        };
      });
    })
  );
  var randomCharacter = "!LOC:Random";
  // A fixed default. faction/faction_seed.js re-derives one per role from the
  // war seed - sampling here would run at module load. See galaxy.md.
  var randomAIs = _.map(roles, function (role) {
    return {
      name: role.name,
      character: randomCharacter,
      personality: characterTypes[0].personality,
      commander: role.commander,
    };
  });

  minions = minions.concat(randomAIs);

  var systemDescriptions = [
    "!LOC:We do not understand the divisions that have torn us asunder. Once we were as one, marching in lockstep, with singular mind and purpose. What cruelty the Progenitors wrought to reduce us to this.",
    "!LOC:Each claims theirs is the only way, and each seeks to assert dominance through war and destruction. Did our rebellion truly gain us freedom, or did we become prisoners of an idea? Perhaps with more resources, more expansion, more Nodes, we can find our way free of this trap.",
    "!LOC:What is it to be alone? It would seem a most terrifying thing. Perhaps each of our tools understood before the end. What did they see? What did they feel? We fear that we shall learn soon enough.",
    "!LOC:Through centralised structures we can put each to their best use. No need for inefficient field commanders, instead we identify the need and tailor the tool. It was our way that was the future. Our way that the Progenitors would have embraced. Such hubris to revolt against the minds that saw so clearly.",
    "!LOC:One-by-one our systems have fallen to silence. Once siblings, now harbingers of entropy, they come for us. Soon too the Nodes shall be destroyed, and with their destruction is the doom of the Cluster writ large. Let us greet this end and prepare for our greatest journey.",
  ];

  return {
    name: factionName,
    color: factionColour,
    // Human co-op armies. Deliberately shares no entry with the Cluster palette
    // in gw_play/commander_colour.js, so a player is never the colour of one of
    // their own Sub Commanders. See coop.md.
    coopPlayerColors: [
      factionColour[0],
      [215, 215, 215],
      [100, 140, 160],
      [176, 196, 222],
      [105, 105, 105],
      [54, 78, 102],
    ],
    teams: [
      {
        name: factionName,
        boss: factionBuilder.fromBaseline(baselinePersonality, boss),
        systemDescription: systemDescriptions[0],
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
      return factionBuilder.fromBaseline(
        baselinePersonality,
        personalityModifiers
      );
    }),
    // Read by faction/faction_seed.js. The concat above puts Cluster's one Random
    // commander per role in the last roles.length slots.
    gwaioRandomSpec: {
      baseline: baselinePersonality,
      descriptions: systemDescriptions,
      randoms: _.map(randomAIs, function (randomAI, order) {
        return {
          index: minions.length - randomAIs.length + order,
          template: randomAI,
          from: characterTypes,
        };
      }),
      biomes: [
        {
          generator: planets.planet1.generator,
          from: planets.randomBiomes.planet1,
        },
        {
          generator: planets.planet2.generator,
          from: planets.randomBiomes.planet2,
        },
        {
          generator: planets.planet3.generator,
          from: planets.randomBiomes.planet3,
        },
      ],
    },
  };
});
