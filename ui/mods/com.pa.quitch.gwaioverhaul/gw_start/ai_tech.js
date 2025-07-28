define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_inventory.js",
], function (inventory) {
  const legonisTech = [];
  const foundationTech = [];
  const synchronousTech = [];
  const revenantsTech = [];
  const clusterTech = [];
  const factionTechs = [
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
      factionTechs[i][0] = multiply(units, 0.75, "build_metal_cost");
    });
  };

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
      factionTechs[i][1] = multiply(ammos, 1.25, ammoPaths);
    });
    _.forEach(factionWeapons, function (weapons, i) {
      factionTechs[i][1] = factionTechs[i][1].concat(
        multiply(weapons, 0.25, weaponPaths)
      );
    });
  };

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
      factionTechs[i][2] = multiply(units, 1.5, "max_health");
    });
    _.forEach(factionCommanders, function (commanders, i) {
      factionTechs[i][2] = factionTechs[i][2].concat(
        multiply(commanders, 2, "max_health")
      );
    });
  };

  const setupAITech3EngineTech = function () {
    const factionUnits = [
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
    _.forEach(factionUnits, function (factionUnits, i) {
      factionTechs[i][3] = multiply(factionUnits, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, function (factionUnits, i) {
      factionTechs[i][3] = factionTechs[i][3].concat(
        multiply(factionUnits, 2, speedPaths)
      );
    });
    foundationTech[3] = foundationTech[3].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
  };

  const setupAITech4EfficiencyTech = function () {
    const factionBuildArms = [
      inventory.legonisBuildArms,
      inventory.foundationBuildArms,
      inventory.synchronousBuildArms,
      inventory.revenantsBuildArms,
      inventory.clusterBuildArms,
    ];
    _.forEach(factionBuildArms, function (buildArms, i) {
      factionTechs[i][4] = multiply(
        buildArms,
        0.5,
        "construction_demand.energy"
      ).concat(multiply(buildArms, 1.5, "construction_demand.metal"));
    });
  };

  const setupAITech6CombatTech = function () {
    const factionUnits = [
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
    _.forEach(factionUnits, function (factionUnits, i) {
      factionTechs[i][6] = multiply(factionUnits, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, function (factionUnits, i) {
      factionTechs[i][6] = factionTechs[i][6].concat(
        multiply(factionUnits, 3, speedPaths)
      );
    });
    foundationTech[6] = foundationTech[6].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
    _.forEach(factionTechs, function (faction) {
      faction[6] = faction[6].concat(faction[1], faction[2]); // Add ammo and armour tech
    });
  };

  const setupAITech7CooldownTech = function () {
    const factionUnits = [
      inventory.legonisUnitsImmobile,
      inventory.foundationUnitsImmobile,
      inventory.synchronousUnitsImmobile,
      inventory.revenantsUnitsFactories,
      inventory.clusterUnitsFactories,
    ];
    _.forEach(factionUnits, function (units, i) {
      factionTechs[i][7] = multiply(units, 0.5, "factory_cooldown_time");
    });
  };

  setupAITech0FabricationTech();
  setupAITech1AmmunitionTech();
  setupAITech2ArmourTech();
  setupAITech3EngineTech();
  setupAITech4EfficiencyTech();
  setupAITech6CombatTech();
  setupAITech7CooldownTech();

  return {
    factionTechs: factionTechs,
  };
});
