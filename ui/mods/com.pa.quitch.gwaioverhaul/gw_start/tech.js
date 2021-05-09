define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/inventory.js",
], function (inventory) {
  // AI Buffs
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

  var factionUnits = [
    inventory.legonisUnits,
    inventory.foundationUnits,
    inventory.synchronousUnits,
    inventory.revenantsUnits,
    inventory.clusterUnits,
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

  var factionWeapons = [
    inventory.legonisWeapons,
    inventory.foundationWeapons,
    inventory.synchronousWeapons,
    inventory.revenantsWeapons,
    inventory.clusterWeapons,
  ];
  var factionAmmo = [
    inventory.legonisAmmo,
    inventory.foundationAmmo,
    inventory.synchronousAmmo,
    inventory.revenantsAmmo,
    inventory.clusterAmmo,
  ];
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

  var factionsTechAir = [foundationTech, clusterTech];
  var factionsTechNoAir = [
    legonisTech,
    synchronousTech,
    revenantsTech,
    clusterTech,
  ];
  var factionUnitsAir = [inventory.foundationUnits, inventory.clusterUnitsAir];
  var factionUnitsNoAir = [
    inventory.legonisUnits,
    inventory.synchronousUnits,
    inventory.revenantsUnits,
    inventory.clusterUnitsNoAir,
  ];
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

  var factionBuildArms = [
    inventory.legonisBuildArms,
    inventory.foundationBuildArms,
    inventory.synchronousBuildArms,
    inventory.revenantsBuildArms,
    inventory.clusterBuildArms,
  ];
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

  var factionCommanders = [
    inventory.commanderUnits, // Legonis Machina
    inventory.commanderUnits, // Foundation
    inventory.commanderUnits, // Synchronous
    inventory.commanderUnits, // Revenants
    inventory.clusterCommanders,
  ];
  var factionCommanderAmmo = [
    inventory.commanderAmmo, // Legonis Machina
    inventory.commanderAmmo, // Foundation
    inventory.commanderAmmo, // Synchronous
    inventory.commanderAmmo, // Revenants
    inventory.clusterCommanderAmmo,
  ];
  factionCommanders.forEach(function (faction, i) {
    factionsTech[i][5] = _.flatten(
      faction.map(function (commander) {
        return [
          {
            file: commander,
            path: "max_health",
            op: "multiply",
            value: 2,
          },
          {
            file: commander,
            path: "navigation.move_speed",
            op: "multiply",
            value: 3,
          },
          {
            file: commander,
            path: "navigation.brake",
            op: "multiply",
            value: 3,
          },
          {
            file: commander,
            path: "navigation.acceleration",
            op: "multiply",
            value: 3,
          },
          {
            file: commander,
            path: "navigation.turn_speed",
            op: "multiply",
            value: 3,
          },
        ];
      })
    );
  });
  factionCommanderAmmo.forEach(function (faction, i) {
    factionsTech[i][5] = factionsTech[i][5].concat(
      _.flatten(
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
      )
    );
  });

  // Cluster commander setup
  var clusterCommanderTech = [
    {
      file: "/pa/units/land/bot_support_commander/bot_support_commander.json",
      path: "tools.0.spec_id",
      op: "replace",
      value: "/pa/tools/commander_build_arm/commander_build_arm.json",
    },
    {
      file: "/pa/units/land/bot_support_commander/bot_support_commander.json",
      path: "unit_types",
      op: "replace",
      value: [
        "UNITTYPE_Commander",
        "UNITTYPE_Construction",
        "UNITTYPE_Mobile",
        "UNITTYPE_Offense",
        "UNITTYPE_Land",
        "UNITTYPE_NoBuild",
      ],
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
      value: 5,
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "tools.1.spec_id",
      op: "replace",
      value: "/pa/tools/commander_build_arm/commander_build_arm.json",
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "transportable.size",
      op: "replace",
      value: 1,
    },
    {
      file: "/pa/units/air/support_platform/support_platform.json",
      path: "unit_types",
      op: "replace",
      value: [
        "UNITTYPE_Commander",
        "UNITTYPE_Construction",
        "UNITTYPE_Mobile",
        "UNITTYPE_Land", // if you don't have Land then the AI won't work right
        "UNITTYPE_Air",
        "UNITTYPE_NoBuild",
      ],
    },
  ];
  inventory.clusterCommanders.forEach(function (unit) {
    clusterCommanderTech.push(
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
        op: "push",
        value: {
          channel: "sight",
          layer: "celestial",
          radius: 1,
          shape: "sphere",
        },
      }
    );
  });

  return {
    factionTechs: [
      legonisTech,
      foundationTech,
      synchronousTech,
      revenantsTech,
      clusterTech,
    ],
    clusterCommanders: clusterCommanderTech,
  };
});
