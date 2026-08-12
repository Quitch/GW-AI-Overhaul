define(["coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_inventory.js"], (
  inventory
) => {
  const AMMUNITION_TECH = 1;
  const ARMOUR_TECH = 2;
  const COMBAT_TECH = 6;
  const multiply = (units, multiplier, paths) => {
    const outputArray = [];
    if (!_.isArray(paths)) {
      paths = [paths];
    }
    _.forEach(paths, (path) => {
      _.forEach(units, (unit) => {
        outputArray.push({
          file: unit,
          path,
          op: "multiply",
          value: multiplier,
        });
      });
    });
    return outputArray;
  };

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
  const factionCommanders = [
    inventory.commanderUnits, // Legonis Machina
    inventory.commanderUnits, // Foundation
    inventory.commanderUnits, // Synchronous
    inventory.commanderUnits, // Revenants
    inventory.clusterCommanderUnits,
  ];
  const speedPaths = [
    "navigation.move_speed",
    "navigation.brake",
    "navigation.acceleration",
    "navigation.turn_speed",
  ];

  const setupAITech0FabricationTech = () => {
    const factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnitsWithAmmo,
      inventory.clusterUnitsImmobile,
    ];
    _.forEach(factionUnits, (units, i) => {
      factionTechs[i][0] = multiply(units, 0.75, "build_metal_cost");
    });
  };

  const setupAITech1AmmunitionTech = () => {
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
    _.forEach(factionAmmo, (ammos, i) => {
      factionTechs[i][1] = multiply(ammos, 1.25, ammoPaths);
    });
    _.forEach(factionWeapons, (weapons, i) => {
      factionTechs[i][1] = factionTechs[i][1].concat(
        multiply(weapons, 0.25, weaponPaths)
      );
    });
  };

  const setupAITech2ArmourTech = () => {
    const factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnits,
      inventory.clusterUnitsImmobile,
    ];
    _.forEach(factionUnits, (units, i) => {
      factionTechs[i][2] = multiply(units, 1.5, "max_health");
    });
    _.forEach(factionCommanders, (commanders, i) => {
      factionTechs[i][2] = factionTechs[i][2].concat(
        multiply(commanders, 2, "max_health")
      );
    });
  };

  const setupAITech3EngineTech = () => {
    const factionUnits = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNaval,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    _.forEach(factionUnits, (units, i) => {
      factionTechs[i][3] = multiply(units, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, (commanders, i) => {
      factionTechs[i][3] = factionTechs[i][3].concat(
        multiply(commanders, 2, speedPaths)
      );
    });
    foundationTech[3] = foundationTech[3].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
  };

  const setupAITech4EfficiencyTech = () => {
    const factionBuildArms = [
      inventory.legonisBuildArms,
      inventory.foundationBuildArms,
      inventory.synchronousBuildArms,
      inventory.revenantsBuildArms,
      inventory.clusterBuildArms,
    ];
    _.forEach(factionBuildArms, (buildArms, i) => {
      factionTechs[i][4] = multiply(
        buildArms,
        0.5,
        "construction_demand.energy"
      ).concat(multiply(buildArms, 1.5, "construction_demand.metal"));
    });
  };

  const setupAITech6CombatTech = () => {
    const factionUnits = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNaval,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    _.forEach(factionUnits, (units, i) => {
      factionTechs[i][6] = multiply(units, 1.5, speedPaths);
    });
    _.forEach(factionCommanders, (commanders, i) => {
      factionTechs[i][6] = factionTechs[i][6].concat(
        multiply(commanders, 3, speedPaths)
      );
    });
    foundationTech[6] = foundationTech[6].concat(
      multiply(inventory.foundationUnitsMobileAir, 1.25, speedPaths)
    );
    _.forEach(factionTechs, (faction) => {
      faction[COMBAT_TECH] = faction[COMBAT_TECH].concat(
        faction[AMMUNITION_TECH],
        faction[ARMOUR_TECH]
      );
    });
  };

  const setupAITech7CooldownTech = () => {
    const factionUnits = [
      inventory.legonisUnitsImmobile,
      inventory.foundationUnitsImmobile,
      inventory.synchronousUnitsImmobile,
      inventory.revenantsUnitsFactories,
      inventory.clusterUnitsFactories,
    ];
    _.forEach(factionUnits, (units, i) => {
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
    factionTechs,
  };
});
