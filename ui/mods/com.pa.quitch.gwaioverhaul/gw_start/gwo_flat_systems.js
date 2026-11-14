// The flat systems gw_start/gwo_system_templates.js adds to the end of each
// group of a template set, by position, when the game runs with --flat-maps.
// See galaxy.md, "Flat planets".
define(function () {
  var normalSlab = function (radius, width, length) {
    return {
      Planets: [
        {
          starting_planet: true,
          mass: 50000,
          Thrust: [0, 0],
          Radius: [radius, radius],
          Height: [20, 25],
          Water: [0, 45],
          Temp: [0, 100],
          MetalDensity: [1, 100],
          MetalClusters: [0, 100],
          BiomeScale: [100, 100],
          Position: [25000, 0],
          Velocity: [-0.000006181723165354924, 141.42135620117188],
          Biomes: ["earth", "desert", "tropical", "lava", "moon"],
          Shape: "flat",
          Width: width,
          Length: length,
        },
      ],
    };
  };

  var easySlab = function (radius, width, length) {
    return {
      Planets: [
        {
          starting_planet: true,
          mass: 50000,
          Thrust: [0, 0],
          Radius: [radius, radius],
          Height: [20, 25],
          Water: [33, 35],
          Temp: [0, 100],
          MetalDensity: [50, 75],
          MetalClusters: [25, 49],
          BiomeScale: [100, 100],
          Position: [-15000, 0],
          Velocity: [0, 244],
          Biomes: ["earth", "desert", "tropical", "lava", "moon"],
          Shape: "flat",
          Width: width,
          Length: length,
        },
      ],
    };
  };

  return {
    // GWO's titans-normal.js groups: [0,3], [4,6], [7,10], [11,100].
    titansNormal: [
      normalSlab(400, [1600, 1700], [1175, 1275]),
      normalSlab(475, [1900, 2000], [1400, 1500]),
      normalSlab(650, [2650, 2750], [1900, 2000]),
      normalSlab(800, [3250, 3400], [2350, 2450]),
    ],
    // Stock titans-easy.js groups: [0,2], [3,100].
    titansEasy: [
      easySlab(450, [1800, 1900], [1325, 1425]),
      easySlab(500, [2050, 2150], [1450, 1550]),
    ],
  };
});
