define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_inventory.js",
], function (inventory) {
  var multiply = function (units, multiplier, paths) {
    var outputArray = [];
    if (!_.isArray(paths)) {
      paths = [paths];
    }
    _.forEach(paths, function (path) {
      _.forEach(units, function (unit) {
        outputArray.push({
          file: unit,
          path: path,
          op: "multiply",
          value: multiplier,
        });
      });
    });
    return outputArray;
  };

  var legonisTech = [];
  var foundationTech = [];
  var synchronousTech = [];
  var revenantsTech = [];
  var clusterTech = [];
  var factionTechs = [
    legonisTech,
    foundationTech,
    synchronousTech,
    revenantsTech,
    clusterTech,
  ];
  var factionCommanders = [
    inventory.commanderUnits, // Legonis Machina
    inventory.commanderUnits, // Foundation
    inventory.commanderUnits, // Synchronous
    inventory.commanderUnits, // Revenants
    inventory.clusterCommanders,
  ];
  var speedPaths = [
    "navigation.move_speed",
    "navigation.brake",
    "navigation.acceleration",
    "navigation.turn_speed",
  ];

  var setupAITech0FabricationTech = function () {
    var factionUnits = [
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

  var setupAITech1AmmunitionTech = function () {
    var factionAmmo = [
      inventory.legonisAmmo,
      inventory.foundationAmmo,
      inventory.synchronousAmmo,
      inventory.revenantsAmmo,
      inventory.clusterAmmo,
    ];
    var factionWeapons = [
      inventory.legonisWeapons,
      inventory.foundationWeapons,
      inventory.synchronousWeapons,
      inventory.revenantsWeapons,
      inventory.clusterWeapons,
    ];
    var ammoPaths = ["damage", "splash_damage"];
    var weaponPaths = ["ammo_capacity", "ammo_demand", "ammo_per_shot"];
    _.forEach(factionAmmo, function (ammos, i) {
      factionTechs[i][1] = multiply(ammos, 1.25, ammoPaths);
    });
    _.forEach(factionWeapons, function (weapons, i) {
      factionTechs[i][1] = factionTechs[i][1].concat(
        multiply(weapons, 0.25, weaponPaths)
      );
    });
  };

  var setupAITech2ArmourTech = function () {
    var factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnits,
      inventory.clusterUnitsImmobile,
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

  var setupAITech3EngineTech = function () {
    var factionUnits = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNaval,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    _.forEach(factionUnits, function (units, i) {
      factionTechs[i][3] = multiply(units, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, function (commanders, i) {
      factionTechs[i][3] = factionTechs[i][3].concat(
        multiply(commanders, 2, speedPaths)
      );
    });
    foundationTech[3] = foundationTech[3].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
  };

  var setupAITech4EfficiencyTech = function () {
    var factionBuildArms = [
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

  var setupAITech6CombatTech = function () {
    var factionUnits = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNaval,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    _.forEach(factionUnits, function (units, i) {
      factionTechs[i][6] = multiply(units, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, function (commanders, i) {
      factionTechs[i][6] = factionTechs[i][6].concat(
        multiply(commanders, 3, speedPaths)
      );
    });
    foundationTech[6] = foundationTech[6].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
    // Requires setupAITech1AmmunitionTech and setupAITech2ArmourTech to have
    // already populated faction[1]/faction[2] - do not reorder the setup
    // calls below without keeping this after both.
    _.forEach(factionTechs, function (faction) {
      faction[6] = faction[6].concat(faction[1], faction[2]); // Add ammo and armour tech
    });
  };

  var setupAITech7CooldownTech = function () {
    var factionUnits = [
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
  // Tech5 was a tech that was removed, so it is intentionally missing.
  // Tech6 reads faction[1] and faction[2], so it must run after both
  // setupAITech1AmmunitionTech() and setupAITech2ArmourTech().
  setupAITech6CombatTech();
  setupAITech7CooldownTech();

  return {
    factionTechs: factionTechs,
  };
});
