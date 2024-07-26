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

  const setupAITech0FabricationTech = function () {
    const factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnitsWithAmmo,
      inventory.clusterUnitsNotMobile,
    ];
    _.forEach(factionUnits, function (faction, i) {
      factionsTech[i][0] = _.map(faction, function (unit) {
        return {
          file: unit,
          path: "build_metal_cost",
          op: "multiply",
          value: "0.75",
        };
      });
    });
  };
  setupAITech0FabricationTech();

  const setupAmmo = function () {
    const factionAmmo = [
      inventory.legonisAmmo,
      inventory.foundationAmmo,
      inventory.synchronousAmmo,
      inventory.revenantsAmmo,
      inventory.clusterAmmo,
    ];
    _.forEach(factionAmmo, function (faction, i) {
      factionsTech[i][1] = _.flatten(
        _.map(faction, function (ammo) {
          return [
            {
              file: ammo,
              path: "damage",
              op: "multiply",
              value: 1.25,
            },
            {
              file: ammo,
              path: "splash_damage",
              op: "multiply",
              value: 1.25,
            },
          ];
        })
      );
    });
  };

  const setupEnergyWeapons = function () {
    const factionWeapons = [
      inventory.legonisWeapons,
      inventory.foundationWeapons,
      inventory.synchronousWeapons,
      inventory.revenantsWeapons,
      inventory.clusterWeapons,
    ];
    _.forEach(factionWeapons, function (faction, i) {
      factionsTech[i][1] = factionsTech[i][1].concat(
        _.flatten(
          _.map(faction, function (weapon) {
            return [
              {
                file: weapon,
                path: "ammo_capacity",
                op: "multiply",
                value: 0.25,
              },
              {
                file: weapon,
                path: "ammo_demand",
                op: "multiply",
                value: 0.25,
              },
              {
                file: weapon,
                path: "ammo_per_shot",
                op: "multiply",
                value: 0.25,
              },
            ];
          })
        )
      );
    });
  };

  const setupAITech1AmmunitionTech = function () {
    setupAmmo();
    setupEnergyWeapons();
  };
  setupAITech1AmmunitionTech();

  const healthBoost = function (units, value) {
    return _.map(units, function (unit) {
      return {
        file: unit,
        path: "max_health",
        op: "multiply",
        value: value,
      };
    });
  };

  const setupUnitArmour = function () {
    const factionUnits = [
      inventory.legonisUnits,
      inventory.foundationUnits,
      inventory.synchronousUnits,
      inventory.revenantsUnits,
      inventory.clusterUnitsNotMobile,
    ];
    _.forEach(factionUnits, function (units, i) {
      factionsTech[i][2] = healthBoost(units, 1.5);
    });
  };

  const setupCommanderArmour = function () {
    const factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      inventory.clusterCommanders,
    ];
    _.forEach(factionCommanders, function (commanders, i) {
      factionsTech[i][2] = factionsTech[i][2].concat(
        healthBoost(commanders, 2)
      );
    });
  };

  const setupAITech2ArmourTech = function () {
    setupUnitArmour();
    setupCommanderArmour();
  };
  setupAITech2ArmourTech();

  const speedBoost = function (units, value) {
    return _.flatten(
      _.map(units, function (unit) {
        return [
          {
            file: unit,
            path: "navigation.move_speed",
            op: "multiply",
            value: value,
          },
          {
            file: unit,
            path: "navigation.brake",
            op: "multiply",
            value: value,
          },
          {
            file: unit,
            path: "navigation.acceleration",
            op: "multiply",
            value: value,
          },
          {
            file: unit,
            path: "navigation.turn_speed",
            op: "multiply",
            value: value,
          },
        ];
      })
    );
  };

  const setupAirEngineTech = function () {
    foundationTech[3] = speedBoost(inventory.foundationUnitsMobileAir, 1.25);
  };

  const setupNotAirEngineTech = function () {
    const factionsTechNoAir = [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ];
    const factionUnitsNoAir = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNotAir,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    _.forEach(factionUnitsNoAir, function (factionUnits, i) {
      if (_.isUndefined(factionsTechNoAir[i][3])) {
        factionsTechNoAir[i][3] = [];
      }
      factionsTechNoAir[i][3] = factionsTechNoAir[i][3].concat(
        speedBoost(factionUnits, 1.5)
      );
    });
  };

  const setupCommanderEngineTech = function () {
    const factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      inventory.clusterCommanders,
    ];
    _.forEach(factionCommanders, function (factionUnits, i) {
      factionsTech[i][3] = factionsTech[i][3].concat(
        speedBoost(factionUnits, 2)
      );
    });
  };

  const setupAITech3EngineTech = function () {
    setupAirEngineTech();
    setupNotAirEngineTech();
    setupCommanderEngineTech();
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

    _.forEach(factionBuildArms, function (faction, i) {
      factionsTech[i][4] = _.flatten(
        _.map(faction, function (buildArm) {
          return [
            {
              file: buildArm,
              path: "construction_demand.energy",
              op: "multiply",
              value: 0.5,
            },
            {
              file: buildArm,
              path: "construction_demand.metal",
              op: "multiply",
              value: 1.5,
            },
          ];
        })
      );
    });
  };
  setupAITech4EfficiencyTech();

  // we redo the speed tech because Combat Commander Tech uses different values
  const setupAirEngineCombatTech = function () {
    foundationTech[6] = speedBoost(inventory.foundationUnitsMobileAir, 1.25);
  };

  // we redo the speed tech because Combat Commander Tech uses different values
  const setupNotAirEngineCombatTech = function () {
    const factionsTechNoAir = [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ];
    const factionUnitsNoAir = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNotAir,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      inventory.clusterUnitsMobile,
    ];
    _.forEach(factionUnitsNoAir, function (factionUnits, i) {
      if (_.isUndefined(factionsTechNoAir[i][6])) {
        factionsTechNoAir[i][6] = [];
      }
      factionsTechNoAir[i][6] = factionsTechNoAir[i][6].concat(
        speedBoost(factionUnits, 1.5)
      );
    });
  };

  const setupCommanderEngineCombatTech = function () {
    const factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      inventory.clusterCommanders,
    ];
    _.forEach(factionCommanders, function (factionUnits, i) {
      factionsTech[i][6] = factionsTech[i][6].concat(
        speedBoost(factionUnits, 3)
      );
    });
  };

  const setupAmmunitionAndArmourCombatTech = function () {
    _.forEach(factionsTech, function (faction) {
      faction[6] = faction[6].concat(faction[1], faction[2]);
    });
  };

  const setupAITech6CombatTech = function () {
    setupAirEngineCombatTech();
    setupNotAirEngineCombatTech();
    setupCommanderEngineCombatTech();
    setupAmmunitionAndArmourCombatTech();
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
