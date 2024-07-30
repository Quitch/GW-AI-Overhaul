define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_inventory.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (inventory, gwoUnit) {
  const clusterCommanderTech = [
    {
      file: gwoUnit.colonel,
      path: "tools.0.spec_id",
      op: "replace",
      value: gwoUnit.commanderBuildArm,
    },
    {
      file: gwoUnit.colonel,
      path: "max_health",
      op: "multiply",
      value: 1.5625, // match Commander health
    },
    {
      file: gwoUnit.colonel,
      path: "buildable_types",
      op: "replace",
      value: "CmdBuild & Custom58",
    },
    {
      file: gwoUnit.colonel,
      path: "unit_types",
      op: "replace",
      value: [
        "UNITTYPE_Custom58",
        "UNITTYPE_Commander",
        "UNITTYPE_Construction",
        "UNITTYPE_Mobile",
        "UNITTYPE_Offense",
        "UNITTYPE_Land",
        "UNITTYPE_Amphibious",
        "UNITTYPE_NoBuild",
      ],
    },
    {
      file: gwoUnit.angel,
      path: "buildable_types",
      op: "replace",
      value: "CmdBuild & Custom58",
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
        "UNITTYPE_Custom58",
      ],
    },
  ];
  _.forEach(inventory.clusterCommanders, function (commander) {
    // match with key Commander stats
    clusterCommanderTech.push(
      {
        file: commander,
        path: "build_metal_cost",
        op: "replace",
        value: 25000, // because repair/reclaim
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
      // only required in classic mode - done for safety
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
    clusterCommanders: clusterCommanderTech,
  };
});
