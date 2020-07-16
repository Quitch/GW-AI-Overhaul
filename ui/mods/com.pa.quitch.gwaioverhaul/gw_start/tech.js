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

  var armourTech = [];
  factionUnits.forEach(function (faction, i) {
    armourTech[i] = faction.map(function (unit) {
      return {
        file: unit,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      };
    });
  });

  var factionSpeedTechNoAir = [];
  factionUnitsNoAir.forEach(function (faction, i) {
    factionSpeedTechNoAir[i] = faction.map(function (unit) {
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
  var factionSpeedTechAir = inventory.foundationUnits.map(function (unit) {
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
    armourTech[0],
    factionSpeedTechNoAir[0],
  ];
  var foundationTech = [
    costTech[1],
    damageTech[1],
    armourTech[1],
    factionSpeedTechAir,
  ];
  var synchronousTech = [
    costTech[2],
    damageTech[2],
    armourTech[2],
    factionSpeedTechNoAir[1],
  ];
  var revenantsTech = [
    costTech[3],
    damageTech[3],
    armourTech[3],
    factionSpeedTechNoAir[2],
  ];

  return {
    tougherCommander: [commanderArmourTech, commanderCombatTech],
    factionTech: [legonisTech, foundationTech, synchronousTech, revenantsTech],
  };
});
