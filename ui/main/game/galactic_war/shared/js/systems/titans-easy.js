// GWO - adds a flat system to each group.
define(["main/game/galactic_war/shared/js/systems/planets"], function (
  examplePlanetList
) {
  return [
    {
      Players: [0, 2],
      Systems: [
        {
          Planets: [
            {
              fromRandomList: examplePlanetList,
              mass: 50000,
              Position: [-15000, 0],
              Velocity: [0, 244],
            },
          ],
        },
        // GWO - a flat system
        {
          Planets: [
            {
              starting_planet: true,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [450, 450],
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
              Width: [1800, 1900],
              Length: [1325, 1425],
            },
          ],
        },
      ],
    },
    {
      Players: [3, 100],
      Systems: [
        {
          Planets: [
            {
              fromRandomList: examplePlanetList,
              mass: 50000,
              Position: [-15000, 0],
              Velocity: [0, 244],
            },
          ],
        },
        {
          Planets: [
            {
              starting_planet: true,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [400, 600],
              Height: [20, 25],
              Water: [33, 35],
              Temp: [0, 100],
              MetalDensity: [50, 75],
              MetalClusters: [25, 49],
              BiomeScale: [100, 100],
              Position: [-15000, 0],
              Velocity: [0, 244],
              Biomes: ["earth", "desert", "tropical", "lava", "metal", "moon"],
            },
          ],
        },
        {
          Planets: [
            {
              fromRandomList: examplePlanetList,
              mass: 50000,
              Position: [-25000, 0],
              Velocity: [0, 142],
            },
            {
              starting_planet: false,
              mass: 5000,
              Thrust: [1, 2],
              Radius: [250, 300],
              Height: [0, 10],
              Water: [1, 2],
              Temp: [0, 100],
              MetalDensity: [5, 15],
              MetalClusters: [0, 24],
              BiomeScale: [100, 100],
              Position: [-22000, 0],
              Velocity: [0, 430],
              Biomes: ["lava", "moon"],
            },
          ],
        },
        // GWO - a flat system
        {
          Planets: [
            {
              starting_planet: true,
              mass: 50000,
              Thrust: [0, 0],
              Radius: [500, 500],
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
              Width: [2050, 2150],
              Length: [1450, 1550],
            },
          ],
        },
      ],
    },
  ];
});
