define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/inventory.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (inventory, gwoUnit) {
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

  // 2 - Armour Tech
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

  // 3 - Engine Tech
  var moveSpeed = "navigation.move_speed";
  var brake = "navigation.brake";
  var acceleration = "navigation.acceleration";
  var turnSpeed = "navigation.turn_speed";

  var airSpeedBoost = function (unit) {
    return [
      {
        file: unit,
        path: moveSpeed,
        op: "multiply",
        value: 1.25,
      },
      {
        file: unit,
        path: brake,
        op: "multiply",
        value: 1.25,
      },
      {
        file: unit,
        path: acceleration,
        op: "multiply",
        value: 1.25,
      },
      {
        file: unit,
        path: turnSpeed,
        op: "multiply",
        value: 1.25,
      },
    ];
  };

  foundationTech[3] = _.flatten(
    _.map(inventory.foundationUnitsMobileAir, function (unit) {
      return airSpeedBoost(unit);
    })
  );

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

  var speedBoost = function (unit) {
    return [
      {
        file: unit,
        path: moveSpeed,
        op: "multiply",
        value: 1.5,
      },
      {
        file: unit,
        path: brake,
        op: "multiply",
        value: 1.5,
      },
      {
        file: unit,
        path: acceleration,
        op: "multiply",
        value: 1.5,
      },
      {
        file: unit,
        path: turnSpeed,
        op: "multiply",
        value: 1.5,
      },
    ];
  };

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

  _.forEach(factionCommanders, function (faction, i) {
    factionsTech[i][3] = factionsTech[i][3].concat(
      _.flatten(
        _.map(faction, function (unit) {
          return [
            {
              file: unit,
              path: moveSpeed,
              op: "multiply",
              value: 2,
            },
            {
              file: unit,
              path: brake,
              op: "multiply",
              value: 2,
            },
            {
              file: unit,
              path: acceleration,
              op: "multiply",
              value: 2,
            },
            {
              file: unit,
              path: turnSpeed,
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

  // 6 - Combat Tech
  // we redo the speed tech because Combat Commander Tech uses different values
  foundationTech[6] = _.flatten(
    _.map(inventory.foundationUnitsMobileAir, function (unit) {
      return airSpeedBoost(unit);
    })
  );

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

  _.forEach(factionCommanders, function (faction, i) {
    factionsTech[i][6] = factionsTech[i][6].concat(
      _.flatten(
        _.map(faction, function (unit) {
          return [
            {
              file: unit,
              path: moveSpeed,
              op: "multiply",
              value: 3,
            },
            {
              file: unit,
              path: brake,
              op: "multiply",
              value: 3,
            },
            {
              file: unit,
              path: acceleration,
              op: "multiply",
              value: 3,
            },
            {
              file: unit,
              path: turnSpeed,
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
      file: gwoUnit.colonel,
      path: "tools.0.spec_id",
      op: "replace",
      value: gwoUnit.commanderBuildArm,
    },
    {
      file: gwoUnit.colonel,
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
      file: gwoUnit.angel,
      path: "buildable_types",
      op: "replace",
      value: "CmdBuild",
    },
    {
      file: gwoUnit.angel,
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
      file: gwoUnit.angel,
      path: "max_health",
      op: "multiply",
      value: 5,
    },
    {
      file: gwoUnit.angel,
      path: "tools.1.spec_id",
      op: "replace",
      value: gwoUnit.commanderBuildArm,
    },
    {
      file: gwoUnit.angel,
      path: "transportable.size",
      op: "replace",
      value: 1,
    },
    {
      file: gwoUnit.angel,
      path: "unit_types",
      op: "replace",
      value: [
        "UNITTYPE_Commander",
        "UNITTYPE_Construction",
        "UNITTYPE_Mobile",
        "UNITTYPE_Land", // without this the AI won't work right
        "UNITTYPE_Air",
        "UNITTYPE_NoBuild",
      ],
    },
  ];
  _.forEach(inventory.clusterCommanders, function (commander) {
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
