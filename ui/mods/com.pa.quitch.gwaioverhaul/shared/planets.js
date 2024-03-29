define(["main/game/galactic_war/shared/js/systems/planets"], function (
  examplePlanetList
) {
  return {
    planet1: {
      fromRandomList: examplePlanetList,
      mass: 50000,
      position: [-25000, 0],
      velocity: [0, 142],
    },
    planet2: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [450, 550],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [0, 100],
      Biomes: ["earth", "desert", "tropical", "lava", "moon", "metal"],
    },
    planet3: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [375, 425],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-15000, 0],
      Velocity: [0, 244],
      Biomes: ["earth", "desert", "tropical"],
    },
    planet4: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [350, 350],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [15000, 0],
      Velocity: [-0.00000798057, 182.574],
      Biomes: ["desert", "lava"],
    },
    planet5: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 500],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [25000, 0],
      Velocity: [-0.000006181723165354924, 141.42135620117188],
      Biomes: ["desert", "lava", "tropical", "earth"],
    },
    planet6: {
      starting_planet: true,
      mass: 5000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [0, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [28700, 0],
      Velocity: [0, -118.5163],
      Biomes: ["lava", "moon", "earth"],
    },
    planet7: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [300, 300],
      Height: [0, 10],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-15000, 0],
      Velocity: [0, 244],
      Biomes: ["lava", "moon"],
    },
    planet8: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [300, 300],
      Height: [0, 10],
      Water: [0, 0],
      Temp: [0, 0],
      MetalDensity: [10, 25],
      MetalClusters: [0, 10],
      BiomeScale: [100, 100],
      Position: [15000, 0],
      Velocity: [-0.00000798057, 182.574],
      Biomes: ["moon", "desert"],
    },
    planet9: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 550],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-15000, 0],
      Velocity: [0, 244],
      Biomes: ["earth", "desert", "tropical", "lava", "metal", "moon"],
    },
    planet10: {
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
    planet11: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [500, 600],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [0, 100],
      Biomes: ["earth", "desert", "tropical", "lava", "moon", "metal"],
    },
    planet12: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 25],
      BiomeScale: [100, 100],
      Position: [60000, 0],
      Velocity: [0, -58.1138],
      Biomes: ["lava", "moon"],
    },
    planet13: {
      starting_planet: false,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [500, 500],
      Height: [0, 5],
      Water: [1, 5],
      Temp: [0, 100],
      MetalDensity: [50, 100],
      MetalClusters: [100, 100],
      BiomeScale: [100, 100],
      Position: [0, -100000],
      Velocity: [70.7107, 0.00000309086],
      Biomes: ["metal"],
    },
    planet14: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [600, 600],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [-0.00000437114, 100],
      Biomes: ["desert", "lava"],
    },
    planet15: {
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
      Position: [30000, 0],
      Velocity: [0, 129.0994],
      Biomes: ["gas"],
    },
    planet16: {
      fromRandomList: examplePlanetList,
      mass: 10000,
      position: [35000, 0],
      velocity: [0, -94.5074],
    },
    planet17: {
      starting_planet: true,
      mass: 10000,
      Thrust: [0, 0],
      Radius: [450, 550],
      Height: [10, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [0, 100],
      Position: [25000, 0],
      Velocity: [0, 352.7061],
      Biomes: ["earth", "lava", "desert", "tropical"],
    },
    planet18: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [500, 600],
      Height: [20, 30],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-15000, 0],
      Velocity: [0, 244],
      Biomes: ["earth", "desert", "tropical"],
    },
    planet19: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [600, 700],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [75, 100],
      MetalClusters: [75, 100],
      BiomeScale: [100, 100],
      Position: [-15000, 0],
      Velocity: [0, 244],
      Biomes: ["earth", "desert", "tropical", "lava", "metal", "moon"],
    },
    planet20: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [650, 750],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [0, 100],
      Biomes: ["earth", "desert", "tropical", "lava", "moon", "metal"],
    },
    planet21: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [550, 600],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [0, 100],
      Biomes: ["earth", "desert", "tropical", "lava", "moon", "metal"],
    },
    planet22: {
      starting_planet: false,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [1500, 1500],
      Height: [0, 0],
      Water: [0, 0],
      Temp: [0, 100],
      MetalDensity: [0, 0],
      MetalClusters: [0, 0],
      BiomeScale: [100, 100],
      Position: [-25000, 0],
      Velocity: [0, -141.4213],
      Biomes: ["gas"],
    },
    planet23: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [25000, 0],
      Velocity: [0.00000618172, -141.421],
      Biomes: ["earth", "desert", "lava"],
    },
    planet24: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [12500, -21700],
      Velocity: [-122.439, -70.5296],
      Biomes: ["earth", "desert", "lava"],
    },
    planet25: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [-12500, -21700],
      Velocity: [-122.439, 70.5296],
      Biomes: ["earth", "desert", "lava"],
    },
    planet26: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [-25000, 0],
      Velocity: [-0.00000618172, 141.421],
      Biomes: ["earth", "desert", "lava"],
    },
    planet27: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [-12500, 21700],
      Velocity: [122.439, 70.5297],
      Biomes: ["earth", "desert", "lava"],
    },
    planet28: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [400, 400],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [12500, 21700],
      Velocity: [122.439, -70.5297],
      Biomes: ["earth", "desert", "lava"],
    },
    planet29: {
      starting_planet: false,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [500, 600],
      Height: [0, 1],
      Water: [0, 1],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 50],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [-0.00000437114, 100],
      Biomes: ["metal"],
    },
    planet30: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 1],
      Water: [0, 1],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [0, 0],
      BiomeScale: [100, 100],
      Position: [55000, 0],
      Velocity: [-0.000200886, 323.607],
      Biomes: ["moon", "lava"],
    },
    planet31: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 1],
      Water: [0, 1],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [0, 0],
      BiomeScale: [100, 100],
      Position: [45000, 0],
      Velocity: [-0.000181338, -123.607],
      Biomes: ["moon", "lava"],
    },
    planet32: {
      starting_planet: false,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [250, 250],
      Height: [0, 0],
      Water: [0, 50],
      Temp: [0, 100],
      MetalDensity: [100, 100],
      MetalClusters: [100, 100],
      BiomeScale: [100, 100],
      Position: [25000, 0],
      Velocity: [0.00000618172, -141.421],
      Biomes: ["moon", "lava"],
    },
    planet33: {
      starting_planet: true,
      mass: 10000,
      Thrust: [0, 0],
      Radius: [600, 600],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [25000, 5000],
      Velocity: [223.607, -141.421],
      Biomes: ["earth", "desert", "lava"],
    },
    planet34: {
      starting_planet: true,
      mass: 10000,
      Thrust: [0, 0],
      Radius: [600, 600],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [29300, -2500],
      Velocity: [-112.683, -335.237],
      Biomes: ["earth", "desert", "lava"],
    },
    planet35: {
      starting_planet: true,
      mass: 10000,
      Thrust: [0, 0],
      Radius: [600, 600],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [0, 10],
      MetalClusters: [25, 25],
      BiomeScale: [100, 100],
      Position: [20700, -2500],
      Velocity: [-112.683, 52.3943],
      Biomes: ["earth", "desert", "lava"],
    },
    planet36: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 25],
      Water: [0, 1],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 25],
      BiomeScale: [100, 100],
      Position: [0, -50000],
      Velocity: [100, 0.00000437114],
      Biomes: ["moon"],
    },
    planet37: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 25],
      Water: [0, 1],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 25],
      BiomeScale: [100, 100],
      Position: [-43300, 25000],
      Velocity: [-50.0017, -86.6029],
      Biomes: ["moon"],
    },
    planet38: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 25],
      Water: [0, 1],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 25],
      BiomeScale: [100, 100],
      Position: [43300, 25000],
      Velocity: [-50.0017, 86.6029],
      Biomes: ["moon"],
    },
    planet39: {
      starting_planet: true,
      mass: 10000,
      Thrust: [0, 0],
      Radius: [450, 550],
      Height: [10, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [0, 100],
      Position: [35000, 0],
      Velocity: [0, -94.5074],
      Biomes: ["earth", "lava", "desert", "tropical"],
    },
    planet40: {
      starting_planet: true,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [0, 0],
      Temp: [0, 0],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [0, 100],
      Position: [20000, 0],
      Velocity: [0, 287.213287],
      Biomes: ["moon", "lava"],
    },
    planet41: {
      starting_planet: false,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [500, 525],
      Height: [0, 0],
      Water: [0, 0],
      Temp: [0, 100],
      MetalDensity: [50, 100],
      MetalClusters: [50, 100],
      BiomeScale: [0, 100],
      Position: [14000, 0],
      Velocity: [0, 188.98223],
      Biomes: ["metal"],
    },
    planet42: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [800, 800],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 25],
      BiomeScale: [100, 100],
      Position: [-15000, 0],
      Velocity: [0, 244],
      Biomes: ["earth", "desert", "lava", "metal", "moon"],
    },
    planet43: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [700, 800],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [0, 100],
      Biomes: ["earth", "desert", "tropical", "lava", "moon", "metal"],
    },
    planet44: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [700, 800],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [25, 50],
      BiomeScale: [100, 100],
      Position: [0, 25000],
      Velocity: [-141.421, -0.00000618172],
      Biomes: ["earth", "desert", "lava", "moon", "metal"],
    },
    planet45: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [50000, 0],
      Velocity: [-0.00000437114, 100],
      Biomes: ["moon"],
    },
    planet46: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [35400, -35400],
      Velocity: [70.6661, 70.6661],
      Biomes: ["moon"],
    },
    planet47: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [0, -50000],
      Velocity: [100, 0.00000437114],
      Biomes: ["moon"],
    },
    planet48: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-35400, -35400],
      Velocity: [70.6661, -70.6661],
      Biomes: ["moon"],
    },
    planet49: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-50000, 0],
      Velocity: [0.00000437114, -100],
      Biomes: ["moon"],
    },
    planet50: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [-35400, 35400],
      Velocity: [-70.6661, -70.6661],
      Biomes: ["moon"],
    },
    planet51: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [0, 50000],
      Velocity: [-100, -0.00000437114],
      Biomes: ["moon"],
    },
    planet52: {
      starting_planet: false,
      mass: 5000,
      Thrust: [1, 3],
      Radius: [200, 250],
      Height: [0, 10],
      Water: [1, 2],
      Temp: [0, 100],
      MetalDensity: [10, 20],
      MetalClusters: [0, 100],
      BiomeScale: [100, 100],
      Position: [35400, 35400],
      Velocity: [-70.6661, 70.6661],
      Biomes: ["moon"],
    },
    planet53: {
      starting_planet: true,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [700, 800],
      Height: [20, 25],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [1, 100],
      MetalClusters: [25, 50],
      BiomeScale: [100, 100],
      Position: [0, -25000],
      Velocity: [141.421, 0.00000618172],
      Biomes: ["earth", "desert", "lava", "moon", "metal"],
    },
    planet54: {
      starting_planet: false,
      mass: 50000,
      Thrust: [0, 0],
      Radius: [250, 250],
      Height: [0, 0],
      Water: [0, 45],
      Temp: [0, 100],
      MetalDensity: [100, 100],
      MetalClusters: [100, 100],
      BiomeScale: [100, 100],
      Position: [25000, 0],
      Velocity: [0.00000618172, -141.421],
      Biomes: ["moon", "lava"],
    },
  };
});
