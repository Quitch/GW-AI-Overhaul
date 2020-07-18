define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/inventory.js",
], function (inventory) {
  // Tougher Commanders
  var commanderArmourTech = [];
  var modAIUnit = function (unit) {
    commanderArmourTech.push({
      file: unit,
      path: "max_health",
      op: "multiply",
      value: 2,
    });
  };
  _.forEach(inventory.commanderUnits, modAIUnit);

  var commanderCombatTech = [];
  var modBossUnit = function (unit) {
    commanderCombatTech.push(
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
      }
    );
  };
  _.forEach(inventory.commanderUnits, modBossUnit);
  var modBossAmmo = function (ammo) {
    commanderCombatTech.push(
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
  _.forEach(inventory.commanderAmmos, modBossAmmo);

  // Faction Tech

  var factionUnits = [
    inventory.legonisUnits,
    inventory.foundationUnits,
    inventory.synchronousUnits,
    inventory.revenantsUnits,
  ];
  var factionUnitsNoAir = [
    inventory.legonisUnits,
    inventory.synchronousUnits,
    inventory.revenantsUnits,
  ];
  var factionAmmo = [
    inventory.legonisAmmo,
    inventory.foundationAmmo,
    inventory.synchronousAmmo,
    inventory.revenantsAmmo,
  ];
  var factionBuildArms = [
    inventory.legonisBuildArms,
    inventory.foundationBuildArms,
    inventory.synchronousBuildArms,
    inventory.revenantsBuildArms,
  ];

  var buildTech = [];
  factionBuildArms.forEach(function (faction, i) {
    costTech[i] = faction.map(function (unit) {
      return (
        {
          file: unit,
          path: "construction_demand.energy",
          op: "multiply",
          value: 0.5,
        },
        {
          file: unit,
          path: "construction_demand.metal",
          op: "multiply",
          value: 1.5,
        }
      );
    });
  });

  var costTech = [];
  factionUnits.forEach(function (faction, i) {
    costTech[i] = faction.map(function (unit) {
      return {
        file: unit,
        path: "build_metal_cost",
        op: "multiply",
        value: "0.75",
      };
    });
  });

  var damageTech = [];
  factionAmmo.forEach(function (faction, i) {
    damageTech[i] = faction.map(function (ammo) {
      return (
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
    });
  });

  var healthTech = [];
  factionUnits.forEach(function (faction, i) {
    healthTech[i] = faction.map(function (unit) {
      return {
        file: unit,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      };
    });
  });

  var speedTechNoAir = [];
  factionUnitsNoAir.forEach(function (faction, i) {
    speedTechNoAir[i] = faction.map(function (unit) {
      return (
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
    });
  });
  var speedTechAir = inventory.foundationUnits.map(function (unit) {
    return (
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
  });

  var legonisTech = [
    costTech[0],
    damageTech[0],
    healthTech[0],
    speedTechNoAir[0],
    buildTech[0],
  ];
  var foundationTech = [
    costTech[1],
    damageTech[1],
    healthTech[1],
    speedTechAir,
    buildTech[1],
  ];
  var synchronousTech = [
    costTech[2],
    damageTech[2],
    healthTech[2],
    speedTechNoAir[1],
    buildTech[2],
  ];
  var revenantsTech = [
    costTech[3],
    damageTech[3],
    healthTech[3],
    speedTechNoAir[2],
    buildTech[3],
  ];

  return {
    tougherCommander: [commanderArmourTech, commanderCombatTech],
    factionTechs: [legonisTech, foundationTech, synchronousTech, revenantsTech],
  };
});
