// GWO - a seeded copy of the base game's systems/template-loader.js. Keep it
// line-for-line close to stock, its own comments and dead branches included, or
// the diff after a PA patch stops being readable. Every change is marked "GWO -".
//
// A copy, not a shadow: Shared Systems for Galactic War claims that same path and
// a path has one owner. chooseFor() at the bottom picks between the two.
define([
  "main/game/galactic_war/shared/js/systems/pa-easy",
  "main/game/galactic_war/shared/js/systems/pa-normal",
  "main/game/galactic_war/shared/js/systems/titans-easy",
  "main/game/galactic_war/shared/js/systems/titans-normal",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_rng.js",
], function (pa_easy, pa_normal, titans_easy, titans_normal, gwoRng) {
  var chooseStarSystemTemplates = function (content, easier) {
    var activeTemplates;

    if (content === "PAExpansion1") {
      activeTemplates = easier ? titans_easy : titans_normal;
    } else {
      activeTemplates = easier ? pa_easy : pa_normal;
    }

    var planet_template = {
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

    var generate = function (config) {
      // GWO - was new Math.seedrandom: same [0, 1) callable, plus pick/stream.
      var rng = gwoRng.create(
        config.seed !== undefined ? config.seed : Math.random()
      );
      var getRandomInt = function (min, max) {
        return Math.floor(rng() * (max - min + 1)) + min;
      };

      var rSystem = {
        name: config.name || "PA-" + getRandomInt(100, 30000),
        description: "",
        isRandomlyGenerated: true,
      };

      var cSys = _.cloneDeep(config.template);
      if (!cSys) {
        // Choose a system from the templates
        var starSystemTempl = _.find(activeTemplates, function (sst) {
          return (
            sst.Players[0] <= config.players && config.players <= sst.Players[1]
          );
        });
        if (!starSystemTempl) {
          // Fall back to the last template
          starSystemTempl = _.last(activeTemplates);
          if (!starSystemTempl) return $.when(null);
        }

        // we have found a star system group for this number of players. Choose a random system template
        var idx = getRandomInt(0, starSystemTempl.Systems.length - 1);
        cSys = starSystemTempl.Systems[idx];

        rSystem.name = rng.pick(classicSystemNames); // GWO - was _.sample
        rSystem.players = starSystemTempl.Players;
      }

      var usedIndexContainers = [];

      // explicit planets always need a generator

      // build the planets based on the random numbers in the system template.
      // or - use an explicitly defined planet that is not randomized
      // and/or - use a randomly selected planet as a template

      var pgen = _.map(cSys.Planets, function (plnt, planetIndex) {
        // GWO - stock names this parameter `index`, and the fromRandomList branch below
        // reassigns it via `var index = 0` - var is function-scoped, so that is not a new
        // binding. Both are kept: `index` still feeds bp.generator.index, planetIndex
        // holds the position in cSys.Planets so each planet can key its own stream.
        var index = planetIndex;
        // GWO - taken synchronously, because the draws at the end of this function run
        // after a $.when and so in resolution order, not in cSys.Planets order.
        var planetRng = rng.stream("planet", planetIndex);
        // GWO - hoisted; stock declares var nameGet twice below, in sibling branches.
        var nameGet;

        if (plnt.fromRandomList) {
          // GWO - was !!plnt.fromRandomList
          // example planet:
          // {
          //     isExplicit: true,
          //     plnt.fromRandomList: [templatePlanetsOne, templatePlanetsTwo]
          // }
          //
          // This planet will be a random planet from either list where isExplicit is true

          // example planet:
          // {
          //     isExplicit: false,
          //     plnt.fromRandomList: [templatePlanetsOne, templatePlanetsTwo],
          //     BiomeScale: [100, 100]
          // }
          //
          // This planet will be a random planet from either list where isExplicit is false/undefinied
          // AND, BiomeScale will be replaced by the value provided here
          // if isExplicit were not set to false here, BiomeScale may or may not actually be used
          // because an isExplicit planet could be selected instead

          var planetList = [];

          // if we're provided with an array of arrays, merge them into a single list
          if (_.isArray(plnt.fromRandomList)) {
            // there doesn't seem to be an equivalent lodash function?
            for (var i = 0; i < plnt.fromPlanetList.length; i++) {
              for (var j = 0; j < plnt.fromPlanetList[i].planets; j++) {
                planetList.push(plnt.fromPlanetList[i].planets[j]);
              }
            }
          } else {
            planetList = plnt.fromRandomList.planets;
          }

          // get the key/value pair representing the indexes that have already been used
          // this way, we avoid duplicates selected from the list of planet templates
          // the key is the fromRandomList because it is keyed by instance while planetList
          // is new every time.
          var usedIndexContainer = _.find(
            usedIndexContainers,
            function (container) {
              return container.planets === plnt.fromRandomList;
            }
          );

          // if there isn't a container already, create it
          if (!usedIndexContainer) {
            usedIndexContainer = {
              planets: plnt.fromRandomList,
              usedIndexes: [],
            };

            usedIndexContainers.push(usedIndexContainer);
          }

          // get planet templates that match the isExplicit value and haven't been used yet
          // if the requesting planet doesn't actually have isExplicit value true or false,
          // we don't care.
          var viablePlanets = _.where(planetList, function (planet) {
            return (
              (typeof plnt.isExplicit === "undefined" ||
                !!planet.isExplicit === plnt.isExplicit) &&
              usedIndexContainer.usedIndexes.indexOf(
                planetList.indexOf(planet)
              ) === -1
            );
          });

          // pick a random planet that hasn't been used
          index = 0; // GWO - was var index, redeclaring the parameter above
          if (viablePlanets.length > 1) {
            var attemptedIndexes = [];
            do {
              index = getRandomInt(0, viablePlanets.length - 1);
              if (attemptedIndexes.indexOf(index) === -1)
                attemptedIndexes.push(index);
            } while (
              usedIndexContainer.usedIndexes.indexOf(index) !== -1 &&
              attemptedIndexes.length < viablePlanets.length
            );
          } else {
            // Stop caring about if it is unused
            // GWO - was var viablePlanets, redeclaring the one above
            viablePlanets = _.where(planetList, function (planet) {
              return (
                typeof plnt.isExplicit === "undefined" ||
                !!planet.isExplicit === plnt.isExplicit
              );
            });

            if (viablePlanets.length === 0) {
              // There's no way we can fulfill this request because
              // there simply weren't any isExplicit matching planet templates
              return null;
            }

            // Just pick a random one
            index = getRandomInt(0, viablePlanets.length - 1);
          }

          // Use the current index. If we had to give up on finding an unused one, just use
          // the last random index.
          var planet = viablePlanets[index];
          usedIndexContainer.usedIndexes.push(planetList.indexOf(planet));

          // Extend the selected planet template with the requesting planet
          // So we can override properties on the template. (Not deep.)
          var sourceList = plnt.fromRandomList;
          plnt.fromRandomList = null; // Don't clone this
          var extendedPlanet = _.cloneDeep(planet);
          _.assign(extendedPlanet, _.cloneDeep(plnt));
          plnt.fromRandomList = sourceList;

          plnt = extendedPlanet;
        }

        if (plnt.isExplicit) {
          nameGet = $.Deferred(); // GWO - was var nameGet

          if (plnt.name) {
            nameGet.resolve(plnt);
          } else {
            api.game.getRandomPlanetName().then(function (name) {
              plnt.name = name;
              nameGet.resolve(plnt);
            });
          }

          return nameGet.promise();
        }

        var bp = _.cloneDeep(planet_template);
        bp.generator.seed = planetRng.int(0, 32767); // GWO
        bp.generator.biome = rng.pick(plnt.Biomes); // GWO - was _.sample

        var biomeGet = $.get(
          "coui://pa/terrain/" + bp.generator.biome + ".json"
        ).then(function (data) {
          return parse(data);
        });
        nameGet = plnt.name; // GWO - was var nameGet
        if (!nameGet) {
          nameGet = $.Deferred();
          api.game.getRandomPlanetName().then(function (name) {
            nameGet.resolve(name);
          });
        }
        return $.when(biomeGet, nameGet).then(function (biomeInfo, name) {
          var radius_range = biomeInfo.radius_range;
          if (!_.isArray(radius_range)) radius_range = [100, 1300];

          // GWO - planetRng, not the shared getRandomInt; threaded rather than
          // pre-drawn so radius can still read the fetched radius_range.
          bp.generator.radius = planetRng.int(
            Math.max(plnt.Radius[0], radius_range[0]),
            Math.min(plnt.Radius[1], radius_range[1])
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
          bp.generator.index = index;
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

      // clean out the null responses from the array of generation promises
      var fulfillableGenPromises = [];
      for (var i = 0; i < pgen.length; i++) {
        if (pgen[i]) fulfillableGenPromises.push(pgen[i]);
      }

      return $.when.apply($, fulfillableGenPromises).then(function () {
        rSystem.planets = Array.prototype.slice.call(arguments, 0);
        return rSystem;
      });
    };

    return {
      generate: generate,
    };
  };

  return {
    // GWO - Shared Systems for Galactic War replaces the base template-loader wholesale
    // and marks its version with loadOptions, the same capability check setup.js uses.
    // Where it is present it owns system selection, so defer to it.
    chooseFor: function (baseLoader, content, easier) {
      if (_.isFunction(baseLoader) && _.isFunction(baseLoader.loadOptions)) {
        return baseLoader(content, easier);
      }
      return chooseStarSystemTemplates(content, easier);
    },
  };
});
