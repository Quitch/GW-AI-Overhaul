define([
  "coui://ui/mods/com.pa.quitch.gwaioverhaul/shared/functions.js",
], function (gwaioFunctions) {
  return {
    visible: _.constant(true),
    describe: _.constant(
      "!LOC:Vehicle Factory Upgrade Tech enables the building of advanced units by basic vehicle manufacturing."
    ),
    summarize: _.constant("!LOC:Vehicle Factory Upgrade Tech"),
    icon: _.constant(
      "coui://ui/mods/com.pa.quitch.gwaioverhaul/gw_play/img/tech/gwc_vehicle_factory_upgrade.png"
    ),
    audio: function () {
      return {
        found: "/VO/Computer/gw/board_tech_available_vehicle",
      };
    },
    getContext: function (galaxy) {
      return {
        totalSize: galaxy.stars().length,
      };
    },
    deal: function (system, context, inventory) {
      var chance = 0;
      if (
        gwaioFunctions.hasUnit(
          "/pa/units/land/vehicle_factory/vehicle_factory.json"
        ) &&
        !inventory.hasCard("gwaio_start_rapid")
      )
        chance = 60;

      return { chance: chance };
    },
    buff: function (inventory) {
      inventory.addMods([
        {
          file: "/pa/units/land/vehicle_factory/vehicle_factory.json",
          path: "buildable_types",
          op: "add",
          value: " | (Tank & Mobile & FactoryBuild)",
        },
      ]);

      inventory.addAIMods([
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedVehicleFabber",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "new",
          toBuild: "AdvancedVehicleFabber",
          idToMod: "", // add to every test array
          value: {
            test_type: "HaveEcoForAdvanced",
            boolean: true,
          },
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedLaserTank",
          idToMod: "builders",
          value: "BasicVehicleFactory",
          refId: "priority", // avoid modifying Leveler upgrade
          refValue: 199,
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedArmorTank",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "AdvancedArtilleryVehicle",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "append",
          toBuild: "FlakTank",
          idToMod: "builders",
          value: "BasicVehicleFactory",
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedLaserTank",
          idToMod: "priority",
          value: 97,
          refId: "priority", // avoid modifying Leveler upgrade
          refValue: 199,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedArmorTank",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "AdvancedArtilleryVehicle",
          idToMod: "priority",
          value: 97,
        },
        {
          type: "factory",
          op: "replace",
          toBuild: "FlakTank",
          idToMod: "priority",
          value: 97,
        },
      ]);
    },
    dull: function () {},
  };
});
