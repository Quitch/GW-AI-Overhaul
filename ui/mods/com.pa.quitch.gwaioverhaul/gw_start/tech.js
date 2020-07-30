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
  _.forEach(inventory.commanderAmmo, modBossAmmo);

  // AI Buffs
  var legonisTech = [];
  var foundationTech = [];
  var synchronousTech = [];
  var revenantsTech = [];

  var factionsTech = [
    legonisTech,
    foundationTech,
    synchronousTech,
    revenantsTech,
  ];
  var factionsTechAir = [foundationTech];
  var factionsTechNoAir = [legonisTech, synchronousTech, revenantsTech];

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
  var factionWeapons = [
    inventory.legonisWeapons,
    inventory.foundationWeapons,
    inventory.synchronousWeapons,
    inventory.revenantsWeapons,
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
    factionsTech[i][0] = faction.map(function (unit) {
      return {
        file: unit,
        path: "build_metal_cost",
        op: "multiply",
        value: "0.75",
      };
    });
  });

  factionAmmo.forEach(function (faction, i) {
    factionsTech[i][1] = _.flatten(
      faction.map(function (ammo) {
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

  factionWeapons.forEach(function (faction, i) {
    factionsTech[i][1] = factionsTech[i][1].concat(
      _.flatten(
        faction.map(function (weapon) {
          return [
            {
              file: weapon,
              path: "ammo_capacity",
              op: "multiply",
              value: 0.1,
            },
            {
              file: weapon,
              path: "ammo_demand",
              op: "multiply",
              value: 0.1,
            },
            {
              file: weapon,
              path: "ammo_per_shot",
              op: "multiply",
              value: 0.1,
            },
          ];
        })
      )
    );
  });

  factionUnits.forEach(function (faction, i) {
    factionsTech[i][2] = faction.map(function (unit) {
      return {
        file: unit,
        path: "max_health",
        op: "multiply",
        value: 1.5,
      };
    });
  });

  factionUnitsAir.forEach(function (faction, i) {
    factionsTechAir[i][3] = _.flatten(
      faction.map(function (unit) {
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
      })
    );
  });

  factionUnitsNoAir.forEach(function (faction, i) {
    factionsTechNoAir[i][3] = _.flatten(
      faction.map(function (unit) {
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
      })
    );
  });

  factionBuildArms.forEach(function (faction, i) {
    factionsTech[i][4] = _.flatten(
      faction.map(function (buildArm) {
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

  // Faction setup
  var hiveTech = [
    {
      file: "/pa/units/land/bot_support_commander/bot_support_commander.json",
      path: "tools.0.spec_id",
      op: "replace",
      value: "/pa/tools/commander_build_arm/commander_build_arm.json",
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "buildable_types",
      op: "replace",
      value: "CmdBuild",
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "command_caps",
      op: "replace",
      value: [
        "ORDER_Move",
        "ORDER_Patrol",
        "ORDER_Build",
        "ORDER_Attack",
        "ORDER_Reclaim",
        "ORDER_Repair",
        "ORDER_Assist",
        "ORDER_Use",
      ],
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "max_health",
      op: "multiply",
      value: 10,
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "tools.1",
      op: "replace",
      value: {
        spec_id: "/pa/tools/commander_build_arm/commander_build_arm.json",
        record_index: 2,
        muzzle_bone: "socket_muzzle02",
        aim_bone: "bone_root",
      },
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "transportable.size",
      op: "replace",
      value: 1,
    },
  ];
  inventory.hiveCommanders.forEach(function (unit) {
    hiveTech.push(
      {
        file: unit,
        path: "build_metal_cost",
        op: "replace",
        value: 25000,
      },
      {
        file: unit,
        path: "si_name",
        op: "replace",
        value: "commander",
      },
      {
        file: unit,
        path: "storage.energy",
        op: "replace",
        value: 45000,
      },
      {
        file: unit,
        path: "storage.metal",
        op: "replace",
        value: 1500,
      },
      {
        file: unit,
        path: "strategic_icon_priority",
        op: "replace",
        value: 0,
      },
      {
        file: unit,
        path: "production.energy",
        op: "replace",
        value: 2000,
      },
      {
        file: unit,
        path: "production.metal",
        op: "replace",
        value: 20,
      },
      {
        file: unit,
        path: "recon.observer.items",
        op: "replace",
        value: [
          {
            channel: "sight",
            layer: "surface_and_air",
            radius: 150,
            shape: "capsule",
          },
          {
            channel: "sight",
            layer: "underwater",
            radius: 150,
            shape: "capsule",
          },
          {
            channel: "sight",
            layer: "celestial",
            radius: 1,
            shape: "sphere",
          },
        ],
      },
      {
        file: unit,
        path: "unit_types",
        op: "replace",
        value: [
          "UNITTYPE_Commander",
          "UNITTYPE_Construction",
          "UNITTYPE_Mobile",
          "UNITTYPE_Offense",
          "UNITTYPE_Land", // if you use Air then the AI won't work right
          "UNITTYPE_NoBuild",
        ],
      }
    );
  });
  hiveTech = _.flatten(hiveTech);

  return {
    tougherCommander: [commanderArmourTech, commanderCombatTech],
    factionTechs: [legonisTech, foundationTech, synchronousTech, revenantsTech],
    hiveCommanders: hiveTech,
  };
});
