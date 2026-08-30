define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/ai_inventory.js",
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/units.js",
], function (inventory, gwoUnit) {
  // Every mod here turns one vanilla unit into a commander. That is about the
  // unit, not its kind, so none of them may be re-aimed at a race's units of
  // the same cell (`exact`) - see races.md, "Capability cells".
  var op = function (file, name, path, value) {
    return { file: file, path: path, op: name, value: value, exact: true };
  };

  // One replace per path, in the order given.
  var replace = function (file, props) {
    return _.map(_.keys(props), function (path) {
      return op(file, "replace", path, props[path]);
    });
  };

  // A build arm swapped in by replace needs the tag op after it, or the
  // referee leaves the stock arm on the unit - see specs.md.
  var commanderBuildArm = function (file, path) {
    return [
      op(file, "replace", path, gwoUnit.commanderBuildArm),
      { file: file, path: path, op: "tag", exact: true },
    ];
  };

  var clusterSubCommanderTech = commanderBuildArm(
    gwoUnit.colonel,
    "tools.0.spec_id"
  ).concat(
    op(gwoUnit.colonel, "multiply", "max_health", 1.5625), // match Commander health
    replace(gwoUnit.colonel, {
      buildable_types: "CmdBuild & Custom58",
      unit_types: [
        "UNITTYPE_Custom58",
        "UNITTYPE_Commander",
        "UNITTYPE_Construction",
        "UNITTYPE_Mobile",
        "UNITTYPE_Offense",
        "UNITTYPE_Land",
        "UNITTYPE_Amphibious",
        "UNITTYPE_NoBuild",
      ],
    }),
    replace(gwoUnit.angel, {
      buildable_types: "CmdBuild & Custom58",
      command_caps: [
        "ORDER_Move",
        "ORDER_Patrol",
        "ORDER_Build",
        "ORDER_Reclaim",
        "ORDER_Repair",
        "ORDER_Assist",
        "ORDER_Use",
      ],
    }),
    op(gwoUnit.angel, "multiply", "max_health", 5),
    commanderBuildArm(gwoUnit.angel, "tools.1.spec_id"),
    replace(gwoUnit.angel, {
      "transportable.size": 1,
      unit_types: [
        "UNITTYPE_Commander",
        "UNITTYPE_Construction",
        "UNITTYPE_Mobile",
        "UNITTYPE_Land", // without this the AI won't work right
        "UNITTYPE_Air",
        "UNITTYPE_NoBuild",
        "UNITTYPE_Custom58",
      ],
    })
  );
  _.forEach(inventory.clusterSubCommanders, function (commander) {
    // match with key Commander stats
    clusterSubCommanderTech = clusterSubCommanderTech.concat(
      replace(commander, {
        build_metal_cost: 25000, // because repair/reclaim
        si_name: "commander",
        "storage.energy": 45000,
        "storage.metal": 1500,
        strategic_icon_priority: 0,
        "production.energy": 2000,
        "production.metal": 20,
      }),
      // only required in classic mode - done for safety
      op(commander, "push", "recon.observer.items", {
        channel: "sight",
        layer: "celestial",
        radius: 1,
        shape: "sphere",
      })
    );
  });

  return {
    clusterCommanderMods: clusterSubCommanderTech,
  };
});
