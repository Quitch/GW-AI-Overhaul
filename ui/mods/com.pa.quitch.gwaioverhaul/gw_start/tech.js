define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/inventory.js",
], function (inventory) {
  const legonisTech = [];
  const foundationTech = [];
  const synchronousTech = [];
  const revenantsTech = [];
  const clusterTech = [];
  const factionsTech = [
    legonisTech,
    foundationTech,
    synchronousTech,
    revenantsTech,
    clusterTech,
  ];

  const multiply = function (units, multiplier, paths) {
    var outputArray = [];
    if (!_.isArray(paths)) {
      paths = [paths];
    }
    _.forEach(paths, function (path) {
      outputArray = outputArray.concat(
        _.map(units, function (unit) {
          return {
            file: unit,
            path: path,
            op: "multiply",
            value: multiplier,
          };
        })
      );
    });
    return outputArray;
  };

  const setupAITech0FabricationTech = function () {
    const factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnitsWithAmmo,
      inventory.clusterUnitsImmobile,
    ];
    _.forEach(factionUnits, function (units, i) {
      factionsTech[i][0] = multiply(units, 0.75, "build_metal_cost");
    });
  };
  setupAITech0FabricationTech();

  const setupAITech1AmmunitionTech = function () {
    const factionAmmo = [
      inventory.legonisAmmo,
      inventory.foundationAmmo,
      inventory.synchronousAmmo,
      inventory.revenantsAmmo,
      inventory.clusterAmmo,
    ];
    const factionWeapons = [
      inventory.legonisWeapons,
      inventory.foundationWeapons,
      inventory.synchronousWeapons,
      inventory.revenantsWeapons,
      inventory.clusterWeapons,
    ];
    const ammoPaths = ["damage", "splash_damage"];
    const weaponPaths = ["ammo_capacity", "ammo_demand", "ammo_per_shot"];
    _.forEach(factionAmmo, function (ammos, i) {
      factionsTech[i][1] = multiply(ammos, 1.25, ammoPaths);
    });
    _.forEach(factionWeapons, function (weapons, i) {
      factionsTech[i][1] = factionsTech[i][1].concat(
        multiply(weapons, 0.25, weaponPaths)
      );
    });
  };
  setupAITech1AmmunitionTech();

  const setupAITech2ArmourTech = function () {
    const factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnits,
      inventory.clusterUnitsImmobile,
    ];
    const factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      inventory.clusterCommanders,
    ];
    _.forEach(factionUnits, function (units, i) {
      factionsTech[i][2] = multiply(units, 1.5, "max_health");
    });
    _.forEach(factionCommanders, function (commanders, i) {
      factionsTech[i][2] = factionsTech[i][2].concat(
        multiply(commanders, 2, "max_health")
      );
    });
  };
  setupAITech2ArmourTech();

  const setupAITech3EngineTech = function () {
    const factionsTechNoAir = [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ];
    const factionUnitsNoAir = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNaval,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    const factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      inventory.clusterCommanders,
    ];
    const speedPaths = [
      "navigation.move_speed",
      "navigation.brake",
      "navigation.acceleration",
      "navigation.turn_speed",
    ];
    _.forEach(factionUnitsNoAir, function (factionUnits, i) {
      factionsTechNoAir[i][3] = multiply(factionUnits, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, function (factionUnits, i) {
      factionsTech[i][3] = factionsTech[i][3].concat(
        multiply(factionUnits, 2, speedPaths)
      );
    });
    foundationTech[3] = foundationTech[3].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
  };
  setupAITech3EngineTech();

  const setupAITech4EfficiencyTech = function () {
    const factionBuildArms = [
      inventory.legonisBuildArms,
      inventory.foundationBuildArms,
      inventory.synchronousBuildArms,
      inventory.revenantsBuildArms,
      inventory.clusterBuildArms,
    ];
    _.forEach(factionBuildArms, function (buildArms, i) {
      factionsTech[i][4] = multiply(
        buildArms,
        0.5,
        "construction_demand.energy"
      ).concat(multiply(buildArms, 1.5, "construction_demand.metal"));
    });
  };
  setupAITech4EfficiencyTech();

  const setupAITech6CombatTech = function () {
    const factionsTechNoAir = [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ];
    const factionUnitsNoAir = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNaval,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    const factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      inventory.clusterCommanders,
    ];
    const speedPaths = [
      "navigation.move_speed",
      "navigation.brake",
      "navigation.acceleration",
      "navigation.turn_speed",
    ];
    _.forEach(factionUnitsNoAir, function (factionUnits, i) {
      factionsTechNoAir[i][6] = multiply(factionUnits, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, function (factionUnits, i) {
      factionsTech[i][6] = factionsTech[i][6].concat(
        multiply(factionUnits, 3, speedPaths)
      );
    });
    foundationTech[6] = foundationTech[6].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
    // Add ammo and armour tech
    _.forEach(factionsTech, function (faction) {
      faction[6] = faction[6].concat(faction[1], faction[2]);
    });
  };
  setupAITech6CombatTech();

  return {
    factionTechs: [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ],
  };
});
