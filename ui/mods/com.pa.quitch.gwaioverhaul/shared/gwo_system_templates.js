// A seeded copy of the base game's systems/template-loader.js, so a war seed reproduces
// the same systems.
//
// It lives here rather than shadowing that path because Shared Systems for Galactic War
// replaces the same file wholesale, and two mods cannot shadow one path - whichever loses
// simply vanishes. chooseFor() below therefore defers to that mod when it is present; it
// owns system selection then, picking real .pas systems that GWO's brackets have already
// ordered from the seed.
//
// Changes from stock, all in generate(): the system name and each planet's biome drew
// from _.sample rather than the seeded rng, and each planet's generator values were drawn
// from a stream shared with every other planet after an async wait, so a seeded stream was
// consumed in an unseeded order. Planet names remain api.game.getRandomPlanetName().
// See docs/galaxy.md, "Determinism and the war seed".
define([
  "main/game/galactic_war/shared/js/systems/pa-easy",
  "main/game/galactic_war/shared/js/systems/pa-normal",
  "main/game/galactic_war/shared/js/systems/titans-easy",
  "main/game/galactic_war/shared/js/systems/titans-normal",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
], function (paEasy, paNormal, titansEasy, titansNormal, gwoRng) {
  var planetTemplate = {
    name: "Default Planet",
    mass: 5000,
    position: [0, 0],
    velocity: [0, 0],
    required_thrust_to_move: 0,
    generator: {
      seed: 15,
      radius: 100,
      heightRange: 25,
      waterHeight: 35,
      temperature: 100,
      metalDensity: 50,
      metalClusters: 50,
      biomeScale: 100,
      biome: "earth",
    },
  };

  var classicSystemNames = [
    /* yes, we plan to keep many of these forever -- but yes, we intend to filter them and dilute them */
    "Helecon",
    "Kehlmor",
    "Kenyatta",
    "Phyrixis",
    "Nevarya",
    "Nymicia",
    "Delyium",
    "Thrale's Maze",
    "Taigos",
    "Gairdin",
    "Hades Playground",
    "Seven Gates",
    "Almata",
    "Borland-Kas",
    "Freeland",
    "Omicron Herculis",
    "Kappa Geminorum",
    "Vanguard",
    "Gamma Hydra",
    "Rho Persei",
    "Daktor",
    "Corgan's Well",
    "Delta Bootis",
    "Section 17",
    "Tyson",
    "Baridi",
    "Heaven's Doorway",
    "The Haystacks",
    "Beta Draconis",
    "Epsilon Persei",
    "The Junkyard",
    "Horizon",
    "Icarus",
    "Lambda Geminorum",
    "The Badlands",
    "Myr",
    "Chi Leonis",
    "Slynovia",
    "Agint",
    "Diamant",
    "Smarald",
    "Blumoto",
    "Hatuamoto",
    "Rubin",
    "Kuzimu",
    "Qiong",
    "Zapada",
    "Daoren",
    "Foc",
    "Jianshen",
    "Gigant",
    "Quingshan",
    "Dragon's Spine",
    "Shasha",
    "Biansai",
    "Battuta",
    "Dampier",
    "Odin",
    "Changchun",
    "Forskaal",
    "Galiano",
    "Magellan",
    "Ingstad",
    "Janszoon",
    "Kozlov",
    "Mawson",
    "Rawat",
    "Orellana",
    "Pytheas",
    "Queiros",
    "Rustah",
    "Salak",
    "Tsunenaga",
    "Urdaneta",
    "Dayuan",
    "Xuanzang",
    "Zarco",
    "Derekas",
    "Espenak",
    "Fazhani",
    "Shoujing",
    "Aryabhata",
    "Akiyama",
    "Banno",
    "Hagihara",
    "Hyakutake",
    "Inoda",
    "Bingzhen",
    "Karachkina",
    "Battani",
    "Bhaskara",
    "Lagadha",
    "Miyaska",
    "Naubakht",
    "Oterma",
    "Planicus",
    "Qushji",
    "Rittenhouse",
    "Sagan",
    "Suntzeff",
    "Takamizawa",
    "Urata",
    "Vavrova",
    "Wolszcaw",
    "Yuzhe",
    "Riazuddiv",
    "Humungus",
    "Bethe",
    "Jansky",
    "Sancruzo",
    "Monday Night",
  ];

  // Merges a planet drawn from a fromRandomList pool with the requesting planet. Stock
  // keeps this inline; it is lifted out only so the generate() below stays readable.
  var fromRandomList = function (plnt, planetRng, usedIndexContainers) {
    var planetList = plnt.fromRandomList.planets;

    // Keyed by the fromRandomList instance, because planetList is rebuilt every time.
    var usedIndexContainer = _.find(usedIndexContainers, function (container) {
      return container.planets === plnt.fromRandomList;
    });
    if (!usedIndexContainer) {
      usedIndexContainer = { planets: plnt.fromRandomList, usedIndexes: [] };
      usedIndexContainers.push(usedIndexContainer);
    }

    var matchesRequest = function (planet) {
      return (
        typeof plnt.isExplicit === "undefined" ||
        !!planet.isExplicit === plnt.isExplicit
      );
    };

    var unused = _.filter(planetList, function (planet) {
      return (
        matchesRequest(planet) &&
        usedIndexContainer.usedIndexes.indexOf(planetList.indexOf(planet)) ===
          -1
      );
    });

    var viablePlanets = unused;
    if (unused.length <= 1) {
      // Stop caring about whether it is unused.
      viablePlanets = _.filter(planetList, matchesRequest);
      if (viablePlanets.length === 0) {
        return null;
      }
    }
    var index = planetRng.int(0, viablePlanets.length - 1);

    var planet = viablePlanets[index];
    usedIndexContainer.usedIndexes.push(planetList.indexOf(planet));

    // The pool must not be cloned along with the planet.
    var sourceList = plnt.fromRandomList;
    plnt.fromRandomList = null;
    var extendedPlanet = _.cloneDeep(planet);
    _.assign(extendedPlanet, _.cloneDeep(plnt));
    plnt.fromRandomList = sourceList;

    extendedPlanet.gwaioGeneratorIndex = index;
    return extendedPlanet;
  };

  var gwoChooseStarSystemTemplates = function (content, easier) {
    var activeTemplates;
    if (content === "PAExpansion1") {
      activeTemplates = easier ? titansEasy : titansNormal;
    } else {
      activeTemplates = easier ? paEasy : paNormal;
    }

    var generate = function (config) {
      var rng = gwoRng.create(
        config.seed !== undefined ? config.seed : Math.random()
      );

      var rSystem = {
        name: config.name || "PA-" + rng.int(100, 30000),
        description: "",
        isRandomlyGenerated: true,
      };

      var cSys = _.cloneDeep(config.template);
      if (!cSys) {
        var starSystemTempl = _.find(activeTemplates, function (sst) {
          return (
            sst.Players[0] <= config.players && config.players <= sst.Players[1]
          );
        });
        if (!starSystemTempl) {
          starSystemTempl = _.last(activeTemplates);
          if (!starSystemTempl) {
            return $.when(null);
          }
        }

        cSys =
          starSystemTempl.Systems[
            rng.int(0, starSystemTempl.Systems.length - 1)
          ];
        rSystem.name = rng.pick(classicSystemNames);
        rSystem.players = starSystemTempl.Players;
      }

      var usedIndexContainers = [];

      var pgen = _.map(cSys.Planets, function (plnt, planetIndex) {
        // Taken synchronously, because everything after the $.when below runs in
        // resolution order rather than in cSys.Planets order. Keying by position makes
        // that irrelevant.
        var planetRng = rng.stream("planet", planetIndex);
        var generatorIndex = planetIndex;

        if (plnt.fromRandomList) {
          var fromPool = fromRandomList(plnt, planetRng, usedIndexContainers);
          if (!fromPool) {
            return null;
          }
          generatorIndex = fromPool.gwaioGeneratorIndex;
          delete fromPool.gwaioGeneratorIndex;
          plnt = fromPool;
        }

        if (plnt.isExplicit) {
          if (plnt.name) {
            return $.when(plnt);
          }
          return api.game.getRandomPlanetName().then(function (name) {
            plnt.name = name;
            return plnt;
          });
        }

        var bp = _.cloneDeep(planetTemplate);
        bp.generator.seed = planetRng.int(0, 32767);
        bp.generator.biome = planetRng.pick(plnt.Biomes);

        var biomeGet = $.get(
          "coui://pa/terrain/" + bp.generator.biome + ".json"
        ).then(function (data) {
          return parse(data);
        });
        var nameGet = plnt.name;
        if (!nameGet) {
          nameGet = api.game.getRandomPlanetName();
        }

        return $.when(biomeGet, nameGet).then(function (biomeInfo, name) {
          var radiusRange = biomeInfo.radius_range;
          if (!_.isArray(radiusRange)) {
            radiusRange = [100, 1300];
          }

          bp.generator.radius = planetRng.int(
            Math.max(plnt.Radius[0], radiusRange[0]),
            Math.min(plnt.Radius[1], radiusRange[1])
          );
          bp.generator.heightRange = planetRng.int(
            plnt.Height[0],
            plnt.Height[1]
          );
          bp.generator.waterHeight = planetRng.int(
            plnt.Water[0],
            plnt.Water[1]
          );
          bp.generator.waterDepth = 100;
          bp.generator.temperature = planetRng.int(plnt.Temp[0], plnt.Temp[1]);
          bp.generator.biomeScale = planetRng.int(
            plnt.BiomeScale[0],
            plnt.BiomeScale[1]
          );
          bp.generator.metalDensity = planetRng.int(
            plnt.MetalDensity[0],
            plnt.MetalDensity[1]
          );
          bp.generator.metalClusters = planetRng.int(
            plnt.MetalClusters[0],
            plnt.MetalClusters[1]
          );
          bp.generator.index = generatorIndex;
          bp.name = name;
          bp.position = plnt.Position;
          bp.velocity = plnt.Velocity;
          bp.required_thrust_to_move = planetRng.int(
            plnt.Thrust[0],
            plnt.Thrust[1]
          );
          bp.mass = plnt.mass;
          bp.starting_planet = plnt.starting_planet;

          return bp;
        });
      });

      return $.when.apply($, _.compact(pgen)).then(function () {
        rSystem.planets = Array.prototype.slice.call(arguments, 0);
        return rSystem;
      });
    };

    return { generate: generate };
  };

  return {
    // Shared Systems for Galactic War replaces the base template-loader wholesale and
    // marks its version with loadOptions - the same capability check gw_start/setup.js
    // uses to decide whether to build brackets. Where it is present it owns system
    // selection, so defer to it rather than seeding a loader it is not using.
    chooseFor: function (baseLoader, content, easier) {
      if (_.isFunction(baseLoader) && _.isFunction(baseLoader.loadOptions)) {
        return baseLoader(content, easier);
      }
      return gwoChooseStarSystemTemplates(content, easier);
    },
  };
});
