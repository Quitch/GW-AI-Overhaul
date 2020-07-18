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

  var legonisTech = [];
  var foundationTech = [];
  var synchronousTech = [];
  var revenantsTech = [];
  var factions = [legonisTech, foundationTech, synchronousTech, revenantsTech];
  var factionsAir = [foundationTech];
  var factionsNoAir = [legonisTech, synchronousTech, revenantsTech];
  var factionUnits = [
    inventory.legonisUnits,
    inventory.foundationUnits,
    inventory.synchronousUnits,
    inventory.revenantsUnits,
  ];
  var factionUnitsAir = [inventory.foundationUnits];
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

  factionUnits.forEach(function (faction, i) {
    factions[i][0] = faction.map(function (unit) {
      return {
        file: unit,
        path: "build_metal_cost",
        op: "multiply",
        value: "0.75",
      };
    });
  });
  console.debug("Cost", factions[0][0]);

  factionAmmo.forEach(function (faction, i) {
    factions[i][1] = faction.map(function (ammo) {
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
  console.debug("Damage", factions[0][1]);

  factionUnits.forEach(function (faction, i) {
    factions[i][2] = faction.map(function (unit) {
      return {
        file: unit,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      };
    });
  });
  console.debug("Health", factions[0][2]);

  factionUnitsAir.forEach(function (faction, i) {
    factionsAir[i][3] = faction.map(function (unit) {
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
  });
  console.debug("Speed Air", factionsAir[0][3]);

  factionUnitsNoAir.forEach(function (faction, i) {
    factionsNoAir[i][3] = faction.map(function (unit) {
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
  console.debug("Speed No Air", factionsNoAir[0][3]);

  factionBuildArms.forEach(function (faction, i) {
    factions[i][4] = faction.map(function (unit) {
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
  console.debug("Build", factions[0][4]);

  return {
    tougherCommander: [commanderArmourTech, commanderCombatTech],
    factionTechs: [legonisTech, foundationTech, synchronousTech, revenantsTech],
  };
});
