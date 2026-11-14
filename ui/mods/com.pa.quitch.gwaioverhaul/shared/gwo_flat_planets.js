// Flat (slab) planets, which a server takes only when launched with
// --flat-maps. See galaxy.md, "Flat planets".
define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_biomes.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/gwo_promise.js",
], function (gwoBiomes, gwoPromise) {
  var FLAG_TIMEOUT_MS = 5000;
  // Where server-script/sim_utils.js clamps a slab's sides, and its default.
  var MIN_SIDE = 200;
  var MAX_SIDE = 20000;
  var DEFAULT_RADIUS = 700;
  var SLAB_KEYS = ["shape", "width", "length", "flatSymmetry"];
  // In slab coordinates, so meaningless on the sphere that replaces it.
  var SLAB_PLANET_KEYS = [
    "metal_spots",
    "landing_zones",
    "planetCSG",
    "source",
  ];
  var DEFAULT_METAL = 50;

  var isFlat = function (generator) {
    return !!generator && generator.shape === "flat";
  };

  // What gw_start/gwo_system_templates.js makes a slab.
  var templateIsFlat = function (planet) {
    return (
      !!planet &&
      planet.Shape === "flat" &&
      _.isArray(planet.Width) &&
      _.isArray(planet.Length)
    );
  };

  var planetIsFlat = function (planet) {
    return templateIsFlat(planet) || isFlat(gwoBiomes.generatorOf(planet));
  };

  var systemHasFlat = function (system) {
    return _.some(
      (system && (system.planets || system.Planets)) || [],
      planetIsFlat
    );
  };

  var side = function (value, radius) {
    if (typeof value === "number") {
      return Math.min(Math.max(value, MIN_SIDE), MAX_SIDE);
    }
    return 2 * (radius || DEFAULT_RADIUS);
  };

  var footprint = function (generator) {
    return {
      width: side(generator.width, generator.radius),
      length: side(generator.length, generator.radius),
    };
  };

  var equivalentRadius = function (generator) {
    var sides = footprint(generator);
    return Math.sqrt((sides.width * sides.length) / (4 * Math.PI));
  };

  var surfaceArea = function (generator) {
    if (isFlat(generator)) {
      var sides = footprint(generator);
      return sides.width * sides.length;
    }
    return 4 * Math.PI * Math.pow(generator.radius, 2);
  };

  var toSphere = function (planet) {
    var generator = gwoBiomes.generatorOf(planet);
    if (!isFlat(generator)) {
      return planet;
    }
    var hadMetalSpots = _.has(planet, "metal_spots");
    generator.radius = Math.round(equivalentRadius(generator));
    _.forEach(SLAB_KEYS, function (key) {
      delete generator[key];
    });
    _.forEach(SLAB_PLANET_KEYS, function (key) {
      delete planet[key];
    });
    // Hand-placed metal goes with the slab, and a generator set to none
    // relied on it.
    if (hadMetalSpots) {
      _.forEach(["metalClusters", "metalDensity"], function (key) {
        if (!(generator[key] > 0)) {
          generator[key] = DEFAULT_METAL;
        }
      });
    }
    return planet;
  };

  var flagRead;
  var enabled = function () {
    if (!_.isFunction(_.get(api, "game.flatMapsEnabled"))) {
      return $.Deferred().resolve(false).promise();
    }
    if (!flagRead) {
      flagRead = gwoPromise
        .settled(
          gwoPromise.within(
            new Promise(function (resolve, reject) {
              api.game.flatMapsEnabled().then(resolve, reject);
            }),
            FLAG_TIMEOUT_MS,
            "flat maps flag"
          ),
          function (error) {
            flagRead = undefined;
            console.error(
              "Galactic War Overhaul (GWO): flat maps flag not read, so flat planets are off: " +
                ((error && error.message) || error)
            );
            return false;
          }
        )
        .then(function (value) {
          return value === true;
        });
    }
    return flagRead;
  };

  return {
    isFlat: isFlat,
    templateIsFlat: templateIsFlat,
    planetIsFlat: planetIsFlat,
    systemHasFlat: systemHasFlat,
    footprint: footprint,
    equivalentRadius: equivalentRadius,
    surfaceArea: surfaceArea,
    toSphere: toSphere,
    enabled: enabled,
  };
});
