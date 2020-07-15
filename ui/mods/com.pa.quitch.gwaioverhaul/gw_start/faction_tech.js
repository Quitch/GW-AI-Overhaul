define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/inventory.js",
], function (inventory) {
  var legonisCost = [];
  var modUnitlegonisCost = function (unit) {
    legonisCost.push({
      file: unit,
      path: "build_metal_cost",
      op: "multiply",
      value: 0.75,
    });
  };
  _.forEach(inventory.legonisUnits, modUnitlegonisCost);
  var legonisDamage = [];
  var modUnitlegonisDamage = function (ammo) {
    legonisDamage.push(
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
      }
    );
  };
  _.forEach(inventory.legonisAmmo, modUnitlegonisDamage);
  var legonisHealth = [];
  var modUnitlegonisHealth = function (unit) {
    legonisHealth.push({
      file: unit,
      path: "max_health",
      op: "multiply",
      value: 1.5,
    });
  };
  _.forEach(inventory.legonisUnits, modUnitlegonisHealth);
  var legonisSpeed = [];
  var modUnitlegonisSpeed = function (unit) {
    legonisSpeed.push(
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
      }
    );
  };
  _.forEach(inventory.legonisUnits, modUnitlegonisSpeed);
  var foundationCost = [];
  var modUnitFoundationCost = function (unit) {
    foundationCost.push({
      file: unit,
      path: "build_metal_cost",
      op: "multiply",
      value: 0.75,
    });
  };
  _.forEach(inventory.foundationUnits, modUnitFoundationCost);
  var foundationDamage = [];
  var modUnitFoundationDamage = function (ammo) {
    foundationDamage.push(
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
      }
    );
  };
  _.forEach(inventory.foundationAmmo, modUnitFoundationDamage);
  var foundationHealth = [];
  var modUnitFoundationHealth = function (unit) {
    foundationHealth.push({
      file: unit,
      path: "max_health",
      op: "multiply",
      value: 1.5,
    });
  };
  _.forEach(inventory.foundationUnits, modUnitFoundationHealth);
  var foundationSpeed = [];
  var modUnitFoundationSpeed = function (unit) {
    foundationSpeed.push(
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
      }
    );
  };
  _.forEach(inventory.foundationUnits, modUnitFoundationSpeed);
  var synchronousCost = [];
  var modUnitsynchronousCost = function (unit) {
    synchronousCost.push({
      file: unit,
      path: "build_metal_cost",
      op: "multiply",
      value: 0.5,
    });
  };
  _.forEach(inventory.synchronousUnits, modUnitsynchronousCost);
  var synchronousDamage = [];
  var modUnitsynchronousDamage = function (ammo) {
    synchronousDamage.push(
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
      }
    );
  };
  _.forEach(inventory.synchronousAmmo, modUnitsynchronousDamage);
  var synchronousHealth = [];
  var modUnitsynchronousHealth = function (unit) {
    synchronousHealth.push({
      file: unit,
      path: "max_health",
      op: "multiply",
      value: 1.5,
    });
  };
  _.forEach(inventory.synchronousUnits, modUnitsynchronousHealth);
  var synchronousSpeed = [];
  var modUnitsynchronousSpeed = function (unit) {
    synchronousSpeed.push(
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
      }
    );
  };
  _.forEach(inventory.synchronousUnits, modUnitsynchronousSpeed);
  var revenantsCost = [];
  var modUnitrevenantsCost = function (unit) {
    revenantsCost.push({
      file: unit,
      path: "build_metal_cost",
      op: "multiply",
      value: 0.75,
    });
  };
  _.forEach(inventory.revenantsUnits, modUnitrevenantsCost);
  var revenantsDamage = [];
  var modUnitrevenantsDamage = function (ammo) {
    revenantsDamage.push(
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
      }
    );
  };
  _.forEach(inventory.revenantsAmmo, modUnitrevenantsDamage);
  var revenantsHealth = [];
  var modUnitrevenantsHealth = function (unit) {
    revenantsHealth.push({
      file: unit,
      path: "max_health",
      op: "multiply",
      value: 1.5,
    });
  };
  _.forEach(inventory.revenantsUnits, modUnitrevenantsHealth);
  var revenantsSpeed = [];
  var modUnitrevenantsSpeed = function (unit) {
    revenantsSpeed.push(
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
      }
    );
  };
  _.forEach(inventory.revenantsUnits, modUnitrevenantsSpeed);

  var legonisBuffs = [legonisCost, legonisDamage, legonisHealth, legonisSpeed];
  var foundationBuffs = [
    foundationCost,
    foundationDamage,
    foundationHealth,
    foundationSpeed,
  ];
  var synchronousBuffs = [
    synchronousCost,
    synchronousDamage,
    synchronousHealth,
    synchronousSpeed,
  ];
  var revenantsBuffs = [
    revenantsCost,
    revenantsDamage,
    revenantsHealth,
    revenantsSpeed,
  ];

  return {
    buffs: [legonisBuffs, foundationBuffs, synchronousBuffs, revenantsBuffs],
  };
});
