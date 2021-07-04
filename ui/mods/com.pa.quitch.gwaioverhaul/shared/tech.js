define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_start/inventory.js",
], function (inventory) {
  // Tougher Commanders
  var commanderArmourTech = [];
  inventory.commanderUnits.forEach(function (commander) {
    commanderArmourTech.push({
      file: commander,
      path: "max_health",
      op: "multiply",
      value: 2,
    });
  });

  var clusterCommanderArmourTech = [];
  inventory.clusterCommanders.forEach(function (commander) {
    clusterCommanderArmourTech.push({
      file: commander,
      path: "max_health",
      op: "multiply",
      value: 2,
    });
  });

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

  // 0 - Fabrication Tech
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
  var clusterUnitsNotStructure = inventory.commanderUnits.concat(
    inventory.clusterCommanders
  );
  var factionUnits = [
    legonisUnits,
    foundationUnits,
    synchronousUnits,
    revenantsUnits,
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

  // 1 - Ammunition Tech
  var legonisAmmo = inventory.legonisAmmo.concat(inventory.commanderAmmo);
  var foundationAmmo = inventory.foundationAmmo.concat(inventory.commanderAmmo);
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

  factionWeapons.forEach(function (faction, i) {
    factionsTech[i][1] = factionsTech[i][1].concat(
      _.flatten(
        faction.map(function (weapon) {
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

  // 2 - Armour Tech
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

  factionCommanders.forEach(function (faction, i) {
    factionsTech[i][2] = factionsTech[i][2].concat(
      faction.map(function (unit) {
        return {
          file: unit,
          path: "max_health",
          op: "multiply",
          value: 2,
        };
      })
    );
  });

  // 3 - Engine Tech
  var factionsTechAir = [foundationTech];
  var factionUnitsAir = [inventory.foundationUnitsMobileAir];

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

  var factionsTechNoAir = [
    legonisTech,
    foundationTech,
    synchronousTech,
    revenantsTech,
    clusterTech,
  ];
  var factionUnitsNoAir = [
    inventory.legonisUnitsMobile,
    inventory.foundationUnitsMobileNotAir,
    inventory.synchronousUnitsMobile,
    inventory.revenantsUnitsMobile,
    clusterUnitsNotStructure,
  ];

  factionUnitsNoAir.forEach(function (faction, i) {
    if (_.isUndefined(factionsTechNoAir[i][3])) factionsTechNoAir[i][3] = [];
    factionsTechNoAir[i][3] = factionsTechNoAir[i][3].concat(
      _.flatten(
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
      )
    );
  });

  factionCommanders.forEach(function (faction, i) {
    factionsTech[i][3] = factionsTech[i][3].concat(
      _.flatten(
        faction.map(function (unit) {
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

  // 4 - Efficiency Tech
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

  // 6 - Combat Tech
  // we redo the speed tech because Combat Commander Tech uses different values
  factionUnitsAir.forEach(function (faction, i) {
    factionsTechAir[i][6] = _.flatten(
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
    if (_.isUndefined(factionsTechNoAir[i][6])) factionsTechNoAir[i][6] = [];
    factionsTechNoAir[i][6] = factionsTechNoAir[i][6].concat(
      _.flatten(
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
      )
    );
  });

  factionCommanders.forEach(function (faction, i) {
    factionsTech[i][6] = factionsTech[i][6].concat(
      _.flatten(
        faction.map(function (unit) {
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

  _.forEach(factionsTech, function (faction) {
    faction[6] = faction[6].concat(faction[1], faction[2]);
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
  inventory.clusterCommanders.forEach(function (commander) {
    clusterCommanderTech.push(
      {
        file: commander,
        path: "build_metal_cost",
        op: "replace",
        value: 25000,
      },
      {
        file: commander,
        path: "si_name",
        op: "replace",
        value: "commander",
      },
      {
        file: commander,
        path: "storage.energy",
        op: "replace",
        value: 45000,
      },
      {
        file: commander,
        path: "storage.metal",
        op: "replace",
        value: 1500,
      },
      {
        file: commander,
        path: "strategic_icon_priority",
        op: "replace",
        value: 0,
      },
      {
        file: commander,
        path: "production.energy",
        op: "replace",
        value: 2000,
      },
      {
        file: commander,
        path: "production.metal",
        op: "replace",
        value: 20,
      },
      {
        file: commander,
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
    tougherCommanders: [commanderArmourTech, clusterCommanderArmourTech],
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
