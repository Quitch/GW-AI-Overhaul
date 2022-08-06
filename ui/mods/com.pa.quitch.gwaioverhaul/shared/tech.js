define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/inventory.js",
], function (inventory) {
  var legonisTech = [];
  var foundationTech = [];
  var synchronousTech = [];
  var revenantsTech = [];
  var clusterTech = [];
  var factionsTech = [
    legonisTech,
    foundationTech,
    synchronousTech,
    revenantsTech,
    clusterTech,
  ];

  var setupAITech0FabricationTech = function () {
    var legonisUnits = inventory.legonisUnitsMobile.concat(
      inventory.legonisUnitsNotMobile
    );
    var foundationUnits = inventory.foundationUnitsMobileAir.concat(
      inventory.foundationUnitsMobileNotAir,
      inventory.foundationUnitsNotMobile
    );
    var synchronousUnits = inventory.synchronousUnitsMobile.concat(
      inventory.synchronousUnitsNotMobile
    );
    var revenantsUnits = inventory.revenantsUnitsMobile.concat(
      inventory.revenantsUnitsNotMobile
    );
    var factionUnits = [
      legonisUnits,
      foundationUnits,
      synchronousUnits,
      revenantsUnits,
      inventory.clusterUnits,
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

  var setupAmmo = function () {
    var legonisAmmo = inventory.legonisAmmo.concat(inventory.commanderAmmo);
    var foundationAmmo = inventory.foundationAmmo.concat(
      inventory.commanderAmmo
    );
    var synchronousAmmo = inventory.synchronousAmmo.concat(
      inventory.commanderAmmo
    );
    var revenantsAmmo = inventory.revenantsAmmo.concat(inventory.commanderAmmo);
    var clusterAmmo = inventory.clusterAmmo.concat(
      inventory.commanderAmmo,
      inventory.clusterCommanderAmmo
    );
    var factionAmmo = [
      legonisAmmo,
      foundationAmmo,
      synchronousAmmo,
      revenantsAmmo,
      clusterAmmo,
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

  var setupEnergyWeapons = function () {
    var legonisWeapons = inventory.legonisWeapons.concat(
      inventory.commanderWeapons
    );
    var foundationWeapons = inventory.foundationWeapons.concat(
      inventory.commanderWeapons
    );
    var synchronousWeapons = inventory.synchronousWeapons.concat(
      inventory.commanderWeapons
    );
    var revenantsWeapons = inventory.revenantsWeapons.concat(
      inventory.commanderWeapons
    );
    var clusterWeapons = inventory.clusterWeapons.concat(
      inventory.commanderWeapons
    );
    var factionWeapons = [
      legonisWeapons,
      foundationWeapons,
      synchronousWeapons,
      revenantsWeapons,
      clusterWeapons,
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

  var setupAITech1AmmunitionTech = function () {
    setupAmmo();
    setupEnergyWeapons();
  };
  setupAITech1AmmunitionTech();

  var setupUnitArmour = function () {
    var legonisUnits = inventory.legonisUnitsMobile.concat(
      inventory.legonisUnitsNotMobile
    );
    var foundationUnits = inventory.foundationUnitsMobileAir.concat(
      inventory.foundationUnitsMobileNotAir,
      inventory.foundationUnitsNotMobile
    );
    var synchronousUnits = inventory.synchronousUnitsMobile.concat(
      inventory.synchronousUnitsNotMobile
    );
    var revenantsUnits = inventory.revenantsUnitsMobile.concat(
      inventory.revenantsUnitsNotMobile
    );
    var factionUnits = [
      legonisUnits,
      foundationUnits,
      synchronousUnits,
      revenantsUnits,
      inventory.clusterUnits,
    ];
    _.forEach(factionUnits, function (faction, i) {
      factionsTech[i][2] = _.map(faction, function (unit) {
        return {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 1.5,
        };
      });
    });
  };

  var setupCommanderArmour = function () {
    var clusterCommanders = inventory.commanderUnits.concat(
      inventory.clusterCommanders
    );
    var factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      clusterCommanders,
    ];
    _.forEach(factionCommanders, function (faction, i) {
      factionsTech[i][2] = factionsTech[i][2].concat(
        _.map(faction, function (unit) {
          return {
            file: unit,
            path: "max_health",
            op: "multiply",
            value: 2,
          };
        })
      );
    });
  };

  var setupAITech2ArmourTech = function () {
    setupUnitArmour();
    setupCommanderArmour();
  };
  setupAITech2ArmourTech();

  var airSpeedBoost = function (unit) {
    return [
      {
        file: unit,
        path: "navigation.move_speed",
        op: "multiply",
        value: 1.25,
      },
      {
        file: unit,
        path: "navigation.brake",
        op: "multiply",
        value: 1.25,
      },
      {
        file: unit,
        path: "navigation.acceleration",
        op: "multiply",
        value: 1.25,
      },
      {
        file: unit,
        path: "navigation.turn_speed",
        op: "multiply",
        value: 1.25,
      },
    ];
  };

  var speedBoost = function (unit) {
    return [
      {
        file: unit,
        path: "navigation.move_speed",
        op: "multiply",
        value: 1.5,
      },
      {
        file: unit,
        path: "navigation.brake",
        op: "multiply",
        value: 1.5,
      },
      {
        file: unit,
        path: "navigation.acceleration",
        op: "multiply",
        value: 1.5,
      },
      {
        file: unit,
        path: "navigation.turn_speed",
        op: "multiply",
        value: 1.5,
      },
    ];
  };

  var setupAirEngineTech = function () {
    foundationTech[3] = _.flatten(
      _.map(inventory.foundationUnitsMobileAir, function (unit) {
        return airSpeedBoost(unit);
      })
    );
  };

  var setupNotAirEngineTech = function () {
    var factionsTechNoAir = [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ];
    var clusterUnitsNotStructure = inventory.commanderUnits.concat(
      inventory.clusterCommanders
    );
    var factionUnitsNoAir = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNotAir,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      clusterUnitsNotStructure,
    ];
    _.forEach(factionUnitsNoAir, function (faction, i) {
      if (_.isUndefined(factionsTechNoAir[i][3])) {
        factionsTechNoAir[i][3] = [];
      }
      factionsTechNoAir[i][3] = factionsTechNoAir[i][3].concat(
        _.flatten(
          _.map(faction, function (unit) {
            return speedBoost(unit);
          })
        )
      );
    });
  };

  var setupCommanderEngineTech = function () {
    var clusterCommanders = inventory.commanderUnits.concat(
      inventory.clusterCommanders
    );
    var factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      clusterCommanders,
    ];
    _.forEach(factionCommanders, function (faction, i) {
      factionsTech[i][3] = factionsTech[i][3].concat(
        _.flatten(
          _.map(faction, function (unit) {
            return [
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 2,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 2,
              },
            ];
          })
        )
      );
    });
  };

  var setupAITech3EngineTech = function () {
    setupAirEngineTech();
    setupNotAirEngineTech();
    setupCommanderEngineTech();
  };
  setupAITech3EngineTech();

  var setupAITech4EfficiencyTech = function () {
    var legonisBuildArms = inventory.legonisBuildArms.concat(
      inventory.commanderBuildArms
    );
    var foundationBuildArms = inventory.foundationBuildArms.concat(
      inventory.commanderBuildArms
    );
    var synchronousBuildArms = inventory.synchronousBuildArms.concat(
      inventory.commanderBuildArms
    );
    var revenantsBuildArms = inventory.revenantsBuildArms.concat(
      inventory.commanderBuildArms
    );
    var clusterBuildArms = inventory.clusterBuildArms.concat(
      inventory.commanderBuildArms
    );
    var factionBuildArms = [
      legonisBuildArms,
      foundationBuildArms,
      synchronousBuildArms,
      revenantsBuildArms,
      clusterBuildArms,
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
  var setupAirEngineCombatTech = function () {
    foundationTech[6] = _.flatten(
      _.map(inventory.foundationUnitsMobileAir, function (unit) {
        return airSpeedBoost(unit);
      })
    );
  };

  // we redo the speed tech because Combat Commander Tech uses different values
  var setupNotAirEngineCombatTech = function () {
    var factionsTechNoAir = [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ];
    var clusterUnitsNotStructure = inventory.commanderUnits.concat(
      inventory.clusterCommanders
    );
    var factionUnitsNoAir = [
      inventory.legonisUnitsMobile,
      inventory.foundationUnitsMobileNotAir,
      inventory.synchronousUnitsMobile,
      inventory.revenantsUnitsMobile,
      clusterUnitsNotStructure,
    ];
    _.forEach(factionUnitsNoAir, function (faction, i) {
      if (_.isUndefined(factionsTechNoAir[i][6])) {
        factionsTechNoAir[i][6] = [];
      }
      factionsTechNoAir[i][6] = factionsTechNoAir[i][6].concat(
        _.flatten(
          _.map(faction, function (unit) {
            return speedBoost(unit);
          })
        )
      );
    });
  };

  var setupCommanderEngineCombatTech = function () {
    var clusterCommanders = inventory.commanderUnits.concat(
      inventory.clusterCommanders
    );
    var factionCommanders = [
      inventory.commanderUnits, // Legonis Machina
      inventory.commanderUnits, // Foundation
      inventory.commanderUnits, // Synchronous
      inventory.commanderUnits, // Revenants
      clusterCommanders,
    ];
    _.forEach(factionCommanders, function (faction, i) {
      factionsTech[i][6] = factionsTech[i][6].concat(
        _.flatten(
          _.map(faction, function (unit) {
            return [
              {
                file: unit,
                path: "navigation.move_speed",
                op: "multiply",
                value: 3,
              },
              {
                file: unit,
                path: "navigation.brake",
                op: "multiply",
                value: 3,
              },
              {
                file: unit,
                path: "navigation.acceleration",
                op: "multiply",
                value: 3,
              },
              {
                file: unit,
                path: "navigation.turn_speed",
                op: "multiply",
                value: 3,
              },
            ];
          })
        )
      );
    });
  };

  var setupAmmunitionAndArmourCombatTech = function () {
    _.forEach(factionsTech, function (faction) {
      faction[6] = faction[6].concat(faction[1], faction[2]);
    });
  };

  var setupAITech6CombatTech = function () {
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
